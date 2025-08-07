// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game mode configuration
let gameMode = {
    name: 'Classic Mode',
    speedMultiplier: 1,
    lives: 3,
    barrierFrequency: 1,
    coinFrequency: 1
};

// Load game mode from localStorage if available
function loadGameMode() {
    const savedMode = localStorage.getItem('gameMode');
    const savedModeName = localStorage.getItem('gameModeName');
    
    if (savedMode) {
        gameMode = JSON.parse(savedMode);
        
        // Update the title to show current mode
        if (savedModeName) {
            document.title = `${gameMode.name} - Barrier Dodge Game`;
            
            // Add mode indicator to UI
            const modeIndicator = document.createElement('div');
            modeIndicator.id = 'modeIndicator';
            modeIndicator.textContent = `Mode: ${gameMode.name}`;
            modeIndicator.style.cssText = `
                position: absolute;
                top: 10px;
                left: 10px;
                background: rgba(0, 255, 136, 0.2);
                border: 1px solid #00ff88;
                color: #00ff88;
                padding: 8px 16px;
                font-size: 14px;
                border-radius: 5px;
                font-weight: bold;
            `;
            document.getElementById('gameContainer').appendChild(modeIndicator);
        }
    }
}

// Sound system
let soundEnabled = true;
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Sound generation functions
function createOscillator(frequency, type = 'sine', duration = 0.1) {
    if (!soundEnabled) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playCollectSound() {
    if (!soundEnabled) return;
    // Happy collection sound - ascending notes
    createOscillator(523, 'sine', 0.1); // C5
    setTimeout(() => createOscillator(659, 'sine', 0.1), 50); // E5
    setTimeout(() => createOscillator(784, 'sine', 0.15), 100); // G5
}

function playHitSound() {
    if (!soundEnabled) return;
    // Crash/explosion sound
    createOscillator(150, 'sawtooth', 0.3);
    setTimeout(() => createOscillator(100, 'square', 0.2), 50);
    setTimeout(() => createOscillator(80, 'sawtooth', 0.4), 100);
}

function playLevelUpSound() {
    if (!soundEnabled) return;
    // Victory fanfare
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((note, index) => {
        setTimeout(() => createOscillator(note, 'triangle', 0.2), index * 100);
    });
}

function playGameOverSound() {
    if (!soundEnabled) return;
    // Sad descending sound
    const notes = [523, 466, 415, 349]; // C5 to F4
    notes.forEach((note, index) => {
        setTimeout(() => createOscillator(note, 'sine', 0.4), index * 200);
    });
}

function playEngineSound() {
    if (!soundEnabled) return;
    // Subtle engine hum (very quiet)
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(60, audioContext.currentTime);
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.01, audioContext.currentTime);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const button = document.getElementById('soundToggle');
    button.textContent = soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF';
    
    if (soundEnabled) {
        // Resume audio context if needed
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        playCollectSound(); // Test sound
    }
}

// Game state
let gameRunning = true;
let score = 0;
let lives = gameMode.lives;
let level = 1;
let gameSpeed = 2 * gameMode.speedMultiplier;
let lastTime = 0;
let previousLevel = 1;

// Player object
const player = {
    x: 400,
    y: 500,
    width: 40,
    height: 40,
    speed: 5,
    color: '#00ff00'
};

// Game objects arrays
let barriers = [];
let coins = [];
let particles = [];

// Input handling
const keys = {};

// Event listeners for keyboard input
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.code] = false;
});

// Barrier class
class Barrier {
    constructor(x, y, width, height, speedX = 0, speedY = 2) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = '#ff4444';
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY * gameSpeed;
    }
    
    draw() {
        ctx.save();
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Draw asteroid-like barrier
        ctx.fillStyle = '#ff3333';
        ctx.shadowColor = '#ff3333';
        ctx.shadowBlur = 15;
        
        // Create jagged asteroid shape
        ctx.beginPath();
        const points = 8;
        const outerRadius = this.width / 2;
        const innerRadius = outerRadius * 0.7;
        
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Add darker core
        ctx.fillStyle = '#aa0000';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, outerRadius * 0.4, outerRadius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Add some crater details
        ctx.fillStyle = '#660000';
        ctx.beginPath();
        ctx.ellipse(centerX - 5, centerY - 3, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + 3, centerY + 4, 2, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
    
    isOffScreen() {
        return this.y > canvas.height + 50 || this.x > canvas.width + 50 || this.x < -this.width - 50;
    }
}

// Coin class
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speedY = 1.5;
        this.color = '#ffdd00';
        this.collected = false;
        this.rotation = 0;
    }
    
    update() {
        this.y += this.speedY * gameSpeed;
        this.rotation += 0.1;
    }
    
    draw() {
        ctx.save();
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Draw outer glow
        ctx.shadowColor = '#ffdd00';
        ctx.shadowBlur = 20;
        
        // Draw main coin body (hexagon)
        ctx.fillStyle = '#ffdd00';
        ctx.beginPath();
        const sides = 6;
        const radius = this.width / 2;
        
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides + this.rotation;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Draw inner circle (coin detail)
        ctx.fillStyle = '#fff700';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * 0.6, radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw coin symbol (star)
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        const starPoints = 5;
        const outerR = radius * 0.4;
        const innerR = outerR * 0.4;
        
        for (let i = 0; i < starPoints * 2; i++) {
            const angle = (i * Math.PI) / starPoints + this.rotation;
            const r = i % 2 === 0 ? outerR : innerR;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
    
    isOffScreen() {
        return this.y > canvas.height + 50;
    }
}

// Particle class for effects
class Particle {
    constructor(x, y, color = '#ffffff') {
        this.x = x;
        this.y = y;
        this.speedX = (Math.random() - 0.5) * 6;
        this.speedY = (Math.random() - 0.5) * 6;
        this.size = Math.random() * 4 + 2;
        this.color = color;
        this.life = 1;
        this.decay = 0.02;
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        this.size *= 0.98;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

// Create particles
function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// Collision detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Spawn barriers
function spawnBarrier() {
    const patterns = [
        // Single barrier
        () => [new Barrier(Math.random() * (canvas.width - 60), -50, 60, 100)],
        
        // Two barriers with gap
        () => {
            const gap = 200;
            const x1 = Math.random() * (canvas.width - gap - 120);
            return [
                new Barrier(x1, -50, 60, 100),
                new Barrier(x1 + gap + 60, -50, 60, 100)
            ];
        },
        
        // Moving barrier
        () => [new Barrier(0, -50, 80, 60, 1 + level * 0.2, 1.5)],
        
        // Thin tall barriers
        () => [new Barrier(Math.random() * (canvas.width - 30), -100, 30, 150)]
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    barriers.push(...pattern());
}

// Spawn coins
function spawnCoin() {
    if (Math.random() < 0.3) { // 30% chance to spawn a coin
        const x = Math.random() * (canvas.width - 20);
        coins.push(new Coin(x, -30));
    }
}

// Update player
function updatePlayer() {
    let isMoving = false;
    
    // Handle input
    if ((keys['arrowleft'] || keys['a']) && player.x > 0) {
        player.x -= player.speed;
        isMoving = true;
    }
    if ((keys['arrowright'] || keys['d']) && player.x < canvas.width - player.width) {
        player.x += player.speed;
        isMoving = true;
    }
    if ((keys['arrowup'] || keys['w']) && player.y > 0) {
        player.y -= player.speed;
        isMoving = true;
    }
    if ((keys['arrowdown'] || keys['s']) && player.y < canvas.height - player.height) {
        player.y += player.speed;
        isMoving = true;
    }
    
    // Play engine sound occasionally when moving
    if (isMoving && Math.random() < 0.02) {
        playEngineSound();
    }
}

// Draw player as a spaceship
function drawPlayer() {
    ctx.save();
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    
    // Draw spaceship body (triangle)
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(centerX, player.y); // Top point
    ctx.lineTo(player.x + 5, player.y + player.height - 5); // Bottom left
    ctx.lineTo(player.x + player.width - 5, player.y + player.height - 5); // Bottom right
    ctx.closePath();
    ctx.fill();
    
    // Draw spaceship cockpit
    ctx.fillStyle = '#00aaff';
    ctx.beginPath();
    ctx.ellipse(centerX, player.y + 10, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw engine flames
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff4400';
    ctx.beginPath();
    ctx.ellipse(player.x + 10, player.y + player.height + 5, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.ellipse(player.x + player.width - 10, player.y + player.height + 5, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner flame
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(player.x + 10, player.y + player.height + 3, 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(player.x + player.width - 10, player.y + player.height + 3, 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.restore();
}

// Update game logic
function update(currentTime) {
    if (!gameRunning) return;
    
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    updatePlayer();
    
    // Spawn barriers and coins
    if (Math.random() < (0.02 + level * 0.005) * gameMode.barrierFrequency) {
        spawnBarrier();
    }
    
    if (Math.random() < 0.01 * gameMode.coinFrequency) {
        spawnCoin();
    }
    
    // Update barriers
    for (let i = barriers.length - 1; i >= 0; i--) {
        barriers[i].update();
        
        // Check collision with player
        if (checkCollision(player, barriers[i])) {
            lives--;
            playHitSound(); // Play crash sound
            createParticles(player.x + player.width/2, player.y + player.height/2, '#ff4444', 15);
            barriers.splice(i, 1);
            
            if (lives <= 0) {
                gameOver();
                return;
            }
            continue;
        }
        
        // Remove off-screen barriers
        if (barriers[i].isOffScreen()) {
            barriers.splice(i, 1);
            score += 10; // Points for surviving
        }
    }
    
    // Update coins
    for (let i = coins.length - 1; i >= 0; i--) {
        coins[i].update();
        
        // Check collision with player
        if (checkCollision(player, coins[i])) {
            score += 50;
            playCollectSound(); // Play collection sound
            createParticles(coins[i].x + coins[i].width/2, coins[i].y + coins[i].height/2, '#ffdd00', 8);
            coins.splice(i, 1);
            continue;
        }
        
        // Remove off-screen coins
        if (coins[i].isOffScreen()) {
            coins.splice(i, 1);
        }
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }
    
    // Increase difficulty
    if (score > level * 500) {
        level++;
        gameSpeed += 0.3 * gameMode.speedMultiplier;
        if (player.speed < 8) player.speed += 0.2;
        
        // Play level up sound only once per level
        if (level > previousLevel) {
            playLevelUpSound();
            previousLevel = level;
        }
    }
    
    // Update UI
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
}

// Draw everything
function draw() {
    // Clear canvas with space-like trail effect
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(5, 5, 25, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 15, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars background
    drawStars();
    
    // Draw game objects
    barriers.forEach(barrier => barrier.draw());
    coins.forEach(coin => coin.draw());
    particles.forEach(particle => particle.draw());
    drawPlayer();
}

// Draw animated stars
let stars = [];
function initStars() {
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: Math.random() * 3 + 0.5,
            size: Math.random() * 2 + 0.5,
            twinkle: Math.random() * Math.PI * 2,
            twinkleSpeed: Math.random() * 0.02 + 0.01
        });
    }
}

function drawStars() {
    stars.forEach(star => {
        // Create twinkling effect
        const alpha = 0.3 + Math.sin(star.twinkle) * 0.4;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        
        // Draw star as a small plus shape
        ctx.save();
        ctx.translate(star.x, star.y);
        
        // Horizontal line
        ctx.fillRect(-star.size, -star.size/4, star.size * 2, star.size/2);
        // Vertical line
        ctx.fillRect(-star.size/4, -star.size, star.size/2, star.size * 2);
        
        ctx.restore();
        
        // Update star
        star.y += star.speed;
        star.twinkle += star.twinkleSpeed;
        
        if (star.y > canvas.height) {
            star.y = -10;
            star.x = Math.random() * canvas.width;
        }
    });
}

// Game loop
function gameLoop(currentTime) {
    update(currentTime);
    draw();
    requestAnimationFrame(gameLoop);
}

// Game over
function gameOver() {
    gameRunning = false;
    playGameOverSound(); // Play game over sound
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLevel').textContent = level;
    document.getElementById('gameOver').style.display = 'block';
}

// Restart game
function restartGame() {
    gameRunning = true;
    score = 0;
    lives = gameMode.lives;
    level = 1;
    previousLevel = 1;
    gameSpeed = 2 * gameMode.speedMultiplier;
    player.x = 400;
    player.y = 500;
    player.speed = 5;
    barriers = [];
    coins = [];
    particles = [];
    
    // Resume audio context if needed
    if (soundEnabled && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('score').textContent = '0';
    document.getElementById('lives').textContent = gameMode.lives;
    document.getElementById('level').textContent = '1';
}

// Initialize game
loadGameMode(); // Load game mode first
initStars();
gameLoop(0);

// Ad Management System
let adWatchCount = 0;
let lastAdTime = 0;
const AD_COOLDOWN = 300000; // 5 minutes between ads

// Rewarded Ad Function
function showRewardedAd() {
    const currentTime = Date.now();
    
    // Check cooldown
    if (currentTime - lastAdTime < AD_COOLDOWN) {
        const remainingTime = Math.ceil((AD_COOLDOWN - (currentTime - lastAdTime)) / 60000);
        alert(`Please wait ${remainingTime} more minutes before watching another ad.`);
        return;
    }
    
    // Simulate ad viewing (replace with actual ad network code)
    const confirmed = confirm("Watch a 30-second ad to get an extra life or continue playing?");
    
    if (confirmed) {
        // Simulate ad loading and viewing
        showAdModal();
        lastAdTime = currentTime;
        adWatchCount++;
    }
}

// Ad Modal Simulation
function showAdModal() {
    const modal = document.createElement('div');
    modal.id = 'adModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        color: white;
        font-family: Arial, sans-serif;
    `;
    
    modal.innerHTML = `
        <div style="text-align: center; padding: 40px; background: rgba(255,255,255,0.1); border-radius: 15px; border: 2px solid #00ff88;">
            <h2>🎬 Advertisement</h2>
            <p>Thank you for supporting our game!</p>
            <div id="adTimer" style="font-size: 24px; margin: 20px 0;">30</div>
            <p>Please wait while the ad loads...</p>
            <div style="width: 300px; height: 20px; background: #333; border-radius: 10px; overflow: hidden; margin: 20px auto;">
                <div id="adProgress" style="width: 0%; height: 100%; background: linear-gradient(45deg, #00ff88, #00aaff); transition: width 0.1s;"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Simulate 30-second ad
    let timeLeft = 30;
    const timer = setInterval(() => {
        timeLeft--;
        document.getElementById('adTimer').textContent = timeLeft;
        document.getElementById('adProgress').style.width = ((30 - timeLeft) / 30 * 100) + '%';
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            completeAdReward();
            document.body.removeChild(modal);
        }
    }, 1000);
}

// Reward player after watching ad
function completeAdReward() {
    // Track successful ad completion
    trackAdEvent('rewarded_ad_completed', 'rewarded_video', 0.25); // Estimate $0.25 per rewarded ad
    
    if (gameRunning) {
        // Give extra life during gameplay
        lives++;
        document.getElementById('lives').textContent = lives;
        createParticles(player.x + player.width/2, player.y + player.height/2, '#00ff88', 20);
        
        // Play reward sound
        playCollectSound();
        setTimeout(() => playLevelUpSound(), 200);
        
        alert("🎉 Reward: +1 Extra Life! Thank you for watching!");
        
        // Track engagement boost
        trackAdEvent('extra_life_earned', 'gameplay_boost');
    } else {
        // Continue after game over
        lives = 1;
        gameRunning = true;
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('lives').textContent = lives;
        
        alert("🎉 Continue playing! You have 1 life to keep going!");
        
        // Track retention boost
        trackAdEvent('game_continued', 'retention_boost');
    }
    
    // Update ad statistics
    updateAdStats();
}

// Update ad statistics for optimization
function updateAdStats() {
    const stats = {
        totalAdsWatched: adWatchCount,
        lastAdTime: lastAdTime,
        averageSessionLength: Date.now() - gameStartTime,
        currentLevel: level,
        currentScore: score
    };
    
    localStorage.setItem('gameAdStats', JSON.stringify(stats));
}

// Game start tracking
let gameStartTime = Date.now();

// Analytics tracking (replace with your analytics)
function trackAdEvent(eventName, adType = 'banner', revenue = 0) {
    // Google Analytics 4 Event Tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
            'event_category': 'Advertisement',
            'event_label': adType,
            'value': revenue,
            'custom_parameter_1': gameMode.name,
            'custom_parameter_2': `Level_${level}`
        });
    }
    
    // AdSense Revenue Tracking
    if (typeof adsbygoogle !== 'undefined') {
        // Track ad performance
        console.log(`Ad Event: ${eventName} - Type: ${adType} - Game Mode: ${gameMode.name}`);
    }
    
    // Custom analytics for optimization
    const adData = {
        event: eventName,
        type: adType,
        timestamp: new Date().toISOString(),
        gameMode: gameMode.name,
        playerLevel: level,
        playerScore: score,
        totalAdsWatched: adWatchCount
    };
    
    // Store in localStorage for analysis
    const adHistory = JSON.parse(localStorage.getItem('adAnalytics') || '[]');
    adHistory.push(adData);
    
    // Keep only last 100 events
    if (adHistory.length > 100) {
        adHistory.splice(0, adHistory.length - 100);
    }
    
    localStorage.setItem('adAnalytics', JSON.stringify(adHistory));
    
    console.log(`Ad Event: ${eventName} - Total ads watched: ${adWatchCount}`);
}

// Enhanced ad performance tracking
function initAdTracking() {
    // Track when ads are loaded
    if (typeof adsbygoogle !== 'undefined') {
        // Monitor ad performance
        window.addEventListener('load', () => {
            trackAdEvent('ads_loaded', 'page_load');
        });
    }
    
    // Track user engagement with rewarded ads
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('rewarded-ad-btn')) {
            trackAdEvent('rewarded_ad_clicked', 'rewarded_video');
        }
    });
}

// Revenue optimization functions
function optimizeAdPlacement() {
    // Adjust ad visibility based on game state
    const sidebarAd = document.querySelector('.ad-sidebar');
    
    if (gameRunning && sidebarAd) {
        // Hide sidebar ad during intense gameplay
        if (level > 5 && barriers.length > 3) {
            sidebarAd.style.opacity = '0.3';
        } else {
            sidebarAd.style.opacity = '1';
        }
    }
}

// Call tracking initialization
initAdTracking();
