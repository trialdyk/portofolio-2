import type { Project } from '~/data/portfolio'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const toDataUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

function seeded(seed: string) {
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

const FONT = 'Segoe UI, Arial, sans-serif'

function browserFrame(inner: string) {
  return `<g transform="translate(90 70)">
<rect width="1100" height="660" rx="16" fill="#fff"/>
<path d="M0 16a16 16 0 0 1 16-16h1068a16 16 0 0 1 16 16v28H0z" fill="#eef1f5"/>
<circle cx="26" cy="22" r="6" fill="#d0d5dc"/><circle cx="46" cy="22" r="6" fill="#d0d5dc"/><circle cx="66" cy="22" r="6" fill="#d0d5dc"/>
<rect x="340" y="11" width="420" height="22" rx="11" fill="#fff"/>
${inner}
</g>`
}

function wrap(p: Project, body: string) {
  const [a, b] = p.colors
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="1280" height="800" fill="url(#bg)"/>
<circle cx="1180" cy="80" r="260" fill="#fff" opacity=".08"/>
<circle cx="80" cy="760" r="200" fill="#fff" opacity=".07"/>
${browserFrame(body)}
</svg>`
}

function landing(p: Project) {
  const [a, b] = p.colors
  const summary = p.summary.length > 60 ? `${p.summary.slice(0, 59)}…` : p.summary
  const cards = [0, 1, 2]
    .map(i => {
      const c = i === 1 ? b : a
      return `<g transform="translate(${60 + i * 336} 420)"><rect width="312" height="200" rx="14" fill="${c}" opacity=".12"/><rect x="24" y="24" width="48" height="48" rx="12" fill="${c}"/><rect x="24" y="96" width="180" height="14" rx="7" fill="#374151" opacity=".75"/><rect x="24" y="124" width="250" height="10" rx="5" fill="#9ca3af"/><rect x="24" y="144" width="220" height="10" rx="5" fill="#9ca3af"/></g>`
    })
    .join('')
  return wrap(
    p,
    `<rect x="60" y="80" width="120" height="16" rx="8" fill="${a}"/>
<rect x="760" y="82" width="70" height="12" rx="6" fill="#cfd5dd"/><rect x="850" y="82" width="70" height="12" rx="6" fill="#cfd5dd"/><rect x="940" y="82" width="90" height="12" rx="6" fill="#cfd5dd"/>
<text x="60" y="210" font-family="${FONT}" font-size="58" font-weight="700" fill="#111827">${esc(p.name)}</text>
<text x="60" y="262" font-family="${FONT}" font-size="24" fill="#4b5563">${esc(summary)}</text>
<rect x="60" y="300" width="190" height="52" rx="26" fill="${a}"/>
<rect x="266" y="300" width="160" height="52" rx="26" fill="none" stroke="${a}" stroke-width="2"/>
<g transform="translate(790 150)"><circle cx="130" cy="130" r="130" fill="url(#bg)"/><rect x="50" y="95" width="160" height="100" rx="14" fill="#fff" opacity=".92"/><rect x="70" y="115" width="80" height="12" rx="6" fill="${a}"/><rect x="70" y="139" width="120" height="10" rx="5" fill="#d1d5db"/><rect x="70" y="159" width="100" height="10" rx="5" fill="#d1d5db"/></g>
${cards}`,
  )
}

function dashboard(p: Project) {
  const [a, b] = p.colors
  const rnd = seeded(p.slug)
  const bars = Array.from({ length: 12 }, (_, i) => {
    const h = 40 + Math.round(rnd() * 170)
    return `<rect x="${24 + i * 44}" y="${250 - h}" width="26" height="${h}" rx="6" fill="${i % 3 === 2 ? b : a}" opacity="${i % 3 === 2 ? 0.9 : 0.75}"/>`
  }).join('')
  const stats = [0, 1, 2, 3]
    .map(i => `<g transform="translate(${260 + i * 205} 96)"><rect width="185" height="96" rx="12" fill="#f5f7fa"/><rect x="18" y="20" width="70" height="10" rx="5" fill="#9ca3af"/><text x="18" y="70" font-family="${FONT}" font-size="30" font-weight="700" fill="#111827">${Math.round(rnd() * 900 + 100)}${i === 3 ? '%' : ''}</text></g>`)
    .join('')
  const rows = [0, 1, 2, 3, 4]
    .map(i => `<g transform="translate(0 ${i * 48})"><circle cx="14" cy="14" r="10" fill="${i % 2 ? b : a}" opacity=".8"/><rect x="34" y="9" width="${50 + Math.round(rnd() * 50)}" height="10" rx="5" fill="#6b7280"/><rect x="140" y="9" width="28" height="10" rx="5" fill="#d1d5db"/></g>`)
    .join('')
  const nav = [0, 1, 2, 3, 4, 5]
    .map(i => i === 0
      ? `<rect x="24" y="140" width="172" height="32" rx="8" fill="${a}"/>`
      : `<rect x="24" y="${150 + i * 44}" width="120" height="12" rx="6" fill="#374151"/>`)
    .join('')
  return wrap(
    p,
    `<path d="M0 44h220v600a16 16 0 0 1-16 16H16a16 16 0 0 1-16-16z" fill="#111827"/>
<rect x="24" y="72" width="36" height="36" rx="10" fill="url(#bg)"/>
<text x="72" y="98" font-family="${FONT}" font-size="18" font-weight="600" fill="#fff">${esc(p.name.length > 12 ? `${p.name.slice(0, 11)}…` : p.name)}</text>
${nav}
<text x="260" y="78" font-family="${FONT}" font-size="22" font-weight="600" fill="#111827">Dashboard</text>
${stats}
<g transform="translate(260 222)"><rect width="580" height="290" rx="12" fill="#f5f7fa"/><g transform="translate(0 20)">${bars}</g></g>
<g transform="translate(860 222)"><rect width="200" height="290" rx="12" fill="#f5f7fa"/><g transform="translate(16 30)">${rows}</g></g>
<g transform="translate(260 532)">${p.tech.slice(0, 5).map((t, i) => `<g transform="translate(${i * 150} 0)"><rect width="136" height="40" rx="20" fill="${a}" opacity=".12"/><text x="68" y="26" text-anchor="middle" font-family="${FONT}" font-size="15" fill="#1f2937">${esc(t.length > 14 ? `${t.slice(0, 13)}…` : t)}</text></g>`).join('')}</g>`,
  )
}

const cache = new Map<string, string[]>()

/** Real screenshots when provided, otherwise generated preview images. */
export function projectShots(p: Project): string[] {
  if (p.images?.length) return p.images
  let shots = cache.get(p.slug)
  if (!shots) {
    shots = [toDataUri(landing(p)), toDataUri(dashboard(p))]
    cache.set(p.slug, shots)
  }
  return shots
}
