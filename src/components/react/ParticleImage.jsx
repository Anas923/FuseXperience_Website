// @ts-nocheck
"use client"

import { useEffect, useRef } from "react"

function containRect(iW, iH, cW, cH) {
    const a = iW / iH,
        b = cW / cH
    return a > b
        ? {
              x: 0,
              y: Math.round((cH - cW / a) / 2),
              w: cW,
              h: Math.round(cW / a),
          }
        : {
              x: Math.round((cW - cH * a) / 2),
              y: 0,
              w: Math.round(cH * a),
              h: cH,
          }
}
function parseColor(c) {
    if (!c) return { r: 200, g: 200, b: 200, a: 255 }
    const m = c.match(
        /rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)/
    )
    if (m)
        return {
            r: +m[1] | 0,
            g: +m[2] | 0,
            b: +m[3] | 0,
            a: m[4] != null ? Math.round(+m[4] * 255) : 255,
        }
    const h = c.replace("#", "")
    if (h.length >= 6)
        return {
            r: parseInt(h.slice(0, 2), 16),
            g: parseInt(h.slice(2, 4), 16),
            b: parseInt(h.slice(4, 6), 16),
            a: h.length === 8 ? parseInt(h.slice(6, 8), 16) : 255,
        }
    return { r: 200, g: 200, b: 200, a: 255 }
}
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
}
function randomInShape(shape, bx, by, bw, bh) {
    const cx = bx + bw / 2,
        cy = by + bh / 2
    if (shape === "circle") {
        const r = bw / 2
        const a = Math.random() * Math.PI * 2
        const d = Math.sqrt(Math.random()) * r
        return [cx + Math.cos(a) * d, cy + Math.sin(a) * d]
    }
    if (shape === "oval") {
        const rx = bw / 2,
            ry = bh / 2
        const a = Math.random() * Math.PI * 2
        const d = Math.sqrt(Math.random())
        return [cx + d * rx * Math.cos(a), cy + d * ry * Math.sin(a)]
    }
    return [bx + Math.random() * bw, by + Math.random() * bh]
}

const EASE = {
    easeOut: (t) => 1 - (1 - t) * (1 - t),
    easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)),
    easeIn: (t) => t * t,
    backOut: (t) => {
        const c = 1.70158 + 1
        return 1 + c * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2
    },
    circOut: (t) => Math.sqrt(1 - (t - 1) * (t - 1)),
    linear: (t) => t,
}
function getTransitionParams(tr) {
    if (!tr) return { easeFn: EASE.easeOut, durMs: 800 }
    if (tr.type === "spring") {
        const k = tr.stiffness ?? 100,
            d = tr.damping ?? 15,
            m = tr.mass ?? 1
        const durMs = Math.min(
            3000,
            Math.max(300, (d / (2 * Math.sqrt(k * m))) * 2000)
        )
        return { easeFn: EASE.backOut, durMs }
    }
    return {
        easeFn: EASE[tr.ease] || EASE.easeOut,
        durMs: (tr.duration ?? 0.8) * 1000,
    }
}
const DAMPING = 0.65

function mkParticle(src, x, y, idleX, idleY, isExtra = false) {
    return {
        x, y, vx: 0, vy: 0, startX: x, startY: y,
        repX: 0, repY: 0, repVX: 0, repVY: 0,
        homeX: src.homeX, homeY: src.homeY, idleX, idleY,
        r: src.r, g: src.g, b: src.b, a: src.a,
        totalDist: Math.max(1, Math.sqrt((src.homeX - x) ** 2 + (src.homeY - y) ** 2)),
        isPadding: false, isExtra, inZone: false,
        roamTargetX: 0, roamTargetY: 0,
        colorIdx: Math.floor(Math.random() * 10),
        repTargetX: 0, repTargetY: 0,
    }
}

export default function ParticleImage(props) {
    const resolved = { ...COMPONENT_DEFAULTS, ...props }
    const {
        imageConfig, particleCount, particleSize, particleShape = "circle",
        particleColor = "original", singleColor = "#ffffff", multiColors = [],
        hoverEnabled = true, hoverConfig = {}, repulsionEnabled = true,
        repulsionConfig = {}, width, height, style, ...rest
    } = resolved

    const hover = hoverEnabled
    const hoverCfg = hoverConfig || {}
    const {
        hoverType = "roam", transition, roamWidth = 0, roamHeight = 0,
        roamOpacity = 0.5, roamShape = "rectangle", hideType = "scatter",
    } = hoverCfg
    const repulsion = repulsionEnabled
    const repCfg = repulsionConfig || {}
    const {
        repulsionForce = 6, repulsionRadius = 80, repulsionMode = "outside",
    } = repCfg

    const DEFAULT_IMAGE = "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/8b5ddde3-e723-4ca9-573d-4199bdb4ab00/w=800"
    const imgCfg = imageConfig || {}
    const {
        image: rawImage, mode = "fill", sizeUnit = "%",
        widthPx = 400, heightPx = 400, widthPct = 100, heightPct = 100, scale = 5,
    } = imgCfg
    const image = rawImage || DEFAULT_IMAGE

    const containerRef = useRef(null)
    const canvasRef = useRef(null)
    const mouseRef = useRef({ x: -99999, y: -99999, active: false })
    const prevMouseRef = useRef({ x: -99999, y: -99999 })
    const mouseSpeedRef = useRef(0)
    const smoothMouseRef = useRef({ x: -99999, y: -99999 })
    const physicsRef = useRef({})
    physicsRef.current = {
        hover, hoverType, transition, roamWidth, roamHeight, roamOpacity,
        roamShape, hideType, repulsion, repulsionForce, repulsionRadius,
        repulsionMode, particleSize, particleShape, particleColor, singleColor, multiColors,
    }
    const sceneRef = useRef({ particles: [] })
    const dimsRef = useRef({ W: 0, H: 0 })
    const samplingRef = useRef({})
    samplingRef.current = {
        image, mode, sizeUnit, widthPx, heightPx, widthPct, heightPct,
        scale, particleCount, hover, hoverType, roamWidth, roamHeight,
        roamShape, hideType,
    }
    const animStateRef = useRef("active")
    const animRef = useRef(null)
    const animStartTimeRef = useRef(0)
    const animTimerRef = useRef(null)
    const roamFadeStartRef = useRef(0)
    const roamFadeFromRef = useRef(1)
    const roamFadeToRef = useRef(1)

    const startAnimRef = useRef(null)
    startAnimRef.current = (newState) => {
        const { particles } = sceneRef.current
        const { W, H } = dimsRef.current
        const p = physicsRef.current
        const { durMs: _dur } = getTransitionParams(transition)
        const bw = Math.max(80, p.roamWidth || W)
        const bh = Math.max(80, p.roamHeight || H)
        const bx = (W - bw) / 2, by = (H - bh) / 2
        particles.forEach((pt) => {
            if (pt.isPadding) return
            pt.startX = pt.x
            pt.startY = pt.y
            if (newState === "scattering" && p.hoverType === "roam") {
                const [tx, ty] = randomInShape(p.roamShape, bx, by, bw, bh)
                pt.roamTargetX = tx
                pt.roamTargetY = ty
                pt.idleX = tx
                pt.idleY = ty
            }
        })
        const _rOp = p.roamOpacity ?? 0.5
        if (p.hoverType === "roam") {
            if (newState === "scattering") {
                roamFadeStartRef.current = Date.now()
                roamFadeFromRef.current = 1
                roamFadeToRef.current = _rOp
            } else if (newState === "assembling") {
                roamFadeStartRef.current = Date.now()
                roamFadeFromRef.current = _rOp
                roamFadeToRef.current = 1
            }
        }
        if (newState === "scattering" && p.hoverType === "roam") {
            clearTimeout(animTimerRef.current)
            animStateRef.current = "idle"
            return
        }
        animStartTimeRef.current = Date.now()
        animStateRef.current = newState
        clearTimeout(animTimerRef.current)
        const next = newState === "assembling" ? "active" : "idle"
        animTimerRef.current = setTimeout(() => {
            if (animStateRef.current === newState) animStateRef.current = next
        }, _dur)
    }

    const initParticles = () => {
        const s = samplingRef.current
        const { W, H } = dimsRef.current
        if (!s.image || !W || !H) return
        const canvas = canvasRef.current
        if (!canvas) return
        clearTimeout(animTimerRef.current)
        const gap = Math.max(2, Math.round(150 / Math.max(1, s.particleCount)))
        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.round(W * dpr)
        canvas.height = Math.round(H * dpr)
        mouseRef.current = { x: -99999, y: -99999, active: false }
        sceneRef.current = { particles: [] }
        const tryLoad = (cors) => {
            const img = new Image()
            if (cors) img.crossOrigin = "anonymous"
            img.onerror = () => cors && tryLoad(false)
            img.onload = () => {
                let rect
                if (s.mode === "fit") {
                    const base = containRect(
                        img.naturalWidth || img.width,
                        img.naturalHeight || img.height, W, H
                    )
                    const f = Math.max(1, Math.min(20, s.scale)) / 10
                    const w = base.w * f, h = base.h * f
                    rect = { x: (W - w) / 2, y: (H - h) / 2, w, h }
                } else if (s.sizeUnit === "px") {
                    const w = Math.min(s.widthPx, W), h = Math.min(s.heightPx, H)
                    rect = { x: (W - w) / 2, y: (H - h) / 2, w, h }
                } else {
                    const w = (W * s.widthPct) / 100, h = (H * s.heightPct) / 100
                    rect = { x: (W - w) / 2, y: (H - h) / 2, w, h }
                }
                const off = document.createElement("canvas")
                off.width = W
                off.height = H
                const oc = off.getContext("2d")
                oc.drawImage(img, rect.x, rect.y, rect.w, rect.h)
                let px
                try { px = oc.getImageData(0, 0, W, H).data } catch (_) { return }
                const src = []
                for (let y = 0; y < H; y += gap)
                    for (let x = 0; x < W; x += gap) {
                        const i = (y * W + x) * 4
                        if (px[i + 3] >= 20)
                            src.push({
                                homeX: x, homeY: y,
                                r: px[i], g: px[i + 1], b: px[i + 2], a: px[i + 3],
                            })
                    }
                shuffle(src)
                let particles = []
                const hidePos = (homeX, homeY) => {
                    const range = s.hideType === "in-place" ? 1 : 10
                    const maxD = Math.max(W, H)
                    const d = (range / 10) * 0.5 * maxD
                    const angle = Math.random() * Math.PI * 2
                    return [homeX + Math.cos(angle) * d, homeY + Math.sin(angle) * d]
                }
                if (!s.hover) {
                    animStateRef.current = "active"
                    particles = src.map((p) => mkParticle(p, p.homeX, p.homeY, p.homeX, p.homeY))
                } else if (s.hoverType === "roam") {
                    const bw = Math.max(80, s.roamWidth || W), bh = Math.max(80, s.roamHeight || H)
                    const bx = (W - bw) / 2, by = (H - bh) / 2
                    particles = src.map((p) => {
                        const [rx, ry] = randomInShape(s.roamShape, bx, by, bw, bh)
                        const pt = mkParticle(p, rx, ry, rx, ry)
                        const [tx, ty] = randomInShape(s.roamShape, bx, by, bw, bh)
                        pt.roamTargetX = tx
                        pt.roamTargetY = ty
                        pt.vx = (Math.random() - 0.5) * 1.2
                        pt.vy = (Math.random() - 0.5) * 1.2
                        return pt
                    })
                    animStateRef.current = "idle"
                } else {
                    particles = src.map((p) => {
                        const [ox, oy] = hidePos(p.homeX, p.homeY)
                        return mkParticle(p, ox, oy, ox, oy)
                    })
                    animStateRef.current = "idle"
                }
                sceneRef.current = { particles }
            }
            img.src = s.image
        }
        tryLoad(true)
    }

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver((entries) => {
            const r = entries[0]?.contentRect
            if (!r) return
            const W = Math.round(r.width), H = Math.round(r.height)
            if (!W || !H) return
            dimsRef.current = { W, H }
            initParticles()
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        initParticles()
    }, [
        image, mode, sizeUnit, widthPx, heightPx, widthPct, heightPct,
        scale, particleCount, hover, hoverType, roamWidth, roamHeight,
        roamShape, hideType,
    ])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        let idata = null, bW = 0, bH = 0
        const draw = () => {
            animRef.current = requestAnimationFrame(draw)
            const PW = canvas.width, PH = canvas.height
            if (!PW || !PH) return
            const dpr = window.devicePixelRatio || 1
            const { particles } = sceneRef.current
            if (!particles.length) return
            if (!idata || PW !== bW || PH !== bH) {
                idata = ctx.createImageData(PW, PH)
                bW = PW; bH = PH
            }
            idata.data.fill(0)
            const buf = idata.data
            const p = physicsRef.current
            const state = animStateRef.current
            const { x: rawMx, y: rawMy, active } = mouseRef.current
            const hitSpeed = mouseSpeedRef.current
            mouseSpeedRef.current *= 0.88
            const sm = smoothMouseRef.current
            if (active) {
                const lerpFactor = Math.max(0.08, 0.3 - hitSpeed * 0.006)
                if (sm.x < -9000) { sm.x = rawMx; sm.y = rawMy }
                else { sm.x += (rawMx - sm.x) * lerpFactor; sm.y += (rawMy - sm.y) * lerpFactor }
            } else {
                sm.x = -99999; sm.y = -99999
            }
            const mx = sm.x, my = sm.y
            const ps = Math.max(1, Math.ceil((p.particleSize / 4) * dpr))
            const { easeFn, durMs } = getTransitionParams(p.transition)
            const elapsed = Date.now() - animStartTimeRef.current
            const animT = easeFn(Math.min(1, elapsed / durMs))
            const { W: DW, H: DH } = dimsRef.current
            const bw = Math.max(80, p.roamWidth || DW), bh = Math.max(80, p.roamHeight || DH)
            const bx = (DW - bw) / 2, by = (DH - bh) / 2
            const half = ps / 2
            const drawParticle = (cx, cy, r, g, b, a, isCircle) => {
                const px0 = Math.round(cx) - (ps >> 1)
                const py0 = Math.round(cy) - (ps >> 1)
                for (let dy = 0; dy < ps; dy++) {
                    const iy = py0 + dy
                    if (iy < 0 || iy >= PH) continue
                    const row = iy * PW
                    for (let dx = 0; dx < ps; dx++) {
                        if (isCircle) {
                            const ddx = dx - half + 0.5, ddy = dy - half + 0.5
                            if (ddx * ddx + ddy * ddy > half * half) continue
                        }
                        const ix = px0 + dx
                        if (ix < 0 || ix >= PW) continue
                        const i = (row + ix) * 4
                        buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a
                    }
                }
            }
            const repCutoff = Math.max(1, p.repulsionRadius)
            const repCutoffSq = repCutoff * repCutoff
            let pIdx = 0
            for (const pt of particles) {
                const isCircle = p.particleShape === "circle" || (p.particleShape === "both" && pIdx % 2 === 1)
                pIdx++
                if (pt.isPadding) continue
                let baseX = pt.x, baseY = pt.y
                if (state === "assembling") {
                    baseX = pt.startX + (pt.homeX - pt.startX) * animT
                    baseY = pt.startY + (pt.homeY - pt.startY) * animT
                } else if (state === "scattering") {
                    baseX = pt.startX + (pt.idleX - pt.startX) * animT
                    baseY = pt.startY + (pt.idleY - pt.startY) * animT
                } else if (state === "active") {
                    baseX = pt.homeX; baseY = pt.homeY
                } else if (state === "idle") {
                    if (p.hoverType === "roam") {
                        const dtx = pt.roamTargetX - pt.x, dty = pt.roamTargetY - pt.y
                        if (Math.sqrt(dtx * dtx + dty * dty) < 3) {
                            const [tx, ty] = randomInShape(p.roamShape, bx, by, bw, bh)
                            pt.roamTargetX = tx; pt.roamTargetY = ty
                        }
                        pt.vx = (pt.vx || 0) * 0.98 + (pt.roamTargetX - pt.x) * 0.003
                        pt.vy = (pt.vy || 0) * 0.98 + (pt.roamTargetY - pt.y) * 0.003
                        const sp2 = Math.sqrt(pt.vx ** 2 + pt.vy ** 2)
                        if (sp2 > 1.5) { pt.vx = (pt.vx / sp2) * 1.5; pt.vy = (pt.vy / sp2) * 1.5 }
                        pt.x += pt.vx; pt.y += pt.vy
                        baseX = pt.x; baseY = pt.y
                    } else {
                        baseX = pt.idleX; baseY = pt.idleY
                    }
                }
                if (p.repulsion) {
                    if (p.repulsionMode === "random") {
                        const dx = baseX - rawMx, dy = baseY - rawMy
                        const dist = Math.sqrt(dx * dx + dy * dy)
                        if (dist < repCutoff) {
                            if (!pt.inZone) {
                                const angle = Math.random() * Math.PI * 2
                                const d = Math.random() * p.repulsionForce * 5
                                pt.repTargetX = Math.cos(angle) * d
                                pt.repTargetY = Math.sin(angle) * d
                                pt.inZone = true
                            }
                            pt.repX += (pt.repTargetX - pt.repX) * 0.15
                            pt.repY += (pt.repTargetY - pt.repY) * 0.15
                        } else { pt.inZone = false }
                    } else {
                        if (active) {
                            const dx = baseX - mx, dy = baseY - my
                            const distSq = dx * dx + dy * dy
                            if (distSq > 0 && distSq < repCutoffSq) {
                                const dist = Math.sqrt(distSq)
                                const nx = dx / dist, ny = dy / dist
                                const falloff = 1 - dist / repCutoff
                                const push = falloff * hitSpeed * p.repulsionForce * 0.05
                                pt.repX += nx * push; pt.repY += ny * push
                                const targetRepX = nx * (repCutoff - dist)
                                const targetRepY = ny * (repCutoff - dist)
                                pt.repX += (targetRepX - pt.repX) * 0.06
                                pt.repY += (targetRepY - pt.repY) * 0.06
                                pt.inZone = true
                            } else { pt.inZone = false }
                        } else { pt.inZone = false }
                    }
                } else { pt.inZone = false }
                if (!pt.inZone) { pt.repX *= 0.97; pt.repY *= 0.97 }
                pt.x = baseX + pt.repX; pt.y = baseY + pt.repY
                let dr, dg, db, da
                if (state === "active") { dr = pt.r; dg = pt.g; db = pt.b; da = pt.a }
                else if (pt.isExtra) {
                    dr = pt.r; dg = pt.g; db = pt.b
                    if (state === "assembling") da = Math.round(pt.a * animT)
                    else if (state === "scattering") da = Math.round(pt.a * (1 - animT))
                    else da = 0
                } else if (p.hoverType === "roam" && p.hover) {
                    let alphaMul
                    if (roamFadeStartRef.current === 0) { alphaMul = p.roamOpacity ?? 0.5 }
                    else {
                        const fadeElapsed = Date.now() - roamFadeStartRef.current
                        const fadeT = Math.min(1, Math.max(0, fadeElapsed / durMs))
                        alphaMul = roamFadeFromRef.current + (roamFadeToRef.current - roamFadeFromRef.current) * easeFn(fadeT)
                    }
                    dr = pt.r; dg = pt.g; db = pt.b; da = Math.round(pt.a * alphaMul)
                } else if (p.hoverType === "hide" && p.hover) {
                    let alphaMul
                    if (state === "idle") alphaMul = 0
                    else if (state === "assembling") alphaMul = animT
                    else if (state === "scattering") alphaMul = 1 - animT
                    else alphaMul = 1
                    dr = pt.r; dg = pt.g; db = pt.b; da = Math.round(pt.a * alphaMul)
                } else { dr = pt.r; dg = pt.g; db = pt.b; da = pt.a }
                if (da < 1) continue
                if (p.particleColor === "single") {
                    const sc = parseColor(p.singleColor)
                    dr = sc.r; dg = sc.g; db = sc.b
                } else if (p.particleColor === "multi") {
                    const cols = (p.multiColors || []).filter(Boolean)
                    if (cols.length > 0) {
                        const mc = parseColor(cols[pt.colorIdx % cols.length])
                        dr = mc.r; dg = mc.g; db = mc.b
                    }
                }
                drawParticle(pt.x * dpr, pt.y * dpr, dr, dg, db, da, isCircle)
            }
            ctx.putImageData(idata, 0, 0)
        }
        draw()
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
    }, [])

    const onMouseMove = (e) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const { W, H } = dimsRef.current
        const scaleX = rect.width > 0 ? W / rect.width : 1
        const scaleY = rect.height > 0 ? H / rect.height : 1
        const mx = (e.clientX - rect.left) * scaleX
        const my = (e.clientY - rect.top) * scaleY
        const prev = prevMouseRef.current
        if (prev.x > -9999) {
            const ddx = mx - prev.x, ddy = my - prev.y
            mouseSpeedRef.current = Math.sqrt(ddx * ddx + ddy * ddy)
        }
        prevMouseRef.current = { x: mx, y: my }
        mouseRef.current = { x: mx, y: my, active: true }
        if (physicsRef.current.hover) {
            const s = animStateRef.current
            if (s === "idle" || s === "scattering") startAnimRef.current("assembling")
        }
    }
    const onMouseLeave = () => {
        mouseRef.current = { x: -99999, y: -99999, active: false }
        if (physicsRef.current.hover) {
            const s = animStateRef.current
            if (s === "assembling" || s === "active") startAnimRef.current("scattering")
        }
    }

    return (
        <div
            ref={containerRef}
            {...rest}
            style={{
                position: "relative",
                width: width || "100%",
                height: height || "100%",
                overflow: "hidden",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ display: "block", width: "100%", height: "100%" }}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
            />
            {!image && (
                <div
                    style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "rgba(0,0,0,0.3)", fontSize: 13,
                        fontFamily: "monospace",
                        border: "1px dashed rgba(0,0,0,0.15)",
                        borderRadius: 4, background: "rgba(0,0,0,0.04)",
                        pointerEvents: "none",
                    }}
                >
                    Upload image in panel →
                </div>
            )}
        </div>
    )
}

const COMPONENT_DEFAULTS = {
    imageConfig: {
        image: "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/8b5ddde3-e723-4ca9-573d-4199bdb4ab00/w=800",
        mode: "fit",
        sizeUnit: "%",
        widthPx: 400, heightPx: 400,
        widthPct: 100, heightPct: 100,
        scale: 5,
    },
    particleShape: "circle",
    particleColor: "original",
    singleColor: "#ffffff",
    multiColors: ["#ffffff", "#aaaaaa", "#555555"],
    particleCount: 20,
    particleSize: 5,
    hoverEnabled: true,
    hoverConfig: {
        hoverType: "roam",
        transition: { duration: 0.8, ease: "easeInOut" },
        roamWidth: 0, roamHeight: 0,
        roamShape: "rectangle",
        roamOpacity: 0.5,
        hideType: "scatter",
    },
    repulsionEnabled: true,
    repulsionConfig: {
        repulsionMode: "outside",
        repulsionForce: 10,
        repulsionRadius: 50,
    },
}
