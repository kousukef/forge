#!/usr/bin/env node

/**
 * session-start.js - Lattice Session Start Hook
 *
 * Triggered when a Claude Code session begins.
 * Responsibilities:
 * - Report recent session count
 * - Report learned skills count
 * - Load relevant context based on working directory
 * - Display welcome message with stats
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { execSync } from "node:child_process";

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
import { homedir } from "node:os";
import Database from "better-sqlite3";

const CLAUDE_DIR = process.env.CLAUDE_DIR ?? join(homedir(), ".claude");
const DB_PATH = process.env.LATTICE_DB_PATH ?? join(CLAUDE_DIR, "knowledge", "lattice.db");

/**
 * Get database connection if exists
 */
function getDatabase() {
  if (!existsSync(DB_PATH)) {
    return null;
  }
  const db = new Database(DB_PATH, { readonly: true });
  db.pragma("journal_mode = WAL");
  return db;
}

/**
 * Count recent sessions (last 7 days)
 */
function countRecentSessions(db) {
  if (!db) return 0;

  try {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM checkpoints
      WHERE created_at >= datetime('now', '-7 days')
    `).get();
    return result?.count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Count learned patterns with high confidence
 */
function countLearnedPatterns(db) {
  if (!db) return 0;

  try {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM knowledge_index
      WHERE knowledge_type = 'pattern'
        AND confidence >= 0.7
    `).get();
    return result?.count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Count available skills from filesystem (fallback)
 */
function countSkillsFromFilesystem() {
  const skillsDir = join(CLAUDE_DIR, "skills");
  let count = 0;

  const countInDir = (dir) => {
    if (!existsSync(dir)) return 0;
    let c = 0;
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          c += countInDir(join(dir, entry.name));
        } else if (entry.name.endsWith(".md") || entry.name === "skill.md") {
          c++;
        }
      }
    } catch {
      // Ignore errors
    }
    return c;
  };

  count += countInDir(join(skillsDir, "manual"));
  count += countInDir(join(skillsDir, "evolved"));
  count += countInDir(join(skillsDir, "lattice"));

  return count;
}

/**
 * Count available skills (DB-based with filesystem fallback)
 */
function countSkills(db) {
  if (!db) return countSkillsFromFilesystem();
  try {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM knowledge_index
      WHERE knowledge_type = 'skill'
        AND (confidence IS NULL OR confidence >= 0.5)
    `).get();
    return result?.count ?? countSkillsFromFilesystem();
  } catch {
    return countSkillsFromFilesystem();
  }
}

/**
 * Count pending escalations
 */
function countPendingEscalations(db) {
  if (!db) return 0;

  try {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM knowledge_index
      WHERE knowledge_type = 'escalation'
    `).get();
    return result?.count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Get current project phase if in a project directory
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
 * Get relevant knowledge files based on working directory
 */
function getRelevantKnowledge(cwd) {
  const knowledge = [];
  const indexPath = join(CLAUDE_DIR, "knowledge", "index.yaml");

  if (!existsSync(indexPath)) {
    return knowledge;
  }

  try {
    const content = readFileSync(indexPath, "utf-8");

    // Check for package.json to determine project type
    const packageJsonPath = join(cwd, "package.json");
    if (existsSync(packageJsonPath)) {
      const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      // Dependency-based knowledge loading (framework-aware)
      // Knowledge was previously in domains/ but has been consolidated
    }

    // Always include escalation rules
    knowledge.push("policies/escalation-rules.md");

  } catch {
    // Ignore errors
  }

  return [...new Set(knowledge)]; // Deduplicate
}

/**
 * Get recent checkpoint summary if exists
 */
function getLastCheckpoint(db, projectId) {
  if (!db || !projectId) return null;

  try {
    const result = db.prepare(`
      SELECT summary, current_phase, created_at
      FROM checkpoints
      WHERE project_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(projectId);
    return result ?? null;
  } catch {
    return null;
  }
}

/**
 * Main hook execution
 */
function main() {
  const cwd = process.cwd();
  const projectId = getProjectId(cwd);

  // Open database
  const db = getDatabase();

  // Gather statistics
  const stats = {
    recentSessions: countRecentSessions(db),
    learnedPatterns: countLearnedPatterns(db),
    availableSkills: countSkills(db),
    pendingEscalations: countPendingEscalations(db),
  };

  // Get project-specific info
  const currentPhase = getCurrentPhase(cwd);
  const relevantKnowledge = getRelevantKnowledge(cwd);
  const lastCheckpoint = getLastCheckpoint(db, projectId);

  // Close database
  if (db) {
    db.close();
  }

  // Build output
  const output = {
    event: "session_start",
    timestamp: new Date().toISOString(),
    project: {
      id: projectId,
      path: cwd,
      phase: currentPhase,
    },
    stats,
    relevantKnowledge,
    lastCheckpoint,
  };

  // Output as JSON for structured consumption
  console.log(JSON.stringify(output, null, 2));

  // Also output human-readable summary
  console.log("\n=== Lattice Session Started ===");
  console.log(`Project: ${projectId}`);
  if (currentPhase) {
    console.log(`Phase: ${currentPhase}`);
  }
  console.log(`\nStats (last 7 days):`);
  console.log(`  Sessions: ${stats.recentSessions}`);
  console.log(`  Learned patterns: ${stats.learnedPatterns}`);
  console.log(`  Available skills: ${stats.availableSkills}`);
  if (stats.pendingEscalations > 0) {
    console.log(`  Pending escalations: ${stats.pendingEscalations}`);
  }

  if (relevantKnowledge.length > 0) {
    console.log(`\nSuggested knowledge:`);
    for (const k of relevantKnowledge) {
      console.log(`  - ${k}`);
    }
  }

  if (lastCheckpoint) {
    console.log(`\nLast checkpoint: ${lastCheckpoint.created_at}`);
    if (lastCheckpoint.summary) {
      console.log(`  ${lastCheckpoint.summary}`);
    }
  }

  console.log("================================\n");
}

main();
