const vm = require('vm')
const acorn = require('acorn')
const walk = require('acorn-walk');
const { log } = require('console');
const { name } = require('ejs');
const frameRate = 60;
const pathPoint = [{ y: 2, x: 0 }, { y: 2, x: 8 }, { y: 12, x: 8 }, { y: 12, x: 16 }, { y: 2, x: 16 }, { y: 2, x: 24 }, { y: 18, x: 24 }, { y: 18, x: 31 }];
const pathPoint2 = [{ y: 2, x: 0 }, { y: 2, x: 25 }, { y: 6, x: 25 }, { y: 6, x: 8 }, { y: 10, x: 8 }, { y: 10, x: 16 }, { y: 14, x: 16 }, { y: 14, x: 24 }, { y: 18, x: 24 }, { y: 18, x: 31 }];
const pathPoint3 = [{ y: 2, x: 0 }, { y: 2, x: 3 }, { y: 6, x: 3 }, { y: 6, x: 5 }, { y: 10, x: 5 }, { y: 10, x: 7 }, { y: 6, x: 7 }, { y: 6, x: 9 }, { y: 10, x: 9 }, { y: 10, x: 11 }, { y: 6, x: 11 }, { y: 6, x: 13 }, { y: 10, x: 13 }, { y: 10, x: 15 }, { y: 6, x: 15 }, { y: 6, x: 17 }, { y: 10, x: 17 }, { y: 10, x: 19 }, { y: 6, x: 19 }, { y: 6, x: 21 }, { y: 10, x: 21 }, { y: 10, x: 23 }, { y: 6, x: 23 }, { y: 6, x: 25 }, { y: 10, x: 25 }, { y: 10, x: 27 }, { y: 6, x: 27 }, { y: 6, x: 29 }, { y: 10, x: 29 }, { y: 10, x: 31 }, { y: 18, x: 31 }];
const pathPoint4 = [{ y: 2, x: 0 }, { y: 2, x: 15 }, { y: 10, x: 15 }, { y: 10, x: 11 }, { y: 6, x: 11 }, { y: 6, x: 19 }, { y: 10, x: 19 }, { y: 10, x: 15 }, { y: 18, x: 15 }, { y: 18, x: 31 }];
const pathPoint5 = [{ y: 2, x: 0 }, { y: 2, x: 15 }, { y: 10, x: 15 }, { y: 10, x: 11 }, { y: 6, x: 11 }, { y: 6, x: 19 }, { y: 2, x: 19 }, { y: 2, x: 15 }, { y: 18, x: 15 }, { y: 18, x: 31 }];
const users = new Map();
var ticks = 0;

// use the format of { enemyType: '<enemy name>', amount: #, spawnInterval: #, wait: # } inside of a list inside the waves list to make a section of a wave
waves = [
    [
        { enemyType: 'pop-up', amount: 3, spawnInterval: 15, wait: 0 },
        { enemyType: 'trickster', amount: 3, spawnInterval: 30, wait: 0 }
    ],
    [
        { enemyType: 'sprinter', amount: 5, spawnInterval: 60, wait: 0 }
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
        this.initialize(enemyType, userIndex, options);
    }

    initialize(enemyType, userId, options) {
        this.x = 0;
        this.y = 2;
        this.userId = userId; // Replace userIndex with userId
        this.enemyType = enemyType;
        this.healthBorder = options.healthBorder || false;
        this.distanceFromStart = 0;
        this.statuses = []; // Array to store active statuses
        this.size = 32;
        this.currentIndex = 0;
        this.nextX = undefined;
        this.nextY = undefined;

        // Initialize original stats and effective stats
        this.updateStats();
        this.effectiveStats = {
            speed: this.speed,
            armor: 0
        };

        const user = users.get(this.userId);
        if (user) {
            user.enemies.push(this); // Add the enemy to the user's enemies array
        }
        this.updatePosition();
    }

    reset() {
        // Reset all properties to default values
        this.x = 0;
        this.y = 2;
        this.userId = null; // Replace userIndex with userId
        this.enemyType = null;
        this.healthBorder = false;
        this.distanceFromStart = 0;
        this.statuses = [];
        this.size = 32;
        this.effectiveStats = {
            speed: 0,
            armor: 0
        };
    }

    addStatus(status, customDuration = null, strength = 1) {
        // Check if the status already exists
        const existingStatusIndex = this.statuses.findIndex(s => s.type === status.type);

        if (existingStatusIndex !== -1) {
            const existingStatus = this.statuses[existingStatusIndex];

            // Compare strengths
            if (strength > existingStatus.strength) {

                // Replace the existing status with the new one
                this.statuses[existingStatusIndex] = new Status(
                    status.type,
                    customDuration !== null ? customDuration : status.duration,
                    status.effect,
                    strength
                );
            } else if (strength === existingStatus.strength) {
                // Compare durations if strengths are equal
                const newDuration = customDuration !== null ? customDuration : status.duration;
                if (newDuration > existingStatus.duration) {
                    // Replace the existing status with the new one
                    this.statuses[existingStatusIndex] = new Status(
                        status.type,
                        newDuration,
                        status.effect,
                        strength
                    );
                }
            }
            // If the new status is weaker or has a shorter duration, discard it
            return;
        }

        // If the status doesn't exist, add it
        const clonedStatus = new Status(
            status.type,
            customDuration !== null ? customDuration : status.duration,
            status.effect,
            strength
        );
        this.statuses.push(clonedStatus);
    }

    updateStatuses() {
        // Reset effective stats to original stats before applying statuses
        this.effectiveStats.speed = this.speed;
        this.effectiveStats.health = this.health;
        this.effectiveStats.armor = 0; // Reset armor or other stats

        this.statuses = this.statuses.filter(status => {
            status.apply(this); // Apply the status effect
            status.decrementDuration(); // Decrease the duration
            return !status.isExpired(); // Keep only active statuses
        });
    }

    updateStats() {
        // Set original stats based on enemy type
        switch (this.enemyType) {
            case 'normal':
                this.health = 10;
                this.maxHealth = this.health;
                this.speed = 40;
                this.color = 'white';
                break;
            case 'fast':
                this.health = 5;
                this.maxHealth = 5;
                this.speed = 60;
                this.color = 'dodgerblue';
                break;
            case 'slow':
                this.health = 20;
                this.maxHealth = 20;
                this.speed = 30;
                this.color = 'green';
                break;
            case 'boss':
                this.health = 100;
                this.maxHealth = 100;
                this.speed = 10;
                this.color = 'white';
                break;
            case 'camo':
                this.health = 50;
                this.maxHealth = 100;
                this.speed = 30;
                this.color = 'purple';
                break;
            case 'pop-up':
                this.health = 50;
                this.maxHealth = 100;
                this.speed = 30;
                this.color = 'red';
                break;
            case 'sprinter':
                this.health = 50;
                this.maxHealth = 100;
                this.speed = 25;
                this.color = 'pink';
                this.addStatus(boostStatus, 180, 4);
                break;
            case 'trickster':
                this.health = 1;
                this.maxHealth = 100;
                this.speed = 70;
                this.color = 'orange';
                this.addStatus(slowStatus, 180, 4);
                break;

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
        const user = users.get(this.userId);
        if (user) {
            const enemyIndex = user.enemies.findIndex(e => e === this);
            if (enemyIndex !== -1) {
                user.enemies[enemyIndex] = this;
            }
        }
    }

    move() {
        this.updateStatuses(); // Update statuses before moving

        // Check if the enemy has reached the current target point
        if (this.nextX === undefined || this.nextY === undefined || (this.x === this.nextX && this.y === this.nextY)) {
            if (this.currentIndex < pathPoint.length - 1) {
                this.currentIndex++;
                const nextPoint = pathPoint[this.currentIndex];
                this.nextX = nextPoint.x;
                this.nextY = nextPoint.y;
            } else {
                // Handle reaching the end of the path
                const user = users.get(this.userId);
                if (user) {
                    user.health -= this.effectiveStats.health;
                    user.enemies.splice(user.enemies.indexOf(this), 1);
                    if (user.health <= 0) {
                        user.health = 0;
                        user.gameOver = true;
                        user.gameIsRunning = false;
                    }
                }
                return;
            }
        }

        // Calculate movement
        const speed = this.effectiveStats.speed / 1000;
        const dx = this.nextX - this.x;
        const dy = this.nextY - this.y;

        if (dx !== 0) {
            this.x += Math.sign(dx) * Math.min(speed, Math.abs(dx));
            this.x = Math.round(this.x * 1000) / 1000;
        } else if (dy !== 0) {
            this.y += Math.sign(dy) * Math.min(speed, Math.abs(dy));
            this.y = Math.round(this.y * 1000) / 1000;
        }

        this.distanceFromStart += speed;
        this.updatePosition();
    }
}

class EnemyPool {
    constructor(size) {
        this.pool = [];
        this.activeEnemies = new Set(); // Track active enemies for debugging or reuse

        for (let i = 0; i < size; i++) {
            this.pool.push(new Enemy(null, null, {})); // Pre-allocate Enemy objects
        }
    }

    getEnemy(enemyType, userIndex, options) {
        if (this.pool.length > 0) {
            const enemy = this.pool.pop();
            enemy.initialize(enemyType, userIndex, options); // Reinitialize the enemy
            this.activeEnemies.add(enemy); // Track the active enemy
            return enemy;
        } else {
            console.warn('Enemy pool is empty! Consider increasing the pool size.');
            return null; // Return null instead of creating a new enemy
        }
    }

    releaseEnemy(enemy) {
        if (this.activeEnemies.has(enemy)) {
            this.activeEnemies.delete(enemy); // Remove from active enemies
            enemy.reset(); // Reset the enemy to its default state
            this.pool.push(enemy); // Return the enemy to the pool
        } else {
            console.warn('Attempted to release an enemy that is not active.');
        }
    }

    expand(amount) {
        for (let i = 0; i < amount; i++) {
            this.pool.push(new Enemy(null, null, {})); // Add new Enemy objects to the pool
        }
    }

    shrink(amount) {
        if (amount > this.pool.length) {
            console.warn('Cannot shrink the pool by more than its current size.');
            amount = this.pool.length; // Limit the shrink amount to the current pool size
        }
        this.pool.splice(0, amount); // Remove the specified number of enemies from the pool
    }
}

//   TTTTTTT    OOOOO    WW   WW   EEEEE   RRRR     SSS 
//   TTTTTTT   OOO OOO   WW W WW   EE      R   R   S    
//     TTT     OO   OO   WW W WW   EEEE    RRRR     SSS 
//     TTT     OOO OOO   WW W WW   EE      R   R       S
//     TTT      OOOOO     WW WW    EEEEE   R   R    SSS 

class Tower {
    constructor(presetTower, user, options, y, x, range, damage, fireRate, targetingType, projectileType) {
        this.x = x;
        this.y = y;
        this.index = users.get(user).towers.length;
        this.userId = user;
        this.userCode = null;
        this.statuses = []; // Array to store active statuses
        this.inflictStatuses = [];
        this.upgradePath = null; // No path chosen initially
        this.upgradeLevel = 0; // Start at level 0

        // Initialize original stats and effective stats
        this.updateStats(presetTower);
        this.effectiveStats = {
            range: this.range,
            damage: this.damage,
            fireRate: this.fireRate
        };

        this.shootLocation = null;
        this.damageCount = 0;
        this.targetingType = 'first';
    }

    updateStats(presetTower) {
        const upgradePaths = {
            basic: {
                path1: [
                    { name: 'Extended Range', range: 4, damage: 2, fireRate: 2, price: 10 },
                    { name: 'Improved Damage', range: 5, damage: 3, fireRate: 2.5, price: 20 },
                    { name: 'Advanced Targeting', range: 6, damage: 4, fireRate: 3, price: 30 }
                ],
                path2: [
                    { name: 'High Impact', range: 3, damage: 5, fireRate: 1.5, price: 15 },
                    { name: 'Enhanced Power', range: 4, damage: 7, fireRate: 2, price: 25 },
                    { name: 'Devastating Force', range: 5, damage: 10, fireRate: 2.5, price: 40 }
                ]
            },
            sniper: {
                path1: [
                    { name: 'Precision Scope', range: 8, damage: 10, fireRate: 0.5, price: 20 },
                    { name: 'Long Range Shot', range: 9, damage: 15, fireRate: 0.6, price: 40 },
                    { name: 'Deadly Accuracy', range: 10, damage: 20, fireRate: 0.7, price: 60 }
                ],
                path2: [
                    { name: 'Rapid Fire', range: 7, damage: 12, fireRate: 0.8, price: 25 },
                    { name: 'Powerful Strike', range: 8, damage: 18, fireRate: 1, price: 50 },
                    { name: 'Ultimate Sniper', range: 9, damage: 25, fireRate: 1.2, price: 75 }
                ]
            }
        };

        if (this.upgradePath) {
            const stats = upgradePaths[presetTower][this.upgradePath][this.upgradeLevel];
            this.range = stats.range;
            this.damage = stats.damage;
            this.fireRate = stats.fireRate;
            this.price = stats.price;
        } else {
            // Default stats for the base tower
            switch (presetTower) {
                case 'basic':
                    this.size = 10;
                    this.color = 'lightblue';
                    this.range = 4;
                    this.damage = 2;
                    this.fireRate = 2;
                    this.name = 'Basic';
                    this.price = 10;
                    break;
                case 'sniper':
                    this.size = 10;
                    this.color = 'lightcoral';
                    this.range = 8;
                    this.damage = 10;
                    this.fireRate = 0.5;
                    this.name = 'Sniper';
                    this.price = 20;
                    break;
                case 'machineGun':
                    this.size = 10;
                    this.color = 'lightgreen';
                    this.range = 3;
                    this.damage = 1;
                    this.fireRate = 10;
                    this.name = 'MachineGun';
                    this.price = 15;
                    break;
                case 'slowTower':
                    this.size = 10;
                    this.color = 'lightyellow';
                    this.range = 4;
                    this.damage = 0;
                    this.fireRate = 2;
                    this.name = 'SlowTower';
                    this.inflictStatuses.push(slowStatus);
                    this.price = 15;
                    break;

                case 'poisonTower':
                    this.size = 10;
                    this.color = 'limegreen';
                    this.range = 4;
                    this.damage = 0;
                    this.fireRate = 0.5;
                    this.name = 'PoisonTower';
                    this.inflictStatuses.push(poisonStatus);
                    this.price = 20;
                    break;
                    // CANNON IS A WORK IN PROGRESS
                case 'cannon':
                    this.size = 10;
                    this.color = 'black';
                    this.range = 5;
                    this.damage = 5;
                    this.fireRate = 1;
                    this.name = 'Cannon';
                    this.price = 20;
                    break;
            }
            this.shootLocation = null;
            this.damageCount = 0;
            this.lastShotTime = 0;
        }
    }

    chooseUpgradePath(path) {
        if (!this.upgradePath) {
            // If no path is chosen yet, allow the user to choose this path
            this.upgradePath = path;
            console.log(`Upgrade path ${path} chosen.`);
        } else if (this.upgradePath !== path) {
            // If the user tries to choose a different path after the first choice
            console.log('Upgrade path already chosen and cannot be changed.');
        }
    }

    upgrade() {
        const user = users.get(this.userId);
        if (user) {
            const primaryMaxUpgradeLevel = 3; // Maximum upgrade level for the primary path
            const secondaryMaxUpgradeLevel = 2; // Maximum upgrade level for secondary paths
    
            if (!this.upgradePath) {
                console.log('No upgrade path chosen. Please choose a path first.');
                return;
            }
    
            if (this.upgradeLevel < primaryMaxUpgradeLevel) {
                const upgradeCost = this.price;
                if (user.money >= upgradeCost) {
                    user.money -= upgradeCost;
                    this.upgradeLevel++;
                    this.updateStats(this.name.toLowerCase());
                    console.log(`Tower upgraded to level ${this.upgradeLevel} on path ${this.upgradePath}`);
    
                    // If the tower reaches tier 3, lock other paths to tier 2
                    if (this.upgradeLevel === primaryMaxUpgradeLevel) {
                        user.towers.forEach(tower => {
                            if (tower !== this && tower.upgradeLevel > secondaryMaxUpgradeLevel) {
                                tower.upgradeLevel = secondaryMaxUpgradeLevel;
                                tower.updateStats(tower.name.toLowerCase());
                                console.log(`Other paths limited to tier ${secondaryMaxUpgradeLevel}`);
                            }
                        });
                    }
                } else {
                    console.log('Not enough money to upgrade.');
                }
            } else {
                console.log('Tower is already at max level for this path.');
            }
        }
    }

    addStatus(status, customDuration = null, strength = 1) {
        // Clone the status before adding it
        const clonedStatus = new Status(
            status.type,
            customDuration !== null ? customDuration : status.duration, // Use custom duration if provided
            status.effect,
            strength // Pass the strength to the cloned status
        );
        this.statuses.push(clonedStatus);
    }

    updateStatuses() {
        // Reset effective stats to original stats before applying statuses
        this.effectiveStats.range = this.range;
        this.effectiveStats.damage = this.damage;
        this.effectiveStats.fireRate = this.fireRate;

        this.statuses = this.statuses.filter(status => {
            status.apply(this); // Apply the status effect
            status.decrementDuration(); // Decrease the duration
            return !status.isExpired(); // Keep only active statuses
        });
    }

    findTarget(ticks) {
        this.updateStatuses(); // Update statuses before finding a target

        this.currentTime = ticks;

        this.getEnemies = () => {
            const user = users.get(this.userId);
            return user ? user.enemies : [];
        };

        this.findFirst = () => {
            let farthestEnemy = null;
            let maxDistance = -Infinity;

            for (const enemy of this.getEnemiesInRange()) {
                const distanceFromStart = enemy.distanceFromStart;
                if (distanceFromStart > maxDistance) {
                    maxDistance = distanceFromStart;
                    farthestEnemy = enemy;
                }
            }

            return farthestEnemy;
        };

        this.getEnemiesInRange = () => {
            const enemies = this.getEnemies();
            const enemiesInRange = [];
            for (const enemy of enemies) {
                if (this.inRange(enemy)) {
                    enemiesInRange.push(enemy);
                }
            }

            return enemiesInRange;
        };

        this.inRange = (enemy) => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= this.effectiveStats.range;
        };

        this.canShoot = () => {
            return this.currentTime - this.lastShotTime >= (frameRate / this.effectiveStats.fireRate);
        };

        if (this.userCode && !this.scriptIsRunning) {
            this.scriptIsRunning = true;

            let script = new vm.Script(this.userCode.program);
            let context = vm.createContext(this.userCode.sandbox);

            try {
                const sanitizeData = (data, seen = new WeakSet()) => {
                    if (typeof data !== 'object' || data === null) {
                        return data;
                    }

                    if (seen.has(data)) {
                        return; // Prevent infinite recursion
                    }
                    seen.add(data);

                    if (Array.isArray(data)) {
                        return data.map(item => sanitizeData(item, seen));
                    }

                    const sanitized = {};
                    for (const key in data) {
                        try {
                            if (typeof data[key] === 'function') {
                                sanitized[key] = data[key];
                            } else {
                                sanitized[key] = sanitizeData(data[key], seen);
                            }
                        } catch (err) {
                            console.warn(`Failed to sanitize key "${key}":`, err.message);
                        }
                    }
                    return sanitized;
                };

                this.userCode.sandbox = sanitizeData(this.userCode.sandbox);

                script.runInContext(context, { timeout: 50 }); // Increased timeout to 50ms
            } catch (err) {
                console.error('Error running script:', err);
            } finally {
                script = null;
            }
            this.scriptIsRunning = false;
        }
    }

    shoot(target, currentTime) {
        const enemyInstance = target;

        if (!enemyInstance) {
            this.shootLocation = null;
            return;
        }

        this.lastShotTime = currentTime;
        this.shootLocation = { x: enemyInstance.x, y: enemyInstance.y };

        const user = users.get(this.userId);
        if (user) {
            const projectile = projectilePool.getProjectile(
                this.x,
                this.y,
                enemyInstance.x,
                enemyInstance.y,
                .1, // Speed of the projectile
                this.effectiveStats.damage, // Damage of the projectile
                'normal', // Type of the projectile
                'red', // Color of the projectile
                this.userId, // User ID associated with the projectile
            );

            if (projectile) {
                user.projectiles.push(projectile);
            }
        }
    }
}

// Projectiles
class Projectile {
    constructor(presetProjectile, userId, x, y, targetX, targetY, speed, damage, projectileType, color, size, pierce) {
        this.initialize(x, y, targetX, targetY, speed, damage, projectileType, color, userId, size, pierce);
    }

    initialize(x, y, targetX, targetY, speed, damage, projectileType, color, userId, size, pierce) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = speed;
        this.size = size || 5; // Default size if not provided
        this.damage = damage;
        this.pierce = pierce || 5; // Default pierce if not provided
        this.projectileType = projectileType; // Type of projectile (e.g., 'normal', 'explosive')
        this.color = color; // Color of the projectile
        this.userId = userId; // User ID associated with the projectile
        this.lifeTime = 6; // Lifetime in ticks
        this.directionX = null; // Direction vector for movement
        this.directionY = null; // Direction vector for movement
        this.noHitList = []; // List of enemies that the projectile has already hit
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.speed = 0;
        this.damage = 0;
        this.type = null; // Reset type to null
        this.color = null; // Reset color to null
        this.directionX = null; // Reset direction vector
        this.directionY = null; // Reset direction vector
        this.noHitList = []; // Reset noHitList
        this.pierce = undefined; // Reset pierce to null
        this.size = 5; // Reset size to default
        users.get(this.userId).projectiles.splice(users.get(this.userId).projectiles.indexOf(this), 1); // Remove from user's projectiles
        projectilePool.pool.push(this);
        projectilePool.activeProjectiles.delete(this); // Remove from active projectiles
    }

    move() {
        if (!this.directionX && !this.directionY) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance === 0) {
                this.reset();
                return;
            }

            this.directionX = dx / distance;
            this.directionY = dy / distance;
        }

        // Move the projectile
        this.x += this.directionX * this.speed;
        this.y += this.directionY * this.speed;

        // Check for collisions with enemies
        const user = users.get(this.userId);
        if (user) {
            if (this.lifeTime > 0) {
                for (let i = user.enemies.length - 1; i >= 0; i--) {
                    const enemy = user.enemies[i];
                    const projectileRadius = 1;

                    const distanceToEnemy = Math.sqrt(
                        Math.pow(enemy.x - this.x, 2) + Math.pow(enemy.y - this.y, 2)
                    );

                    if (distanceToEnemy <= projectileRadius) {
                        if (!this.noHitList.includes(enemy)) {
                            this.noHitList.push(enemy); // Add enemy to noHitList to prevent multiple hits
                            // Deal damage to the enemy
                            enemy.health -= this.damage;
                            if (enemy.health <= 0) {
                                user.money += enemy.maxHealth; // Reward money for defeating the enemy
                                user.enemies.splice(i, 1); // Remove enemy from active list
                                enemyPool.releaseEnemy(enemy); // Return enemy to the pool
                            }
                            // Handle piercing
                            this.pierce--;
                            if (this.pierce <= 0) {
                                this.reset(); // Reset the projectile
                                return; // Stop processing further collisions
                            }
                        }
                    }
                }
            } else {
                this.reset(); // Reset the projectile if its lifetime is 0 or less
            }
        }

        // Reduce lifetime and remove if expired
        this.lifeTime-=this.speed;
        if (this.lifeTime <= 0) {
            this.reset()
            return; // Stop processing further collisions
        }
    }
}

class ProjectilePool {
    constructor(size) {
        this.pool = [];
        this.activeProjectiles = new Set(); // Track active projectiles for debugging or reuse

        for (let i = 0; i < size; i++) {
            this.pool.push(new Projectile(0, 0, 0, 0, 0, 0, '', '')); // Pre-allocate Projectile objects
        }
    }

    getProjectile(x, y, targetX, targetY, speed, damage, type, color, userId, pierce) {
        if (this.pool.length > 0) {
            const projectile = this.pool.pop();
            projectile.x = x;
            projectile.y = y;
            projectile.targetX = targetX;
            projectile.targetY = targetY;
            projectile.speed = speed;
            projectile.damage = damage;
            projectile.type = type;
            projectile.color = color;
            projectile.userId = userId;
            projectile.pierce = pierce || 5; // Default pierce if not provided
            this.activeProjectiles.add(projectile); // Track the active projectile
            return projectile;
        } else {
            console.warn('Projectile pool is empty! Consider increasing the pool size.');
            return null; // Return null instead of creating a new projectile
        }
    }

    expand(amount) {
        for (let i = 0; i < amount; i++) {
            this.pool.push(new Projectile(0, 0, 0, 0, 0, 0, '', '')); // Add new Projectile objects to the pool
        }
    }

    shrink(amount) {
        if (amount > this.pool.length) {
            console.warn('Cannot shrink the pool by more than its current size.');
            amount = this.pool.length; // Limit the shrink amount to the current pool size
        }
        this.pool.splice(0, amount); // Remove the specified number of projectiles from the pool
    }
}

// Statuses
class Status {
    constructor(type, duration, effect, strength = 1) {
        this.type = type; // e.g., 'slow', 'boost', 'poison'
        this.duration = duration; // Duration in ticks
        this.effect = effect; // Function to apply the effect
        this.strength = strength; // Strength of the effect
    }

    apply(target) {
        // Apply the effect to the target's effective stats
        if (this.effect) {
            this.effect(target.effectiveStats, this.strength);
        }
    }

    decrementDuration() {
        this.duration--; // Reduce the duration by 1 tick
    }

    isExpired() {
        return this.duration <= 0; // Check if the status has expired
    }
}

const slowStatus = new Status(
    'slow',
    100, // Default duration in ticks
    (effectiveStats, strength) => {
        effectiveStats.speed *= (0.5 / strength);
    }
);
const boostStatus = new Status(
    'boost',
    100, // Default duration in ticks
    (effectiveStats, strength) => {
        effectiveStats.speed *= strength / 0.5;
    }
);
const poisonStatus = new Status(
    'poison',
    100, // Default duration in ticks
    (target, strength) => {
        // Reduce health directly on the target
        target.health -= strength;
    },
    1 // Default strength
);

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
    global.socket = socket;
    global.io = io;
    socket.id = socket.request.session.user;
    console.log('A user connected,', socket.id);
    const userId = socket.id;

    if (!users.has(userId)) {
        users.set(userId, {
            id: userId,
            enemies: [],
            towers: [],
            projectiles: [],
            waveQueue: [],
            sectionQueue: [],
            health: 100,
            money: 0,
            currentWave: -1,
            gameIsRunning: true,
            gameOver: false,
            settings: {},
            socket: socket
        });
    } else {
        users.get(userId).socket = socket;
    }
    const rows = 20;
    const cols = 32;
    let grid = initializeGrid(rows, cols);
    global.rows = rows;
    global.cols = cols;
    global.grid = calculatePath(grid);
    let user = users.get(userId);
    if (user) {
        socket.emit('gameData', {
            grid,
            rows,
            cols,
            enemies: user.enemies.map(({ x, y, health }) => ({ x, y, health })),
            towers: user.towers.map(({ x, y, range }) => ({ x, y, range }))
        });
    }

    socket.on('towerPlace', placementInformation => {
        let user = users.get(socket.id);
        if (user) {
            let x = Math.floor(placementInformation.x);
            let y = Math.floor(placementInformation.y);
            if (!grid[y][x].hasPath && !user.towers.find(tower => tower.x === x && tower.y === y)) {
                user.towers.push(new Tower(placementInformation.tower, socket.id, {}, y, x));
                socket.emit('towerSelected', user.towers[user.towers.length - 1]);
            }
        }
    });

    socket.on('towerSelect', towerSelect => {
        let user = users.get(socket.id);
        if (user) {
            let x = towerSelect.x;
            let y = towerSelect.y;
            const tower = user.towers.find(tower => tower.x === x && tower.y === y);
            socket.emit('towerSelected', tower || null);
        }
    });

    const acorn = require('acorn');
    const { simple: walkSimple } = require('acorn-walk');

    socket.on('userProgram', (program, tower) => {
        let user = users.get(socket.id);
        if (user) {
            const towerIndex = tower;
            const allowedFunctions = {
                getEnemies: () => user.towers[towerIndex].getEnemies(),
                inRange: enemy => user.towers[towerIndex].inRange(enemy),
                findFirst: () => user.towers[towerIndex].findFirst(),
                canShoot: () => user.towers[towerIndex].canShoot(),
                shoot: target => user.towers[towerIndex].shoot(target, ticks),
            };

            const prohibitedKeywords = [
                'String', 'fromCharCode', 'eval', 'Function', 'constructor', 'global', 'process',
                'Buffer', 'require', 'setTimeout', 'setInterval', 'Reflect', 'Proxy', 'vm',
                'child_process', 'console', 'this'
            ];

            try {
                // Check for prohibited keywords
                for (const keyword of prohibitedKeywords) {
                    if (program.includes(keyword)) {
                        throw new Error(`Prohibited keyword detected: "${keyword}"`);
                    }
                }

                // Parse the program into an AST
                const ast = acorn.parse(program, { ecmaVersion: 2020 });

                // Walk through the AST to detect prohibited patterns
                walkSimple(ast, {
                    WithStatement(node) {
                        throw new Error('Prohibited statement: "with" is not allowed.');
                    },
                    WhileStatement(node) {
                        if (node.test.type === 'Literal' && node.test.value === true) {
                            throw new Error('Prohibited statement: Infinite loop detected.');
                        }
                    },
                    CallExpression(node) {
                        if (
                            node.callee.type === 'MemberExpression' &&
                            node.callee.object.type === 'Identifier' &&
                            node.callee.object.name === 'String' &&
                            node.callee.property.type === 'Identifier' &&
                            node.callee.property.name === 'fromCharCode'
                        ) {
                            throw new Error('Prohibited statement: Use of "String.fromCharCode" is not allowed.');
                        }
                    },
                    MemberExpression(node) {
                        if (
                            node.object.type === 'Identifier' &&
                            node.object.name === 'String' &&
                            node.property.type === 'Identifier' &&
                            node.property.name === 'fromCharCode'
                        ) {
                            throw new Error('Prohibited statement: Use of "String.fromCharCode" is not allowed.');
                        }
                    },
                    BinaryExpression(node) {
                        if (
                            node.operator === '+' &&
                            (node.left.type === 'Literal' && typeof node.left.value === 'string' ||
                                node.right.type === 'Literal' && typeof node.right.value === 'string')
                        ) {
                            throw new Error('Prohibited statement: String concatenation is not allowed.');
                        }
                    },
                    AssignmentExpression(node) {
                        if (
                            node.operator === '+=' &&
                            node.left.type === 'Identifier' &&
                            node.right.type === 'Literal' &&
                            typeof node.right.value === 'string'
                        ) {
                            throw new Error('Prohibited statement: String concatenation using "+=" is not allowed.');
                        }
                    },
                    TemplateLiteral(node) {
                        throw new Error('Prohibited statement: Template literals are not allowed.');
                    },
                    Identifier(node) {
                        if (prohibitedKeywords.includes(node.name)) {
                            throw new Error(`Prohibited statement: Use of "${node.name}" is not allowed.`);
                        }
                    },
                    Literal(node) {
                        if (typeof node.value === 'string') {
                            throw new Error('Prohibited statement: String literals are not allowed.');
                        }
                    }
                });

                // Create a sandbox for execution
                const sandbox = {
                    ...allowedFunctions,
                    tower: user.towers[tower],
                    global: undefined,
                    process: undefined,
                    constructor: undefined,
                    this: undefined,
                    Function: undefined,
                    eval: undefined,
                    setTimeout: undefined,
                    setInterval: undefined,
                    Reflect: undefined,
                    Proxy: undefined,
                    Buffer: undefined,
                    console: undefined,
                    vm: undefined,
                    require: undefined,
                    child_process: undefined,
                };

                // // Execute the program in the sandbox
                // const vm = require('vm');
                // const script = new vm.Script(program);
                // const context = vm.createContext(sandbox);
                // script.runInContext(context, { timeout: 250 });

                // Save the program to the tower
                user.towers[tower].userCode = { program, sandbox };
                console.log('Program executed successfully:', program);
            } catch (error) {
                if (error.message.includes('Script execution timed out')) {
                    console.error('Error: Script execution timed out.');
                    socket.emit('errorMessage', 'Your program took too long to execute.');
                } else {
                    console.error('Error executing user program:', error.message);
                    socket.emit('errorMessage', `An error occurred: ${error.message}`);
                }
            }
        }
    });

    socket.on('getTowerList', () => {
        const towerTypes = [
            { name: 'basic', price: 10, range: 4, damage: 2, fireRate: 2 },
            { name: 'sniper', price: 20, range: 8, damage: 10, fireRate: 0.5 },
            { name: 'machineGun', price: 15, range: 3, damage: 1, fireRate: 10 },
            { name: 'slowTower', price: 15, range: 4, damage: 0, fireRate: 2 },
            {name: 'cannon', price: 20, range: 5, damage: 5, fireRate: 1},
            { name: 'poisonTower', price: 20, range: 4, damage: 0, fireRate: 5 }
        ];
        socket.emit('towerList', towerTypes);
    });

    socket.on('placingTower', (tower) => {
        const towerName = tower.name;
        const towerSwitch = Tower.toString().match(/switch\s*\(presetTower\)\s*{([\s\S]*?)}/);
        if (towerSwitch && towerSwitch[1]) {
            const cases = towerSwitch[1].match(/case\s*'([^']+)'[\s\S]*?this\.color\s*=\s*'([^']+)'/g);
            if (cases) {
                const towerCase = cases.find(caseStatement => caseStatement.includes(`case '${towerName}'`));
                if (towerCase) {
                    const color = towerCase.match(/this\.color\s*=\s*'([^']+)'/)[1];
                    const rgbaColor = color.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/, 'rgba($1, $2, $3, 0.25)');
                    socket.emit('placingTower', { x: tower.x, y: tower.y, rgbaColor });
                }
            }
        }
    })

    socket.on('chooseUpgradePath', ({ towerIndex, path }) => {
        let user = users.get(socket.id);
        if (user) {
            const tower = user.towers[towerIndex];
            if (tower) {
                tower.chooseUpgradePath(path);
                socket.emit('upgradePathChosen', user.towers[towerIndex]);
            }
        }
    });

    socket.on('upgradeTower', (towerIndex) => {
        let user = users.get(socket.id);
        if (user) {
            const tower = user.towers[towerIndex];
            if (tower) {
                tower.upgrade();
                socket.emit('towerUpgraded', user.towers[towerIndex]);
            }
        }
    });

    socket.on('sellTower', (towerIndex) => {
        let user = users.get(socket.id);
        if (user) {
            const tower = user.towers[towerIndex];
            if (tower) {
                user.money += tower.price;
                user.towers.splice(towerIndex, 1);
            }
            user.towers.forEach((tower, index) => {
                tower.index = index;
            });
        }
    });

    socket.on('startWave', waveIndex => {
        let user = users.get(socket.id);
        if (user && (waveIndex || waveIndex === 0)) {
            const waveCopy = JSON.parse(JSON.stringify(waves[waveIndex]));
            user.waveQueue.push({ wave: waveCopy, userId: socket.id });
        }
    });

    socket.on('sendWave', () => {
        const user = users.get(userId);
        if (user) {
            if (user.gameOver || !user.gameIsRunning || user.currentWave >= waves.length - 1 || user.waveQueue.length > 0 || user.sectionQueue.length > 0 || user.enemies.length > 0) return;
            user.currentWave++;
            const waveCopy = JSON.parse(JSON.stringify(waves[user.currentWave]));
            user.waveQueue.push({ wave: waveCopy, userId });
        }
    })

    socket.on('restartGame', () => {
        let user = users.get(socket.id);
        if (user) {
            user.gameIsRunning = true;
            user.gameOver = false;
            user.enemies = [];
            user.towers = [];
            user.waveQueue = [];
            user.sectionQueue = [];
            user.health = 100;
            user.money = 0;
            user.currentWave = -1;
        }
    });

    socket.on('spawnEnemies', (enemyType, amount, spawnInterval, wait) => {
        let user = users.get(socket.id);
        if (user) {
            user.sectionQueue.push({ section: { enemyType, amount, spawnInterval, wait }, userId: socket.id, timeAfterLastSpawn: 0 });
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected,', socket.id);
    });
};

// Create global enemy and projectile pools
let enemyPoolSize = 2500; // Initial size
let projectilePoolSize = 1000; // Initial size
const enemyPool = new EnemyPool(enemyPoolSize);
const projectilePool = new ProjectilePool(projectilePoolSize);

// Function to adjust pool sizes dynamically
function adjustPoolSizes() {
    const activeUsers = users.size; // Get the number of active users
    const enemiesPerUser = 500; // Number of enemies per user
    const projectilesPerUser = 500; // Number of projectiles per user

    // Calculate new pool sizes
    const newEnemyPoolSize = activeUsers * enemiesPerUser;
    const newProjectilePoolSize = activeUsers * projectilesPerUser;

    // Adjust enemy pool size
    if (newEnemyPoolSize > enemyPoolSize) {
        enemyPool.expand(newEnemyPoolSize - enemyPoolSize); // Add more enemies
    } else if (newEnemyPoolSize < enemyPoolSize) {
        enemyPool.shrink(enemyPoolSize - newEnemyPoolSize); // Remove excess enemies
    }
    enemyPoolSize = newEnemyPoolSize;

    // Adjust projectile pool size
    if (newProjectilePoolSize > projectilePoolSize) {
        projectilePool.expand(newProjectilePoolSize - projectilePoolSize); // Add more projectiles
    } else if (newProjectilePoolSize < projectilePoolSize) {
        projectilePool.shrink(projectilePoolSize - newProjectilePoolSize); // Remove excess projectiles
    }
    projectilePoolSize = newProjectilePoolSize;
}

let gameLoop = setInterval(() => {
    ticks++;

    adjustPoolSizes(); // Adjust pool sizes based on active users
   

    for (var [userId, userMap] of users) {
        let user = userMap

        if (user.gameOver || !user.gameIsRunning) continue;

        // Cache user data
        const { enemies, towers, waveQueue, sectionQueue } = user;

        // Update enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].move();
        }

        // Update towers
        for (const tower of towers) {
            tower.findTarget(ticks);
            if (ticks - tower.lastShotTime >= 30) {
                tower.shootLocation = null;
            }
        }

        // Update projectiles
        for (let i = user.projectiles.length - 1; i >= 0; i--) {
            const projectile = user.projectiles[i];
            projectile.move();
            if (projectile.lifeTime <= 0) {
                projectile.reset();
                user.projectiles.splice(i, 1); // Remove expired projectiles
                projectilePool.pool.push(projectile); // Return to the pool
            }
        }

        // Process wave queue
        if (waveQueue.length > 0) {
            const request = waveQueue[0];
            const currentSection = request.wave[0];

            if (currentSection.wait <= 0) {
                sectionQueue.push({ section: currentSection, userId, timeAfterLastSpawn: 0 });
                request.wave.shift();
                if (request.wave.length === 0) waveQueue.shift();
            } else {
                currentSection.wait--;
            }
        }

        // Process section queue
        if (sectionQueue.length > 0) {
            const request = sectionQueue[0];
            const { section } = request;

            if (request.timeAfterLastSpawn >= section.spawnInterval) {
                const enemy = enemyPool.getEnemy(section.enemyType, userId, { healthBorder: true });
                if (enemy) {
                    request.timeAfterLastSpawn = 0;
                    section.amount--;

                    if (section.amount <= 0) sectionQueue.shift();
                }
            } else {
                request.timeAfterLastSpawn++;
            }
        }

        // Release enemies when they are defeated
        for (let i = user.enemies.length - 1; i >= 0; i--) {
            const enemy = user.enemies[i];
            if (enemy.health <= 0) {
                user.money += enemy.maxHealth; // Reward money for defeating the enemy
                user.enemies.splice(i, 1); // Remove from active enemies
                enemyPool.releaseEnemy(enemy); // Return the enemy to the pool
            }
        }

        // Send minimal game data to the client
        if (user) {
            let socket = user.socket;
            socket.emit('gameData', {
                gridData: { grid, rows, cols },
                enemyData: user.enemies,
                towerData: user.towers,
                projectileData: user.projectiles,
                health: user.health,
                money: user.money,
                wave: user.currentWave,
                gameOverStatus: user.gameOver,
                gameRunningStatus: user.gameIsRunning,
            });
        }
    }
}, 1000 / frameRate);

module.exports = {
    connection
};