# Terminal Buddy 👤

**AI-powered terminal command assistant** - Just type `::` followed by your request and let AI generate the perfect command for you.

> **Note**: Also available as `rose-cli` for backward compatibility. You can use `terminal-buddy`, `tb`, or `rose` commands interchangeably.

## ✨ Features

- **Natural language to commands**: Type what you want in plain English
- **Context-aware**: Automatically fetches `--help` docs for mentioned commands
- **Multi-provider**: Supports OpenAI, Anthropic (Claude), Google (Gemini), xAI (Grok), and Ollama (local models)
- **Smart integration**: Seamlessly integrates with Zsh and Bash
- **Cross-platform**: Works on Linux, macOS, and Windows

## 🚀 Installation

Install using either package name (both are identical):

```bash
npm install -g termbuddy
```

Or:
```bash
npm install -g rose-cli
```

Both packages provide the same functionality with three command aliases: `terminal-buddy`, `tb`, and `rose`.

## 📝 Setup

Run the setup wizard:

```bash
terminal-buddy setup
# or
tb setup
# or (legacy)
rose setup
```

This will:
1. Let you choose your AI provider (OpenAI, Anthropic, Google, xAI, or Ollama)
2. **For Ollama**: Automatically install if not found, and offer curated small models
3. Securely store your API key (not needed for Ollama)
4. Generate help documentation for common commands
5. Automatically add shell integration to your `.zshrc` or `.bashrc`

### Ollama Auto-Setup

When selecting Ollama, Terminal Buddy will:
- Check if Ollama is installed (offers to install if not)
- Start the Ollama service if not running
- If no models are installed, present 5 curated small models optimized for command generation:
  - `qwen2.5:0.5b` (397 MB) - Smallest, fastest
  - `qwen2.5-coder:1.5b` (1.0 GB) - Code-focused, very fast
  - `llama3.2:1b` (1.3 GB) - Balanced quality/speed
  - `qwen2.5:3b` (1.9 GB) - Better accuracy
  - `llama3.2:3b` (2.0 GB) - High quality
- Download your chosen model with real-time progress display

## 💡 Usage

### Terminal Integration (Recommended)

After setup, just type `::` followed by your request in your terminal:

```bash
:: update system packages
# Generates: sudo apt update && sudo apt upgrade

:: find all javascript files modified in last 24 hours
# Generates: find . -name "*.js" -mtime -1

:: show me nginx error logs from last hour
# Generates: sudo journalctl -u nginx --since "1 hour ago" | grep error
```

Press Enter to see the command, then press Enter again to execute it!

### Direct CLI Usage

You can also use Terminal Buddy directly:

```bash
terminal-buddy list running docker containers
# Outputs: docker ps

# Or use the shorthand:
tb find python files

# All commands work:
terminal-buddy setup    # Run setup wizard
tb update              # Update Terminal Buddy to latest version
rose --help            # Show help (legacy command)
tb --version           # Show version
```

## 🔧 Configuration

Terminal Buddy stores configuration in `~/.rose-config.json` and help docs in `~/.rose-help.md`.

### Supported AI Providers

- **OpenAI** - GPT-5 Nano
- **Anthropic** - Claude 4.5 Haiku
- **Google** - Gemini 2.5 Flash
- **xAI** - Grok 4 Fast
- **Ollama** - Any locally installed model (e.g., llama3.2, qwen2.5, mistral)

All cloud providers support 1M+ token context windows for comprehensive help documentation. Ollama runs completely locally for privacy and offline usage.

## 🌟 How It Works

1. When you mention a command (like `git`, `docker`, `npm`), Terminal Buddy automatically runs `--help` on it
2. The full help documentation is sent to your chosen AI provider
3. The AI generates the appropriate command based on the actual available options
4. The command appears in your terminal, ready to execute

## 🛡️ Privacy & Security

- API keys are stored locally in `~/.rose-config.json` with restricted permissions (600)
- No data is sent anywhere except to your chosen AI provider
- All processing happens on your machine
- **Ollama option**: Keep everything 100% local - no API keys, no cloud services required

## 📦 What's Included

- `terminal-buddy` / `tb` / `rose` - Main CLI commands
- `terminal-buddy setup` - Interactive setup wizard
- `terminal-buddy update` - Self-updating command
- Shell integration for `::` syntax (Zsh/Bash/Fish)

## 🤝 Contributing

Issues and pull requests welcome!

### Dual Package Publishing

Terminal Buddy is published under two npm package names:
- **termbuddy** - Primary package name
- **rose-cli** - Legacy compatibility package

Both packages are kept in sync. When publishing updates:
```bash
# Use the automated script
./publish.sh

# Or manually:
# 1. Update version in package.json
# 2. Set name to "termbuddy" and npm publish
# 3. Set name to "rose-cli" and npm publish
```

## 📄 License

MIT

## 🙏 Acknowledgments

Powered by state-of-the-art language models from OpenAI, Anthropic, Google, xAI, and Ollama.
