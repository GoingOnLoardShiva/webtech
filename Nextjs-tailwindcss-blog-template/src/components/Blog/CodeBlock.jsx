"use client"
import React, { useState } from 'react'

export default function CodeBlock({ inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false)
  if (inline) return <code className={className} {...props}>{children}</code>
  const match = /language-(\w+)/.exec(className || '')
  const lang = match ? match[1] : ''

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(children))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Copy failed', e)
    }
  }

  return (
    <div className="relative my-4 border rounded overflow-hidden">
      <div className="flex items-center justify-between bg-gray-800 text-gray-200 px-3 py-1 text-xs">
        <div className="font-mono">{lang || 'code'}</div>
        <button onClick={copy} className="bg-black/30 text-gray-100 px-2 py-0.5 rounded text-xs">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-auto bg-gray-900 text-white p-4"><code className={className}>{children}</code></pre>
    </div>
  )
}
