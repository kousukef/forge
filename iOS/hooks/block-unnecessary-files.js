#!/usr/bin/env node

/**
 * PreToolUse hook for Write tool.
 * Blocks creation of unnecessary .md/.txt files in the project root.
 * Files under docs/ directory are allowed.
 */

const input = process.argv[2];

try {
  const toolInput = JSON.parse(input);
  const filePath = toolInput.file_path || '';

  // Allow files under docs/ directory
  if (filePath.includes('/docs/')) {
    process.exit(0);
  }

  // Allow files under .claude/ directory
  if (filePath.includes('/.claude/')) {
    process.exit(0);
  }

  // Allow files under openspec/ directory
  if (filePath.includes('/openspec/')) {
    process.exit(0);
  }

  // Check if the file is a .md or .txt in the project root area
  const fileName = filePath.split('/').pop();
  const isMarkdown = fileName.endsWith('.md');
  const isTxt = fileName.endsWith('.txt');

  if (isMarkdown || isTxt) {
    // Check if the file is at or near the project root (not in a deep subdirectory like src/)
    const pathParts = filePath.split('/');
    const projectDirs = ['src', 'lib', 'app', 'components', 'utils', 'hooks', 'types', 'config', 'test', 'tests', '__tests__'];

    const isInSourceDir = pathParts.some(part => projectDirs.includes(part));

    if (!isInSourceDir) {
      console.error(`BLOCKED: Creating ${fileName} outside of docs/ directory is not allowed.`);
      console.error('Place documentation files under docs/ directory instead.');
      process.exit(2);
    }
  }

  process.exit(0);
} catch (e) {
  // If we can't parse input, allow the operation
  process.exit(0);
}
