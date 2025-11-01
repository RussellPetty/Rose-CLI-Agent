# Terminal Buddy 👤

**AI-powered terminal command assistant** - Type `::` to generate commands from natural language, or `:::` to browse your command history.

> **Note**: Also available as `rose-cli` for backward compatibility. You can use `termbuddy`, `tb`, or `rose` commands interchangeably.

## ✨ Features

- **Natural language to commands**: Type what you want in plain English
- **Smart history**: Browse and filter past commands with `:::` (per-directory autocomplete)
- **AI-powered git workflow**: `lazypush` - Interactive file selection, AI-generated commit messages, and automatic push
- **Context-aware**: Automatically fetches `--help` docs for mentioned commands
- **Multi-provider**: Supports OpenAI, Anthropic (Claude), Google (Gemini), xAI (Grok), and Ollama (local models)
- **Smart integration**: Seamlessly integrates with Zsh and Bash
- **Cross-platform**: Works on Linux, macOS, and Windows

## 🚀 Installation

### NPM (Recommended)

Install using either package name (both are identical):

```bash
npm install -g termbuddy
```

Or:
```bash
npm install -g rose-cli
```

Both packages provide the same functionality with three command aliases: `termbuddy`, `tb`, and `rose`.

### Arch Linux (AUR)

```bash
yay -S termbuddy
# or
paru -S termbuddy
```

### Homebrew (macOS/Linux)

```bash
brew tap RussellPetty/termbuddy
brew install termbuddy
```

> **Note:** AUR and Homebrew packages are community-maintained. See [PACKAGING.md](PACKAGING.md) for maintainer information.

## 📝 Setup

Run the setup wizard:

```bash
termbuddy setup
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

### Command History (`:::`)

Terminal Buddy remembers all commands generated in each directory. Access your history with `:::`:

```bash
:::
# Shows all past commands generated in current directory (with fzf if installed)

::: docker
# Filters history for commands containing "docker"

::: npm install
# Filters for commands with "npm install"
```

**Interactive Selection:**
- If **fzf** is installed: Browse commands with fuzzy search
- Otherwise: Select from a numbered list

History is stored per-directory, so you only see relevant commands for your current location.

### AI-Powered Git Workflow (`lazypush`)

Terminal Buddy includes `lazypush` - an intelligent git workflow tool that combines interactive file selection with AI-generated commit messages:

```bash
lazypush
# Interactive mode:
# 1. Shows all uncommitted files in fzf
# 2. Press Space to select files to commit
# 3. AI generates commit message from the diff
# 4. Review and confirm before pushing

lazypush .
# Auto-select all files, but still confirm before pushing

lazypush !
# Auto-select all and push immediately (no confirmation)
```

**Features:**
- **Interactive file selection** with fzf (multi-select with Space)
- **AI-generated commit messages** using your configured AI provider
- **Live diff preview** while selecting files
- **Auto git init** if repository not initialized
- **Smart upstream handling** for first-time pushes
- **Three modes** for different workflows (interactive, semi-auto, full-auto)

**Requirements:**
- `fzf` for interactive mode (install via `brew install fzf` or your package manager)
- Auto-installed during Terminal Buddy setup

### Direct CLI Usage

You can also use Terminal Buddy directly:

```bash
termbuddy list running docker containers
# Outputs: docker ps

# Or use the shorthand:
tb find python files

# All commands work:
termbuddy setup    # Run setup wizard
tb update          # Update Terminal Buddy to latest version
rose --help        # Show help (legacy command)
tb --version       # Show version
```

## 🔄 Updating

To update Terminal Buddy to the latest version:

```bash
tb update
# or
termbuddy update
```

### Updating Shell Integration

If you installed Terminal Buddy before v2.1.0, you won't have the `:::` history feature. To update your shell integration:

**Option 1: Automatic (Recommended)**
```bash
termbuddy setup
```
It will detect your old integration and offer to update it automatically.

**Option 2: Manual**
```bash
# Reload your shell configuration
source ~/.zshrc  # or source ~/.bashrc
```

After updating, restart your terminal or run `source ~/.zshrc` to enable new features.

## 🔧 Configuration

Terminal Buddy stores:
- Configuration in `~/.rose-config.json`
- Help docs in `~/.rose-help.md`
- Command history in `~/.rose-history.json` (per-directory, last 500 commands)

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

- `termbuddy` / `tb` / `rose` - Main CLI commands
- `termbuddy setup` - Interactive setup wizard
- `termbuddy update` - Self-updating command
- `lazypush` - AI-powered git commit and push workflow
- Shell integration for `::` and `:::` syntax (Zsh/Bash/Fish)

## 🔍 Troubleshooting

### `:::` History Feature Not Working

If you type `:::` and it sends the request to AI instead of showing history:

1. **Update to latest version:**
   ```bash
   npm update -g termbuddy
   # or: yay -Syu termbuddy
   ```

2. **Update shell integration:**
   ```bash
   termbuddy setup
   ```
   Select "yes" when prompted to update your shell integration.

3. **Reload your shell:**
   ```bash
   source ~/.zshrc  # or ~/.bashrc
   # Or restart your terminal
   ```

### "History script not found" Error

This means your npm installation is outdated. Update with:
```bash
npm update -g termbuddy
```

### Commands Not Generating

- Check your API key: `cat ~/.rose-config.json`
- Verify internet connection (unless using Ollama)
- For Ollama: Ensure service is running with `ollama list`

### Shell Integration Not Working

If `::` doesn't trigger Terminal Buddy:
```bash
# Re-run setup
termbuddy setup

# Then reload shell
source ~/.zshrc  # or ~/.bashrc
```

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
