#!/usr/bin/env node

/**
 * PostToolUse hook for Write tool.
 * Detects console.log/debug in .ts/.tsx files and warns.
 * Excludes test files (__tests__/, *.test.ts, *.test.tsx, *.spec.ts, *.spec.tsx).
 */

const input = process.argv[2];

try {
  const toolInput = JSON.parse(input);
  const filePath = toolInput.file_path || toolInput.path || '';
  const content = toolInput.content || '';

  // Only check TypeScript files
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    process.exit(0);
  }

  // Exclude test files
  const isTestFile =
    filePath.includes('__tests__/') ||
    filePath.endsWith('.test.ts') ||
    filePath.endsWith('.test.tsx') ||
    filePath.endsWith('.spec.ts') ||
    filePath.endsWith('.spec.tsx');

  if (isTestFile) {
    process.exit(0);
  }

  // Detect console.log and console.debug
  const consoleLogPattern = /console\.(log|debug)\s*\(/g;
  const matches = content.match(consoleLogPattern);

  if (matches && matches.length > 0) {
    console.error(`WARNING: console.log/debug detected in ${filePath}`);
    console.error(`Found ${matches.length} occurrence(s): ${matches.join(', ')}`);
    console.error('');
    console.error('Production code should not contain console.log/debug.');
    console.error('Please use a proper logging solution or remove debug logs.');
    console.error('Allowed: console.warn, console.error (for legitimate error reporting)');
    // Allow but with warning (exit 0)
  }

  process.exit(0);
} catch (e) {
  process.exit(0);
}
