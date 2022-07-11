const STATUS = document.getElementById("status");
const MOBILE_NET_INPUT_WIDTH = 224;
const MOBILE_NET_INPUT_HEIGHT = 224;

import {
  predictVideo,
  onFileSelected,
  displayOnOutputCanvas,
  predictLoop,
} from "./predict.js";
import {
  trainingDataInputs,
  trainingDataOutputs,
  outputData,
  model,
  CLASS_NAMES,
  imageData,
  mobilenet,
  predict,
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

export async function outputModeAndTrain() {
  console.log("Training...");
  STATUS.innerText = "Training Now! Please Wait...";

  let dataCollectorButtons = document.querySelectorAll("button.dataCollector");
  let parentDiv = document.getElementsByClassName("class-container")[0];
  for (let i = 0; i < dataCollectorButtons.length; i++) {
    let upBtn = document.createElement("input");
    upBtn.setAttribute("type", "file");
    upBtn.setAttribute("id", "output-class" + i);
    upBtn.setAttribute("name", "filename");
    upBtn.innerText = "Upload Class " + i + " Output";
    upBtn.addEventListener("change", onFileSelected);
    parentDiv.insertBefore(upBtn, dataCollectorButtons[i]);
    dataCollectorButtons[i].classList.add("removed");
  }

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
