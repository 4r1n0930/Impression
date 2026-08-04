export type InteractionState =
  | 'LOCKED'
  | 'READY_FOR_SCAN'
  | 'SCANNING'
  | 'ACCESS_DENIED'
  | 'AUTH_TERMINAL_OPEN'
  | 'LOGIN_MODAL_OPEN'

let state: InteractionState = 'LOCKED'
let hovered = false
let gateHovered = false
const listeners = new Set<() => void>()

export function getInteractionState(): InteractionState {
  return state
}

export function setInteractionState(next: InteractionState) {
  if (state === next) return
  state = next
  listeners.forEach((fn) => fn())
}

export function getIsEyeHovered(): boolean {
  return hovered
}

export function setIsEyeHovered(v: boolean) {
  if (hovered === v) return
  hovered = v
  listeners.forEach((fn) => fn())
}

export function getIsGateHovered(): boolean {
  return gateHovered
}

export function setIsGateHovered(v: boolean) {
  if (gateHovered === v) return
  gateHovered = v
  listeners.forEach((fn) => fn())
}

export function onInteractionChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

