import { useEffect, useRef, useState } from "react"

const TWO_PI = Math.PI * 2

var FADE_DURATION = 5

var PEOPLES_IMAGES = Array.from({ length: 20 }, function (_, i) {
  var id = 100 + i
  return { src: "https://i.pravatar.cc/400?img=" + id }
})

var STOCK_IMAGES = [
  "https://images.pexels.com/photos/19379640/pexels-photo-19379640.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/8498412/pexels-photo-8498412.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/20595361/pexels-photo-20595361.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/3316263/pexels-photo-3316263.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/12775213/pexels-photo-12775213.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/7562179/pexels-photo-7562179.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/28365665/pexels-photo-28365665.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/17368407/pexels-photo-17368407.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/5889717/pexels-photo-5889717.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/20000981/pexels-photo-20000981.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/7561905/pexels-photo-7561905.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/36440746/pexels-photo-36440746.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/2362887/pexels-photo-2362887.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/33170460/pexels-photo-33170460.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/17300044/pexels-photo-17300044.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/17332621/pexels-photo-17332621.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/18039499/pexels-photo-18039499.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/5433146/pexels-photo-5433146.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/20286004/pexels-photo-20286004.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/5980902/pexels-photo-5980902.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/26707134/pexels-photo-26707134.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/4355346/pexels-photo-4355346.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/5325630/pexels-photo-5325630.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  "https://images.pexels.com/photos/24293774/pexels-photo-24293774.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
]

var DEFAULT_IMAGES = STOCK_IMAGES.map(function (url) { return { src: url } })

export default function SpiralImages(props) {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const checkSize = () => {
      const w = window.innerWidth
      setIsMobile(w <= 768)
      setIsTablet(w > 768 && w <= 1024)
    }
    checkSize()
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  }, [])

  const {
    images = DEFAULT_IMAGES,
    turns = isMobile ? 2.5 : isTablet ? 3 : 3.5,
    speed = isMobile ? 1.5 : 2,
    spacing = isMobile ? 8 : isTablet ? 6 : 5,
    spread = isMobile ? 4 : isTablet ? 5 : 6,
    sizeAttenuation = isMobile ? 1.5 : 2,
    imageSize = isMobile ? 120 : isTablet ? 160 : 200,
    fadeIn = 20,
    fadeOut = 0,
    cornerRadius = 5,
    fadeDuration = FADE_DURATION,
    style = {},
  } = props

  var [opacity, setOpacity] = useState(0)

  useEffect(function () {
    var start = performance.now()
    var frame
    function tick(now) {
      var elapsed = (now - start) / 1000
      var p = Math.min(1, elapsed / fadeDuration)
      setOpacity(p)
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return function () { cancelAnimationFrame(frame) }
  }, [fadeDuration])

  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const rafRef = useRef(0)
  const progressRef = useRef(0)
  const lastRef = useRef(0)
  const imgsRef = useRef([])

  const items = images.length > 0 ? images : DEFAULT_IMAGES

  const srcKey = items.map((im) => im?.src || "").join("|")
  useEffect(() => {
    imgsRef.current = items.map((im) => {
      if (!im?.src) return null
      const el = new Image()
      el.crossOrigin = "anonymous"
      el.src = im.src
      return el
    })
  }, [srcKey])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1)
    let w = 0
    let h = 0

    const resize = () => {
      w = container.clientWidth || 600
      h = container.clientHeight || 600
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = w + "px"
      canvas.style.height = h + "px"
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    const spiral = (n, R) => {
      const ang = n * turns * TWO_PI
      const rad = R * (1 - n)
      return { x: rad * Math.cos(ang), y: -rad * Math.sin(ang) }
    }

    const M = 2000
    const cum = new Float32Array(M + 1)
    let prev = spiral(0, 1)
    for (let k = 1; k <= M; k++) {
      const pt = spiral(k / M, 1)
      const dx = pt.x - prev.x
      const dy = pt.y - prev.y
      cum[k] = cum[k - 1] + Math.sqrt(dx * dx + dy * dy)
      prev = pt
    }
    const total = cum[M] || 1
    const K = 1024
    const nForArc = new Float32Array(K + 1)
    let j = 0
    for (let a = 0; a <= K; a++) {
      const target = (a / K) * total
      while (j < M && cum[j + 1] < target) j++
      const seg = cum[j + 1] - cum[j]
      const f2 = seg > 0 ? (target - cum[j]) / seg : 0
      nForArc[a] = (j + f2) / M
    }
    const arcToN = (s) => {
      const x = Math.max(0, Math.min(K, s * K))
      const i = Math.floor(x)
      const a = nForArc[i]
      const b = nForArc[Math.min(i + 1, K)]
      return a + (b - a) * (x - i)
    }

    const roundRect = (c, x, y, rw, rh, r) => {
      const rr = Math.min(r, rw / 2, rh / 2)
      c.beginPath()
      c.moveTo(x + rr, y)
      c.arcTo(x + rw, y, x + rw, y + rh, rr)
      c.arcTo(x + rw, y + rh, x, y + rh, rr)
      c.arcTo(x, y + rh, x, y, rr)
      c.arcTo(x, y, x + rw, y, rr)
      c.closePath()
    }

    const draw = (now) => {
      const dt = lastRef.current ? (now - lastRef.current) / 1000 : 0
      lastRef.current = now
      const f = Math.min(dt, 0.1)

      progressRef.current = (progressRef.current + speed * f) % 100
      const L = progressRef.current

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const cx = w / 2
      const cy = h / 2
      const R = 0.48 * Math.min(w, h) * (1 + (spread - 1) * 0.18)
      const els = imgsRef.current
      const nImgs = els.length || 1

      const stepFrac = Math.max(0.005, (spacing * 0.5) / 100)
      const slots = Math.min(400, Math.ceil(1 / stepFrac) + 2)
      const base = L / 100

      const cards = []
      for (let i = 0; i < slots; i++) {
        const s = (((base + i * stepFrac) % 1) + 1) % 1
        const n = arcToN(s)
        cards.push({ tt: s * 100, n, img: i % nImgs })
      }
      cards.sort((a, b) => a.n - b.n)

      for (let k = 0; k < cards.length; k++) {
        const { tt, n, img: imgIdx } = cards[k]
        const p = spiral(n, R)
        const dist = Math.sqrt(p.x * p.x + p.y * p.y)

        let opacity = 1
        if (tt < fadeIn) opacity = tt / fadeIn
        else if (tt > 100 - fadeOut) opacity = (100 - tt) / fadeOut
        if (opacity < 0.01) continue

        const scale = sizeAttenuation > 0 ? Math.pow(Math.min(dist / R, 1), sizeAttenuation * 0.5) : 1

        const p2 = spiral(Math.min(n + 0.001, 1), R)
        const angle = Math.atan2(p2.y - p.y, p2.x - p.x)

        const el = els[imgIdx]
        const ready = el && el.complete && el.naturalWidth > 0
        const aspect = ready ? el.naturalWidth / el.naturalHeight : 1
        let cw = imageSize * scale
        let ch = cw / aspect
        if (aspect < 1) {
          ch = imageSize * scale
          cw = ch * aspect
        }

        const x = cx + p.x
        const y = cy + p.y
        const rad = (cornerRadius / 20) * (Math.min(cw, ch) / 2)

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        ctx.globalAlpha = opacity
        roundRect(ctx, -cw / 2, -ch / 2, cw, ch, rad)
        ctx.clip()
        if (ready) {
          ctx.drawImage(el, -cw / 2, -ch / 2, cw, ch)
        } else {
          ctx.fillStyle = "hsl(" + (imgIdx * 360) / nImgs + ", 65%, 55%)"
          ctx.fillRect(-cw / 2, -ch / 2, cw, ch)
        }
        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    lastRef.current = 0
    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [srcKey, turns, speed, spacing, spread, sizeAttenuation, imageSize, fadeIn, fadeOut, cornerRadius])

  return (
    <div ref={containerRef} style={{ ...style, width: "100%", height: "100%", overflow: "hidden", position: "relative", opacity: opacity, transition: "opacity 0.1s linear" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  )
}

SpiralImages.displayName = "Spiral Images"