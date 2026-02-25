#!/usr/bin/env node

/**
 * task-completed.js - Lattice TaskCompleted Hook
 *
 * Triggered when an Agent Team teammate marks a task as completed.
 * Validates that the task deliverables are present and quality gates pass.
 *
 * Exit codes:
 *   0 - Validation passed, task completion accepted
 *   2 - Validation failed, task completion rejected (feedback on stderr)
 */

import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";
import Database from "better-sqlite3";

const CLAUDE_DIR = process.env.CLAUDE_DIR ?? join(homedir(), ".claude");
const DB_PATH = process.env.LATTICE_DB_PATH ?? join(CLAUDE_DIR, "knowledge", "lattice.db");
const OBSERVATIONS_FILE = join(CLAUDE_DIR, "homunculus", "observations.jsonl");

/**
 * Read current phase from .claude/phase.yaml
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
 * Read stdin as JSON (hook input)
 */
function readStdin() {
  try {
    const input = readFileSync("/dev/stdin", "utf-8").trim();
    if (!input) return {};
    return JSON.parse(input);
  } catch {
    return {};
  }
}

/**
 * Get database connection if exists
 */
function getDatabase() {
  if (!existsSync(DB_PATH)) {
    return null;
  }
  try {
    const db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    return db;
  } catch {
    return null;
  }
}

/**
 * Log task completion to database
 */
function logToDatabase(data) {
  const db = getDatabase();
  if (!db) return;

  try {
    db.prepare(`
      INSERT OR IGNORE INTO knowledge_index (name, knowledge_type, content, confidence, created_at)
      VALUES (?, 'task-completion', ?, 0.8, datetime('now'))
    `).run(
      `task-complete-${data.task_id}-${Date.now()}`,
      JSON.stringify(data)
    );
  } catch {
    // Ignore DB errors — logging is best-effort
  } finally {
    db.close();
  }
}

/**
 * Log observation to observations.jsonl
 */
function logObservation(data) {
  try {
    const entry = {
      event: "task_completed_check",
      timestamp: new Date().toISOString(),
      ...data,
    };
    appendFileSync(OBSERVATIONS_FILE, JSON.stringify(entry) + "\n");
  } catch {
    // Ignore logging errors
  }
}

/**
 * Validate research task completion
 */
function validateResearchTask(cwd, input) {
  const teammateName = input.teammate_name || "unknown";
  const outputFile = join(cwd, "research", `${teammateName}.md`);

  if (!existsSync(outputFile)) {
    return {
      passed: false,
      message: `Task deliverable not found: research/${teammateName}.md`,
    };
  }

  const stat = require("node:fs").statSync(outputFile);
  const mtime = stat.mtimeMs;
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  if (mtime < fiveMinutesAgo) {
    return {
      passed: false,
      message: `research/${teammateName}.md was not recently updated. Ensure your latest findings are written.`,
    };
  }

  return { passed: true, message: "Research task deliverable validated" };
}

/**
 * Validate implement task completion (tests + lint)
 */
function validateImplementTask(cwd) {
  // Run tests
  try {
    execSync("npm test", {
      cwd,
      timeout: 60_000,
      stdio: "pipe",
    });
  } catch (err) {
    const output = ((err.stderr?.toString() || "") + (err.stdout?.toString() || "")).slice(0, 500);
    return {
      passed: false,
      message: `Tests failing — cannot mark task complete.\n${output}`,
    };
  }

  // Run lint (best-effort, don't block on missing lint script)
  try {
    execSync("npm run lint --if-present", {
      cwd,
      timeout: 30_000,
      stdio: "pipe",
    });
  } catch (err) {
    const output = ((err.stderr?.toString() || "") + (err.stdout?.toString() || "")).slice(0, 300);
    return {
      passed: false,
      message: `Lint errors — fix before completing task.\n${output}`,
    };
  }

  return { passed: true, message: "Implementation task validated (tests + lint pass)" };
}

/**
 * Validate integrate task completion
 */
function validateIntegrateTask(cwd) {
  try {
    execSync("npm test", {
      cwd,
      timeout: 120_000,
      stdio: "pipe",
    });
  } catch (err) {
    const output = ((err.stderr?.toString() || "") + (err.stdout?.toString() || "")).slice(0, 500);
    return {
      passed: false,
      message: `Integration tests failing — cannot mark task complete.\n${output}`,
    };
  }

  return { passed: true, message: "Integration task validated" };
}

/**
 * Main hook execution
 */
function main() {
  const cwd = process.cwd();
  const input = readStdin();
  const taskId = input.task_id || "unknown";
  const taskSubject = input.task_subject || "";
  const teammateName = input.teammate_name || "unknown";

  const phase = getCurrentPhase(cwd);

  if (!phase) {
    // No phase file — allow completion (non-Lattice project)
    process.exit(0);
  }

  let result;

  switch (phase) {
    case "research":
      result = validateResearchTask(cwd, input);
      break;
    case "implement":
      result = validateImplementTask(cwd);
      break;
    case "integrate":
      result = validateIntegrateTask(cwd);
      break;
    default:
      result = { passed: true, message: `No completion validation for phase: ${phase}` };
  }

  const logData = {
    phase,
    task_id: taskId,
    task_subject: taskSubject,
    teammate_name: teammateName,
    validation_passed: result.passed,
    message: result.message,
  };

  logObservation(logData);

  if (result.passed) {
    logToDatabase(logData);
  }

  if (!result.passed) {
    process.stderr.write(result.message + "\n");
    process.exit(2);
  }

  process.exit(0);
}

main();
