#!/bin/bash
# Quick deployment script for Space Games Collection

echo "🚀 Space Games Collection - Deployment Script"
echo "============================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📝 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: Space Games Collection"
    echo "✅ Git repository initialized"
else
    echo "📝 Updating Git repository..."
    git add .
    git commit -m "Update: $(date)"
    echo "✅ Changes committed"
fi

echo ""
echo "🌐 Choose deployment method:"
echo "1. GitHub Pages (Free)"
echo "2. Netlify (Free tier)"
echo "3. Vercel (Free tier)"
echo "4. Firebase Hosting (Free tier)"
echo "5. Manual (just prepare files)"

read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo "🐱 Deploying to GitHub Pages..."
        if command -v gh-pages &> /dev/null; then
            gh-pages -d .
            echo "✅ Deployed to GitHub Pages!"
            echo "🌐 Your game will be available at:"
            echo "   https://yourusername.github.io/repository-name/menu.html"
        else
            echo "❌ gh-pages not installed. Run: npm install -g gh-pages"
        fi
        ;;
    2)
        echo "🌐 Deploying to Netlify..."
        if command -v netlify &> /dev/null; then
            netlify deploy --prod --dir .
            echo "✅ Deployed to Netlify!"
        else
            echo "❌ Netlify CLI not installed. Run: npm install -g netlify-cli"
            echo "💡 Alternative: Visit netlify.com and drag your project folder"
        fi
        ;;
    3)
        echo "▲ Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
            echo "✅ Deployed to Vercel!"
        else
            echo "❌ Vercel CLI not installed. Run: npm install -g vercel"
        fi
        ;;
    4)
        echo "🔥 Deploying to Firebase..."
        if command -v firebase &> /dev/null; then
            firebase deploy
            echo "✅ Deployed to Firebase!"
        else
            echo "❌ Firebase CLI not installed. Run: npm install -g firebase-tools"
        fi
        ;;
    5)
        echo "📦 Preparing files for manual deployment..."
        echo "✅ Files are ready for upload to any web hosting service"
        echo "📁 Upload all files to your web server's public directory"
        ;;
    *)
        echo "❌ Invalid choice"
        ;;
esac

echo ""
echo "🎮 Deployment Tips:"
echo "• Make sure to update ad codes with real AdSense IDs"
echo "• Configure custom domain in your hosting platform"
echo "• Set up Google Analytics for tracking"
echo "• Test your game on different devices"
echo ""
echo "🌟 Your Space Games Collection is ready to play worldwide!"
