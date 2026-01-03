"use client"
import React, { useEffect, useState } from 'react'

export default function TOCClient({ toc = [], counts = {} }) {
  const [active, setActive] = useState(null)
  const [localToc, setLocalToc] = useState(toc || [])
  const [localCounts, setLocalCounts] = useState(counts || {})

  useEffect(() => {
    // If a toc was provided, use it; otherwise build from DOM (supports headings rendered by MDX components)
    if (toc && toc.length > 0) {
      setLocalToc(toc)
      setLocalCounts(counts)
    } else {
      const nodes = Array.from(document.querySelectorAll('article h1[id], article h2[id], article h3[id], article h4[id], article h5[id], article h6[id]'))
      if (!nodes.length) return

      const generated = []
      const cnt = { total: 0 }
      nodes.forEach((n) => {
        const level = Number(n.tagName.replace('H', ''))
        const title = n.textContent.replace(/^#\s*/, '').trim()
        const url = `#${n.id}`
        cnt.total += 1
        cnt[`h${level}`] = (cnt[`h${level}`] || 0) + 1

        if (level === 2) {
          const item = { url, title, items: [] }
          generated.push(item)
        } else if (level > 2) {
          const last = generated[generated.length - 1]
          if (last) {
            last.items = last.items || []
            last.items.push({ url, title })
          } else {
            generated.push({ url, title })
          }
        } else if (level === 1) {
          // make h1 a top-level item
          generated.push({ url, title, items: [] })
        } else {
          // fallback
          generated.push({ url, title })
        }
      })
      setLocalToc(generated)
      setLocalCounts(cnt)
    }
  }, [toc, counts])

  useEffect(() => {
    const headings = Array.from(document.querySelectorAll('article h1[id], article h2[id], article h3[id], article h4[id]'))
    if (!headings.length) return

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id)
      })
    }, { root: null, rootMargin: '-40% 0px -40% 0px', threshold: [0, 0.25, 0.5, 1] })

    headings.forEach((h) => obs.observe(h))
    return () => obs.disconnect()
  }, [localToc])

  const scrollToId = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const headerOffset = 80
    window.scrollTo({ top: top - headerOffset, behavior: 'smooth' })
  }

  return (
    <div>
      <div className="text-sm text-gray-600">Headings: {localCounts.total || 0} (H2: {localCounts.h2 || 0}, H3: {localCounts.h3 || 0})</div>
      <ul className="mt-4 font-in text-base">
        {localToc.map((item) => (
          <li key={item.url} className={`py-1 ${active === item.url.slice(1) ? 'bg-blue-50 rounded' : ''}`}>
            <button className="text-left w-full" onClick={() => scrollToId(item.url.slice(1))}>{item.title}</button>
            {item.items && item.items.length > 0 && (
              <ul className="mt-1 ml-4">
                {item.items.map((sub) => (
                  <li key={sub.url} className={`py-1 ${active === sub.url.slice(1) ? 'text-blue-600' : ''}`}>
                    <button className="text-left w-full" onClick={() => scrollToId(sub.url.slice(1))}>• {sub.title}</button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
