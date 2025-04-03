let c = document.getElementById('game');
let ctx = c.getContext('2d');
let p = document.getElementById('popup');
let pop = p.getContext('2d');
let jsc = document.getElementById('js');
let js = jsc.getContext('2d');
let miniCanvas = document.getElementById('minimap');
let minimap = miniCanvas.getContext('2d');
let itemCanvas = document.getElementById('items');
let items = itemCanvas.getContext('2d');
let detectionCanvas = document.getElementById('detection');
let detectionCtx = detectionCanvas.getContext('2d');
let fov = 90; 
let resolution = 10; 
let resolution2 = 2.5;
let renderDistance = 600; 
let clickRes = 10; 
let clickHeightRes = 10;
let clickRender = 10; 
let clickStep = 1 / clickHeightRes;
let projectDist = 20;
let projectWidth = projectDist * Math.tan(fov * (Math.PI / 180) / 2) * 2;
let wallColor = [{ r: 0, g: 0, b: 0, a: 0 }, { r: 129, g: 110, b: 30, a: 1, }, { r: 200, g: 200, b: 0, a: 1 }, { r: 100, g: 100, b: 180, a: 1 } , { r: 0, g: 255, b: 0, a: 1 }];
let wallHeight = 2000;
let smog = 4;
let showMinimap = false;
let click = 'none';
let keys = {};
let keyToggles = {}; 
let cosine = [];
let cosRes = 10000;
let raysDraw = false;
let barWidth = 2;
let difficulty = 'med';
let game = false;
let map;
let mobs = [];
let smallMap;
let showFps = false;

ctx.textAlign = 'center';
pop.textAlign = 'center';

c.width = window.innerWidth;
c.height = window.innerHeight;

itemCanvas.width = window.innerWidth;
itemCanvas.height = window.innerHeight;

jsc.width = window.innerWidth;
jsc.height = window.innerHeight;

p.height = c.height;
p.width = c.width;

detectionCanvas.height = c.height;
detectionCanvas.width = c.width;

detectionCtx.translate(0, detectionCanvas.height / 2);
js.translate(0, jsc.height / 2);
ctx.translate(0, c.height / 2);
items.translate(0, c.height / 2);

for (let i = 0; i <= cosRes; i++) {
    let angle = (i / cosRes) * 2 * Math.PI; 
    cosine[i] = Math.cos(angle);
}

function cos(angle) {
    angle = angle % 360;
    if (angle < 0) {
        angle += 360;
    }
    let index = (angle / 360) * cosRes; 
    let lowerIndex = Math.floor(index); 
    let upperIndex = Math.ceil(index); 
    let fraction = index - lowerIndex; 

    lowerIndex = lowerIndex % cosRes;
    upperIndex = upperIndex % cosRes;

    return cosine[lowerIndex] * (1 - fraction) + cosine[upperIndex] * fraction;
}

document.addEventListener('mousemove', (event) => {

    player.ang += event.movementX * 0.1; 

    if (player.ang < 0) {
        player.ang += 360;
    }
    if (player.ang >= 360) {
        player.ang -= 360;
    }

    if (player.pitch - event.movementY * 0.8 < 250 && player.pitch - event.movementY * 0.8 > -250) {
        player.pitch -= event.movementY * 0.8; 
    } else if (player.pitch - event.movementY * 0.8 >= 250) {
        player.pitch = 249;
    } else if (player.pitch - event.movementY * 0.8 <= -250) {
        player.pitch = -249;
    }
});

window.addEventListener('keydown', (event) => {
    if (event.key == 'Shift' || event.key == 'ArrowUp' || event.key == 'ArrowDown' || event.key == 'ArrowLeft' || event.key == 'ArrowRight') {
        keys[event.key] = true;
    } else {
        keys[event.key.toLowerCase()] = true;
    }

    if (event.key.toLowerCase() === 'm' && !keyToggles['m']) {
        showMinimap = !showMinimap; 
        keyToggles['m'] = true; 
    }
    if (event.key.toLowerCase() === 'f' && !keyToggles['f']) {
        showFps = !showFps;
        keyToggles['f'] = true; 
    }
    if (event.key === 'r' && !keyToggles['r']) {
        raysDraw = !raysDraw; 
        keyToggles['r'] = true; 
    }
});

window.addEventListener('keyup', (event) => {
    if (event.key == 'Shift' || event.key == 'ArrowUp' || event.key == 'ArrowDown' || event.key == 'ArrowLeft' || event.key == 'ArrowRight') {
        keys[event.key] = false;
    } else {
        keys[event.key.toLowerCase()] = false;
    }

    if (event.key.toLowerCase() === 'm') {
        keyToggles['m'] = false; 
    }
    if (event.key.toLowerCase() === 'f') {
        keyToggles['f'] = false; 
    }
    if (event.key === 'r') {
        keyToggles['r'] = false; 
    }
});

document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'w') {
        event.preventDefault(); 
    }
});

document.addEventListener('mousedown', (event) => {
    if (event) {
        useBlaster();
    }
});

let player = {
    x: 15,
    y: 15,
    z: 0,
    xv: 0,
    yv: 0,
    zv: 0,
    ox: 0,
    oy: 0,
    oz: 0,
    ang: 90,
    width: .5,
    height: .5,
    length: 1,
    speed: 0.08,
    sprintSpeed: 0.13,
    pitch: 0,
    stamina: 100,
    maxStamina: 100,
    dead: false,
    collisions: true,
    blaster: false,
    won: false,
    pretzed: false,
};

let lTime = performance.now();
let fps = 0;

class mob {
    constructor(x, y, sprite, speed, collision, type) {
        this.x = x;
        this.y = y;
        this.ang = 0;
        this.width = 2;
        this.height = 2;
        this.length = 2;
        this.speed = speed;
        this.health = 100;
        this.maxHealth = 100;
        this.sprite = new Image();
        this.sprite.src = sprite;
        this.drawn = false;
        this.path = [];
        this.collision = collision;
        this.hitbox = 3;
        this.type = type;
    }
}

let drawMobs = [];
c.willReadFrequently = true;
ctx.willReadFrequently = true;