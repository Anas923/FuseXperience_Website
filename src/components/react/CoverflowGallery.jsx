import { useState, useEffect, useCallback, useRef } from "react"

function useIsStaticRenderer() {
  return false
}

const DEFAULT_SLIDES = [
  {
    image: { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face", alt: "Professional man smiling" },
    title: "Alex Chen\nMarketing Director",
  },
  {
    image: { src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face", alt: "Professional woman smiling" },
    title: "Sarah Kim\nBrand Strategist",
  },
  {
    image: { src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face", alt: "Professional man" },
    title: "Marcus Johnson\nCEO, Lumos",
  },
  {
    image: { src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face", alt: "Professional woman" },
    title: "Priya Patel\nGrowth Lead",
  },
  {
    image: { src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face", alt: "Professional man" },
    title: "Jordan Taylor\nFounder",
  },
]

const PERSPECTIVE = 1600
const SCALE_STEP = 0.16
const MAX_VISIBLE = 2
const DEPTH = 240

function cssTransition(t) {
  const dur = t && typeof t.duration === "number" ? t.duration : 0.6
  let ease = "cubic-bezier(0.22, 1, 0.36, 1)"
  const e = t?.ease
  if (Array.isArray(e) && e.length === 4) {
    ease = `cubic-bezier(${e[0]}, ${e[1]}, ${e[2]}, ${e[3]})`
  } else if (typeof e === "string") {
    const map = { linear: "linear", easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out" }
    ease = map[e] || "ease"
  }
  return { dur, ease }
}

export default function CoverflowGallery(props) {
  const {
    slides = DEFAULT_SLIDES,
    cardWidth = 280,
    cardHeight = 280,
    radius = 20,
    tilt = 7,
    sideTilt = 7,
    gap = 7,
    opacity = 65,
    transition,
    autoplay = true,
    autoplayDirection = "rightToLeft",
    showTitle = true,
    titleFont,
    titleColor = "#ffffff",
    titlePosition,
    style,
  } = props

  const tp = titlePosition || {}
  const corner = tp.position || "bottomLeft"
  const isTop = corner === "topLeft" || corner === "topRight"
  const isRight = corner === "topRight" || corner === "bottomRight"
  const padLeft = tp.paddingLeft ?? 22
  const padRight = tp.paddingRight ?? 22
  const padTop = tp.paddingTop ?? 24
  const padBottom = tp.paddingBottom ?? 24

  const isStatic = useIsStaticRenderer()
  const list = slides && slides.length ? slides : DEFAULT_SLIDES
  const n = list.length
  const loop = true
  const [active, setActive] = useState(0)

  useEffect(() => {
    setActive((a) => Math.max(0, Math.min(n - 1, a)))
  }, [n])

  const moveDur = transition && typeof transition.duration === "number" ? transition.duration : 0.6
  const lockRef = useRef(false)
  const lock = useCallback(() => {
    lockRef.current = true
    window.setTimeout(() => { lockRef.current = false }, Math.max(50, moveDur * 1000))
  }, [moveDur])

  const step = useCallback((dir) => {
    if (lockRef.current) return
    lock()
    setActive((a) => (((a + dir) % n) + n) % n)
  }, [n, lock])

  const handleCardClick = useCallback((i) => {
    if (isStatic || autoplay || lockRef.current) return
    lock()
    setActive((a) => (i === a ? (a + 1) % n : i))
  }, [isStatic, autoplay, n, lock])

  const delay = transition && typeof transition.delay === "number" ? transition.delay : 2.5
  useEffect(() => {
    if (isStatic || !autoplay || n < 2) return
    const ms = Math.max(0.3, delay) * 1000
    const dir = autoplayDirection === "leftToRight" ? -1 : 1
    const id = window.setInterval(() => step(dir), ms)
    return () => window.clearInterval(id)
  }, [isStatic, autoplay, autoplayDirection, delay, n, step])

  const onKeyDown = useCallback((e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); step(1) }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1) }
  }, [step])

  const { dur, ease } = cssTransition(transition)
  const transitionCss = `transform ${dur}s ${ease}, opacity ${dur}s ${ease}`
  const effectiveRadius = (Math.max(0, Math.min(20, radius)) / 20) * (Math.min(cardWidth, cardHeight) / 2)
  const dim = 1 - Math.max(0, Math.min(100, opacity)) / 100

  return (
    <div
      style={{
        ...(style || {}),
        position: "relative",
        width: "100%",
        height: "100%",
        minWidth: 320,
        minHeight: 360,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: `${PERSPECTIVE}px`,
        overflow: "hidden",
        outline: "none",
      }}
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      onKeyDown={isStatic ? undefined : onKeyDown}
    >
      <div
        style={{
          position: "relative",
          width: cardWidth,
          height: cardHeight,
          transformStyle: "preserve-3d",
        }}
      >
        {list.map((slide, i) => {
          let rel = i - active
          if (loop) {
            if (rel > n / 2) rel -= n
            if (rel < -n / 2) rel += n
          }
          const ax = Math.abs(rel)
          const visible = ax <= MAX_VISIBLE
          const isActive = rel === 0
          const sc = Math.max(0.4, 1 - ax * SCALE_STEP)
          const tx = rel * (gap * 30)
          const tz = -ax * DEPTH
          const ry = -rel * tilt
          const rz = rel * sideTilt
          const src = slide.image?.src || ""

          const cardStyle = {
            position: "absolute",
            left: "50%",
            top: "50%",
            width: cardWidth,
            height: cardHeight,
            borderRadius: effectiveRadius,
            overflow: "hidden",
            transformStyle: "preserve-3d",
            transformOrigin: "center center",
            transform: `translate(-50%, -50%) translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc})`,
            transition: transitionCss,
            opacity: visible ? 1 : 0,
            cursor: autoplay || isActive ? "default" : "pointer",
            pointerEvents: visible && !isStatic && !autoplay ? "auto" : "none",
            backgroundColor: "#1a1a1a",
          }

          return (
            <div
              key={i}
              style={cardStyle}
              onClick={isStatic ? undefined : () => handleCardClick(i)}
              aria-label={slide.title}
              aria-hidden={!visible}
            >
              {src ? (
                <img
                  src={src}
                  alt={slide.image?.alt || slide.title || ""}
                  draggable={false}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    userSelect: "none",
                  }}
                />
              ) : null}

              {showTitle && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: isTop
                        ? "linear-gradient(0deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.7) 100%)"
                        : "linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.7) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: padLeft,
                      right: padRight,
                      [isTop ? "top" : "bottom"]: isTop ? padTop : padBottom,
                      textAlign: isRight ? "right" : "left",
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        color: titleColor,
                        fontSize: 20,
                        fontWeight: 700,
                        lineHeight: "1.2em",
                        letterSpacing: "-0.02em",
                        whiteSpace: "pre-line",
                        textShadow: "0 2px 10px rgba(0,0,0,0.4)",
                        ...(titleFont || {}),
                      }}
                    >
                      {slide.title}
                    </span>
                  </div>
                </>
              )}

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#000000",
                  opacity: isActive ? 0 : dim,
                  transition: `opacity ${dur}s ${ease}`,
                  pointerEvents: "none",
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
