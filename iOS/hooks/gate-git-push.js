#!/usr/bin/env node

/**
 * PreToolUse hook for Bash tool.
 * Detects git push and prompts for review confirmation.
 * iOS-specific checklist included.
 */

const input = process.argv[2];

try {
  const toolInput = JSON.parse(input);
  const command = toolInput.command || '';

  // Check if the command contains git push
  const isGitPush = /\bgit\s+push\b/.test(command);

  if (!isGitPush) {
    process.exit(0);
  }

  // Check for force push (extra dangerous)
  const isForcePush = /\bgit\s+push\s+.*(-f|--force)\b/.test(command);

  if (isForcePush) {
    console.error('BLOCKED: Force push detected!');
    console.error(`Command: ${command}`);
    console.error('Force pushing can overwrite remote history and cause data loss.');
    console.error('Please confirm with the user before force pushing.');
    process.exit(2);
  }

  // Regular push - warn about review checklist
  console.error('WARNING: git push detected.');
  console.error('Please ensure the following before pushing:');
  console.error('  1. Code review has been completed (/review)');
  console.error('  2. All tests pass (/test)');
  console.error('  3. Build succeeds (swift build)');
  console.error('  4. SwiftLint passes (swiftlint lint)');
  console.error('  5. No print() / debugPrint() in production code');
  console.error('  6. No hardcoded secrets or API keys');
  console.error('  7. ATS settings are correct (Info.plist)');

  // Allow but with warning
  process.exit(0);
} catch (e) {
  process.exit(0);
}
