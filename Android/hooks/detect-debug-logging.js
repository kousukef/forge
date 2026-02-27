#!/usr/bin/env node

/**
 * PostToolUse hook for Write tool.
 * Warns when Log.v or Log.d is found in .kt files.
 * Log.e, Log.w, Log.i are allowed.
 */

const fs = require('fs');
const input = process.argv[2];

try {
  const toolInput = JSON.parse(input);
  const filePath = toolInput.file_path || '';

  // Only check .kt files
  if (!filePath.endsWith('.kt')) {
    process.exit(0);
  }

  // Read the file content
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const debugLogLines = [];
  lines.forEach((line, index) => {
    // Match Log.v or Log.d but not Log.e, Log.w, Log.i
    if (/\bLog\.[vd]\s*\(/.test(line) && !line.trim().startsWith('//')) {
      debugLogLines.push(index + 1);
    }
  });

  if (debugLogLines.length > 0) {
    console.error(`WARNING: Log.v/Log.d detected in ${filePath}`);
    console.error(`Lines: ${debugLogLines.join(', ')}`);
    console.error('Debug/verbose logs should be removed before committing.');
    console.error('Use Log.e/Log.w/Log.i for intentional logging, or Timber for structured logging.');
  }

  // Always exit 0 (warning only, not blocking)
  process.exit(0);
} catch (e) {
  process.exit(0);
}
