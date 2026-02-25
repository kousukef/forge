#!/usr/bin/env node

/**
 * session-end.js - Lattice Session End Hook
 *
 * Triggered when a Claude Code session ends.
 * Responsibilities:
 * - Detect user correction patterns from observations
 * - Save session state to checkpoint
 * - Push undistilled patterns to distill_queue
 * - Sync important learnings to MEMORY.md
 * - Generate session summary
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
  mkdirSync,
} from "node:fs";
import { join, basename, dirname } from "node:path";
import { homedir } from "node:os";
import { execSync, spawn } from "node:child_process";
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
const MEMORY_PATH = join(CLAUDE_DIR, "projects", "MEMORY.md");
const HOOKS_DIR = dirname(import.meta.url.replace("file://", ""));

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
 * Generate unique checkpoint ID
 */
function generateCheckpointId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toISOString().slice(11, 19).replace(/:/g, "");
  return `checkpoint-${date}-${time}`;
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
 * Get active tasks from status.md if exists
 */
function getActiveTasks(cwd) {
  const statusFile = join(cwd, "docs", "status.md");
  if (!existsSync(statusFile)) {
    return [];
  }

  try {
    const content = readFileSync(statusFile, "utf-8");
    const tasks = [];

    // Match incomplete tasks: - [ ] task description
    const taskRegex = /^-\s*\[\s*\]\s+(.+)$/gm;
    let match;
    while ((match = taskRegex.exec(content)) !== null) {
      tasks.push(match[1].trim());
    }

    return tasks.slice(0, 10); // Limit to 10 tasks
  } catch {
    return [];
  }
}

/**
 * Get recent patterns from this session
 */
function getRecentPatterns(db, projectId, sessionStart) {
  if (!db) return [];

  try {
    const patterns = db
      .prepare(
        `
      SELECT id, summary, confidence
      FROM patterns
      WHERE project_id = ?
        AND created_at >= ?
      ORDER BY created_at DESC
      LIMIT 10
    `
      )
      .all(projectId, sessionStart);
    return patterns;
  } catch {
    return [];
  }
}

/**
 * Save checkpoint to database
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
      JSON.stringify(checkpoint.recentPatterns),
      JSON.stringify(checkpoint.context ?? {})
    );
    return true;
  } catch (e) {
    console.error("Failed to save checkpoint:", e.message);
    return false;
  }
}

/**
 * Push undistilled patterns to distill queue
 */
function pushToDistillQueue(db, projectId) {
  if (!db) return 0;

  try {
    // Find patterns that should be distilled
    const patterns = db
      .prepare(
        `
      SELECT id, category, summary, context
      FROM patterns
      WHERE project_id = ?
        AND distilled = false
        AND confidence >= 0.6
        AND evidence_count >= 2
      ORDER BY confidence DESC
      LIMIT 20
    `
      )
      .all(projectId);

    if (patterns.length === 0) {
      return 0;
    }

    // Insert into distill queue
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO distill_queue (id, source_project, source_pattern_id, category, summary, context, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    for (const p of patterns) {
      const queueId = `distill-${p.id}-${Date.now()}`;
      try {
        insertStmt.run(
          queueId,
          projectId,
          p.id,
          p.category,
          p.summary,
          p.context,
          1
        );
        count++;
      } catch {
        // Ignore duplicates
      }
    }

    return count;
  } catch (e) {
    console.error("Failed to push to distill queue:", e.message);
    return 0;
  }
}

/**
 * Sync important learnings to MEMORY.md
 */
function syncToMemory(projectId, summary, patterns) {
  // Ensure directory exists
  const memoryDir = dirname(MEMORY_PATH);
  if (!existsSync(memoryDir)) {
    mkdirSync(memoryDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  let entry = `\n## Session: ${projectId} (${timestamp.slice(0, 10)})\n\n`;

  if (summary) {
    entry += `**Summary:** ${summary}\n\n`;
  }

  if (patterns && patterns.length > 0) {
    entry += `**Patterns learned:**\n`;
    for (const p of patterns.slice(0, 5)) {
      entry += `- ${p.summary} (confidence: ${p.confidence.toFixed(2)})\n`;
    }
    entry += "\n";
  }

  entry += "---\n";

  try {
    appendFileSync(MEMORY_PATH, entry, "utf-8");
    return true;
  } catch (e) {
    console.error("Failed to sync to MEMORY.md:", e.message);
    return false;
  }
}

/**
 * Generate session summary based on activity
 */
function generateSessionSummary(activeTasks, recentPatterns, phase, corrections) {
  const parts = [];

  if (phase) {
    parts.push(`Phase: ${phase}`);
  }

  if (activeTasks.length > 0) {
    parts.push(`${activeTasks.length} tasks pending`);
  }

  if (recentPatterns.length > 0) {
    parts.push(`${recentPatterns.length} patterns learned`);
  }

  if (corrections && corrections.total > 0) {
    parts.push(`${corrections.total} corrections detected`);
  }

  if (parts.length === 0) {
    return "Session completed";
  }

  return parts.join(", ");
}

/**
 * Run correction detection hook
 * Returns correction detection results
 */
async function runCorrectionDetection(sessionStart) {
  return new Promise((resolve) => {
    const detectCorrectionsPath = join(HOOKS_DIR, "detect-corrections.js");

    if (!existsSync(detectCorrectionsPath)) {
      resolve({ total: 0, instincts_created: 0, error: "hook_not_found" });
      return;
    }

    const args = ["--since", sessionStart, "--json"];
    const child = spawn("node", [detectCorrectionsPath, ...args], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        resolve({ total: 0, instincts_created: 0, error: stderr || `exit_code_${code}` });
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve({
          total: result.corrections_detected ?? 0,
          instincts_created: result.instincts_created ?? 0,
          by_type: result.by_type ?? {},
        });
      } catch {
        resolve({ total: 0, instincts_created: 0, error: "parse_error" });
      }
    });

    child.on("error", (err) => {
      resolve({ total: 0, instincts_created: 0, error: err.message });
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      child.kill();
      resolve({ total: 0, instincts_created: 0, error: "timeout" });
    }, 30000);
  });
}

/**
 * Main hook execution
 */
async function main() {
  const cwd = process.cwd();
  const projectId = getProjectId(cwd);

  // Session start time (approximation - could be passed via env)
  const sessionStart =
    process.env.LATTICE_SESSION_START ?? new Date(Date.now() - 3600000).toISOString();

  // Run correction detection first (async)
  const correctionsResult = await runCorrectionDetection(sessionStart);

  // Open database
  const db = getDatabase();

  // Gather session data
  const currentPhase = getCurrentPhase(cwd);
  const activeTasks = getActiveTasks(cwd);
  const recentPatterns = getRecentPatterns(db, projectId, sessionStart);

  // Generate summary (include corrections)
  const summary = generateSessionSummary(activeTasks, recentPatterns, currentPhase, correctionsResult);

  // Create checkpoint
  const checkpoint = {
    id: generateCheckpointId(),
    projectId,
    sessionId: process.env.LATTICE_SESSION_ID ?? null,
    summary,
    currentPhase,
    activeTasks,
    recentPatterns: recentPatterns.map((p) => ({
      id: p.id,
      summary: p.summary,
    })),
    context: {
      cwd,
      timestamp: new Date().toISOString(),
      corrections: correctionsResult,
    },
  };

  // Save checkpoint
  const checkpointSaved = saveCheckpoint(db, checkpoint);

  // Push to distill queue
  const distillCount = pushToDistillQueue(db, projectId);

  // Sync to MEMORY.md if we have significant learnings
  let memorySynced = false;
  if (recentPatterns.length > 0) {
    memorySynced = syncToMemory(projectId, summary, recentPatterns);
  }

  // Close database
  if (db) {
    db.close();
  }

  // Build output
  const output = {
    event: "session_end",
    timestamp: new Date().toISOString(),
    project: {
      id: projectId,
      path: cwd,
      phase: currentPhase,
    },
    checkpoint: checkpointSaved ? checkpoint.id : null,
    distillQueuedCount: distillCount,
    memorySynced,
    summary,
    corrections: correctionsResult,
  };

  // Output as JSON for structured consumption
  console.log(JSON.stringify(output, null, 2));

  // Human-readable summary
  console.log("\n=== Lattice Session Ended ===");
  console.log(`Project: ${projectId}`);
  if (currentPhase) {
    console.log(`Phase: ${currentPhase}`);
  }
  console.log(`Summary: ${summary}`);
  console.log(`\nActions:`);
  console.log(`  Checkpoint saved: ${checkpointSaved ? "yes" : "no"}`);
  console.log(`  Patterns queued for distillation: ${distillCount}`);
  console.log(`  Memory synced: ${memorySynced ? "yes" : "no"}`);

  // Correction detection results
  if (correctionsResult.total > 0) {
    console.log(`\nCorrections detected: ${correctionsResult.total}`);
    if (correctionsResult.by_type) {
      for (const [type, count] of Object.entries(correctionsResult.by_type)) {
        if (count > 0) {
          console.log(`  - ${type}: ${count}`);
        }
      }
    }
    console.log(`  Instincts created: ${correctionsResult.instincts_created}`);
  } else if (correctionsResult.error) {
    console.log(`\nCorrection detection: skipped (${correctionsResult.error})`);
  }

  if (activeTasks.length > 0) {
    console.log(`\nPending tasks: ${activeTasks.length}`);
    for (const task of activeTasks.slice(0, 3)) {
      console.log(`  - ${task}`);
    }
    if (activeTasks.length > 3) {
      console.log(`  ... and ${activeTasks.length - 3} more`);
    }
  }

  console.log("================================\n");
}

main();
