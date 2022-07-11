// const STATUS = document.getElementById("status");
// const VIDEO = document.getElementById("webcam");
// const ENABLE_CAM_BUTTON = document.getElementById("enableCam");
// const ADD_CLASS = document.getElementById("addClass");
// const RESET_BUTTON = document.getElementById("reset");
// const NEXT_BUTTON = document.getElementById("next");
// const PREDICT_BUTTON = document.getElementById("predict");
// const MOBILE_NET_INPUT_WIDTH = 224;
// const MOBILE_NET_INPUT_HEIGHT = 224;
// const STOP_DATA_GATHER = -1;
// const CLASS_NAMES = [];

// ENABLE_CAM_BUTTON.addEventListener("click", enableCam);
// ADD_CLASS.addEventListener("click", addClass);
// NEXT_BUTTON.addEventListener("click", outputModeAndTrain);
// PREDICT_BUTTON.addEventListener("click", predictVideo);
// RESET_BUTTON.addEventListener("click", reset);

// function hasGetUserMedia() {
//   return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
// }

// function enableCam() {
//   if (hasGetUserMedia()) {
//     // getUsermedia parameters.
//     const constraints = {
//       video: true,
//       width: 640,
//       height: 480,
//     };

//     // Activate the webcam stream.
//     navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
//       VIDEO.srcObject = stream;
//       VIDEO.addEventListener("loadeddata", function () {
//         videoPlaying = true;
//         ENABLE_CAM_BUTTON.classList.add("removed");
//       });
//     });

//     setTimeout(addClass, 1000);
//     setTimeout(addClass, 1000);
//   } else {
//     console.warn("getUserMedia() is not supported by your browser");
//   }
// }

// var model = tf.sequential();
// async function loadMobileNetFeatureModel() {
//   const URL =
//     "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1";

//   mobilenet = await tf.loadGraphModel(URL, { fromTFHub: true });
//   STATUS.innerText = "MobileNet v3 loaded successfully!";

//   // Warm up the model by passing zeros through it once.
//   tf.tidy(function () {
//     let answer = mobilenet.predict(
//       tf.zeros([1, MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH, 3])
//     );
//     console.log(answer.shape);
//   });
// }
// // Call the function immediately to start loading.
// loadMobileNetFeatureModel();

// async function outputModeAndTrain() {
//   console.log("Training...");
//   STATUS.innerText = "Training Now! Please Wait...";

//   let dataCollectorButtons = document.querySelectorAll("button.dataCollector");
//   let parentDiv = document.getElementsByClassName("class-container")[0]
//   for (let i = 0; i < dataCollectorButtons.length; i++) {
//     let upBtn = document.createElement("input");
//     upBtn.setAttribute("type", "file")
//     upBtn.setAttribute("id", "output-class"+i)
//     upBtn.setAttribute("name","filename")
//     upBtn.innerText = "Upload Class " + (i) + " Output";
//     upBtn.addEventListener("change", onFileSelected);
//     parentDiv.insertBefore(upBtn,dataCollectorButtons[i]);
//     dataCollectorButtons[i].classList.add("removed");
//   }

//   for (let i = 0; i < CLASS_NAMES.length; i++) {
//     outputData.push('');    
//   }


//   dataPreProcess();
//   console.log("trainingDataInputs.length", trainingDataInputs.length);
//   console.log("trainingDataOutputs.length", trainingDataOutputs.length);

//   //adding layers based on number of classes

//   // var model = tf.sequential();
//   model.add(
//     tf.layers.dense({ inputShape: [1024], units: 128, activation: "relu" })
//   );
//   model.add(
//     tf.layers.dense({ units: CLASS_NAMES.length, activation: "softmax" })
//   );

//   model.summary();

//   // Compile the model with the defined optimizer and specify a loss function to use.
//   model.compile({
//     // Adam changes the learning rate over time which is useful.
//     optimizer: "adam",
//     // Use the correct loss function. If 2 classes of data, must use binaryCrossentropy.
//     // Else categoricalCrossentropy is used if more than 2 classes.
//     loss:
//       CLASS_NAMES.length === 2
//         ? "binaryCrossentropy"
//         : "categoricalCrossentropy",
//     // As this is a classification problem you can record accuracy in the logs too!
//     metrics: ["accuracy"],
//   });

//   // training and predicting starting

//   predict = false;
//   tf.util.shuffleCombo(trainingDataInputs, trainingDataOutputs);
//   let outputsAsTensor = tf.tensor1d(trainingDataOutputs, "int32");
//   let oneHotOutputs = tf.oneHot(outputsAsTensor, CLASS_NAMES.length);
//   let inputsAsTensor = tf.stack(trainingDataInputs);

//   let results = await model.fit(inputsAsTensor, oneHotOutputs, {
//     shuffle: true,
//     batchSize: 5,
//     epochs: 10,
//     callbacks: { onEpochEnd: logProgress },
//   });

//   outputsAsTensor.dispose();
//   oneHotOutputs.dispose();
//   inputsAsTensor.dispose();
// }

// function logProgress(epoch, logs) {
//   console.log("Data for epoch " + epoch, logs);
// }

// function reset() { // to update, only clears training input for now
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

// let dataCollectorButtons = document.querySelectorAll("button.dataCollector");
// for (let i = 0; i < dataCollectorButtons.length; i++) {
//   dataCollectorButtons[i].addEventListener("mousedown", gatherDataForClass);
//   dataCollectorButtons[i].addEventListener("mouseup", gatherDataForClass);
//   // Populate the human readable names for classes.
//   CLASS_NAMES.push(dataCollectorButtons[i].getAttribute("data-name"));
// }

// function gatherDataForClass() {
//   let classNumber = parseInt(this.getAttribute("data-1hot"));
//   gatherDataState =
//     gatherDataState === STOP_DATA_GATHER ? classNumber : STOP_DATA_GATHER;
//   dataGatherLoop(classNumber);
// }

// let mobilenet = undefined;
// let gatherDataState = STOP_DATA_GATHER;
// let videoPlaying = false;
// let trainingDataInputs = [];
// let trainingDataOutputs = [];
// let examplesCount = [];
// let predict = false;
// let outputData = []

// let imageData = [];

// function dataGatherLoop(classNumber) {
//   if (imageData[classNumber] == undefined) {
//     imageData[classNumber] = [];
//   }

//   if (videoPlaying && gatherDataState !== STOP_DATA_GATHER) {
//     var canvas = capture(VIDEO, 0.25, classNumber);
//     let videoFrameAsTensor = tf.browser.fromPixels(VIDEO);

//     imageData[classNumber].push(videoFrameAsTensor);

//     if (examplesCount[gatherDataState] === undefined) {
//       examplesCount[gatherDataState] = 0;
//     }
//     examplesCount[gatherDataState]++;

//     STATUS.innerText = "";
//     for (let n = 0; n < CLASS_NAMES.length; n++) {
//       STATUS.innerText +=
//         CLASS_NAMES[n] + " data count: " + examplesCount[n] + ". ";
//     }
//     // window.requestAnimationFrame(dataGatherLoop);
//     setTimeout(dataGatherLoop, 10, classNumber);
//   }
// }

// function dataPreProcess() {
//   STATUS.innerText = "Training Now! Please Wait...";
//   for (let n = 0; n < CLASS_NAMES.length; n++) {
//     // console.log(imageData[n]);
//     for (let m = 0; m < imageData[n].length; m++) {
//       // console.log(n, m);

//       let imageFeatures = tf.tidy(function () {
//         let videoFrameAsTensor = imageData[n][m];

//         let resizedTensorFrame = tf.image.resizeBilinear(
//           videoFrameAsTensor,
//           [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH],
//           true
//         );
//         let normalizedTensorFrame = resizedTensorFrame.div(255);
//         return mobilenet.predict(normalizedTensorFrame.expandDims()).squeeze();
//       });

//       trainingDataInputs.push(imageFeatures);
//       trainingDataOutputs.push(n);
//     }
//   }
// }

// function capture(video, scaleFactor, classNumber) {
//   if (scaleFactor == null) {
//     scaleFactor = 1;
//   }

//   var w = video.videoWidth * scaleFactor;
//   var h = video.videoHeight * scaleFactor;
//   var canvas = document.getElementById("class" + (classNumber + 1) + "-canvas");
//   canvas.width = w;
//   canvas.height = h;
//   var ctx = canvas.getContext("2d");
//   ctx.drawImage(video, 0, 0, w, h);
//   return canvas;
// }

// function predictVideo(){
//   predict = true;
//   predictLoop();
// }


// function onFileSelected(event){
//   var selectedFile = event.target.files[0];
//   var reader = new FileReader();

//   var debugContainer = document.getElementById("debug-container")     
//   var debugImage = document.getElementById("debug-image");
//   if(!debugImage){
//     debugImage = document.createElement("img");
//     debugImage.setAttribute("width","200")
//     debugImage.setAttribute("id","debug-image")
//     debugImage.classList.add("removed"); // uncomment if debugging is needed and selected image should be dispalyed
//     debugContainer.appendChild(debugImage)
//   }
//   debugImage.title = selectedFile.name;
//   var classID = event.srcElement.id.match(/[0-9]+$/)

//   reader.onload = function(event) {
//     setTimeout(displayOnOutputCanvas,100,event.target.result)
//     debugImage.src = event.target.result;
//     outputData[classID] = event.target.result;
//   };

//   reader.readAsDataURL(selectedFile);
// }

// function displayOnOutputCanvas(imageData){
//   let canvas = document.getElementById("output-canvas");
//   if(!canvas){
//     canvas = document.createElement("canvas");
//     canvas.setAttribute("width", VIDEO.videoWidth);
//     canvas.setAttribute("height", VIDEO.videoHeight);
//     canvas.setAttribute("id","output-canvas");
//     document.getElementsByClassName("video-container")[0].appendChild(canvas);
//   }

//   var ctx = canvas.getContext("2d");
//   const img = new Image();

//   img.src = imageData;
//   var hRatio = canvas.width / img.width    ;
//   var vRatio = canvas.height / img.height  ;
//   var ratio  = Math.min ( hRatio, vRatio );
//   img.onload = () => {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.drawImage(img, 0,0, img.width, img.height, 0,0,img.width*ratio, img.height*ratio);
//   };
// }



// function predictLoop() {
//   if (predict) {
//     tf.tidy(function () {
//       let videoFrameAsTensor = tf.browser.fromPixels(VIDEO).div(255);
//       let resizedTensorFrame = tf.image.resizeBilinear(
//         videoFrameAsTensor,
//         [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH],
//         true
//       );

//       let imageFeatures = mobilenet.predict(resizedTensorFrame.expandDims());
//       let prediction = model.predict(imageFeatures).squeeze();
//       let highestIndex = prediction.argMax().arraySync();
//       let predictionArray = prediction.arraySync();

//       var linksOfImages = [
//         "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Un1.svg/1200px-Un1.svg.png",
//         "https://upload.wikimedia.org/wikipedia/commons/7/75/Logo_TVE-2.svg",
//         "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Trois.svg/1200px-Trois.svg.png",
//         "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Quatre.svg/1200px-Quatre.svg.png",
//         "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/5.svg/1200px-5.svg.png",
//       ];

//       let canvas = document.getElementById("output-canvas");
//       if(!canvas){
//         canvas = document.createElement("canvas");
//         canvas.setAttribute("width", VIDEO.videoWidth);
//         canvas.setAttribute("height", VIDEO.videoHeight);
//         canvas.setAttribute("id","output-canvas");
//         document.getElementsByClassName("video-container")[0].appendChild(canvas);
//       }
      
//       var ctx = canvas.getContext("2d");
//       const img = new Image();
//       img.src = outputData[highestIndex];
//       var hRatio = canvas.width / img.width    ;
//       var vRatio = canvas.height / img.height  ;
//       var ratio  = Math.min ( hRatio, vRatio );
//       img.onload = () => {
//         ctx.clearRect(0, 0, canvas.width, canvas.height);
//         ctx.drawImage(img, 0,0, img.width, img.height, 0,0,img.width*ratio, img.height*ratio);
//       };
      

//       STATUS.innerText =
//         "Prediction: " +
//         CLASS_NAMES[highestIndex] +
//         " with " +
//         Math.floor(predictionArray[highestIndex] * 100) +
//         "% confidence";
//     });

//     window.requestAnimationFrame(predictLoop);
//   }
// }

// function addClass() {
//   let btn = document.createElement("button");
//   btn.innerHTML = "Gather Class " + (CLASS_NAMES.length + 1) + " Data";
//   btn.setAttribute("class", "dataCollector");
//   btn.setAttribute("data-1hot", CLASS_NAMES.length);
//   btn.setAttribute("data-name", "Class " + (CLASS_NAMES.length + 1));

//   btn.addEventListener("mousedown", gatherDataForClass);
//   btn.addEventListener("mouseup", gatherDataForClass);
//   let canvasConatainer = document.createElement("div");
//   canvasConatainer.setAttribute(
//     "class",
//     "class-canvas-container"
//   );
//   canvasConatainer.setAttribute(
//     "id",
//     "class" + (CLASS_NAMES.length + 1) + "-canvas-container"
//   );

//   let canvas = document.createElement("canvas");
//   canvas.setAttribute("class", "data-canvas");
//   canvas.setAttribute("id", "class" + (CLASS_NAMES.length + 1) + "-canvas");
//   canvas.setAttribute("width", VIDEO.videoWidth * 0.25);
//   canvas.setAttribute("height", VIDEO.videoHeight * 0.25);
//   var ctx = canvas.getContext("2d");
//   const blank = new Image();
//   blank.src = "./images/blankClass.png";
//   blank.onload = () => {
//     ctx.drawImage(
//       blank,
//       0,
//       0,
//       VIDEO.videoWidth * 0.25,
//       VIDEO.videoHeight * 0.25
//     );
//   };
//   canvasConatainer.appendChild(canvas);

//   // Populate the human readable names for classes.
//   CLASS_NAMES.push(btn.getAttribute("data-name"));

//   let ele = document.getElementsByClassName("class-container");
//   ele[0].appendChild(canvasConatainer);
//   ele[0].appendChild(btn);
// }
