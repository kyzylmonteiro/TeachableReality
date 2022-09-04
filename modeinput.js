const STATUS = document.getElementById('status')
const VIDEO = document.getElementById('webcam')
const START_BUTTON = document.getElementById('startMachine')
const ADD_CLASS = document.getElementById('addClass')
const CAMERA_FEED_CANVAS = document.getElementById('cameraFeed')
// const RESET_BUTTON = document.getElementById("reset");
const MOBILE_NET_INPUT_WIDTH = 224
const MOBILE_NET_INPUT_HEIGHT = 224
const STOP_DATA_GATHER = -1
export const CLASS_NAMES = []

START_BUTTON.addEventListener('click', startMachine)
ADD_CLASS.addEventListener('click', addClass)
// RESET_BUTTON.addEventListener("click", reset);

function hasGetUserMedia () {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

function startMachine () {
  // if (hasGetUserMedia()) {
  // getUsermedia parameters.
  // const constraints = {
  //   video: true,
  //   width: 640,
  //   height: 480
  // };

  // Activate the webcam stream.
  // navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
  //   VIDEO.srcObject = stream;
  //   VIDEO.addEventListener("loadeddata", function () {
  // videoPlaying = true;
  // START_BUTTON.classList.add("removed");
  //   });
  // });

  XR8.addCameraPipelineModule({
    name: 'mycamerapipelinemodule',
    onUpdate: ({ frameStartResult, processGpuResult, processCpuResult }) => {
      if (!processCpuResult.reality) {
        return
      }
      // let {rotation, position, intrinsics} = processCpuResult.reality
      // let {cpuDataA, cpuDataB} = processCpuResult.mycamerapipelinemodule
      let arCanvas = processCpuResult.reality.realityTexture.drawCtx.canvas

      CAMERA_FEED_CANVAS.classList.remove('removed')
      var myCtx = CAMERA_FEED_CANVAS.getContext('2d')
      CAMERA_FEED_CANVAS.setAttribute('width', arCanvas.width / 15)
      CAMERA_FEED_CANVAS.setAttribute('height', arCanvas.height / 15)
      myCtx.drawImage(arCanvas, 0, 0, arCanvas.width / 15, arCanvas.height / 15)
    }
  })

  videoPlaying = true
  START_BUTTON.classList.add('removed')
  ADD_CLASS.classList.remove('removed')

  document.getElementsByClassName('3DObj').forEach(ele => {
    ele.addEventListener('click', tapHandler)
  })

  document.getElementById('next').classList.remove('removed')
  let mode = document.getElementById('debug-container')
  mode.innerText = 'Input Mode'
  setTimeout(addClass, 50)
  setTimeout(addClass, 50)
  // } else {
  //   console.warn("getUserMedia() is not supported by your browser");
  // }
}

export let mobilenet = undefined
export let gatherDataState = STOP_DATA_GATHER
export let videoPlaying = false
export let examplesCount = []
export let predict = false

export let imageData = []

export var model = tf.sequential()
async function loadMobileNetFeatureModel () {
  const URL =
    'https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1'

  mobilenet = await tf.loadGraphModel(URL, { fromTFHub: true })
  STATUS.innerText = 'Debugger \n MobileNet v3 loaded successfully!'

  // Warm up the model by passing zeros through it once.
  tf.tidy(function () {
    let answer = mobilenet.predict(
      tf.zeros([1, MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH, 3])
    )
    console.log(answer.shape)
  })
}
// Call the function immediately to start loading.
loadMobileNetFeatureModel()

function logProgress (epoch, logs) {
  console.log('Data for epoch ' + epoch, logs)
}

function gatherDataForClass () {
  let classNumber = parseInt(this.getAttribute('data-1hot'))
  // gatherDataState =
  //   gatherDataState === STOP_DATA_GATHER ? classNumber : STOP_DATA_GATHER

  if(document.getElementById('timerEnabled').checked)
  {
    let timeLim = 3
    let timerFunc = setInterval(function () {
      document.getElementById('timer').innerHTML = 'Timer:' + timeLim
      timeLim--
      if (timeLim == -1) {
        console.log('enter')
        dataGatherLoop(classNumber)
      }
      if (timeLim < 0) {
        document.getElementById('timer').innerHTML = 'Timer'
        clearInterval(timerFunc)
      }
    }, 1000)
  }
  else{
    document.getElementById('timer').innerHTML = 'Timer'
    dataGatherLoop(classNumber)
  }
  // setTimeout(function(){dataGatherLoop(classNumber)},5000)
}

function dataGatherLoop (classNumber) {
  if (imageData[classNumber] == undefined) {
    imageData[classNumber] = []
  }

  if (videoPlaying) {
    var canvas = capture(CAMERA_FEED_CANVAS, 1, classNumber)
    let videoFrameAsTensor = tf.browser.fromPixels(
      CAMERA_FEED_CANVAS.getContext('2d').getImageData(
        0,
        0,
        CAMERA_FEED_CANVAS.width,
        CAMERA_FEED_CANVAS.height
      )
    )
    // console.log(videoFrameAsTensor, CAMERA_FEED_CANVAS.getContext('2d').getImageData(0,0,CAMERA_FEED_CANVAS.width,CAMERA_FEED_CANVAS.height))
    imageData[classNumber].push(videoFrameAsTensor)

    if (examplesCount[classNumber] === undefined) {
      examplesCount[classNumber] = 0
    }
    examplesCount[classNumber]++

    STATUS.innerText = 'Data count \n'
    for (let n = 0; n < CLASS_NAMES.length; n++) {
      STATUS.innerText += CLASS_NAMES[n] + ': ' + examplesCount[n] + '\n'
      document.getElementById('class' + (n + 1) + '-canvas').style.borderColor =
        'rgba(0, 255, 0,' + (0.2 + (1 / 20) * examplesCount[n]) + ')'
    }
    // window.requestAnimationFrame(dataGatherLoop);
    // setTimeout(dataGatherLoop, 15, classNumber)
  }
}

function capture (video, scaleFactor, classNumber) {
  if (scaleFactor == null) {
    scaleFactor = 1
  }

  var w = video.width * scaleFactor
  var h = video.height * scaleFactor
  var canvas = document.getElementById('class' + (classNumber + 1) + '-canvas')
  canvas.width = w
  canvas.height = h
  var ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, w, h)
  return canvas
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

let dataCollectorButtons = document.querySelectorAll('button.dataCollector')

for (let i = 0; i < dataCollectorButtons.length; i++) {
  dataCollectorButtons[i].addEventListener('click', gatherDataForClass)
  // dataCollectorButtons[i].addEventListener('onclick', gatherDataForClass)
  // Populate the human readable names for classes.
  CLASS_NAMES.push(dataCollectorButtons[i].getAttribute('data-name'))
}

function blankCanvas () {
  let canvas = document.createElement('canvas')
  canvas.setAttribute('class', 'data-canvas')
  canvas.setAttribute('id', 'class' + (CLASS_NAMES.length + 1) + '-canvas')
  canvas.setAttribute('width', CAMERA_FEED_CANVAS.width * 1)
  canvas.setAttribute('height', CAMERA_FEED_CANVAS.height * 1)
  var ctx = canvas.getContext('2d')
  const blank = new Image()
  blank.src = './images/blankClass.png'
  blank.onload = () => {
    ctx.drawImage(
      blank,
      0,
      0,
      CAMERA_FEED_CANVAS.width * 1,
      CAMERA_FEED_CANVAS.height * 1
    )
  }
  return canvas
}

function addClass () {
  let btn = document.createElement('button')
  let canvas = blankCanvas()
  btn.innerHTML = 'Save State ' + (CLASS_NAMES.length + 1) + ''
  btn.setAttribute('class', 'dataCollector')
  btn.setAttribute('data-1hot', CLASS_NAMES.length)
  btn.setAttribute('data-name', 'Class ' + (CLASS_NAMES.length + 1))

  btn.addEventListener('click', gatherDataForClass)
  // btn.addEventListener('onclick', gatherDataForClass)
  let canvasConatainer = document.createElement('div')
  canvasConatainer.setAttribute('class', 'class-canvas-container')
  canvasConatainer.setAttribute(
    'id',
    'class' + (CLASS_NAMES.length + 1) + '-canvas-container'
  )
  canvasConatainer.setAttribute('width', CAMERA_FEED_CANVAS.width * 1)
  canvasConatainer.setAttribute('height', CAMERA_FEED_CANVAS.height * 1)
  canvasConatainer.appendChild(canvas)

  // Populate the human readable names for classes.
  CLASS_NAMES.push(btn.getAttribute('data-name'))

  let ele = document.getElementsByClassName('class-container')
  ele[0].appendChild(canvasConatainer)
  ele[0].appendChild(btn)
}

var tapedTwice = false

function tapHandler (event) {
  if (!tapedTwice) {
    tapedTwice = true
    setTimeout(function () {
      tapedTwice = false
    }, 300)
    return false
  }
  event.preventDefault()
  //action on double tap goes below
  alert(event.srcElement.id + ' object visibiility set to false')
  var obj = event.srcElement
  obj.setAttribute('visible', 'false')
}
