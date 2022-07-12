const STATUS = document.getElementById("status");
const VIDEO = document.getElementById("webcam");
const MOBILE_NET_INPUT_WIDTH = 224;
const MOBILE_NET_INPUT_HEIGHT = 224;
const NEXT_BUTTON = document.getElementById("next");
NEXT_BUTTON.addEventListener("click", updateOutputModeUI);


export let trainingDataInputs = [];
export let trainingDataOutputs = [];
export let outputData = [];

import {
  model,
  CLASS_NAMES,
  imageData,
  mobilenet,
} from "./input.js";

export function dataPreProcess() {
  STATUS.innerText = "Training Now! Please Wait...";
  for (let n = 0; n < CLASS_NAMES.length; n++) {
    // console.log(imageData[n]);
    for (let m = 0; m < imageData[n].length; m++) {
      // console.log(n, m);

      let imageFeatures = tf.tidy(function () {
        let videoFrameAsTensor = imageData[n][m];

        let resizedTensorFrame = tf.image.resizeBilinear(
          videoFrameAsTensor,
          [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH],
          true
        );
        let normalizedTensorFrame = resizedTensorFrame.div(255);
        return mobilenet.predict(normalizedTensorFrame.expandDims()).squeeze();
      });

      trainingDataInputs.push(imageFeatures);
      trainingDataOutputs.push(n);
    }
  }
}

export function onFileSelected(event) {
  var selectedFile = event.target.files[0];
  var reader = new FileReader();

  var debugContainer = document.getElementById("debug-container");
  var debugImage = document.getElementById("debug-image");
  if (!debugImage) {
    debugImage = document.createElement("img");
    debugImage.setAttribute("width", "200");
    debugImage.setAttribute("id", "debug-image");
    debugImage.classList.add("removed"); // comment if debugging is needed and selected image should be dispalyed
    debugContainer.appendChild(debugImage);
  }
  debugImage.title = selectedFile.name;
  var classID = event.srcElement.id.match(/[0-9]+$/);

  reader.onload = function (event) {
    setTimeout(displayOnOutputCanvas, 100, event.target.result);
    debugImage.src = event.target.result;
    outputData[classID] = event.target.result;
  };

  reader.readAsDataURL(selectedFile);
}

export function displayOnOutputCanvas(imageData) {
  let canvas = document.getElementById("output-canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.setAttribute("width", VIDEO.videoWidth);
    canvas.setAttribute("height", VIDEO.videoHeight);
    canvas.setAttribute("id", "output-canvas");
    document.getElementsByClassName("video-container")[0].appendChild(canvas);
  }

  var ctx = canvas.getContext("2d");
  const img = new Image();

  img.src = imageData;
  var hRatio = canvas.width / img.width;
  var vRatio = canvas.height / img.height;
  var ratio = Math.min(hRatio, vRatio);
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      img,
      0,
      0,
      img.width,
      img.height,
      0,
      0,
      img.width * ratio,
      img.height * ratio
    );
  };
}

export async function updateOutputModeUI(){
  console.log("updating UI");
  STATUS.innerText = "Training Now! Please Wait...";

  document.getElementById("addClass").classList.add("removed");
  let dataCollectorButtons = document.querySelectorAll("button.dataCollector");
  let parentDiv = document.getElementsByClassName("class-container")[0];
  for (let i = 0; i < dataCollectorButtons.length; i++) {
    let upBtn = document.createElement("input");
    upBtn.setAttribute("type", "file");
    upBtn.setAttribute("id", "output-class" + i);
    upBtn.setAttribute("class", "output-image");
    upBtn.setAttribute("name", "filename");
    upBtn.innerText = "Upload Class " + i + " Output";
    upBtn.addEventListener("change", onFileSelected);
    parentDiv.insertBefore(upBtn, dataCollectorButtons[i]);
    dataCollectorButtons[i].classList.add("removed");
  }

  NEXT_BUTTON.classList.add("removed");
  document.getElementById("predict").classList.remove("removed");

  console.log("Now Training...")
  setTimeout(outputModeAndTrain,10);

}

export async function outputModeAndTrain() {

  for (let i = 0; i < CLASS_NAMES.length; i++) {
    outputData.push("");
  }

  dataPreProcess();
  console.log("trainingDataInputs.length", trainingDataInputs.length);
  console.log("trainingDataOutputs.length", trainingDataOutputs.length);

  //adding layers based on number of classes

  // var model = tf.sequential();
  model.add(
    tf.layers.dense({ inputShape: [1024], units: 128, activation: "relu" })
  );
  model.add(
    tf.layers.dense({ units: CLASS_NAMES.length, activation: "softmax" })
  );

  model.summary();

  // Compile the model with the defined optimizer and specify a loss function to use.
  model.compile({
    // Adam changes the learning rate over time which is useful.
    optimizer: "adam",
    // Use the correct loss function. If 2 classes of data, must use binaryCrossentropy.
    // Else categoricalCrossentropy is used if more than 2 classes.
    loss:
      CLASS_NAMES.length === 2
        ? "binaryCrossentropy"
        : "categoricalCrossentropy",
    // As this is a classification problem you can record accuracy in the logs too!
    metrics: ["accuracy"],
  });

  // training and predicting starting

  tf.util.shuffleCombo(trainingDataInputs, trainingDataOutputs);
  let outputsAsTensor = tf.tensor1d(trainingDataOutputs, "int32");
  let oneHotOutputs = tf.oneHot(outputsAsTensor, CLASS_NAMES.length);
  let inputsAsTensor = tf.stack(trainingDataInputs);

  let results = await model.fit(inputsAsTensor, oneHotOutputs, {
    shuffle: true,
    batchSize: 5,
    epochs: 10,
    callbacks: { onEpochEnd: logProgress },
  });

  outputsAsTensor.dispose();
  oneHotOutputs.dispose();
  inputsAsTensor.dispose();
}

function logProgress(epoch, logs) {
  console.log("Data for epoch " + epoch, logs);
}
