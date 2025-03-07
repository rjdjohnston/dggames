// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Player object
let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 50,
    width: 50,
    height: 20,
    speed: 5
};

// Alien group properties
let alienGroup = {
    x: 50,
    y: 50,
    speed: 1,
    direction: 1
};

// Create aliens (5 rows, 10 columns)
let aliens = [];
for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 10; col++) {
        aliens.push({
            row: row,
            col: col,
            alive: true
        });
    }
}

// Bullets arrays
let bullets = []; // Player bullets
let alienBullets = []; // Alien bullets

// Keyboard input
let keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Update game state
function update() {
    // Player movement
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }

    // Player shooting (spacebar, one bullet at a time)
    if (keys[' '] && bullets.length === 0) {
        bullets.push({
            x: player.x + player.width / 2 - 2.5,
            y: player.y,
            width: 5,
            height: 10,
            speed: 5
        });
    }

    // Move player bullets (upwards)
    bullets.forEach(bullet => bullet.y -= bullet.speed);
    bullets = bullets.filter(bullet => bullet.y >= 0);

    // Move alien bullets (downwards)
    alienBullets.forEach(bullet => bullet.y += bullet.speed);
    alienBullets = alienBullets.filter(bullet => bullet.y < canvas.height);

    // Alien shooting (1% chance per frame)
    let aliveAliens = aliens.filter(alien => alien.alive);
    if (aliveAliens.length > 0 && Math.random() < 0.01) {
        let randomAlien = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
        let alienX = alienGroup.x + randomAlien.col * 50 + 15; // Center of alien
        let alienY = alienGroup.y + randomAlien.row * 40 + 20; // Bottom of alien
        alienBullets.push({
            x: alienX,
            y: alienY,
            width: 5,
            height: 10,
            speed: 3
        });
    }

    // Move aliens
    alienGroup.x += alienGroup.speed * alienGroup.direction;
    let leftEdge = alienGroup.x;
    let rightEdge = alienGroup.x + 10 * 50; // 10 aliens, 50px spacing
    if (leftEdge <= 0 || rightEdge >= canvas.width) {
        alienGroup.direction *= -1;
        alienGroup.y += 20;
    }

    // Bullet-alien collisions
    bullets.forEach(bullet => {
        aliens.forEach(alien => {
            if (alien.alive) {
                let alienX = alienGroup.x + alien.col * 50;
                let alienY = alienGroup.y + alien.row * 40;
                if (bullet.x < alienX + 30 &&
                    bullet.x + bullet.width > alienX &&
                    bullet.y < alienY + 20 &&
                    bullet.y + bullet.height > alienY) {
                    alien.alive = false;
                    bullets = []; // Remove bullet (only one allowed)
                }
            }
        });
    });

    // Alien bullet-player collisions
    alienBullets.forEach(bullet => {
        if (bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {
            alert('Game Over');
            resetGame();
        }
    });

    // Check if aliens reach bottom
    aliens.forEach(alien => {
        if (alien.alive) {
            let alienY = alienGroup.y + alien.row * 40;
            if (alienY >= canvas.height - 100) {
                alert('Game Over');
                resetGame();
            }
        }
    });

    // Check if all aliens are dead
    if (aliens.every(alien => !alien.alive)) {
        alert('You Win');
        resetGame();
    }
}

// Draw game elements
function draw() {
    // Clear canvas with black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player (white rectangle)
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw aliens (green rectangles)
    aliens.forEach(alien => {
        if (alien.alive) {
            let x = alienGroup.x + alien.col * 50;
            let y = alienGroup.y + alien.row * 40;
            ctx.fillStyle = 'green';
            ctx.fillRect(x, y, 30, 20);
        }
    });

    // Draw player bullets (red)
    ctx.fillStyle = 'red';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw alien bullets (yellow)
    ctx.fillStyle = 'yellow';
    alienBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

// Reset game state
function resetGame() {
    player.x = canvas.width / 2 - 25;
    alienGroup.x = 50;
    alienGroup.y = 50;
    alienGroup.direction = 1;
    aliens.forEach(alien => alien.alive = true);
    bullets = [];
    alienBullets = [];
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();