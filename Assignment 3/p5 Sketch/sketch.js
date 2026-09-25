let video;
let bodyPose;
let poses = [];

let bodySegmentation;
let segmentation;
let options = {
  maskType: "person",
};

// smoothed angles to reduce jitter
let smoothHead = 0;
let smoothShoulder = 0;

function preload() {
  bodyPose = ml5.bodyPose();
  bodySegmentation = ml5.bodySegmentation("SelfieSegmentation", options);
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  bodyPose.detectStart(video, gotPoses);
  bodySegmentation.detectStart(video, gotResults);

  textAlign(CENTER, CENTER);
}

function draw() {
  background(0, 255, 0);

  push();
  translate(width, 0);
  scale(-1, 1);

  // draw only the person, cut out of the video
  if (segmentation) {
    let frame = video.get();
    frame.mask(segmentation.mask);
    image(frame, 0, 0, width, height);
  }

  if (poses && poses[0]) {
    drawPose(poses[0]);
  }
  pop();
}

function drawPose(pose) {
  const nose = pose.nose;
  const left_shoulder = pose.left_shoulder;
  const right_shoulder = pose.right_shoulder;
  const left_elbow = pose.left_elbow;
  const right_elbow = pose.right_elbow;
  const left_eye = pose.left_eye;
  const right_eye = pose.right_eye;

  // head tilt from the line between the eyes
  const headAngle = atan2(left_eye.y - right_eye.y, left_eye.x - right_eye.x);
  smoothHead = lerp(smoothHead, headAngle, 0.2);

  const eyeDist = dist(left_eye.x, left_eye.y, right_eye.x, right_eye.y);
  textSize(eyeDist / 1.5);
  drawRotated("👃", nose.x, nose.y, smoothHead);
  drawRotated("👁️", left_eye.x, left_eye.y, smoothHead);
  drawRotated("👁️", right_eye.x, right_eye.y, smoothHead);

  // arms
  stroke(255, 0, 0);
  strokeWeight(10);
  line(left_shoulder.x, left_shoulder.y, right_shoulder.x, right_shoulder.y);
  line(left_shoulder.x, left_shoulder.y, left_elbow.x, left_elbow.y);
  line(right_elbow.x, right_elbow.y, right_shoulder.x, right_shoulder.y);

  // shoulder tilt
  const shoulderAngle = atan2(
    left_shoulder.y - right_shoulder.y,
    left_shoulder.x - right_shoulder.x,
  );
  smoothShoulder = lerp(smoothShoulder, shoulderAngle, 0.2);

  const shoulderDist = dist(
    left_shoulder.x,
    left_shoulder.y,
    right_shoulder.x,
    right_shoulder.y,
  );
  const middleShoulderX = (left_shoulder.x + right_shoulder.x) / 2;
  const middleShoulderY = (left_shoulder.y + right_shoulder.y) / 2;

  noStroke();
  textSize(shoulderDist / 3);

  // rotate the row of sunflowers around the middle of the shoulders
  push();
  translate(middleShoulderX, middleShoulderY);
  rotate(smoothShoulder);
  text("🌻", -shoulderDist / 3, 0);
  text("🌻", 0, 0);
  text("🌻", shoulderDist / 3, 0);
  pop();
}

function drawRotated(emoji, x, y, angle) {
  push();
  translate(x, y);
  rotate(angle);
  text(emoji, 0, 0);
  pop();
}

function gotPoses(results) {
  poses = results;
}

function gotResults(result) {
  segmentation = result;
}
