#!/usr/bin/env node

/**
 * PreToolUse hook for Bash tool.
 * Blocks long-running React Native build processes from running outside tmux.
 */

const input = process.argv[2];

try {
  const toolInput = JSON.parse(input);
  const command = toolInput.command || '';

  // Patterns for long-running React Native build processes
  const buildPatterns = [
    /\bnpx\s+react-native\s+run-android\b/,
    /\bnpx\s+react-native\s+run-ios\b/,
    /\bnpx\s+react-native\s+build-android\b/,
    /\bnpx\s+react-native\s+build-ios\b/,
    /\bxcodebuild\b/,
    /\b\.\/gradlew\s+assembleRelease\b/,
    /\b\.\/gradlew\s+bundleRelease\b/,
    /\bpod\s+install\b/,
    /\bnpx\s+detox\s+build\b/,
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

  console.error('BLOCKED: Long-running React Native build process detected outside tmux.');
  console.error(`Command: ${command}`);
  console.error('');
  console.error('Please run build processes inside tmux:');
  console.error('  tmux new-session -d -s build "npx react-native run-android"');
  console.error('');
  console.error('Or use background execution:');
  console.error('  Run with run_in_background: true');
  process.exit(2);
} catch (e) {
  process.exit(0);
}
