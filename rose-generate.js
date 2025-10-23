#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const CONFIG_PATH = path.join(os.homedir(), '.rose-config.json');
const HELP_PATH = path.join(os.homedir(), '.rose-help.md');
const HISTORY_PATH = path.join(os.homedir(), '.rose-history.json');

function getSystemPrompt(shell, system) {
  return `You are a command-generation assistant.
Your job is to review the user's request and output valid shell code that can be run directly on their system.

IMPORTANT: If help documentation is provided for a specific command mentioned in the request, you MUST use that command's documented options and subcommands. For example:
- If "claude --help" shows an "update" command, use "claude update" NOT package manager commands
- If "npm --help" shows "install", use "npm install" NOT generic package manager commands
- Always prefer the command's own built-in functionality when available

Your response must contain **only** the shell code — no explanations, no comments, no markdown fences, and no extra text.

The user is running:
- Shell: ${shell}
- System: ${system}

Generate commands appropriate for their shell and system. Always produce code that is ready to copy and paste into their terminal.`;
}

async function callOpenAI(apiKey, model, messages) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 4000
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `API error: ${response.status} ${JSON.stringify(data)}`);
  }

  if (!data.choices || !data.choices[0]) {
    throw new Error(`Unexpected API response: ${JSON.stringify(data)}`);
  }

  return data.choices[0].message.content;
}

async function callAnthropic(apiKey, model, messages) {
  // Convert messages format
  const systemMsg = messages.find(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      system: systemMsg ? systemMsg.content : SYSTEM_PROMPT,
      messages: userMessages,
      max_tokens: 4000,
      temperature: 0.3
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `API error: ${response.status} ${JSON.stringify(data)}`);
  }

  if (!data.content || !data.content[0]) {
    throw new Error(`Unexpected API response: ${JSON.stringify(data)}`);
  }

  return data.content[0].text;
}

async function callGoogle(apiKey, model, messages) {
  // Combine all messages into one prompt for Gemini
  const systemMsg = messages.find(m => m.role === 'system');
  const userMsg = messages.find(m => m.role === 'user');

  const prompt = systemMsg ? `${systemMsg.content}\n\n${userMsg.content}` : userMsg.content;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8000
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `API error: ${response.status} ${JSON.stringify(data)}`);
  }

  if (!data.candidates || !data.candidates[0]) {
    throw new Error(`No candidates in response: ${JSON.stringify(data)}`);
  }

  const candidate = data.candidates[0];

  // Check for parts in content
  if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
    return candidate.content.parts[0].text;
  }

  // Check for text directly in candidate
  if (candidate.text) {
    return candidate.text;
  }

  throw new Error(`Cannot extract text from response: ${JSON.stringify(data)}`);
}

async function callOllama(apiKey, model, messages) {
  // Convert messages to Ollama format
  const systemMsg = messages.find(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(systemMsg ? [{ role: 'system', content: systemMsg.content }] : []),
        ...userMessages
      ],
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 4000
      }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Ollama API error: ${response.status} ${JSON.stringify(data)}`);
  }

  if (!data.message || !data.message.content) {
    throw new Error(`Unexpected Ollama response: ${JSON.stringify(data)}`);
  }

  return data.message.content;
}

async function callGrok(apiKey, model, messages) {
  // Grok API is OpenAI-compatible
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 4000
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `API error: ${response.status} ${JSON.stringify(data)}`);
  }

  if (!data.choices || !data.choices[0]) {
    throw new Error(`Unexpected API response: ${JSON.stringify(data)}`);
  }

  return data.choices[0].message.content;
}

function saveToHistory(userRequest, command, currentPath) {
  try {
    let history = { commands: [] };

    // Load existing history
    if (fs.existsSync(HISTORY_PATH)) {
      try {
        history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
        if (!Array.isArray(history.commands)) {
          history.commands = [];
        }
      } catch (e) {
        // If history file is corrupted, start fresh
        history = { commands: [] };
      }
    }

    // Add new command
    history.commands.push({
      path: currentPath,
      request: userRequest,
      command: command,
      timestamp: Date.now()
    });

    // Keep only last 500 commands
    if (history.commands.length > 500) {
      history.commands = history.commands.slice(-500);
    }

    // Save history
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), { mode: 0o600 });
  } catch (e) {
    // Silent fail - don't break command generation if history save fails
  }
}

async function main() {
  const args = process.argv.slice(2);
  const userRequest = args.join(' ');

  if (!userRequest) {
    console.error('Usage: termbuddy <your request>');
    console.error('Run "termbuddy setup" first to configure.');
    process.exit(1);
  }

  // Load config
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('Config not found. Run "termbuddy setup" first.');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

  // Dynamically fetch --help for commands mentioned in the request
  let helpContext = '';
  const words = userRequest.toLowerCase().split(/\s+/);
  const commonCommands = ['git', 'npm', 'docker', 'pacman', 'yay', 'systemctl', 'journalctl', 'claude', 'cargo', 'python', 'node', 'curl', 'wget'];

  // Find commands mentioned in the request
  const mentionedCommands = commonCommands.filter(cmd => words.includes(cmd));

  if (mentionedCommands.length > 0) {
    const helpOutputs = [];
    for (const cmd of mentionedCommands) {
      try {
        // Check if command exists
        const { stdout: whichOutput } = await execAsync(`which ${cmd} 2>/dev/null`);
        if (whichOutput.trim()) {
          // Get --help output - FULL OUTPUT, NO TRUNCATION
          const { stdout: helpOutput } = await execAsync(`${cmd} --help 2>&1 || ${cmd} -h 2>&1`).catch(() => ({ stdout: '' }));
          if (helpOutput) {
            helpOutputs.push(`## ${cmd}\n\n${helpOutput}`);
          }
        }
      } catch (e) {
        // Command not available or no help, skip
      }
    }
    helpContext = helpOutputs.join('\n\n');
  }

  // Get system info
  const shell = process.env.SHELL || 'unknown';
  const system = os.platform();
  const arch = os.arch();

  const currentPath = process.cwd();

  const messages = [
    { role: 'system', content: getSystemPrompt(shell, system) },
    {
      role: 'user',
      content: `${helpContext ? `COMMAND DOCUMENTATION (use this first):\n${helpContext}\n\n---\n\n` : ''}USER REQUEST: ${userRequest}

User current path: ${currentPath}
Architecture: ${arch}`
    }
  ];

  let result;
  try {
    switch (config.provider) {
      case 'openai':
        result = await callOpenAI(config.apiKey, config.model, messages);
        break;
      case 'anthropic':
        result = await callAnthropic(config.apiKey, config.model, messages);
        break;
      case 'google':
        result = await callGoogle(config.apiKey, config.model, messages);
        break;
      case 'grok':
        result = await callGrok(config.apiKey, config.model, messages);
        break;
      case 'ollama':
        result = await callOllama(config.apiKey, config.model, messages);
        break;
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }

    // Clean up response
    result = result.trim();
    // Remove markdown code fences if present
    result = result.replace(/^```(?:zsh|bash|sh)?\n?/gm, '').replace(/\n?```$/gm, '');

    // Save to history
    saveToHistory(userRequest, result, currentPath);

    console.log(result);
  } catch (error) {
    console.error('Error calling AI:', error.message);
    process.exit(1);
  }
}

main();
