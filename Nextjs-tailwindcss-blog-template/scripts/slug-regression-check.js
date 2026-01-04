const { generateTOC } = require('../src/utils/markdown')
const GithubSlugger = require('github-slugger')
const fs = require('fs')

const md = `## Hello **world**
## Hello world
# Title

## Hello **world**

### Subheading`;

// extract headings using the same atx detection used in generateTOC
const re = /^\s*(#{1,6})\s+(.*)$/gm
const titles = []
let m
while ((m = re.exec(md)) !== null) {
  titles.push(m[2].trim())
}

const { toc } = generateTOC(md)

// flatten toc urls in appearance order (preorder)
const urls = []
function walk(items) {
  for (const it of items) {
    if (it.url) urls.push(it.url)
    if (it.items && it.items.length) walk(it.items)
  }
}
walk(toc)

console.log('Parsed titles:', titles)
console.log('TOC urls:', urls)

const slugger = new GithubSlugger()
const expected = titles.map((t) => '#' + slugger.slug(t).toLowerCase())
console.log('Expected urls (from slugger):', expected)

let ok = true
if (expected.length !== urls.length) {
  console.error('Mismatch in heading count:', expected.length, 'expected vs', urls.length, 'found')
  ok = false
}

const len = Math.min(expected.length, urls.length)
for (let i = 0; i < len; i++) {
  if (expected[i] !== urls[i]) {
    console.error(`Mismatch at ${i}: expected ${expected[i]} but got ${urls[i]}`)
    ok = false
  }
}

if (!ok) {
  console.error('\nIntroduce a failure to catch slug/TOC mismatches between preview and generator.')
  process.exit(1)
}
console.log('Slug regression check passed ✔️')
process.exit(0)
