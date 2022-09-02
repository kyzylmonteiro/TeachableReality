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
  

  document.getElementsByClassName("3DObj").forEach(ele => {
    ele.addEventListener('click', tapHandler)
  });

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
      document.getElementById("class"+(n+1)+"-canvas").style.borderColor = "rgba(0, 255, 0,"+ (0.2 + ((1/20)*examplesCount[n])) +")";
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
  dataCollectorButtons[i].addEventListener('touchstart', gatherDataForClass)
  dataCollectorButtons[i].addEventListener('touchend', gatherDataForClass)
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





const physicsImageTargetComponent = {
  schema: {
    name: { type: 'string' }
  },

  init () {
    const { object3D } = this.el
    const { name } = this.data
    const scene = this.el.sceneEl
    object3D.visible = false
    const showImage = ({ detail }) => {
      if (name !== detail.name) {
        return
      }
      object3D.position.copy(detail.position)
      object3D.quaternion.copy(detail.rotation)
      object3D.scale.set(detail.scale, detail.scale, detail.scale)
      object3D.visible = true
    }

    const imageFound = e => {
      showImage(e)
      
      // document.getElementById('3DObj-0').setAttribute('animation__riseIn', {
      //   property: 'scale',
      //   dur: 1500,
      //   from: '0.001 0.001 0.001',
      //   to: '1 1 1',
      //   easing: 'easeInOutQuad'
      // })
    }

    const imageLost = e => {
      // object3D.visible = false
    }

    scene.addEventListener('xrimagefound', imageFound)
    scene.addEventListener('xrimageupdated', showImage)
    scene.addEventListener('xrimagelost', imageLost)
  }
}

AFRAME.registerComponent('physics-image-target', physicsImageTargetComponent)


const customHoldDragComponent = {
  schema: {
    cameraId: {default: 'camera'},
    groundId: {default: 'not-ground'},
    dragDelay: {default: 300},
    // riseHeight: {default: 1},
  },
  init() {
    this.camera = document.getElementById(this.data.cameraId)
    if (!this.camera) {
      throw new Error(`[xrextras-hold-drag] Couldn't find camera with id '${this.data.cameraId}'`)
    }
    this.threeCamera = this.camera.getObject3D('camera')
    this.ground = document.getElementById(this.data.groundId)
    if (!this.ground) {
      throw new Error(`[xrextras-hold-drag] Couldn't find ground with id '${this.data.groundId}'`)
    }

    this.internalState = {
      fingerDown: false,
      dragging: false,
      distance: 0,
      startDragTimeout: null,
      raycaster: new THREE.Raycaster(),
    }

    this.fingerDown = this.fingerDown.bind(this)
    this.startDrag = this.startDrag.bind(this)
    this.fingerMove = this.fingerMove.bind(this)
    this.fingerUp = this.fingerUp.bind(this)

    this.el.addEventListener('mousedown', this.fingerDown)
    this.el.sceneEl.addEventListener('onefingermove', this.fingerMove)
    this.el.sceneEl.addEventListener('onefingerend', this.fingerUp)
    this.el.classList.add('cantap')  // Needs "objects: .cantap" attribute on raycaster.
  },
  tick() {
    if (this.internalState.dragging) {
      let desiredPosition = null
      if (this.internalState.positionRaw) {
        const screenPositionX = this.internalState.positionRaw.x / document.body.clientWidth * 2 - 1
        const screenPositionY = this.internalState.positionRaw.y / document.body.clientHeight * 2 - 1
        const screenPosition = new THREE.Vector2(screenPositionX, -screenPositionY)

        this.threeCamera = this.threeCamera || this.camera.getObject3D('camera')

        this.internalState.raycaster.setFromCamera(screenPosition, this.threeCamera)
        const intersects = this.internalState.raycaster.intersectObject(this.ground.object3D, true)

        if (intersects.length > 0) {
          const intersect = intersects[0]
          this.internalState.distance = intersect.distance
          desiredPosition = intersect.point
        }
      }

      if (!desiredPosition) {
        console.log("miss");
        desiredPosition = this.camera.object3D.localToWorld(new THREE.Vector3(0, 0, -this.internalState.distance))
      }

      // desiredPosition.y = this.data.riseHeight
      var scene = document.getElementById("scene");
      var parent = this.el.parentElement
      scene.object3D.attach(this.el.object3D)
      this.el.object3D.position.lerp(desiredPosition, 0.2)
      parent.object3D.attach(this.el.object3D)
      
      // this.el.object3D.position.set(desiredPosition.x-this.el.parentElement.object3D.position.x,desiredPosition.y-this.el.parentElement.object3D.position.y,desiredPosition.z-this.el.parentElement.object3D.position.z)
    }
  },
  remove() {
    this.el.removeEventListener('mousedown', this.fingerDown)
    this.el.sceneEl.removeEventListener('onefingermove', this.fingerMove)
    this.el.sceneEl.removeEventListener('onefingerend', this.fingerUp)
    if (this.internalState.fingerDown) {
      this.fingerUp()
    }
  },
  fingerDown(event) {
    this.internalState.fingerDown = true
    this.internalState.startDragTimeout = setTimeout(this.startDrag, this.data.dragDelay)
    this.internalState.positionRaw = event.detail.positionRaw
  },
  startDrag(event) {
    if (!this.internalState.fingerDown) {
      return
    }
    this.internalState.dragging = true
    this.internalState.distance = this.el.object3D.position.distanceTo(this.camera.object3D.position)
  },
  fingerMove(event) {
    this.internalState.positionRaw = event.detail.positionRaw
  },
  fingerUp(event) {
    this.internalState.fingerDown = false
    clearTimeout(this.internalState.startDragTimeout)

    this.internalState.positionRaw = null

    // if (this.internalState.dragging) {
    //   const endPosition = this.el.object3D.position.clone()
    //   this.el.setAttribute('animation__drop', {
    //     property: 'position',
    //     to: `${endPosition.x} 0 ${endPosition.z}`,
    //     dur: 300,
    //     easing: 'easeOutQuad',
    //   })
    // }
    this.internalState.dragging = false
  },
}

AFRAME.registerComponent('hold-drag', customHoldDragComponent)