#!/bin/bash
# FitForge AI — Mobile Deploy Script
# Rulează după fiecare update de cod

set -e

echo ""
echo "🚀 FitForge AI — Mobile Deploy"
echo "================================"

# 1. Build web
echo ""
echo "🔨 Step 1/3: Building web app..."
npm run build
echo "✅ Build gata!"

# 2. Sync Capacitor
echo ""
echo "📱 Step 2/3: Syncing Capacitor..."
npx cap sync
echo "✅ Sync gata!"

# 3. Instrucțiuni
echo ""
echo "✅ Step 3/3: Gata de upload!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 iOS App Store:"
echo "   npx cap open ios"
echo "   → Product → Archive → Distribute"
echo ""
echo "🤖 Google Play:"
echo "   npx cap open android"  
echo "   → Build → Generate Signed Bundle"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
