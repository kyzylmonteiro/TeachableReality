const STATUS = document.getElementById("status");
const VIDEO = document.getElementById("webcam");
const MOBILE_NET_INPUT_WIDTH = 224;
const MOBILE_NET_INPUT_HEIGHT = 224;
let predict = false;

import {trainingDataInputs,trainingDataOutputs, outputData, model, mobilenet, CLASS_NAMES} from './Input.js';

export function predictVideo(){
    predict = true;
    predictLoop();
  }
  
  
  export function onFileSelected(event){
    var selectedFile = event.target.files[0];
    var reader = new FileReader();
  
    var debugContainer = document.getElementById("debug-container")     
    var debugImage = document.getElementById("debug-image");
    if(!debugImage){
      debugImage = document.createElement("img");
      debugImage.setAttribute("width","200")
      debugImage.setAttribute("id","debug-image")
      debugImage.classList.add("removed"); // uncomment if debugging is needed and selected image should be dispalyed
      debugContainer.appendChild(debugImage)
    }
    debugImage.title = selectedFile.name;
    var classID = event.srcElement.id.match(/[0-9]+$/)
  
    reader.onload = function(event) {
      setTimeout(displayOnOutputCanvas,100,event.target.result)
      debugImage.src = event.target.result;
      outputData[classID] = event.target.result;
    };
  
    reader.readAsDataURL(selectedFile);
  }
  
  export function displayOnOutputCanvas(imageData){
    let canvas = document.getElementById("output-canvas");
    if(!canvas){
      canvas = document.createElement("canvas");
      canvas.setAttribute("width", VIDEO.videoWidth);
      canvas.setAttribute("height", VIDEO.videoHeight);
      canvas.setAttribute("id","output-canvas");
      document.getElementsByClassName("video-container")[0].appendChild(canvas);
    }
  
    var ctx = canvas.getContext("2d");
    const img = new Image();
  
    img.src = imageData;
    var hRatio = canvas.width / img.width    ;
    var vRatio = canvas.height / img.height  ;
    var ratio  = Math.min ( hRatio, vRatio );
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0,0, img.width, img.height, 0,0,img.width*ratio, img.height*ratio);
    };
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
        if(!canvas){
          canvas = document.createElement("canvas");
          canvas.setAttribute("width", VIDEO.videoWidth);
          canvas.setAttribute("height", VIDEO.videoHeight);
          canvas.setAttribute("id","output-canvas");
          document.getElementsByClassName("video-container")[0].appendChild(canvas);
        }
        
        var ctx = canvas.getContext("2d");
        const img = new Image();
        img.src = outputData[highestIndex];
        var hRatio = canvas.width / img.width    ;
        var vRatio = canvas.height / img.height  ;
        var ratio  = Math.min ( hRatio, vRatio );
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0,0, img.width, img.height, 0,0,img.width*ratio, img.height*ratio);
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

