// built on "Training a Doodle Classifier with Convolutional Layers"
// https://editor.p5js.org/jackbdu/sketches/Id2cg4UQL

const imageWidth = 28;
const imageHeight = 28;
const imageChannels = 1;
const pixelsNum = imageWidth * imageHeight;
const dataLength = 1000; // doodles per label the network trains on
const testLength = 100; // doodles per label it never sees, these become the invaders

// the invaders are the first four, the flying saucer is the mystery ship
const labels = ["star", "moon", "lightning", "cloud", "flying saucer"];
const invaderLabels = labels.slice(0, 4);

let doodleClassifier;
// the example's default layers, with twice the filters and smaller kernels
const customLayers = [
  {
    type: "conv2d",
    filters: 16,
    kernelSize: 3,
    strides: 1,
    activation: "relu",
    kernelInitializer: "varianceScaling",
  },
  {
    type: "maxPooling2d",
    poolSize: [2, 2],
    strides: [2, 2],
  },
  {
    type: "conv2d",
    filters: 32,
    kernelSize: 3,
    strides: 1,
    activation: "relu",
    kernelInitializer: "varianceScaling",
  },
  {
    type: "maxPooling2d",
    poolSize: [2, 2],
    strides: [2, 2],
  },
  {
    type: "flatten",
  },
  {
    type: "dense",
    kernelInitializer: "varianceScaling",
    activation: "softmax",
  },
];
const options = {
  inputs: [imageWidth, imageHeight, imageChannels],
  task: "imageClassification",
  learningRate: 0.1,
  layers: customLayers,
};
const trainingOptions = {
  epochs: 12,
};

const rawData = {};
const allData = [];
const testData = [];
const sprites = {}; // the test doodles as pictures, per label

let state = "training"; // training, testing, ready, playing, gameover
let trainingLog = "getting ready...";
let trainingProgress = 0;
let testIndex = 0;
let testRight = 0;

// the doodle is kept as strokes so it can be redrawn at 28x28 like the dataset
const padX = 520;
const padY = 0;
const padSize = 280;
const doodleSize = 23; // longest side of a doodle in the 28x28 image
const doodleLine = 1.5; // line width in the 28x28 image
const penPause = 400; // ms the pen stays up before the doodle counts as finished
const minConfidence = 0.5;
const minDoodle = 20; // anything smaller on the pad is a tap, not a doodle
let strokes = [];
let penDown = false;
let penUpTime = 0;
let doodleExtent = 0; // longest side of the doodle on the pad
let doodleImage;
let classifying = false;
let guess = []; // latest results from the network, most confident first
let message = "";

// the arcade had 5 rows of 11, this is less because drawing is slower than shooting
const fieldWidth = 520;
const rows = 3;
const cols = 6;
const spriteSize = 56;
const spacing = 70;
const stepSize = 8;
const dropSize = 16;
const cannonY = 512;
const shotSpeed = 14;
let invaders = [];
let shots = [];
let explosions = [];
let ship = null; // the mystery ship
let nextShip = 0; // frame it shows up
let marchDirection = 1;
let marchFrame = 0; // each invader flips between 2 doodles while it marches
let stepTimer = 0;
let cannonX = fieldWidth / 2;
let score = 0;
let wave = 1;

function preload() {
  doodleClassifier = ml5.neuralNetwork(options);
  // the p5 web editor only finds uploaded files when the whole path is one string
  rawData["star"] = loadBytes("data/star1100.bin");
  rawData["moon"] = loadBytes("data/moon1100.bin");
  rawData["lightning"] = loadBytes("data/lightning1100.bin");
  rawData["cloud"] = loadBytes("data/cloud1100.bin");
  rawData["flying saucer"] = loadBytes("data/flying_saucer1100.bin");
}

function setup() {
  createCanvas(800, 560);
  noSmooth(); // keeps the doodle pixels sharp when they're scaled up
  textFont("monospace");

  doodleImage = createGraphics(imageWidth, imageHeight);
  doodleImage.pixelDensity(1);
  doodleImage.background(0);

  for (const label of labels) {
    sprites[label] = [];
    prepareData(rawData[label], label);
  }
  for (const item of testData) {
    sprites[item.outputs[0]].push(makeSprite(item.inputs));
  }

  ml5.setBackend("webgl");

  // ml5 keeps the last 10% for validation, so the labels have to be mixed first
  shuffle(allData, true);
  for (const item of allData) {
    doodleClassifier.addData(item.inputs, item.outputs);
  }

  doodleClassifier.train(trainingOptions, whileTraining, doneTraining);
}

function prepareData(data, label) {
  for (let i = 0; i < dataLength + testLength; i++) {
    const item = {
      inputs: [],
      outputs: [label],
    };
    const offset = i * pixelsNum;
    for (let j = 0; j < pixelsNum; j++) {
      const rawPixelValue = data.bytes[offset + j];
      const normalizedPixelValue = rawPixelValue / 255;
      item.inputs.push(normalizedPixelValue);
    }
    if (i < dataLength) {
      allData.push(item);
    } else {
      testData.push(item);
    }
  }
}

// a doodle from the dataset as a white picture with a see-through background
function makeSprite(inputs) {
  const sprite = createImage(imageWidth, imageHeight);
  sprite.loadPixels();
  for (let i = 0; i < pixelsNum; i++) {
    sprite.pixels[i * 4] = 255;
    sprite.pixels[i * 4 + 1] = 255;
    sprite.pixels[i * 4 + 2] = 255;
    sprite.pixels[i * 4 + 3] = inputs[i] > 0.3 ? 255 : 0;
  }
  sprite.updatePixels();
  return sprite;
}

function whileTraining(epoch, logs) {
  trainingProgress = (epoch + 1) / trainingOptions.epochs;
  trainingLog = `epoch ${epoch + 1}/${trainingOptions.epochs}   loss ${nf(logs.loss, 1, 3)}`;
}

function doneTraining() {
  state = "testing";
  testNext();
}

// quiz the network on the doodles it has never seen
function testNext() {
  if (testIndex == testData.length) {
    state = "ready";
    return;
  }
  doodleClassifier.classify(testData[testIndex].inputs, gotTestResults);
}

function gotTestResults(results) {
  if (results[0].label == testData[testIndex].outputs[0]) {
    testRight++;
  }
  testIndex++;
  testNext();
}

function startGame() {
  score = 0;
  wave = 1;
  state = "playing";
  startWave();
}

function startWave() {
  invaders = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const label = random(invaderLabels);
      invaders.push({
        label: label,
        pictures: [random(sprites[label]), random(sprites[label])],
        x: 20 + c * spacing,
        // every wave starts lower, like the arcade
        y: 90 + r * spacing + min(wave - 1, 5) * dropSize,
        points: (rows - r) * 10,
      });
    }
  }
  shots = [];
  ship = null;
  nextShip = frameCount + 600;
  marchDirection = 1;
  clearDoodle();
  message = "draw an invader to shoot it";
}

function draw() {
  background(0);

  if (state == "playing") {
    updatePen();
    marchInvaders();
    moveShip();
    moveShots();
  }

  if (state == "training" || state == "testing") {
    drawTraining();
  } else {
    drawField();
  }
  drawPad();
  drawPanel();
}

function overPad() {
  return mouseX > padX && mouseX < padX + padSize && mouseY > padY && mouseY < padY + padSize;
}

function mousePressed() {
  if (state == "playing" && overPad()) {
    strokes.push([]);
    penDown = true;
  } else if ((state == "ready" || state == "gameover") && overPad()) {
    startGame();
  }
}

function mouseReleased() {
  if (penDown) {
    penDown = false;
    penUpTime = millis();
  }
}

function keyPressed() {
  if (key == " " && (state == "ready" || state == "gameover")) {
    startGame();
  } else if (key == "c" || key == "C") {
    clearDoodle();
  }
  // stop space from scrolling the page
  if (key == " ") {
    return false;
  }
}

function clearDoodle() {
  strokes = [];
  penDown = false;
}

function updatePen() {
  if (penDown) {
    strokes[strokes.length - 1].push({
      x: constrain(mouseX, padX, padX + padSize),
      y: constrain(mouseY, padY, padY + padSize),
    });
  }
  if (strokes.length > 0 && !classifying) {
    classify();
  }
  // a short pause lets you lift the pen and add another stroke
  if (strokes.length > 0 && !penDown && millis() - penUpTime > penPause) {
    fire();
    clearDoodle();
  }
}

// redraw the doodle the way the Quick, Draw! bitmaps are made: white on black,
// centered, and scaled so the longest side is always the same size
function getDoodlePixels() {
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const points of strokes) {
    for (const p of points) {
      left = min(left, p.x);
      right = max(right, p.x);
      top = min(top, p.y);
      bottom = max(bottom, p.y);
    }
  }
  doodleExtent = max(right - left, bottom - top);
  const zoom = doodleSize / max(doodleExtent, 1);
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;

  doodleImage.background(0);
  doodleImage.noFill();
  doodleImage.stroke(255);
  doodleImage.strokeWeight(doodleLine);
  for (const points of strokes) {
    doodleImage.beginShape();
    for (const p of points) {
      doodleImage.vertex(
        imageWidth / 2 + (p.x - centerX) * zoom,
        imageHeight / 2 + (p.y - centerY) * zoom
      );
    }
    doodleImage.endShape();
  }

  doodleImage.loadPixels();
  const inputs = [];
  for (let i = 0; i < pixelsNum; i++) {
    inputs.push(doodleImage.pixels[i * 4] / 255);
  }
  return inputs;
}

function classify() {
  classifying = true;
  doodleClassifier.classify(getDoodlePixels(), gotResults);
}

function gotResults(results) {
  classifying = false;
  guess = results;
}

function fire() {
  // the network always picks something, even for an empty picture
  if (guess.length == 0 || doodleExtent < minDoodle) {
    return;
  }
  const label = guess[0].label;
  const percent = round(guess[0].confidence * 100) + "%";
  if (guess[0].confidence < minConfidence) {
    message = `not sure, ${label}? ${percent}`;
    return;
  }

  let target = null;
  if (label == "flying saucer") {
    if (ship && !ship.targeted) {
      target = ship;
    }
  } else {
    // the lowest invader of that kind is the closest to landing
    for (const invader of invaders) {
      if (invader.label == label && !invader.targeted && (!target || invader.y > target.y)) {
        target = invader;
      }
    }
  }

  if (target) {
    target.targeted = true;
    shots.push({ y: cannonY, target: target });
    message = `${label} ${percent}, fire!`;
  } else {
    message = `${label} ${percent}, none up there`;
  }
}

function marchInvaders() {
  // the fewer invaders are left, the sooner they step, like the arcade
  const stepDelay = max(6, map(invaders.length, 1, rows * cols, 6, 34) - wave * 2);
  stepTimer++;
  if (stepTimer < stepDelay) {
    return;
  }
  stepTimer = 0;
  marchFrame = 1 - marchFrame;

  // the whole group turns around and drops as soon as one of them hits the edge
  let hitEdge = false;
  for (const invader of invaders) {
    const nextX = invader.x + marchDirection * stepSize;
    if (nextX < 0 || nextX + spriteSize > fieldWidth) {
      hitEdge = true;
    }
  }
  for (const invader of invaders) {
    if (hitEdge) {
      invader.y += dropSize;
    } else {
      invader.x += marchDirection * stepSize;
    }
    if (invader.y + spriteSize >= cannonY) {
      state = "gameover";
      message = "the invaders landed";
    }
  }
  if (hitEdge) {
    marchDirection *= -1;
  }
}

function moveShip() {
  if (!ship && frameCount >= nextShip) {
    ship = {
      label: "flying saucer",
      pictures: [random(sprites["flying saucer"]), random(sprites["flying saucer"])],
      x: -spriteSize,
      y: 22,
      points: random([50, 100, 150, 300]),
    };
  }
  if (ship) {
    ship.x += 1;
    if (ship.x > fieldWidth) {
      ship = null;
      nextShip = frameCount + 900;
    }
  }
}

function moveShots() {
  for (let i = shots.length - 1; i >= 0; i--) {
    const shot = shots[i];
    shot.y -= shotSpeed;
    if (shot.target == ship || invaders.includes(shot.target)) {
      if (shot.y <= shot.target.y + spriteSize) {
        hit(shot.target);
        shots.splice(i, 1);
      }
    } else {
      shots.splice(i, 1); // the ship flew off before the shot got there
    }
  }

  // the aim follows the target, so the cannon glides after the newest shot
  if (shots.length > 0) {
    const newest = shots[shots.length - 1].target;
    cannonX = lerp(cannonX, newest.x + spriteSize / 2, 0.3);
  }

  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].age++;
    if (explosions[i].age > 16) {
      explosions.splice(i, 1);
    }
  }
}

function hit(target) {
  score += target.points;
  explosions.push({ x: target.x + spriteSize / 2, y: target.y + spriteSize / 2, age: 0 });
  if (target == ship) {
    ship = null;
    nextShip = frameCount + 900;
    return;
  }
  invaders.splice(invaders.indexOf(target), 1);
  if (invaders.length == 0) {
    wave++;
    startWave();
  }
}

function drawField() {
  // score
  noStroke();
  fill(255);
  textSize(14);
  textAlign(LEFT, TOP);
  text("SCORE " + nf(score, 5), 12, 6);
  textAlign(RIGHT, TOP);
  text("WAVE " + wave, fieldWidth - 12, 6);

  for (const invader of invaders) {
    image(invader.pictures[marchFrame], invader.x, invader.y, spriteSize, spriteSize);
  }
  if (ship) {
    image(ship.pictures[marchFrame], ship.x, ship.y, spriteSize, spriteSize);
  }

  // shots
  fill(255);
  for (const shot of shots) {
    rect(shot.target.x + spriteSize / 2 - 2, shot.y, 4, 14);
  }

  // explosions
  stroke(255);
  strokeWeight(3);
  for (const e of explosions) {
    for (let a = 0; a < TWO_PI; a += PI / 4) {
      const r1 = 6 + e.age;
      const r2 = 12 + e.age * 2;
      line(e.x + cos(a) * r1, e.y + sin(a) * r1, e.x + cos(a) * r2, e.y + sin(a) * r2);
    }
  }

  // cannon and ground
  noStroke();
  fill(255);
  rect(cannonX - 22, cannonY + 10, 44, 12);
  rect(cannonX - 16, cannonY + 4, 32, 6);
  rect(cannonX - 3, cannonY - 6, 6, 10);
  rect(0, height - 8, fieldWidth, 2);

  // the arcade was black and white with colored cellophane stuck on the screen
  blendMode(MULTIPLY);
  fill(255, 60, 60);
  rect(0, 0, fieldWidth, 80);
  fill(60, 255, 90);
  rect(0, cannonY - 90, fieldWidth, height - cannonY + 90);
  blendMode(BLEND);

  if (state == "ready") {
    drawTitle(`it got ${round((testRight / testData.length) * 100)}% of ${testData.length} new doodles right`);
    drawCentered("click the pad or press SPACE", 330, 16, 255);
  } else if (state == "gameover") {
    drawCentered("GAME OVER", 150, 40, color(255, 60, 60));
    drawCentered("SCORE " + nf(score, 5), 200, 18, 255);
    drawCentered("click the pad or press SPACE", 230, 16, 255);
  }
}

function drawTitle(subtitle) {
  drawCentered("DOODLE INVADERS", 200, 44, 255);
  drawCentered(subtitle, 260, 16, color(60, 255, 90));
}

function drawCentered(words, y, size, c) {
  noStroke();
  fill(c);
  textSize(size);
  textAlign(CENTER, CENTER);
  text(words, fieldWidth / 2, y);
}

// the training screen shows the kinds of doodles the network is learning
function drawTraining() {
  for (let i = 0; i < labels.length; i++) {
    for (let j = 0; j < 8; j++) {
      const sprite = sprites[labels[i]][j];
      tint(255, 90);
      image(sprite, 12 + j * 62, 40 + i * 62 + 60, spriteSize, spriteSize);
      noTint();
    }
  }
  drawCentered("DOODLE INVADERS", 60, 36, 255);
  const status = state == "training" ? "training the CNN   " + trainingLog : "testing it on new doodles...";
  drawCentered(status, 440, 15, color(60, 255, 90));
  noStroke();
  fill(40);
  rect(60, 470, fieldWidth - 120, 12);
  fill(60, 255, 90);
  const progress = state == "training" ? trainingProgress : 1;
  rect(60, 470, (fieldWidth - 120) * progress, 12);
}

function drawPad() {
  noFill();
  stroke(60, 255, 90);
  strokeWeight(2);
  rect(padX + 1, padY + 1, padSize - 2, padSize - 2);

  if (state == "playing" && strokes.length == 0) {
    noStroke();
    fill(70);
    textSize(14);
    textAlign(CENTER, CENTER);
    text("draw here", padX + padSize / 2, padY + padSize / 2);
  }

  noFill();
  stroke(255);
  strokeWeight(8);
  for (const points of strokes) {
    beginShape();
    for (const p of points) {
      vertex(p.x, p.y);
    }
    endShape();
  }
}

function drawPanel() {
  const x = padX + 12;
  const y = padSize + 14;

  // what the network really gets: the doodle after it's squeezed to 28x28
  noStroke();
  fill(160);
  textSize(12);
  textAlign(LEFT, TOP);
  text("WHAT THE CNN SEES", x, y);
  image(doodleImage, x, y + 18, 84, 84);
  noFill();
  stroke(70);
  strokeWeight(1);
  rect(x, y + 18, 84, 84);

  // one bar per label, they also tell you what you can draw
  const barX = x + 96;
  for (let i = 0; i < labels.length; i++) {
    const barY = y + 18 + i * 17;
    const result = guess.find((g) => g.label == labels[i]);
    const confidence = result ? result.confidence : 0;
    noStroke();
    fill(30);
    rect(barX, barY, 160, 14);
    fill(i == labels.length - 1 ? color(255, 60, 60) : color(60, 255, 90));
    rect(barX, barY, 160 * confidence, 14);
    fill(255);
    textSize(11);
    textAlign(LEFT, CENTER);
    text(labels[i], barX + 4, barY + 7);
  }

  noStroke();
  fill(255);
  textSize(14);
  textAlign(LEFT, TOP);
  text(message, x, y + 118);
  fill(120);
  textSize(12);
  text("lift the pen to fire, C to clear", x, y + 140);
}
