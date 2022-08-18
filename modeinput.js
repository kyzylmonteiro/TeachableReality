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

  var videoElement = document.getElementsByClassName('video-container')[0] // creating a button to add 3d assets
  var addObjI = document.createElement('input')
  addObjI.setAttribute('type', 'text')
  addObjI.setAttribute('id', '3DobjLink')
  addObjI.setAttribute(
    'style',
    'width: 40px; height:10px; position:fixed; z-index: 3; right:20%; top:1%;'
  )
  videoElement.appendChild(addObjI)
  var addObj = document.createElement('button')
  addObj.innerHTML = '3D'
  addObj.addEventListener('click', addVirtualObj)
  addObj.setAttribute(
    'style',
    'width: 30px; height:30px; position:fixed; z-index: 3; right:20%; top:3%;'
  )
  videoElement.appendChild(addObj)

  var videoElement = document.getElementsByClassName('video-container')[0] // creating a button to add image assets
  var addObjI = document.createElement('input')
  addObjI.setAttribute('type', 'text')
  addObjI.setAttribute('id', 'imgLink')
  addObjI.setAttribute(
    'style',
    'width: 40px; height:10px; position:fixed; z-index: 3; right:20%; top:12%;'
  )
  videoElement.appendChild(addObjI)
  var addObj = document.createElement('button')
  addObj.innerHTML = '2D'
  addObj.addEventListener('click', addImageObj)
  addObj.setAttribute(
    'style',
    'width: 30px; height:30px; position:fixed; z-index: 3; right:20%; top:14%;'
  )
  videoElement.appendChild(addObj)

  var videoElement = document.getElementsByClassName('video-container')[0] // creating a button to add image assets
  var addObjI = document.createElement('input')
  addObjI.setAttribute('type', 'text')
  addObjI.setAttribute('id', 'floatLink')
  addObjI.setAttribute(
    'style',
    'width: 40px; height:10px; position:fixed; z-index: 3; right:20%; top:23%;'
  )
  videoElement.appendChild(addObjI)
  var addObj = document.createElement('button')
  addObj.innerHTML = 'Float'
  addObj.addEventListener('click', addFLoatingObj)
  addObj.setAttribute(
    'style',
    'width: 30px; height:30px; position:fixed; z-index: 3; right:20%; top:25%;'
  )
  videoElement.appendChild(addObj)

  var videoElement = document.getElementsByClassName('video-container')[0] // creating a button to add image assets
  var addObj = document.createElement('button')
  addObj.innerHTML = 'Show All'
  addObj.addEventListener('click', showAllObjects)
  addObj.setAttribute(
    'style',
    'width: 30px; height:30px; position:fixed; z-index: 3; right:20%; bottom:1%;'
  )
  videoElement.appendChild(addObj)

  videoPlaying = true
  START_BUTTON.classList.add('removed')
  ADD_CLASS.classList.remove('removed')
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
  STATUS.innerText = 'MobileNet v3 loaded successfully!'

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
  gatherDataState =
    gatherDataState === STOP_DATA_GATHER ? classNumber : STOP_DATA_GATHER
  dataGatherLoop(classNumber)
}

function dataGatherLoop (classNumber) {
  if (imageData[classNumber] == undefined) {
    imageData[classNumber] = []
  }

  if (videoPlaying && gatherDataState !== STOP_DATA_GATHER) {
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

    if (examplesCount[gatherDataState] === undefined) {
      examplesCount[gatherDataState] = 0
    }
    examplesCount[gatherDataState]++

    STATUS.innerText = ''
    for (let n = 0; n < CLASS_NAMES.length; n++) {
      STATUS.innerText +=
        CLASS_NAMES[n] + ' data count: ' + examplesCount[n] + '. '
    }
    // window.requestAnimationFrame(dataGatherLoop);
    setTimeout(dataGatherLoop, 10, classNumber)
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
  dataCollectorButtons[i].addEventListener('mousedown', gatherDataForClass)
  dataCollectorButtons[i].addEventListener('mouseup', gatherDataForClass)
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
  btn.innerHTML = 'Gather Class ' + (CLASS_NAMES.length + 1) + ' Data'
  btn.setAttribute('class', 'dataCollector')
  btn.setAttribute('data-1hot', CLASS_NAMES.length)
  btn.setAttribute('data-name', 'Class ' + (CLASS_NAMES.length + 1))

  btn.addEventListener('mousedown', gatherDataForClass)
  btn.addEventListener('mouseup', gatherDataForClass)
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

function showAllObjects () {
  var classList = document.getElementsByClassName('3DObj')
  classList.forEach(el => {
    el.setAttribute('visible', 'true')
  })
}

function addVirtualObj () {
  var numOf3DObj = document.getElementsByClassName('3DObj').length
  const newElement = document.createElement('a-entity')
  newElement.setAttribute(
    'gltf-model',
    document.getElementById('3DobjLink').value
  )
  newElement.setAttribute('id', '3DObj-' + numOf3DObj)
  newElement.setAttribute('scale', '10 10 10')
  newElement.setAttribute('class', 'cantap 3DObj')
  newElement.setAttribute('xrextras-hold-drag', '')
  newElement.setAttribute(
    'xrextras-pinch-scale',
    'min: 0.01; max: 10; scale: 2;'
  )
  newElement.setAttribute('xrextras-two-finger-rotate', '')
  // The raycaster gives a location of the touch in the scene
  // const touchPoint = event.detail.intersection.point;
  // newElement.setAttribute("position", "0 0 0");

  const randomYRotation = Math.random() * 360
  newElement.setAttribute('rotation', `0 ${randomYRotation} 0`)

  newElement.setAttribute('shadow', {
    receive: false
  })

  newElement.addEventListener('click', tapHandler)

  document.getElementById('scene').sceneEl.appendChild(newElement)
}

function addImageObj () {
  var numOf3DObj = document.getElementsByClassName('3DObj').length
  const newElement = document.createElement('a-box')
  newElement.setAttribute('src', document.getElementById('imgLink').value)
  newElement.setAttribute('id', '3DObj-' + numOf3DObj)
  newElement.setAttribute('height', '5')
  newElement.setAttribute('width', '5')
  newElement.setAttribute('depth', '0.5')
  newElement.setAttribute('class', 'cantap 3DObj')
  newElement.setAttribute('xrextras-hold-drag', '')
  newElement.setAttribute('xrextras-pinch-scale', '')
  newElement.setAttribute('xrextras-two-finger-rotate', '')

  // const randomYRotation = Math.random() * 360;
  newElement.setAttribute('rotation', `90 0 0`)

  newElement.setAttribute('shadow', {
    receive: false
  })

  // newElement.addEventListener("contextmenu", (event) => {
  //   // newElement.setAttribute("scale","3 3 3");
  //   console.log("clicked");
  // });

  newElement.addEventListener('click', tapHandler)

  document.getElementById('scene').sceneEl.appendChild(newElement)
}

const getWorldPosition = object => {
  const position = new THREE.Vector3()
  position.setFromMatrixPosition(object.matrixWorld)
  return position
}

const getWorldQuaternion = object => {
  const position = new THREE.Vector3()
  const scale = new THREE.Vector3()
  const target = new THREE.Quaternion()
  object.matrixWorld.decompose(position, target, scale)
  return target
}

function addFLoatingObj () {
  var numOf3DObj = document.getElementsByClassName('3DObj').length
  const newElement = document.createElement('a-box')
  newElement.object3D.position.copy(
    getWorldPosition(document.getElementById('holdAnchor').object3D)
  )
  newElement.object3D.quaternion.copy(
    getWorldQuaternion(document.getElementById('holdAnchor').object3D)
  )
  newElement.setAttribute('src', document.getElementById('floatLink').value)
  newElement.setAttribute('id', '3DObj-' + numOf3DObj)
  newElement.setAttribute('height', '5')
  newElement.setAttribute('width', '5')
  newElement.setAttribute('depth', '0.5')
  newElement.setAttribute('class', 'cantap 3DObj')
  // newElement.setAttribute("xrextras-hold-drag", "");
  newElement.setAttribute('xrextras-pinch-scale', '')
  newElement.setAttribute('xrextras-two-finger-rotate', '')

  newElement.setAttribute('shadow', {
    receive: false
  })

  // newElement.addEventListener("contextmenu", (event) => {
  //   // newElement.setAttribute("scale","3 3 3");
  //   console.log("clicked");
  // });

  newElement.addEventListener('click', tapHandler)

  document.getElementById('scene').sceneEl.appendChild(newElement)
}
