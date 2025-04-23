const socket = io();
const spacing = 32; // Change this to adjust the size of the grid cell and quality of each cell
var selectedBuyableTower = null;
var selectedTower = null;

const gameBoard = document.getElementById('gameBoard');
const ctx = gameBoard.getContext('2d');
var towerShop = document.getElementById("gameShopMenu");
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
    const { x, y, color, size, healthBorder, borderColor } = enemy;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x * spacing + spacing / 2, y * spacing + spacing / 2, size / 2, 0, 2 * Math.PI);
    ctx.fill();
    if (healthBorder) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
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

    const { x, y, name } = previewTower;
    ctx.globalAlpha = 0.5; // Set transparency
    ctx.fillStyle = 'gray'; // Example color for the transparent tower
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
    drawGame();
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
        item.style.width = "7.95vw";
        item.style.minWidth = (800 * 0.0795) + "px";
        item.style.height = "7.95vw";
        item.style.minHeight = (800 * 0.0795) + "px";
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
        item.appendChild(itemPrice);
        towerShop.appendChild(item);
    });
}

function drawGame(grid, rows, cols, enemies, towers) {
    // Redraw the grid, enemies, and towers
    drawGrid(grid, rows, cols);
    if (enemies) {
        enemies.forEach(drawEnemy);
    }
    if (towers) {
        towers.forEach(drawTower);
    }

    // Draw the preview tower
    drawPreviewTower();
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

socket.on('gameData', (data) => {
    const grid = data.gridData.grid;
    const rows = data.gridData.rows;
    const cols = data.gridData.cols;
    const enemies = data.enemyData;
    const towers = data.towerData;
    const gameOver = data.gameOverStatus;
    const gameRunning = data.gameRunningStatus;
    var baseHealth = data.baseHealth;
    var money = data.money;
    var wave = data.wave;

    document.getElementById('baseHealth').innerHTML = 'Health: ' + baseHealth;
    document.getElementById('money').innerHTML = 'Bitpogs: ' + money;
    document.getElementById('wave').innerHTML = 'Wave: ' + (wave + 1) + ' / 10';

    gameBoard.width = cols * spacing;
    gameBoard.height = rows * spacing;
    if (!gameOver && gameRunning) {
        drawGame(grid, rows, cols, enemies, towers);
    } else {
        if (gameOver) {
            ctx.clearRect(0, 0, gameBoard.width, gameBoard.height);
            drawGrid(grid, rows, cols);
            enemies.forEach(enemy => {
                drawEnemy(enemy);
            });
            towers.forEach(tower => {
                drawTower(tower);
            });
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fillRect(0, 0, gameBoard.width, gameBoard.height);
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