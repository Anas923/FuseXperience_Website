import { useEffect, useRef, useState } from "react"
import { gsap } from "gsap"

export default function ClickEffects({
  color = "#FF5A1F",
  interactionMode = "wavy",
  duration = 0.3,
  strokeWidth = 1.5,
  effectSize = 90,
  rotation = 36,
}) {
  const containerRef = useRef(null)
  const [rings, setRings] = useState([])
  const [bursts, setBursts] = useState([])
  const [particles, setParticles] = useState([])
  const [crosshairs, setCrosshairs] = useState([])
  const [wavies, setWavies] = useState([])
  const [snipers, setSnipers] = useState([])

  useEffect(() => {
    const handleClick = (e) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = `${e.timeStamp}-${Math.round(x)}-${Math.round(y)}`

      if (interactionMode === "rings") {
        setRings((prev) => [...prev, { id, x, y }])
      } else if (interactionMode === "burst") {
        setBursts((prev) => [...prev, { id, x, y }])
      } else if (interactionMode === "particles") {
        const newParticles = Array.from({ length: 8 }, (_, i) => ({
          id: `${id}-${i}`,
          x,
          y,
          angle: i * 45 * (Math.PI / 180),
          distance: effectSize * 0.2 + Math.random() * (effectSize * 0.3),
        }))
        setParticles((prev) => [...prev, ...newParticles])
      } else if (interactionMode === "crosshair") {
        setCrosshairs((prev) => [...prev, { id, x, y }])
      } else if (interactionMode === "wavy") {
        setWavies((prev) => [...prev, { id, x, y }])
      } else if (interactionMode === "sniper") {
        setSnipers((prev) => [...prev, { id, x, y }])
      }
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [interactionMode, effectSize])

  const svgStyle = (x, y) => ({
    position: "absolute",
    left: x - effectSize / 2,
    top: y - effectSize / 2,
    width: effectSize,
    height: effectSize,
    pointerEvents: "none",
    overflow: "visible",
    transform: `rotate(${rotation}deg)`,
    transformOrigin: "center",
  })

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      {interactionMode === "rings" &&
        rings.map((ring) => (
          <svg
            key={ring.id}
            style={svgStyle(ring.x, ring.y)}
            ref={(el) => {
              if (!el) return
              gsap.set(el, { scale: 0.5 })
              gsap.timeline()
                .to(el, {
                  scale: 2,
                  duration,
                  ease: "power3.out",
                  onComplete: () =>
                    setRings((prev) => prev.filter((r) => r.id !== ring.id)),
                }, 0)
                .to(el, {
                  opacity: 0,
                  duration: duration * 0.2,
                  ease: "linear",
                }, duration * 0.8)
            }}
          >
            <circle
              cx={effectSize / 2}
              cy={effectSize / 2}
              r={effectSize / 4}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
            />
          </svg>
        ))}

      {interactionMode === "burst" &&
        bursts.map((burst) => (
          <svg
            key={burst.id}
            style={svgStyle(burst.x, burst.y)}
            ref={(el) => {
              if (!el) return
              const lines = el.querySelectorAll("line")
              lines.forEach((line, index) => {
                const angle = [45, 80, 115, 150][index] * (Math.PI / 180)
                const cx = effectSize / 2
                const cy = effectSize / 2
                const sx = cx + effectSize * 0.1 * Math.cos(angle)
                const sy = cy - effectSize * 0.1 * Math.sin(angle)
                const ex = cx + effectSize * 0.25 * Math.cos(angle)
                const ey = cy - effectSize * 0.25 * Math.sin(angle)
                gsap.set(line, {
                  attr: { x1: sx, y1: sy, x2: ex, y2: ey },
                  strokeWidth,
                })
                gsap.timeline()
                  .to(line, {
                    attr: { x1: ex, y1: ey, x2: ex, y2: ey },
                    x: (effectSize / 4) * Math.cos(angle),
                    y: -(effectSize / 4) * Math.sin(angle),
                    duration,
                    ease: "power2.out",
                    onComplete: () =>
                      setBursts((prev) => prev.filter((b) => b.id !== burst.id)),
                  }, 0)
                  .to(line, {
                    strokeWidth: 0,
                    duration: duration * 0.4,
                    ease: "linear",
                  }, duration * 0.6)
              })
            }}
          >
            {[45, 80, 115, 150].map((_, i) => (
              <line key={i} x1={effectSize / 2} y1={effectSize / 2} x2={effectSize / 2} y2={effectSize / 2} stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" />
            ))}
          </svg>
        ))}

      {interactionMode === "particles" &&
        particles.map((particle) => (
          <div
            key={particle.id}
            style={{
              position: "absolute",
              transformOrigin: "center",
              left: particle.x - strokeWidth / 2,
              top: particle.y - strokeWidth / 2,
              width: strokeWidth,
              height: strokeWidth,
              backgroundColor: color,
              borderRadius: "50%",
              pointerEvents: "none",
              transform: `rotate(${rotation}deg)`,
            }}
            ref={(el) => {
              if (!el || el.dataset.animated) return
              el.dataset.animated = "true"
              const fx = particle.x + Math.cos(particle.angle) * particle.distance
              const fy = particle.y + Math.sin(particle.angle) * particle.distance
              gsap.set(el, { left: particle.x - strokeWidth / 2, top: particle.y - strokeWidth / 2, width: 0, height: 0 })
              gsap.timeline()
                .to(el, { width: strokeWidth, height: strokeWidth, duration: duration * 0.2, ease: "power1.out" })
                .to(el, { left: fx - strokeWidth / 2, top: fy - strokeWidth / 2, duration: duration * 0.4, ease: "power1.out" }, duration * 0.2)
                .to(el, { width: 0, height: 0, left: fx, top: fy, duration: duration * 0.4, ease: "linear", onComplete: () => setParticles((prev) => prev.filter((p) => p.id !== particle.id)) }, duration * 0.6)
            }}
          />
        ))}

      {interactionMode === "crosshair" &&
        crosshairs.map((crosshair) => (
          <svg
            key={crosshair.id}
            style={svgStyle(crosshair.x, crosshair.y)}
            ref={(el) => {
              if (!el) return
              const lines = el.querySelectorAll("line")
              lines.forEach((line, index) => {
                const angle = [0, 90, 180, 270][index] * (Math.PI / 180)
                const cx = effectSize / 2
                const cy = effectSize / 2
                const ll = effectSize * 0.3
                const sx = cx + 20 * Math.cos(angle)
                const sy = cy - 20 * Math.sin(angle)
                const ex = cx + (20 + ll) * Math.cos(angle)
                const ey = cy - (20 + ll) * Math.sin(angle)
                gsap.set(line, { attr: { x1: sx, y1: sy, x2: cx, y2: cy }, strokeWidth })
                gsap.timeline()
                  .to(line, { attr: { x1: ex, y1: ey, x2: ex, y2: ey }, duration: duration * 0.8, ease: "power1.out" })
                  .to(line, { strokeWidth: 0, duration: duration * 0.6, ease: "linear", onComplete: () => setCrosshairs((prev) => prev.filter((c) => c.id !== crosshair.id)) }, duration * 0.4)
              })
            }}
          >
            {[0, 90, 180, 270].map((_, i) => (
              <line key={i} x1={effectSize / 2} y1={effectSize / 2} x2={effectSize / 2} y2={effectSize / 2} stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" />
            ))}
          </svg>
        ))}

      {interactionMode === "wavy" &&
        wavies.map((wavy) => (
          <svg
            key={wavy.id}
            style={svgStyle(wavy.x, wavy.y)}
            ref={(el) => {
              if (!el) return
              const paths = el.querySelectorAll("path")
              paths.forEach((path) => {
                const pathLength = path.getTotalLength()
                gsap.set(path, { strokeDasharray: "1, " + pathLength, strokeDashoffset: 0, strokeWidth })
                gsap.timeline()
                  .to(path, { strokeDasharray: `${pathLength}, ${pathLength}`, strokeDashoffset: -pathLength, duration, ease: "power1.out" })
                  .to(path, { strokeWidth: 0, duration: duration * 0.4, ease: "linear" }, duration * 0.6)
              })
              gsap.delayedCall(duration, () => setWavies((prev) => prev.filter((w) => w.id !== wavy.id)))
            }}
          >
            {[45, 90, 135, 180].map((angle, i) => {
              const cx = effectSize / 2
              const cy = effectSize / 2
              const sr = effectSize * 0.1
              const er = effectSize * 0.5
              const rad = (angle * Math.PI) / 180
              const sx = cx + sr * Math.cos(rad)
              const sy = cy - sr * Math.sin(rad)
              const ex = cx + er * Math.cos(rad)
              const ey = cy - er * Math.sin(rad)
              const mx = (sx + ex) / 2
              const my = (sy + ey) / 2
              const wo = effectSize * 0.05
              const c1x = mx + wo * Math.cos(rad + Math.PI / 2)
              const c1y = my - wo * Math.sin(rad + Math.PI / 2)
              const d = `M ${sx} ${sy} Q ${c1x} ${c1y} ${mx} ${my} T ${ex} ${ey}`
              return <path key={i} d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
            })}
          </svg>
        ))}

      {interactionMode === "sniper" &&
        snipers.map((sniper) => (
          <div key={sniper.id}>
            <svg
              style={svgStyle(sniper.x, sniper.y)}
              ref={(el) => {
                if (!el) return
                const lines = el.querySelectorAll("line")
                lines.forEach((line, index) => {
                  const angle = [0, 90, 180, 270][index] * (Math.PI / 180)
                  const cx = effectSize / 2
                  const cy = effectSize / 2
                  const ll = effectSize * 0.2
                  const sx = cx + 5 * Math.cos(angle)
                  const sy = cy - 5 * Math.sin(angle)
                  const ex = cx + (5 + ll) * Math.cos(angle)
                  const ey = cy - (5 + ll) * Math.sin(angle)
                  gsap.set(line, { attr: { x1: sx, y1: sy, x2: ex, y2: ey }, strokeWidth })
                  gsap.timeline()
                    .to(line, { attr: { x1: ex, y1: ey, x2: ex, y2: ey }, x: (5 + ll) * Math.cos(angle), y: -(5 + ll) * Math.sin(angle), duration, ease: "power2.out" })
                    .to(line, { strokeWidth: 0, duration: duration * 0.4, ease: "linear" }, duration * 0.6)
                })
              }}
            >
              {[0, 90, 180, 270].map((_, i) => (
                <line key={i} x1={effectSize / 2} y1={effectSize / 2} x2={effectSize / 2} y2={effectSize / 2} stroke={color} strokeWidth={strokeWidth} strokeLinecap="square" />
              ))}
            </svg>
            {[Math.PI / 3, (2 * Math.PI) / 3, (4 * Math.PI) / 3, (5 * Math.PI) / 3, Math.PI / 6, (5 * Math.PI) / 6, (7 * Math.PI) / 6, (11 * Math.PI) / 6].map((angle, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: sniper.x - strokeWidth / 2,
                  top: sniper.y - strokeWidth / 2,
                  width: strokeWidth,
                  height: strokeWidth,
                  backgroundColor: color,
                  pointerEvents: "none",
                  transformOrigin: "center",
                  transform: `rotate(${rotation}deg)`,
                }}
                ref={(el) => {
                  if (!el || el.dataset.animated) return
                  el.dataset.animated = "true"
                  gsap.set(el, { x: 0, y: 0, width: strokeWidth, height: strokeWidth })
                  gsap.timeline()
                    .to(el, {
                      x: Math.cos(angle) * (effectSize * 0.4),
                      y: Math.sin(angle) * (effectSize * 0.4),
                      duration,
                      ease: "power2.out",
                      onComplete: () => setSnipers((prev) => prev.filter((s) => s.id !== sniper.id)),
                    })
                    .to(el, { width: 0, height: 0, duration: duration * 0.4, ease: "linear" }, duration * 0.6)
                }}
              />
            ))}
          </div>
        ))}
    </div>
  )
}
