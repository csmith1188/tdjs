
const frameRate = 60;
const pathPoint = [{ y: 2, x: 0 }, { y: 2, x: 8 }, { y: 12, x: 8 }, { y: 12, x: 16 }, { y: 2, x: 16 }, { y: 2, x: 24 }, { y: 18, x: 24 }, { y: 18, x: 31 }];
var enemies = []
var towers = []
var users = []
var ticks = 0;
var waveQueue = [];
var sectionQueue = [];

// use the format of { enemyType: '<enemy name>', amount: #, spawnInterval: #, wait: # } inside of a list inside the waves list to make a section of a wave
waves = [
    [
        { enemyType: 'normal', amount: 3, spawnInterval: 60, wait: 0 }
    ],
    [
        { enemyType: 'normal', amount: 5, spawnInterval: 60, wait: 0 }
    ],
    [
        { enemyType: 'normal', amount: 5, spawnInterval: 60, wait: 0 },
        { enemyType: 'fast', amount: 3, spawnInterval: 30, wait: 300 }
    ],
    [
        { enemyType: 'normal', amount: 10, spawnInterval: 48, wait: 0 },
        { enemyType: 'fast', amount: 5, spawnInterval: 24, wait: 300 }
    ],
    [
        { enemyType: 'normal', amount: 15, spawnInterval: 42, wait: 0 },
        { enemyType: 'normal', amount: 10, spawnInterval: 30, wait: 300 },
        { enemyType: 'normal', amount: 5, spawnInterval: 18, wait: 600 }
    ],
    [
        { enemyType: 'normal', amount: 10, spawnInterval: 48, wait: 0 },
        { enemyType: 'fast', amount: 5, spawnInterval: 24, wait: 300 },
        { enemyType: 'normal', amount: 10, spawnInterval: 48, wait: 600 }
    ],
    [
        { enemyType: 'normal', amount: 10, spawnInterval: 48, wait: 0 },
        { enemyType: 'slow', amount: 5, spawnInterval: 72, wait: 300 }
    ],
    [
        { enemyType: 'fast', amount: 10, spawnInterval: 30, wait: 0 },
        { enemyType: 'slow', amount: 5, spawnInterval: 60, wait: 300 }
    ],
    [
        { enemyType: 'normal', amount: 10, spawnInterval: 48, wait: 0 },
        { enemyType: 'fast', amount: 5, spawnInterval: 24, wait: 300 },
        { enemyType: 'slow', amount: 3, spawnInterval: 72, wait: 600 }
    ],
    [
        { enemyType: 'normal', amount: 10, spawnInterval: 48, wait: 0 },
        { enemyType: 'boss', amount: 1, spawnInterval: 0, wait: 528 }
    ]

];


// EEEEE   NN  NN   EEEEE   MM   MM   YY   YY
// EE      NNN NN   EE      MMM MMM    YY YY
// EEEEE   NNNNNN   EEEEE   MM M MM     YYY
// EE      NN NNN   EE      MM   MM     YYY
// EEEEE   NN  NN   EEEEE   MM   MM     YYY
class Enemy {
    constructor(enemyType, userIndex, options) {
        this.x = 0;
        this.y = 2;
        this.userIndex = userIndex;
        this.enemyType = enemyType;
        this.healthBorder = options.healthBorder || false;
        this.distanceFromStart = 0
        this.updateStats();
        enemies[this.userIndex].push(this);
        this.updatePosition(this.userIndex);
    }

    updateStats() {
        switch (this.enemyType) {
            case 'normal':
                this.health = 10;
                this.maxHealth = this.health;
                this.speed = 40;
                this.color = 'white';
                this.size = 45;
                break;
            case 'fast':
                this.health = 5;
                this.maxHealth = 5;
                this.speed = 60;
                this.color = 'dodgerblue';
                this.size = 45;
                break;
            case 'slow':
                this.health = 20;
                this.maxHealth = 20;
                this.speed = 30;
                this.color = 'green';
                this.size = 45;
                break;
            case 'boss':
                this.health = 100;
                this.maxHealth = 100;
                this.speed = 10;
                this.color = 'white';
                this.size = 55;
                break;
            // Add other enemy types as needed
        }
        this.updateHealthBorder();
    }

    updateHealthBorder() {
        this.healthPercentage = this.health / this.maxHealth;
        const green = Math.min(255, Math.max(0, 255 * (this.healthPercentage * 2)));
        const red = Math.min(255, Math.max(0, 255 * (2 - this.healthPercentage * 3)));
        this.borderColor = `rgb(${red}, ${green}, 0)`;
    }

    updatePosition() {
        const enemyIndex = enemies[this.userIndex].findIndex(e => e === this);
        this.distanceFromStart++
        if (enemyIndex !== -1) {
            enemies[this.userIndex][enemyIndex] = this;
        }

    }

    move() {
        const currentPoint = pathPoint.find(point => point.x === this.x && point.y === this.y);
        if (currentPoint) {
            const currentIndex = pathPoint.indexOf(currentPoint);
            if (currentIndex < pathPoint.length - 1) {
                this.nextX = pathPoint[currentIndex + 1].x;
                this.nextY = pathPoint[currentIndex + 1].y;
            } else {
                enemies[this.userIndex].splice(enemies[this.userIndex].indexOf(this), 1)
            }
        }

        // Move towards the target cell
        if (this.x < this.nextX) {
            this.x += this.speed / 1000;
            if (this.x > this.nextX) {
                this.x = this.nextX;
            }
        } else if (this.x > this.nextX) {
            this.x -= this.speed / 1000;
            if (this.x < this.nextX) {
                this.x = this.nextX;
            }
        } else if (this.y < this.nextY) {
            this.y += this.speed / 1000;
            if (this.y > this.nextY) {
                this.y = this.nextY;
            }
        } else if (this.y > this.nextY) {
            this.y -= this.speed / 1000;
            if (this.y < this.nextY) {
                this.y = this.nextY;
            }
        }
        this.updatePosition();
    }
}

//   TTTTTTT    OOOOO    WW   WW   EEEEE   RRRR     SSS 
//   TTTTTTT   OOO OOO   WW W WW   EE      R   R   S    
//     TTT     OO   OO   WW W WW   EEEE    RRRR     SSS 
//     TTT     OOO OOO   WW W WW   EE      R   R       S
//     TTT      OOOOO     WW WW    EEEEE   R   R    SSS 

class Tower {
    constructor(presetTower, userIndex, options, y, x, range, damage, fireRate, targetingType, projectileType) {
        this.x = x;
        this.y = y;
        this.userIndex = userIndex;
        this.userCode = null;
        switch (presetTower) {
            case 'basic':
                this.size = 10
                this.color = 'lightblue'
                this.range = 4;
                this.damage = 2;
                this.fireRate = 2;
                this.name = 'Basic';
                break;
            case 'sniper':
                this.size = 10
                this.color = 'lightcoral'
                this.range = 8;
                this.damage = 10;
                this.fireRate = 0.5;
                this.name = 'Sniper';
                break;
            case 'machineGun':
                this.size = 10
                this.color = 'lightgreen'
                this.range = 3;
                this.damage = 1;
                this.fireRate = 10;
                this.name = 'MachineGun';
                break;
        }
        this.shootLocation = null;
        this.damageCount = 0;
        this.targetingType = 'first';
    }

    findTarget() {

        this.getEnemies = () => {
            return enemies[this.userIndex];
        }
        this.getDistance = (enemy) => {
            return Math.sqrt(Math.pow(enemy.x - this.x, 2) + Math.pow(enemy.y - this.y, 2));
        }
        this.getDistanceFromStart = (enemy) => {
            return enemy.distanceFromStart;
        }
        try {
            eval(this.userCode);

        } catch (error) {
            console.log(error);
        }
        // this.getEnemies().forEach(enemy => {
        //     this.shoot(enemy);
        // });

    };

    shoot(target) {
        const enemyInstance = target;
        console.log(enemyInstance);

        if (!enemyInstance) {
            this.shootLocation = null;
            return;
        }
        this.shootLocation = { x: enemyInstance.x, y: enemyInstance.y };
        if (enemyInstance.health <= this.damage) {
            this.damageCount += enemyInstance.health;
        } else {
            this.damageCount += this.damage;
        }
        enemyInstance.health -= this.damage;
        if (enemyInstance.health <= 0) {
            const index = enemies[this.userIndex].indexOf(enemyInstance);
            if (index > -1) {
                enemies[this.userIndex].splice(index, 1);
            }
        }
        if (enemyInstance.healthBorder) {
            enemyInstance.updateHealthBorder();
        }
    }
}

//   GGGGGGG     RRRRRRRRR    IIIIIIIIII   DDDDDDDDD
//  GGG   GGG    RRR    RRR      III       DDD    DDD 
// GGG     GGG   RRR    RRR      III       DDD    DDD
// GGG           RRRRRRRRR       III       DDD    DDD
// GGG  GGGGGG   RRR  RRR        III       DDD    DDD
//  GGG   GGG    RRR   RRR       III       DDD    DDD       
//   GGGGGGG     RRR   RRR       III       DDDDDDDDD
function initializeGrid(rows, cols) {
    const grid = [];
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            row.push({ hasPath: false, isStart: false, isEnd: false });
        }
        grid.push(row);
    }
    return grid;
}

function calculatePath(grid) {
    grid[2][0].isStart = true;
    grid[18][31].isEnd = true;

    for (let i = 0; i < pathPoint.length - 1; i++) {
        const start = pathPoint[i];
        const end = pathPoint[i + 1];
        const xDiff = end.x - start.x;
        const yDiff = end.y - start.y;
        const xDirection = xDiff > 0 ? 1 : -1;
        const yDirection = yDiff > 0 ? 1 : -1;

        if (xDiff !== 0) {
            for (let j = 0; j <= Math.abs(xDiff); j++) {
                grid[start.y][start.x + j * xDirection].hasPath = true;
            }
        } else {
            for (let j = 0; j <= Math.abs(yDiff); j++) {
                grid[start.y + j * yDirection][start.x].hasPath = true;
            }
        }
    }
    return grid;
}

//  OOO    TTTTT   H   H    EEEEE    RRRR
// O   O     T     H   H    EE       R   R
// O   O     T     HHHHH    EEEE     RRRR
// O   O     T     H   H    EE       R  R
//  OOO      T     H   H    EEEEE    R   R

function connection(socket, io) {
    socket.id = socket.request.session.user;
    console.log('A user connected,', socket.id);
    if (!users.find(user => user.id === socket.id)) {
        users.push({ id: socket.id, userIndex: 'temp', socket: 'temp', userCode: null });
        enemies.push([]);
        towers.push([]);
        waveQueue.push([]);
        sectionQueue.push([]);
    }

    const userIndex = users.findIndex(user => user.id === socket.id);
    users[userIndex].userIndex = userIndex;
    users[userIndex].socket = socket;
    const rows = 20;
    const cols = 32;
    let grid = initializeGrid(rows, cols);
    global.rows = rows;
    global.cols = cols;
    global.grid = calculatePath(grid);
    let tower = new Tower('basic', userIndex, {}, 10, 10);
    towers[userIndex].push(tower);
    socket.emit('gameData', [{ grid, rows, cols }, enemies[userIndex], towers[userIndex]]);

    socket.on('towerPlace', placementInformation => {
        let x = Math.floor(placementInformation.x)
        let y = Math.floor(placementInformation.y)
        if (!grid[y][x].hasPath && !towers[userIndex].find(tower => tower.x === x && tower.y === y)) {
            towers[userIndex].push(new Tower(placementInformation.tower, userIndex, {}, y, x));

        }


    })

    socket.on('userProgram', (program) => {

        if (!program.includes('console.log')) {
            towers[userIndex][0].userCode = program;
        } else {
            console.log('Program contains statements that will not be executed.');
        }
    });

    socket.on('startWave', waveIndex => {
        if (waveIndex || waveIndex === 0) {
            const waveCopy = JSON.parse(JSON.stringify(waves[waveIndex]));
            waveQueue[userIndex].push({ wave: waveCopy, userIndex });
        }
    });

    socket.on('spawnEnemies', (enemyType, amount, spawnInterval, wait) => {
        sectionQueue[userIndex].push({ section: { enemyType, amount, spawnInterval, wait }, userIndex, timeAfterLastSpawn: 0 });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected,', socket.id);
    });
};

let gameLoop = setInterval(() => {
    ticks++;
    users.forEach((user) => {
        let userIndex = user.userIndex;
        let socket = user.socket;
        // Ensures that the user is still connected
        if (userIndex != -1) {
            // Handles the movement of each enemy
            enemies[userIndex].forEach((enemy) => {
                enemy.move();
            });
            // Handles the shooting of each tower
            towers[userIndex].forEach(tower => {
                const currentTime = ticks;
                if (tower.shootLocation && currentTime - tower.lastShotTime >= 5) {
                    tower.shootLocation = null;
                }
                if (!tower.lastShotTime || currentTime - tower.lastShotTime >= frameRate / tower.fireRate) {
                    tower.lastShotTime = currentTime;
                    tower.findTarget();
                }
            });
            // Handles the wave queue and sends the sections of the wave to the section queue
            if (waveQueue[userIndex].length > 0) {
                if (waveQueue[userIndex][0].wave.length > 0) {
                    const request = waveQueue[userIndex][0];
                    let currentSection = request.wave[0];
                    const currentTime = ticks;
                    if (currentTime - ticks >= currentSection.wait) {
                        sectionQueue[userIndex].push({ section: currentSection, userIndex, timeAfterLastSpawn: 0 });
                        request.wave.splice(0, 1);
                        if (request.wave.length > 0) {
                            currentSection = request.wave[0];
                        } else {
                            waveQueue[userIndex].splice(0, 1);
                        }

                    } else {
                        currentSection.wait -= 1;
                    }
                } else {
                    waveQueue[userIndex].splice(0, 1);
                }
            }
            // Handles the section queue and spawns enemies from the queue
            if (sectionQueue[userIndex].length > 0) {
                const request = sectionQueue[userIndex][0];
                let currentSection = request.section;
                if (request.timeAfterLastSpawn >= currentSection.spawnInterval) {
                    new Enemy(currentSection.enemyType, userIndex, { healthBorder: true });
                    request.timeAfterLastSpawn = 0;
                    request.section.amount--;
                    if (request.section.amount <= 0) {
                        sectionQueue[userIndex].splice(0, 1);
                    }
                } else {
                    request.timeAfterLastSpawn++;
                }
            }
        }
        // Sends the game data to the client
        socket.emit('gameData', [{ grid, rows, cols }, enemies[userIndex], towers[userIndex]]);

    });
}, 1000 / frameRate);

module.exports = {
    connection
};