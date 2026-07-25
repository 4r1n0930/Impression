import { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import type { Group, Object3D, AnimationClip } from 'three'
import { customizeMaterials } from '../../utils/customizeMaterials'

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

    customizeMaterials(scene)
    materialsApplied.current = true
  }, [scene])

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  )
}
