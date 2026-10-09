let myVideo;
let myFaceMesh;
let myResults = [];
let bubbles = [];
let eyesWereOpen = true;

// color drift, adapted from a #Genuary2024 Day 4 "Pixel" sketch
// same mode: every bubble drifts toward sameHue (set by eyebrows)
// random mode: every bubble drifts toward its own random hue
let isRandMode = false;
let sameHue = 0;
let colorTimeoutActive = false;

function setup() {
  createCanvas(640, 480);
  // no library flipping here, draw() mirrors everything itself
  myVideo = createCapture(VIDEO);
  myVideo.hide();
  myVideo.size(640, 480);

  myFaceMesh = ml5.faceMesh({ maxFaces: 1 }, modelLoad);
}

function modelLoad() {
  myFaceMesh.detectStart(myVideo, gotFace);
}

function gotFace(results) {
  myResults = results;
}

function draw() {
  // mirror the canvas so video, face points and bubbles flip together
  push();
  translate(width, 0);
  scale(-1, 1);

  image(myVideo, 0, 0, width, height);

  if (myResults.length > 0) {
    const face = myResults[0];

    // 13 = inner upper lip, 14 = inner lower lip
    const upperLip = face.keypoints[13];
    const lowerLip = face.keypoints[14];
    const mouthGap = dist(upperLip.x, upperLip.y, lowerLip.x, lowerLip.y);

    // divide by face width so it works close to or far from the camera
    const mouthOpen = mouthGap / face.box.width;

    // 10 = top of forehead, 105 = left eyebrow
    // eyebrow height -> bubble color
    const browHeight =
      (face.keypoints[105].y - face.keypoints[10].y) / face.box.height;
    const hue = map(browHeight, 0.08, 0.16, 0, 300, true);
    sameHue = hue;

    // open mouth wide enough -> blow a bubble
    if (mouthOpen > 0.08 && frameCount % 4 == 0) {
      const mouthX = (upperLip.x + lowerLip.x) / 2;
      const mouthY = (upperLip.y + lowerLip.y) / 2;
      bubbles.push(new Bubble(mouthX, mouthY, mouthOpen * 300, hue));
    }

    // blink -> pop every bubble
    // eye openness = lid gap / eye width, so it doesn't depend on distance
    // 159/145 = one eye's upper/lower lid, 33/133 = its corners
    // 386/374 = other eye's upper/lower lid, 362/263 = its corners
    const eyeA = eyeOpenness(face, 159, 145, 33, 133);
    const eyeB = eyeOpenness(face, 386, 374, 362, 263);
    const eyesOpen = eyeA > 0.15 || eyeB > 0.15;
    // only pop on the moment the eyes close, not every frame they stay closed
    if (eyesWereOpen && !eyesOpen) {
      for (const b of bubbles) {
        b.pop();
      }
    }
    eyesWereOpen = eyesOpen;

    // draw the lip outline so you can see what the model sees
    noFill();
    stroke(255);
    strokeWeight(2);
    for (const p of face.lips.keypoints) {
      point(p.x, p.y);
    }
  }

  let allCloseEnough = true;
  for (const b of bubbles) {
    if (!b.driftColor()) {
      allCloseEnough = false;
    }
    b.update();
    b.show();
  }
  bubbles = bubbles.filter((b) => !b.isGone());
  pop();

  // once every bubble reaches its target color, pause, then switch modes
  if (bubbles.length > 0 && allCloseEnough && !colorTimeoutActive) {
    colorTimeoutActive = true;
    setTimeout(toggleColorMode, isRandMode ? 50 : 500);
  }
}

function toggleColorMode() {
  isRandMode = !isRandMode;
  if (isRandMode) {
    for (const b of bubbles) {
      b.newTarget();
    }
  }
  colorTimeoutActive = false;
}

function eyeOpenness(face, top, bottom, corner1, corner2) {
  const t = face.keypoints[top];
  const b = face.keypoints[bottom];
  const c1 = face.keypoints[corner1];
  const c2 = face.keypoints[corner2];
  return dist(t.x, t.y, b.x, b.y) / dist(c1.x, c1.y, c2.x, c2.y);
}

class Bubble {
  constructor(x, y, size, hue) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.hue = hue;
    this.newTarget();
    this.speedX = random(-1.5, 1.5);
    this.speedY = random(-3, -1);
    this.popTimer = -1; // -1 = not popping, otherwise counts down to 0
  }

  newTarget() {
    this.targetHue = random(0, 360);
    this.rate = random(3, 10); // hue change per frame
  }

  // move hue one step toward the target, return true when close enough
  driftColor() {
    const target = isRandMode ? this.targetHue : sameHue;
    const closeEnough = abs(this.hue - target) < 10;
    if (!closeEnough) {
      this.hue += (this.hue > target ? -1 : 1) * this.rate;
    }
    return closeEnough;
  }

  pop() {
    if (this.popTimer < 0) {
      this.popTimer = 10;
    }
  }

  update() {
    if (this.popTimer >= 0) {
      this.popTimer--;
      return;
    }
    this.x += this.speedX + sin(frameCount * 0.05 + this.y * 0.02);
    this.y += this.speedY;
  }

  show() {
    push();
    colorMode(HSB);
    if (this.popTimer >= 0) {
      // popping: ring grows and fades out
      const t = 1 - this.popTimer / 10;
      noFill();
      stroke(this.hue, 80, 100, 1 - t);
      strokeWeight(3);
      circle(this.x, this.y, this.size * (1 + t * 0.6));
      pop();
      return;
    }
    stroke(this.hue, 80, 100);
    strokeWeight(2);
    fill(this.hue, 60, 100, 0.25);
    circle(this.x, this.y, this.size);
    // little shine
    noStroke();
    fill(0, 0, 100, 0.8);
    circle(
      this.x - this.size * 0.2,
      this.y - this.size * 0.2,
      this.size * 0.15,
    );
    pop();
  }

  isGone() {
    return this.y < -this.size || this.popTimer == 0;
  }
}
