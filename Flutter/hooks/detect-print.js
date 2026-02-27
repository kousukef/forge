#!/usr/bin/env node

/**
 * PostToolUse hook for Write tool.
 * Detects print() calls in .dart files (excludes debugPrint and _test.dart).
 */

const input = process.argv[2];

try {
  const toolInput = JSON.parse(input);
  const filePath = toolInput.file_path || '';
  const content = toolInput.content || '';

  // Only check .dart files
  if (!filePath.endsWith('.dart')) {
    process.exit(0);
  }

  // Skip test files
  if (filePath.endsWith('_test.dart')) {
    process.exit(0);
  }

  // Detect print() calls (but not debugPrint)
  // Pattern: print( but not debugPrint(
  const lines = content.split('\n');
  const violations = [];

  lines.forEach((line, index) => {
    // Match print( that is not preceded by 'debug'
    const printPattern = /(?<!debug)(?<!\w)print\s*\(/g;
    if (printPattern.test(line)) {
      // Exclude commented lines
      const trimmed = line.trim();
      if (!trimmed.startsWith('//') && !trimmed.startsWith('*')) {
        violations.push({ lineNumber: index + 1, content: line.trim() });
      }
    }
  });

  if (violations.length === 0) {
    process.exit(0);
  }

  console.error('WARNING: print() detected in .dart file.');
  console.error(`File: ${filePath}`);
  console.error('');
  console.error('Violations found:');
  violations.forEach(({ lineNumber, content }) => {
    console.error(`  Line ${lineNumber}: ${content}`);
  });
  console.error('');
  console.error('Use debugPrint() instead of print() for debug output.');
  console.error('debugPrint() is throttled to avoid dropping logs and is automatically');
  console.error('excluded from release builds when --release flag is used.');
  console.error('');
  console.error('To suppress this warning for intentional print() usage, add:');
  console.error('  // ignore: avoid_print');

  // Allow but with warning (exit 0 = allow, exit 2 = block)
  process.exit(0);
} catch (e) {
  process.exit(0);
}
