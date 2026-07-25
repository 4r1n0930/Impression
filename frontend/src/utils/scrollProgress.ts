let scrollProgress = 0
let initialized = false

export function getScrollProgress(): number {
  return scrollProgress
}

export function initScrollListener(): void {
  if (initialized) return
  initialized = true

  const onScroll = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  onScroll()
}
