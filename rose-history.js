#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const HISTORY_PATH = path.join(os.homedir(), '.rose-history.json');

function getHistory(currentPath, filter = '') {
  if (!fs.existsSync(HISTORY_PATH)) {
    return [];
  }

  try {
    const history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));

    if (!history.commands || !Array.isArray(history.commands)) {
      return [];
    }

    // Filter commands by current directory
    let commands = history.commands
      .filter(entry => entry.path === currentPath)
      .map(entry => ({
        command: entry.command,
        request: entry.request,
        timestamp: entry.timestamp
      }));

    // Apply text filter if provided
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      commands = commands.filter(entry =>
        entry.command.toLowerCase().includes(lowerFilter) ||
        entry.request.toLowerCase().includes(lowerFilter)
      );
    }

    // Sort by timestamp (most recent first) and deduplicate by command
    commands.sort((a, b) => b.timestamp - a.timestamp);

    const seen = new Set();
    const unique = [];
    for (const cmd of commands) {
      if (!seen.has(cmd.command)) {
        seen.add(cmd.command);
        unique.push(cmd);
      }
    }

    return unique;
  } catch (e) {
    return [];
  }
}

function main() {
  const currentPath = process.cwd();
  const filter = process.argv.slice(2).join(' ');

  const mode = process.env.ROSE_HISTORY_MODE || 'commands';

  const history = getHistory(currentPath, filter);

  if (mode === 'interactive') {
    // For interactive mode, output in a format suitable for selection menus
    history.forEach(entry => {
      console.log(`${entry.command}\t# ${entry.request}`);
    });
  } else if (mode === 'commands') {
    // For autocomplete, output just the commands
    history.forEach(entry => {
      console.log(entry.command);
    });
  } else if (mode === 'json') {
    // For programmatic use
    console.log(JSON.stringify(history, null, 2));
  }
}

main();
