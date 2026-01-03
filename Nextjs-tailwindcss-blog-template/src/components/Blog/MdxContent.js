import * as runtime from 'react/jsx-runtime'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { slug as slugify } from 'github-slugger'
import CodeBlock from './CodeBlock'

const sharedComponents = {
  Image
}

const isLikelyCompiled = (code) => {
  // Heuristics: treat content as compiled JS only if it contains explicit compiled markers
  // and *doesn't* look like plain Markdown (headings, fenced code, lists, blockquotes)
  if (!code || typeof code !== 'string') return false;
  const looksLikeMarkdown = /^\s*#{1,6}\s+/m.test(code) || /```/.test(code) || /^\s*[-*+]\s+/m.test(code) || /^\s*>\s+/m.test(code);
  if (looksLikeMarkdown) return false;
  return /\bexport\s+default\b/.test(code) || /React\.createElement/.test(code) || /function\s+MDXContent\b/.test(code) || /var\s+MDXContent\b/.test(code);
}

const useMDXComponent = (code) => {
  // If the code looks like raw MDX/Markdown, return a component that renders it with react-markdown
  if (!isLikelyCompiled(code)) {
    return function RawMDXRenderer({ components: incoming = {}, ...props }) {
      // custom heading renderer to add ids and anchor links
      const heading = (level) => ({node, children, ...rest}) => {
        const text = Array.isArray(children) ? children.map(String).join('') : String(children || '')
        const id = slugify(text).toLowerCase()
        const Tag = `h${level}`
        const handleAnchorClick = (e) => {
          e.preventDefault()
          const el = document.getElementById(id)
          if (!el) return
          const top = el.getBoundingClientRect().top + window.scrollY
          const offset = 80
          window.scrollTo({ top: top - offset, behavior: 'smooth' })
        }
        return (
          <Tag id={id} className="scroll-mt-20" {...rest}>
            {children}
            <a href={`#${id}`} onClick={handleAnchorClick} className="ml-2 text-sm opacity-60">#</a>
          </Tag>
        )
      }

      const local = {
        h1: heading(1),
        h2: heading(2),
        h3: heading(3),
        img: ({src, alt, ...rest}) => <Image src={src} alt={alt || ''} width={1200} height={630} {...rest} />,
        code: CodeBlock,
      }

      const components = { ...local, ...sharedComponents, ...incoming }

      return (
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {code}
        </ReactMarkdown>
      );
    };
  }

  try {
    const fn = new Function(code);
    const exports = fn({ ...runtime });
    if (!exports || !exports.default) throw new Error('MDX did not export a default component');
    return exports.default;
  } catch (err) {
    // Avoid noisy red console errors for syntax issues in raw MDX — warn instead and fallback to Markdown rendering
    console.warn('MDX compile/runtime warning:', err && err.message ? err.message : err);
    return function MDXFallbackRenderer(props) {
      return (
        <div className="p-3 bg-yellow-50 text-yellow-800 rounded">
          <div className="font-semibold">MDX render fallback</div>
          <div className="text-xs mt-1 text-gray-700">Falling back to Markdown rendering due to: {String(err && err.message ? err.message : err)}</div>
          <div className="mt-3">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{code}</ReactMarkdown>
          </div>
        </div>
      );
    };
  }
}

 const MDXContent = ({ code, components, ...props }) => {
  const Component = useMDXComponent(code)
  return <Component components={{ ...sharedComponents, ...components }} {...props} />
}

export default MDXContent