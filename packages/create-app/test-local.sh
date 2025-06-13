#!/bin/bash

# Test script for create-app with local packages
set -e

echo "🧪 Testing @manifold-studio/create-app with local packages"

# Clean up any existing test project
rm -rf test-local-project

# Step 1: Build all packages
echo "📦 Building all packages..."
npm run build --workspaces

# Step 2: Create global npm links for our packages
echo "🔗 Creating npm links..."
cd packages/wrapper && npm link
cd ../configurator && npm link
cd ../..

# Step 3: Generate test project
echo "🏗️  Generating test project..."
node packages/create-app/bin/index.js test-local-project --no-install

# Step 4: Set up the test project
echo "⚙️  Setting up test project..."
cd test-local-project

# Remove our packages from package.json temporarily
sed -i.bak '/@manifold-studio/d' package.json

# Install base dependencies
npm install

# Restore package.json and link our local packages
mv package.json.bak package.json
npm link @manifold-studio/wrapper @manifold-studio/configurator

echo "✅ Test project created and configured!"
echo ""
echo "To test the project:"
echo "  cd test-local-project"
echo "  npm run dev"
echo ""
echo "To clean up:"
echo "  npm unlink @manifold-studio/wrapper @manifold-studio/configurator"
echo "  cd .. && rm -rf test-local-project"
