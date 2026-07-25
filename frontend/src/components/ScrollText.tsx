import { useEffect, useState } from 'react'
import { getScrollProgress } from '../utils/scrollProgress'

export default function ScrollText() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    let raf: number
    const tick = () => {
      setOffset(getScrollProgress())
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const translateY = -offset * 600
  const opacity = Math.max(1 - offset * 3, 0)

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 10,
        transform: `translateY(${translateY}px)`,
        opacity,
        transition: 'none',
      }}
    >
      <h1
        style={{
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(2.5rem, 6vw, 5rem)',
          fontWeight: 800,
          color: '#1a1a1a',
          letterSpacing: '-0.03em',
          margin: 0,
          position:'absolute',
          top:'12%',
          left:'10%'

        }}
      >
        IMPRESSION
      </h1>
      <p
        style={{
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(0.9rem, 2vw, 1.3rem)',
          fontWeight: 400,
          color: '#666666',
          marginTop: '1rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          position:'absolute',
          top:'28%',
          left:'10%',
        }}
      >
        Scroll to explore
      </p>
    </div>
  )
}
