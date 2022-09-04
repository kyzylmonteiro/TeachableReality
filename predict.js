const STATUS = document.getElementById('status')
const VIDEO = document.getElementById('webcam')
const CAMERA_FEED_CANVAS = document.getElementById('cameraFeed')
const PREDICT_BUTTON = document.getElementById('predict')
const MOBILE_NET_INPUT_WIDTH = 224
const MOBILE_NET_INPUT_HEIGHT = 224
let predict = false

PREDICT_BUTTON.addEventListener('click', updateRunModeUI)

import { outputData, output3DData, updateOutputModeUI } from './modeoutput.js'

import { model, mobilenet, CLASS_NAMES } from './modeinput.js'

function createCanvas (i, imageUploadButtons) {
  let parentDiv = document.getElementsByClassName('class-container')[0]
  let outputImage = document.createElement('canvas')
  const img = new Image()
  img.src = outputData[i]
  outputImage.setAttribute(
    'width',
    document.getElementById('class1-canvas').width
  )
  outputImage.setAttribute(
    'height',
    document.getElementById('class1-canvas').height
  )
  outputImage.setAttribute('id', 'output-image' + i)
  parentDiv.insertBefore(outputImage, imageUploadButtons[i])
  var hRatio = outputImage.width / img.width
  var vRatio = outputImage.height / img.height
  var ratio = Math.min(hRatio, vRatio)

  var ctx = outputImage.getContext('2d')
  img.onload = () => {
    ctx.clearRect(0, 0, outputImage.width, outputImage.height)
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

function playAnimation (classID) {
  var classList = document.getElementsByClassName('3DObj')

  classList.forEach(el => {
    var objID = parseInt(el.id.match(/[0-9]+$/)[0])

    if (el.classList.contains('objOnImage')) {
      // console.log(output3DData[objID][classID]['position'].x);
      // document.getElementById("scene").object3D.attach(el.object3D);
      el.object3D.position.lerp(
        new THREE.Vector3(
          output3DData[objID][classID]['position'].x,
          output3DData[objID][classID]['position'].y,
          output3DData[objID][classID]['position'].z
        ),
        0.2
      )
      el.setAttribute(
        'rotation',
        output3DData[objID][classID]['rotation'].x +
          ' ' +
          output3DData[objID][classID]['rotation'].y +
          ' ' +
          output3DData[objID][classID]['rotation'].z
      )
      el.object3D.scale.lerp(
        new THREE.Vector3(
          output3DData[objID][classID]['scale'].x,
          output3DData[objID][classID]['scale'].y,
          output3DData[objID][classID]['scale'].z
        ),
        0.2
      )
    }

    // console.log(parseInt(objID),classID, output3DData[objID]);
    else {
      el.setAttribute(
        'animation__p',
        'property:position; dur: 200; easing: easeInOutSine; to: ' +
          output3DData[objID][classID]['position'].x +
          ' ' +
          output3DData[objID][classID]['position'].y +
          ' ' +
          output3DData[objID][classID]['position'].z +
          ';'
      )
      el.setAttribute(
        'animation__r',
        'property:rotation; dur: 200; easing: easeInOutSine; to: ' +
          output3DData[objID][classID]['rotation'].x +
          ' ' +
          output3DData[objID][classID]['rotation'].y +
          ' ' +
          output3DData[objID][classID]['rotation'].z +
          ';'
      )
      el.setAttribute(
        'animation__s',
        'property:scale; dur: 200; easing: easeInOutSine; to: ' +
          output3DData[objID][classID]['scale'].x +
          ' ' +
          output3DData[objID][classID]['scale'].y +
          ' ' +
          output3DData[objID][classID]['scale'].z +
          ';'
      )
    }
    // el.setAttribute(
    //   'animation__v',
    //   'property:visible; easing: easeInOutSine; to: ' + output3DData[objID][classID]['visible'].x + ';'
    // )
    if (
      output3DData[objID][classID]['visible'].x != el.getAttribute('visible')
    ) {
      if (output3DData[objID][classID]['visible'].x == true) {
        el.setAttribute('visible', 'true')
        el.setAttribute(
          'animation__v',
          'property:scale; dur: 200; easing:easeInOutSine; from: 0 0 0; to: ' +
            output3DData[objID][classID]['scale'].x +
            ' ' +
            output3DData[objID][classID]['scale'].y +
            ' ' +
            output3DData[objID][classID]['scale'].z +
            ';'
        )
      } else {
        el.setAttribute(
          'animation__v',
          'property:scale; dur: 200; easing:easeInOutSine; to: 0.1 0.1 0.1; from: ' +
            output3DData[objID][classID]['scale'].x +
            ' ' +
            output3DData[objID][classID]['scale'].y +
            ' ' +
            output3DData[objID][classID]['scale'].z +
            ';'
        )
        setTimeout(function () {
          el.setAttribute('visible', 'false')
        }, 200)
      }
    }
  })

  // emit not working from here
  // console.log(el, el.emit(), el.emit, el.emit("state-"+classID),  el.getAttribute("animation__1"))
  // setTimeout(function() {el.emit("state-"+classID);},1000);
}

export function updateRunModeUI () {
  let mode = document.getElementById('debug-container')
  mode.innerText = 'Run Mode'

  let imageUploadButtons = document.querySelectorAll('input.output-image')
  let animationButtons = document.querySelectorAll('button.output-obj-state')
  for (let i = 0; i < imageUploadButtons.length; i++) {
    // createCanvas(i, imageUploadButtons);
    imageUploadButtons[i].classList.add('removed')
  }
  for (let i = 0; i < animationButtons.length; i++) {
    animationButtons[i].classList.add('removed')
  }

  PREDICT_BUTTON.classList.add('removed')
  STATUS.style.display = "none"
  document.getElementById('timer').style.display = "none"

  var videoContainerChildern = document.getElementsByClassName(
    'video-container'
  )[0].children
  videoContainerChildern.forEach(ele => {
    if (ele.id != 'scene') ele.classList.add('removed')
  })

  predict = true
  predictLoop()
}

export function predictLoop () {
  if (predict) {
    tf.tidy(function () {
      let videoFrameAsTensor = tf.browser
        .fromPixels(
          CAMERA_FEED_CANVAS.getContext('2d').getImageData(
            0,
            0,
            CAMERA_FEED_CANVAS.width,
            CAMERA_FEED_CANVAS.height
          )
        )
        .div(255)
      let resizedTensorFrame = tf.image.resizeBilinear(
        videoFrameAsTensor,
        [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH],
        true
      )

      let imageFeatures = mobilenet.predict(resizedTensorFrame.expandDims())
      let prediction = model.predict(imageFeatures).squeeze()
      let highestIndex = prediction.argMax().arraySync()
      let predictionArray = prediction.arraySync()

      // var linksOfImages = [
      //   "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Un1.svg/1200px-Un1.svg.png",
      //   "https://upload.wikimedia.org/wikipedia/commons/7/75/Logo_TVE-2.svg",
      //   "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Trois.svg/1200px-Trois.svg.png",
      //   "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Quatre.svg/1200px-Quatre.svg.png",
      //   "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/5.svg/1200px-5.svg.png",
      // ];

      // let canvas = document.getElementById("output-canvas");
      // if (!canvas) {
      //   canvas = document.createElement("canvas");
      //   canvas.setAttribute("width", CAMERA_FEED_CANVAS.width);
      //   canvas.setAttribute("height", CAMERA_FEED_CANVAS.height);
      //   canvas.setAttribute("id", "output-canvas");
      //   document
      //     .getElementsByClassName("video-container")[0]
      //     .appendChild(canvas);
      // }

      // var ctx = canvas.getContext("2d");
      // const img = new Image();
      // img.src = outputData[highestIndex];
      // var hRatio = canvas.width / img.width;
      // var vRatio = canvas.height / img.height;
      // var ratio = Math.min(hRatio, vRatio);
      // img.onload = () => {
      //   ctx.clearRect(0, 0, canvas.width, canvas.height);
      //   ctx.drawImage(
      //     img,
      //     0,
      //     0,
      //     img.width,
      //     img.height,
      //     0,
      //     0,
      //     img.width * ratio,
      //     img.height * ratio
      //   );
      // };

      STATUS.innerText =
        'Prediction: ' +
        CLASS_NAMES[highestIndex] +
        ' with ' +
        Math.floor(predictionArray[highestIndex] * 100) +
        '% confidence'

      var prevhighestIndex = -1
      // console.log("EMMIT state"+highestIndex);
      // if(prevhighestIndex!=highestIndex)
      // {
      // console.log(highestIndex);
      // setTimeout(playAnimation,1000,highestIndex);
      playAnimation(highestIndex)
      //   prevhighestIndex = highestIndex
      // }
      // el.setAttribute("animation","property:scale; to: "+highestIndex+" "+highestIndex+" "+highestIndex+";")
    })

    window.requestAnimationFrame(predictLoop)
  }
}
