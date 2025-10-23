#!/bin/bash

# Quick setup script for Terminal Buddy Homebrew tap

echo "🍺 Terminal Buddy Homebrew Tap Setup"
echo ""

# Check if homebrew-termbuddy exists
if [ -d "$HOME/homebrew-termbuddy" ]; then
  echo "⚠️  Directory $HOME/homebrew-termbuddy already exists"
  read -p "Delete and recreate? (y/n): " answer
  if [ "$answer" != "y" ]; then
    echo "Aborted."
    exit 1
  fi
  rm -rf "$HOME/homebrew-termbuddy"
fi

echo "Step 1: Go create the GitHub repo (if not done):"
echo "  URL: https://github.com/new"
echo "  Name: homebrew-termbuddy"
echo "  Public repo"
echo ""
read -p "Press Enter when repo is created..."

echo ""
echo "Step 2: Setting up tap locally..."
cd "$HOME"

# Clone the empty repo
git clone https://github.com/RussellPetty/homebrew-termbuddy.git
cd homebrew-termbuddy

# Create Formula directory
mkdir -p Formula

# Copy the formula
cp "$HOME/rose-dev/termbuddy.rb" Formula/

# Create README
cat > README.md << 'EOF'
# Terminal Buddy Homebrew Tap

Official Homebrew tap for [Terminal Buddy](https://github.com/RussellPetty/Rose-CLI-Agent) - AI-powered terminal command assistant.

## Installation

```bash
brew tap RussellPetty/termbuddy
brew install termbuddy
```

## Usage

After installation, run setup:
```bash
termbuddy setup
```

Then use:
- `::` to generate commands with AI
- `:::` to browse command history

## Links

- [GitHub Repository](https://github.com/RussellPetty/Rose-CLI-Agent)
- [NPM Package](https://www.npmjs.com/package/termbuddy)
EOF

echo "Step 3: Committing and pushing..."
git add Formula/termbuddy.rb README.md
git commit -m "Initial tap: Terminal Buddy v2.1.2"
git push origin main

echo ""
echo "✅ Homebrew tap created successfully!"
echo ""
echo "Users can now install with:"
echo "  brew tap RussellPetty/termbuddy"
echo "  brew install termbuddy"
echo ""
echo "Test it yourself:"
echo "  brew tap RussellPetty/termbuddy"
echo "  brew install termbuddy"
