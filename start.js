let startButton = document.getElementById('startButton');
let peaceful = document.getElementById('peaceful');
let easy = document.getElementById('easy');
let medium = document.getElementById('medium');
let hard = document.getElementById('hard');
let ultraHard = document.getElementById('ultrahard');
let credits = document.getElementById('credits');
let title = document.getElementById('title');
let back = document.getElementById('back');
let creditText = document.getElementById('creditText');
let creditTitle = document.getElementById('creditTitle');
let bg = document.getElementById('bg');
let bgs = ['title.png', 'title5.png', 'title2.png', 'title3.png', 'title4.png', 'title6.png', 'title7.png', 'title8.png', 'title9.png', 'title10.png']

bg.src = bgs[Math.floor(Math.random() * bgs.length)];

startButton.onclick = function () {
    document.getElementById('startScreen').style.display = 'none';
    game = true;
}

peaceful.onclick = function () {
    difficulty = 'peace';
}

easy.onclick = function () {
    difficulty = 'easy';
}

medium.onclick = function () {
    difficulty = 'med';
}

hard.onclick = function () {
    difficulty = 'hard';
}

ultraHard.onclick = function () {
    difficulty = 'ultra';
}

credits.onclick = function () {
    title.style.display = 'none';
    credits.style.display = 'none';
    back.style.display = 'block';
    creditText.style.display = 'block';
    creditTitle.style.display = 'block';
}

back.onclick = function () {
    title.style.display = 'block';
    credits.style.display = 'block';
    back.style.display = 'none';
    creditText.style.display = 'none';
    creditTitle.style.display = 'none';
}

function changeImage() {
    bg.src = bgs[Math.floor(Math.random() * bgs.length)];
}

setInterval(changeImage, 10000);

function start() {
    if (document.getElementById('codes').value === 'alan is alien') {
        document.getElementById('codeSlider').style.visibility = 'visible';
    } else {
        document.getElementById('color').style.visibility = 'hidden';
        document.getElementById('codeSlider').style.visibility = 'hidden';
    }
    if (document.getElementById('codeSlider').value == 69) {
        document.getElementById('color').style.visibility = 'visible';
    } else {
        document.getElementById('color').style.visibility = 'hidden';
    }
    if (document.getElementById('color').value == '#454545') {
        player.penansicoal = 69420911 * 69;
    }
    if (game) {

        if (difficulty === 'peace') {
            map = generateMaze(30, 30, 20, 1);
        } else if (difficulty === 'easy') {
            map = generateMaze(30, 30, 20, 1);
        } else if (difficulty === 'med') {
            map = generateMaze(60, 60, 20, 1);
        } else if (difficulty === 'hard') {
            map = generateMaze(100, 100, 20, 1);
        } else if (difficulty === 'ultra') {
            map = generateMaze(200, 200, 20, 1);
        }

        smallMap = map;
        map = expandMaze(map, 10);

        if (difficulty != 'peace') {
            spawnMobs();
        }

        document.addEventListener('mousedown', () => {
            document.body.requestPointerLock();
        });
        placeItems();
        update();
        mobsUpdate();
    } else {
        window.requestAnimationFrame(start);
    }
}