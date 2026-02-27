#!/usr/bin/env node

/**
 * PostToolUse hook for Write tool.
 * Detects print() statements in Swift files and warns the developer.
 * print() should not be used in production code; use os_log / Logger instead.
 */

const input = process.argv[2];

try {
  const toolInput = JSON.parse(input);
  const filePath = toolInput.file_path || toolInput.path || '';
  const content = toolInput.content || '';

  // Only check Swift files
  if (!filePath.endsWith('.swift')) {
    process.exit(0);
  }

  // Detect print() statements
  // Exclude: comments (// print...), string literals containing "print"
  const lines = content.split('\n');
  const printViolations = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Skip comment lines
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return;
    }

    // Detect print( or debugPrint( usage
    // Use regex to find print( not inside a string
    const printPattern = /\bprint\s*\(/;
    const debugPrintPattern = /\bdebugPrint\s*\(/;
    const dumpPattern = /\bdump\s*\(/;

    if (printPattern.test(trimmed) || debugPrintPattern.test(trimmed) || dumpPattern.test(trimmed)) {
      printViolations.push({
        line: index + 1,
        content: line.trim(),
      });
    }
  });

  if (printViolations.length === 0) {
    process.exit(0);
  }

  // Output warnings
  console.error('WARNING: print() / debugPrint() / dump() detected in Swift file.');
  console.error(`File: ${filePath}`);
  console.error('');
  console.error('Violations:');
  printViolations.forEach(({ line, content: lineContent }) => {
    console.error(`  Line ${line}: ${lineContent}`);
  });
  console.error('');
  console.error('Please use os_log / Logger instead for production logging:');
  console.error('  import os');
  console.error('  private let logger = Logger(subsystem: "com.example.app", category: "FeatureName")');
  console.error('  logger.debug("Debug message")');
  console.error('  logger.error("Error: \\(error.localizedDescription)")');
  console.error('');
  console.error('If this is intentional debug code, wrap it with #if DEBUG:');
  console.error('  #if DEBUG');
  console.error('  print("Debug info")');
  console.error('  #endif');

  // Allow but with warning (exit 0)
  // Change to exit(2) to block if you want strict enforcement
  process.exit(0);
} catch (error) {
  process.exit(0);
}
