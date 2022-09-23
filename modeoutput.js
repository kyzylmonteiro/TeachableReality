const STATUS = document.getElementById('status')
const VIDEO = document.getElementById('webcam')
const CAMERA_FEED_CANVAS = document.getElementById('cameraFeed')
const MOBILE_NET_INPUT_WIDTH = 224
const MOBILE_NET_INPUT_HEIGHT = 224
const NEXT_BUTTON = document.getElementById('next')
NEXT_BUTTON.addEventListener('click', updateOutputModeUI)

import { assetUrls } from "./assetUrls.js"

export let trainingDataInputs = []
export let trainingDataOutputs = []
export let outputData = []
export let output3DData = {}

import { model, CLASS_NAMES, imageData, mobilenet, objCenXY} from './modeinput.js'

export function dataPreProcess () {
  STATUS.innerText = 'Training Now! Please Wait...'
  for (let n = 0; n < CLASS_NAMES.length; n++) {
    // console.log(imageData[n]);
    for (let m = 0; m < imageData[n].length; m++) {
      // console.log(n, m);

      let imageFeatures = tf.tidy(function () {
        let videoFrameAsTensor = imageData[n][m]

        let resizedTensorFrame = tf.image.resizeBilinear(
          videoFrameAsTensor,
          [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH],
          true
        )
        let normalizedTensorFrame = resizedTensorFrame.div(255)
        return mobilenet.predict(normalizedTensorFrame.expandDims()).squeeze()
      })

      trainingDataInputs.push(imageFeatures)
      trainingDataOutputs.push(n)
    }
  }
  STATUS.innerText = ''
}

export function onFileSelected (event) {
  var selectedFile = event.target.files[0]
  var reader = new FileReader()

  var debugContainer = document.getElementById('debug-container')
  var debugImage = document.getElementById('debug-image')
  if (!debugImage) {
    debugImage = document.createElement('img')
    debugImage.setAttribute('width', '200')
    debugImage.setAttribute('id', 'debug-image')
    debugImage.classList.add('removed') // comment if debugging is needed and selected image should be dispalyed
    debugContainer.appendChild(debugImage)
  }
  debugImage.title = selectedFile.name
  var classID = event.srcElement.id.match(/[0-9]+$/)

  reader.onload = function (event) {
    setTimeout(displayOnOutputCanvas, 100, event.target.result)
    debugImage.src = event.target.result
    outputData[classID] = event.target.result
  }

  reader.readAsDataURL(selectedFile)
}

export function storeState (event) {
  var classList = document.getElementsByClassName('3DObj')

  classList.forEach(el => {
    var position = el.getAttribute('position')
    var scale = el.getAttribute('scale')
    var rotation = el.getAttribute('rotation')
    var visible = el.getAttribute('visible')

    var classID = event.srcElement.id.match(/[0-9]+$/)[0]
    var objID = el.id.match(/[0-9]+$/)[0]

    if (output3DData[objID] == null) output3DData[objID] = {}

    console.log(parseInt(classID), output3DData)
    output3DData[objID][parseInt(classID)] = {
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
      scale: { x: scale.x, y: scale.y, z: scale.z },
      visible: { x: visible }
    }
    // console.log(output3DData)
  })

  // var w = document.getElementById("scene").canvas.width
  // var h = document.getElementById("scene").canvas.height
  var canvas = document.getElementById(
    'class' + event.srcElement.id.match(/[0-9]+$/)[0] + '-outputcanvas'
  )
  var ctx = canvas.getContext('2d')
  ctx.drawImage(
    document.getElementById('scene').canvas,
    0,
    0,
    canvas.width,
    canvas.height
  )
  return canvas

  // tried startEvents but trigger not working from predict.js
  // el.setAttribute('animation__'+classID, "property: rotate; to: 0 0 45; startEvents : state-zero");
  // el.setAttribute('animation__'+classID, "property: scale; to: "+classID+" "+classID+" "+classID+"; startEvents : state-"+classID);
  // setTimeout(function() {el.emit("state-"+classID);},1000);
}

export function displayOnOutputCanvas (imageData) {
  let canvas = document.getElementById('output-canvas')
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.setAttribute('width', CAMERA_FEED_CANVAS.width)
    canvas.setAttribute('height', CAMERA_FEED_CANVAS.height)
    canvas.setAttribute('id', 'output-canvas')
    document.getElementsByClassName('video-container')[0].appendChild(canvas)
  }

  var ctx = canvas.getContext('2d')
  const img = new Image()

  img.src = imageData
  var hRatio = canvas.width / img.width
  var vRatio = canvas.height / img.height
  var ratio = Math.min(hRatio, vRatio)
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
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
    )
  }
}

function blankCanvas (i) {
  let canvas = document.createElement('canvas')
  canvas.setAttribute('class', 'data-canvas')
  canvas.setAttribute('id', 'class' + i + '-outputcanvas')
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

export async function updateOutputModeUI () {
  console.log('updating UI')
  let mode = document.getElementById('debug-container')
  mode.innerText = 'Output Mode'
  STATUS.innerText = 'Training Now! Please Wait...'
  document.getElementById("statusContainer").style.display="none"

  showAllObjects()

  document.getElementById('addClass').classList.add('removed')
  let dataCollectorButtons = document.querySelectorAll('button.dataCollector')
  let parentDiv = document.getElementsByClassName('class-container')[0]
  for (let i = 0; i < dataCollectorButtons.length; i++) {
    let canvas = blankCanvas(i)

    let canvasConatainer = document.createElement('div')
    canvasConatainer.setAttribute('class', 'class-outputcanvas-container')
    canvasConatainer.setAttribute(
      'id',
      'class' + (CLASS_NAMES.length + 1) + '-outputcanvas-container'
    )
    canvasConatainer.setAttribute('width', CAMERA_FEED_CANVAS.width * 1)
    canvasConatainer.setAttribute('height', CAMERA_FEED_CANVAS.height * 1)
    canvasConatainer.appendChild(canvas)
    parentDiv.insertBefore(canvasConatainer, dataCollectorButtons[i])

    document.getElementById('state' + (i+1) + "dataCount").classList.add('removed')
    let inputLabel = document.createElement('div')
    let outputLabel = document.createElement('div')
    inputLabel.setAttribute('id','sate'+i+'inputlabel')
    outputLabel.setAttribute('id','sate'+i+'outputlabel')
    inputLabel.innerHTML = 'State ' + i + ' input  '
    outputLabel.innerHTML = 'State ' + i + ' output  '
    parentDiv.insertBefore(inputLabel, canvasConatainer)
    parentDiv.insertBefore(outputLabel, dataCollectorButtons[i])

    let animButton = document.createElement('button')
    animButton.setAttribute('id', 'output-state' + i)
    animButton.setAttribute('class', 'output-obj-state')
    animButton.setAttribute('width', '100%')
    animButton.addEventListener('click', storeState)
    animButton.innerText = 'Save'
    parentDiv.insertBefore(animButton, dataCollectorButtons[i])

    let horizontalLine = document.createElement('hr')
    horizontalLine.style = "margin-top: 10px; margin-bottom: 10px;"
    parentDiv.insertBefore(horizontalLine, dataCollectorButtons[i])

    dataCollectorButtons[i].classList.add('removed')
  }

  NEXT_BUTTON.classList.add('removed')
  document.getElementById('predict').classList.remove('removed')

  console.log('Now Training...')
  setTimeout(outputModeAndTrain, 10)

  // var videoElement = document.getElementsByClassName('video-container')[0] // adding anchor mode menu
  var modeDiv = document.getElementById('anchorType')
  modeDiv.setAttribute('id', 'anchormode')
  modeDiv.setAttribute(
    'style',
    // 'width: 80px; height:10px; position:fixed; z-index: 3; right:20%; top:1%;'
    'width: 300px; z-index: 3;'
  )

  // var modeText = document.createTextNode('Anchor to:')
  // modeDiv.appendChild(modeText)

  // modeDiv.appendChild(document.createElement('br'))

  var typesOfModes = ['Surface', 'Image', 'Body', 'Object']

  typesOfModes.forEach(modeTypeString => {
    var modeType = document.createElement('input')
    modeType.setAttribute('type', 'radio')
    modeType.setAttribute('name', 'arMode')
    modeType.setAttribute('id', modeTypeString.toLowerCase())
    modeType.setAttribute('value', modeTypeString.toLowerCase())
    if (modeTypeString == 'Surface') modeType.setAttribute('checked', 'checked')

    var modeTypeLabel = document.createElement('label')
    modeTypeLabel.setAttribute('for', modeTypeString.toLowerCase())
    modeTypeLabel.innerHTML = modeTypeString

    modeDiv.appendChild(modeType)
    modeDiv.appendChild(modeTypeLabel)
    modeDiv.appendChild(document.createElement('br'))
  })

  var videoElement = document.getElementById('addObjButtons') // creating a button to add 3d assets
  var addObj = document.createElement('button')
  addObj.innerHTML = '3D'
  addObj.addEventListener('click', ()=>{document.getElementById('myObjectsModal').style.display = 'none'; updateInvisiblePlanes(); setTimeout(addVirtualObj,10);})
  videoElement.appendChild(addObj)

  var videoElement = document.getElementById('addObjButtons') // creating a button to add image assets
  var addObj = document.createElement('button')
  addObj.innerHTML = '2D'
  addObj.addEventListener('click', ()=>{document.getElementById('myObjectsModal').style.display = 'none'; updateInvisiblePlanes(); setTimeout(addImageObj,10);})
  videoElement.appendChild(addObj)

  var videoElement = document.getElementById('addObjButtons') // creating a button to add image assets
  var addObj = document.createElement('button')
  addObj.innerHTML = 'Floating'
  addObj.addEventListener('click', ()=>{document.getElementById('myObjectsModal').style.display = 'none'; updateInvisiblePlanes(); addFLoatingObj();})
  videoElement.appendChild(addObj)

  var videoElement = document.getElementById('addObjButtons') // creating a button to add image assets
  var addObj = document.createElement('button')
  addObj.innerHTML = 'Audio'
  addObj.addEventListener('click', ()=>{document.getElementById('myObjectsModal').style.display = 'none'; updateInvisiblePlanes(); })
  videoElement.appendChild(addObj)

  videoElement.appendChild(document.createElement("br"))
  videoElement.appendChild(document.createElement("hr"))
  videoElement.appendChild(document.createElement("br"))

  var videoElement = document.getElementById('addCustomObjButtons') // creating a button to add image assets
  var addObj = document.createElement('button')
  addObj.innerHTML = 'Count'
  addObj.addEventListener('click', ()=>{document.getElementById('myObjectsModal').style.display = 'none'; updateInvisiblePlanes();  })
  videoElement.appendChild(addObj)

  var videoElement = document.getElementById('addCustomObjButtons') // creating a button to add image assets
  var addObj = document.createElement('button')
  addObj.innerHTML = 'Script'
  addObj.addEventListener('click', ()=>{document.getElementById('myObjectsModal').style.display = 'none'; updateInvisiblePlanes();  })
  videoElement.appendChild(addObj)

  var videoElement = document.getElementsByClassName('video-container')[0] // creating a button to add image assets
  var addObj = document.createElement('button')
  addObj.innerHTML = '+'
  addObj.addEventListener('click', ()=>{document.getElementById('myObjectsModal').style.display = 'block';})
  addObj.setAttribute(
    'style',
    'width: 30px; font-weight: bold; font-size: 25px; height:30px; position:fixed; z-index: 3; right:20%; bottom:10%;'
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
}

export async function outputModeAndTrain () {
  for (let i = 0; i < CLASS_NAMES.length; i++) {
    outputData.push('')
    output3DData = {}
  }

  dataPreProcess()
  console.log('trainingDataInputs.length', trainingDataInputs.length)
  console.log('trainingDataOutputs.length', trainingDataOutputs.length)

  //adding layers based on number of classes

  // var model = tf.sequential();
  model.add(
    tf.layers.dense({ inputShape: [1024], units: 128, activation: 'relu' })
  )
  model.add(
    tf.layers.dense({ units: CLASS_NAMES.length, activation: 'softmax' })
  )

  model.summary()

  // Compile the model with the defined optimizer and specify a loss function to use.
  model.compile({
    // Adam changes the learning rate over time which is useful.
    optimizer: 'adam',
    // Use the correct loss function. If 2 classes of data, must use binaryCrossentropy.
    // Else categoricalCrossentropy is used if more than 2 classes.
    loss:
      CLASS_NAMES.length === 2
        ? 'binaryCrossentropy'
        : 'categoricalCrossentropy',
    // As this is a classification problem you can record accuracy in the logs too!
    metrics: ['accuracy']
  })

  // training and predicting starting

  tf.util.shuffleCombo(trainingDataInputs, trainingDataOutputs)
  let outputsAsTensor = tf.tensor1d(trainingDataOutputs, 'int32')
  let oneHotOutputs = tf.oneHot(outputsAsTensor, CLASS_NAMES.length)
  let inputsAsTensor = tf.stack(trainingDataInputs)

  let results = await model.fit(inputsAsTensor, oneHotOutputs, {
    shuffle: true,
    batchSize: 5,
    epochs: 10,
    callbacks: { onEpochEnd: logProgress }
  })

  outputsAsTensor.dispose()
  oneHotOutputs.dispose()
  inputsAsTensor.dispose()
}

function logProgress (epoch, logs) {
  console.log('Data for epoch ' + epoch, logs)
}

var tapedTwice = false

function tapHandler (event) {
  // console.log("double tapped")
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

var links = {
  tree:
    'https://cdn.glitch.global/dcd6b5e7-e048-4ae6-b52c-5911b57fca1f/tree.glb?v=1657750939103',
  car:
    'https://cdn.glitch.global/efe36b2d-ce3d-491a-941c-3ae047b56db7/1.1.glb?v=1660628644707'
}

function addVirtualObj () {
  // var url_string = window.location.href
  // var url = new URL(url_string)
  // var objLink = url.searchParams.get('obj')
  // console.log(objLink)

  var numOf3DObj = document.getElementsByClassName('3DObj').length
  const newElement = document.createElement('a-entity')
  newElement.setAttribute(
    'gltf-model',
    assetUrls[document.getElementById('objectVariable').value.toLowerCase().replace(" ","")] || document.getElementById('objectVariable').value)
  newElement.setAttribute('id', '3DObj-' + numOf3DObj)
  newElement.setAttribute('scale', '5 5 5')
  newElement.setAttribute('class', 'cantap 3DObj')
  newElement.setAttribute('xrextras-pinch-scale', 'min: 0.01; max: 50;')
  newElement.setAttribute('xrextras-two-finger-rotate', '')
  // The raycaster gives a location of the touch in the scene
  // const touchPoint = event.detail.intersection.point;
  // newElement.setAttribute("position", "0 0 0");

  newElement.addEventListener('click', tapHandler)
  // const randomYRotation = Math.random() * 360
  newElement.setAttribute('rotation', `0 0 0`)
  newElement.setAttribute('position', getCameraRaycastPoint(this.raycaster))
  newElement.addEventListener('click', tapHandler)

  // setting corresponding hold-drag component
  var typesOfMode = document
    .querySelector('input[name="arMode"]:checked')
    .value.toLowerCase()
  if (typesOfMode == 'surface') {
    newElement.setAttribute('xrextras-hold-drag', '')
    document.getElementById('scene').appendChild(newElement)
  } else if (typesOfMode == 'image') {
    newElement.setAttribute('hold-drag', 'groundId: image-plane')
    document.getElementById('scene').appendChild(newElement)
    document.getElementById('imageEntity').object3D.attach(newElement.object3D)
  } else if (typesOfMode == 'body') {
    newElement.setAttribute('hold-drag', 'groundId: wall')
    document.getElementById('scene').appendChild(newElement)
    document.getElementById('wallEntity').object3D.attach(newElement.object3D)
  } else if (typesOfMode == 'object') {
    newElement.setAttribute('xrextras-hold-drag', '')
    document.getElementById('scene').sceneEl.appendChild(newElement)
  }

  newElement.setAttribute('shadow', {
    receive: false
  })
}

function addImageObj () {
  var numOf3DObj = document.getElementsByClassName('3DObj').length
  const newElement = document.createElement('a-entity')
  newElement.setAttribute('id', '3DObj-' + numOf3DObj)
  // newElement.setAttribute('xrextras-hold-drag', '')
  newElement.setAttribute('xrextras-pinch-scale', '')
  // newElement.setAttribute('xrextras-two-finger-rotate', '')
  newElement.setAttribute(
    'geometry',
    'primitive: box; width: 1; height: 1; depth:1;'
  )
  newElement.setAttribute('material', 'color: white; transparent: true; opacity: 0;')
  // geometry="primitive: box; width: 0.5; height: 0.25; depth:1" material="color: white; transparent: true; opacity: 0"
  // const randomYRotation = Math.random() * 360;
  newElement.addEventListener('click', tapHandler)
  newElement.setAttribute('rotation', '0 0 0')

  const imageElement = document.createElement('a-image')
  imageElement.setAttribute('position', '0 0.5 0')
  imageElement.setAttribute('scale', '1 1 1')
  imageElement.setAttribute('rotation', '-90 0 0')
  imageElement.setAttribute('src', assetUrls[document.getElementById('objectVariable').value.toLowerCase().replace(" ","")] || document.getElementById('objectVariable').value)
  imageElement.setAttribute('shadow', { receive: false })
  newElement.appendChild(imageElement)

  newElement.addEventListener('click', tapHandler)

  // setting corresponding hold-drag component
  var typesOfMode = document
    .querySelector('input[name="arMode"]:checked')
    .value.toLowerCase()
  if (typesOfMode == 'surface') {
    newElement.setAttribute('xrextras-hold-drag', '')
    newElement.setAttribute('class', 'cantap 3DObj')
    newElement.setAttribute('position', getCameraRaycastPoint(this.raycaster))
    newElement.setAttribute('scale', '2 2 2')
    document.getElementById('scene').appendChild(newElement)
  } else if (typesOfMode == 'image') {
    newElement.setAttribute('hold-drag', 'groundId: image-plane')
    newElement.setAttribute('class', 'cantap 3DObj objOnImage')
    newElement.setAttribute('position', '0 0 0')
    newElement.setAttribute('scale', '2 2 2')
    document.getElementById('scene').appendChild(newElement)
    document.getElementById('imageEntity').object3D.attach(newElement.object3D)
  } else if (typesOfMode == 'body') {
    newElement.setAttribute('hold-drag', 'groundId: wall')
    newElement.setAttribute('position', getCameraRaycastPoint(this.raycaster))
    newElement.setAttribute('class', 'cantap 3DObj')
    newElement.setAttribute('rotation', '90 0 0')
    document.getElementById('scene').appendChild(newElement)
    newElement.setAttribute('scale', '2 2 2')
    document.getElementById('wallEntity').object3D.attach(newElement.object3D)
  } else if (typesOfMode == 'object') {
    newElement.setAttribute('position', getCameraRaycastPoint(this.raycaster))
    newElement.setAttribute('xrextras-hold-drag', '')
    newElement.setAttribute('scale', '2 2 2')
    document.getElementById('scene').appendChild(newElement)
  }

  newElement.setAttribute('shadow', {
    receive: false
  })

  // newElement.addEventListener("contextmenu", (event) => {
  //   // newElement.setAttribute("scale","3 3 3");
  //   console.log("clicked");
  // });
}

function getCameraRaycastPoint (raycaster) {

  var typesOfModes = document
    .querySelector('input[name="arMode"]:checked')
    .value.toLowerCase()


  raycaster = new THREE.Raycaster()
  var a;
  if(typesOfModes == 'object'){
    console.log(objCenXY)
    a = new THREE.Vector2(objCenXY.x,objCenXY.y)
  }
  else{
    a = new THREE.Vector2(0, 0)
  }

  raycaster.setFromCamera(a, document.getElementById('scene').camera)
  var intersects
  


  if (typesOfModes == 'surface')
    intersects = raycaster.intersectObject(
      (
        document.getElementById('ground') ||
        document.getElementById('image-plane')
      ).object3D,
      true
    )
  else if (typesOfModes == 'image')
    intersects = raycaster.intersectObject(
      document.getElementById('image-plane').object3D,
      true
    )
  else if (typesOfModes == 'body')
    intersects = raycaster.intersectObject(
      document.getElementById('wall').object3D,
      true
    )
  else if (typesOfModes == 'object')
    intersects = raycaster.intersectObject(
      document.getElementById('ground').object3D,
      true
    )

  var pos = intersects[0].point
  return pos
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
  const newElement = document.createElement('a-entity')
  newElement.object3D.position.copy(
    getWorldPosition(document.getElementById('holdAnchor').object3D)
  )
  newElement.object3D.quaternion.copy(
    getWorldQuaternion(document.getElementById('holdAnchor').object3D)
  )
  newElement.setAttribute('id', '3DObj-' + numOf3DObj)
  newElement.setAttribute('class', 'cantap 3DObj')
  // newElement.setAttribute("xrextras-hold-drag", "");
  newElement.setAttribute('xrextras-pinch-scale', '')
  newElement.setAttribute('xrextras-two-finger-rotate', '')
  newElement.setAttribute(
    'geometry',
    'primitive: box; width: 5; height: 5; depth:1;'
  )
  newElement.setAttribute('material', 'color: white; opacity: 0;')

  newElement.addEventListener('click', tapHandler)

  const imageElement = document.createElement('a-image')
  imageElement.setAttribute('position', '0 0 -0.1')
  imageElement.setAttribute('scale', '5 5 5') 
  imageElement.setAttribute('src', assetUrls[document.getElementById('objectVariable').value.toLowerCase().replace(" ","")] || document.getElementById('objectVariable').value)
  imageElement.setAttribute('shadow', { receive: false })
  newElement.appendChild(imageElement)

  newElement.setAttribute('shadow', {
    receive: false
  })

  // newElement.addEventListener("contextmenu", (event) => {
  //   // newElement.setAttribute("scale","3 3 3");
  //   console.log("clicked");
  // });

  document.getElementById('scene').sceneEl.appendChild(newElement)
}

// Get the modal
var modal = document.getElementById('myObjectsModal')

// Get the button that opens the modal
// var btn = document.getElementById('next')

// Get the <span> element that closes the modal
var span = document.getElementById("addObject")

// When the user clicks on the button, open the modal
// btn.onclick = function () {
//   modal.style.display = 'block'
// }

// When the user clicks on Add Object, close the modal
function updateInvisiblePlanes() {
  // document.getElementById('myObjectsModal').style.display = 'none';
  // modal.style.display = 'none'
  // setting corresponding hold-drag component
  var typesOfMode = document
  .querySelector('input[name="arMode"]:checked')
  .value.toLowerCase()

  if ( document.getElementsByClassName('3DObj').length==0 && typesOfMode == 'surface') {
    document.getElementById('scene').removeChild(document.getElementById("wallEntity"))
    document.getElementById('scene').removeChild(document.getElementById("imageEntity"))
  } else if (typesOfMode == 'image') {
    document.getElementById('scene').removeChild(document.getElementById("wallEntity"))
    document.getElementById('scene').removeChild(document.getElementById("ground"))
  } else if (typesOfMode == 'body') {
    document.getElementById('scene').removeChild(document.getElementById("ground"))
    document.getElementById('scene').removeChild(document.getElementById("imageEntity"))
  } else if (typesOfMode == 'object') {
    document.getElementById('scene').removeChild(document.getElementById("wallEntity"))
    document.getElementById('scene').removeChild(document.getElementById("imageEntity"))
  }
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = 'none'
  }
}
