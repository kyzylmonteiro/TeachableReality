const STATUS = document.getElementById("status");
const VIDEO = document.getElementById("webcam");
const ENABLE_CAM_BUTTON = document.getElementById("enableCam");
const ADD_CLASS = document.getElementById("addClass");
// const RESET_BUTTON = document.getElementById("reset");
const MOBILE_NET_INPUT_WIDTH = 224;
const MOBILE_NET_INPUT_HEIGHT = 224;
const STOP_DATA_GATHER = -1;
export const CLASS_NAMES = [];

ENABLE_CAM_BUTTON.addEventListener("click", enableCam);
ADD_CLASS.addEventListener("click", addClass);
// RESET_BUTTON.addEventListener("click", reset);

function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function enableCam() {
  if (hasGetUserMedia()) {
    // getUsermedia parameters.
    const constraints = {
      video: true,
      width: 640,
      height: 480,
    };

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
      VIDEO.srcObject = stream;
      VIDEO.addEventListener("loadeddata", function () {
        videoPlaying = true;
        ENABLE_CAM_BUTTON.classList.add("removed");
      });
    });

    ADD_CLASS.classList.remove("removed")
    document.getElementById("next").classList.remove("removed")
    let mode = document.getElementById("debug-container");
    mode.innerText = "Input Mode"
    setTimeout(addClass, 1000);
    setTimeout(addClass, 1000);
  } else {
    console.warn("getUserMedia() is not supported by your browser");
  }
}

export var model = tf.sequential();
async function loadMobileNetFeatureModel() {
  const URL =
    "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1";

  mobilenet = await tf.loadGraphModel(URL, { fromTFHub: true });
  STATUS.innerText = "MobileNet v3 loaded successfully!";

  // Warm up the model by passing zeros through it once.
  tf.tidy(function () {
    let answer = mobilenet.predict(
      tf.zeros([1, MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH, 3])
    );
    console.log(answer.shape);
  });
}
// Call the function immediately to start loading.
loadMobileNetFeatureModel();

function logProgress(epoch, logs) {
  console.log("Data for epoch " + epoch, logs);
}

function gatherDataForClass() {
  let classNumber = parseInt(this.getAttribute("data-1hot"));
  gatherDataState =
    gatherDataState === STOP_DATA_GATHER ? classNumber : STOP_DATA_GATHER;
  dataGatherLoop(classNumber);
}

export let mobilenet = undefined;
export let gatherDataState = STOP_DATA_GATHER;
export let videoPlaying = false;
export let examplesCount = [];
export let predict = false;

export let imageData = [];

function dataGatherLoop(classNumber) {
  if (imageData[classNumber] == undefined) {
    imageData[classNumber] = [];
  }

  if (videoPlaying && gatherDataState !== STOP_DATA_GATHER) {
    var canvas = capture(VIDEO, 0.25, classNumber);
    let videoFrameAsTensor = tf.browser.fromPixels(VIDEO);

    imageData[classNumber].push(videoFrameAsTensor);

    if (examplesCount[gatherDataState] === undefined) {
      examplesCount[gatherDataState] = 0;
    }
    examplesCount[gatherDataState]++;

    STATUS.innerText = "";
    for (let n = 0; n < CLASS_NAMES.length; n++) {
      STATUS.innerText +=
        CLASS_NAMES[n] + " data count: " + examplesCount[n] + ". ";
    }
    // window.requestAnimationFrame(dataGatherLoop);
    setTimeout(dataGatherLoop, 10, classNumber);
  }
}

function capture(video, scaleFactor, classNumber) {
  if (scaleFactor == null) {
    scaleFactor = 1;
  }

  var w = video.videoWidth * scaleFactor;
  var h = video.videoHeight * scaleFactor;
  var canvas = document.getElementById("class" + (classNumber + 1) + "-canvas");
  canvas.width = w;
  canvas.height = h;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, w, h);
  return canvas;
}

// function reset() {
//   // to update, only clears training input for now
//   predict = false;
//   examplesCount.length = 0;
//   for (let i = 0; i < trainingDataInputs.length; i++) {
//     trainingDataInputs[i].dispose();
//   }
//   trainingDataInputs.length = 0;
//   trainingDataOutputs.length = 0;
//   STATUS.innerText = "No data collected";

//   console.log("Tensors in memory: " + tf.memory().numTensors);
// }

let dataCollectorButtons = document.querySelectorAll("button.dataCollector");

for (let i = 0; i < dataCollectorButtons.length; i++) {
  dataCollectorButtons[i].addEventListener("mousedown", gatherDataForClass);
  dataCollectorButtons[i].addEventListener("mouseup", gatherDataForClass);
  // Populate the human readable names for classes.
  CLASS_NAMES.push(dataCollectorButtons[i].getAttribute("data-name"));
}

function addClass() {
  let btn = document.createElement("button");
  btn.innerHTML = "Gather Class " + (CLASS_NAMES.length + 1) + " Data";
  btn.setAttribute("class", "dataCollector");
  btn.setAttribute("data-1hot", CLASS_NAMES.length);
  btn.setAttribute("data-name", "Class " + (CLASS_NAMES.length + 1));

  btn.addEventListener("mousedown", gatherDataForClass);
  btn.addEventListener("mouseup", gatherDataForClass);
  let canvasConatainer = document.createElement("div");
  canvasConatainer.setAttribute("class", "class-canvas-container");
  canvasConatainer.setAttribute(
    "id",
    "class" + (CLASS_NAMES.length + 1) + "-canvas-container"
  );

  let canvas = document.createElement("canvas");
  canvas.setAttribute("class", "data-canvas");
  canvas.setAttribute("id", "class" + (CLASS_NAMES.length + 1) + "-canvas");
  canvas.setAttribute("width", VIDEO.videoWidth * 0.25);
  canvas.setAttribute("height", VIDEO.videoHeight * 0.25);
  var ctx = canvas.getContext("2d");
  const blank = new Image();
  blank.src = "./images/blankClass.png";
  blank.onload = () => {
    ctx.drawImage(
      blank,
      0,
      0,
      VIDEO.videoWidth * 0.25,
      VIDEO.videoHeight * 0.25
    );
  };
  canvasConatainer.appendChild(canvas);

  // Populate the human readable names for classes.
  CLASS_NAMES.push(btn.getAttribute("data-name"));

  let ele = document.getElementsByClassName("class-container");
  ele[0].appendChild(canvasConatainer);
  ele[0].appendChild(btn);
}
