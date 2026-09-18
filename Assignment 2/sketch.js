let classifier;

let video;

let imageModeURL = "URL";

function preload() {
  classifier = ml5.imageClassifier(imageModeURL + "model.json");
}

function setup() {
  createCanvas(640, 480);

  video = createCapture(VIDEO, {flipped : true});
  video.size(640, 480);
  video.hide();

  classifier.classify(video, gotResult);

}

function draw() {
  image(video, 0, 0);
  fill(0, 255, 0)
  textSize(32);
  text(label, 20, 50);


}

function gotResult(results) {
  label = results[0].label;
  classifier.classify(video, gotResult);

}