let video;
let handPose;
let hands = [];
let nn;

// directions you can teach, picked with the arrow keys
// each one wears a ghost's color: Blinky, Pinky, Inky, Clyde
const directions = ["up", "down", "left", "right"];
const arrows = ["↑", "↓", "←", "→"];
const colors = [
  [255, 0, 0], // Blinky red
  [255, 184, 255], // Pinky pink
  [0, 255, 255], // Inky cyan
  [255, 184, 82], // Clyde orange
];
// how each direction moves on the grid, and which one turns it around
const steps = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];
const opposite = [1, 0, 3, 2];
let current = 0; // index of the selected direction
let counts = directions.map(() => 0); // examples recorded per direction

let state = "collecting"; // collecting, training, playing
let message = "arrows pick, hold SPACE to record, T to train";
const epochs = 50;

let guess = -1; // direction the network sees, -1 before the first guess
let confidence = 0;

// # wall, . dot, space empty path, P where pac-man starts
// row 7 runs off both sides: that's the warp tunnel
const maze = [
  "####################",
  "#........##........#",
  "#.##.###.##.###.##.#",
  "#..................#",
  "#.##.#.######.#.##.#",
  "#....#...##...#....#",
  "####.###.##.###.####",
  "    .#........#.    ",
  "####.#.######.#.####",
  "#........P.........#",
  "#.##.###.##.###.##.#",
  "#..#.....##.....#..#",
  "##.#.#.######.#.#.##",
  "#..................#",
  "####################",
];
const tile = 32;
const cols = 20;
const rows = 15;
const speed = 2; // pixels per frame, has to divide the tile size
let grid; // the maze as a 2D array, dots disappear as they're eaten
let pac;
let score = 0;
let dotsLeft = 0;

function preload() {
  handPose = ml5.handPose({ maxHands: 1 });
}

function setup() {
  createCanvas(640, 560);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  handPose.detectStart(video, gotHands);

  nn = ml5.neuralNetwork({
    task: "classification",
    debug: true,
  });

  loadMaze();
}

function loadMaze() {
  grid = maze.map((row) => row.split(""));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] == ".") {
        dotsLeft++;
      } else if (grid[r][c] == "P") {
        // dir is where pac-man is going, next is where the hand wants to go
        pac = { x: c * tile + tile / 2, y: r * tile + tile / 2, dir: -1, next: -1, facing: 2 };
        grid[r][c] = " ";
      }
    }
  }
}

// all 21 keypoints, measured from the wrist and scaled by the hand's size,
// so the guess depends on the shape of the hand, not where it is on screen
function handInputs(hand) {
  const wrist = hand.keypoints[0];
  const middle = hand.keypoints[9]; // base of the middle finger
  const size = dist(wrist.x, wrist.y, middle.x, middle.y);
  const inputs = [];
  for (const k of hand.keypoints) {
    inputs.push((k.x - wrist.x) / size, (k.y - wrist.y) / size);
  }
  return inputs;
}

function gotHands(results) {
  hands = results;
  if (hands.length == 0) {
    return;
  }
  const inputs = handInputs(hands[0]);

  // holding space records one example every time a hand is detected
  if (state == "collecting" && keyIsDown(32)) {
    nn.addData(inputs, [directions[current]]);
    counts[current]++;
  } else if (state == "playing") {
    nn.classify(inputs, gotClassification);
  }
}

function gotClassification(results) {
  // the most confident direction comes first
  guess = directions.indexOf(results[0].label);
  confidence = results[0].confidence;
  pac.next = guess;
}

function keyPressed() {
  const arrow = [UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW].indexOf(keyCode);
  if (arrow != -1) {
    current = arrow;
  } else if ((key == "t" || key == "T") && state == "collecting") {
    startTraining();
  }
  // stop space and the arrows from scrolling the page
  if (key == " " || arrow != -1) {
    return false;
  }
}

function startTraining() {
  // pac-man needs all four ways to get around the tunnel
  if (counts.some((c) => c == 0)) {
    message = "record poses for all 4 directions first";
    return;
  }
  state = "training";
  message = "training...";
  nn.normalizeData();
  nn.train({ epochs: epochs, batchSize: 10 }, whileTraining, finishedTraining);
}

function whileTraining(epoch, logs) {
  message = "epoch " + (epoch + 1) + "/" + epochs + "   loss " + nf(logs.loss, 1, 4);
}

function finishedTraining() {
  state = "playing";
  message = "steer with your hand, eat the dots";
}

// columns wrap around for the tunnel, above and below the maze is wall
function isWall(c, r) {
  if (r < 0 || r >= rows) {
    return true;
  }
  return grid[r][(c + cols) % cols] == "#";
}

function movePac() {
  // turning around works anywhere, like the arcade
  if (pac.dir != -1 && pac.next == opposite[pac.dir]) {
    pac.dir = pac.next;
  }

  // other turns wait for the middle of a tile, so pac-man stays in the lanes
  if ((pac.x - tile / 2) % tile == 0 && (pac.y - tile / 2) % tile == 0) {
    const c = (pac.x - tile / 2) / tile;
    const r = (pac.y - tile / 2) / tile;
    if (grid[r][c] == ".") {
      grid[r][c] = " ";
      score += 10;
      dotsLeft--;
      if (dotsLeft == 0) {
        message = "you cleared the tunnel!";
      }
    }
    const next = steps[pac.next];
    if (pac.next != -1 && !isWall(c + next[0], r + next[1])) {
      pac.dir = pac.next;
    }
    // keep going until a wall is in the way
    const ahead = steps[pac.dir];
    if (pac.dir != -1 && isWall(c + ahead[0], r + ahead[1])) {
      pac.dir = -1;
    }
  }

  if (pac.dir != -1) {
    pac.x += steps[pac.dir][0] * speed;
    pac.y += steps[pac.dir][1] * speed;
    pac.facing = pac.dir;
  }

  // out one side of the tunnel, in the other
  pac.x = (pac.x + width) % width;
}

function draw() {
  background(0);

  if (state == "playing") {
    movePac();
    drawMaze();
    drawPac();
  } else {
    // mirror the camera so it moves like a mirror
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, 480);
    drawHand(10);
    pop();
  }

  drawPanel();
}

function drawMaze() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tile;
      const y = r * tile;
      if (grid[r][c] == "#") {
        // blue outline wherever a wall touches a path
        stroke(33, 33, 255);
        strokeWeight(3);
        if (!isWall(c, r - 1)) line(x, y, x + tile, y);
        if (!isWall(c, r + 1)) line(x, y + tile, x + tile, y + tile);
        if (!isWall(c - 1, r)) line(x, y, x, y + tile);
        if (!isWall(c + 1, r)) line(x + tile, y, x + tile, y + tile);
      } else if (grid[r][c] == ".") {
        noStroke();
        fill(255, 184, 174);
        rect(x + tile / 2 - 3, y + tile / 2 - 3, 6, 6);
      }
    }
  }
}

function drawPac() {
  // the mouth chomps while moving ("paku paku") and stays half open when stopped
  let mouth = 0.4;
  if (pac.dir != -1) {
    mouth = abs(sin(frameCount * 0.3)) * 0.8;
  }
  noStroke();
  fill(255, 255, 0);
  // extra copies one maze-width to each side let it slide through the tunnel
  for (const offset of [-width, 0, width]) {
    push();
    translate(pac.x + offset, pac.y);
    rotate(atan2(steps[pac.facing][1], steps[pac.facing][0]));
    arc(0, 0, 26, 26, mouth, TWO_PI - mouth, PIE);
    pop();
  }
}

function drawHand(size) {
  if (hands.length == 0) {
    return;
  }
  noStroke();
  if (state != "playing") {
    fill(colors[current]);
  } else if (guess != -1) {
    fill(colors[guess]);
  } else {
    fill(255);
  }
  for (const k of hands[0].keypoints) {
    circle(k.x, k.y, size);
  }
}

function drawPanel() {
  noStroke();
  fill(20);
  rect(0, 480, width, 80);

  // one swatch per direction with how many examples it has,
  // outlined while you pick it, or while pac-man is following it
  textAlign(CENTER, CENTER);
  textSize(14);
  for (let i = 0; i < directions.length; i++) {
    const x = 16 + i * 52;
    if ((i == current && state == "collecting") || (i == guess && state == "playing")) {
      stroke(255);
      strokeWeight(3);
    } else {
      noStroke();
    }
    fill(colors[i]);
    rect(x, 490, 40, 40, 6);
    noStroke();
    fill(0);
    text(arrows[i], x + 20, 510);
    fill(200);
    text(counts[i], x + 20, 545);
  }

  textAlign(LEFT, CENTER);
  fill(255);
  text(message, 240, 505);
  if (state == "playing") {
    let line2 = "SCORE " + score;
    if (guess != -1) {
      line2 += "     " + directions[guess] + " " + round(confidence * 100) + "%";
    }
    text(line2, 240, 535);

    // small mirrored camera so you can see your hand while you play
    push();
    translate(width, 480);
    scale(-107 / 640, 80 / 480);
    image(video, 0, 0, 640, 480);
    drawHand(30);
    pop();
  } else if (state == "collecting" && keyIsDown(32) && hands.length > 0) {
    fill(230, 60, 60);
    text("● recording", 240, 535);
  }
}
