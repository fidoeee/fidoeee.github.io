function entityMovement(mob) {
    const speed = mob.speed; 
    const mobX = mob.x;
    const mobY = mob.y;
    const playerX = player.x;
    const playerY = player.y;

    const dx = playerX - mobX;
    const dy = playerY - mobY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const stepX = (dx / distance) * speed;
    const stepY = (dy / distance) * speed;

    if (mob.collision) {
        if (!checkCollision(mobX + stepX, mobY)) {
            mob.x += stepX;
        }
        if (!checkCollision(mobX, mobY + stepY)) {
            mob.y += stepY;
        }
    } else {
        mob.x += stepX;
        mob.y += stepY;
    }
}

function playerKill() {
    for (entity of mobs) {
        const dx = entity.x - player.x;
        const dy = entity.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const collisionRange = entity.hitbox;

        if (distance <= collisionRange) {
            player.dead = true;
        }
    }
}

function aStar(start, goal, map) {
    const rows = map.length;
    const cols = map[0].length;

    function heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    function getNeighbors(node) {
        const { x, y } = node;
        const neighbors = [];
        const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];

        for (const { dx, dy } of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && map[ny][nx] === 0) {
                neighbors.push({ x: nx, y: ny });
            }
        }

        return neighbors;
    }

    const openSet = [{ ...start, g: 0, f: heuristic(start, goal) }];
    const cameFrom = new Map();
    const gScore = new Map();
    gScore.set(`${start.x},${start.y}`, 0);

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();

        if (current.x === goal.x && current.y === goal.y) {
            let path = [];
            let temp = current;
            while (temp) {
                path.push({ x: temp.x, y: temp.y });
                temp = cameFrom.get(`${temp.x},${temp.y}`);
            }
            return path.reverse();
        }

        for (const neighbor of getNeighbors(current)) {
            const tentativeGScore = gScore.get(`${current.x},${current.y}`) + 1;

            if (!gScore.has(`${neighbor.x},${neighbor.y}`) || tentativeGScore < gScore.get(`${neighbor.x},${neighbor.y}`)) {
                cameFrom.set(`${neighbor.x},${neighbor.y}`, current);
                gScore.set(`${neighbor.x},${neighbor.y}`, tentativeGScore);
                openSet.push({ ...neighbor, g: tentativeGScore, f: tentativeGScore + heuristic(neighbor, goal) });
            }
        }
    }

    return [];
}

const pathUpdateInterval = 1000; 

function moveMobs(mobs, player, smallMap) {
    const now = performance.now(); 

    for (let i = 0; i < mobs.length; i++) {
        let mob = mobs[i];

        if (mob.pathUpdateOffset === undefined) {
            mob.pathUpdateOffset = i * (pathUpdateInterval)
        }

        const mobScaledDown = { x: Math.floor(mob.x / 10), y: Math.floor(mob.y / 10) };
        const playerScaledDown = { x: Math.floor(player.x / 10), y: Math.floor(player.y / 10) };

        let path = mob.path || [];

        if (!mob.lastPathUpdate || now - mob.lastPathUpdate > pathUpdateInterval + mob.pathUpdateOffset) {
            if (path.length === 0 || (path[path.length - 1].x !== playerScaledDown.x || path[path.length - 1].y !== playerScaledDown.y)) {
                setTimeout(() => {
                    mob.path = aStar(mobScaledDown, playerScaledDown, smallMap);
                    mob.lastPathUpdate = performance.now();
                }, i * 5); 
            }
        }

        if (mob.path.length > 1) {
            let nextStep = mob.path[1]; 

            let nextX = nextStep.x * 10;
            let nextY = nextStep.y * 10;

            let dx = nextX - mob.x;
            let dy = nextY - mob.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                let moveX = (dx / distance) * mob.speed;
                let moveY = (dy / distance) * mob.speed;

                mob.x += moveX;
                mob.y += moveY;

                if (Math.abs(mob.x - nextX) < 1 && Math.abs(mob.y - nextY) < 1) {
                    mob.path.shift(); 
                }
            }
        }
    }
}