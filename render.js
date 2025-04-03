function drawMinimap() {
    const mapWidth = smallMap[0].length;
    const mapHeight = smallMap.length;

    const scaleX = miniCanvas.width / mapWidth;
    const scaleY = miniCanvas.height / mapHeight;

    ctx.clearRect(0, 0, miniCanvas.width, miniCanvas.height);

    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            ctx.fillStyle = smallMap[y][x] === 0 ? "#3a3a3a" : "#222";

            ctx.fillRect(
                Math.round(x * scaleX),
                Math.round(y * scaleY),
                Math.ceil(scaleX + 1),
                Math.ceil(scaleY + 1)
            );
        }
    }

    let playerX = Math.round((player.x / 10) * scaleX);
    let playerY = Math.round((player.y / 10) * scaleY);
    ctx.fillStyle = "blue";
    ctx.fillRect(playerX, playerY, Math.ceil(scaleX), Math.ceil(scaleY));

    ctx.fillStyle = "red";
    for (let mob of mobs) {
        let mobX = Math.round((mob.x / 10) * scaleX);
        let mobY = Math.round((mob.y / 10) * scaleY);
        ctx.fillRect(mobX, mobY, Math.ceil(scaleX), Math.ceil(scaleY));
    }
}

function raycast() {
    let x = 0;
    let dx = 0;
    let dy = 0;
    let ang = 0;
    let relativeAng = 0;
    let tileSize = 2.5;
    let viewRadius = 55;

    let playerTileX = Math.floor(player.x);
    let playerTileY = Math.floor(player.y);

    let miniCanvasWidth = miniCanvas.width;
    let miniCanvasHeight = miniCanvas.height;

    if (showMinimap) {

        minimap.clearRect(0, 0, miniCanvasWidth, miniCanvasHeight);

        for (let y = -viewRadius; y <= viewRadius; y++) {
            for (let x = -viewRadius; x <= viewRadius; x++) {
                let mapX = playerTileX + x;
                let mapY = playerTileY + y;

                if (mapY >= 0 && mapY < map.length && mapX >= 0 && mapX < map[0].length) {
                    if (map[mapY][mapX] == 1) {
                        minimap.fillStyle = "gray";
                        minimap.fillRect(
                            (x + viewRadius) * tileSize,
                            (y + viewRadius) * tileSize,
                            tileSize,
                            tileSize
                        );
                    }
                    if (map[mapY][mapX] == 2) {
                        minimap.fillStyle = "yellow";
                        minimap.fillRect(
                            (x + viewRadius) * tileSize,
                            (y + viewRadius) * tileSize,
                            tileSize,
                            tileSize
                        );
                    }
                    if (map[mapY][mapX] == 3) {
                        minimap.fillStyle = "blue";
                        minimap.fillRect(
                            (x + viewRadius) * tileSize,
                            (y + viewRadius) * tileSize,
                            tileSize,
                            tileSize
                        );
                    }
                    if (map[mapY][mapX] == 4) {
                        minimap.fillStyle = "green";
                        minimap.fillRect(
                            (x + viewRadius) * tileSize,
                            (y + viewRadius) * tileSize,
                            tileSize,
                            tileSize
                        );
                    }
                }
            }
        }

        for (let i = 0; i < mobs.length; i++) {
            const mob = mobs[i];

            const mobX = mob.x - player.x;
            const mobY = mob.y - player.y;

            const mobMinimapX = (mobX + viewRadius) * tileSize;
            const mobMinimapY = (mobY + viewRadius) * tileSize;

            minimap.fillStyle = "yellow";
            minimap.beginPath();
            minimap.arc(mobMinimapX, mobMinimapY, 3, 0, Math.PI * 2);
            minimap.fill();
        }
    }

    for (let j = 0; j < fov * resolution; j++) {
        dx = player.x;
        dy = player.y;
        let dirStepX = xy(ang, 1).x
        let dirStepY = xy(ang, 1).y
        let dist = 0;
        let type = 0;
        let projectionX = ((x * 2 - (c.width - 1)) / (c.width - 1)) * (projectWidth / 2);
        ang = Math.atan2(projectionX, projectDist) * (180 / Math.PI) + player.ang;
        relativeAng = player.ang - ang;
        let adj = cos(relativeAng);
        let stepX, stepY;
        let sideDistX, sideDistY;
        let gridDistX = Math.abs(1 / dirStepX);
        let gridDistY = Math.abs(1 / dirStepY);
        let mapX = Math.floor(dx);
        let mapY = Math.floor(dy);
        let verticalOffset;
        let adjDist;

        if (dirStepX < 0) {
            stepX = -1;
            sideDistX = (player.x - mapX) * gridDistX;
        } else {
            stepX = 1;
            sideDistX = (mapX + 1.0 - player.x) * gridDistX;
        }

        if (dirStepY < 0) {
            stepY = -1;
            sideDistY = (player.y - mapY) * gridDistY;
        } else {
            stepY = 1;
            sideDistY = (mapY + 1.0 - player.y) * gridDistY;
        }

        let hit = false;
        let side;

        while (!hit) {

            if (sideDistX < sideDistY) {
                sideDistX += gridDistX;
                mapX += stepX;
                side = 0;
            } else {
                sideDistY += gridDistY;
                mapY += stepY;
                side = 1;
            }

            type = map[mapY][mapX];

            switch (type) {
                case 1:
                    hit = true;
                    if (side === 0) {
                        dist = (mapX - player.x + (1 - stepX) / 2) / dirStepX;
                    } else {
                        dist = (mapY - player.y + (1 - stepY) / 2) / dirStepY;
                    }
                    break;
                case 2:
                    if (side === 0) {
                        dist = (mapX - player.x + (1 - stepX) / 2) / dirStepX;
                    } else {
                        dist = (mapY - player.y + (1 - stepY) / 2) / dirStepY;
                    }

                    adjDist = dist * adj;
                    verticalOffset = player.z * (wallHeight / 100) / dist;

                    items.fillStyle = `rgba(${(wallColor[type].r - adjDist * smog) <= wallColor[type].r ? (wallColor[type].r - adjDist * smog) : wallColor[type].r}, 
                    ${(wallColor[type].g - adjDist * smog) <= wallColor[type].g ? (wallColor[type].g - adjDist * smog) : wallColor[type].g}, 
                    ${(wallColor[type].b - adjDist * smog) <= wallColor[type].b ? (wallColor[type].b - adjDist * smog) : wallColor[type].b}, 
                    ${wallColor[type].a})`;

                    items.fillRect(
                        (itemCanvas.width / (fov * resolution)) * j,
                        player.pitch + ((-wallHeight / adjDist) + (wallHeight / adjDist) * 1.5 + verticalOffset) * (c.height / 630),
                        c.width / (fov * resolution) * barWidth,
                        ((wallHeight / adjDist * 2) - (wallHeight / adjDist) * 1.5) * (c.height / 630),
                    );

                    if (sideDistX < sideDistY) {
                        sideDistX += gridDistX;
                        mapX += stepX;
                        side = 0;
                    } else {
                        sideDistY += gridDistY;
                        mapY += stepY;
                        side = 1;
                    }

                    if (side === 0) {
                        dist = (mapX - player.x + (1 - stepX) / 2) / dirStepX;
                    } else {
                        dist = (mapY - player.y + (1 - stepY) / 2) / dirStepY;
                    }

                    adjDist = dist * adj;
                    verticalOffset = player.z * (wallHeight / 100) / dist;

                    type = map[mapY][mapX];
                    items.fillRect(
                        (itemCanvas.width / (fov * resolution)) * j,
                        player.pitch + ((-wallHeight / adjDist) + (wallHeight / adjDist) * 1.5 + verticalOffset) * (c.height / 630),
                        c.width / (fov * resolution) * barWidth,
                        ((wallHeight / adjDist * 2) - (wallHeight / adjDist) * 1.5) * (c.height / 630),
                    );
                    break;

                case 3:
                    if (side === 0) {
                        dist = (mapX - player.x + (1 - stepX) / 2) / dirStepX;
                    } else {
                        dist = (mapY - player.y + (1 - stepY) / 2) / dirStepY;
                    }

                    adjDist = dist * adj;
                    verticalOffset = player.z * (wallHeight / 100) / dist;

                    items.fillStyle = `rgba(${(wallColor[type].r - adjDist * smog) <= wallColor[type].r ? (wallColor[type].r - adjDist * smog) : wallColor[type].r}, 
                    ${(wallColor[type].g - adjDist * smog) <= wallColor[type].g ? (wallColor[type].g - adjDist * smog) : wallColor[type].g}, 
                    ${(wallColor[type].b - adjDist * smog) <= wallColor[type].b ? (wallColor[type].b - adjDist * smog) : wallColor[type].b}, 
                    ${wallColor[type].a})`;

                    items.fillRect(
                        (itemCanvas.width / (fov * resolution)) * j,
                        player.pitch + ((-wallHeight / adjDist) + (wallHeight / adjDist) * 1.7 + verticalOffset) * (c.height / 630),
                        c.width / (fov * resolution) * barWidth,
                        ((wallHeight / adjDist * 2) - (wallHeight / adjDist) * 1.7) * (c.height / 630),
                    );

                    if (sideDistX < sideDistY) {
                        sideDistX += gridDistX;
                        mapX += stepX;
                        side = 0;
                    } else {
                        sideDistY += gridDistY;
                        mapY += stepY;
                        side = 1;
                    }

                    if (side === 0) {
                        dist = (mapX - player.x + (1 - stepX) / 2) / dirStepX;
                    } else {
                        dist = (mapY - player.y + (1 - stepY) / 2) / dirStepY;
                    }

                    adjDist = dist * adj;
                    verticalOffset = player.z * (wallHeight / 100) / dist;

                    type = map[mapY][mapX];
                    items.fillRect(
                        (itemCanvas.width / (fov * resolution)) * j,
                        player.pitch + ((-wallHeight / adjDist) + (wallHeight / adjDist) * 1.7 + verticalOffset) * (c.height / 630),
                        c.width / (fov * resolution) * barWidth,
                        ((wallHeight / adjDist * 2) - (wallHeight / adjDist) * 1.7) * (c.height / 630),
                    );
                    break;
                case 4:
                    hit = true;
                    if (side === 0) {
                        dist = (mapX - player.x + (1 - stepX) / 2) / dirStepX;
                    } else {
                        dist = (mapY - player.y + (1 - stepY) / 2) / dirStepY;
                    }
                    break;
            }
        }

        dist *= adj;
        verticalOffset = player.z * (wallHeight / 100) / dist;

        ctx.fillStyle = `rgba(${(wallColor[type].r - dist * smog) <= wallColor[type].r ? (wallColor[type].r - dist * smog) : wallColor[type].r}, 
                         ${(wallColor[type].g - dist * smog) <= wallColor[type].g ? (wallColor[type].g - dist * smog) : wallColor[type].g}, 
                         ${(wallColor[type].b - dist * smog) <= wallColor[type].b ? (wallColor[type].b - dist * smog) : wallColor[type].b}, 
                         ${wallColor[type].a})`;

        switch (type) {
            case 1:
                ctx.fillRect(
                    (c.width / (fov * resolution)) * j,
                    (player.pitch + ((-wallHeight / dist) + verticalOffset)) * (c.height / 630),
                    c.width / (fov * resolution) * barWidth,
                    (wallHeight / dist * 2) * (c.height / 630),
                );
                break;
            case 4:
                ctx.fillRect(
                    (c.width / (fov * resolution)) * j,
                    (player.pitch + ((-wallHeight / dist) + verticalOffset)) * (c.height / 630),
                    c.width / (fov * resolution) * barWidth,
                    (wallHeight / dist * 2) * (c.height / 630),
                );
                break;
        }

        if (showMinimap && raysDraw) {

            let rayMapX = Math.floor(dx);
            let rayMapY = Math.floor(dy);
            if (
                rayMapX >= playerTileX - viewRadius &&
                rayMapX <= playerTileX + viewRadius &&
                rayMapY >= playerTileY - viewRadius &&
                rayMapY <= playerTileY + viewRadius
            ) {
                minimap.strokeStyle = "rgba(255,255,0,1)";
                minimap.lineWidth = 1;
                minimap.beginPath();
                minimap.moveTo(viewRadius * tileSize, viewRadius * tileSize);
                minimap.lineTo(
                    (rayMapX - playerTileX + viewRadius) * tileSize,
                    (rayMapY - playerTileY + viewRadius) * tileSize
                );
                minimap.stroke();
            }
        }

        x += projectWidth / resolution / resolution2;
    }
    if (showMinimap) {

        minimap.fillStyle = "red";
        minimap.beginPath();
        minimap.arc(viewRadius * tileSize, viewRadius * tileSize, 4, 0, Math.PI * 2);
        minimap.fill();
        minimap.strokeStyle = 'yellow';

    }
}

function drawEntities() {
    let x = 0;
    let dx = 0;
    let dy = 0;
    let ang = 0;
    let relativeAng = 0;
    mobStepRes = 1 / 20;
    for (let i = 0; i < mobs.length; i++) {
        mobs[i].drawn = false;
    }

    for (let j = 0; j < fov * clickRes; j++) {
        dx = player.x;
        dy = player.y;
        let stepX = xy(ang, mobStepRes).x;
        let stepY = xy(ang, mobStepRes).y;
        let dist = 0;
        let projectionX = ((x * 2 - (c.width - 1)) / (c.width - 1)) * (projectWidth / 2);
        ang = Math.atan2(projectionX, projectDist) * (180 / Math.PI) + player.ang;
        relativeAng = player.ang - ang;
        let adj = cos(relativeAng);

        for (let d = 0; d < renderDistance; d += mobStepRes) {
            dx += stepX;
            dy += stepY;

            let mapX = Math.floor(dx);
            let mapY = Math.floor(dy);

            if (map[mapY][mapX] == 1) {
                break;
            }

            for (let i = 0; i < mobs.length; i++) {
                let mobLeft = mobs[i].x - mobs[i].width / 2;
                let mobRight = mobs[i].x + mobs[i].width / 2;
                let mobTop = mobs[i].y - mobs[i].height / 2;
                let mobBottom = mobs[i].y + mobs[i].height / 2;

                if (dx >= mobLeft && dx <= mobRight && dy >= mobTop && dy <= mobBottom && !mobs[i].drawn) {
                    mobs[i].drawn = true;
                    dist = Math.sqrt((dx - player.x) ** 2 + (dy - player.y) ** 2);
                    dist *= adj;
                    let verticalOffset = player.z * (wallHeight / 100) / dist;
                    ctx.drawImage(
                        mobs[i].sprite,
                        (c.width / (fov * clickRes)) * j - (wallHeight / dist) * (c.height / 630),
                        (player.pitch + ((-wallHeight / dist) + verticalOffset)) * (c.height / 630),
                        (wallHeight / dist * 2) * (c.height / 630),
                        (wallHeight / dist * 2) * (c.height / 630),
                    );
                    break;
                }
            }
        }

        x += projectWidth / clickRes / resolution2;
    }
}

function raycastForDetection() {

    detectionCtx.clearRect(0, -detectionCanvas.height / 2, detectionCanvas.width, detectionCanvas.height);

    let x = 0;
    let dx = 0;
    let dy = 0;
    let ang = 0;
    let relativeAng = 0;

    for (let j = 0; j < fov * clickRes; j++) {
        dx = player.x;
        dy = player.y;
        let stepX = xy(ang, clickStep).x;
        let stepY = xy(ang, clickStep).y;
        let dist = 0;
        let type = 0;
        let projectionX = ((x * 2 - (c.width - 1)) / (c.width - 1)) * (projectWidth / 2);
        ang = Math.atan2(projectionX, projectDist) * (180 / Math.PI) + player.ang;
        relativeAng = player.ang - ang;
        let adj = cos(relativeAng);

        for (let i = 0; i < clickRender; i += clickStep) {
            dx += stepX;
            dy += stepY;

            if (dx >= 999 || dy >= 999 || dx <= 1 || dy <= 1) {
                dist = 10000000;
                break;
            }

            let mapX = Math.floor(dx);
            let mapY = Math.floor(dy);

            if (map[mapY] && map[mapY][mapX] !== 0) {
                type = map[mapY][mapX];

                let color;
                if (type === 2) {
                    color = 'rgb(255, 0, 0)';
                } else if (type === 1) {
                    color = 'rgb(255, 255, 0)';
                } else if (type === 3) {
                    color = 'rgb(0, 0, 255)';
                } else if (type === 4) {
                    color = 'rgb(0, 255, 0)';
                } else {
                    color = 'rgb(0, 0, 0)';
                }
                dist = Math.sqrt((dx - player.x) ** 2 + (dy - player.y) ** 2);
                dist *= adj;
                detectionCtx.fillStyle = color;
                let verticalOffset = player.z * (wallHeight / 100) / dist;
                switch (type) {
                    case 1:
                        detectionCtx.fillRect(
                            (detectionCanvas.width / (fov * clickRes)) * j,
                            (player.pitch + ((-wallHeight / dist) + verticalOffset)) * (c.height / 630),
                            (1 / (clickRes - 4)) * 20,
                            (wallHeight / dist * 2) * (c.height / 630),
                        );
                        break;
                    case 2:
                        detectionCtx.fillRect(
                            (detectionCanvas.width / (fov * clickRes)) * j,
                            (player.pitch + ((-wallHeight / dist) + (wallHeight / dist) * 1.5 + verticalOffset)) * (c.height / 630),
                            (1 / (clickRes - 4)) * 20,
                            ((wallHeight / dist * 2) - (wallHeight / dist) * 1.5) * (c.height / 630),
                        );
                        break;
                    case 3:
                        detectionCtx.fillRect(
                            (detectionCanvas.width / (fov * clickRes)) * j,
                            (player.pitch + ((-wallHeight / dist) + (wallHeight / dist) * 1.6 + verticalOffset)) * (c.height / 630),
                            (1 / (clickRes - 4)) * 20,
                            ((wallHeight / dist * 2) - (wallHeight / dist) * 1.6) * (c.height / 630),
                        );
                        break;
                    case 4:
                        detectionCtx.fillRect(
                            (detectionCanvas.width / (fov * clickRes)) * j,
                            (player.pitch + ((-wallHeight / dist) + verticalOffset)) * (c.height / 630),
                            (1 / (clickRes - 4)) * 20,
                            (wallHeight / dist * 2) * (c.height / 630),
                        );
                        break;
                }
                break;
            }
        }

        x += projectWidth / clickRes / resolution2;
    }

    return detectionCanvas;
}