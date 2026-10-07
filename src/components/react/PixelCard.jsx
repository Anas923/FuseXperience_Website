import { useEffect, useRef } from "react"

class Pixel {
  constructor(canvas, context, x, y, color, speed, delay, maxPx, dpr) {
    this.width = canvas.width
    this.height = canvas.height
    this.ctx = context
    this.x = x * dpr
    this.y = y * dpr
    this.color = color
    this.speed = this.getRandomValue(0.1, 0.9) * speed
    this.size = 0
    const factor = (maxPx * dpr) / 2
    this.sizeStep = Math.random() * 0.4 * factor
    this.minSize = 0.5 * factor
    this.maxSizeInteger = maxPx * dpr
    this.maxSize = this.getRandomValue(this.minSize, maxPx * dpr)
    this.delay = delay
    this.counter = 0
    this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.005
    this.isIdle = false
    this.isReverse = false
    this.isShimmer = false
    this.growStart = null
    this.shrinkStart = null
    this.shrinkFrom = 0
  }

  getRandomValue(min, max) {
    return Math.random() * (max - min) + min
  }

  draw() {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5
    this.ctx.fillStyle = this.color
    this.ctx.fillRect(
      this.x + centerOffset,
      this.y + centerOffset,
      this.size,
      this.size
    )
  }

  appear() {
    this.isIdle = false
    if (this.counter <= this.delay) {
      this.counter += this.counterStep
      return
    }
    if (this.size >= this.maxSize) {
      this.isShimmer = true
    }
    if (this.isShimmer) {
      this.shimmer()
    } else {
      this.size += this.sizeStep
    }
    this.draw()
  }

  disappear() {
    this.isShimmer = false
    this.counter = 0
    if (this.size <= 0) {
      this.isIdle = true
      return
    }
    this.size -= 0.1 * this.maxSizeInteger / 2
    this.draw()
  }

  shimmer() {
    if (this.size >= this.maxSize) {
      this.isReverse = true
    } else if (this.size <= this.minSize) {
      this.isReverse = false
    }
    if (this.isReverse) {
      this.size -= this.speed
    } else {
      this.size += this.speed
    }
  }
}

function getEffectiveSpeed(value, reducedMotion) {
  const min = 0
  const max = 100
  const throttle = 0.002
  if (value <= min || reducedMotion) return min
  else if (value >= max) return max * throttle
  else return value * throttle
}

const DEFAULT_COLORS = [
  "rgba(255, 90, 31, 0.65)",
  "rgba(255, 90, 31, 0.35)",
  "rgba(255, 90, 31, 0.15)",
]

export default function PixelCard({
  children,
  colors = DEFAULT_COLORS,
  gap = 5,
  pixelSize = 3,
  speed = 80,
  appearFrom = "middle",
  trigger = "hover",
  style,
  className,
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const pixelsRef = useRef([])
  const animationRef = useRef(null)
  const revealedRef = useRef(false)
  const sizeRef = useRef({ w: 0, h: 0 })
  const dprRef = useRef(1)
  const propsKeyRef = useRef("")
  const timePreviousRef = useRef(typeof performance !== "undefined" ? performance.now() : 0)
  const reducedMotion = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ).current

  const finalGap = gap
  const finalSpeed = speed
  const finalColors = colors && colors.length > 0 ? colors : DEFAULT_COLORS

  const initPixels = (force = false) => {
    if (!containerRef.current || !canvasRef.current) return false
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const width = Math.floor(rect.width)
    const height = Math.floor(rect.height)
    const ctx = canvas.getContext("2d")

    const changed = sizeRef.current.w !== width || sizeRef.current.h !== height
    if (!force && !changed && pixelsRef.current.length > 0) return false
    sizeRef.current = { w: width, h: height }
    dprRef.current = dpr

    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    ctx.scale(dpr, dpr)

    const colorsArray = finalColors
    const step = Math.max(1, parseInt(finalGap.toString(), 10))
    const pxs = []
    let idx = 0
    for (let x = 0; x < width; x += step) {
      for (let y = 0; y < height; y += step) {
        const c = colorsArray[idx % colorsArray.length]
        idx++
        let delay
        if (reducedMotion) {
          delay = 0
        } else if (appearFrom === "top") {
          delay = y
        } else if (appearFrom === "bottom") {
          delay = height - y
        } else if (appearFrom === "left") {
          delay = x
        } else if (appearFrom === "right") {
          delay = width - x
        } else {
          const dx = x - width / 2
          const dy = y - height / 2
          delay = Math.sqrt(dx * dx + dy * dy)
        }
        if (!ctx) return false
        pxs.push(
          new Pixel(
            canvas,
            ctx,
            x,
            y,
            c,
            getEffectiveSpeed(finalSpeed, reducedMotion),
            delay,
            Math.max(0.5, pixelSize),
            dpr
          )
        )
      }
    }
    pixelsRef.current = pxs
    return true
  }

  const doAnimate = (fnName) => {
    animationRef.current = requestAnimationFrame(() => doAnimate(fnName))
    const timeNow = performance.now()
    const timePassed = timeNow - timePreviousRef.current
    const timeInterval = 1000 / 60
    if (timePassed < timeInterval) return
    timePreviousRef.current = timeNow - (timePassed % timeInterval)

    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx || !canvasRef.current) return

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    let allIdle = true
    for (let i = 0; i < pixelsRef.current.length; i++) {
      const pixel = pixelsRef.current[i]
      pixel[fnName]()
      if (!pixel.isIdle) allIdle = false
    }
    if (allIdle) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  const handleAnimation = (name) => {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
    animationRef.current = requestAnimationFrame(() => doAnimate(name))
  }

  const onMouseEnter = () => handleAnimation("appear")
  const onMouseLeave = () => handleAnimation("disappear")

  const snapToShimmer = () => {
    for (const pixel of pixelsRef.current) {
      pixel.size = pixel.maxSize
      pixel.isShimmer = true
      pixel.isIdle = false
      pixel.growStart = null
      pixel.shrinkStart = null
      pixel.counter = pixel.delay + pixel.counterStep
    }
    const ctx = canvasRef.current?.getContext("2d")
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      for (const pixel of pixelsRef.current) pixel.draw()
    }
    handleAnimation("appear")
  }

  const present = () => {
    if (pixelsRef.current.length === 0) return
    handleAnimation("appear")
  }

  useEffect(() => {
    const propsKey = `${finalGap}|${finalSpeed}|${pixelSize}|${appearFrom}|${JSON.stringify(finalColors)}|${trigger}`
    const propsChanged = propsKeyRef.current !== propsKey
    propsKeyRef.current = propsKey

    const built = initPixels(propsChanged)
    if (trigger === "default" || trigger === "enter") {
      present()
    } else {
      if (!revealedRef.current) {
        revealedRef.current = true
        present()
      } else if (built) {
        snapToShimmer()
      } else {
        present()
      }
    }

    const observer = new ResizeObserver(() => {
      if (initPixels()) present()
    })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => {
      observer.disconnect()
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
    }
  }, [finalGap, finalSpeed, pixelSize, JSON.stringify(finalColors), appearFrom, trigger])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...(style || {}),
      }}
      onMouseEnter={trigger === "hover" ? onMouseEnter : undefined}
      onMouseLeave={trigger === "hover" ? onMouseLeave : undefined}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div style={{ position: "relative", zIndex: 2 }}>
        {children}
      </div>
    </div>
  )
}
