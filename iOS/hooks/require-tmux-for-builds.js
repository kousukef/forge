#!/usr/bin/env node

/**
 * PreToolUse hook for Bash tool.
 * Blocks long-running iOS/Xcode build processes from running outside tmux.
 */

const input = process.argv[2];

try {
  const toolInput = JSON.parse(input);
  const command = toolInput.command || '';

  // Patterns for long-running iOS build processes
  const buildPatterns = [
    /\bxcodebuild\s+archive\b/,
    /\bxcodebuild\s+build\b(?!\s+--)/,
    /\bxcodebuild\s+test\b/,
    /\bxcodebuild\s+-exportArchive\b/,
    /\bxcrun\s+simctl\s+boot\b/,
    /\bfastlane\s+gym\b/,
    /\bfastlane\s+scan\b/,
  ];

  const isBuildCommand = buildPatterns.some(pattern => pattern.test(command));

  if (!isBuildCommand) {
    process.exit(0);
  }

  // Check if already running in tmux or the command uses tmux
  const isTmux = process.env.TMUX !== undefined;
  const usesTmux = /\btmux\b/.test(command);

  if (isTmux || usesTmux) {
    process.exit(0);
  }

  console.error('BLOCKED: Long-running iOS build process detected outside tmux.');
  console.error(`Command: ${command}`);
  console.error('');
  console.error('Please run build processes inside tmux:');
  console.error('  tmux new-session -d -s build "xcodebuild archive -scheme MyApp"');
  console.error('');
  console.error('Or use background execution:');
  console.error('  Run with run_in_background: true');
  process.exit(2);
} catch (e) {
  process.exit(0);
}
