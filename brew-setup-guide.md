# Homebrew Setup Guide for Terminal Buddy

## Step 1: Create the Tap Repository on GitHub

1. Go to https://github.com/new
2. Create a repository named: **homebrew-termbuddy**
3. Make it **Public**
4. Don't initialize with README, .gitignore, or license

## Step 2: Clone and Set Up Locally

```bash
# Clone your new tap repository
git clone https://github.com/RussellPetty/homebrew-termbuddy.git
cd homebrew-termbuddy

# Create Formula directory
mkdir -p Formula

# Copy the formula from your rose-dev directory
cp ~/rose-dev/termbuddy.rb Formula/

# Create a README
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

# Commit and push
git add Formula/termbuddy.rb README.md
git commit -m "Initial tap: Terminal Buddy v2.1.2"
git push origin main
```

## Step 3: Test Your Tap Locally

```bash
# Add your tap
brew tap RussellPetty/termbuddy

# Install termbuddy
brew install termbuddy

# Test it works
termbuddy --version
# Should output: Terminal Buddy v2.1.2 👤

# Run setup
termbuddy setup
```

## Step 4: Users Can Now Install

Tell users to run:
```bash
brew tap RussellPetty/termbuddy
brew install termbuddy
```

Or add to your README:
```markdown
### Homebrew (macOS/Linux)

\`\`\`bash
brew tap RussellPetty/termbuddy
brew install termbuddy
\`\`\`
```

## Updating the Formula

When you release a new version (e.g., 2.1.3):

1. **Publish to npm first**
2. **Calculate new SHA256:**
   ```bash
   curl -sL https://registry.npmjs.org/termbuddy/-/termbuddy-2.1.3.tgz | sha256sum
   ```

3. **Update Formula/termbuddy.rb:**
   - Change `url` version: `termbuddy-2.1.3.tgz`
   - Update `sha256` with new hash
   - Update `test` version check

4. **Commit and push:**
   ```bash
   git add Formula/termbuddy.rb
   git commit -m "Update to v2.1.3"
   git push
   ```

5. **Users update with:**
   ```bash
   brew update
   brew upgrade termbuddy
   ```

## Automation Script

Create `update-brew.sh` in rose-dev:
```bash
#!/bin/bash
VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Usage: ./update-brew.sh 2.1.3"
  exit 1
fi

echo "Calculating SHA256 for termbuddy@$VERSION..."
SHA256=$(curl -sL https://registry.npmjs.org/termbuddy/-/termbuddy-$VERSION.tgz | sha256sum | cut -d' ' -f1)

echo "SHA256: $SHA256"
echo "Updating formula..."

cd homebrew-termbuddy
sed -i "s|termbuddy-.*\.tgz|termbuddy-$VERSION.tgz|" Formula/termbuddy.rb
sed -i "s|sha256 \".*\"|sha256 \"$SHA256\"|" Formula/termbuddy.rb
sed -i "s|Terminal Buddy v.*\"|Terminal Buddy v$VERSION\"|" Formula/termbuddy.rb

git add Formula/termbuddy.rb
git commit -m "Update to v$VERSION"
git push

echo "✅ Homebrew formula updated to v$VERSION"
```

Make executable:
```bash
chmod +x update-brew.sh
```

Usage:
```bash
./update-brew.sh 2.1.3
```

## Testing Before Publishing

Always test locally:
```bash
brew uninstall termbuddy
brew untap RussellPetty/termbuddy
brew tap RussellPetty/termbuddy
brew install termbuddy --verbose
termbuddy --version
```

## Troubleshooting

### "SHA256 mismatch" error
Recalculate the SHA256 and update the formula.

### "Formula not found"
Make sure the file is at: `Formula/termbuddy.rb` (capital F)

### Testing changes
```bash
brew audit --strict Formula/termbuddy.rb
brew style Formula/termbuddy.rb
```
