export default function Lighting() {
  return (
    <>
      <directionalLight
        position={[20, 30, 10]}
        intensity={3}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={40}
        shadow-camera-bottom={-20}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />
      <ambientLight intensity={0.3} color="#ffffff" />
      <hemisphereLight args={['#b1e1ff', '#1a1a2e', 0.4]} />
      <pointLight
        position={[3.9, 18.0, 14.0]}
        intensity={1.5}
        color="#ffe0b2"
        distance={15}
        decay={2}
      />
    </>
  )
}
