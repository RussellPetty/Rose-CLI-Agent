#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

const CONFIG_PATH = path.join(os.homedir(), '.rose-config.json');
const HELP_PATH = path.join(os.homedir(), '.rose-help.md');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

function questionSecret(prompt) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const onData = (char) => {
      char = char.toString();
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(hidden);
          break;
        case '\u0003':
          process.exit();
          break;
        case '\u007f': // Backspace
          hidden = hidden.slice(0, -1);
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write(prompt);
          // Show only last 4 chars
          if (hidden.length > 4) {
            process.stdout.write('*'.repeat(hidden.length - 4) + hidden.slice(-4));
          } else {
            process.stdout.write(hidden);
          }
          break;
        default:
          // Handle pasting (multiple characters at once)
          hidden += char;
          process.stdout.clearLine();
          process.stdout.cursorTo(0);
          process.stdout.write(prompt);
          // Show only last 4 chars
          if (hidden.length > 4) {
            process.stdout.write('*'.repeat(hidden.length - 4) + hidden.slice(-4));
          } else {
            process.stdout.write(hidden);
          }
          break;
      }
    };

    let hidden = '';
    process.stdout.write(prompt);
    stdin.resume();
    stdin.setRawMode(true);
    stdin.on('data', onData);
  });
}

async function main() {
  console.log('🌹 Rose Setup\n');

  // Choose provider
  console.log('Choose your AI provider:');
  console.log('1. OpenAI (GPT-5 Nano)');
  console.log('2. Anthropic (Claude 4.5 Haiku)');
  console.log('3. Google (Gemini 2.5 Flash)');

  const choice = await question('\nEnter 1, 2, or 3: ');

  let provider, model;
  switch (choice.trim()) {
    case '1':
      provider = 'openai';
      model = 'gpt-5-nano';
      break;
    case '2':
      provider = 'anthropic';
      model = 'claude-haiku-4-5';
      break;
    case '3':
      provider = 'google';
      model = 'gemini-2.5-flash';
      break;
    default:
      console.error('Invalid choice');
      rl.close();
      process.exit(1);
  }

  // Get API key
  const apiKey = await questionSecret(`\nEnter your ${provider.toUpperCase()} API key: `);

  // Save config
  const config = { provider, model, apiKey: apiKey.trim() };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  fs.chmodSync(CONFIG_PATH, 0o600); // Make it readable only by owner

  console.log(`\n✅ Config saved to ${CONFIG_PATH}`);

  // Generate help docs
  console.log('\n📚 Generating command help documentation...');

  const commonCommands = [
    'git', 'npm', 'node', 'docker', 'docker-compose', 'kubectl',
    'python', 'pip', 'cargo', 'rustc', 'go', 'java', 'javac',
    'pacman', 'yay', 'systemctl', 'journalctl', 'claude',
    'curl', 'wget', 'ssh', 'scp', 'rsync', 'tar', 'zip', 'unzip'
  ];

  let helpMd = '# Rose 🌹 - Command Help Documentation\n\n';
  helpMd += `Generated: ${new Date().toISOString()}\n\n`;
  helpMd += `System: ${os.platform()} ${os.arch()}\n\n`;
  helpMd += '---\n\n';

  for (const cmd of commonCommands) {
    try {
      const { stdout, stderr } = await execAsync(`which ${cmd} 2>/dev/null`);
      if (stdout.trim()) {
        console.log(`  - ${cmd}`);
        const { stdout: helpOutput } = await execAsync(`${cmd} --help 2>&1 || ${cmd} -h 2>&1 || echo "No help available"`);
        helpMd += `## ${cmd}\n\n\`\`\`\n${helpOutput.substring(0, 2000)}\n\`\`\`\n\n`;
      }
    } catch (e) {
      // Command not available, skip
    }
  }

  fs.writeFileSync(HELP_PATH, helpMd);
  console.log(`\n✅ Help documentation saved to ${HELP_PATH}`);

  // Shell integration
  console.log('\n📝 Shell Integration Setup');
  console.log('Rose can integrate with your shell so you can type :: followed by your request.\n');

  const shell = process.env.SHELL || '';
  let shellConfigFile = '';
  let shellName = '';

  if (shell.includes('zsh')) {
    shellName = 'Zsh';
    // Check for ZDOTDIR first (common in custom zsh setups)
    const zdotdir = process.env.ZDOTDIR;
    if (zdotdir) {
      shellConfigFile = path.join(zdotdir, '.zshrc');
      console.log(`Detected ZDOTDIR: ${zdotdir}`);
    } else {
      shellConfigFile = path.join(os.homedir(), '.zshrc');
    }
  } else if (shell.includes('bash')) {
    shellName = 'Bash';
    shellConfigFile = path.join(os.homedir(), '.bashrc');
  } else if (shell.includes('fish')) {
    shellName = 'Fish';
    shellConfigFile = path.join(os.homedir(), '.config', 'fish', 'config.fish');
  } else {
    console.log(`Detected shell: ${shell || 'unknown'}`);
    console.log('Manual integration required. See documentation.\n');
  }

  if (shellConfigFile) {
    console.log(`Adding Rose integration to ${shellConfigFile}...`);

    const integration = `
# Rose - AI terminal assistant integration
function rose-command() {
    local text="$BUFFER"
    if [[ $text == ::* ]]; then
        text="\${text#::}"
        text="\${text# }" # Remove leading space

        # Show thinking indicator
        BUFFER="Thinking..."
        CURSOR=$#BUFFER
        zle redisplay

        # Call Rose
        local command=$(rose "$text" 2>&1)

        if [[ -n "$command" ]]; then
            BUFFER="$command"
            CURSOR=$#BUFFER
            zle redisplay
        else
            BUFFER=""
            zle redisplay
        fi
    else
        zle accept-line
    fi
}
zle -N rose-command
bindkey '^M' rose-command  # Bind to Enter key
`;

    // Check if already added
    let configUpdated = false;
    if (fs.existsSync(shellConfigFile)) {
      const currentConfig = fs.readFileSync(shellConfigFile, 'utf8');
      if (currentConfig.includes('rose-command')) {
        console.log('✓ Rose integration already exists in your shell config');
      } else {
        fs.appendFileSync(shellConfigFile, integration);
        console.log(`✅ Rose integration added to ${shellConfigFile}`);
        configUpdated = true;
      }
    } else {
      fs.writeFileSync(shellConfigFile, integration);
      console.log(`✅ Created ${shellConfigFile} with Rose integration`);
      configUpdated = true;
    }

    // Attempt to reload config
    if (configUpdated) {
      console.log('\n🔄 Reloading shell configuration...');
      const reloadCmd = shell.includes('zsh')
        ? `zsh -c "source ${shellConfigFile}"`
        : shell.includes('bash')
        ? `bash -c "source ${shellConfigFile}"`
        : null;

      if (reloadCmd) {
        try {
          await execAsync(reloadCmd);
          console.log('✅ Configuration reloaded!');
          console.log('Rose is now active in your current shell.');
        } catch (e) {
          console.log(`⚠️  Couldn't auto-reload. Please run: source ${shellConfigFile}`);
          console.log('   Or restart your terminal.');
        }
      } else {
        console.log(`⚠️  Please restart your terminal to activate Rose.`);
      }
    }
  }

  console.log('\n🎉 Setup complete! You can now use Rose\n');
  console.log('Usage:');
  console.log('  1. In your terminal, type :: followed by your request');
  console.log('  2. Press Enter and wait for the command to appear');
  console.log('  3. Press Enter again to execute\n');
  console.log('Example: :: update claude\n');

  rl.close();
}

main().catch(error => {
  console.error('Error:', error.message);
  rl.close();
  process.exit(1);
});
