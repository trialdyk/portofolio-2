<script setup lang="ts">
import { LAUNCHABLE_APPS } from '~/utils/apps'
import { PATHS, displayPath, searchableNodes } from '~/utils/fs'
import { profile, projects, socials } from '~/data/portfolio'

interface LaunchItem {
  id: string
  name: string
  icon: string
  kind: string
  detail?: string
  keywords?: string
  color?: string
  run: () => void
}

const os = useOs()
const wm = useWindows()
const shell = useShell()

const isOpen = computed(() => os.flyout.value === 'start' || os.flyout.value === 'search')
const query = ref('')
const view = ref<'home' | 'all'>('home')
const powerOpen = ref(false)
const highlighted = ref(0)
const input = ref<HTMLInputElement>()

watch(isOpen, (open) => {
  if (!open) return
  query.value = ''
  view.value = 'home'
  powerOpen.value = false
  highlighted.value = 0
  const coarse = window.matchMedia('(pointer: coarse)').matches
  if (!coarse || os.flyout.value === 'search') nextTick(() => input.value?.focus())
})
watch(query, () => (highlighted.value = 0))

const appItems: LaunchItem[] = LAUNCHABLE_APPS.map(a => ({
  id: `app:${a.id}`,
  name: a.name,
  icon: a.icon,
  kind: 'App',
  run: () => wm.openApp(a.id),
}))

const socialItems: LaunchItem[] = socials
  .filter(s => s.id !== 'email')
  .map(s => ({ id: `social:${s.id}`, name: s.name, icon: s.icon, color: s.color, kind: 'Website', detail: s.url, run: () => shell.openExternal(s.url) }))

const pinned: LaunchItem[] = [
  ...appItems,
  { id: 'about', name: 'About Me', icon: 'file-txt', kind: 'Document', run: () => shell.openNode(PATHS.about) },
  { id: 'resume', name: 'Resume', icon: 'file-pdf', kind: 'Document', run: () => shell.openNode(PATHS.resume) },
  { id: 'projects', name: 'Projects', icon: 'folder-projects', kind: 'Folder', run: () => shell.openNode(PATHS.projects) },
  { id: 'thispc', name: 'This PC', icon: 'this-pc', kind: 'Folder', run: () => shell.openNode(PATHS.thispc) },
  ...socialItems,
]

const RECENT_LABELS = ['2h ago', 'Yesterday at 9:41 PM', 'Monday at 4:12 PM', 'Last week']
const recommended: LaunchItem[] = [
  { id: 'r-about', name: 'about-me.txt', icon: 'file-txt', kind: 'Document', detail: 'Recently opened', run: () => shell.openNode(PATHS.about) },
  { id: 'r-resume', name: 'Resume.pdf', icon: 'file-pdf', kind: 'Document', detail: '1h ago', run: () => shell.openNode(PATHS.resume) },
  ...projects.slice(0, 4).map((p, i) => ({
    id: `r-${p.slug}`,
    name: p.name,
    icon: 'folder',
    kind: 'Project',
    detail: RECENT_LABELS[i],
    run: () => shell.openNode(`${PATHS.projects}/${p.name}`),
  })),
]

const settingsItems: LaunchItem[] = [
  { name: 'Personalization', page: 'personalization', keywords: 'theme dark light mode wallpaper background accent color' },
  { name: 'Installed apps (Skills)', page: 'apps', keywords: 'skills tech stack apps' },
  { name: 'Windows Update (Experience)', page: 'update', keywords: 'experience work career history jobs' },
  { name: 'Your info', page: 'accounts', keywords: 'profile account about me' },
  { name: 'Network & internet (Contact)', page: 'network', keywords: 'contact socials email github linkedin' },
  { name: 'Time & language', page: 'time', keywords: 'language location timezone' },
  { name: 'About this PC', page: 'about', keywords: 'specs device about system' },
].map(s => ({
  id: `settings:${s.page}`,
  name: s.name,
  icon: 'settings',
  kind: 'Settings',
  keywords: s.keywords,
  run: () => wm.openApp('settings', { page: s.page }),
}))

const fileItems: LaunchItem[] = searchableNodes().map(n => ({
  id: `file:${n.id}`,
  name: n.name,
  icon: n.icon,
  kind: n.project ? 'Project' : n.kind === 'file' ? 'Document' : 'Folder',
  detail: n.parent ? displayPath(n.parent) : undefined,
  keywords: n.project ? `${n.project.tech.join(' ')} ${n.project.summary}`.toLowerCase() : undefined,
  run: () => shell.openNode(n),
}))

const searchPool = [...appItems, ...settingsItems, ...socialItems, ...fileItems]
const KIND_ORDER = ['App', 'Project', 'Settings', 'Document', 'Folder', 'Website']

const results = computed<LaunchItem[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  const scored = searchPool
    .map((item) => {
      const name = item.name.toLowerCase()
      const score = name.startsWith(q) ? 3 : name.includes(q) ? 2 : item.keywords?.includes(q) ? 1 : 0
      return { item, score }
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score || KIND_ORDER.indexOf(a.item.kind) - KIND_ORDER.indexOf(b.item.kind))
  return scored.slice(0, 14).map(r => r.item)
})

const groupedResults = computed(() => {
  const [best, ...rest] = results.value
  const groups: { kind: string; items: LaunchItem[] }[] = []
  for (const item of rest) {
    let g = groups.find(x => x.kind === item.kind)
    if (!g) groups.push((g = { kind: item.kind, items: [] }))
    g.items.push(item)
  }
  groups.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind))
  return { best, groups }
})

const orderedResults = computed(() => {
  const { best, groups } = groupedResults.value
  return best ? [best, ...groups.flatMap(g => g.items)] : []
})
const preview = computed(() => orderedResults.value[highlighted.value] ?? orderedResults.value[0])

const allApps = computed(() => {
  const sorted = [...appItems].sort((a, b) => a.name.localeCompare(b.name))
  const groups: { letter: string; items: LaunchItem[] }[] = []
  for (const app of sorted) {
    const letter = app.name[0]!.toUpperCase()
    const g = groups.find(x => x.letter === letter)
    if (g) g.items.push(app)
    else groups.push({ letter, items: [app] })
  }
  return groups
})

function launch(item: LaunchItem | undefined) {
  if (!item) return
  os.closeOverlays()
  item.run()
}

function onKey(e: KeyboardEvent) {
  const count = orderedResults.value.length
  if (e.key === 'ArrowDown' && count) {
    e.preventDefault()
    highlighted.value = (highlighted.value + 1) % count
  }
  else if (e.key === 'ArrowUp' && count) {
    e.preventDefault()
    highlighted.value = (highlighted.value - 1 + count) % count
  }
  else if (e.key === 'Enter') {
    launch(orderedResults.value[highlighted.value])
  }
  else if (e.key === 'Escape') {
    os.closeOverlays()
  }
}

function openAccountMenu(e: MouseEvent) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  os.openMenu(r.left, r.top - 6, [
    {
      label: 'Change account settings',
      icon: 'fluent:person-settings-20-regular',
      action: () => {
        os.closeOverlays()
        wm.openApp('settings', { page: 'accounts' })
      },
    },
    { label: 'Lock', icon: 'fluent:lock-closed-20-regular', action: () => os.lock() },
    { label: 'Sign out', icon: 'fluent:sign-out-20-regular', action: () => os.signOut() },
  ], 'above')
}

function power(action: 'sleep' | 'shutdown' | 'restart') {
  powerOpen.value = false
  os.power(action)
}
</script>

<template>
  <Transition name="start">
    <div v-if="isOpen" class="start acrylic" data-flyout role="dialog" aria-label="Start">
      <div class="st-search">
        <Icon name="fluent:search-20-regular" size="16px" class="st-search-icon" />
        <input
          ref="input"
          v-model="query"
          class="st-input"
          placeholder="Search for apps, settings, and documents"
          aria-label="Search"
          @keydown="onKey"
        >
      </div>

      <div class="st-body">
        <template v-if="query.trim()">
          <div v-if="!results.length" class="st-empty">
            <Icon name="fluent:search-24-regular" size="40px" />
            <p>No results for “{{ query }}”</p>
          </div>
          <div v-else class="st-results">
            <div class="sr-list">
              <h3 class="st-h">Best match</h3>
              <button
                class="sr-best"
                :class="{ hl: orderedResults[highlighted] === groupedResults.best }"
                @mouseenter="highlighted = 0"
                @click="launch(groupedResults.best)"
              >
                <OsIcon :name="groupedResults.best!.icon" :size="32" :color="groupedResults.best!.color" />
                <span>
                  <b>{{ groupedResults.best!.name }}</b>
                  <small>{{ groupedResults.best!.kind }}</small>
                </span>
              </button>
              <template v-for="g in groupedResults.groups" :key="g.kind">
                <h3 class="st-h">{{ g.kind === 'Settings' ? 'Settings' : `${g.kind}s` }}</h3>
                <button
                  v-for="item in g.items"
                  :key="item.id"
                  class="sr-item"
                  :class="{ hl: orderedResults[highlighted] === item }"
                  @mouseenter="highlighted = orderedResults.indexOf(item)"
                  @click="launch(item)"
                >
                  <OsIcon :name="item.icon" :size="20" :color="item.color" />
                  <span class="sr-name">{{ item.name }}</span>
                  <Icon name="fluent:chevron-right-16-regular" size="12px" class="sr-chev" />
                </button>
              </template>
            </div>
            <aside v-if="preview" class="sr-preview">
              <div class="srp-head">
                <OsIcon :name="preview.icon" :size="64" :color="preview.color" />
                <b>{{ preview.name }}</b>
                <small>{{ preview.kind }}</small>
              </div>
              <div class="srp-actions">
                <button class="srp-action" @click="launch(preview)">
                  <Icon name="fluent:open-24-regular" size="16px" />
                  Open
                </button>
                <p v-if="preview.detail" class="srp-detail">
                  <Icon name="fluent:location-24-regular" size="16px" />
                  <span>{{ preview.detail }}</span>
                </p>
              </div>
            </aside>
          </div>
        </template>

        <template v-else-if="view === 'all'">
          <div class="st-section-head">
            <h3 class="st-title">All apps</h3>
            <button class="st-pill" @click="view = 'home'">
              <Icon name="fluent:chevron-left-16-regular" size="12px" />
              Back
            </button>
          </div>
          <div class="st-all">
            <template v-for="g in allApps" :key="g.letter">
              <div class="all-letter">{{ g.letter }}</div>
              <button v-for="app in g.items" :key="app.id" class="all-item" @click="launch(app)">
                <OsIcon :name="app.icon" :size="24" />
                <span>{{ app.name }}</span>
              </button>
            </template>
          </div>
        </template>

        <template v-else>
          <div class="st-section-head">
            <h3 class="st-title">Pinned</h3>
            <button class="st-pill" @click="view = 'all'">
              All apps
              <Icon name="fluent:chevron-right-16-regular" size="12px" />
            </button>
          </div>
          <div class="st-grid">
            <button v-for="item in pinned" :key="item.id" class="st-tile" @click="launch(item)">
              <OsIcon :name="item.icon" :size="32" :color="item.color" />
              <span>{{ item.name }}</span>
            </button>
          </div>
          <div class="st-section-head">
            <h3 class="st-title">Recommended</h3>
          </div>
          <div class="st-rec">
            <button v-for="item in recommended" :key="item.id" class="rec-item" @click="launch(item)">
              <OsIcon :name="item.icon" :size="32" />
              <span>
                <b>{{ item.name }}</b>
                <small>{{ item.detail }}</small>
              </span>
            </button>
          </div>
        </template>
      </div>

      <footer class="st-footer">
        <button class="st-user" @click="openAccountMenu">
          <OsAvatar :size="32" />
          <span>{{ profile.name }}</span>
        </button>
        <div class="st-power">
          <Transition name="menu-pop">
            <div v-if="powerOpen" class="fl-menu power-menu">
              <button class="fl-menu-item" @click="power('sleep')">
                <Icon name="fluent:weather-moon-24-regular" size="16px" />
                Sleep
              </button>
              <button class="fl-menu-item" @click="power('shutdown')">
                <Icon name="fluent:power-24-regular" size="16px" />
                Shut down
              </button>
              <button class="fl-menu-item" @click="power('restart')">
                <Icon name="fluent:arrow-counterclockwise-24-regular" size="16px" />
                Restart
              </button>
            </div>
          </Transition>
          <button class="fl-icon-btn st-power-btn" aria-label="Power" @click="powerOpen = !powerOpen">
            <Icon name="fluent:power-24-regular" size="18px" />
          </button>
        </div>
      </footer>
    </div>
  </Transition>
</template>

<style scoped>
.start {
  position: absolute;
  left: 50%;
  bottom: calc(var(--taskbar-h) + 12px);
  z-index: 1100;
  display: flex;
  flex-direction: column;
  width: min(640px, calc(100vw - 16px));
  height: min(726px, calc(100% - var(--taskbar-h) - 24px));
  margin-left: calc(min(640px, calc(100vw - 16px)) / -2);
  border-radius: var(--radius);
  border: 1px solid var(--stroke-2);
  box-shadow: var(--shadow-flyout);
  overflow: hidden;
}
.start-enter-active {
  transition: transform 0.28s var(--ease-out), opacity 0.2s ease;
}
.start-leave-active {
  transition: transform 0.18s ease-in, opacity 0.15s ease;
}
.start-enter-from,
.start-leave-to {
  opacity: 0;
  transform: translateY(60px);
}

.st-search {
  position: relative;
  flex-shrink: 0;
  margin: 32px 32px 8px;
}
.st-search-icon {
  position: absolute;
  top: 50%;
  left: 16px;
  color: var(--text-2);
  transform: translateY(-50%);
}
.st-input {
  width: 100%;
  height: 36px;
  padding: 0 16px 0 44px;
  border-radius: 18px;
  border: 1px solid var(--stroke);
  border-bottom-color: var(--text-3);
  background: var(--control);
  color: var(--text);
  font-size: 14px;
}
.st-input::placeholder {
  color: var(--text-2);
}
.st-input:focus {
  background: var(--input-focus);
  border-bottom: 2px solid var(--accent);
}

.st-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 32px 16px;
}
.st-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  margin-top: 8px;
  padding: 0 24px;
}
.st-title {
  font-size: 14px;
  font-weight: 600;
}
.st-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  background: var(--control);
  border: 1px solid var(--stroke);
  font-size: 12px;
}
.st-pill:hover {
  background: var(--control-hover);
}

.st-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  padding: 0 8px;
}
.st-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  height: 84px;
  padding: 12px 4px 0;
  border-radius: 4px;
  font-size: 12px;
  line-height: 16px;
}
.st-tile > span:last-child {
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.st-tile:hover,
.rec-item:hover,
.all-item:hover,
.sr-item:hover,
.st-user:hover {
  background: var(--subtle-hover);
}
.st-tile:active :deep(.os-icon) {
  transform: scale(0.88);
}

.st-rec {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 16px;
  padding: 0 16px;
}
.rec-item {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  height: 56px;
  padding: 0 12px;
  border-radius: 4px;
  text-align: left;
}
.rec-item > span:last-child,
.sr-best > span:last-child {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.rec-item b,
.sr-best b {
  overflow: hidden;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.rec-item small,
.sr-best small {
  color: var(--text-2);
  font-size: 12px;
  line-height: 16px;
}

.st-all {
  display: flex;
  flex-direction: column;
  padding: 0 48px;
}
.all-letter {
  padding: 12px 12px 4px;
  font-size: 14px;
  font-weight: 600;
}
.all-item {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 40px;
  padding: 0 12px;
  border-radius: 4px;
  font-size: 12px;
}

.st-empty {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding-top: 90px;
  color: var(--text-2);
}
.st-results {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 16px;
  padding-top: 8px;
}
.st-h {
  padding: 12px 8px 6px;
  font-size: 14px;
  font-weight: 600;
}
.sr-best {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  height: 64px;
  padding: 0 12px;
  border-radius: 4px;
  text-align: left;
}
.sr-best b {
  font-size: 14px;
  line-height: 20px;
}
.sr-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border-radius: 4px;
  font-size: 13px;
  text-align: left;
}
.sr-best.hl,
.sr-item.hl {
  background: var(--subtle-selected);
}
.sr-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.sr-chev {
  color: var(--text-3);
}
.sr-preview {
  align-self: start;
  margin-top: 12px;
  border-radius: 8px;
  background: var(--card);
  border: 1px solid var(--stroke);
  overflow: hidden;
}
.srp-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 16px 20px;
  text-align: center;
  border-bottom: 1px solid var(--divider);
}
.srp-head b {
  font-size: 16px;
  font-weight: 600;
  line-height: 22px;
  overflow-wrap: anywhere;
}
.srp-head small {
  margin-top: -6px;
  color: var(--text-2);
  font-size: 12px;
}
.srp-actions {
  padding: 8px;
}
.srp-action {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border-radius: 4px;
  color: var(--accent);
  font-size: 13px;
}
.srp-action:hover {
  background: var(--subtle-hover);
}
.srp-detail {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 12px;
  color: var(--text-2);
  font-size: 12px;
  line-height: 16px;
  overflow-wrap: anywhere;
}

.st-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: 64px;
  padding: 0 52px;
  background: var(--control-alt);
  border-top: 1px solid var(--divider);
}
.st-user {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 12px;
  border-radius: 4px;
  font-size: 12px;
}
.st-power {
  position: relative;
}
.st-power-btn {
  width: 40px;
  height: 40px;
}
.power-menu {
  position: absolute;
  right: -8px;
  bottom: calc(100% + 8px);
  min-width: 160px;
}
.menu-pop-enter-active {
  transition: opacity 0.12s ease, transform 0.2s var(--ease-out);
}
.menu-pop-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 640px) {
  .st-search { margin: 20px 16px 8px; }
  .st-body { padding: 0 8px 12px; }
  .st-section-head { padding: 0 12px; }
  .st-grid { grid-template-columns: repeat(4, 1fr); padding: 0; }
  .st-rec { grid-template-columns: 1fr; padding: 0; }
  .st-results { grid-template-columns: 1fr; }
  .sr-preview { display: none; }
  .st-all { padding: 0 12px; }
  .st-footer { padding: 0 16px; }
}
</style>
