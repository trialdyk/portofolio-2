import type { AppId } from './apps'
import { WALLPAPERS } from './theme'
import { projectShots } from './covers'
import { aboutText, profile, projects, skills, type Project } from '~/data/portfolio'

export type FsKind = 'root' | 'drive' | 'folder' | 'file'

export interface FsMessage {
  title: string
  text: string
  icon: 'info' | 'warning' | 'error'
}

export interface FsNode {
  id: string
  name: string
  kind: FsKind
  icon: string
  type: string
  parent: string | null
  children: string[]
  bytes?: number
  modified?: string
  content?: string
  image?: string
  url?: string
  app?: AppId
  appProps?: Record<string, unknown>
  target?: string
  shortcut?: boolean
  message?: FsMessage
  project?: Project
  drive?: { total: number; free: number }
}

type NodeDef = Partial<Omit<FsNode, 'id' | 'parent' | 'children'>> & { name: string; id?: string; children?: NodeDef[] }

const nodes = new Map<string, FsNode>()

function register(def: NodeDef, parent: string | null): FsNode {
  const { children, ...rest } = def
  const kind = def.kind ?? (children ? 'folder' : 'file')
  const id = def.id ?? `${parent}/${def.name}`
  const node: FsNode = {
    icon: kind === 'file' ? 'file-txt' : 'folder',
    type: kind === 'file' ? 'File' : 'File folder',
    ...rest,
    id,
    kind,
    parent,
    children: [],
  }
  nodes.set(id, node)
  node.children = (children ?? []).map(c => register(c, id).id)
  return node
}

const EXT_TYPES: Record<string, [icon: string, type: string]> = {
  txt: ['file-txt', 'Text Document'],
  md: ['file-md', 'Markdown Source File'],
  js: ['file-code', 'JavaScript File'],
  html: ['file-code', 'Microsoft Edge HTML Document'],
  pdf: ['file-pdf', 'Microsoft Edge PDF Document'],
  png: ['file-image', 'PNG File'],
  jpg: ['file-image', 'JPG File'],
  svg: ['file-image', 'SVG Document'],
  exe: ['file-exe', 'Application'],
  zip: ['file-zip', 'Compressed (zipped) Folder'],
  mp3: ['file-audio', 'MP3 Format Sound'],
}

const extOf = (name: string) => (name.includes('.') ? name.split('.').pop()!.toLowerCase() : '')

const NOW = new Date()
function daysAgo(days: number, hours = 10, minutes = 12) {
  const d = new Date(NOW)
  d.setDate(d.getDate() - days)
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}
function inYear(year: number) {
  const d = new Date(year, 2, 14, 9, 41)
  return (d > NOW ? NOW : d).toISOString()
}

function file(name: string, extra: Partial<NodeDef> = {}): NodeDef {
  const [icon, type] = EXT_TYPES[extOf(name)] ?? ['file-txt', 'File']
  return { name, kind: 'file', icon, type, modified: daysAgo(3), ...extra }
}
const textFile = (name: string, content: string, modified?: string) =>
  file(name, { content, bytes: new TextEncoder().encode(content).length, ...(modified ? { modified } : {}) })
const imageFile = (name: string, src: string, modified?: string) =>
  file(name, { image: src, bytes: 148_000 + name.length * 9_731, ...(modified ? { modified } : {}) })
const linkFile = (name: string, url: string, modified?: string): NodeDef =>
  ({ name, kind: 'file', icon: 'file-link', type: 'Internet Shortcut', url, bytes: 124, modified: modified ?? daysAgo(3) })
const appFile = (name: string, app: AppId, icon: string, appProps?: Record<string, unknown>): NodeDef =>
  ({ name, kind: 'file', icon, type: 'Application', app, appProps, bytes: 1_843_200, modified: daysAgo(30) })
const shortcut = (name: string, icon: string, extra: Partial<NodeDef>): NodeDef =>
  ({ name, kind: 'file', icon, type: 'Shortcut', shortcut: true, bytes: 1_024, modified: daysAgo(1), ...extra })

export const USER_DIR = `C:/Users/${profile.username}`
export const RESUME_URL = `file:///${USER_DIR}/Documents/Resume.pdf`

export const PATHS = {
  home: 'home',
  thispc: 'thispc',
  recycle: 'recycle',
  drive: 'C:',
  user: USER_DIR,
  desktop: `${USER_DIR}/Desktop`,
  documents: `${USER_DIR}/Documents`,
  downloads: `${USER_DIR}/Downloads`,
  music: `${USER_DIR}/Music`,
  pictures: `${USER_DIR}/Pictures`,
  projects: `${USER_DIR}/Projects`,
  videos: `${USER_DIR}/Videos`,
  screenshots: `${USER_DIR}/Pictures/Screenshots`,
  wallpapers: `${USER_DIR}/Pictures/Wallpapers`,
  about: `${USER_DIR}/Documents/about-me.txt`,
  resume: `${USER_DIR}/Documents/Resume.pdf`,
  skills: `${USER_DIR}/Documents/skills.txt`,
} as const

function readme(p: Project) {
  const links = [p.demo && `- Live demo : ${p.demo}`, p.repo && `- Source    : ${p.repo}`].filter(Boolean)
  return `# ${p.name}

${p.description}

## Tech stack
${p.tech.map(t => `- ${t}`).join('\n')}

## Details
- Year   : ${p.year}
- Role   : ${p.role}
- Status : ${p.status}
${links.length ? `\n## Links\n${links.join('\n')}\n` : ''}`
}

const skillCategories = [...new Set(skills.map(s => s.category))]
const skillsText = `SKILLS & TECH STACK
===================

${skillCategories
  .map(c => `[${c}]\n${skills
    .filter(s => s.category === c)
    .map((s) => {
      const filled = Math.round(s.level / 10)
      return `  ${s.name.padEnd(14)} ${'█'.repeat(filled)}${'░'.repeat(10 - filled)}  ${s.level}%`
    })
    .join('\n')}`)
  .join('\n\n')}
`

const todoText = `TODO
====
[x] Build a portfolio
[x] Make it look exactly like Windows 11
[x] Add a Terminal that actually works
[ ] Stop adding features to the portfolio
[ ] Touch grass
`

const projectFolder = (p: Project): NodeDef => ({
  name: p.name,
  kind: 'folder',
  icon: 'folder',
  type: 'File folder',
  project: p,
  modified: inYear(p.year),
  children: [
    textFile('README.md', readme(p), inYear(p.year)),
    ...projectShots(p).map((src, i) => imageFile(`screenshot-${i + 1}.png`, src, inYear(p.year))),
    ...(p.demo ? [linkFile('Live Demo', p.demo, inYear(p.year))] : []),
    ...(p.repo ? [linkFile('Source Code', p.repo, inYear(p.year))] : []),
  ],
})

register({ id: PATHS.home, name: 'Home', kind: 'root', icon: 'home', type: 'System Folder' }, null)

register({
  id: PATHS.thispc,
  name: 'This PC',
  kind: 'root',
  icon: 'this-pc',
  type: 'System Folder',
  children: [
    {
      id: PATHS.drive,
      name: 'Local Disk (C:)',
      kind: 'drive',
      icon: 'drive-windows',
      type: 'Local Disk',
      drive: { total: 476, free: 212 },
      children: [
        {
          name: 'Program Files',
          modified: daysAgo(40),
          children: [
            appFile('explorer.exe', 'explorer', 'explorer'),
            appFile('msedge.exe', 'edge', 'edge'),
            appFile('notepad.exe', 'notepad', 'notepad'),
            appFile('Photos.exe', 'photos', 'photos'),
            appFile('Mail.exe', 'mail', 'mail'),
            appFile('SystemSettings.exe', 'settings', 'settings'),
            appFile('WindowsTerminal.exe', 'terminal', 'terminal'),
          ],
        },
        {
          name: 'Users',
          modified: daysAgo(60),
          children: [
            {
              name: profile.username,
              icon: 'folder',
              modified: daysAgo(0),
              children: [
                {
                  name: 'Desktop',
                  icon: 'folder-desktop',
                  modified: daysAgo(0),
                  children: [
                    shortcut('Projects', 'folder-projects', { target: PATHS.projects, type: 'File folder' }),
                    textFile('about-me.txt', aboutText, daysAgo(0, 8, 30)),
                    shortcut('Resume.pdf', 'file-pdf', { url: RESUME_URL, shortcut: false, type: 'Microsoft Edge PDF Document', bytes: 96_512 }),
                    shortcut('Terminal', 'terminal', { app: 'terminal' }),
                    shortcut('Contact Me', 'mail', { app: 'mail', appProps: { compose: true } }),
                    shortcut('My Skills', 'settings', { app: 'settings', appProps: { page: 'apps' } }),
                    shortcut('Microsoft Edge', 'edge', { app: 'edge' }),
                  ],
                },
                {
                  name: 'Documents',
                  icon: 'folder-documents',
                  modified: daysAgo(0),
                  children: [
                    textFile('about-me.txt', aboutText, daysAgo(0, 8, 30)),
                    file('Resume.pdf', { url: RESUME_URL, bytes: 96_512, modified: daysAgo(1, 21, 41) }),
                    textFile('skills.txt', skillsText, daysAgo(2)),
                    textFile('todo.txt', todoText, daysAgo(5)),
                  ],
                },
                {
                  name: 'Downloads',
                  icon: 'folder-downloads',
                  modified: daysAgo(2),
                  children: [
                    file('coffee-installer.exe', {
                      bytes: 4_194_304,
                      message: { title: 'This app can\'t run on your PC', text: 'To find a version for your PC, check with the software publisher. Coffee has to be made the old-fashioned way.', icon: 'error' },
                    }),
                    file('node_modules.zip', {
                      bytes: 987_654_321,
                      message: { title: 'Compressed (zipped) Folders', text: 'Windows is still extracting node_modules.zip. Estimated time remaining: 4 days.', icon: 'warning' },
                    }),
                  ],
                },
                {
                  name: 'Music',
                  icon: 'folder-music',
                  modified: daysAgo(12),
                  children: [
                    file('lofi-beats-to-code-to.mp3', {
                      bytes: 7_340_032,
                      message: { title: 'Media Player', text: 'Now playing in your imagination: lofi beats to code to. 🎧', icon: 'info' },
                    }),
                  ],
                },
                {
                  name: 'Pictures',
                  icon: 'folder-pictures',
                  modified: daysAgo(1),
                  children: [
                    { name: 'Camera Roll', modified: daysAgo(90), children: [] },
                    {
                      name: 'Screenshots',
                      modified: daysAgo(1),
                      children: projects.flatMap(p => projectShots(p).map((src, i) => imageFile(`${p.slug}-${i + 1}.png`, src, inYear(p.year)))),
                    },
                    {
                      name: 'Wallpapers',
                      modified: daysAgo(20),
                      children: WALLPAPERS.map(w => imageFile(w.src.split('/').pop()!, w.src, daysAgo(20))),
                    },
                  ],
                },
                { name: 'Projects', icon: 'folder-projects', modified: daysAgo(0), children: projects.map(projectFolder) },
                { name: 'Videos', icon: 'folder-videos', modified: daysAgo(45), children: [] },
              ],
            },
          ],
        },
        {
          name: 'Windows',
          kind: 'folder',
          modified: daysAgo(120),
          message: { title: 'Windows', text: 'You don\'t currently have permission to access this folder.', icon: 'warning' },
        },
      ],
    },
  ],
}, null)

register({
  id: PATHS.recycle,
  name: 'Recycle Bin',
  kind: 'root',
  icon: 'recycle-bin-full',
  type: 'System Folder',
  children: [
    textFile('old-portfolio-final-FINAL-v3.html', `<html>
<body bgcolor="black">
  <marquee><font color="lime">Welcome to my homepage!!!</font></marquee>
  <img src="under-construction.gif">
  <p>Best viewed in Internet Explorer 6 at 800x600.</p>
</body>
</html>
`, daysAgo(400)),
    textFile('spaghetti.js', `// TODO: refactor (written in 2019)
$(document).ready(function () {
  $('#btn').click(function () {
    $('#box').fadeIn(function () {
      $.ajax({ url: 'api.php', success: function (data) {
        $('#box').html(data) // it works, don't touch
      }})
    })
  })
})
`, daysAgo(700)),
    textFile('bugs.txt', `Known bugs
==========
1. It works on my machine.
2. See #1.
`, daysAgo(200)),
  ],
}, null)

export function getNode(id: string | null | undefined): FsNode | undefined {
  return id ? nodes.get(id) : undefined
}

export function childrenOf(id: string): FsNode[] {
  return (nodes.get(id)?.children ?? []).map(c => nodes.get(c)!)
}

export function pathSegments(id: string): FsNode[] {
  const segs: FsNode[] = []
  let cur = nodes.get(id)
  while (cur) {
    segs.unshift(cur)
    cur = cur.parent ? nodes.get(cur.parent) : undefined
  }
  return segs
}

export function displayPath(id: string): string {
  if (id === PATHS.drive) return 'C:\\'
  if (id.startsWith('C:')) return id.replace(/\//g, '\\')
  return nodes.get(id)?.name ?? id
}

export function resolvePath(input: string): FsNode | undefined {
  const q = input.trim().replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase()
  if (!q) return undefined
  let byName: FsNode | undefined
  for (const n of nodes.values()) {
    if (n.id.toLowerCase() === q) return n
    if (!byName && n.name.toLowerCase() === q) byName = n
  }
  return byName
}

export function searchIn(rootId: string, query: string): FsNode[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const start = rootId === PATHS.home ? PATHS.user : rootId
  const out: FsNode[] = []
  const walk = (id: string) => {
    for (const child of childrenOf(id)) {
      if (child.name.toLowerCase().includes(q)) out.push(child)
      if (child.kind !== 'file') walk(child.id)
    }
  }
  walk(start)
  return out
}

/** User content that Start search should index. */
export function searchableNodes(): FsNode[] {
  const roots = [PATHS.documents, PATHS.projects, PATHS.pictures, PATHS.downloads, PATHS.music]
  const out: FsNode[] = []
  const walk = (id: string) => {
    for (const child of childrenOf(id)) {
      out.push(child)
      if (child.kind !== 'file') walk(child.id)
    }
  }
  for (const r of roots) {
    out.push(nodes.get(r)!)
    walk(r)
  }
  return out
}

export type SortKey = 'name' | 'modified' | 'type' | 'bytes'

export function sortNodes(list: FsNode[], key: SortKey = 'name', dir: 1 | -1 = 1): FsNode[] {
  return [...list].sort((a, b) => {
    const fa = a.kind === 'file' ? 1 : 0
    const fb = b.kind === 'file' ? 1 : 0
    if (fa !== fb) return fa - fb
    let r = 0
    if (key === 'name') r = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    else if (key === 'modified') r = (a.modified ?? '').localeCompare(b.modified ?? '')
    else if (key === 'type') r = a.type.localeCompare(b.type)
    else r = (a.bytes ?? 0) - (b.bytes ?? 0)
    return r * dir
  })
}

export function formatDate(iso?: string): string {
  if (!iso) return ''
  return new Date(iso)
    .toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    .replace(',', '')
}

export function formatSize(bytes?: number): string {
  if (bytes === undefined) return ''
  return `${Math.max(1, Math.ceil(bytes / 1024)).toLocaleString('en-US')} KB`
}

export const DESKTOP_ICONS: string[] = [PATHS.thispc, PATHS.recycle, ...nodes.get(PATHS.desktop)!.children]

export const QUICK_ACCESS: string[] = [PATHS.desktop, PATHS.downloads, PATHS.documents, PATHS.pictures, PATHS.music, PATHS.videos, PATHS.projects]

export const RECENT_FILES: string[] = [
  PATHS.about,
  PATHS.resume,
  ...childrenOf(PATHS.projects).slice(0, 3).map(p => `${p.id}/README.md`),
  PATHS.skills,
]
