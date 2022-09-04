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
    cameraId: { default: 'camera' },
    groundId: { default: 'not-ground' },
    dragDelay: { default: 300 }
    // riseHeight: {default: 1},
  },
  init () {
    this.camera = document.getElementById(this.data.cameraId)
    if (!this.camera) {
      throw new Error(
        `[xrextras-hold-drag] Couldn't find camera with id '${this.data.cameraId}'`
      )
    }
    this.threeCamera = this.camera.getObject3D('camera')
    this.ground = document.getElementById(this.data.groundId)
    if (!this.ground) {
      throw new Error(
        `[xrextras-hold-drag] Couldn't find ground with id '${this.data.groundId}'`
      )
    }

    this.internalState = {
      fingerDown: false,
      dragging: false,
      distance: 0,
      startDragTimeout: null,
      raycaster: new THREE.Raycaster()
    }

    this.fingerDown = this.fingerDown.bind(this)
    this.startDrag = this.startDrag.bind(this)
    this.fingerMove = this.fingerMove.bind(this)
    this.fingerUp = this.fingerUp.bind(this)

    this.el.addEventListener('mousedown', this.fingerDown)
    this.el.sceneEl.addEventListener('onefingermove', this.fingerMove)
    this.el.sceneEl.addEventListener('onefingerend', this.fingerUp)
    this.el.classList.add('cantap') // Needs "objects: .cantap" attribute on raycaster.
  },
  tick () {
    if (this.internalState.dragging) {
      let desiredPosition = null
      if (this.internalState.positionRaw) {
        const screenPositionX =
          (this.internalState.positionRaw.x / document.body.clientWidth) * 2 - 1
        const screenPositionY =
          (this.internalState.positionRaw.y / document.body.clientHeight) * 2 -
          1
        const screenPosition = new THREE.Vector2(
          screenPositionX,
          -screenPositionY
        )

        this.threeCamera = this.threeCamera || this.camera.getObject3D('camera')

        this.internalState.raycaster.setFromCamera(
          screenPosition,
          this.threeCamera
        )
        const intersects = this.internalState.raycaster.intersectObject(
          this.ground.object3D,
          true
        )

        if (intersects.length > 0) {
          const intersect = intersects[0]
          this.internalState.distance = intersect.distance
          desiredPosition = intersect.point
        }
      }

      if (!desiredPosition) {
        console.log('miss')
        desiredPosition = this.camera.object3D.localToWorld(
          new THREE.Vector3(0, 0, -this.internalState.distance)
        )
      }

      // desiredPosition.y = this.data.riseHeight
      var scene = document.getElementById('scene')
      var parent = this.el.parentElement
      scene.object3D.attach(this.el.object3D)
      this.el.object3D.position.lerp(desiredPosition, 0.2)
      parent.object3D.attach(this.el.object3D)

      // this.el.object3D.position.set(desiredPosition.x-this.el.parentElement.object3D.position.x,desiredPosition.y-this.el.parentElement.object3D.position.y,desiredPosition.z-this.el.parentElement.object3D.position.z)
    }
  },
  remove () {
    this.el.removeEventListener('mousedown', this.fingerDown)
    this.el.sceneEl.removeEventListener('onefingermove', this.fingerMove)
    this.el.sceneEl.removeEventListener('onefingerend', this.fingerUp)
    if (this.internalState.fingerDown) {
      this.fingerUp()
    }
  },
  fingerDown (event) {
    this.internalState.fingerDown = true
    this.internalState.startDragTimeout = setTimeout(
      this.startDrag,
      this.data.dragDelay
    )
    this.internalState.positionRaw = event.detail.positionRaw
  },
  startDrag (event) {
    if (!this.internalState.fingerDown) {
      return
    }
    this.internalState.dragging = true
    this.internalState.distance = this.el.object3D.position.distanceTo(
      this.camera.object3D.position
    )
  },
  fingerMove (event) {
    this.internalState.positionRaw = event.detail.positionRaw
  },
  fingerUp (event) {
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
  }
}

AFRAME.registerComponent('hold-drag', customHoldDragComponent)
