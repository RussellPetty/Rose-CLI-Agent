# Rose 🌹

**AI-powered terminal command assistant** - Just type `::` followed by your request and let AI generate the perfect command for you.

## ✨ Features

- **Natural language to commands**: Type what you want in plain English
- **Context-aware**: Automatically fetches `--help` docs for mentioned commands
- **Multi-provider**: Supports OpenAI, Anthropic (Claude), and Google (Gemini)
- **Smart integration**: Seamlessly integrates with Zsh and Bash
- **Cross-platform**: Works on Linux, macOS, and Windows

## 🚀 Installation

```bash
npm install -g rose-cli
```

## 📝 Setup

Run the setup wizard:

```bash
rose setup
```

This will:
1. Let you choose your AI provider (OpenAI, Anthropic, or Google)
2. Securely store your API key
3. Generate help documentation for common commands
4. Automatically add shell integration to your `.zshrc` or `.bashrc`

## 💡 Usage

### Terminal Integration (Recommended)

After setup, just type `::` followed by your request in your terminal:

```bash
:: update claude
# Generates: claude update

:: find all javascript files modified in last 24 hours
# Generates: find . -name "*.js" -mtime -1

:: show me nginx error logs from last hour
# Generates: sudo journalctl -u nginx --since "1 hour ago" | grep error
```

Press Enter to see the command, then press Enter again to execute it!

### Direct CLI Usage

You can also use Rose directly:

```bash
rose update npm packages
# Outputs: npm update

rose --help     # Show help
rose --version  # Show version
```

## 🔧 Configuration

Rose stores configuration in `~/.rose-config.json` and help docs in `~/.rose-help.md`.

### Supported AI Providers

- **OpenAI** - GPT-5 Nano
- **Anthropic** - Claude 4.5 Haiku
- **Google** - Gemini 2.5 Flash

All providers support 1M+ token context windows for comprehensive help documentation.

## 🌟 How It Works

1. When you mention a command (like `claude`, `git`, `npm`), Rose automatically runs `--help` on it
2. The full help documentation is sent to your chosen AI provider
3. The AI generates the appropriate command based on the actual available options
4. The command appears in your terminal, ready to execute

## 🛡️ Privacy & Security

- API keys are stored locally in `~/.rose-config.json` with restricted permissions (600)
- No data is sent anywhere except to your chosen AI provider
- All processing happens on your machine

## 📦 What's Included

- `rose` - Main CLI command
- `rose setup` - Interactive setup wizard
- Shell integration for `::` syntax (Zsh/Bash)

## 🤝 Contributing

Issues and pull requests welcome!

## 📄 License

MIT

## 🙏 Acknowledgments

Powered by state-of-the-art language models from OpenAI, Anthropic, and Google.

---

Made with ❤️ for developers who love efficient workflows
