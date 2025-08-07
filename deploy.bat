@echo off
echo 🚀 Space Games Collection - Deployment Script
echo =============================================

REM Check if git is initialized
if not exist ".git" (
    echo 📝 Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit: Space Games Collection"
    echo ✅ Git repository initialized
) else (
    echo 📝 Updating Git repository...
    git add .
    git commit -m "Update: %date% %time%"
    echo ✅ Changes committed
)

echo.
echo 🌐 Choose deployment method:
echo 1. GitHub Pages (Free)
echo 2. Netlify (Free tier)
echo 3. Vercel (Free tier)
echo 4. Firebase Hosting (Free tier)
echo 5. Manual (just prepare files)

set /p choice="Enter choice (1-5): "

if "%choice%"=="1" (
    echo 🐱 Deploying to GitHub Pages...
    where gh-pages >nul 2>nul
    if %errorlevel%==0 (
        gh-pages -d .
        echo ✅ Deployed to GitHub Pages!
        echo 🌐 Your game will be available at:
        echo    https://yourusername.github.io/repository-name/menu.html
    ) else (
        echo ❌ gh-pages not installed. Run: npm install -g gh-pages
    )
) else if "%choice%"=="2" (
    echo 🌐 Deploying to Netlify...
    where netlify >nul 2>nul
    if %errorlevel%==0 (
        netlify deploy --prod --dir .
        echo ✅ Deployed to Netlify!
    ) else (
        echo ❌ Netlify CLI not installed. Run: npm install -g netlify-cli
        echo 💡 Alternative: Visit netlify.com and drag your project folder
    )
) else if "%choice%"=="3" (
    echo ▲ Deploying to Vercel...
    where vercel >nul 2>nul
    if %errorlevel%==0 (
        vercel --prod
        echo ✅ Deployed to Vercel!
    ) else (
        echo ❌ Vercel CLI not installed. Run: npm install -g vercel
    )
) else if "%choice%"=="4" (
    echo 🔥 Deploying to Firebase...
    where firebase >nul 2>nul
    if %errorlevel%==0 (
        firebase deploy
        echo ✅ Deployed to Firebase!
    ) else (
        echo ❌ Firebase CLI not installed. Run: npm install -g firebase-tools
    )
) else if "%choice%"=="5" (
    echo 📦 Preparing files for manual deployment...
    echo ✅ Files are ready for upload to any web hosting service
    echo 📁 Upload all files to your web server's public directory
) else (
    echo ❌ Invalid choice
)

echo.
echo 🎮 Deployment Tips:
echo • Make sure to update ad codes with real AdSense IDs
echo • Configure custom domain in your hosting platform
echo • Set up Google Analytics for tracking
echo • Test your game on different devices
echo.
echo 🌟 Your Space Games Collection is ready to play worldwide!
pause
