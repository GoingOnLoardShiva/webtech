"use client"
import React, { useEffect, useRef, useState } from 'react'
import MDXPreview from './MDXPreview'
import { generateTOC } from '@/src/utils/markdown'

export default function MDXEditor({ value = '', onChange }) {
  const [content, setContent] = useState(value || '')
  const [toc, setToc] = useState([])
  const [counts, setCounts] = useState({ total: 0 })
  const taRef = useRef(null)

  useEffect(() => {
    setContent(value || '')
  }, [value])

  useEffect(() => {
    const { toc: t, counts: c } = generateTOC(content || '')
    setToc(t)
    setCounts(c)
    onChange && onChange(content)
  }, [content, onChange])

  const insertHeading = (level) => {
    const ta = taRef.current
    if (!ta) return
    const before = content.slice(0, ta.selectionStart)
    const after = content.slice(ta.selectionEnd)
    const title = `New heading ${Math.floor(Math.random()*1000)}`
    const heading = `\n${'#'.repeat(level)} ${title}\n\n`
    const newVal = before + heading + after
    setContent(newVal)
    // reposition cursor after inserted heading
    requestAnimationFrame(() => {
      const pos = before.length + heading.length
      ta.focus()
      ta.setSelectionRange(pos, pos)
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="col-span-1 lg:col-span-2">
        <div className="flex items-center gap-2 mb-2">
          <button type="button" className="px-3 py-1 bg-gray-100 rounded" onClick={() => insertHeading(2)}>Insert H2</button>
          <button type="button" className="px-3 py-1 bg-gray-100 rounded" onClick={() => insertHeading(3)}>Insert H3</button>
          <div className="text-sm text-gray-600 ml-auto">{counts.total} headings</div>
        </div>
        <textarea
          ref={taRef}
          rows={16}
          className="w-full border rounded p-3 font-mono"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Preview</div>
          <MDXPreview value={content} />
        </div>
      </div>

      <aside className="col-span-1 p-4 border rounded bg-gray-50">
        <div className="text-sm font-semibold mb-2">Content Summary</div>
        <div className="text-sm text-gray-600 mb-3">Total headings: <strong className="text-gray-900">{counts.total}</strong></div>
        <div className="text-xs text-gray-700 mb-3">H2: {counts.h2 || 0} · H3: {counts.h3 || 0}</div>

        <div className="text-sm font-medium mb-2">Table of Headings</div>
        <ul className="text-sm space-y-1">
          {toc.length === 0 && <li className="text-gray-500">No headings found</li>}
          {toc.map((it) => (
            <li key={it.url}>
              <div className="font-medium">{it.title}</div>
              {it.items && it.items.length > 0 && (
                <ul className="ml-3 text-sm text-gray-700 mt-1">
                  {it.items.map((sub) => <li key={sub.url}>• {sub.title}</li>)}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
