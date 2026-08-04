import type { Object3D } from 'three'

let monkeyNode: Object3D | null = null
let gateNode: Object3D | null = null
const screenPos = { x: 0.5, y: 0.5 }
const gateScreenPos = { x: 0.5, y: 0.5 }
let ready = false

export function setMonkeyNode(node: Object3D | null) {
  monkeyNode = node
}

export function getMonkeyNode(): Object3D | null {
  return monkeyNode
}

export function setGateNode(node: Object3D | null) {
  gateNode = node
}

export function getGateNode(): Object3D | null {
  return gateNode
}

export function getMonkeyScreenPosition(): { x: number; y: number } {
  return screenPos
}

export function setMonkeyScreenPosition(x: number, y: number) {
  screenPos.x = x
  screenPos.y = y
  if (!ready) ready = true
}

export function getGateScreenPosition(): { x: number; y: number } {
  return gateScreenPos
}

export function setGateScreenPosition(x: number, y: number) {
  gateScreenPos.x = x
  gateScreenPos.y = y
}

export function isEyePositionReady(): boolean {
  return ready
}

