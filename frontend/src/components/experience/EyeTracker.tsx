/* eslint-disable react-hooks/immutability -- R3F useFrame requires direct mutation */
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import {
  getMonkeyNode,
  setMonkeyScreenPosition,
  getGateNode,
  setGateScreenPosition,
} from '../../utils/eyePosition'

const _worldPos = new Vector3()
const _gatePos = new Vector3()

export default function EyeTracker() {
  const { camera, size } = useThree()

  useFrame(() => {
    const node = getMonkeyNode()
    if (node) {
      node.getWorldPosition(_worldPos)
      _worldPos.y += 0.3
      _worldPos.z += 0.5

      _worldPos.project(camera)

      const x = (_worldPos.x * 0.5 + 0.5) * size.width
      const y = (-_worldPos.y * 0.5 + 0.5) * size.height

      setMonkeyScreenPosition(x, y)
    }

    const gate = getGateNode()
    if (gate) {
      gate.getWorldPosition(_gatePos)
      _gatePos.project(camera)

      const gx = (_gatePos.x * 0.5 + 0.5) * size.width
      const gy = (-_gatePos.y * 0.5 + 0.5) * size.height

      setGateScreenPosition(gx, gy)
    }
  })

  return null
}

