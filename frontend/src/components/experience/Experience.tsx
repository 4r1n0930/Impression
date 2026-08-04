import Lighting from './Lighting'
import Building from './Building'
import CameraController from './CameraController'
import EyeTracker from './EyeTracker'

export default function Experience() {
  return (
    <>
      <color attach="background" args={['#ffffff']} />
      <Lighting />
      <Building />
      <CameraController />
      <EyeTracker />
    </>
  )
}
