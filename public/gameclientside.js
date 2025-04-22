const socket = io();
const spacing = 32; // Change this to adjust the size of the grid cell and quality of each cell
var selectedBuyableTower = null;
var selectedTower = null;
var currentGrid, currentRows, currentCols, currentEnemies, currentTowers, currentBaseHealth, currentMoney, currentWave;

const gameBoard = document.getElementById('gameBoard');
const ratio = getCanvasRatio(gameBoard);
const ctx = gameBoard.getContext('2d');
var towerShop = document.getElementById("gameMenu");
var towerList = [];
let previewTower = null; // To store the current preview tower position

socket.emit('getTowerList');
socket.on('towerList', (data) => {
    getShopItems(data);
});

function drawGrid(grid, rows, cols) {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (grid[i][j].hasPath) {
                if (grid[i][j].isStart) {
                    ctx.fillStyle = 'lightblue';
                } else if (grid[i][j].isEnd) {
                    ctx.fillStyle = 'lightcoral';
                } else {
                    ctx.fillStyle = 'black';
                }
            } else {
                ctx.fillStyle = 'darkgreen';
            }
            ctx.fillRect(j * spacing, i * spacing, spacing, spacing);
        }
    }
}

function drawEnemy(enemy) {
    const { x, y, color, size } = enemy;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x * spacing + spacing / 2, y * spacing + spacing / 2, size / 2, 0, 2 * Math.PI);
    ctx.fill();
}

function selectTower(rows, cols) {
    const selectHandler = (event) => {
        const rect = gameBoard.getBoundingClientRect();
        const cellWidth = rect.width / cols;
        const cellHeight = rect.height / rows;
        const x = Math.floor((event.clientX - (rect.left + window.scrollX)) / cellWidth);
        const y = Math.floor((event.clientY - (rect.top + window.scrollY)) / cellHeight);
        socket.emit('towerSelect', { x, y });
    };

    gameBoard.addEventListener('click', selectHandler);
}
selectTower(20, 32);

function drawTower(tower) {
    const { x, y, color, size } = tower;
    ctx.fillStyle = color;
    ctx.fillRect(x * spacing, y * spacing, spacing, spacing);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(x * spacing, y * spacing, spacing, spacing);
    if (tower.shootLocation != null) {
        // Calculate the angle between the tower and the shoot location
        const dx = tower.shootLocation.x - tower.x;
        const dy = tower.shootLocation.y - tower.y;
        const angle = Math.atan2(dy, dx);

        // Draw the line
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tower.x * spacing + spacing / 2, tower.y * spacing + spacing / 2);
        ctx.lineTo(tower.shootLocation.x * spacing + spacing / 2, tower.shootLocation.y * spacing + spacing / 2);
        ctx.stroke();
    }
}

function drawPreviewTower() {
    if (!previewTower) return;

    const { x, y } = previewTower;
    ctx.globalAlpha = 0.5; // Set transparency
    ctx.fillStyle = 'gray';
    ctx.fillRect(x * spacing, y * spacing, spacing, spacing);
    ctx.globalAlpha = 1.0; // Reset transparency
}

function handleMouseMove(event) {
    if (!selectedBuyableTower) return;

    const rect = gameBoard.getBoundingClientRect();
    const cellWidth = rect.width / 32;
    const cellHeight = rect.height / 20;
    const x = Math.floor((event.clientX - (rect.left + window.scrollX)) / cellWidth);
    const y = Math.floor((event.clientY - (rect.top + window.scrollY)) / cellHeight);

    // Update the preview tower position
    previewTower = { x, y, name: selectedBuyableTower };

    // Redraw the game board to include the preview
    drawGame(currentGrid, currentRows, currentCols, currentEnemies, currentTowers, currentBaseHealth, currentMoney, currentWave);
}

function handleTowerPlacement(event) {
    const rect = gameBoard.getBoundingClientRect();
    const cellWidth = rect.width / 32;
    const cellHeight = rect.height / 20;
    const x = Math.floor((event.clientX - (rect.left + window.scrollX)) / cellWidth);
    const y = Math.floor((event.clientY - (rect.top + window.scrollY)) / cellHeight);

    socket.emit('towerPlace', { x, y, tower: selectedBuyableTower });
    selectedBuyableTower = null;
    previewTower = null; // Clear the preview
    gameBoard.removeEventListener('mousemove', handleMouseMove);
    gameBoard.removeEventListener('click', handleTowerPlacement);
}

function enableTowerPlacement() {
    gameBoard.addEventListener('mousemove', handleMouseMove);
    gameBoard.addEventListener('click', handleTowerPlacement);
}

function getShopItems(towerList) {
    towerList.forEach(tower => {
        const itemPrice = document.createElement('p');
        itemPrice.innerHTML = tower.price;
        itemPrice.style.color = "black";
        itemPrice.style.fontSize = "1vw";
        itemPrice.style.position = "relative";
        itemPrice.style.bottom = "0";
        itemPrice.style.margin = "0";
        itemPrice.style.left = "auto";
        const item = document.createElement('button');
        item.name = tower.name;
        item.innerHTML = tower.name;
        const sideLength = towerShop.offsetWidth * 0.5; // Calculate side length based on 50% of the parent width
        item.style.width = `${sideLength}px`;
        item.style.height = `${sideLength}px`;
        item.style.backgroundColor = "white";
        item.addEventListener('mouseover', function () {
            item.style.backgroundColor = "gray";
            item.style.cursor = "pointer";
        });
        item.addEventListener('mouseout', function () {
            item.style.backgroundColor = "white";
            item.style.cursor = "default";
        });
        item.addEventListener('click', function () {
            if (selectedBuyableTower === item.name) {
                selectedBuyableTower = null;
                previewTower = null;
                gameBoard.removeEventListener('mousemove', handleMouseMove);
                gameBoard.removeEventListener('click', handleTowerPlacement);
            } else {
                selectedBuyableTower = item.name;
                enableTowerPlacement();
            }
        });
        item.className = 'towerShopItem';
        item.appendChild(itemPrice);
        towerShop.appendChild(item);
    });
}

function resizeShopItems() {
    const items = towerShop.getElementsByClassName('towerShopItem');
    const sideLength = towerShop.offsetWidth * 0.5; // Calculate side length based on 50% of the parent width
    for (let i = 0; i < items.length; i++) {
        items[i].style.width = `${sideLength}px`;
        items[i].style.height = `${sideLength}px`;
    }
}

function getCanvasRatio(canvas) {
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    const internalWidth = canvas.width;
    const internalHeight = canvas.height;

    // Calculate the pixel ratio
    const ratioX = internalWidth / cssWidth;
    const ratioY = internalHeight / cssHeight;

    // Return the average ratio (assuming uniform scaling)
    return (ratioX + ratioY) / 2;
}

function adjustAspectRatio() {
    const targetAspectRatio = 4 / 3; // Desired aspect ratio
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const gamePage = document.getElementById('gamePage');

    // Calculate the maximum size that fits within the viewport while maintaining the aspect ratio
    let scaledWidth, scaledHeight;

    if (viewportWidth / viewportHeight > targetAspectRatio) {
        // Viewport is wider than the target aspect ratio
        scaledHeight = viewportHeight;
        scaledWidth = scaledHeight * targetAspectRatio;
    } else {
        // Viewport is taller than the target aspect ratio
        scaledWidth = viewportWidth;
        scaledHeight = scaledWidth / targetAspectRatio;
    }

    // Apply the calculated dimensions to the gamePage element
    gamePage.style.width = `${scaledWidth}px`;
    gamePage.style.height = `${scaledHeight}px`;

    // Center the gamePage element within the viewport
    gamePage.style.position = 'absolute';
    gamePage.style.left = `${(viewportWidth - scaledWidth) / 2}px`;
    gamePage.style.top = `${(viewportHeight - scaledHeight) / 2}px`;

    // Ensure gameMenu stays aligned to the right side of the gamePage
    const gameMenu = document.getElementById('gameMenu');
    if (gameMenu) {
        gameMenu.style.position = 'absolute';
        gameMenu.style.top = '0';
        gameMenu.style.right = '0';
    }
}

window.addEventListener('resize', adjustAspectRatio);
window.addEventListener('load', adjustAspectRatio);

function drawGame(grid, rows, cols, enemies, towers, baseHealth, money, wave) {
    // Clear the canvas
    ctx.clearRect(0, 0, gameBoard.width, gameBoard.height);

    // Redraw the grid
    drawGrid(grid, rows, cols);

    // Draw all enemies
    if (enemies && Array.isArray(enemies)) {
        enemies.forEach(drawEnemy);
    }

    // Draw all towers
    if (towers && Array.isArray(towers)) {
        towers.forEach(drawTower);
    }

    // Draw the preview tower
    drawPreviewTower();

    // Draw game data (baseHealth, money, wave) on the canvas
    ctx.fillStyle = 'white';
    ctx.font = `${64 * ratio}px Arial`; // Scale font size using the canvas ratio
    ctx.textAlign = 'left';

    // Display base health
    ctx.fillText(`Health: ${baseHealth}`, 10, 20);

    // Display money
    ctx.fillText(`Bitpogs: ${money}`, 80, 20);

    // Display wave
    ctx.fillText(`Wave: ${parseInt(wave) + 1} / 10`, 920, 20);
}

function restartGame() {
    socket.emit('restartGame');
}

function runProgram() {
    const programBox = document.getElementById('programBox');
    socket.emit('userProgram', programBox.value, selectedTower.index);
};

function clearProgram() {
    const programBox = document.getElementById('programBox');
    programBox.value = '';
};

// function saveProgram() {
//     const programBox = document.getElementById('programBox');
//     socket.emit('saveProgram', programBox.value, selectedTower.index);
// }

// function loadProgram() {
//     const programBox = document.getElementById('programBox');
//     programBox.value = selectedTower.userCode;
// }

function sendWave() {
    socket.emit('sendWave');
}

socket.on('gameData', (data) => {
    currentGrid = data.gridData.grid;
    currentRows = data.gridData.rows;
    currentCols = data.gridData.cols;
    currentEnemies = data.enemyData;
    currentTowers = data.towerData;
    currentBaseHealth = data.baseHealth;
    currentMoney = data.money;
    currentWave = data.wave;

    const gameOver = data.gameOverStatus;
    const gameRunning = data.gameRunningStatus;

    gameBoard.width = currentCols * spacing;
    gameBoard.height = currentRows * spacing;

    if (!gameOver && gameRunning) {
        document.getElementById('gameOverPage').style.display = 'none';
        drawGame(currentGrid, currentRows, currentCols, currentEnemies, currentTowers, currentBaseHealth, currentMoney, currentWave);
    } else {
        if (gameOver) {
            ctx.clearRect(0, 0, gameBoard.width, gameBoard.height);
            drawGrid(currentGrid, currentRows, currentCols);
            currentEnemies.forEach(enemy => {
                drawEnemy(enemy);
            });
            currentTowers.forEach(tower => {
                drawTower(tower);
            });
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fillRect(0, 0, gameBoard.width, gameBoard.height);
            document.getElementById('gameOverPage').style.display = 'block';
        }
    }
});

socket.on('towerSelected', (data) => {
    const towerX = data.x;
    const towerY = data.y;
    let towerMenu = document.getElementById('towerMenu');
    let programMenu = document.getElementById('programBox');
    let towerRange = document.getElementById('towerRange');
    if (selectedTower == null) {
        towerMenu.style.transition = 'transform 0.3s ease-in-out';
        towerMenu.style.transform = 'translate(0, 0)';
        selectedTower = data;
        if (selectedTower.userCode != null) {
            programMenu.value = selectedTower.userCode;
            towerRange.value = selectedTower.range;
        }
    } else {
        selectedTower = null;
        towerMenu.style.transition = 'transform 0.3s ease-in-out';
        towerMenu.style.transform = 'translate(-100%, 0)';
    }
});

socket.on('codeWillNotBeExecuted', (information) => {
    console.log(information.text);
});