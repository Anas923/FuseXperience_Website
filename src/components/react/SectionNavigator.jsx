"use client"

import { useEffect, useRef, useState } from "react"

const SECTIONS = [
  { id: "hero", label: "Hero" },
  { id: "social-proof", label: "Social Proof" },
  { id: "funnel", label: "Funnel" },
  { id: "capture", label: "Capture" },
  { id: "post-purchase", label: "Post-Purchase" },
  { id: "kinetic", label: "Kinetic" },
  { id: "demo", label: "Demo" },
  { id: "footer", label: "Footer" },
]

export default function SectionNavigator() {
  const [activeIndex, setActiveIndex] = useState(0)
  const lenisRef = useRef(null)

  useEffect(() => {
    const findLenis = () => {
      if (window.__lenis) {
        lenisRef.current = window.__lenis
      } else {
        const lenisEl = document.querySelector("[data-lenis]")
        if (lenisEl && lenisEl.__lenis) {
          lenisRef.current = lenisEl.__lenis
        }
      }
    }
    findLenis()
    const retry = setTimeout(findLenis, 500)
    return () => clearTimeout(retry)
  }, [])

  useEffect(() => {
    const getScrollY = () => {
      if (lenisRef.current) {
        return lenisRef.current.animatedScroll || lenisRef.current.scroll || 0
      }
      return window.scrollY
    }

    const handleScroll = () => {
      const scrollY = getScrollY()
      const viewportCenter = scrollY + window.innerHeight * 0.5

      let newIndex = 0
      SECTIONS.forEach((section, i) => {
        const el = document.getElementById(section.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          const top = rect.top + scrollY
          const bottom = top + rect.height
          if (viewportCenter >= top && viewportCenter < bottom) {
            newIndex = i
          }
        }
      })
      setActiveIndex(newIndex)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    if (lenisRef.current && lenisRef.current.on) {
      lenisRef.current.on("scroll", handleScroll)
    }
    handleScroll()
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (lenisRef.current && lenisRef.current.off) {
        lenisRef.current.off("scroll", handleScroll)
      }
    }
  }, [])

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el && lenisRef.current) {
      lenisRef.current.scrollTo(el, { offset: 0, immediate: false })
    } else if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <nav
      className="section-nav is-visible"
      role="navigation"
      aria-label="Section navigator"
    >
      <div className="section-nav__pill">
        {SECTIONS.map((section, i) => (
          <button
            key={section.id}
            className={`section-nav__dot ${i === activeIndex ? "is-active" : ""}`}
            onClick={() => scrollToSection(section.id)}
            aria-label={section.label}
            aria-current={i === activeIndex ? "true" : "false"}
            title={section.label}
          >
            <span className="section-nav__indicator" />
          </button>
        ))}
      </div>
    </nav>
  )
}