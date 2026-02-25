#!/usr/bin/env node

/**
 * pre-compact.js - Lattice Pre-Compaction Hook
 *
 * Triggered before Claude Code compacts context.
 * Responsibilities:
 * - Save checkpoint before context compaction
 * - Log compaction event
 * - Preserve critical context
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  appendFileSync,
} from "node:fs";
import { join, basename, dirname } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";
import Database from "better-sqlite3";

/**
 * Get project ID from Git repository root (worktree-safe).
 * Falls back to basename of cwd if not a Git repo.
 */
function getProjectId(cwd) {
  try {
    const gitRoot = execSync("git rev-parse --show-toplevel", {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return basename(gitRoot);
  } catch {
    return basename(cwd);
  }
}

const CLAUDE_DIR = process.env.CLAUDE_DIR ?? join(homedir(), ".claude");
const DB_PATH =
  process.env.LATTICE_DB_PATH ?? join(CLAUDE_DIR, "knowledge", "lattice.db");
const COMPACTION_LOG = join(CLAUDE_DIR, "logs", "compaction.log");

/**
 * Get database connection if exists
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
 * Generate unique checkpoint ID for compaction
 */
function generateCheckpointId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toISOString().slice(11, 19).replace(/:/g, "");
  return `compact-${date}-${time}`;
}

/**
 * Get current project phase
 */
function getCurrentPhase(cwd) {
  const phaseFile = join(cwd, ".claude", "phase.yaml");
  if (!existsSync(phaseFile)) {
    return null;
  }

  try {
    const content = readFileSync(phaseFile, "utf-8");
    const match = content.match(/phase:\s*["']?(\w+)["']?/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Get critical context that should be preserved
 */
function getCriticalContext(cwd) {
  const critical = {
    decisions: [],
    blockers: [],
    activeTasks: [],
  };

  // Check for pending decisions
  const decisionsDir = join(cwd, "docs", "decisions");
  if (existsSync(decisionsDir)) {
    try {
      const files = readdirSync(decisionsDir);
      for (const file of files.filter((f) => f.endsWith(".md"))) {
        const content = readFileSync(join(decisionsDir, file), "utf-8");
        if (content.includes("Status: pending") || content.includes("status: pending")) {
          critical.decisions.push(file.replace(".md", ""));
        }
      }
    } catch {
      // Ignore errors
    }
  }

  // Check phase.yaml for blockers
  const phaseFile = join(cwd, ".claude", "phase.yaml");
  if (existsSync(phaseFile)) {
    try {
      const content = readFileSync(phaseFile, "utf-8");
      // Extract blockers section
      const blockersMatch = content.match(
        /blockers:\s*\n((?:\s+-.*\n)*)/
      );
      if (blockersMatch) {
        const blockerLines = blockersMatch[1].match(/description:\s*["']?([^"'\n]+)/g);
        if (blockerLines) {
          critical.blockers = blockerLines.map((l) =>
            l.replace(/description:\s*["']?/, "").replace(/["']$/, "")
          );
        }
      }
    } catch {
      // Ignore errors
    }
  }

  // Get status.md active tasks
  const statusFile = join(cwd, "docs", "status.md");
  if (existsSync(statusFile)) {
    try {
      const content = readFileSync(statusFile, "utf-8");
      const taskRegex = /^-\s*\[\s*\]\s+(.+)$/gm;
      let match;
      while ((match = taskRegex.exec(content)) !== null) {
        critical.activeTasks.push(match[1].trim());
      }
    } catch {
      // Ignore errors
    }
  }

  return critical;
}

/**
 * Save pre-compaction checkpoint
 */
function saveCheckpoint(db, checkpoint) {
  if (!db) return false;

  try {
    db.prepare(
      `
      INSERT INTO checkpoints (id, project_id, session_id, summary, current_phase, active_tasks, recent_patterns, context)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      checkpoint.id,
      checkpoint.projectId,
      checkpoint.sessionId,
      checkpoint.summary,
      checkpoint.currentPhase,
      JSON.stringify(checkpoint.activeTasks),
      JSON.stringify([]),
      JSON.stringify(checkpoint.context)
    );
    return true;
  } catch (e) {
    console.error("Failed to save checkpoint:", e.message);
    return false;
  }
}

/**
 * Log compaction event
 */
function logCompaction(entry) {
  // Ensure log directory exists
  const logDir = dirname(COMPACTION_LOG);
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }

  const logLine = JSON.stringify({
    ...entry,
    timestamp: new Date().toISOString(),
  }) + "\n";

  try {
    appendFileSync(COMPACTION_LOG, logLine, "utf-8");
    return true;
  } catch {
    return false;
  }
}

/**
 * Write critical context to recovery file
 */
function writeCriticalContext(cwd, critical) {
  const recoveryDir = join(cwd, ".claude", "recovery");
  if (!existsSync(recoveryDir)) {
    mkdirSync(recoveryDir, { recursive: true });
  }

  const recoveryFile = join(recoveryDir, "pre-compact-context.json");
  try {
    writeFileSync(
      recoveryFile,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          ...critical,
        },
        null,
        2
      ),
      "utf-8"
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Import readdirSync for directory operations
 */
import { readdirSync } from "node:fs";

/**
 * Main hook execution
 */
function main() {
  const cwd = process.cwd();
  const projectId = getProjectId(cwd);

  // Open database
  const db = getDatabase();

  // Gather context
  const currentPhase = getCurrentPhase(cwd);
  const critical = getCriticalContext(cwd);

  // Build summary
  const summaryParts = ["Pre-compaction checkpoint"];
  if (currentPhase) {
    summaryParts.push(`phase: ${currentPhase}`);
  }
  if (critical.blockers.length > 0) {
    summaryParts.push(`${critical.blockers.length} blockers`);
  }
  if (critical.activeTasks.length > 0) {
    summaryParts.push(`${critical.activeTasks.length} active tasks`);
  }

  // Create checkpoint
  const checkpoint = {
    id: generateCheckpointId(),
    projectId,
    sessionId: process.env.LATTICE_SESSION_ID ?? null,
    summary: summaryParts.join(", "),
    currentPhase,
    activeTasks: critical.activeTasks,
    context: {
      type: "pre-compaction",
      cwd,
      blockers: critical.blockers,
      pendingDecisions: critical.decisions,
    },
  };

  // Save checkpoint to database
  const checkpointSaved = saveCheckpoint(db, checkpoint);

  // Write critical context to recovery file
  const contextSaved = writeCriticalContext(cwd, critical);

  // Log the compaction event
  const logged = logCompaction({
    projectId,
    checkpointId: checkpoint.id,
    phase: currentPhase,
    blockerCount: critical.blockers.length,
    activeTaskCount: critical.activeTasks.length,
  });

  // Close database
  if (db) {
    db.close();
  }

  // Build output
  const output = {
    event: "pre_compact",
    timestamp: new Date().toISOString(),
    project: {
      id: projectId,
      path: cwd,
      phase: currentPhase,
    },
    checkpoint: checkpointSaved ? checkpoint.id : null,
    criticalContext: {
      saved: contextSaved,
      blockers: critical.blockers.length,
      pendingDecisions: critical.decisions.length,
      activeTasks: critical.activeTasks.length,
    },
    logged,
  };

  // Output as JSON for structured consumption
  console.log(JSON.stringify(output, null, 2));

  // Human-readable summary
  console.log("\n=== Lattice Pre-Compaction ===");
  console.log(`Project: ${projectId}`);
  if (currentPhase) {
    console.log(`Phase: ${currentPhase}`);
  }
  console.log(`\nCheckpoint: ${checkpointSaved ? checkpoint.id : "FAILED"}`);
  console.log(`Critical context saved: ${contextSaved ? "yes" : "no"}`);

  if (critical.blockers.length > 0) {
    console.log(`\nBlockers to preserve: ${critical.blockers.length}`);
    for (const b of critical.blockers.slice(0, 3)) {
      console.log(`  - ${b}`);
    }
  }

  if (critical.decisions.length > 0) {
    console.log(`\nPending decisions: ${critical.decisions.length}`);
  }

  if (critical.activeTasks.length > 0) {
    console.log(`\nActive tasks: ${critical.activeTasks.length}`);
  }

  console.log("================================\n");
}

main();
