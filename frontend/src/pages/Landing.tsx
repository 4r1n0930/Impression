import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader } from '@react-three/drei'
import Experience from '../components/experience/Experience'
import DebugOverlay from '../components/DebugOverlay'
import ScrollText from '../components/ScrollText'
import AuthOverlay from '../components/auth/AuthOverlay'
import { initScrollListener } from '../utils/scrollProgress'
import '../style/Landing.css'

export default function Landing() {
  const token = localStorage.getItem('token')
  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    initScrollListener()
  }, [])

  return (
    <div className="landing-container">
      <div className="landing-canvas-wrapper">
        <Canvas
          camera={{
            position: [3.9, 35, 60],
            fov: 50,
            near: 0.1,
            far: 2000,
          }}
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
        >
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </Canvas>
      </div>
      <div className="landing-scroll-spacer" />
      <Loader />
      <ScrollText />
      <DebugOverlay />
      <AuthOverlay />
    </div>
  )
}
