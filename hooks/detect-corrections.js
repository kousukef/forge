#!/usr/bin/env node

/**
 * detect-corrections.js - Lattice User Correction Detection Hook
 *
 * Analyzes observations.jsonl to detect implicit user correction patterns.
 * Detects:
 * - Edit retries: Same file edited multiple times in quick succession
 * - Error recovery: ToolError followed by successful same tool use
 * - Repeated commands: Same Bash command executed 3+ times
 *
 * These patterns indicate user corrections that can be learned from.
 */

import {
  existsSync,
  readFileSync,
  appendFileSync,
  mkdirSync,
} from "node:fs";
import { join, dirname, basename } from "node:path";
import { homedir } from "node:os";
import Database from "better-sqlite3";

const CLAUDE_DIR = process.env.CLAUDE_DIR ?? join(homedir(), ".claude");
const OBSERVATIONS_FILE = join(CLAUDE_DIR, "homunculus", "observations.jsonl");
const CORRECTIONS_DIR = join(CLAUDE_DIR, "homunculus", "corrections");
const DB_PATH =
  process.env.LATTICE_DB_PATH ?? join(CLAUDE_DIR, "knowledge", "lattice.db");

// Detection window settings
const EDIT_RETRY_WINDOW_MS = 60000; // 1 minute window for edit retries
const ERROR_RECOVERY_WINDOW_MS = 120000; // 2 minutes for error recovery
const REPEATED_COMMAND_THRESHOLD = 3; // Minimum repetitions to flag
const SESSION_LOOKBACK_MS = 3600000; // Look back 1 hour by default

/**
 * Detection patterns for user corrections
 */
const DETECTION_PATTERNS = {
  /**
   * Edit retry: Same file edited multiple times quickly
   * Indicates user correcting AI's edit
   */
  edit_retry: (obs1, obs2) => {
    if (obs1.tool !== "Edit" || obs2.tool !== "Edit") return false;
    if (obs1.event !== "PostToolUse" || obs2.event !== "PostToolUse") return false;

    const path1 = obs1.args?.file_path ?? obs1.args?.filePath;
    const path2 = obs2.args?.file_path ?? obs2.args?.filePath;

    if (!path1 || !path2 || path1 !== path2) return false;

    const time1 = new Date(obs1.timestamp).getTime();
    const time2 = new Date(obs2.timestamp).getTime();

    return Math.abs(time2 - time1) < EDIT_RETRY_WINDOW_MS;
  },

  /**
   * Error recovery: ToolError followed by successful use of same tool
   * Indicates user showing the correct approach after failure
   */
  error_recovery: (obs1, obs2) => {
    if (obs1.event !== "ToolError") return false;
    if (obs2.event !== "PostToolUse" || obs2.success !== true) return false;
    if (obs1.tool !== obs2.tool) return false;

    const time1 = new Date(obs1.timestamp).getTime();
    const time2 = new Date(obs2.timestamp).getTime();

    return time2 - time1 > 0 && time2 - time1 < ERROR_RECOVERY_WINDOW_MS;
  },

  /**
   * Write after Edit failure: User writes file after failed edit
   * Indicates manual override
   */
  write_override: (obs1, obs2) => {
    if (obs1.tool !== "Edit") return false;
    if (obs2.tool !== "Write") return false;
    if (obs1.success === true) return false;

    const path1 = obs1.args?.file_path ?? obs1.args?.filePath;
    const path2 = obs2.args?.file_path ?? obs2.args?.filePath;

    if (!path1 || !path2 || path1 !== path2) return false;

    const time1 = new Date(obs1.timestamp).getTime();
    const time2 = new Date(obs2.timestamp).getTime();

    return time2 - time1 > 0 && time2 - time1 < EDIT_RETRY_WINDOW_MS;
  },
};

/**
 * Load observations from JSONL file
 */
function loadObservations(since = null) {
  if (!existsSync(OBSERVATIONS_FILE)) {
    return [];
  }

  const content = readFileSync(OBSERVATIONS_FILE, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());
  const observations = [];

  const sinceTime = since
    ? new Date(since).getTime()
    : Date.now() - SESSION_LOOKBACK_MS;

  for (const line of lines) {
    try {
      const obs = JSON.parse(line);
      const obsTime = new Date(obs.timestamp).getTime();
      if (obsTime >= sinceTime) {
        observations.push(obs);
      }
    } catch {
      // Skip malformed lines
    }
  }

  // Sort by timestamp
  observations.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return observations;
}

/**
 * Detect pairwise correction patterns
 */
function detectPairwisePatterns(observations) {
  const corrections = [];

  for (let i = 0; i < observations.length - 1; i++) {
    const obs1 = observations[i];

    for (let j = i + 1; j < Math.min(i + 10, observations.length); j++) {
      const obs2 = observations[j];

      // Check edit retry
      if (DETECTION_PATTERNS.edit_retry(obs1, obs2)) {
        corrections.push({
          type: "edit_retry",
          original: obs1,
          correction: obs2,
          file_path: obs1.args?.file_path ?? obs1.args?.filePath,
          timestamp: obs2.timestamp,
          context: {
            original_old_string: obs1.args?.old_string?.slice(0, 100),
            correction_old_string: obs2.args?.old_string?.slice(0, 100),
          },
        });
      }

      // Check error recovery
      if (DETECTION_PATTERNS.error_recovery(obs1, obs2)) {
        corrections.push({
          type: "error_recovery",
          original: obs1,
          correction: obs2,
          tool: obs1.tool,
          timestamp: obs2.timestamp,
          context: {
            error: obs1.result?.error ?? obs1.result,
            successful_args: obs2.args,
          },
        });
      }

      // Check write override
      if (DETECTION_PATTERNS.write_override(obs1, obs2)) {
        corrections.push({
          type: "write_override",
          original: obs1,
          correction: obs2,
          file_path: obs1.args?.file_path ?? obs1.args?.filePath,
          timestamp: obs2.timestamp,
          context: {
            failed_edit: obs1.args?.old_string?.slice(0, 100),
          },
        });
      }
    }
  }

  return corrections;
}

/**
 * Detect repeated command patterns
 */
function detectRepeatedCommands(observations) {
  const commandCounts = {};
  const commandDetails = {};

  for (const obs of observations) {
    if (obs.tool !== "Bash" || obs.event !== "PostToolUse") continue;

    const cmd = obs.args?.command;
    if (!cmd) continue;

    // Normalize command (remove timestamps, specific IDs, etc.)
    const normalizedCmd = normalizeCommand(cmd);

    if (!commandCounts[normalizedCmd]) {
      commandCounts[normalizedCmd] = 0;
      commandDetails[normalizedCmd] = [];
    }

    commandCounts[normalizedCmd]++;
    commandDetails[normalizedCmd].push({
      timestamp: obs.timestamp,
      original_command: cmd,
      success: obs.success,
      duration_ms: obs.duration_ms,
    });
  }

  const patterns = [];

  for (const [cmd, count] of Object.entries(commandCounts)) {
    if (count >= REPEATED_COMMAND_THRESHOLD) {
      patterns.push({
        type: "repeated_command",
        command: cmd,
        count,
        executions: commandDetails[cmd],
        timestamp: commandDetails[cmd][commandDetails[cmd].length - 1].timestamp,
        context: {
          first_execution: commandDetails[cmd][0].timestamp,
          last_execution:
            commandDetails[cmd][commandDetails[cmd].length - 1].timestamp,
          success_rate:
            commandDetails[cmd].filter((d) => d.success).length / count,
        },
      });
    }
  }

  return patterns;
}

/**
 * Normalize a command for comparison (remove variable parts)
 */
function normalizeCommand(cmd) {
  return cmd
    .replace(/[0-9a-f]{8,}/gi, "<hash>") // Replace hashes/IDs
    .replace(/\d{10,}/g, "<timestamp>") // Replace timestamps
    .replace(/\/tmp\/[^\s]+/g, "<tmpfile>") // Replace temp files
    .replace(/:[0-9]+/g, ":<port>") // Replace port numbers
    .trim();
}

/**
 * Generate an instinct (pattern) from a correction
 */
function generateInstinctFromCorrection(correction) {
  const instinct = {
    type: "observation",
    scope: "global",
    confidence: 0.6, // Moderate confidence - learned from user correction
    tags: ["auto-detected", "user-correction"],
    context: {
      source: "detect-corrections",
      detection_type: correction.type,
      detected_at: new Date().toISOString(),
    },
  };

  switch (correction.type) {
    case "edit_retry":
      instinct.summary = `Edit pattern: Retry needed for ${basename(correction.file_path || "file")}`;
      instinct.trigger = `Editing ${correction.file_path || "file"} with similar pattern`;
      instinct.action = `Consider the corrected approach used in the retry`;
      instinct.category = "code-editing";
      instinct.detail = `Original edit was retried, suggesting the first approach was incorrect. ` +
        `The correction may indicate a better pattern for similar edits.`;
      break;

    case "error_recovery":
      instinct.summary = `Error recovery: ${correction.tool} usage pattern`;
      instinct.trigger = `Using ${correction.tool} in similar context`;
      instinct.action = `Apply the successful approach that resolved the error`;
      instinct.category = "error-handling";
      instinct.detail = `Tool ${correction.tool} failed initially but succeeded with modified approach. ` +
        `Error: ${JSON.stringify(correction.context?.error)?.slice(0, 200)}`;
      instinct.confidence = 0.7; // Higher confidence - explicit error resolution
      break;

    case "write_override":
      instinct.summary = `Override pattern: Manual write after Edit failure`;
      instinct.trigger = `Edit failing on ${correction.file_path || "file"}`;
      instinct.action = `Consider using Write tool directly when Edit encounters issues`;
      instinct.category = "code-editing";
      instinct.detail = `Edit operation failed and was overridden with Write. ` +
        `This may indicate the edit pattern was too complex or the file state unexpected.`;
      break;

    case "repeated_command":
      instinct.summary = `Repeated command: ${correction.command.slice(0, 50)}`;
      instinct.trigger = `Similar workflow requiring this command`;
      instinct.action = `This command is frequently used - consider it standard practice`;
      instinct.category = "workflow";
      instinct.detail = `Command executed ${correction.count} times with ` +
        `${Math.round(correction.context.success_rate * 100)}% success rate. ` +
        `May indicate a common workflow pattern worth automating or documenting.`;
      instinct.confidence = 0.5 + Math.min(0.3, correction.count * 0.05); // Scale by count
      break;

    default:
      instinct.summary = `Detected correction pattern: ${correction.type}`;
      instinct.category = "general";
  }

  return instinct;
}

/**
 * Get database connection
 */
function getDatabase() {
  if (!existsSync(DB_PATH)) {
    return null;
  }
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  return db;
}

/**
 * Generate unique ID for correction
 */
function generateCorrectionId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `corr-${timestamp}-${random}`;
}

/**
 * Save correction to file for analysis
 */
function saveCorrection(correction) {
  if (!existsSync(CORRECTIONS_DIR)) {
    mkdirSync(CORRECTIONS_DIR, { recursive: true });
  }

  const correctionWithId = {
    id: generateCorrectionId(),
    ...correction,
    detected_at: new Date().toISOString(),
  };

  const outputFile = join(CORRECTIONS_DIR, "corrections.jsonl");
  appendFileSync(outputFile, JSON.stringify(correctionWithId) + "\n", "utf-8");

  return correctionWithId.id;
}

/**
 * Log instinct to the knowledge base using the MCP pattern format
 */
function logInstinctToDatabase(db, instinct) {
  if (!db) return null;

  try {
    const id = `pat-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    db.prepare(
      `
      INSERT INTO patterns (
        id, project_id, scope, category, summary, detail,
        trigger_condition, recommended_action, context,
        confidence, evidence_count, distilled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      id,
      instinct.project_id ?? null,
      instinct.scope ?? "global",
      instinct.category ?? "general",
      instinct.summary,
      instinct.detail ?? null,
      instinct.trigger ?? null,
      instinct.action ?? null,
      JSON.stringify(instinct.context ?? {}),
      instinct.confidence ?? 0.6,
      1,
      0
    );

    return id;
  } catch (e) {
    console.error("Failed to log instinct:", e.message);
    return null;
  }
}

/**
 * Check if a similar instinct already exists
 */
function isDuplicateInstinct(db, instinct) {
  if (!db) return false;

  try {
    const existing = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM patterns
      WHERE summary = ?
        OR (category = ? AND trigger_condition = ?)
    `
      )
      .get(instinct.summary, instinct.category, instinct.trigger);

    return existing.count > 0;
  } catch {
    return false;
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    since: null,
    sessionId: null,
    dryRun: false,
    verbose: false,
    outputJson: false,
    createInstincts: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--since" && args[i + 1]) {
      options.since = args[++i];
    } else if (arg === "--session" && args[i + 1]) {
      options.sessionId = args[++i];
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--json") {
      options.outputJson = true;
    } else if (arg === "--no-instincts") {
      options.createInstincts = false;
    }
  }

  return options;
}

/**
 * Main execution
 */
function main() {
  const options = parseArgs();

  // Load observations
  const observations = loadObservations(options.since);

  if (observations.length === 0) {
    const output = {
      event: "detect_corrections",
      timestamp: new Date().toISOString(),
      status: "no_observations",
      message: "No observations found in the specified time range",
    };

    if (options.outputJson) {
      console.log(JSON.stringify(output, null, 2));
    } else {
      console.log("No observations found to analyze.");
    }
    return;
  }

  // Detect correction patterns
  const pairwiseCorrections = detectPairwisePatterns(observations);
  const repeatedCommands = detectRepeatedCommands(observations);

  const allCorrections = [...pairwiseCorrections, ...repeatedCommands];

  // Open database for instinct creation
  const db = options.createInstincts && !options.dryRun ? getDatabase() : null;

  // Process corrections and generate instincts
  const results = [];

  for (const correction of allCorrections) {
    const correctionId = options.dryRun ? null : saveCorrection(correction);
    const instinct = generateInstinctFromCorrection(correction);

    let instinctId = null;

    if (options.createInstincts && !options.dryRun && db) {
      if (!isDuplicateInstinct(db, instinct)) {
        instinctId = logInstinctToDatabase(db, instinct);
      }
    }

    results.push({
      correction_id: correctionId,
      type: correction.type,
      timestamp: correction.timestamp,
      instinct_created: instinctId !== null,
      instinct_id: instinctId,
      instinct_summary: instinct.summary,
    });
  }

  // Close database
  if (db) {
    db.close();
  }

  // Build output
  const output = {
    event: "detect_corrections",
    timestamp: new Date().toISOString(),
    observations_analyzed: observations.length,
    corrections_detected: allCorrections.length,
    by_type: {
      edit_retry: pairwiseCorrections.filter((c) => c.type === "edit_retry")
        .length,
      error_recovery: pairwiseCorrections.filter(
        (c) => c.type === "error_recovery"
      ).length,
      write_override: pairwiseCorrections.filter(
        (c) => c.type === "write_override"
      ).length,
      repeated_command: repeatedCommands.length,
    },
    instincts_created: results.filter((r) => r.instinct_created).length,
    dry_run: options.dryRun,
    results: options.verbose ? results : undefined,
  };

  if (options.outputJson) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // Human-readable output
  console.log("\n=== Lattice Correction Detection ===");
  console.log(`Observations analyzed: ${observations.length}`);
  console.log(`Corrections detected: ${allCorrections.length}`);
  console.log(`\nBy type:`);
  console.log(`  Edit retries: ${output.by_type.edit_retry}`);
  console.log(`  Error recoveries: ${output.by_type.error_recovery}`);
  console.log(`  Write overrides: ${output.by_type.write_override}`);
  console.log(`  Repeated commands: ${output.by_type.repeated_command}`);

  if (!options.dryRun) {
    console.log(`\nInstincts created: ${output.instincts_created}`);
  } else {
    console.log(`\n(Dry run - no instincts created)`);
  }

  if (options.verbose && results.length > 0) {
    console.log(`\nDetails:`);
    for (const r of results.slice(0, 10)) {
      console.log(`  - [${r.type}] ${r.instinct_summary.slice(0, 60)}`);
    }
    if (results.length > 10) {
      console.log(`  ... and ${results.length - 10} more`);
    }
  }

  console.log("====================================\n");
}

// Export for use by other modules
export {
  loadObservations,
  detectPairwisePatterns,
  detectRepeatedCommands,
  generateInstinctFromCorrection,
  DETECTION_PATTERNS,
};

main();
