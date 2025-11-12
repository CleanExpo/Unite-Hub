#!/bin/bash

# Quick fix script for port mismatches in .env.local

echo "🔧 Fixing port mismatches in .env.local..."
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo "❌ Error: .env.local not found"
  exit 1
fi

# Backup original file
cp .env.local .env.local.backup
echo "✅ Backup created: .env.local.backup"

# Fix port 3000 → 3008
sed -i 's|http://localhost:3000|http://localhost:3008|g' .env.local

echo "✅ Updated NEXTAUTH_URL → http://localhost:3008"
echo "✅ Updated GMAIL_REDIRECT_URI → http://localhost:3008/api/integrations/gmail/callback"
echo "✅ Updated GOOGLE_CALLBACK_URL → http://localhost:3008/api/integrations/gmail/callback"
echo "✅ Updated NEXT_PUBLIC_URL → http://localhost:3008"
echo ""
echo "🎉 Port fixes complete!"
echo ""
echo "⚠️  IMPORTANT: Update Google Cloud Console"
echo "   Go to: https://console.cloud.google.com/apis/credentials"
echo "   Update authorized redirect URIs to:"
echo "   → http://localhost:3008/api/integrations/gmail/callback"
echo ""
echo "📝 Test your setup:"
echo "   npm run dev"
echo "   curl http://localhost:3008/api/test/db"
