import { CatmullRomCurve3, Vector3 } from 'three'

const GATE = new Vector3(3.9, 17.2, 12.4)
const START_POS = new Vector3(0, 120, 35)
const END_POS = new Vector3(3.9, 19, 34)

const positionPoints = [
  START_POS,
  END_POS,
]

const targetPoints = [
  new Vector3(-10, 25, 12.4),
  GATE,
]

export const positionCurve = new CatmullRomCurve3(positionPoints, false, 'catmullrom', 0.5)
export const targetCurve = new CatmullRomCurve3(targetPoints, false, 'catmullrom', 0.5)

export const CAMERA_FOV_START = 60
export const CAMERA_FOV_END = 40

export const PHASE_NAMES = [
  'Establishing',
  'Zoom to Gate',
]
