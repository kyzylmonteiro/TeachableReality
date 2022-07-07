const STATUS = document.getElementById('status');
const VIDEO = document.getElementById('webcam');
const ENABLE_CAM_BUTTON = document.getElementById('enableCam');
const ADD_CLASS = document.getElementById('addClass');
const RESET_BUTTON = document.getElementById('reset');
const TRAIN_BUTTON = document.getElementById('train');
const MOBILE_NET_INPUT_WIDTH = 224;
const MOBILE_NET_INPUT_HEIGHT = 224;
const STOP_DATA_GATHER = -1;
const CLASS_NAMES = [];

ENABLE_CAM_BUTTON.addEventListener('click', enableCam);
ADD_CLASS.addEventListener('click', addClass);
TRAIN_BUTTON.addEventListener('click', trainAndPredict);
RESET_BUTTON.addEventListener('click', reset);

function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function enableCam() {
  if (hasGetUserMedia()) {
    // getUsermedia parameters.
    const constraints = {
      video: true,
      width: 640, 
      height: 480 
    };

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
      VIDEO.srcObject = stream;
      VIDEO.addEventListener('loadeddata', function() {
        videoPlaying = true;
        ENABLE_CAM_BUTTON.classList.add('removed');
      });
    });
  } else {
    console.warn('getUserMedia() is not supported by your browser');
  }
}

var model = tf.sequential();
async function loadMobileNetFeatureModel() {
  const URL = 
    'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1';
  
  mobilenet = await tf.loadGraphModel(URL, {fromTFHub: true});
  STATUS.innerText = 'MobileNet v3 loaded successfully!';
  
  // Warm up the model by passing zeros through it once.
  tf.tidy(function () {
    let answer = mobilenet.predict(tf.zeros([1, MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH, 3]));
    console.log(answer.shape);
  });

}
// Call the function immediately to start loading.
loadMobileNetFeatureModel();

async function trainAndPredict() {
  
  //adding layers based on number of classes

  // var model = tf.sequential();
  model.add(tf.layers.dense({inputShape: [1024], units: 128, activation: 'relu'}));
  model.add(tf.layers.dense({units: CLASS_NAMES.length, activation: 'softmax'}));

  model.summary();

  // Compile the model with the defined optimizer and specify a loss function to use.
  model.compile({
    // Adam changes the learning rate over time which is useful.
    optimizer: 'adam',
    // Use the correct loss function. If 2 classes of data, must use binaryCrossentropy.
    // Else categoricalCrossentropy is used if more than 2 classes.
    loss: (CLASS_NAMES.length === 2) ? 'binaryCrossentropy': 'categoricalCrossentropy', 
    // As this is a classification problem you can record accuracy in the logs too!
    metrics: ['accuracy']  
  });

  // training and predicting starting

  predict = false;
  tf.util.shuffleCombo(trainingDataInputs, trainingDataOutputs);
  let outputsAsTensor = tf.tensor1d(trainingDataOutputs, 'int32');
  let oneHotOutputs = tf.oneHot(outputsAsTensor, CLASS_NAMES.length);
  let inputsAsTensor = tf.stack(trainingDataInputs);
  
  let results = await model.fit(inputsAsTensor, oneHotOutputs, {shuffle: true, batchSize: 5, epochs: 10, 
      callbacks: {onEpochEnd: logProgress} });
  
  outputsAsTensor.dispose();
  oneHotOutputs.dispose();
  inputsAsTensor.dispose();
  predict = true;
  predictLoop();
}

function logProgress(epoch, logs) {
  console.log('Data for epoch ' + epoch, logs);
}
function reset() {
  predict = false;
  examplesCount.length = 0;
  for (let i = 0; i < trainingDataInputs.length; i++) {
    trainingDataInputs[i].dispose();
  }
  trainingDataInputs.length = 0;
  trainingDataOutputs.length = 0;
  STATUS.innerText = 'No data collected';
  
  console.log('Tensors in memory: ' + tf.memory().numTensors);
}


let dataCollectorButtons = document.querySelectorAll('button.dataCollector');
for (let i = 0; i < dataCollectorButtons.length; i++) {
  dataCollectorButtons[i].addEventListener('mousedown', gatherDataForClass);
  dataCollectorButtons[i].addEventListener('mouseup', gatherDataForClass);
  // Populate the human readable names for classes.
  CLASS_NAMES.push(dataCollectorButtons[i].getAttribute('data-name'));
}

function gatherDataForClass() {
  let classNumber = parseInt(this.getAttribute('data-1hot'));
  gatherDataState = (gatherDataState === STOP_DATA_GATHER) ? classNumber : STOP_DATA_GATHER;
  dataGatherLoop(classNumber);
}

let mobilenet = undefined;
let gatherDataState = STOP_DATA_GATHER;
let videoPlaying = false;
let trainingDataInputs = [];
let trainingDataOutputs = [];
let examplesCount = [];
let predict = false;

function dataGatherLoop(classNumber) {
  if (videoPlaying && gatherDataState !== STOP_DATA_GATHER) {
    let imageFeatures = tf.tidy(function() {
      
      // creating a gallery of data gathered
      var canvas = capture(VIDEO,0.025);
      if(classNumber<10)
      {
        document.getElementsByClassName("class"+(classNumber+1)+"-canvas-container")[0].appendChild(canvas);
      }
      // creating data for training
      let videoFrameAsTensor = tf.browser.fromPixels(VIDEO);
      let resizedTensorFrame = tf.image.resizeBilinear(videoFrameAsTensor, [MOBILE_NET_INPUT_HEIGHT, 
          MOBILE_NET_INPUT_WIDTH], true);
      let normalizedTensorFrame = resizedTensorFrame.div(255);
      return mobilenet.predict(normalizedTensorFrame.expandDims()).squeeze();
    });

    trainingDataInputs.push(imageFeatures);
    trainingDataOutputs.push(gatherDataState);
    
    // Intialize array index element if currently undefined.
    if (examplesCount[gatherDataState] === undefined) {
      examplesCount[gatherDataState] = 0;
    }
    examplesCount[gatherDataState]++;

    STATUS.innerText = '';
    for (let n = 0; n < CLASS_NAMES.length; n++) {
      STATUS.innerText += CLASS_NAMES[n] + ' data count: ' + examplesCount[n] + '. ';
    }
    window.requestAnimationFrame(dataGatherLoop);
  }
}

function capture(video, scaleFactor) {
  if(scaleFactor == null){
      scaleFactor = 1;
  }
  var w = video.videoWidth * scaleFactor;
  var h = video.videoHeight * scaleFactor;
  var canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
  var ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, w, h);
  return canvas;
} 


function predictLoop() {
  if (predict) {
    tf.tidy(function() {
      let videoFrameAsTensor = tf.browser.fromPixels(VIDEO).div(255);
      let resizedTensorFrame = tf.image.resizeBilinear(videoFrameAsTensor,[MOBILE_NET_INPUT_HEIGHT, 
          MOBILE_NET_INPUT_WIDTH], true);

      let imageFeatures = mobilenet.predict(resizedTensorFrame.expandDims());
      let prediction = model.predict(imageFeatures).squeeze();
      let highestIndex = prediction.argMax().arraySync();
      let predictionArray = prediction.arraySync();
      
      var linksOfImages = [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Un1.svg/1200px-Un1.svg.png",
        "https://upload.wikimedia.org/wikipedia/commons/7/75/Logo_TVE-2.svg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Trois.svg/1200px-Trois.svg.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Quatre.svg/1200px-Quatre.svg.png",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/5.svg/1200px-5.svg.png"
      ]
      
      for (let i = 0; i < CLASS_NAMES.length; i++) {
        if(highestIndex == i){
          console.log(i + " " +linksOfImages[i]);
          let canvasConatainer = document.getElementsByClassName("output-container")[0];
          canvasConatainer.innerHTML = i;
          let img = document.createElement("img");
          img.setAttribute("src",linksOfImages[i]);
          img.setAttribute("width","50");
          img.setAttribute("height","50"); 
          canvasConatainer.appendChild(img);
        }  
      }
      
      
      STATUS.innerText = 'Prediction: ' + CLASS_NAMES[highestIndex] + ' with ' + Math.floor(predictionArray[highestIndex] * 100) + '% confidence';
    });

    window.requestAnimationFrame(predictLoop);
  }
}

function addClass() {
  let btn = document.createElement("button");
  btn.innerHTML = "Gather Class "+ (CLASS_NAMES.length+1) + " Data";
  btn.setAttribute("class", "dataCollector" )
  btn.setAttribute("data-1hot",(CLASS_NAMES.length))
  btn.setAttribute("data-name","Class " + (CLASS_NAMES.length+1))

  btn.addEventListener('mousedown', gatherDataForClass);
  btn.addEventListener('mouseup', gatherDataForClass);
  let canvas = document.createElement("div");
  canvas.setAttribute("class","class"+(CLASS_NAMES.length+1)+"-canvas-container")


  // Populate the human readable names for classes.
  CLASS_NAMES.push(btn.getAttribute('data-name'));

  let ele = document.getElementsByClassName('class-container');
  ele[0].appendChild(canvas);
  ele[0].appendChild(btn);
}