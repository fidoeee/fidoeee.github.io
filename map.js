function generateMaze(width, height, length, border) {
  let maze = [];

  for (let i = 0; i < height; i++) {
    let row = [];
    for (let j = 0; j < width; j++) {
      row.push(Math.fround(1)); 
    }
    maze.push(row);
  }

  function generateRoom() {
    let wide = 3 + 2 * Math.floor(Math.random() * 3);
    let high = 3 + 2 * Math.floor(Math.random() * 3);
    let x = Math.floor(Math.random() * (((maze[0].length - 21) - 7) / 2 + 1)) * 2 + 9;
    let y = Math.floor(Math.random() * (((maze.length - 21) - 7) / 2 + 1)) * 2 + 9;

    for (let i = y; i < y + high; i++) {
      for (let j = x; j < x + wide; j++) {
        maze[i][j] = 0;
      }
    }
    if (Math.floor(Math.random() * 2) == 0) {
      maze[y - 1][x + Math.round(wide / 2)] = 0;
      maze[y - 1][x + Math.round(wide / 2) + 1] = 0;
    } else {
      maze[y + high][x + Math.round(wide / 2)] = 0;
      maze[y + high][x + Math.round(wide / 2) + 1] = 0;
    }
  }
  for (let i = 0; i < Math.random() * (maze.length / 10) + (maze.length / 20); i++) {
    generateRoom();
  }

  let passed = []; 
  let directions = [
    { x: 0, y: 2 },  
    { x: 0, y: -2 }, 
    { x: 2, y: 0 },  
    { x: -2, y: 0 }, 
  ];

  function cut(x, y) {
    maze[y][x] = 0; 
    passed.push({ x, y }); 

    directions = directions.sort(() => Math.random() - 0.5); 

    let validMove = false; 

    for (let i = 0; i < 4; i++) {
      let nx = x + directions[i].x;
      let ny = y + directions[i].y;

      if (nx >= 0 && nx < width - border && ny >= 0 && ny < height - border && maze[ny][nx] === 1) {
        maze[ny][nx] = 0; 
        maze[ny - directions[i].y / 2][nx - directions[i].x / 2] = 0; 
        cut(nx, ny); 
        if (Math.floor(Math.random() * length) != 0) {
          validMove = true; 
          break; 
        } else {
          validMove = false;
        }
      }
    }

    if (!validMove) {
      return; 
    }
  }

  cut(1, 1);

  while (passed.length > 0) {
    old = passed.pop(); 
    let validMove = false;

    directions = directions.sort(() => Math.random() - 0.5); 

    for (let i = 0; i < 4; i++) {
      let nx = old.x + directions[i].x;
      let ny = old.y + directions[i].y;

      if (nx >= 0 && nx < width - border && ny >= 0 && ny < height - border && maze[ny][nx] === 1) {
        maze[ny][nx] = 0; 
        maze[ny - directions[i].y / 2][nx - directions[i].x / 2] = 0; 
        cut(nx, ny); 
        if (Math.floor(Math.random() * length) != 0) {
          validMove = true; 
          break; 
        } else {
          validMove = false;
        }
      }
    }

    if (!validMove) {
      continue; 
    }
  }

  for (let i = 0; i < Math.random() * 10 + 2; i++) {
    let randomX = Math.floor(Math.random() * maze[0].length)
    while (maze[maze.length - 3][randomX] == 1) {
      randomX = Math.floor(Math.random() * maze[0].length)
    }
    maze[maze.length - 2][randomX] = 4;
  }

  for (let i = 0; i < maze.length; i++) {
    let row = maze[i].map(cell => cell === 1 ? '#  ' : '   '); 
    console.log(row.join('')); 
  }

  return maze;
}