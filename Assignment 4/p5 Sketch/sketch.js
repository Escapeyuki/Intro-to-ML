let myVideo;
let myHandPose;
let myResults = [];
let openTime = 0;

function setup() {
  createCanvas(640, 480);
  myVideo = createCapture(VIDEO, {
    flipped: true,
  });
  myVideo.hide();
  myVideo.size(640, 480);

  myHandPose = ml5.handPose(modelLoad);
}

function modelLoad() {
  myHandPose.detectStart(myVideo, gotHand);
}

function gotHand(results) {
  myResults = results;
}

function draw() {
  image(myVideo, 0, 0, width, height);

  // eye stays shut when no hand is found
  let lidGap = 0;

  if (myResults.length > 0) {
    const firstHand = myResults[0];
    const indexFinger = firstHand.index_finger_tip;
    const thumb = firstHand.thumb_tip;
    const distance2Tips = dist(indexFinger.x, indexFinger.y, thumb.x, thumb.y);

    // pinch distance -> how far the eyelids open
    lidGap = map(distance2Tips, 20, 200, 0, 200, true);

    stroke(255, 0, 0);
    strokeWeight(4);
    line(indexFinger.x, indexFinger.y, thumb.x, thumb.y);
  }

  if (lidGap > 150) {
    openTime++;
  } else {
    openTime = 0;
  }
  const redness = map(openTime, 60, 240, 0, 255, true);

  const eyeX = width / 2;
  const eyeY = height / 2;

  // white of the eye
  noStroke();
  fill(255);
  ellipse(eyeX, eyeY, 300, lidGap);

  // iris and pupil, clipped so they only show between the eyelids
  push();
  beginClip();
  ellipse(eyeX, eyeY, 300, lidGap);
  endClip();
  fill(70, 130, 200);
  circle(eyeX, eyeY, 140);
  fill(redness, 0, 0);
  circle(eyeX, eyeY, 60);
  pop();

  // eyelid outline
  noFill();
  stroke(0);
  strokeWeight(6);
  ellipse(eyeX, eyeY, 300, lidGap);

  
}
