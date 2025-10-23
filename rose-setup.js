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
      model = 'claude-4-5-haiku';
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
  const apiKey = await question(`\nEnter your ${provider.toUpperCase()} API key: `);

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
    shellConfigFile = path.join(os.homedir(), '.zshrc');
  } else if (shell.includes('bash')) {
    shellName = 'Bash';
    shellConfigFile = path.join(os.homedir(), '.bashrc');
  } else {
    console.log(`Detected shell: ${shell || 'unknown'}`);
    console.log('Manual integration required. See documentation.\n');
  }

  if (shellConfigFile) {
    const addIntegration = await question(`Add Rose integration to your ${shellName} config (${shellConfigFile})? (y/n): `);

    if (addIntegration.toLowerCase() === 'y') {
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
      if (fs.existsSync(shellConfigFile)) {
        const currentConfig = fs.readFileSync(shellConfigFile, 'utf8');
        if (currentConfig.includes('rose-command')) {
          console.log('✓ Rose integration already exists in your shell config');
        } else {
          fs.appendFileSync(shellConfigFile, integration);
          console.log(`✅ Rose integration added to ${shellConfigFile}`);
          console.log(`\nRun: source ${shellConfigFile}`);
        }
      } else {
        fs.writeFileSync(shellConfigFile, integration);
        console.log(`✅ Created ${shellConfigFile} with Rose integration`);
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
