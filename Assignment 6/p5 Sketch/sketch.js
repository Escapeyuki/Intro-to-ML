let classifier;
let label = "listening...";

// the snake moves on a grid of 20px cells
const cellSize = 20;
// voice commands are slow, so only step every 20 frames
const stepEvery = 20;
let cols, rows;
let snake; // list of cells, head first
let dir; // direction of the last step
let nextDir; // direction for the next step
let food;
let gameOver;

function preload() {
  // SpeechCommands18w knows 18 words: zero-nine, up, down, left, right,
  // go, stop, yes, no
  classifier = ml5.soundClassifier("SpeechCommands18w", {
    probabilityThreshold: 0.7,
  });
}

function setup() {
  createCanvas(640, 480);
  cols = width / cellSize;
  rows = height / cellSize;
  resetGame();

  classifier.classifyStart(gotResult);
}

function resetGame() {
  snake = [{ x: floor(cols / 2), y: floor(rows / 2) }];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  placeFood();
  gameOver = false;
}

function placeFood() {
  // keep picking until the food isn't on the snake
  do {
    food = { x: floor(random(cols)), y: floor(random(rows)) };
  } while (overlaps(food, snake));
}

function overlaps(cell, cells) {
  return cells.some((c) => c.x == cell.x && c.y == cell.y);
}

function turn(x, y) {
  // no turning straight back into yourself
  if (x == -dir.x && y == -dir.y) {
    return;
  }
  nextDir = { x: x, y: y };
}

function gotResult(results) {
  label = results[0].label;

  if (label == "up") {
    turn(0, -1);
  } else if (label == "down") {
    turn(0, 1);
  } else if (label == "left") {
    turn(-1, 0);
  } else if (label == "right") {
    turn(1, 0);
  } else if (label == "go" && gameOver) {
    resetGame();
  }
}

// arrow keys work too, handy for testing without talking
function keyPressed() {
  if (keyCode == UP_ARROW) {
    turn(0, -1);
  } else if (keyCode == DOWN_ARROW) {
    turn(0, 1);
  } else if (keyCode == LEFT_ARROW) {
    turn(-1, 0);
  } else if (keyCode == RIGHT_ARROW) {
    turn(1, 0);
  } else if (key == " " && gameOver) {
    resetGame();
  }
}

function step() {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  snake.unshift(head);

  // eating food: keep the tail so the snake grows by one
  if (head.x == food.x && head.y == food.y) {
    placeFood();
  } else {
    snake.pop();
  }

  // hit a wall or your own body
  const offGrid = head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows;
  if (offGrid || overlaps(head, snake.slice(1))) {
    gameOver = true;
  }
}

function draw() {
  background(20);

  if (!gameOver && frameCount % stepEvery == 0) {
    step();
  }

  noStroke();
  fill(230, 70, 70);
  rect(food.x * cellSize, food.y * cellSize, cellSize, cellSize);

  fill(90, 200, 120);
  for (const c of snake) {
    rect(c.x * cellSize, c.y * cellSize, cellSize - 1, cellSize - 1);
  }

  // score and last word heard
  fill(255);
  textSize(20);
  textAlign(LEFT, TOP);
  text("score: " + (snake.length - 1) + "    heard: " + label, 10, 10);

  if (gameOver) {
    textSize(32);
    textAlign(CENTER, CENTER);
    text('game over\nsay "go" or press space', width / 2, height / 2);
  }
}
