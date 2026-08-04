/* eslint-disable react-hooks/immutability -- R3F useFrame requires direct camera mutation */
import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, PerspectiveCamera } from 'three'
import { getScrollProgress } from '../../utils/scrollProgress'
import {
  positionCurve,
  targetCurve,
  CAMERA_FOV_START,
  CAMERA_FOV_END,
} from '../../utils/cameraPath'
import {
  getInteractionState,
  setInteractionState,
} from '../../utils/interactionState'

const LERP_SPEED = 4.0
const GATE_THRESHOLD = 0.98
const GATE_EXIT_THRESHOLD = 0.92

export default function CameraController() {
  const { camera } = useThree()
  const smoothedProgress = useRef(0)
  const targetVec = useRef({ x: 3.9, y: 20, z: 5 })

  useFrame((_, delta) => {
    const cam = camera as PerspectiveCamera

    const raw = getScrollProgress()
    smoothedProgress.current = MathUtils.lerp(
      smoothedProgress.current,
      raw,
      1 - Math.exp(-LERP_SPEED * delta),
    )

    const t = MathUtils.clamp(smoothedProgress.current, 0, 1)

    const pos = positionCurve.getPointAt(t)
    cam.position.set(pos.x, pos.y, pos.z)

    const tgt = targetCurve.getPointAt(t)
    targetVec.current.x = MathUtils.lerp(targetVec.current.x, tgt.x, 1 - Math.exp(-LERP_SPEED * delta))
    targetVec.current.y = MathUtils.lerp(targetVec.current.y, tgt.y, 1 - Math.exp(-LERP_SPEED * delta))
    targetVec.current.z = MathUtils.lerp(targetVec.current.z, tgt.z, 1 - Math.exp(-LERP_SPEED * delta))

    cam.lookAt(targetVec.current.x, targetVec.current.y, targetVec.current.z)

    cam.fov = MathUtils.lerp(CAMERA_FOV_START, CAMERA_FOV_END, t)
    cam.updateProjectionMatrix()

    const current = getInteractionState()
    if (current === 'LOCKED' && smoothedProgress.current >= GATE_THRESHOLD) {
      setInteractionState('READY_FOR_SCAN')
    } else if (
      current === 'READY_FOR_SCAN' &&
      smoothedProgress.current < GATE_EXIT_THRESHOLD
    ) {
      setInteractionState('LOCKED')
    }
  })

  return null
}
