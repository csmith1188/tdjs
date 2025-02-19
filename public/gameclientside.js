const socket = io();
        const spacing = 50;
        var selectedBuyableTower = null
        const gameBoard = document.getElementById('gameBoard');
        const ctx = gameBoard.getContext('2d');
        var towerShop = document.getElementById("gameShopMenu");
        towerList = [
            1
        ];
        getShopItems();

        function drawGrid(grid, rows, cols) {
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    if (grid[i][j].hasPath) {
                        ctx.fillStyle = 'burlywood';
                    } else {
                        ctx.fillStyle = 'lightgreen';
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

        function drawTower(tower) {
            const { x, y, color, size } = tower;
            ctx.fillStyle = color;
            ctx.fillRect(x * spacing, y * spacing, spacing, spacing);
            ctx.strokeStyle = 'black';
            ctx.strokeRect(x * spacing, y * spacing, spacing, spacing);
        }

        function getShopItems() {
            console.log(towerList)
            towerList.forEach(tower => {
                const item = document.createElement('button');
                item.name = 'basic'
                item.style.width = "100px";
                item.style.height = "100px";
                item.style.backgroundColor = "white"
                item.addEventListener('mouseover', function () {
                    item.style.backgroundColor = "gray";
                    item.style.cursor = "pointer";
                });
                item.addEventListener('mouseout', function () {
                    item.style.backgroundColor = "white";
                    item.style.cursor = "default";
                });
                item.addEventListener('click', function () {
                    console.log("Got Tower")
                    if (selectedBuyableTower == item.name) {
                        selectedBuyableTower = null
                    } else {
                        selectedBuyableTower = item.name
                    }
                    console.log(selectedBuyableTower)
                    // the if statement below is supposed to be for selecting a grid square
                if  (selectedBuyableTower != null) {
                    const handleClick = (event) => {
                        const rect = gameBoard.getBoundingClientRect();
                        const cellWidth = rect.width / 32;
                        const cellHeight = rect.height / 20;
                        const x = (event.clientX - (rect.left + window.scrollX))/cellWidth;
                        const y = (event.clientY - (rect.top + window.scrollY))/cellHeight;
                        console.log(rect, x, y);
                        socket.emit('towerPlace', {x, y})
                        selectedBuyableTower = null
                        gameBoard.removeEventListener('click', handleClick)
                    };

                    gameBoard.addEventListener('click', handleClick)

                    // Example of removing the event listener
                    // gameBoard.removeEventListener('click', handleClick);

                    } else {
                        console.log("hey there mr guy")
                    }
                });
                towerShop.appendChild(item);
            })
        }

        socket.on('gameData', (data) => {
            const grid = data[0].grid
            const rows = data[0].rows
            const cols = data[0].cols
            const enemies = data[1]
            const towers = data[2]

            gameBoard.width = cols * spacing;
            gameBoard.height = rows * spacing;
            drawGrid(grid, rows, cols);
            enemies.forEach(enemy => {
                drawEnemy(enemy);
            });
            towers.forEach(tower => {
                drawTower(tower)
            })
        });