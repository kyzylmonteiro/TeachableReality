const STATUS = document.getElementById("status");
const VIDEO = document.getElementById("webcam");
const PREDICT_BUTTON = document.getElementById("predict");
const MOBILE_NET_INPUT_WIDTH = 224;
const MOBILE_NET_INPUT_HEIGHT = 224;
let predict = false;

PREDICT_BUTTON.addEventListener("click", updateRunModeUI);

import {
  outputData, updateOutputModeUI
} from "./training.js";

import {
  model,
  mobilenet,
  CLASS_NAMES,
} from "./input.js";

export function updateRunModeUI() {

  let imageUploadButtons = document.querySelectorAll("input.output-image");
  let parentDiv = document.getElementsByClassName("class-container")[0];
  for (let i = 0; i < imageUploadButtons.length; i++) {
    let outputImage = document.createElement("canvas");
    const img = new Image();
    img.src = outputData[i];
    outputImage.setAttribute("width", 200)
    outputImage.setAttribute("height", 200)
    var hRatio = outputImage.width / img.width;
    var vRatio = outputImage.height / img.height;
    var ratio = Math.min(hRatio, vRatio);



    var ctx = outputImage.getContext("2d");
    img.onload = () => {
      ctx.clearRect(0, 0, outputImage.width, outputImage.height);
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
      setTimeout(parentDiv.insertBefore(outputImage, imageUploadButtons[i]),0);
    };

    imageUploadButtons[i].classList.add("removed");
  }

  PREDICT_BUTTON.classList.add("removed")

  predict = true;
  predictLoop();
}

export function predictLoop() {
  if (predict) {
    tf.tidy(function () {
      let videoFrameAsTensor = tf.browser.fromPixels(VIDEO).div(255);
      let resizedTensorFrame = tf.image.resizeBilinear(
        videoFrameAsTensor,
        [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH],
        true
      );

      let imageFeatures = mobilenet.predict(resizedTensorFrame.expandDims());
      let prediction = model.predict(imageFeatures).squeeze();
      let highestIndex = prediction.argMax().arraySync();
      let predictionArray = prediction.arraySync();

      var linksOfImages = [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Un1.svg/1200px-Un1.svg.png",
        "https://upload.wikimedia.org/wikipedia/commons/7/75/Logo_TVE-2.svg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Trois.svg/1200px-Trois.svg.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Quatre.svg/1200px-Quatre.svg.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/5.svg/1200px-5.svg.png",
      ];

      let canvas = document.getElementById("output-canvas");
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.setAttribute("width", VIDEO.videoWidth);
        canvas.setAttribute("height", VIDEO.videoHeight);
        canvas.setAttribute("id", "output-canvas");
        document
          .getElementsByClassName("video-container")[0]
          .appendChild(canvas);
      }

      var ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = outputData[highestIndex];
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

      STATUS.innerText =
        "Prediction: " +
        CLASS_NAMES[highestIndex] +
        " with " +
        Math.floor(predictionArray[highestIndex] * 100) +
        "% confidence";
    });

    window.requestAnimationFrame(predictLoop);
  }
}
