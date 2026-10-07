import { useEffect, useRef, useState } from "react"
import Matter from "matter-js"

const DEFAULT_MEDIA = [
  { type: "image", src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80" },
  { type: "image", src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80" },
  { type: "image", src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80" },
  { type: "image", src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80" },
  { type: "image", src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&q=80" },
  { type: "image", src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80" },
  { type: "image", src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80" },
  { type: "image", src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&q=80" },
  { type: "image", src: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=500&q=80" },
  { type: "image", src: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&q=80" },
  { type: "image", src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&q=80" },
  { type: "image", src: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=500&q=80" },
]

export default function GravityGallery({
  media = DEFAULT_MEDIA,
  count = 16,
  size = 110,
  shape = "square",
  color = "#FF5A1F",
  friction = 1,
  gravX = 0,
  gravY = 1,
  mouseStiffness = 0.991,
  wallOptions = { top: true, bottom: true, right: true, left: true },
  style,
}) {
  const n = Math.max(1, Math.min(count, media.length))
  const containerRef = useRef(null)
  const rafRef = useRef(0)
  const [hasStarted, setHasStarted] = useState(false)
  const depKey = JSON.stringify({ n, size, shape, gravX, gravY, wallOptions, friction })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!hasStarted) return
    const container = containerRef.current
    if (!container) return

    const engine = Matter.Engine.create({
      enableSleeping: false,
      gravity: { x: gravX, y: gravY },
    })

    const bounding = container.getBoundingClientRect()
    const t = 200
    const walls = []
    if (wallOptions.top)
      walls.push(Matter.Bodies.rectangle(bounding.width / 2, -t / 2, bounding.width + 2 * t, t, { isStatic: true }))
    if (wallOptions.bottom)
      walls.push(Matter.Bodies.rectangle(bounding.width / 2, bounding.height + t / 2, bounding.width + 2 * t, t, { isStatic: true }))
    if (wallOptions.left)
      walls.push(Matter.Bodies.rectangle(-t / 2, bounding.height / 2, t, bounding.height + 2 * t, { isStatic: true }))
    if (wallOptions.right)
      walls.push(Matter.Bodies.rectangle(bounding.width + t / 2, bounding.height / 2, t, bounding.height + 2 * t, { isStatic: true }))
    Matter.Composite.add(engine.world, walls)

    let mouseConstraint = null
    const onLeave = () => mouseConstraint?.mouse?.mouseup(new Event("mouseup"))
    const mouse = Matter.Mouse.create(container)
    mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: { angularStiffness: 0, stiffness: mouseStiffness },
    })
    Matter.Composite.add(engine.world, mouseConstraint)
    const el = mouseConstraint.mouse.element
    el.removeEventListener("mousewheel", mouseConstraint.mouse.mousewheel)
    el.removeEventListener("DOMMouseScroll", mouseConstraint.mouse.mousewheel)
    container.addEventListener("mouseleave", onLeave)

    const bodyOpts = { friction: Math.max(0.1, Math.min(1, friction)) / 10, frictionAir: 0.01, restitution: 0.15 }
    const bodies = []
    for (let i = 0; i < n; i++) {
      const x = 0.1 * bounding.width + Math.random() * 0.8 * bounding.width
      const y = size * 0.5 + Math.random() * bounding.height * 0.3
      const body = shape === "circle"
        ? Matter.Bodies.circle(x, y, size / 2, bodyOpts)
        : Matter.Bodies.rectangle(x, y, size, size, bodyOpts)
      Matter.Body.setAngle(body, Math.random() * Math.PI * 2)
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.3)
      Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 3, y: 2 + Math.random() * 3 })
      bodies.push(body)
    }
    Matter.Composite.add(engine.world, bodies)

    const items = Array.from(container.querySelectorAll("[data-physics-body]"))

    const update = () => {
      rafRef.current = requestAnimationFrame(update)
      for (let i = 0; i < bodies.length; i++) {
        const el = items[i]
        if (!el) continue
        const { position, angle } = bodies[i]
        el.style.visibility = "visible"
        el.style.left = `${position.x}px`
        el.style.top = `${position.y}px`
        el.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`
      }
      Matter.Engine.update(engine)
    }
    update()

    return () => {
      cancelAnimationFrame(rafRef.current)
      container.removeEventListener("mouseleave", onLeave)
      Matter.World.clear(engine.world, false)
      Matter.Engine.clear(engine)
    }
  }, [hasStarted, depKey])

  const itemFor = (i) => {
    if (!media || media.length === 0) return null
    return media[i % media.length]
  }

  return (
    <div
      ref={containerRef}
      style={{
        ...style,
        position: "relative",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
    >
      {Array.from({ length: n }).map((_, i) => {
        const item = itemFor(i)
        const isVideo = item?.type === "video"
        return (
          <div
            key={i}
            data-physics-body=""
            style={{
              position: "absolute",
              visibility: "hidden",
              width: size,
              height: size,
              borderRadius: shape === "circle" ? "50%" : "8px",
              overflow: "hidden",
              cursor: "grab",
              boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            draggable={false}
          >
            {isVideo ? (
              <video
                src={item.src}
                autoPlay
                muted
                loop
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  pointerEvents: "none",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: item?.src ? `url(${item.src}) center/cover no-repeat` : color,
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
