import { slug as slugify } from 'github-slugger'

// Parse markdown and generate TOC for heading levels (default h2 and h3)
// Improvements:
// - Ignore fenced code blocks so headings inside code don't count
// - Support ATX (#) and Setext (underlined) headings and simple HTML <hN> headings
// - Produce counts for h1..h6 and total
export function generateTOC(md = '', levels = [2, 3]) {
  const counts = { total: 0 };
  // init counts for all heading levels
  for (let i = 1; i <= 6; i++) counts[`h${i}`] = 0;

  // normalize input
  const text = typeof md === 'string' ? md : String(md || '');

  // helper to sanitize heading titles
  const sanitize = (s) =>
    String(s || '')
      .replace(/`+/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\*{1,2}/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();

  // remove fenced code blocks (```)
  const noFenced = text.replace(/```[\s\S]*?```/g, '\n');

  const lines = noFenced.split(/\r?\n/);
  const headings = [];
  let pos = 0; // char position tracker

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const atx = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (atx) {
      const level = atx[1].length;
      let title = atx[2].trim();
      // sanitize title: remove inline code, links, emphasis and HTML tags
      title = title.replace(/`+/g, '')
                   .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
                   .replace(/\*{1,2}/g, '')
                   .replace(/<[^>]+>/g, '')
                   .trim();
      const url = `#${slugify(title).toLowerCase()}`;
      headings.push({ level, title, url, pos });
    } else {
      // setext heading detection (line followed by === or ---)
      const next = lines[i + 1];
      if (next && /^\s*=+\s*$/.test(next)) {
        const title = sanitize(line);
        const level = 1;
        const url = `#${slugify(title).toLowerCase()}`;
        headings.push({ level, title, url, pos });
        i++; // skip underline
        pos += line.length + 1;
      } else if (next && /^\s*-+\s*$/.test(next)) {
        const title = sanitize(line);
        const level = 2;
        const url = `#${slugify(title).toLowerCase()}`;
        headings.push({ level, title, url, pos });
        i++; // skip underline
        pos += line.length + 1;
      } else {
        // simple HTML <hN> on a single line
        const html = line.match(/<h([1-6])[^>]*>(.*?)<\/h\1>/i);
        if (html) {
          const level = parseInt(html[1], 10);
          // strip tags from innerHTML-ish content and sanitize
          const inner = sanitize(html[2]);
          const url = `#${slugify(inner).toLowerCase()}`;
          headings.push({ level, title: inner, url, pos });
        }
      }
    }
    pos += line.length + 1; // +1 for newline
  }

  // Build counts
  headings.forEach((h) => {
    counts.total += 1;
    if (counts[`h${h.level}`] !== undefined) counts[`h${h.level}`] += 1;
  });

  // Build nested TOC using the smallest level in `levels` as top-level
  const minLevel = Math.min(...levels);
  const toc = [];
  let lastTop = null;
  headings.forEach((h) => {
    if (h.level === minLevel) {
      const item = { url: h.url, title: h.title, items: [] };
      toc.push(item);
      lastTop = item;
    } else if (h.level > minLevel) {
      const item = { url: h.url, title: h.title };
      if (!lastTop) {
        toc.push(item);
      } else {
        lastTop.items = lastTop.items || [];
        lastTop.items.push(item);
      }
    } else {
      // a higher-level heading (e.g., h1 when minLevel is 2) becomes a top-level item
      const item = { url: h.url, title: h.title, items: [] };
      toc.push(item);
      lastTop = item;
    }
  });

  return { toc, counts };
}
