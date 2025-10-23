# Package Manager Distribution Guide

This guide explains how to distribute Terminal Buddy through various package managers.

## 📦 NPM (Already Published)

```bash
npm install -g termbuddy
# or
npm install -g rose-cli
```

## 🏛️ AUR (Arch User Repository) - For yay/pacman

### Prerequisites
- AUR account: https://aur.archlinux.org/register
- SSH key added to AUR account

### Steps to Publish to AUR

1. **Test the PKGBUILD locally:**
```bash
cd rose-dev
makepkg -si
# Test that termbuddy works
termbuddy --version
```

2. **Generate .SRCINFO:**
```bash
makepkg --printsrcinfo > .SRCINFO
```

3. **Calculate the SHA256 sum:**
```bash
# Download the tarball
wget https://registry.npmjs.org/termbuddy/-/termbuddy-2.1.0.tgz

# Calculate checksum
sha256sum termbuddy-2.1.0.tgz

# Update sha256sums in PKGBUILD with the actual hash
```

4. **Create AUR repository:**
```bash
git clone ssh://aur@aur.archlinux.org/termbuddy.git aur-termbuddy
cd aur-termbuddy

# Copy files
cp ../PKGBUILD .
cp ../.SRCINFO .

# Commit and push
git add PKGBUILD .SRCINFO
git commit -m "Initial import: termbuddy 2.1.0"
git push
```

5. **Users can now install with:**
```bash
yay -S termbuddy
# or
paru -S termbuddy
```

### Updating AUR Package

When releasing a new version:
```bash
cd aur-termbuddy

# Update pkgver in PKGBUILD
# Download new tarball and update sha256sum
# Increment pkgrel or reset to 1 for new version

makepkg --printsrcinfo > .SRCINFO
git add PKGBUILD .SRCINFO
git commit -m "Update to 2.2.0"
git push
```

## 🍺 Homebrew (macOS/Linux)

### Option 1: Create Your Own Tap (Easiest)

1. **Create a tap repository:**
```bash
# Create repo named: homebrew-termbuddy
# URL will be: https://github.com/RussellPetty/homebrew-termbuddy
```

2. **Add the formula:**
```bash
git clone https://github.com/RussellPetty/homebrew-termbuddy
cd homebrew-termbuddy

# Copy formula
cp ../termbuddy.rb Formula/termbuddy.rb

# Calculate SHA256 for the npm tarball
curl -sL https://registry.npmjs.org/termbuddy/-/termbuddy-2.1.0.tgz | shasum -a 256

# Update the sha256 in termbuddy.rb

git add Formula/termbuddy.rb
git commit -m "Add termbuddy formula"
git push
```

3. **Users can install via:**
```bash
brew tap RussellPetty/termbuddy
brew install termbuddy
```

### Option 2: Submit to homebrew-core (For Popular Packages)

Requirements:
- 75+ GitHub stars
- 30+ forks OR 75+ watchers
- Notable, widespread use for 3+ months
- Stable versioning

Submit PR to: https://github.com/Homebrew/homebrew-core

### Updating Homebrew Formula

```bash
cd homebrew-termbuddy

# Update version and SHA256 in Formula/termbuddy.rb
# Get new SHA256:
curl -sL https://registry.npmjs.org/termbuddy/-/termbuddy-2.2.0.tgz | shasum -a 256

git add Formula/termbuddy.rb
git commit -m "Update to 2.2.0"
git push
```

Users update with:
```bash
brew update
brew upgrade termbuddy
```

## 📋 Official Arch Repositories (pacman)

Getting into official Arch repos is much harder:

1. Package needs significant popularity
2. Must have an Arch Trusted User (TU) sponsor
3. Goes through voting process
4. Must maintain package quality

**Recommendation:** Start with AUR. If package becomes popular, a TU may adopt it.

## 🔄 Automation Ideas

### Automated Publishing Script

Create a release script that:
1. Bumps version in package.json
2. Publishes to npm
3. Updates PKGBUILD version and SHA256
4. Updates Homebrew formula
5. Creates git tags
6. Pushes to AUR and Homebrew tap

Example workflow:
```bash
./release.sh 2.2.0
# - Updates all version numbers
# - Publishes to npm
# - Updates AUR and Homebrew
# - Creates GitHub release
```

## 📚 Resources

- **AUR Wiki:** https://wiki.archlinux.org/title/AUR_submission_guidelines
- **Homebrew Formula Cookbook:** https://docs.brew.sh/Formula-Cookbook
- **NPM Publishing:** https://docs.npmjs.com/cli/v9/commands/npm-publish

## 🎯 Recommended Order

1. ✅ NPM (Done)
2. 🔄 AUR (Easy, use PKGBUILD provided)
3. 🔄 Homebrew Tap (Easy, create your own tap)
4. ⏳ Official repos (Wait for popularity)
