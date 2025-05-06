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


const enemyCamoImage = new Image();
enemyCamoImage.src = '/images/enemySprites/camoEnemy.png'; // Path to the image in the images folder

const enemyPopupImage = new Image();
enemyPopupImage.src = '/images/enemySprites/popupEnemy.png'; // Path to the image in the images folder

// Load the health icon image
const healthIcon = new Image();
healthIcon.src = '/images/userInterfaceImages/livesIcon.png'; // Path to the image in the images folder
healthIcon.onload = () => {
    healthIcon.loaded = false;
}

// Load the bitpog icon image
const bitpogIcon = new Image();
bitpogIcon.src = '/images/userInterfaceImages/bitpog.png'; // Path to the image in the images folder
bitpogIcon.onload = () => {
    bitpogIcon.loaded = false;
}

const settingsIcon = new Image();
settingsIcon.src = '/images/userInterfaceImages/settingsIcon.png'; // Path to the image in the images folder
settingsIcon.onload = () => {
    settingsIcon.loaded = false;
} 

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

    if (enemy.enemyType == 'camo') {

        if (enemyCamoImage.complete) {
            ctx.drawImage(enemyCamoImage, x * spacing, y * spacing, size, size);
        } else {
            // Fallback in case the image hasn't loaded yet
            enemyCamoImage.onload = () => {
                ctx.drawImage(enemyCamoImage, x * spacing, y * spacing, size, size);
            };
        }
    } else if (enemy.enemyType == 'pop-up') {
        
        if (enemyPopupImage.complete) {
            ctx.drawImage(enemyPopupImage, x * spacing, y * spacing, size, size);
        } else {
            // Fallback in case the image hasn't loaded yet
            enemyPopupImage.onload = () => {
                ctx.drawImage(enemyPopupImage, x * spacing, y * spacing, size, size);
            };
        }
    } else {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x * spacing + spacing / 2, y * spacing + spacing / 2, size / 2, 0, 2 * Math.PI);
        ctx.fill();
    }

};

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
    // Draw the range of the preview tower
    const range = previewTower.range * spacing; // Calculate the range in pixels
    ctx.beginPath();
    ctx.arc(
        previewTower.x * spacing + spacing / 2,
        previewTower.y * spacing + spacing / 2,
        range,
        0,
        2 * Math.PI
    );
    ctx.fillStyle = 'rgba(128, 128, 128, 0.25)'; // Semi-transparent gray for the range
    ctx.fill();
    ctx.strokeStyle = 'darkgray';
    ctx.stroke();
    ctx.globalAlpha = 1; // Reset transparency
}

function drawProjectile(projectile) {
    const { x, y, color, size } = projectile;
    ctx.fillStyle = color; // Use the projectile's color
    ctx.beginPath();
    ctx.arc(x * spacing + spacing / 2, y * spacing + spacing / 2, size / 2, 0, 2 * Math.PI); // Draw a circle
    ctx.fill();
}

function handleMouseMove(event) {
    if (!selectedBuyableTower) return;

    const rect = gameBoard.getBoundingClientRect();
    const cellWidth = rect.width / 32;
    const cellHeight = rect.height / 20;
    const x = Math.floor((event.clientX - (rect.left + window.scrollX)) / cellWidth);
    const y = Math.floor((event.clientY - (rect.top + window.scrollY)) / cellHeight);

    // Update the preview tower position
    previewTower = { x, y, name: selectedBuyableTower.name, range: selectedBuyableTower.range };

    // Redraw the game board to include the preview
    drawGame(currentGrid, currentRows, currentCols, currentEnemies, currentTowers, currentProjectiles, currentBaseHealth, currentMoney, currentWave);
}

function handleTowerPlacement(event) {
    const rect = gameBoard.getBoundingClientRect();
    const cellWidth = rect.width / 32;
    const cellHeight = rect.height / 20;
    const x = Math.floor((event.clientX - (rect.left + window.scrollX)) / cellWidth);
    const y = Math.floor((event.clientY - (rect.top + window.scrollY)) / cellHeight);

    socket.emit('towerPlace', { x, y, tower: selectedBuyableTower.name });
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
        const sideLength = towerShop.offsetWidth * 0.499; // Calculate side length based on 50% of the parent width
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
            if (!selectedBuyableTower === null) {
                selectedBuyableTower = null;
                previewTower = null;
                gameBoard.removeEventListener('mousemove', handleMouseMove);
                gameBoard.removeEventListener('click', handleTowerPlacement);
            } else {
                selectedBuyableTower = { name: item.name, range: tower.range };
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
    const parentWidth = towerShop.getBoundingClientRect().width; // Get the current width of the parent element
    const sideLength = parentWidth * 0.499; // Calculate side length based on 50% of the parent width
    for (let i = 0; i < items.length; i++) {
        items[i].style.width = `${sideLength}px`;
        items[i].style.height = `${sideLength}px`;
        items[i].style.fontSize = `${sideLength / 10}px`; // Adjust font size based on the new size
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
    const targetAspectRatio = 2 / 1; // Desired aspect ratio
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

    const waveButton = document.getElementById('waveButton');
    if (waveButton) {
        const buttonWidth = waveButton.getBoundingClientRect().width;
        waveButton.style.fontSize = `${buttonWidth / 10}px`; // Adjust font size based on button width
    }

    const towerMenu = document.getElementById('towerMenu');
    if (towerMenu) {
        const gameBoardHeight = gameBoard.getBoundingClientRect().height;

        // Set the height of the towerMenu to 80% of the gameBoard's height
        towerMenu.style.height = `${gameBoardHeight * 0.8}px`;

        // Position the towerMenu aligned with half the height of the gameBoard
        towerMenu.style.position = 'absolute';
        towerMenu.style.top = `${(gameBoardHeight - towerMenu.offsetHeight) / 2}px`;
    }

    const programMenu = document.getElementById('programMenu');
    if (programMenu) {
        programMenu.style.height = `${towerMenu.offsetHeight * 0.4}px`;
        programMenu.style.width = '100%';
        programMenu.style.top = `${towerMenu.offsetHeight * 0.6}px`;
    }

    const programBox = document.getElementById('programBox');
    if (programBox) {
        programBox.style.height = '100%';
        programBox.style.width = '100%';
    }

    const programButtons = towerMenu.querySelectorAll('.programButton');
    if (programButtons) {
        programButtons.forEach(button => {
            button.style.height = `${towerMenu.offsetHeight * 0.04}px`; // Set button height to 8% of towerMenu height
            button.style.width = `${programMenu.offsetWidth * 0.4}px`; // Set button width to 40% of programMenu width
            button.style.fontSize = `${programButtons[0].offsetHeight / 3}px`; // Adjust font size based on button height
        });
    }
}

window.addEventListener('resize', () => { adjustAspectRatio(); resizeShopItems(); });
window.addEventListener('load', adjustAspectRatio);

function drawGame(grid, rows, cols, enemies, towers, projectiles, baseHealth, money, wave) {
    // Clear the canvas
    ctx.clearRect(0, 0, gameBoard.width, gameBoard.height);

    // Redraw the grid
    drawGrid(grid, rows, cols);

    if (selectedTower != null) {
        const range = selectedTower.range * spacing; // Calculate the range in pixels
        ctx.beginPath();
        ctx.arc(
            selectedTower.x * spacing + spacing / 2,
            selectedTower.y * spacing + spacing / 2,
            range,
            0,
            2 * Math.PI
        );
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
    }

    // Draw all towers
    if (towers && Array.isArray(towers)) {
        towers.forEach(drawTower);
    }

    // Draw all projectiles
    if (projectiles && Array.isArray(projectiles)) {
        projectiles.forEach(drawProjectile);
    }

    // Draw all enemies
    if (enemies && Array.isArray(enemies)) {
        enemies.forEach(drawEnemy);
    }


    // Draw the preview tower
    drawPreviewTower();

    // Draw game data (baseHealth, money, wave) on the canvas
    ctx.fillStyle = 'white';
    ctx.font = `${64 * ratio}px Arial`; // Scale font size using the canvas ratio
    ctx.textAlign = 'left';

    // Display the health icon
    if (!healthIcon.loaded) {
        ctx.drawImage(healthIcon, 10, 6, 32, 32);
    }
    // Display the base health value next to the image
    ctx.fillText(`${baseHealth}`, 40, 25); // Adjust the position to align with the image

    // Display money icon
    if (!bitpogIcon.loaded) {
        ctx.drawImage(bitpogIcon, 66, 10, 20, 20);
    }

    // Display money
    ctx.fillText(`${money}`, 90, 25);

    // Display wave
    const waveLength = (parseInt(wave) + 1).toString().length;
    ctx.fillText(`Wave: ${parseInt(wave) + 1} / 10`, 930 - (waveLength * 10), 20);
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

function chooseUpgradePath(towerIndex, path) {
    socket.emit('chooseUpgradePath', { towerIndex, path });
}

function upgradeTower(towerIndex) {
    socket.emit('upgradeTower', towerIndex);
}

function sellTower() {
    console.log(selectedTower.index);

    socket.emit('sellTower', selectedTower.index);
    selectedTower = null;
    const towerMenu = document.getElementById('towerMenu');
    towerMenu.style.transition = 'transform 0.3s ease-in-out';
    towerMenu.style.transform = 'translate(-100%, 0)';
}

function sendWave() {
    socket.emit('sendWave');
}

socket.on('gameData', (data) => {
    currentGrid = data.gridData.grid;
    currentRows = data.gridData.rows;
    currentCols = data.gridData.cols;
    currentEnemies = data.enemyData;
    currentTowers = data.towerData;
    currentProjectiles = data.projectileData;
    currentBaseHealth = data.health;
    currentMoney = data.money;
    currentWave = data.wave;

    const gameOver = data.gameOverStatus;
    const gameRunning = data.gameRunningStatus;

    gameBoard.width = currentCols * spacing;
    gameBoard.height = currentRows * spacing;

    if (!gameOver && gameRunning) {
        document.getElementById('gameOverPage').style.display = 'none';
        drawGame(currentGrid, currentRows, currentCols, currentEnemies, currentTowers, currentProjectiles,currentBaseHealth, currentMoney, currentWave);
    } else {
        if (gameOver) {
            ctx.clearRect(0, 0, gameBoard.width, gameBoard.height);
            drawGrid(currentGrid, currentRows, currentCols);
            selectedTower = null;
            const towerMenu = document.getElementById('towerMenu');
            towerMenu.style.transition = 'transform 0.3s ease-in-out';
            towerMenu.style.transform = 'translate(-100%, 0)';
            currentTowers.forEach(tower => {
                drawTower(tower);
            });
            currentEnemies.forEach(enemy => {
                drawEnemy(enemy);
            });
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fillRect(0, 0, gameBoard.width, gameBoard.height);
            document.getElementById('gameOverPage').style.display = 'block';
        }
    }
});

socket.on('updateTowerMenu', (data) => {

})

socket.on('towerSelected', (data) => {
    var towerMenu = document.getElementById('towerMenu');
    var programMenu = document.getElementById('programBox');

    if (data != null) {
        if (selectedTower == null) {
            selectedTower = data;

            // Update the tower overview
            const towerName = document.getElementById('towerName');
            towerName.innerText = `${selectedTower.name} Tower`;

            // Update the tower stats
            const towerDamage = document.getElementById('towerDamage');
            const towerRange = document.getElementById('towerRange');
            const towerFireRate = document.getElementById('towerFireRate');
            towerDamage.innerText = `Damage: ${selectedTower.damage}`;
            towerRange.innerText = `Range: ${selectedTower.range}`;
            towerFireRate.innerText = `Fire Rate: ${selectedTower.fireRate}`;

            // Update the upgrade buttons
            const upgradeName1 = document.getElementById('upgradeName1');
            const upgradeName2 = document.getElementById('upgradeName2');
            const upgradeName3 = document.getElementById('upgradeName3');
            const upgradeName4 = document.getElementById('upgradeName4');

            if (selectedTower.upgradePath === null) {
                // Update buttons for choosing upgrade paths
                upgradeName1.style.display = 'block';
                upgradeName1.innerText = 'Choose Path 1';
                upgradeName1.onclick = () => chooseUpgradePath(selectedTower.index, 1);

                upgradeName2.style.display = 'block';
                upgradeName2.innerText = 'Choose Path 2';
                upgradeName2.onclick = () => chooseUpgradePath(selectedTower.index, 2);

                // Hide unused buttons
                upgradeName3.style.display = 'none';
                upgradeName4.style.display = 'none';
            } else {
                // Update an upgrade button if a path is already chosen
                upgradeName1.style.display = 'block';
                upgradeName1.innerText = `Upgrade (${selectedTower.price} Bitpogs)`;

                upgradeName2.innerText = 'Upgrade Blocked';
                upgradeName3.innerText = 'Upgrade Blocked';
                upgradeName4.innerText = 'Upgrade Blocked';
            }

            // Update the sell button
            const sellButton = document.getElementById('sellButton');
            sellButton.innerText = `Sell: ${selectedTower.price} Bitpogs`;

            // Update the program menu
            if (selectedTower.userCode != null) {
                programMenu.value = selectedTower.userCode.program;
            } else {
                programMenu.value = '';
            }

            // Show the tower menu
            towerMenu.style.transition = 'transform 0.3s ease-in-out';
            towerMenu.style.transform = 'translate(0, 0)';
        } else {
            // Deselect the tower
            selectedTower = null;
            towerMenu.style.transition = 'transform 0.3s ease-in-out';
            towerMenu.style.transform = 'translate(-100%, 0)';
        }
    } else {
        // No tower selected, hide the menu
        selectedTower = null;
        towerMenu.style.transition = 'transform 0.3s ease-out';
        towerMenu.style.transform = 'translate(-100%, 0)';
    }
});

socket.on('upgradePathChosen', (data) => {
    const towerMenu = document.getElementById('towerMenu');
    const dynamicMenu = document.getElementById('dynamicMenu');
    if (dynamicMenu) {
        dynamicMenu.remove(); // Remove the old dynamic content
    }

    // Create a container for dynamic content
    const newDynamicMenu = document.createElement('div');
    newDynamicMenu.id = 'dynamicMenu';

    // Populate the tower menu with upgrade options
    const towerInfo = document.createElement('div');
    towerInfo.innerHTML = `
        <h3>${data.name} Tower</h3>
        <p>Range: ${data.range}</p>
        <p>Damage: ${data.damage}</p>
        <p>Fire Rate: ${data.fireRate}</p>
        <p>Upgrade Level: ${data.upgradeLevel}</p>
        <p>Upgrade Path: ${data.upgradePath}</p>
    `;
    newDynamicMenu.appendChild(towerInfo);

    // Append the dynamic menu to the tower menu
    towerMenu.appendChild(newDynamicMenu);

    const upgradeButton = document.createElement('button');
    upgradeButton.innerText = `Upgrade (${data.price} Bitpogs)`;
    upgradeButton.onclick = () => upgradeTower(data.index);
    newDynamicMenu.appendChild(upgradeButton);
})

socket.on('towerUpgraded', (data) => {
    const towerMenu = document.getElementById('towerMenu');
    const dynamicMenu = document.getElementById('dynamicMenu');
    if (dynamicMenu) {
        dynamicMenu.remove(); // Remove the old dynamic content
    }

    // Create a container for dynamic content
    const newDynamicMenu = document.createElement('div');
    newDynamicMenu.id = 'dynamicMenu';

    // Populate the tower menu with upgrade options
    const towerInfo = document.createElement('div');
    towerInfo.innerHTML = `
        <h3>${data.name} Tower</h3>
        <p>Range: ${data.range}</p>
        <p>Damage: ${data.damage}</p>
        <p>Fire Rate: ${data.fireRate}</p>
        <p>Upgrade Level: ${data.upgradeLevel}</p>
        <p>Upgrade Path: ${data.upgradePath}</p>
    `;
    newDynamicMenu.appendChild(towerInfo);

    // Append the dynamic menu to the tower menu
    towerMenu.appendChild(newDynamicMenu);

    const upgradeButton = document.createElement('button');
    upgradeButton.innerText = `Upgrade (${data.price} Bitpogs)`;
    upgradeButton.onclick = () => upgradeTower(data.index);
    newDynamicMenu.appendChild(upgradeButton);
})

socket.on('codeWillNotBeExecuted', (information) => {
    console.log(information.text);
});