import { OrbitControls } from '@react-three/drei'

export default function Camera() {
  return (
    <OrbitControls
      makeDefault
      target={[8.9, 20.0, 12.4]}
      minDistance={20}
      maxDistance={100}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI * 0.85}
    />
  )
}
