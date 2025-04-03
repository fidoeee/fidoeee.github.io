function xy(t, d) {
    let rad = t * (Math.PI / 180);
    return { x: d * Math.cos(rad), y: d * Math.sin(rad) };
}

function rad(d) {
    return (d * (Math.PI / 180))
}

function checkCollision(x, y) {
    let left = x - player.width / 2;
    let right = x + player.width / 2;
    let top = y - player.height / 2;
    let bottom = y + player.height / 2;

    const isOutOfBounds = (row, col) => row < 0 || col < 0 || row >= map.length || col >= map[0].length;

    if (
        isOutOfBounds(Math.floor(top), Math.floor(left)) ||
        isOutOfBounds(Math.floor(top), Math.floor(right)) ||
        isOutOfBounds(Math.floor(bottom), Math.floor(left)) ||
        isOutOfBounds(Math.floor(bottom), Math.floor(right)) ||
        map[Math.floor(top)]?.[Math.floor(left)] !== 0 ||
        map[Math.floor(top)]?.[Math.floor(right)] !== 0 ||
        map[Math.floor(bottom)]?.[Math.floor(left)] !== 0 ||
        map[Math.floor(bottom)]?.[Math.floor(right)] !== 0
    ) {
        return true;
    }
    return false;
}

function movement() {
    if (keys['ArrowLeft']) {
        player.ang -= 1.5;
        if (player.ang < 0) {
            player.ang = 360;
        }
    }
    if (keys['ArrowRight']) {
        player.ang += 1.5;
        if (player.ang > 360) {
            player.ang = 0;
        }
    }

    let currentSpeed = keys['w'] && keys['Shift'] ? player.sprintSpeed : player.speed;
    currentSpeed == player.speed ? (currentSpeed = keys['w'] && keys['c'] ? player.speed / 1.9 : player.speed) : null;

    if (keys['w']) {
        player.xv += xy(player.ang, currentSpeed).x;
        player.yv += xy(player.ang, currentSpeed).y;
    }
    if (keys['s']) {
        player.xv += xy(player.ang, -currentSpeed).x;
        player.yv += xy(player.ang, -currentSpeed).y;
    }
    if (keys['a']) {
        player.xv += xy(player.ang - 90, currentSpeed).x;
        player.yv += xy(player.ang - 90, currentSpeed).y;
    }
    if (keys['d']) {
        player.xv += xy(player.ang + 90, currentSpeed).x;
        player.yv += xy(player.ang + 90, currentSpeed).y;
    }
    if (keys['c']) {
        player.z -= (20 - Math.abs(player.z)) / 10;
    }
    if (keys['ArrowUp']) {
        player.pitch += 6;
    }
    if (keys['ArrowDown']) {
        player.pitch -= 6;
    }
    player.pitch = Math.max(-250, Math.min(250, player.pitch));
    player.z = Math.max(-20, Math.min(20, player.z));
    if (!keys['c'] && player.stamina > 5) {
        player.z += (0 - player.z) / 10;
    }

    if (player.stamina <= 5) {
        let xDir = 0 ? 0 : player.xv / Math.abs(player.xv)
        let yDir = 0 ? 0 : player.yv / Math.abs(player.yv)
        player.xv = Math.min(Math.abs(player.xv), player.speed / 2) * xDir;
        player.yv = Math.min(Math.abs(player.yv), player.speed / 2) * yDir;
        player.z -= (20 - Math.abs(player.z)) / 10;
    }

    player.xv *= 0.6;
    player.yv *= 0.6;

    let newX = player.x + player.xv;
    let newY = player.y + player.yv;

    if (player.collisions) {
        if (!checkCollision(newX, player.y)) {
            player.x = newX;
        } else {
            player.xv = 0;
        }

        if (!checkCollision(player.x, newY)) {
            player.y = newY;
        } else {
            player.yv = 0;
        }
    } else {
        player.x = newX;
        player.y = newY;
    }

    if (Math.round((Math.abs(player.xv) + Math.abs(player.yv)) / 2 * 1000) / 1000 >= 0.05) {
        if (Math.random() * 10 < 1) {
            player.stamina -= Math.round((Math.abs(player.xv) + Math.abs(player.yv)) / 2 * 1000) / 1000;
        }
    }
}

function clicked() {
    const crosshairX = Math.floor(detectionCanvas.width / 2);
    const crosshairY = Math.floor(detectionCanvas.height / 2);

    const pixel = detectionCtx.getImageData(crosshairX, crosshairY, 1, 1).data;

    const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;

    let objectType;
    switch (color) {
        case 'rgb(255, 0, 0)':
            objectType = 'pretz';
            break;
        case 'rgb(255, 255, 0)':
            objectType = 'wall';
            break;
        case 'rgb(0, 0, 0)':
            objectType = 'Empty Space';
            break;
        case 'rgb(0, 0, 255)':
            objectType = 'blaster'
            break;
        case 'rgb(0, 255, 0)':
            objectType = 'win'
            break;
        default:
            objectType = 'Unknown';
    }
    return objectType;
}

function popup() {
    const objectType = clicked();
    const crosshairX = Math.floor(p.width / 2);
    const crosshairY = Math.floor(p.height / 2);

    if (objectType === 'pretz' || objectType === 'blaster' || objectType === 'win') {
        pop.fillStyle = 'rgba(0, 0, 0, 0.5)';
        pop.fillRect(crosshairX - 100, crosshairY - 50, 200, 100);

        pop.fillStyle = 'white';
        pop.font = '16px Arial';

        let text;
        if (objectType === 'pretz') {
            text = ['Pretz.', 'Press E to consume'];
        } else if (objectType === 'blaster') {
            text = ['Pulse Cannon.', 'Press E to pick up,', 'then click to activate'];
        } else if (objectType === 'win') {
            text = ['Exit', 'Press E to exit the maze'];
        }
        const lineHeight = 20;
        for (let i = 0; i < text.length; i++) {
            pop.fillText(text[i], crosshairX, crosshairY - 30 + i * lineHeight);
        }
    }
}

function drawFPS() {
    let now = performance.now();
    let delta = now - lTime;
    if (Math.round(now / 10) % 10 == 0) {
        fps = 1000 / delta;
    }
    lTime = now;
    if (showFps) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.roundRect(10, -c.height / 2 + 5, 100, 20, 5)
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left'
        ctx.fillText(`FPS: ${Math.round(fps)}`, 27, -c.height / 2 + 20);
    }
}

function miniMap() {
    if (showMinimap) {
        miniCanvas.style.display = 'block';
    } else {
        miniCanvas.style.display = 'none';
    }
}

function pickup() {
    if (keys['e'] && clicked() == 'pretz') {
        let stepSize = 0.1;
        let width = 10;
        let res = 2;
        let startAngle = player.ang - (width / 2);
        let endAngle = player.ang + (width / 2);
        let stepAngle = width / res;

        for (let ang = startAngle; ang <= endAngle; ang += stepAngle) {
            let stepX = xy(ang, stepSize).x;
            let stepY = xy(ang, stepSize).y;

            let dx = player.x;
            let dy = player.y;

            for (let i = 0; i < clickRender; i += stepSize) {
                dx += stepX;
                dy += stepY;

                const mapX = Math.floor(dx);
                const mapY = Math.floor(dy);

                if (map[mapY][mapX] == 1) {
                    break;
                }

                if (map[mapY][mapX] != 0) {
                    if (map[mapY][mapX] == 2) {
                        map[mapY][mapX] = 0;
                        if (Math.random() * 3 < 1) {
                            player.pretzed = true;
                        } else {
                            player.stamina += 40;
                            player.stamina = Math.min(player.stamina, player.maxStamina);
                        }
                        return;
                    }
                }
            }
        }
    }
    if (keys['e'] && clicked() == 'blaster') {
        let stepSize = 0.1;
        let width = 10;
        let res = 2;
        let startAngle = player.ang - (width / 2);
        let endAngle = player.ang + (width / 2);
        let stepAngle = width / res;

        for (let ang = startAngle; ang <= endAngle; ang += stepAngle) {
            let stepX = xy(ang, stepSize).x;
            let stepY = xy(ang, stepSize).y;

            let dx = player.x;
            let dy = player.y;

            for (let i = 0; i < clickRender; i += stepSize) {
                dx += stepX;
                dy += stepY;

                const mapX = Math.floor(dx);
                const mapY = Math.floor(dy);

                if (map[mapY][mapX] == 1) {
                    break;
                }

                if (map[mapY] && map[mapY][mapX] !== 0) {
                    if (map[mapY][mapX] === 3) {
                        map[mapY][mapX] = 0;
                        givePlayerBlaster();
                        return;
                    }
                }
            }
        }
    }
    if (keys['e'] && clicked() == 'win') {
        player.won = true;
    }
}

function stamina() {
    const barWidth = 200;
    const barHeight = 20;
    const barX = p.width / 2 - barWidth / 2;
    const barY = p.height - 60;

    pop.fillStyle = 'rgba(255, 0, 0, 0.5)';
    pop.fillRect(barX, barY, barWidth, barHeight);

    const staminaPercentage = player.stamina / player.maxStamina;
    pop.fillStyle = 'rgba(0, 255, 0, 0.8)';
    pop.fillRect(barX, barY, barWidth * staminaPercentage, barHeight);

    pop.fillStyle = 'white';
    pop.font = '16px Arial';
    pop.textAlign = 'center';
    pop.fillText(`Stamina: ${Math.round(player.stamina)} / ${player.maxStamina}`, p.width / 2, barY + barHeight - 5);
}

function showJumpscare() {
    let scale = .2;
    let time = 0;
    const maxScale = 2.5;
    const zoomSpeed = 0.2;
    const jumpscareImage = new Image();
    if (!player.pretzed) {
        jumpscareImage.src = 'smile.png';
    } else {
        jumpscareImage.src = 'pretzed.png';
    }
    jsc.style.display = 'block';

    function animateZoom() {
        js.clearRect(0, -c.height / 2, c.width, c.height);

        js.fillStyle = 'black';
        js.fillRect(0, -c.height / 2, c.width, c.height);

        const width = c.width * scale / 1.5;
        const height = c.height * scale;

        js.drawImage(
            jumpscareImage,
            (c.width - width) / 2 + Math.random() * 40 - 20,
            (-c.height / 2 - height / 2) + 300 + Math.random() * 40 - 20,
            width,
            height
        );

        if (scale < maxScale) {
            scale += zoomSpeed;
        }
        time += 1;

        if (scale < maxScale) {
            requestAnimationFrame(animateZoom);
        } else if (time < 60) {
            requestAnimationFrame(animateZoom)
        } else {
            jsc.style.display = 'none'
        }

    }
    animateZoom();
}

function showDeathScreen() {
    showJumpscare();

    setTimeout(() => {
        ctx.clearRect(0, -c.height / 2, c.width, c.height);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, -c.height / 2, c.width, c.height);

        ctx.fillStyle = 'red';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('YOU DIED', c.width / 2, 0);

        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('Ctrl + R to restart', c.width / 2, 0 + 30);
    }, 1000);
}

function random(max, min) {
    return Math.floor(Math.random() * (max - min + 1)) + (min);
}

function spawnMobs() {
    for (let i = 0; i < Math.random() * map.length / 50; i++) {
        let randomX = random(map.length - 2, map.length / 4);
        let randomY = random(map.length - 2, map.length / 4);
        if (randomX > map.length - 2 && randomY > map.length - 2) {
            randomX = Math.round(map.length / 2);
            randomY = Math.round(map.length / 2);
        }
        if (map[randomY][randomX] === 0) {
            mobs.push(new mob(randomX, randomY, 'person.png', Math.random() / 15, false, 'person'))
        } else {
            while (map[randomY][randomX] != 0) {
                randomX = random(map.length - 2, map.length / 4);
                randomY = random(map.length - 2, map.length / 4);
                if (randomX > map.length - 2 && randomY > map.length - 2) {
                    randomX = Math.round(map.length / 2);
                    randomY = Math.round(map.length / 2);
                }
                if (map[randomY][randomX] === 0) {
                    mobs.push(new mob(randomX, randomY, 'person.png', Math.random() / 15, false, 'person'))
                }
            }
        }
        if (difficulty != 'easy') {
            for (let i = 0; i < Math.random() * map.length / 500 + 1; i++) {
                let randomX = random(map.length - 2, map.length / 4);
                let randomY = random(map.length - 2, map.length / 4);
                if (randomX > map.length - 2 && randomY > map.length - 2) {
                    randomX = Math.round(map.length / 2);
                    randomY = Math.round(map.length / 2);
                }
                if (map[randomY][randomX] === 0) {
                    mobs.push(new mob(randomX, randomY, 'smile.png', 0.16 * Math.random(), false, 'smile'))
                } else {
                    while (map[randomY][randomX] != 0) {
                        randomX = random(map.length - 2, map.length / 4);
                        randomY = random(map.length - 2, map.length / 4);
                        if (randomX > map.length - 2 && randomY > map.length - 2) {
                            randomX = Math.round(map.length / 2);
                            randomY = Math.round(map.length / 2);
                        }
                        if (map[randomY][randomX] === 0) {
                            mobs.push(new mob(randomX, randomY, 'smile.png', 0.16 * Math.random() / 15, false, 'smile'))
                        }
                    }
                }
            }
        }
    }
}

function placeItems() {
    for (let i = 0; i < Math.random() * (map.length / 5) + (map.length / 50); i++) {
        let randomX = Math.floor(Math.random() * map.length);
        let randomY = Math.floor(Math.random() * map.length);
        if (map[randomY] && map[randomY][randomX] === 0) {
            map[randomY][randomX] = 2;
        }
    }

    if (difficulty != 'ultra') {
        const type3Size = 20;
        for (let i = 0; i < Math.random() * (map.length * 10) + (map.length * 2); i++) {
            let randomX = Math.floor(Math.random() * map.length);
            let randomY = Math.floor(Math.random() * map.length);
            if (isAreaEmpty(randomX, randomY, type3Size)) {
                map[randomY][randomX] = 3;
            }
        }
    }
}

function isAreaEmpty(x, y, size) {
    const mapWidth = map[0].length;
    const mapHeight = map.length;

    for (let offsetY = 0; offsetY < size; offsetY++) {
        for (let offsetX = 0; offsetX < size; offsetX++) {
            const checkX = x + offsetX;
            const checkY = y + offsetY;

            if (
                checkX >= mapWidth || checkY >= mapHeight ||
                map[checkY]?.[checkX] !== 0
            ) {
                return false;
            }
        }
    }

    return true;
}

function givePlayerBlaster() {
    player.blaster = true;
}

function drawItem() {
    if (player.blaster) {
        pop.fillStyle = 'rgb(150, 150, 250)';
        pop.beginPath();
        pop.moveTo(p.width / 2 + 90, p.height - 170);
        pop.lineTo(p.width / 2 + 120, p.height - 170);
        pop.lineTo(p.width / 2 + 190, p.height + 20);
        pop.lineTo(p.width / 2 + 140, p.height + 20);
        pop.fill();
        pop.fillStyle = 'rgb(96, 96, 160)';
        pop.beginPath();
        pop.moveTo(p.width / 2 + 90, p.height - 170);
        pop.lineTo(p.width / 2 + 90, p.height - 140);
        pop.lineTo(p.width / 2 + 125, p.height + 20);
        pop.lineTo(p.width / 2 + 140, p.height + 20);
        pop.fill();
        pop.fillStyle = 'rgb(93, 93, 176)';
        pop.beginPath();
        pop.moveTo(p.width / 2 + 100, p.height - 170);
        pop.lineTo(p.width / 2 + 105, p.height - 180);
        pop.lineTo(p.width / 2 + 110, p.height - 170);
        pop.fill();
        pop.beginPath();
        pop.moveTo(p.width / 2 + 110, p.height - 140);
        pop.lineTo(p.width / 2 + 110, p.height - 160);
        pop.lineTo(p.width / 2 + 120, p.height - 140);
        pop.fill();
        pop.beginPath();
        pop.moveTo(p.width / 2 + 122, p.height - 100);
        pop.lineTo(p.width / 2 + 122, p.height - 120);
        pop.lineTo(p.width / 2 + 132, p.height - 100);
        pop.fill();
    }
}

function useBlaster() {
    hitRange = 3;
    if (player.blaster == true) {
        let stepSize = 0.1;
        let width = 10;
        let res = 2;
        let startAngle = player.ang - (width / 2);
        let endAngle = player.ang + (width / 2);
        let stepAngle = width / res;

        for (let ang = startAngle; ang <= endAngle; ang += stepAngle) {
            let stepX = xy(ang, stepSize).x;
            let stepY = xy(ang, stepSize).y;

            let dx = player.x;
            let dy = player.y;

            for (let i = 0; i < 50; i += stepSize) {
                dx += stepX;
                dy += stepY;

                if (map[Math.round(dy)][Math.round(dx)] == 1) {
                    break;
                }

                for (entity of mobs) {
                    const mapX = Math.round(dx);
                    const mapY = Math.round(dy);
                    const entityX = Math.round(entity.x);
                    const entityY = Math.round(entity.y);

                    if (
                        Math.abs(entityX - mapX) <= hitRange &&
                        Math.abs(entityY - mapY) <= hitRange
                    ) {
                        let randomX = random(map.length, map.length / 4);
                        let randomY = random(map.length, map.length / 4);
                        entity.x = randomX;
                        entity.y = randomY;
                        player.blaster = false;
                        return;
                    }
                }
            }
        }
    }
}

function showWinScreen() {
    minimap.clearRect(0, 0, miniCanvas.width, miniCanvas.height);
    ctx.clearRect(0, -c.height / 2, c.width, c.height);
    pop.clearRect(0, 0, p.width, p.height);
    items.clearRect(0, -c.height / 2, c.width, c.height);
    document.getElementById('crosshair').style.display = 'none';
    document.getElementById('minimap').style.display = 'none';


    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, -c.height / 2, c.width, c.height);

    ctx.fillStyle = 'green';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOU WIN!', c.width / 2, 0);

    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Press Ctrl + R to restart', c.width / 2, 40);

    player.won = true;
}

function update() {
    c.onclick = () => {
        c.requestPointerLock();
        console.log('clicked');
    };


    ctx.clearRect(0, -c.height / 2, c.width, c.height);
    minimap.clearRect(0, 0, miniCanvas.width, miniCanvas.height);
    pop.clearRect(0, 0, p.width, p.height);
    items.clearRect(0, -itemCanvas.height / 2, itemCanvas.width, itemCanvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, -c.height / 2, c.width, c.height);

    raycast();
    raycastForDetection();
    movement();
    miniMap();
    drawFPS();
    popup();
    pickup();
    stamina();
    //drawEntities();
    drawItem();


    //drawMinimap();

    //playerKill();

    if (!player.dead && !player.won) {
        window.requestAnimationFrame(update);
    } else if (player.dead) {
        showDeathScreen();
    } else if (player.won) {
        showWinScreen();
    }

    if (player.pretzed) {
        showJumpscare();
        player.pretzed = false;
    }

    if (player.penansicoal == 69420911 * 69) {
        if (keys['f'] && keys['g']) {
            if (player.sprintSpeed != 1) {
                alert('hacks enabled');
            }
            player.sprintSpeed = 1;
            player.maxStamina = 1000;
            player.stamina = 1000;
            player.collisions = false;
        }
        if (keys['h'] && keys['j']) {
            if (player.sprintSpeed == 1) {
                alert('hacks disabled');
            }
            player.sprintSpeed = 0.13;
            player.maxStamina = 100;
            player.stamina = 100;
            player.collisions = true;
        }
    }
}

function mobsUpdate() {
    if (difficulty != 'ultra') {
        moveMobs(mobs, player, smallMap);
    } else {
        for (entity of mobs) {
            entityMovement(entity);
            if (Math.random() * 100 < 1.5) {
                randomX = random(map.length, map.length / 4);
                randomY = random(map.length, map.length / 4);
                if (randomX > map.length && randomY > map.length) {
                    randomX = Math.round(map.length / 2);
                    randomY = Math.round(map.length / 2);
                }
                entity.x = randomX;
                entity.y = randomY;
            }
        }
    }
    if (!player.dead && !player.won) {
        window.requestAnimationFrame(mobsUpdate);
    }
}

//start game
start();
