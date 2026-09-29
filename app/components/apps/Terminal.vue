<script setup lang="ts">
import type { WinState } from '~/composables/useWindows'
import { APPS, LAUNCHABLE_APPS, type AppId } from '~/utils/apps'
import { PATHS, RESUME_URL, USER_DIR, childrenOf, displayPath, formatDate, getNode, resolvePath, type FsNode } from '~/utils/fs'
import { education, experience, learning, profile, projects, skills, socials } from '~/data/portfolio'

const props = defineProps<{ win: WinState; active: boolean }>()
const wm = useWindows()
const os = useOs()
const shell = useShell()

interface Seg {
  t: string
  c?: string
  href?: string
}
type Line =
  | { id: number; kind: 'text'; segs: Seg[] }
  | { id: number; kind: 'cmd'; cwd: string; input: string }
  | { id: number; kind: 'fetch' }

interface Session {
  id: number
  lines: Line[]
  cwd: string
  history: string[]
  hIndex: number
  input: string
}

let lineSeq = 0
let sessionSeq = 0
const sessions = ref<Session[]>([])
const activeId = ref(0)
const body = ref<HTMLElement>()
const inputEl = ref<HTMLInputElement>()

const session = computed(() => sessions.value.find(s => s.id === activeId.value) ?? sessions.value[0]!)
const tabItems = computed(() => sessions.value.map(s => ({ id: s.id, title: 'Windows PowerShell', icon: 'powershell' })))

const HOST = `${profile.username.toUpperCase()}-PC`
const yearsCoding = new Date().getFullYear() - profile.codingSince
const LOGO_ROW = 'lllllllllllllll   lllllllllllllll'
const LOGO = [...Array(7).fill(LOGO_ROW), '', ...Array(7).fill(LOGO_ROW)].join('\n')

const fetchInfo = computed<[string, string][]>(() => [
  ['OS', 'Portfolio 11 Pro x64'],
  ['Host', profile.name],
  ['Role', profile.role],
  ['Kernel', 'Nuxt 4 + Vue 3'],
  ['Uptime', `${yearsCoding} years of coding`],
  ['Packages', `${skills.length} skills (type 'skills')`],
  ['Shell', 'PowerShell 5.1'],
  ['Theme', `Fluent ${os.theme.value}`],
  ['Location', profile.location],
  ['Projects', `${projects.length} (type 'projects')`],
  ['Email', profile.email],
])

function print(s: Session, ...lines: (string | Seg[])[]) {
  for (const line of lines) {
    s.lines.push({ id: ++lineSeq, kind: 'text', segs: typeof line === 'string' ? [{ t: line }] : line })
  }
}
const err = (s: Session, text: string) => print(s, [{ t: text, c: 'red' }])
const winPath = (id: string) => displayPath(id)

function scrollToEnd() {
  nextTick(() => {
    if (body.value) body.value.scrollTop = body.value.scrollHeight
  })
}

function focusInput() {
  nextTick(() => {
    if (props.active) inputEl.value?.focus({ preventScroll: true })
  })
}

function normalizeCwd(id: unknown) {
  return typeof id === 'string' && id.startsWith('C:') && getNode(id)?.kind !== 'file' ? id : USER_DIR
}

function newSession(cwd: string = USER_DIR, autorun = true) {
  sessions.value.push({ id: ++sessionSeq, lines: [], cwd, history: [], hIndex: -1, input: '' })
  activeId.value = sessionSeq
  const s = sessions.value[sessions.value.length - 1]!
  print(
    s,
    'Windows PowerShell',
    `Copyright (C) ${profile.name}. All rights reserved.`,
    '',
    [{ t: 'Type ' }, { t: 'help', c: 'yellow' }, { t: ' to see available commands, or ' }, { t: 'winfetch', c: 'yellow' }, { t: ' for a quick overview.' }],
    '',
  )
  if (autorun) execute(s, 'winfetch')
  focusInput()
}

function closeSession(id: number) {
  if (sessions.value.length === 1) return wm.close(props.win.id)
  const i = sessions.value.findIndex(s => s.id === id)
  sessions.value.splice(i, 1)
  if (activeId.value === id) activeId.value = sessions.value[Math.max(0, i - 1)]!.id
  focusInput()
}

function resolveFrom(cwd: string, raw: string): FsNode | undefined {
  const arg = raw.replace(/^["']|["']$/g, '').replace(/\\/g, '/').replace(/\/+$/, '')
  if (!arg || arg === '.') return getNode(cwd)
  let parts: string[]
  if (/^[a-z]:/i.test(arg)) parts = arg.split('/')
  else if (arg === '~' || arg.startsWith('~/')) parts = [...USER_DIR.split('/'), ...arg.slice(2).split('/')]
  else parts = [...cwd.split('/'), ...arg.split('/')]
  const stack: string[] = []
  for (const part of parts) {
    if (!part || part === '.') continue
    if (part === '..') {
      if (stack.length > 1) stack.pop()
      continue
    }
    stack.push(part)
  }
  const target = stack.join('/')
  const node = resolvePath(target)
  return node && node.id.toLowerCase() === target.toLowerCase() ? node : undefined
}

function findProject(query: string) {
  const q = query.toLowerCase()
  const n = Number(q)
  if (Number.isInteger(n) && n >= 1 && n <= projects.length) return projects[n - 1]
  return projects.find(p => p.slug === q || p.name.toLowerCase() === q)
    ?? projects.find(p => p.name.toLowerCase().includes(q) || p.slug.includes(q))
}

const APP_ALIASES: Record<string, AppId> = {
  explorer: 'explorer', files: 'explorer', notepad: 'notepad', terminal: 'terminal', wt: 'terminal',
  settings: 'settings', edge: 'edge', msedge: 'edge', browser: 'edge', photos: 'photos', mail: 'mail', outlook: 'mail',
}

function openTarget(s: Session, arg: string) {
  if (!arg) return err(s, 'open : Missing an argument. Try \'open 1\', \'open notepad\' or \'open about-me.txt\'.')
  const app = APP_ALIASES[arg.toLowerCase()]
  if (app) return void wm.openApp(app)
  const node = resolveFrom(s.cwd, arg)
  if (node) {
    print(s, [{ t: `Opening ${displayPath(node.id)}...`, c: 'gray' }])
    return void shell.openNode(node)
  }
  const project = findProject(arg)
  if (project) {
    print(s, [{ t: `Opening ${project.name} in File Explorer...`, c: 'gray' }])
    return void wm.openApp('explorer', { path: `${PATHS.projects}/${project.name}` })
  }
  err(s, `open : Cannot find '${arg}'. Type 'projects' to see what you can open.`)
}

function lsTable(s: Session, node: FsNode) {
  const list = childrenOf(node.id)
  print(s, '', `    Directory: ${winPath(node.id)}`, '', '')
  if (!list.length) return
  print(s, 'Mode                 LastWriteTime         Length Name', '----                 -------------         ------ ----')
  for (const n of list) {
    const date = n.modified ? formatDate(n.modified).split(' ') : ['', '', '']
    const stamp = `${date[0]!.padStart(10)} ${`${date[1]} ${date[2]}`.padStart(8)}`
    const isDir = n.kind !== 'file'
    print(s, [
      { t: `${isDir ? 'd-----' : '-a----'}        ${stamp}  ${(isDir ? '' : String(n.bytes ?? 0)).padStart(13)} ` },
      { t: n.name, c: isDir ? 'blue' : n.app ? 'green' : undefined },
    ])
  }
  print(s, '')
}

interface Command {
  desc?: string
  usage?: string
  run: (s: Session, args: string[], raw: string) => void
}

const COMMANDS: Record<string, Command> = {
  help: {
    desc: 'Show this list',
    run: (s) => {
      print(s, '', [{ t: 'Available commands', c: 'cyan' }], '')
      for (const [name, cmd] of Object.entries(COMMANDS)) {
        if (!cmd.desc) continue
        print(s, [{ t: `  ${(cmd.usage ?? name).padEnd(16)}`, c: 'yellow' }, { t: cmd.desc }])
      }
      print(s, '', [{ t: 'Tip: use Tab to autocomplete and ↑/↓ to browse history.', c: 'gray' }], '')
    },
  },
  about: {
    desc: 'Who I am',
    run: (s) => {
      print(
        s,
        '',
        [{ t: profile.name, c: 'cyan' }, { t: ` — ${profile.role}`, c: 'white' }],
        [{ t: `📍 ${profile.location}`, c: 'gray' }],
        '',
        profile.tagline,
        `I've been writing code since ${profile.codingSince} and currently learning ${learning.join(', ')}.`,
        profile.openToWork ? 'I\'m open to freelance and full-time opportunities.' : '',
        '',
        [{ t: 'Try ' }, { t: 'skills', c: 'yellow' }, { t: ', ' }, { t: 'projects', c: 'yellow' }, { t: ' or ' }, { t: 'contact', c: 'yellow' }, { t: '.' }],
        '',
      )
    },
  },
  whoami: {
    run: s => print(s, `${profile.username.toLowerCase()}-pc\\${profile.username}`),
  },
  skills: {
    desc: 'My tech stack',
    run: (s) => {
      const categories = [...new Set(skills.map(k => k.category))]
      print(s, '')
      for (const c of categories) {
        print(s, [{ t: c, c: 'cyan' }])
        for (const k of skills.filter(x => x.category === c)) {
          const filled = Math.round(k.level / 5)
          print(s, [
            { t: `  ${k.name.padEnd(14)}` },
            { t: '█'.repeat(filled), c: 'green' },
            { t: '░'.repeat(20 - filled), c: 'darkgray' },
            { t: ` ${String(k.level).padStart(3)}%`, c: 'white' },
            { t: `  since ${k.since}`, c: 'gray' },
          ])
        }
        print(s, '')
      }
    },
  },
  projects: {
    desc: 'Things I\'ve built',
    run: (s) => {
      print(s, '', [{ t: '  #  Name                     Year  Stack', c: 'cyan' }], [{ t: '  -  ----                     ----  -----', c: 'cyan' }])
      projects.forEach((p, i) => {
        print(s, [
          { t: `  ${i + 1}  ` },
          { t: p.name.padEnd(25), c: 'white' },
          { t: `${p.year}  ` },
          { t: p.tech.slice(0, 3).join(', '), c: 'gray' },
        ])
      })
      print(s, '', [{ t: 'Type ' }, { t: 'open <number>', c: 'yellow' }, { t: ' to browse a project in File Explorer.' }], '')
    },
  },
  experience: {
    desc: 'Where I\'ve worked',
    run: (s) => {
      print(s, '')
      for (const e of experience) {
        print(
          s,
          [{ t: e.role, c: 'white' }, { t: ' @ ' }, { t: e.company, c: 'cyan' }],
          [{ t: `${e.start} – ${e.end} · ${e.location}`, c: 'gray' }],
          e.summary,
          ...e.highlights.map(h => `  • ${h}`),
          '',
        )
      }
    },
  },
  education: {
    desc: 'Where I\'ve studied',
    run: (s) => {
      print(s, '')
      for (const e of education) print(s, [{ t: e.degree, c: 'white' }], [{ t: `${e.school} · ${e.start} – ${e.end}`, c: 'gray' }], '')
    },
  },
  contact: {
    desc: 'How to reach me',
    run: (s) => {
      print(s, '')
      for (const so of socials) {
        print(s, [{ t: `  ${so.name.padEnd(11)}` , c: 'cyan' }, { t: so.handle, href: so.url }])
      }
      print(s, '', [{ t: 'Or type ' }, { t: 'mail', c: 'yellow' }, { t: ' to write me a message.' }], '')
    },
  },
  resume: {
    desc: 'Open my resume',
    run: (s) => {
      print(s, [{ t: 'Opening Resume.pdf in Microsoft Edge...', c: 'gray' }])
      wm.openApp('edge', { url: RESUME_URL })
    },
  },
  mail: {
    run: () => void wm.openApp('mail', { compose: true }),
  },
  open: {
    desc: 'Open a project, app or file',
    usage: 'open <name>',
    run: (s, args) => openTarget(s, args.join(' ')),
  },
  winfetch: {
    desc: 'System information',
    run: (s) => {
      s.lines.push({ id: ++lineSeq, kind: 'fetch' })
    },
  },
  ls: {
    desc: 'List files',
    usage: 'ls [path]',
    run: (s, args) => {
      const node = resolveFrom(s.cwd, args.join(' '))
      if (!node) return err(s, `Get-ChildItem : Cannot find path '${args.join(' ')}' because it does not exist.`)
      if (node.kind === 'file') return print(s, node.name)
      lsTable(s, node)
    },
  },
  cd: {
    desc: 'Change directory',
    usage: 'cd <path>',
    run: (s, args) => {
      const arg = args.join(' ')
      if (!arg) return print(s, winPath(s.cwd))
      const node = resolveFrom(s.cwd, arg)
      if (!node || node.kind === 'file') return err(s, `Set-Location : Cannot find path '${arg}' because it does not exist.`)
      if (node.message) return err(s, `Set-Location : Access to the path '${winPath(node.id)}' is denied.`)
      s.cwd = node.id
    },
  },
  cat: {
    desc: 'Print a file',
    usage: 'cat <file>',
    run: (s, args) => {
      const arg = args.join(' ')
      const node = resolveFrom(s.cwd, arg)
      if (!node) return err(s, `Get-Content : Cannot find path '${arg}' because it does not exist.`)
      if (node.kind !== 'file' || node.message) return err(s, `Get-Content : Access to the path '${winPath(node.id)}' is denied.`)
      if (node.content !== undefined) return print(s, ...node.content.replace(/\n$/, '').split('\n'))
      if (node.url) return print(s, '[InternetShortcut]', `URL=${node.url}`)
      err(s, 'Get-Content : This file is binary and can\'t be displayed in the terminal. Use \'open\' instead.')
    },
  },
  pwd: {
    run: s => print(s, '', 'Path', '----', winPath(s.cwd), ''),
  },
  explorer: {
    run: (s, args) => {
      const node = resolveFrom(s.cwd, args.join(' ') || '.')
      wm.openApp('explorer', { path: node && node.kind !== 'file' ? node.id : s.cwd })
    },
  },
  notepad: {
    run: (s, args) => {
      const node = args.length ? resolveFrom(s.cwd, args.join(' ')) : undefined
      if (node?.content !== undefined) wm.openApp('notepad', { file: node.id })
      else wm.openApp('notepad', { new: true })
    },
  },
  theme: {
    desc: 'Switch theme',
    usage: 'theme [light|dark]',
    run: (s, args) => {
      const mode = args[0]?.toLowerCase()
      if (mode === 'light' || mode === 'dark') {
        os.setTheme(mode)
        print(s, [{ t: `Theme set to ${mode}.`, c: 'green' }])
      }
      else {
        print(s, `Current theme: ${os.theme.value}. Usage: theme light | theme dark`)
      }
    },
  },
  date: {
    run: s => print(s, '', new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' }).replace(' at ', ' '), ''),
  },
  echo: {
    run: (s, _args, raw) => print(s, raw.replace(/^["']|["']$/g, '')),
  },
  history: {
    run: (s) => {
      print(s, '', '  Id CommandLine', '  -- -----------')
      s.history.forEach((h, i) => print(s, `  ${String(i + 1).padStart(2)} ${h}`))
      print(s, '')
    },
  },
  clear: {
    desc: 'Clear the screen',
    run: (s) => {
      s.lines = []
    },
  },
  exit: {
    desc: 'Close this tab',
    run: s => closeSession(s.id),
  },
  shutdown: {
    run: (s, args) => {
      const flag = args[0]?.toLowerCase()
      if (flag === '/r') os.power('restart')
      else if (flag === '/s') os.power('shutdown')
      else print(s, 'Usage: shutdown /s (shut down) | shutdown /r (restart)')
    },
  },
  sudo: {
    run: s => print(s, [{ t: 'sudo: you are already the administrator of this portfolio. 😎', c: 'yellow' }]),
  },
  code: {
    run: (s) => {
      print(s, [{ t: 'Visual Studio Code isn\'t installed on this PC... opening Notepad instead. 😄', c: 'yellow' }])
      wm.openApp('notepad', { new: true })
    },
  },
}

const ALIASES: Record<string, string> = {
  'dir': 'ls', 'gci': 'ls', 'get-childitem': 'ls',
  'set-location': 'cd', 'sl': 'cd', 'chdir': 'cd',
  'type': 'cat', 'gc': 'cat', 'get-content': 'cat',
  'cls': 'clear', 'clear-host': 'clear',
  'neofetch': 'winfetch', 'fastfetch': 'winfetch', 'systeminfo': 'winfetch',
  'socials': 'contact', 'start': 'open', 'start-process': 'open', 'ii': 'open', 'invoke-item': 'open',
  'get-date': 'date', 'write-host': 'echo', 'write-output': 'echo', 'get-location': 'pwd', 'gl': 'pwd',
  'get-help': 'help', 'man': 'help', '?': 'help', 'get-history': 'history', 'h': 'history',
  'restart-computer': 'shutdown', 'stop-computer': 'shutdown', 'work': 'experience', 'cv': 'resume',
}

function execute(s: Session, line: string) {
  s.lines.push({ id: ++lineSeq, kind: 'cmd', cwd: s.cwd, input: line })
  const trimmed = line.trim()
  if (!trimmed) return
  s.history.push(trimmed)
  s.hIndex = -1
  const [first = '', ...args] = trimmed.split(/\s+/)
  const raw = trimmed.slice(first.length).trim()
  let name = first.toLowerCase()
  name = ALIASES[name] ?? name
  if (first.toLowerCase() === 'restart-computer') return os.power('restart')
  if (first.toLowerCase() === 'stop-computer') return os.power('shutdown')
  if (name === 'rm' || name === 'del' || name === 'remove-item') {
    return print(s, [{ t: 'Nice try. Nothing gets deleted on this PC. 🙂', c: 'yellow' }])
  }
  const cmd = COMMANDS[name]
  if (!cmd) {
    if (LAUNCHABLE_APPS.some(a => a.id === name)) return void wm.openApp(name as AppId)
    err(s, `${first} : The term '${first}' is not recognized as the name of a cmdlet, function, script file, or operable`)
    err(s, 'program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again.')
    print(s, [{ t: 'Type \'help\' to see available commands.', c: 'gray' }])
    return
  }
  cmd.run(s, args, raw)
}

function complete(s: Session) {
  const value = s.input
  const parts = value.split(' ')
  if (parts.length === 1) {
    const q = parts[0]!.toLowerCase()
    const matches = Object.entries(COMMANDS).filter(([n, c]) => c.desc && n.startsWith(q)).map(([n]) => n)
    if (matches.length === 1) s.input = `${matches[0]} `
    else if (matches.length > 1) {
      s.lines.push({ id: ++lineSeq, kind: 'cmd', cwd: s.cwd, input: value })
      print(s, matches.join('    '))
    }
    return
  }
  const partial = parts.slice(1).join(' ').replace(/^["']/, '').toLowerCase()
  const candidates = [
    ...childrenOf(s.cwd).map(n => n.name),
    ...(parts[0]!.toLowerCase() === 'open' ? [...projects.map(p => p.slug), ...LAUNCHABLE_APPS.map(a => a.id)] : []),
  ]
  const matches = candidates.filter(c => c.toLowerCase().startsWith(partial))
  if (matches.length === 1) {
    const m = matches[0]!
    s.input = `${parts[0]} ${m.includes(' ') ? `"${m}"` : m}`
  }
  else if (matches.length > 1) {
    s.lines.push({ id: ++lineSeq, kind: 'cmd', cwd: s.cwd, input: value })
    print(s, matches.join('    '))
  }
}

function onKey(e: KeyboardEvent) {
  const s = session.value
  if (e.key === 'Enter') {
    const line = s.input
    s.input = ''
    execute(s, line)
  }
  else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (!s.history.length) return
    s.hIndex = s.hIndex === -1 ? s.history.length - 1 : Math.max(0, s.hIndex - 1)
    s.input = s.history[s.hIndex]!
  }
  else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (s.hIndex === -1) return
    s.hIndex++
    if (s.hIndex >= s.history.length) {
      s.hIndex = -1
      s.input = ''
    }
    else {
      s.input = s.history[s.hIndex]!
    }
  }
  else if (e.key === 'Tab') {
    e.preventDefault()
    complete(s)
  }
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
    e.preventDefault()
    s.lines = []
  }
  else if (e.ctrlKey && e.key.toLowerCase() === 'c' && !window.getSelection()?.toString()) {
    e.preventDefault()
    s.lines.push({ id: ++lineSeq, kind: 'cmd', cwd: s.cwd, input: `${s.input}^C` })
    s.input = ''
  }
}

function onBodyClick() {
  if (!window.getSelection()?.toString()) inputEl.value?.focus({ preventScroll: true })
}

function splitCmd(input: string) {
  const i = input.indexOf(' ')
  return i === -1 ? [input, ''] : [input.slice(0, i), input.slice(i)]
}

function openDropdown(e: MouseEvent) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  os.openMenu(r.left, r.bottom + 4, [
    { label: 'Windows PowerShell', icon: 'powershell', shortcut: 'Ctrl+Shift+1', action: () => newSession() },
    { label: 'Command Prompt', icon: 'terminal', shortcut: 'Ctrl+Shift+2', disabled: true },
    { separator: true },
    { label: 'Settings', icon: 'fluent:settings-24-regular', shortcut: 'Ctrl+,', action: () => wm.openApp('settings', { page: 'personalization' }) },
    { label: 'About', icon: 'fluent:info-24-regular', action: () => shell.dialog({ title: 'About', message: `${APPS.terminal.name} — a tiny PowerShell look-alike built for ${profile.name}'s portfolio.`, icon: 'info' }) },
  ])
}

// Runs last: the first session executes `winfetch`, which needs COMMANDS/ALIASES above.
function handleLaunch(p: Record<string, unknown>) {
  if (!sessions.value.length) newSession(normalizeCwd(p.cwd))
  else if (p.cwd) newSession(normalizeCwd(p.cwd), false)
}
handleLaunch(props.win.props)
watch(() => props.win.launch, () => handleLaunch(props.win.props))
watch(() => props.active, (a) => {
  if (a) focusInput()
})
watch(() => [session.value.lines.length, activeId.value], scrollToEnd)
onMounted(scrollToEnd)
</script>

<template>
  <div class="terminal">
    <OsTabStrip :tabs="tabItems" :active="activeId" @select="(id) => { activeId = id; focusInput() }" @close="closeSession" @add="newSession()">
      <template #after>
        <button class="term-drop" aria-label="Open a new tab" @click="openDropdown">
          <Icon name="fluent:chevron-down-16-regular" size="12px" />
        </button>
      </template>
    </OsTabStrip>
    <div ref="body" class="term-body selectable" @click="onBodyClick">
      <template v-for="line in session.lines" :key="line.id">
        <div v-if="line.kind === 'cmd'" class="tl">
          <span>PS {{ winPath(line.cwd) }}&gt; </span><span class="c-yellow">{{ splitCmd(line.input)[0] }}</span><span class="c-white">{{ splitCmd(line.input)[1] }}</span>
        </div>
        <div v-else-if="line.kind === 'fetch'" class="tl fetch">
          <pre class="fetch-logo c-blue">{{ LOGO }}</pre>
          <div class="fetch-info">
            <div><span class="c-blue b">{{ profile.username }}</span>@<span class="c-blue b">{{ HOST }}</span></div>
            <div>{{ '-'.repeat(profile.username.length + HOST.length + 1) }}</div>
            <div v-for="[k, v] in fetchInfo" :key="k"><span class="c-blue b">{{ k }}</span>: {{ v }}</div>
            <div class="swatches">
              <span v-for="n in 8" :key="n" :class="`sw-${n}`" />
            </div>
          </div>
        </div>
        <div v-else class="tl">
          <template v-for="(seg, i) in line.segs" :key="i">
            <a v-if="seg.href" :href="seg.href" target="_blank" rel="noopener noreferrer" class="c-link">{{ seg.t }}</a>
            <span v-else :class="seg.c ? `c-${seg.c}` : undefined">{{ seg.t }}</span>
          </template>
        </div>
      </template>
      <div class="tl input-line">
        <span class="prompt">PS {{ winPath(session.cwd) }}&gt;&nbsp;</span>
        <input
          ref="inputEl"
          v-model="session.input"
          class="term-input"
          spellcheck="false"
          autocomplete="off"
          autocapitalize="off"
          aria-label="Command input"
          @keydown="onKey"
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.terminal {
  --tab-bg: #0c0c0c;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.terminal :deep(.ts-tab.active) {
  color: #f2f2f2;
  box-shadow: none;
}
.terminal :deep(.ts-tab.active .ts-close) {
  color: #cccccc;
}
.terminal :deep(.ts-tab.active .ts-close:hover) {
  background: rgba(255, 255, 255, 0.1);
}
.term-drop {
  display: grid;
  place-items: center;
  width: 32px;
  height: 28px;
  margin-bottom: 4px;
  border-radius: 6px;
}
.term-drop:hover {
  background: var(--subtle-hover);
}
.term-body {
  flex: 1;
  min-height: 0;
  padding: 6px 10px 12px;
  overflow-y: auto;
  background: #0c0c0c;
  color: #cccccc;
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.3;
  cursor: text;
  scrollbar-color: rgba(255, 255, 255, 0.35) transparent;
}
.tl {
  min-height: 1.3em;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.input-line {
  display: flex;
  white-space: pre;
}
.prompt {
  flex-shrink: 0;
}
.term-input {
  flex: 1;
  min-width: 40px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f2f2f2;
  font: inherit;
  caret-color: #cccccc;
  outline: none;
}
.term-body ::selection {
  background: #ffffff;
  color: #0c0c0c;
}
.fetch {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 36px;
  margin: 6px 0 10px;
  white-space: normal;
}
.fetch-logo {
  margin: 0;
  font: inherit;
  line-height: inherit;
}
.fetch-info > div {
  white-space: pre-wrap;
}
.b {
  font-weight: 700;
}
.swatches {
  display: flex;
  margin-top: 10px;
}
.swatches span {
  width: 24px;
  height: 18px;
}
.sw-1 { background: #0c0c0c; }
.sw-2 { background: #c50f1f; }
.sw-3 { background: #13a10e; }
.sw-4 { background: #c19c00; }
.sw-5 { background: #0037da; }
.sw-6 { background: #881798; }
.sw-7 { background: #3a96dd; }
.sw-8 { background: #cccccc; }
.c-red { color: #e74856; }
.c-green { color: #16c60c; }
.c-yellow { color: #f9f1a5; }
.c-blue { color: #3b78ff; }
.c-cyan { color: #61d6d6; }
.c-white { color: #f2f2f2; }
.c-gray { color: #a0a0a0; }
.c-darkgray { color: #505050; }
.c-link {
  color: #61d6d6;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
