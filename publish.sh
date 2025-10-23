#!/bin/bash

# Dual package publishing script for Terminal Buddy
# Publishes to both termbuddy and rose-cli packages

set -e

echo "🚀 Publishing Terminal Buddy to npm..."
echo ""

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "Version: $VERSION"
echo ""

# Publish as termbuddy
echo "📦 Publishing as termbuddy..."
sed -i 's/"name": "rose-cli"/"name": "termbuddy"/' package.json
npm publish
echo "✅ termbuddy@$VERSION published"
echo ""

# Publish as rose-cli
echo "📦 Publishing as rose-cli..."
sed -i 's/"name": "termbuddy"/"name": "rose-cli"/' package.json
npm publish
echo "✅ rose-cli@$VERSION published"
echo ""

echo "🎉 Both packages published successfully!"
echo ""
echo "Verify:"
echo "  npm view termbuddy version"
echo "  npm view rose-cli version"
