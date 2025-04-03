function expandMaze(maze, scaleFactor) {
    // Original maze dimensions
    const originalWidth = maze.length;
    const originalHeight = maze[0].length;

    // Scaled maze dimensions
    const scaledWidth = originalWidth * scaleFactor;
    const scaledHeight = originalHeight * scaleFactor;

    // Create a new scaled maze
    const scaledMaze = new Array(scaledWidth);

    for (let i = 0; i < scaledWidth; i++) {
        scaledMaze[i] = new Array(scaledHeight);
        for (let j = 0; j < scaledHeight; j++) {
            // Find the corresponding cell in the original maze
            const originalX = Math.floor(i / scaleFactor);
            const originalY = Math.floor(j / scaleFactor);

            // Copy the value from the original maze to the scaled maze
            scaledMaze[i][j] = maze[originalX][originalY];
        }
    }

    return scaledMaze;
}