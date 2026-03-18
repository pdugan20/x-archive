#!/usr/bin/env tsx

import * as fs from 'fs';

const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F910}-\u{1F96B}\u{1F980}-\u{1F9E0}]/gu;

function checkFileForEmojis(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  const matches = content.match(EMOJI_REGEX);

  if (matches && matches.length > 0) {
    console.error(`\nEmojis found in ${filePath}:`);
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (EMOJI_REGEX.test(line)) {
        console.error(`  Line ${index + 1}: ${line.trim()}`);
      }
    });
    return true;
  }

  return false;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error(
      'Usage: tsx scripts/lint/check-no-emoji.ts <file1> [file2] ...'
    );
    process.exit(1);
  }

  let hasEmojis = false;

  for (const filePath of args) {
    if (fs.existsSync(filePath)) {
      if (checkFileForEmojis(filePath)) {
        hasEmojis = true;
      }
    }
  }

  if (hasEmojis) {
    console.error('\nError: Emojis are not allowed in code or documentation.');
    console.error('Please remove all emojis and use plain text instead.\n');
    process.exit(1);
  }

  console.log('No emojis found.');
}

main();
