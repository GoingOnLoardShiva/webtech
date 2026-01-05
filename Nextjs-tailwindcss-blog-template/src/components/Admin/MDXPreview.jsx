'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { slug as slugify } from 'github-slugger'
import CodeBlock from '@/src/components/Blog/CodeBlock'

export default function MDXPreview({ value }) {
  // use the same slug helper as generateTOC
  const getSlug = (text) => String(text || '') ? slugify(String(text || '')).toLowerCase() : ''

  // recursively extract text from React children/nodes
  const getText = (node) => {
    if (node == null) return ''
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(getText).join('')
    if (node && node.props && node.props.children) return getText(node.props.children)
    return ''
  }

  const heading = (level) => ({node, children, ...rest}) => {
    const text = getText(children)
    const id = getSlug(text)
    const Tag = `h${level}`
    return (
      <Tag id={id} className="scroll-mt-20" {...rest}>
        {children}
        <a href={`#${id}`} className="ml-2 text-sm opacity-60">#</a>
      </Tag>
    )
  }

  const components = {
    h1: heading(1),
    h2: heading(2),
    h3: heading(3),
    h4: heading(4),
    code: CodeBlock,
    // use a simple <img> for admin preview to avoid next/image constraints
    img: ({src, alt, ...rest}) => <img src={src} alt={alt || ''} {...rest} className="max-w-full rounded" />,
  }

  return (
    <div className="prose max-w-none   rounded bg-white">
      <ReactMarkdown components={components}>{value || ''}</ReactMarkdown>
    </div>
  );
}
