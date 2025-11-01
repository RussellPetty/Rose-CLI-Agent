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
  console.log('👤 Terminal Buddy Setup\n');

  // Choose provider
  console.log('Choose your AI provider:');
  console.log('1. OpenAI (GPT-5 Nano)');
  console.log('2. Anthropic (Claude 4.5 Haiku)');
  console.log('3. Google (Gemini 2.5 Flash)');
  console.log('4. xAI (Grok 4 Fast)');
  console.log('5. Ollama (Local models)');

  const choice = await question('\nEnter 1, 2, 3, 4, or 5: ');

  let provider, model, apiKey;
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
    case '4':
      provider = 'grok';
      model = 'grok-4-fast';
      break;
    case '5':
      provider = 'ollama';

      // Check if Ollama is installed
      console.log('\nChecking Ollama installation...');
      try {
        await execAsync('which ollama');
        console.log('✓ Ollama is installed');
      } catch (error) {
        console.log('✗ Ollama is not installed');
        const installChoice = await question('\nWould you like to install Ollama now? (y/n): ');

        if (installChoice.toLowerCase() !== 'y') {
          console.log('\nOllama is required for this option.');
          console.log('Visit https://ollama.ai to install manually.');
          rl.close();
          process.exit(0);
        }

        console.log('\n📦 Installing Ollama...');
        console.log('This may take a few minutes.\n');
        try {
          // Install Ollama using the official installation script with progress tracking
          const installProcess = exec('curl -fsSL https://ollama.ai/install.sh | sh');

          const installSteps = [
            'Downloading',
            'Installing',
            'Configuring',
            'Finalizing'
          ];

          let currentStep = 0;
          let dots = 0;

          // Show progress animation
          const progressInterval = setInterval(() => {
            dots = (dots + 1) % 4;
            const dotsStr = '.'.repeat(dots) + ' '.repeat(3 - dots);
            process.stdout.write(`\r${installSteps[currentStep]}${dotsStr}`);
          }, 500);

          installProcess.stdout.on('data', (data) => {
            const output = data.toString().toLowerCase();
            // Update step based on output keywords
            if (output.includes('download')) currentStep = 0;
            else if (output.includes('install')) currentStep = 1;
            else if (output.includes('setting up') || output.includes('configur')) currentStep = 2;
            else if (output.includes('done') || output.includes('complete')) currentStep = 3;
          });

          await new Promise((resolve, reject) => {
            installProcess.on('exit', (code) => {
              clearInterval(progressInterval);
              process.stdout.write('\r' + ' '.repeat(50) + '\r'); // Clear progress line
              if (code === 0) {
                resolve();
              } else {
                reject(new Error(`Installation failed with code ${code}`));
              }
            });

            installProcess.on('error', (error) => {
              clearInterval(progressInterval);
              process.stdout.write('\r' + ' '.repeat(50) + '\r');
              reject(error);
            });
          });

          console.log('✅ Ollama installed successfully!');

          // Start Ollama service
          console.log('🚀 Starting Ollama service...');
          await execAsync('ollama serve > /dev/null 2>&1 &');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for service to start
        } catch (installError) {
          console.error('\n❌ Failed to install Ollama:', installError.message);
          console.error('Please install manually from https://ollama.ai');
          rl.close();
          process.exit(1);
        }
      }

      // Check if Ollama is running
      console.log('\nConnecting to Ollama...');
      let isRunning = false;
      try {
        const response = await fetch('http://localhost:11434/api/tags');
        isRunning = response.ok;
      } catch (e) {
        isRunning = false;
      }

      if (!isRunning) {
        console.log('⚠️  Ollama service is not running. Starting it...');
        try {
          exec('ollama serve > /dev/null 2>&1 &');
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (e) {
          console.error('❌ Could not start Ollama service');
          console.error('Please run: ollama serve');
          rl.close();
          process.exit(1);
        }
      }

      // Fetch available models from Ollama
      console.log('Fetching available models...');
      try {
        const response = await fetch('http://localhost:11434/api/tags');
        if (!response.ok) {
          throw new Error(`Ollama API returned status ${response.status}`);
        }
        const data = await response.json();

        if (!data.models || data.models.length === 0) {
          // No models installed - offer curated list
          console.log('\n📚 No models found. Let\'s install one!');
          console.log('\nRecommended small models for command generation:');

          const recommendedModels = [
            { name: 'qwen2.5:0.5b', size: '397 MB', description: 'Smallest, fastest (0.5B params)' },
            { name: 'qwen2.5-coder:1.5b', size: '1.0 GB', description: 'Code-focused, very fast (1.5B params)' },
            { name: 'llama3.2:1b', size: '1.3 GB', description: 'Balanced quality/speed (1B params)' },
            { name: 'qwen2.5:3b', size: '1.9 GB', description: 'Better accuracy (3B params)' },
            { name: 'llama3.2:3b', size: '2.0 GB', description: 'High quality (3B params)' }
          ];

          recommendedModels.forEach((m, i) => {
            console.log(`${i + 1}. ${m.name.padEnd(25)} (${m.size}) - ${m.description}`);
          });

          const modelChoice = await question('\nSelect a model to install (1-5): ');
          const modelIndex = parseInt(modelChoice.trim()) - 1;

          if (modelIndex < 0 || modelIndex >= recommendedModels.length) {
            console.error('Invalid choice');
            rl.close();
            process.exit(1);
          }

          model = recommendedModels[modelIndex].name;

          console.log(`\n📥 Downloading ${model}...`);
          console.log('This may take a few minutes depending on your connection.\n');

          // Pull the model with progress
          const pullProcess = exec(`ollama pull ${model}`);

          pullProcess.stdout.on('data', (data) => {
            process.stdout.write(data);
          });

          pullProcess.stderr.on('data', (data) => {
            process.stderr.write(data);
          });

          await new Promise((resolve, reject) => {
            pullProcess.on('exit', (code) => {
              if (code === 0) {
                resolve();
              } else {
                reject(new Error(`Model download failed with code ${code}`));
              }
            });
          });

          console.log(`\n✅ Model ${model} installed successfully!`);
          apiKey = 'local';
        } else {
          // Models available - show list
          console.log('\n✓ Available models:');
          data.models.forEach((m, i) => {
            console.log(`${i + 1}. ${m.name}`);
          });

          const modelChoice = await question('\nEnter model number: ');
          const modelIndex = parseInt(modelChoice.trim()) - 1;

          if (modelIndex < 0 || modelIndex >= data.models.length) {
            console.error('Invalid model choice');
            rl.close();
            process.exit(1);
          }

          model = data.models[modelIndex].name;
          apiKey = 'local';
          console.log(`\nSelected model: ${model}`);
        }
      } catch (error) {
        console.error(`\n❌ Error: ${error.message}`);
        rl.close();
        process.exit(1);
      }
      break;
    default:
      console.error('Invalid choice');
      rl.close();
      process.exit(1);
  }

  // Get API key (skip for Ollama)
  if (provider !== 'ollama') {
    apiKey = await questionSecret(`\nEnter your ${provider.toUpperCase()} API key: `);
  }

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
    console.log(`Adding Terminal Buddy integration to ${shellConfigFile}...`);

    const integration = `
# Terminal Buddy - AI terminal assistant integration
function rose-command() {
    local text="$BUFFER"

    # History search mode (:::)
    if [[ $text == :::* ]]; then
        local filter="\${text#:::}"
        filter="\${filter# }" # Remove leading space

        # Get history commands
        local history_commands
        if command -v node >/dev/null 2>&1; then
            local rose_history_script="$(dirname "$(readlink -f "$(which rose 2>/dev/null || which tb 2>/dev/null)")")/rose-history.js"

            if [[ -f "$rose_history_script" ]]; then
                if [[ -n "$filter" ]]; then
                    history_commands=$(ROSE_HISTORY_MODE=interactive node "$rose_history_script" "$filter" 2>/dev/null)
                else
                    history_commands=$(ROSE_HISTORY_MODE=interactive node "$rose_history_script" 2>/dev/null)
                fi

                if [[ -n "$history_commands" ]]; then
                    # Use fzf if available, otherwise use numbered list
                    if command -v fzf >/dev/null 2>&1; then
                        local selected=$(echo "$history_commands" | fzf --height=40% --reverse --prompt="Select command: " | cut -f1)
                        if [[ -n "$selected" ]]; then
                            BUFFER="$selected"
                            CURSOR=$#BUFFER
                        else
                            BUFFER=""
                        fi
                    else
                        # Simple numbered selection
                        echo
                        echo "$history_commands" | nl -w2 -s'. '
                        echo
                        echo -n "Select command number (or Enter to cancel): "
                        read selection
                        if [[ "$selection" =~ ^[0-9]+$ ]]; then
                            local selected=$(echo "$history_commands" | sed -n "\${selection}p" | cut -f1)
                            if [[ -n "$selected" ]]; then
                                BUFFER="$selected"
                                CURSOR=$#BUFFER
                            else
                                BUFFER=""
                            fi
                        else
                            BUFFER=""
                        fi
                    fi
                else
                    echo "No history found for this directory"
                    BUFFER=""
                fi
            else
                echo "History script not found"
                BUFFER=""
            fi
        else
            echo "Node.js not found"
            BUFFER=""
        fi
        zle reset-prompt
        return
    fi

    # AI command generation mode (::)
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
        // Check if it's the old version without ::: support
        if (!currentConfig.includes('History search mode (:::)')) {
          console.log('⚠️  Found old Terminal Buddy integration without history support');
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });

          const answer = await new Promise(resolve => {
            rl.question('Update to latest version with ::: history feature? (y/n): ', resolve);
          });
          rl.close();

          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            // Remove old integration
            const oldIntegrationPattern = /# (Rose|Terminal Buddy) - AI terminal assistant integration[\s\S]*?bindkey '\^M' rose-command.*?\n/;
            const updatedConfig = currentConfig.replace(oldIntegrationPattern, '');
            fs.writeFileSync(shellConfigFile, updatedConfig + integration);
            console.log(`✅ Updated Terminal Buddy integration in ${shellConfigFile}`);
            console.log('   Now supports ::: for command history!');
            configUpdated = true;
          } else {
            console.log('Keeping existing integration');
          }
        } else {
          console.log('✓ Terminal Buddy integration already exists in your shell config (latest version)');
        }
      } else {
        fs.appendFileSync(shellConfigFile, integration);
        console.log(`✅ Terminal Buddy integration added to ${shellConfigFile}`);
        configUpdated = true;
      }
    } else {
      fs.writeFileSync(shellConfigFile, integration);
      console.log(`✅ Created ${shellConfigFile} with Terminal Buddy integration`);
      configUpdated = true;
    }

    // Install lazypush feature
    console.log('\n📦 Installing lazypush feature...');
    try {
      const roseBinPath = await execAsync('which rose 2>/dev/null || which tb 2>/dev/null');
      const roseBinDir = path.dirname(roseBinPath.stdout.trim());
      const lazypushSource = path.join(roseBinDir, 'lazypush.sh');

      // Check if lazypush.sh exists in the installation
      if (fs.existsSync(lazypushSource)) {
        // Add lazypush sourcing to shell config
        const lazypushIntegration = `\n# lazypush - AI-powered git commit and push\nif [ -f "${lazypushSource}" ]; then\n    source "${lazypushSource}"\nfi\n`;

        const currentConfig = fs.existsSync(shellConfigFile) ? fs.readFileSync(shellConfigFile, 'utf8') : '';

        if (!currentConfig.includes('lazypush.sh') && !currentConfig.includes('lazypush - AI-powered')) {
          fs.appendFileSync(shellConfigFile, lazypushIntegration);
          console.log('✅ lazypush feature installed');
          console.log('   Usage:');
          console.log('     lazypush      - Interactive file selection');
          console.log('     lazypush .    - Auto-select all with confirmation');
          console.log('     lazypush !    - Auto-push without confirmation');
          configUpdated = true;
        } else {
          console.log('✓ lazypush already configured');
        }
      } else {
        console.log('⚠️  lazypush.sh not found in installation, skipping');
      }
    } catch (e) {
      console.log('⚠️  Could not install lazypush feature');
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
          console.log('Terminal Buddy is now active in your current shell.');
        } catch (e) {
          console.log(`⚠️  Couldn't auto-reload. Please run: source ${shellConfigFile}`);
          console.log('   Or restart your terminal.');
        }
      } else {
        console.log(`⚠️  Please restart your terminal to activate Terminal Buddy.`);
      }
    }
  }

  console.log('\n🎉 Setup complete! You can now use Terminal Buddy\n');
  console.log('Usage:');
  console.log('  1. In your terminal, type :: followed by your request');
  console.log('  2. Press Enter and wait for the command to appear');
  console.log('  3. Press Enter again to execute\n');
  console.log('Examples:');
  console.log('  :: list docker containers');
  console.log('  ::: filter              (search command history)');
  console.log('  lazypush                (AI-powered git commit & push)\n');

  rl.close();
}

main().catch(error => {
  console.error('Error:', error.message);
  rl.close();
  process.exit(1);
});
