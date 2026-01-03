'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { slug as slugify } from 'github-slugger'
import CodeBlock from '@/src/components/Blog/CodeBlock'
import Image from 'next/image'

export default function MDXPreview({ value }) {
  const heading = (level) => ({node, children, ...rest}) => {
    const text = Array.isArray(children) ? children.map(String).join('') : String(children || '')
    const id = slugify(text).toLowerCase()
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
    img: ({src, alt, ...rest}) => <Image src={src} alt={alt || ''} width={1200} height={630} {...rest} />,
  }

  return (
    <div className="prose max-w-none p-4 border rounded bg-white">
      <ReactMarkdown components={components}>{value || ''}</ReactMarkdown>
    </div>
  );
}
