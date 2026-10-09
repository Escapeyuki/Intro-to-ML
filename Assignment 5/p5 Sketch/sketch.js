let myVideo;
let myFaceMesh;
let myResults = [];
let bubbles = [];

function setup() {
  createCanvas(640, 480);
  myVideo = createCapture(VIDEO, {
    flipped: true,
  });
  myVideo.hide();
  myVideo.size(640, 480);

  myFaceMesh = ml5.faceMesh({ maxFaces: 1, flipped: true }, modelLoad);
}

function modelLoad() {
  myFaceMesh.detectStart(myVideo, gotFace);
}

function gotFace(results) {
  myResults = results;
}

function draw() {
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

    // open mouth wide enough -> blow a bubble
    if (mouthOpen > 0.08 && frameCount % 4 == 0) {
      const mouthX = (upperLip.x + lowerLip.x) / 2;
      const mouthY = (upperLip.y + lowerLip.y) / 2;
      bubbles.push(new Bubble(mouthX, mouthY, mouthOpen * 300, hue));
    }

    // draw the lip outline so you can see what the model sees
    noFill();
    stroke(255);
    strokeWeight(2);
    for (const p of face.lips.keypoints) {
      point(p.x, p.y);
    }
  }

  for (const b of bubbles) {
    b.update();
    b.show();
  }
  bubbles = bubbles.filter((b) => !b.isGone());
}

class Bubble {
  constructor(x, y, size, hue) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.hue = hue;
    this.speedX = random(-1.5, 1.5);
    this.speedY = random(-3, -1);
  }

  update() {
    this.x += this.speedX + sin(frameCount * 0.05 + this.y * 0.02);
    this.y += this.speedY;
  }

  show() {
    push();
    colorMode(HSB);
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
    return this.y < -this.size;
  }
}
