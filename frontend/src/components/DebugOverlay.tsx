import { useEffect, useState } from 'react'
import { PHASE_NAMES } from '../utils/cameraPath'
import { getScrollProgress } from '../utils/scrollProgress'

export default function DebugOverlay() {
  const [visible, setVisible] = useState(false)
  const [data, setData] = useState({ progress: 0, phase: PHASE_NAMES[0] })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setVisible((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)

    let raf: number
    const tick = () => {
      const p = getScrollProgress()
      const idx = Math.min(Math.floor(p * PHASE_NAMES.length), PHASE_NAMES.length - 1)
      setData({ progress: p, phase: PHASE_NAMES[idx] })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('keydown', onKey)
      cancelAnimationFrame(raf)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        background: 'rgba(0,0,0,0.8)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: 12,
        padding: '12px 16px',
        borderRadius: 6,
        zIndex: 9999,
        lineHeight: 1.6,
      }}
    >
      <div><strong>Phase:</strong> {data.phase}</div>
      <div><strong>Progress:</strong> {(data.progress * 100).toFixed(1)}%</div>
      <div><strong>Raw scroll:</strong> {data.progress.toFixed(4)}</div>
    </div>
  )
}
