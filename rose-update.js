#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

async function main() {
  console.log('👤 Terminal Buddy Update\n');

  try {
    // Get current version
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
    );
    const currentVersion = packageJson.version;
    console.log(`Current version: ${currentVersion}`);

    // Check for latest version from npm
    console.log('\nChecking for updates...');
    const { stdout: latestVersionOutput } = await execAsync('npm view terminal-buddy version');
    const latestVersion = latestVersionOutput.trim();

    console.log(`Latest version: ${latestVersion}`);

    if (currentVersion === latestVersion) {
      console.log('\n✅ Terminal Buddy is already up to date!');
      return;
    }

    console.log('\n📦 Updating Terminal Buddy to the latest version...');

    // Run npm update globally
    const { stdout, stderr } = await execAsync('npm update -g terminal-buddy');

    if (stderr && !stderr.includes('npm WARN')) {
      console.error('\nError during update:', stderr);
      process.exit(1);
    }

    console.log('\n✅ Terminal Buddy has been updated successfully!');
    console.log(`\nUpdated from ${currentVersion} to ${latestVersion}`);
    console.log('\nRun "terminal-buddy --version" to verify the new version.');

  } catch (error) {
    if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
      console.error('\n❌ Permission denied. Try running with sudo:');
      console.error('   sudo terminal-buddy update');
    } else if (error.message.includes('terminal-buddy')) {
      console.error('\n❌ Could not fetch latest version from npm.');
      console.error('Please check your internet connection and try again.');
    } else {
      console.error('\n❌ Error:', error.message);
    }
    process.exit(1);
  }
}

main();
