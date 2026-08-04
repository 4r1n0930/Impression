import { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import type { Group, Object3D, AnimationClip } from 'three'
import { customizeMaterials } from '../../utils/customizeMaterials'
import { setMonkeyNode, setGateNode } from '../../utils/eyePosition'
import {
  setIsEyeHovered,
  setIsGateHovered,
  getInteractionState,
  setInteractionState,
} from '../../utils/interactionState'
import { getScrollProgress } from '../../utils/scrollProgress'

const GLB_PATH = '/models/building.glb'
const DRACO_DECODER_PATH = '/draco/'

const IMPORTANT_NODES = [
  'gate',
  'Suzanne',
  'Plane',
  'tiles',
  'hero',
  'Text',
  'IMPRESSION.001',
] as const

export default function Building() {
  const groupRef = useRef<Group>(null)
  const nodeRefs = useRef<Record<string, Object3D | null>>({})
  const animationsRef = useRef<AnimationClip[]>([])
  const materialsApplied = useRef(false)

  const gltf = useGLTF(GLB_PATH, DRACO_DECODER_PATH)
  const { scene, animations } = gltf

  useEffect(() => {
    animationsRef.current = animations
  }, [animations])

  useEffect(() => {
    if (!groupRef.current || materialsApplied.current) return

    for (const name of IMPORTANT_NODES) {
      nodeRefs.current[name] = groupRef.current.getObjectByName(name) ?? null
    }

    const found = Object.entries(nodeRefs.current)
      .filter(([, v]) => v !== null)
      .map(([k]) => k)
    const missing = IMPORTANT_NODES.filter((n) => !found.includes(n))

    console.log('[Building] Nodes found:', found)
    if (missing.length > 0) {
      console.warn('[Building] Nodes missing:', missing)
    }

    setMonkeyNode(nodeRefs.current['Suzanne'] ?? null)
    setGateNode(nodeRefs.current['gate'] ?? null)

    customizeMaterials(scene)
    materialsApplied.current = true
  }, [scene])

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        onPointerOver={(e: any) => {
          e.stopPropagation()
          let curr: Object3D | null = e.object
          while (curr) {
            if (curr.name === 'gate' || curr.name.toLowerCase().includes('gate')) {
              setIsGateHovered(true)
              document.body.style.cursor = 'pointer'
              return
            }
            if (curr.name === 'Suzanne' || curr.name.toLowerCase().includes('suzanne')) {
              setIsEyeHovered(true)
              document.body.style.cursor = 'pointer'
              return
            }
            curr = curr.parent
          }
        }}
        onPointerOut={() => {
          setIsGateHovered(false)
          setIsEyeHovered(false)
          document.body.style.cursor = 'default'
        }}
        onClick={(e: any) => {
          e.stopPropagation()
          let curr: Object3D | null = e.object
          while (curr) {
            if (curr.name === 'gate' || curr.name.toLowerCase().includes('gate')) {
              if (getScrollProgress() >= 0.85 || getInteractionState() === 'READY_FOR_SCAN') {
                setInteractionState('LOGIN_MODAL_OPEN')
              }
              return
            }
            if (curr.name === 'Suzanne' || curr.name.toLowerCase().includes('suzanne')) {
              if (getInteractionState() === 'READY_FOR_SCAN') {
                setInteractionState('SCANNING')
              }
              return
            }
            curr = curr.parent
          }
        }}
      />
    </group>
  )
}

