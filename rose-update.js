#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

async function main() {
  console.log('🌹 Rose Update\n');

  try {
    // Get current version
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
    );
    const currentVersion = packageJson.version;
    console.log(`Current version: ${currentVersion}`);

    // Check for latest version from npm
    console.log('\nChecking for updates...');
    const { stdout: latestVersionOutput } = await execAsync('npm view rose-cli version');
    const latestVersion = latestVersionOutput.trim();

    console.log(`Latest version: ${latestVersion}`);

    if (currentVersion === latestVersion) {
      console.log('\n✅ Rose is already up to date!');
      return;
    }

    console.log('\n📦 Updating Rose to the latest version...');

    // Run npm update globally
    const { stdout, stderr } = await execAsync('npm update -g rose-cli');

    if (stderr && !stderr.includes('npm WARN')) {
      console.error('\nError during update:', stderr);
      process.exit(1);
    }

    console.log('\n✅ Rose has been updated successfully!');
    console.log(`\nUpdated from ${currentVersion} to ${latestVersion}`);
    console.log('\nRun "rose --version" to verify the new version.');

  } catch (error) {
    if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
      console.error('\n❌ Permission denied. Try running with sudo:');
      console.error('   sudo rose update');
    } else if (error.message.includes('rose-cli')) {
      console.error('\n❌ Could not fetch latest version from npm.');
      console.error('Please check your internet connection and try again.');
    } else {
      console.error('\n❌ Error:', error.message);
    }
    process.exit(1);
  }
}

main();
