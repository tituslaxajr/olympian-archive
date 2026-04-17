/**
 * build.js — The Archivist data generator
 *
 * Reads all wiki markdown files from Titus Jr's Workspace/wiki/,
 * parses frontmatter + content, and writes data.js to this directory.
 *
 * Usage: node build.js
 * Or:    npm run build
 */

const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')
const { marked, Renderer } = require('marked')

// ── Paths ──────────────────────────────────────────────────────────────────

const WIKI_ROOT = path.resolve(__dirname, "../../Titus Jr's Workspace/wiki")
const OUTPUT_FILE = path.join(__dirname, 'data.js')

// ── Domain detection ───────────────────────────────────────────────────────

const DOMAIN_TAGS = {
  faith: [
    'theology', 'faith', 'scripture', 'worship', 'resurrection', 'atonement',
    'death', 'sanctification', 'christology', 'soteriology', 'incarnation',
    'lament', 'easter', 'good-friday', 'gospel', 'salvation', 'sin', 'grace',
    'prayer', 'bible', 'hermeneutics', 'exegesis', 'eschatology', 'ecclesiology',
    'pneumatology', 'trinity', 'covenant', 'justification', 'repentance', 'holiness'
  ],
  ministry: [
    'ministry', 'pastoral', 'preaching', 'church', 'counseling', 'youth-ministry',
    'missions', 'kmi', 'kapatid', 'discipleship', 'leadership', 'small-groups',
    'church-planting', 'evangelism', 'pastoral-care', 'sermon'
  ],
  work: [
    'design', 'work', 'technology', 'ai', 'creativity', 'vocation', 'craft',
    'design-thinking', 'product-design', 'ux', 'ui', 'branding', 'visual-design',
    'career', 'productivity', 'tools', 'software', 'systems'
  ],
  culture: [
    'culture', 'storytelling', 'sexuality', 'media', 'film', 'literature',
    'music', 'art', 'society', 'masculinity', 'womanhood', 'family',
    'politics', 'philosophy', 'ethics', 'apologetics'
  ]
}

const AREA_DOMAIN_MAP = {
  'faith': 'faith',
  'ministry': 'ministry',
  'work': 'work',
  'culture': 'culture'
}

function detectDomain(filePath, tags = []) {
  const normalizedPath = filePath.replace(/\\/g, '/')

  // Area files — domain by filename
  const areaMatch = normalizedPath.match(/\/areas\/([^/]+)\.md$/)
  if (areaMatch) {
    const areaName = areaMatch[1]
    return AREA_DOMAIN_MAP[areaName] || 'general'
  }

  // Tag-based detection
  const tagSet = new Set(tags.map(t => t.toLowerCase()))
  for (const [domain, domainTags] of Object.entries(DOMAIN_TAGS)) {
    if (domainTags.some(t => tagSet.has(t))) return domain
  }

  return 'general'
}

// ── Markdown renderer ──────────────────────────────────────────────────────

function buildRenderer() {
  const renderer = new Renderer()

  renderer.heading = function(token) {
    const text  = typeof token === 'object' ? (token.text || token.raw || '') : (token || '')
    const depth = typeof token === 'object' ? (token.depth || 1) : 1
    const textStr = String(text).replace(/<[^>]*>/g, '') // strip any html tags for the id
    const sizes = {
      1: 'text-4xl md:text-5xl',
      2: 'text-3xl',
      3: 'text-xl',
      4: 'text-lg',
    }
    const cls    = sizes[depth] || 'text-base'
    const margin = depth <= 2 ? 'mt-16 mb-6' : 'mt-10 mb-4'
    const id     = textStr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return `<h${depth} id="${id}" class="${cls} font-headline text-on-surface ${margin}">${text}</h${depth}>\n`
  }

  renderer.paragraph = function(token) {
    const text = typeof token === 'object' ? (token.text || '') : (token || '')
    return `<p class="mb-6 leading-relaxed text-on-surface-variant">${text}</p>\n`
  }

  renderer.blockquote = function(token) {
    const text = typeof token === 'object' ? (token.text || '') : (token || '')
    const inner = String(text).replace(/^<p[^>]*>/, '').replace(/<\/p>\s*$/, '')
    return `<blockquote class="pl-8 border-l-2 border-primary-container italic text-xl font-headline text-on-primary-container py-2 my-12">${inner}</blockquote>\n`
  }

  renderer.strong = function(token) {
    const text = typeof token === 'object' ? (token.text || '') : (token || '')
    return `<strong class="text-on-surface font-semibold">${text}</strong>`
  }

  renderer.em = function(token) {
    const text = typeof token === 'object' ? (token.text || '') : (token || '')
    return `<em>${text}</em>`
  }

  renderer.link = function(token) {
    const href = typeof token === 'object' ? (token.href || '#') : '#'
    const text = typeof token === 'object' ? (token.text || href) : (token || '')
    return `<a href="${href}" class="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary transition-all">${text}</a>`
  }

  // renderer.list intentionally omitted — let marked render list items natively
  // so inline content (links, bold) inside list items is properly parsed.

  renderer.hr = function() {
    return `<hr class="my-12 border-0 border-t border-outline-variant/20">\n`
  }

  renderer.code = function(token) {
    const text = typeof token === 'object' ? (token.text || '') : (token || '')
    return `<pre class="bg-surface-container-low p-6 my-8 overflow-x-auto text-sm font-mono text-on-surface-variant"><code>${text}</code></pre>\n`
  }

  renderer.image = function(token) {
    const href  = typeof token === 'object' ? (token.href || '') : ''
    const title = typeof token === 'object' ? (token.title || '') : ''
    const text  = typeof token === 'object' ? (token.text || '') : ''
    return `<figure class="my-12"><img src="${href}" alt="${text}" class="w-full object-cover" />${title ? `<figcaption class="mt-3 text-xs text-stone-400 italic text-center">${title}</figcaption>` : ''}</figure>\n`
  }

  return renderer
}

// ── File utilities ─────────────────────────────────────────────────────────

function readMarkdownFiles(dir) {
  const files = []
  if (!fs.existsSync(dir)) return files

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...readMarkdownFiles(fullPath))
    } else if (entry.name.endsWith('.md') && !entry.name.startsWith('_') && entry.name !== 'index.md' && entry.name !== 'log.md') {
      files.push(fullPath)
    }
  }
  return files
}

function getSlug(filePath) {
  return path.basename(filePath, '.md')
}

function extractExcerpt(content, maxLen = 220) {
  const stripped = content
    .replace(/^#+\s+.+$/gm, '')          // remove headings
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1') // unwrap WikiLinks
    .replace(/[*_`~]/g, '')              // remove markdown formatting
    .replace(/^>\s+/gm, '')             // remove blockquote markers
    .replace(/\n{2,}/g, ' ')            // collapse newlines
    .trim()

  const first = stripped.split('. ').slice(0, 3).join('. ')
  if (first.length <= maxLen) return first + (first.endsWith('.') ? '' : '...')
  return first.slice(0, maxLen).replace(/\s+\S*$/, '') + '...'
}

function extractHeadings(content) {
  const headings = []
  const regex = /^(#{1,4})\s+(.+)$/gm
  let match
  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    headings.push({ level, text, id })
  }
  return headings
}

function estimateReadTime(content) {
  const words = content.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

// ── Parse a single wiki file ───────────────────────────────────────────────

function parseEntry(filePath) {
  let raw
  try {
    raw = fs.readFileSync(filePath, 'utf-8')
  } catch (e) {
    return null
  }

  let data, content
  try {
    const parsed = matter(raw)
    data    = parsed.data
    content = parsed.content
  } catch (e) {
    // Malformed YAML frontmatter — try a lenient manual parse
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
    if (!fmMatch) return null
    content = fmMatch[2]
    data = {}
    for (const line of fmMatch[1].split('\n')) {
      const m = line.match(/^(\w+):\s*(.+)$/)
      if (m) {
        const key = m[1]
        let val = m[2].trim().replace(/^["']|["']$/g, '')
        // Parse arrays: [a, b, c]
        if (val.startsWith('[') && val.endsWith(']')) {
          val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))
        }
        data[key] = val
      }
    }
    if (!data.title) {
      console.warn(`  ⚠ skipped (parse error): ${path.basename(filePath)}`)
      return null
    }
    console.warn(`  ⚠ lenient parse: ${path.basename(filePath)}`)
  }

  if (!data.title) return null

  const slug = getSlug(filePath)
  const domain = detectDomain(filePath, data.tags || [])

  // Resolve [[WikiLinks]] → entry.html?slug=...
  const resolvedContent = content.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_, target, alias) => {
      const targetSlug = target.trim().toLowerCase().replace(/\s+/g, '-')
      const label = (alias || target).trim()
      return `[${label}](entry.html?slug=${targetSlug})`
    }
  )

  // Convert markdown to HTML
  const renderer = buildRenderer()
  const htmlContent = marked(resolvedContent, { renderer, gfm: true, breaks: false })

  const headings = extractHeadings(content)
  const excerpt = extractExcerpt(content)
  const wordCount = content.split(/\s+/).filter(Boolean).length
  const readTime = estimateReadTime(content)

  // Determine author from content or default
  const authorMatch = content.match(/[Aa]uthor:\s*(.+)/m) || content.match(/[Bb]y\s+([A-Z][a-z]+(?:\s+[A-Z][a-z.]+)+)/m)
  const author = authorMatch ? authorMatch[1].trim() : 'Titus Jr. Laxa'

  // Source tag from frontmatter or content
  const sourceMatch = content.match(/[Ss]ource:\s*(.+)/m)
  const source = sourceMatch ? sourceMatch[1].trim() : (data.tags || []).find(t => t.match(/^(substack|book|sermon|blog|podcast)/i)) || null

  return {
    slug,
    title: data.title,
    type: data.type || 'resource',
    tags: (data.tags || []).map(t => String(t)),
    created: data.created ? String(data.created) : '',
    updated: data.updated ? String(data.updated) : '',
    sources: data.sources || 0,
    domain,
    excerpt,
    htmlContent,
    headings,
    wordCount,
    readTime,
    author,
    source,
    coverImage: data.coverImage || null,
    filePath: filePath.replace(WIKI_ROOT, '').replace(/\\/g, '/')
  }
}

// ── Main build ─────────────────────────────────────────────────────────────

function build() {
  if (!fs.existsSync(WIKI_ROOT)) {
    console.error(`✗ Wiki not found at: ${WIKI_ROOT}`)
    console.error('  Check the path in build.js (WIKI_ROOT variable)')
    process.exit(1)
  }

  const dirs = ['resources', 'concepts', 'areas', 'people', 'projects', 'lenses']
  const allFiles = []

  for (const dir of dirs) {
    const dirPath = path.join(WIKI_ROOT, dir)
    const files = readMarkdownFiles(dirPath)
    allFiles.push(...files)
    console.log(`  ${dir}/: ${files.length} files`)
  }

  console.log(`\nParsing ${allFiles.length} files...`)

  const entries = allFiles
    .map(parseEntry)
    .filter(Boolean)
    .sort((a, b) => {
      const da = a.updated || a.created || ''
      const db = b.updated || b.created || ''
      return db.localeCompare(da)
    })

  // Domain + type stats
  const byDomain = {}
  const byType = {}
  for (const e of entries) {
    byDomain[e.domain] = (byDomain[e.domain] || 0) + 1
    byType[e.type] = (byType[e.type] || 0) + 1
  }

  // Collect all tags
  const tagCounts = {}
  for (const e of entries) {
    for (const t of e.tags) {
      tagCounts[t] = (tagCounts[t] || 0) + 1
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([tag]) => tag)

  const data = {
    entries,
    topTags,
    lastUpdated: new Date().toISOString(),
    stats: { total: entries.length, byDomain, byType }
  }

  const output = [
    `// Generated by build.js — ${new Date().toISOString()}`,
    `// Do not edit manually. Run: npm run build`,
    `window.WIKI_DATA = ${JSON.stringify(data, null, 2)};`,
    ''
  ].join('\n')

  fs.writeFileSync(OUTPUT_FILE, output, 'utf-8')

  console.log(`\n✓ data.js written with ${entries.length} entries`)
  console.log(`  Domains: ${Object.entries(byDomain).map(([k, v]) => `${k}(${v})`).join(', ')}`)
  console.log(`  Types:   ${Object.entries(byType).map(([k, v]) => `${k}(${v})`).join(', ')}`)
  console.log(`  Tags:    ${topTags.slice(0, 8).join(', ')}...`)
}

build()
