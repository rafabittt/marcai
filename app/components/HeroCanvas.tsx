'use client'

import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  baseOpacity: number
}

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const COLOR = '37, 211, 102' // #25D366 in RGB
    const PARTICLE_COUNT = 80
    const CONNECTION_DIST = 100
    const REPEL_RADIUS = 120
    const REPEL_STRENGTH = 3

    let mouse = { x: -9999, y: -9999 }
    let particles: Particle[] = []
    let animId: number
    let width = 0
    let height = 0

    function resize() {
      width = canvas!.offsetWidth
      height = canvas!.offsetHeight
      canvas!.width = width
      canvas!.height = height
    }

    function spawn(): Particle {
      const baseOpacity = 0.15 + Math.random() * 0.45
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: 1.5 + Math.random() * 2,
        opacity: baseOpacity,
        baseOpacity,
      }
    }

    function init() {
      resize()
      particles = Array.from({ length: PARTICLE_COUNT }, spawn)
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height)
      ctx!.fillStyle = '#ffffff'
      ctx!.fillRect(0, 0, width, height)

      // Update + draw particles
      for (const p of particles) {
        // Mouse repulsion
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < REPEL_RADIUS && dist > 0) {
          const force = (REPEL_RADIUS - dist) / REPEL_RADIUS
          p.vx += (dx / dist) * force * 0.4
          p.vy += (dy / dist) * force * 0.4
          p.opacity = Math.min(1, p.baseOpacity + force * REPEL_STRENGTH * 0.25)
        } else {
          p.opacity += (p.baseOpacity - p.opacity) * 0.05
        }

        // Speed cap
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > 2.5) {
          p.vx = (p.vx / speed) * 2.5
          p.vy = (p.vy / speed) * 2.5
        }

        // Dampen
        p.vx *= 0.98
        p.vy *= 0.98

        p.x += p.vx
        p.y += p.vy

        // Wrap edges
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        // Draw dot
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${COLOR}, ${p.opacity})`
        ctx!.fill()
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.3
            ctx!.beginPath()
            ctx!.moveTo(a.x, a.y)
            ctx!.lineTo(b.x, b.y)
            ctx!.strokeStyle = `rgba(${COLOR}, ${alpha})`
            ctx!.lineWidth = 1
            ctx!.stroke()
          }
        }
      }

      animId = requestAnimationFrame(draw)
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect()
      mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function onMouseLeave() {
      mouse = { x: -9999, y: -9999 }
    }

    function onResize() {
      resize()
      // Re-clamp particles that are now out of bounds
      for (const p of particles) {
        p.x = Math.min(p.x, width)
        p.y = Math.min(p.y, height)
      }
    }

    init()
    draw()

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  )
}
