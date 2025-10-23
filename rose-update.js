#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

async function main() {
  console.log('👤 Terminal Buddy Update\n');

  try {
    // Detect which package is installed
    let packageName = 'termbuddy'; // Default
    try {
      await execAsync('npm list -g termbuddy');
      packageName = 'termbuddy';
    } catch (e) {
      try {
        await execAsync('npm list -g rose-cli');
        packageName = 'rose-cli';
      } catch (e2) {
        // Fallback to termbuddy if neither found
        packageName = 'termbuddy';
      }
    }

    console.log(`Detected package: ${packageName}`);

    // Get current version
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
    );
    const currentVersion = packageJson.version;
    console.log(`Current version: ${currentVersion}`);

    // Check for latest version from npm
    console.log('\nChecking for updates...');
    const { stdout: latestVersionOutput } = await execAsync(`npm view ${packageName} version`);
    const latestVersion = latestVersionOutput.trim();

    console.log(`Latest version: ${latestVersion}`);

    if (currentVersion === latestVersion) {
      console.log('\n✅ Terminal Buddy is already up to date!');
      return;
    }

    console.log('\n📦 Updating Terminal Buddy to the latest version...');

    // Run npm update globally
    const { stdout, stderr } = await execAsync(`npm update -g ${packageName}`);

    if (stderr && !stderr.includes('npm WARN')) {
      console.error('\nError during update:', stderr);
      process.exit(1);
    }

    console.log('\n✅ Terminal Buddy has been updated successfully!');
    console.log(`\nUpdated from ${currentVersion} to ${latestVersion}`);
    console.log('\nRun "termbuddy --version" to verify the new version.');

  } catch (error) {
    if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
      console.error('\n❌ Permission denied. Try running with sudo:');
      console.error('   sudo termbuddy update');
      console.error('   or: sudo tb update');
    } else if (error.message.includes('termbuddy') || error.message.includes('rose-cli')) {
      console.error('\n❌ Could not fetch latest version from npm.');
      console.error('Please check your internet connection and try again.');
    } else {
      console.error('\n❌ Error:', error.message);
    }
    process.exit(1);
  }
}

main();
