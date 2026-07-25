import * as THREE from 'three'

type MaterialCategory =
  | 'glass'
  | 'clearcoat'
  | 'tile'
  | 'emissive'
  | 'organic'
  | 'concrete'

function classifyMaterial(name: string): MaterialCategory {
  if (!name) return 'concrete'
  const n = name.toLowerCase()

  if (n.includes('glass')) return 'glass'
  if (n === 'material.004') return 'clearcoat'
  if (n.includes('tile')) return 'tile'
  if (name === 'lights' || name === 'Material') return 'emissive'
  if (n.includes('fur') || n.includes('leaf') || n.includes('trunk')) return 'organic'
  if (n === 'eyes' || n === 'eyebrows') return 'organic'

  return 'concrete'
}

function createGlass(name: string): THREE.MeshPhysicalMaterial {
  const tint = name.toLowerCase().includes('gf') || name.toLowerCase().includes('door')? 0xd8e8f4 : 0x000847
  return new THREE.MeshPhysicalMaterial({
    color: tint,
    metalness: 0,
    roughness: 0.05,
    transmission: 0.62,
    thickness: 0.5,
    ior: 1.52,
    envMapIntensity: 2.0,
    clearcoat: 0.1,
    clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
  })
}

function createClearcoat(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0xeeeeee,
    metalness: 0,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.5,
  })
}

function createTile(_name: string): THREE.MeshStandardMaterial {

  return new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.02,
    roughness:  0.22,
    envMapIntensity: 1.2,
  })
}

function createEmissive(name: string): THREE.MeshStandardMaterial {
  if (name === 'lights') {
    return new THREE.MeshStandardMaterial({
      color: 0x000000,
      emissive: new THREE.Color(1.0, 0.796, 0.586),
      emissiveIntensity: 3.0,
      toneMapped: false,
    })
  }
  return new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: new THREE.Color(1.0, 0.349, 0.031),
    emissiveIntensity: 2.0,
    toneMapped: false,
  })
}

function createOrganic(name: string): THREE.MeshStandardMaterial {
  if (name === 'eyes') {
    return new THREE.MeshStandardMaterial({
      color: 0x0216cc,
      metalness: 0,
      roughness: 0.3,
      envMapIntensity: 0.6,
    })
  }
  if (name === 'eyebrows') {
    return new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0,
      roughness: 0.7,
    })
  }
  if (name.toLowerCase().includes('fur')) {
    return new THREE.MeshStandardMaterial({
      color: 0x160905,
      metalness: 0,
      roughness: 0.92,
    })
  }
  if (name.toLowerCase().includes('leaf')) {
    return new THREE.MeshStandardMaterial({
      color: 0x001703,
      metalness: 0,
      roughness: 0.8,
    })
  }
  return new THREE.MeshStandardMaterial({
    color: 0x260c04,
    metalness: 0,
    roughness: 0.88,
  })
}

function createConcrete(
  original: THREE.Material,
): THREE.MeshStandardMaterial {
  const color =
    original instanceof THREE.MeshStandardMaterial
      ? original.color.clone()
      : new THREE.Color(0x888888)

  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0,
    roughness: 0.72,
    envMapIntensity: 0.8,
  })
}

function createReplacement(
  name: string,
  original: THREE.Material,
): THREE.Material {
  const cat = classifyMaterial(name)

  switch (cat) {
    case 'glass':
      return createGlass(name)
    case 'clearcoat':
      return createClearcoat()
    case 'tile':
      return createTile(name)
    case 'emissive':
      return createEmissive(name)
    case 'organic':
      return createOrganic(name)
    default:
      return createConcrete(original)
  }
}

export function customizeMaterials(scene: THREE.Object3D): void {
  const replaced = new Map<THREE.Material, THREE.Material>()
  let meshCount = 0

  scene.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    meshCount++

    const material = child.material
    if (!(material instanceof THREE.Material)) return

    if (replaced.has(material)) {
      child.material = replaced.get(material)!
      return
    }

    const newMaterial = createReplacement(material.name, material)
    replaced.set(material, newMaterial)
    child.material = newMaterial
    material.dispose()
  })

  console.log(
    `[Materials] ${meshCount} meshes, ${replaced.size} unique materials replaced`,
  )
}
