'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollEffects() {
  const pathname = usePathname()

  useEffect(() => {
    // Dismiss any page-intro overlay (CSS animation is 1s, dismiss after it completes)
    const intro = document.querySelector<HTMLElement>('.page-intro')
    if (intro) {
      const t = setTimeout(() => intro.classList.add('done'), 1100)
      return () => clearTimeout(t)
    }
  }, [pathname])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Back to top
    const toTop = document.getElementById('backToTop')
    const onScroll = () => { if (toTop) toTop.classList.toggle('show', window.scrollY > 700) }
    if (toTop) {
      window.addEventListener('scroll', onScroll, { passive: true })
      toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }))
    }

    // Reveal on scroll — double RAF so layout is fully settled after hydration
    let io: IntersectionObserver | null = null
    let fallback: ReturnType<typeof setTimeout>

    const setupReveal = () => {
      const revealEls = document.querySelectorAll<Element>('.reveal, .reveal--left, .reveal--right, .reveal--scale, .reveal--blur, .stagger')
      if (!revealEls.length) return

      if ('IntersectionObserver' in window && !reduce) {
        io = new IntersectionObserver((entries) => {
          entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io!.unobserve(e.target) } })
        }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' })

        revealEls.forEach(el => {
          const r = el.getBoundingClientRect()
          if (r.top < window.innerHeight && r.bottom > 0) {
            el.classList.add('in')
          } else {
            io!.observe(el)
          }
        })

        // Fallback: catch any missed in-viewport elements after 500ms
        fallback = setTimeout(() => {
          revealEls.forEach(el => {
            if (!el.classList.contains('in')) {
              const r = el.getBoundingClientRect()
              if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in')
            }
          })
        }, 500)
      } else {
        revealEls.forEach(el => el.classList.add('in'))
      }
    }

    const raf = requestAnimationFrame(() => requestAnimationFrame(setupReveal))

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(fallback)
      io?.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [pathname])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Hero headline word reveal
    document.querySelectorAll<HTMLElement>('.reveal-words').forEach(el => {
      if (reduce) { el.classList.add('in'); return }
      const html = el.innerHTML
      const parts = html.split(/(<br\s*\/?>)/i)
      el.innerHTML = parts.map(p => {
        if (/<br/i.test(p)) return p
        return p.split(/\s+/).filter(Boolean).map(w =>
          `<span class="wl"><span class="w">${w}</span></span>`
        ).join(' ')
      }).join('')
      const words = el.querySelectorAll<HTMLElement>('.w')
      words.forEach((w, i) => { w.style.transitionDelay = `${(0.35 + i * 0.08)}s` })
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')))
    })

    // Count-up
    const nums = document.querySelectorAll<HTMLElement>('[data-count]')
    if ('IntersectionObserver' in window && nums.length) {
      const io2 = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return
          const el = e.target as HTMLElement
          io2.unobserve(el)
          const target = parseFloat(el.dataset.count || '0')
          const suffix = el.dataset.suffix || ''
          if (reduce) { el.textContent = target.toLocaleString('en-US') + suffix; return }
          const dur = 1600
          let start: number | null = null
          const step = (ts: number) => {
            if (!start) start = ts
            const p = Math.min((ts - start) / dur, 1)
            const eased = 1 - Math.pow(1 - p, 3)
            el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix
            if (p < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        })
      }, { threshold: 0.5 })
      nums.forEach(el => io2.observe(el))
    }

    // Parallax
    const parallaxEls = document.querySelectorAll<HTMLElement>('.parallax')
    if (parallaxEls.length && !reduce) {
      let ticking = false
      const runParallax = () => {
        parallaxEls.forEach(el => {
          const r = el.getBoundingClientRect()
          const speed = parseFloat(el.dataset.speed || '0.12')
          const offset = (r.top + r.height / 2 - window.innerHeight / 2) * -speed
          el.style.transform = `translateY(${offset.toFixed(1)}px)`
        })
        ticking = false
      }
      const scrollHandler = () => { if (!ticking) { requestAnimationFrame(runParallax); ticking = true } }
      window.addEventListener('scroll', scrollHandler, { passive: true })
      runParallax()
      return () => window.removeEventListener('scroll', scrollHandler)
    }

    // Tilt + magnetic (fine pointer only)
    if (window.matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce) {
      document.querySelectorAll<HTMLElement>('.tilt').forEach(card => {
        const inner = (card.querySelector('.tilt-inner') || card) as HTMLElement
        card.addEventListener('mousemove', (e: MouseEvent) => {
          const r = card.getBoundingClientRect()
          const px = (e.clientX - r.left) / r.width - 0.5
          const py = (e.clientY - r.top) / r.height - 0.5
          inner.style.transform = `perspective(900px) rotateY(${(px * 7).toFixed(2)}deg) rotateX(${(-py * 7).toFixed(2)}deg)`
        })
        card.addEventListener('mouseleave', () => { inner.style.transform = '' })
      })
      document.querySelectorAll<HTMLElement>('.mag, .btn--lg').forEach(btn => {
        btn.addEventListener('mousemove', (e: MouseEvent) => {
          const r = btn.getBoundingClientRect()
          const mx = (e.clientX - r.left - r.width / 2) * 0.25
          const my = (e.clientY - r.top - r.height / 2) * 0.35
          btn.style.transform = `translate(${mx.toFixed(1)}px,${my.toFixed(1)}px)`
        })
        btn.addEventListener('mouseleave', () => { btn.style.transform = '' })
      })
    }

    // Button ripple
    document.querySelectorAll<HTMLElement>('.btn').forEach(btn => {
      btn.addEventListener('click', (e: MouseEvent) => {
        if (reduce) return
        const r = btn.getBoundingClientRect()
        const span = document.createElement('span')
        span.className = 'ripple'
        span.style.left = `${e.clientX - r.left}px`
        span.style.top = `${e.clientY - r.top}px`
        span.style.width = span.style.height = `${Math.max(r.width, r.height) / 9}px`
        btn.appendChild(span)
        setTimeout(() => span.remove(), 650)
      })
    })

    // Demo forms
    document.querySelectorAll<HTMLFormElement>('form[data-demo]').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault()
        const btn = form.querySelector<HTMLButtonElement>('[type="submit"]')
        const original = btn ? btn.innerHTML : ''
        if (btn) { btn.innerHTML = "Thank you, we'll be in touch ✓"; btn.disabled = true }
        form.reset()
        setTimeout(() => { if (btn) { btn.innerHTML = original; btn.disabled = false } }, 3400)
      })
    })
  }, [pathname])

  return null
}
