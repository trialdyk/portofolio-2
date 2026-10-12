<script setup lang="ts">
import type { WinState } from '~/composables/useWindows'
import { RESUME_URL } from '~/utils/fs'
import { projectShots } from '~/utils/covers'
import { education, experience, profile, projects, skills, socials } from '~/data/portfolio'

const props = defineProps<{ win: WinState; active: boolean }>()
const wm = useWindows()
const os = useOs()
const shell = useShell()

const NEW_TAB = 'edge://newtab'
/** Sites that refuse to be embedded in an iframe (X-Frame-Options / CSP). */
const NO_EMBED = ['github.com', 'linkedin.com', 'instagram.com', 'x.com', 'twitter.com', 'facebook.com', 'google.com', 'bing.com', 'youtube.com', 'mail.google.com']

interface BrowserTab {
  id: number
  history: string[]
  index: number
  reload: number
}

function requestedUrl(p: Record<string, unknown>) {
  return typeof p.url === 'string' ? p.url : NEW_TAB
}

const initialUrl = requestedUrl(props.win.props)
let tabSeq = 1
const tabs = ref<BrowserTab[]>([{ id: 1, history: [initialUrl], index: 0, reload: 0 }])
const activeId = ref(1)
const addressText = ref(initialUrl === NEW_TAB ? '' : initialUrl)
const addressFocused = ref(false)
const pdfZoom = ref(100)
const favorited = ref(new Set<string>())
const newTabQuery = ref('')

const tab = computed(() => tabs.value.find(t => t.id === activeId.value) ?? tabs.value[0]!)
const url = computed(() => tab.value.history[tab.value.index]!)

function hostOf(u: string) {
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  }
  catch {
    return u
  }
}
function kindOf(u: string): 'newtab' | 'resume' | 'blocked' | 'web' {
  if (u === NEW_TAB) return 'newtab'
  if (u === RESUME_URL) return 'resume'
  const host = hostOf(u)
  return NO_EMBED.some(h => host === h || host.endsWith(`.${h}`)) ? 'blocked' : 'web'
}
function titleOf(u: string) {
  const kind = kindOf(u)
  if (kind === 'newtab') return 'New tab'
  if (kind === 'resume') return 'Resume.pdf'
  return hostOf(u)
}
function iconOf(u: string) {
  const kind = kindOf(u)
  if (kind === 'newtab') return 'edge'
  if (kind === 'resume') return 'file-pdf'
  return 'fluent:globe-20-regular'
}

const kind = computed(() => kindOf(url.value))
const tabItems = computed(() => tabs.value.map((t) => {
  const u = t.history[t.index]!
  return { id: t.id, title: titleOf(u), icon: iconOf(u) }
}))
const canBack = computed(() => tab.value.index > 0)
const canForward = computed(() => tab.value.index < tab.value.history.length - 1)
const isSecure = computed(() => url.value.startsWith('https://'))

watch([url, addressFocused], () => {
  if (!addressFocused.value) addressText.value = url.value === NEW_TAB ? '' : url.value
})
watch(url, u => wm.setTitle(props.win.id, `${titleOf(u)} - Microsoft Edge`), { immediate: true })

function openTab(u: string = NEW_TAB) {
  tabs.value.push({ id: ++tabSeq, history: [u], index: 0, reload: 0 })
  activeId.value = tabSeq
}

function closeTab(id: number) {
  if (tabs.value.length === 1) return wm.close(props.win.id)
  const i = tabs.value.findIndex(t => t.id === id)
  tabs.value.splice(i, 1)
  if (activeId.value === id) activeId.value = tabs.value[Math.max(0, i - 1)]!.id
}

function navigate(u: string) {
  const t = tab.value
  if (t.history[t.index] === u) return
  t.history.splice(t.index + 1)
  t.history.push(u)
  t.index = t.history.length - 1
}

watch(() => props.win.launch, () => {
  const requested = requestedUrl(props.win.props)
  const existing = tabs.value.find(t => t.history[t.index] === requested)
  if (existing) activeId.value = existing.id
  else if (requested !== NEW_TAB) openTab(requested)
})

function submitAddress(text: string) {
  const value = text.trim()
  if (!value) return
  ;(document.activeElement as HTMLElement | null)?.blur()
  if (value === NEW_TAB) return navigate(NEW_TAB)
  if (value === RESUME_URL || /resume\.pdf$/i.test(value)) return navigate(RESUME_URL)
  if (/^https?:\/\//i.test(value)) return navigate(value)
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(value)) return navigate(`https://${value}`)
  shell.openExternal(`https://www.bing.com/search?q=${encodeURIComponent(value)}`)
}

function toggleFavorite() {
  const next = new Set(favorited.value)
  if (next.has(url.value)) next.delete(url.value)
  else next.add(url.value)
  favorited.value = next
}

function openMore(e: MouseEvent) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  os.openMenu(r.right - 240, r.bottom + 4, [
    { label: 'New tab', icon: 'fluent:tab-add-24-regular', shortcut: 'Ctrl+T', action: () => openTab() },
    { label: 'New window', icon: 'fluent:window-new-24-regular', shortcut: 'Ctrl+N', disabled: true },
    { separator: true },
    { label: 'Open resume', icon: 'file-pdf', action: () => openTab(RESUME_URL) },
    { label: 'Open current page in real browser', icon: 'fluent:open-24-regular', disabled: url.value === NEW_TAB || url.value === RESUME_URL, action: () => shell.openExternal(url.value) },
    { separator: true },
    { label: 'About Microsoft Edge', icon: 'fluent:info-24-regular', action: () => shell.dialog({ title: 'About', message: 'A tiny browser look-alike for this portfolio. Real websites open inside when they allow embedding.', icon: 'info' }) },
  ])
}

const favorites = computed(() => [
  { label: 'Resume', icon: 'file-pdf', url: RESUME_URL },
  ...projects.filter(p => p.demo).map(p => ({ label: p.name, icon: 'fluent:globe-20-regular', url: p.demo! })),
  ...socials.filter(s => s.id !== 'email').map(s => ({ label: s.name, icon: s.icon, url: s.url })),
])

const quickLinks = computed(() => [
  { label: 'Resume', icon: 'file-pdf', run: () => navigate(RESUME_URL) },
  ...socials.map(s => ({ label: s.name, icon: s.icon, color: s.color, run: () => (s.id === 'email' ? wm.openApp('mail', { compose: true }) : shell.openExternal(s.url)) })),
  { label: 'Projects', icon: 'folder-projects', run: () => wm.openApp('explorer', { path: `C:/Users/${profile.username}/Projects` }) },
])

function openProject(p: (typeof projects)[number]) {
  if (p.demo) navigate(p.demo)
  else if (p.repo) shell.openExternal(p.repo)
  else wm.openApp('explorer', { path: `C:/Users/${profile.username}/Projects/${p.name}` })
}

function submitNewTabSearch() {
  const q = newTabQuery.value.trim()
  if (q) submitAddress(q)
  newTabQuery.value = ''
}

const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
})

const skillGroups = computed(() => {
  const cats = [...new Set(skills.map(s => s.category))]
  return cats.map(c => ({ category: c, names: skills.filter(s => s.category === c).map(s => s.name).join(', ') }))
})
</script>

<template>
  <div class="edge">
    <OsTabStrip :tabs="tabItems" :active="activeId" @select="(id) => (activeId = id)" @close="closeTab" @add="openTab()" />

    <div class="edge-toolbar">
      <button class="fl-icon-btn" :disabled="!canBack" aria-label="Back" @click="tab.index--">
        <Icon name="fluent:arrow-left-20-regular" size="16px" />
      </button>
      <button class="fl-icon-btn" :disabled="!canForward" aria-label="Forward" @click="tab.index++">
        <Icon name="fluent:arrow-right-20-regular" size="16px" />
      </button>
      <button class="fl-icon-btn" aria-label="Refresh" @click="tab.reload++">
        <Icon name="fluent:arrow-clockwise-20-regular" size="16px" />
      </button>
      <form class="edge-address" @submit.prevent="submitAddress(addressText)">
        <Icon
          :name="kind === 'newtab' ? 'fluent:search-20-regular' : isSecure ? 'fluent:lock-closed-16-regular' : 'fluent:info-16-regular'"
          size="14px"
          class="addr-lead"
        />
        <input
          v-model="addressText"
          placeholder="Search or enter web address"
          spellcheck="false"
          aria-label="Address and search bar"
          @focus="addressFocused = true; ($event.target as HTMLInputElement).select()"
          @blur="addressFocused = false"
        >
        <button v-if="kind !== 'newtab'" type="button" class="fl-icon-btn addr-star" :aria-label="favorited.has(url) ? 'Remove from favorites' : 'Add to favorites'" @click="toggleFavorite">
          <Icon :name="favorited.has(url) ? 'fluent:star-20-filled' : 'fluent:star-add-20-regular'" size="16px" :class="{ fav: favorited.has(url) }" />
        </button>
      </form>
      <button class="fl-icon-btn tb-extra" aria-label="Favorites"><Icon name="fluent:star-line-horizontal-3-20-regular" size="18px" /></button>
      <button class="fl-icon-btn tb-extra" aria-label="Collections"><Icon name="fluent:collections-20-regular" size="18px" /></button>
      <button class="fl-icon-btn" aria-label="Profile" @click="wm.openApp('settings', { page: 'accounts' })"><OsAvatar :size="22" /></button>
      <button class="fl-icon-btn" aria-label="Settings and more" @click="openMore">
        <Icon name="fluent:more-horizontal-20-regular" size="18px" />
      </button>
    </div>

    <div class="edge-favbar">
      <button v-for="f in favorites" :key="f.url" class="fav-item" :title="f.url" @click="navigate(f.url)">
        <OsIcon :name="f.icon" :size="16" />
        <span>{{ f.label }}</span>
      </button>
    </div>

    <div class="edge-view">
      <!-- New tab -->
      <div v-if="kind === 'newtab'" class="newtab" :style="{ backgroundImage: `url(${os.wallpaperInfo.value.src})` }">
        <div class="nt-inner">
          <h1 class="nt-greeting">{{ greeting }}</h1>
          <form class="nt-search" @submit.prevent="submitNewTabSearch">
            <Icon name="fluent:search-20-regular" size="18px" />
            <input v-model="newTabQuery" placeholder="Search the web" aria-label="Search the web">
          </form>
          <div class="nt-links">
            <button v-for="l in quickLinks" :key="l.label" class="nt-link" @click="l.run()">
              <span class="nt-link-icon"><OsIcon :name="l.icon" :size="24" :color="'color' in l ? l.color : undefined" /></span>
              <span>{{ l.label }}</span>
            </button>
          </div>
          <section class="nt-feed">
            <header class="nt-feed-head">
              <b>My projects</b>
              <span>{{ projects.length }} stories</span>
            </header>
            <div class="nt-cards">
              <button v-for="p in projects" :key="p.slug" class="nt-card" @click="openProject(p)">
                <img :src="projectShots(p)[0]" alt="" loading="lazy">
                <span class="nt-card-body">
                  <small>{{ p.year }} · {{ p.status }}</small>
                  <b>{{ p.name }}</b>
                  <span>{{ p.summary }}</span>
                  <span class="nt-tags">
                    <em v-for="t in p.tech.slice(0, 3)" :key="t">{{ t }}</em>
                  </span>
                </span>
              </button>
            </div>
          </section>
        </div>
      </div>

      <!-- Resume (PDF viewer) -->
      <div v-else-if="kind === 'resume'" class="pdf">
        <div class="pdf-toolbar">
          <button class="fl-icon-btn" aria-label="Table of contents" disabled><Icon name="fluent:text-bullet-list-ltr-20-regular" size="16px" /></button>
          <span class="pdf-page">1 of 1</span>
          <span class="pdf-sep" />
          <button class="fl-icon-btn" aria-label="Zoom out" @click="pdfZoom = Math.max(50, pdfZoom - 10)"><Icon name="fluent:subtract-20-regular" size="16px" /></button>
          <span class="pdf-zoom">{{ pdfZoom }}%</span>
          <button class="fl-icon-btn" aria-label="Zoom in" @click="pdfZoom = Math.min(200, pdfZoom + 10)"><Icon name="fluent:add-20-regular" size="16px" /></button>
          <button class="fl-icon-btn" aria-label="Fit to width" @click="pdfZoom = 100"><Icon name="fluent:arrow-autofit-width-20-regular" size="16px" /></button>
          <span class="pdf-spacer" />
          <a v-if="profile.resumeFile" class="fl-icon-btn" :href="profile.resumeFile" download aria-label="Save"><Icon name="fluent:save-20-regular" size="16px" /></a>
          <button v-else class="fl-icon-btn" aria-label="Save" disabled><Icon name="fluent:save-20-regular" size="16px" /></button>
        </div>
        <div class="pdf-scroll">
          <article
            class="paper selectable"
            :style="{ width: `${(800 * pdfZoom) / 100}px`, maxWidth: pdfZoom <= 100 ? '100%' : 'none', fontSize: `${(13 * pdfZoom) / 100}px` }"
          >
            <header class="cv-head">
              <h1>{{ profile.name }}</h1>
              <p class="cv-role">{{ profile.role }}</p>
              <p class="cv-contact">
                <span>{{ profile.location }}</span>
                <span v-for="s in socials" :key="s.id">{{ s.handle }}</span>
              </p>
            </header>
            <section>
              <h2>Summary</h2>
              <p>{{ profile.tagline }} Writing code since {{ profile.codingSince }}, focused on web and mobile apps built with Laravel, Vue.js, Nuxt.js, Golang and Flutter.</p>
            </section>
            <section>
              <h2>Experience</h2>
              <div v-for="e in experience" :key="`${e.company}-${e.start}`" class="cv-item">
                <div class="cv-item-head">
                  <b>{{ e.role }} — {{ e.company }}</b>
                  <span>{{ e.start }} – {{ e.end }}</span>
                </div>
                <p class="cv-muted">{{ e.location }} · {{ e.summary }}</p>
                <ul>
                  <li v-for="h in e.highlights" :key="h">{{ h }}</li>
                </ul>
              </div>
            </section>
            <section>
              <h2>Selected projects</h2>
              <div v-for="p in projects.slice(0, 4)" :key="p.slug" class="cv-item">
                <div class="cv-item-head">
                  <b>{{ p.name }}</b>
                  <span>{{ p.year }}</span>
                </div>
                <p>{{ p.summary }} <span class="cv-muted">({{ p.tech.join(', ') }})</span></p>
              </div>
            </section>
            <section>
              <h2>Skills</h2>
              <p v-for="g in skillGroups" :key="g.category"><b>{{ g.category }}:</b> {{ g.names }}</p>
            </section>
            <section>
              <h2>Education</h2>
              <div v-for="ed in education" :key="ed.school" class="cv-item-head">
                <b>{{ ed.degree }} — {{ ed.school }}</b>
                <span>{{ ed.start }} – {{ ed.end }}</span>
              </div>
            </section>
            <section>
              <h2>Languages</h2>
              <p>{{ profile.languages.map(l => `${l.name} (${l.level})`).join(' · ') }}</p>
            </section>
          </article>
        </div>
      </div>

      <!-- Site that can't be embedded -->
      <div v-else-if="kind === 'blocked'" class="blocked">
        <Icon name="fluent:globe-prohibited-20-regular" size="64px" />
        <h2>{{ hostOf(url) }} can't be shown here</h2>
        <p>This site doesn't allow being displayed inside other pages. You can open it in a new browser tab instead.</p>
        <button class="fl-btn accent" @click="shell.openExternal(url)">
          <Icon name="fluent:open-20-regular" size="16px" />
          Open in new tab
        </button>
      </div>

      <!-- Web page -->
      <template v-else>
        <div class="infobar">
          <Icon name="fluent:info-16-regular" size="16px" />
          <span>Some websites don't allow being displayed inside this window.</span>
          <button class="fl-link" @click="shell.openExternal(url)">Open in new tab</button>
        </div>
        <iframe
          :key="`${tab.id}-${tab.index}-${tab.reload}`"
          :src="url"
          class="web-frame"
          title="Web page"
          referrerpolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.edge {
  --tab-bg: var(--layer);
  display: flex;
  flex-direction: column;
  height: 100%;
  container-type: inline-size;
}
.edge-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  height: 44px;
  padding: 0 8px;
  background: var(--layer);
}
.edge-address {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  height: 32px;
  margin: 0 6px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--stroke);
}
.edge-address:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}
.addr-lead {
  flex-shrink: 0;
  margin: 0 8px 0 14px;
  color: var(--text-2);
}
.edge-address input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  font-size: 13px;
}
.edge-address input::placeholder {
  color: var(--text-2);
}
.addr-star {
  width: 28px;
  height: 28px;
  margin-right: 2px;
  border-radius: 14px;
}
.fav {
  color: #f7b500;
}
.edge-favbar {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  height: 32px;
  padding: 0 10px;
  background: var(--layer);
  border-bottom: 1px solid var(--divider);
  overflow: hidden;
}
.fav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  height: 26px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 12px;
}
.fav-item:hover {
  background: var(--subtle-hover);
}
.edge-view {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: var(--surface);
}

.newtab {
  flex: 1;
  overflow-y: auto;
  background-size: cover;
  background-position: center;
  background-attachment: local;
}
.nt-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100%;
  padding: 48px 24px 32px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.35));
}
.nt-greeting {
  color: #fff;
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.nt-search {
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(620px, 100%);
  height: 48px;
  margin-top: 20px;
  padding: 0 20px;
  border-radius: 24px;
  background: var(--card-solid);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  color: var(--text-2);
}
.nt-search input {
  flex: 1;
  height: 100%;
  border: 0;
  background: transparent;
  color: var(--text);
  font-size: 15px;
}
.nt-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 28px;
}
.nt-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 84px;
  padding: 10px 4px;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}
.nt-link:hover {
  background: rgba(255, 255, 255, 0.14);
}
.nt-link-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--card-solid);
  color: var(--text);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}
.nt-feed {
  width: min(1040px, 100%);
  margin-top: 36px;
  padding: 16px;
  border-radius: 12px;
  background: var(--acrylic-strong);
  -webkit-backdrop-filter: blur(30px);
  backdrop-filter: blur(30px);
}
.nt-feed-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 0 4px 12px;
}
.nt-feed-head b {
  font-size: 16px;
  font-weight: 600;
}
.nt-feed-head span {
  color: var(--text-2);
  font-size: 12px;
}
.nt-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.nt-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  background: var(--card-solid);
  border: 1px solid var(--stroke);
  text-align: left;
  transition: transform 0.15s var(--ease-out), box-shadow 0.15s;
}
.nt-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
}
.nt-card img {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
}
.nt-card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px 14px;
  font-size: 12px;
  line-height: 17px;
}
.nt-card-body small {
  color: var(--text-2);
}
.nt-card-body b {
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
}
.nt-card-body > span {
  color: var(--text-2);
}
.nt-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.nt-tags em {
  padding: 1px 8px;
  border-radius: 10px;
  background: var(--sel-bg);
  color: var(--text);
  font-style: normal;
}

.pdf {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.pdf-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  height: 40px;
  padding: 0 10px;
  background: var(--layer);
  border-bottom: 1px solid var(--divider);
  font-size: 13px;
}
.pdf-page,
.pdf-zoom {
  padding: 0 8px;
}
.pdf-sep {
  width: 1px;
  height: 20px;
  margin: 0 6px;
  background: var(--divider);
}
.pdf-spacer {
  flex: 1;
}
.pdf-scroll {
  flex: 1;
  min-height: 0;
  padding: 24px;
  overflow: auto;
  background: #e6e6e6;
}
[data-theme='dark'] .pdf-scroll {
  background: #3b3b3b;
}
.paper {
  max-width: none;
  min-height: 1000px;
  margin: 0 auto;
  padding: 4.5em 5em;
  background: #fff;
  color: #1f2328;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  font-family: var(--font);
  line-height: 1.55;
}
.paper h1 {
  font-family: var(--font-display);
  font-size: 2.6em;
  font-weight: 700;
  line-height: 1.1;
}
.cv-role {
  margin-top: 0.3em;
  color: #0f6cbd;
  font-size: 1.25em;
  font-weight: 600;
}
.cv-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4em 1.2em;
  margin-top: 0.8em;
  color: #57606a;
}
.cv-head {
  padding-bottom: 1.4em;
  border-bottom: 2px solid #0f6cbd;
}
.paper section {
  margin-top: 1.6em;
}
.paper h2 {
  margin-bottom: 0.6em;
  color: #0f6cbd;
  font-size: 0.95em;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.cv-item {
  margin-bottom: 1em;
}
.cv-item-head {
  display: flex;
  justify-content: space-between;
  gap: 1em;
}
.cv-item-head span,
.cv-muted {
  color: #57606a;
}
.paper ul {
  margin: 0.3em 0 0;
  padding-left: 1.3em;
}

.blocked {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
  padding: 24px;
  color: var(--text-2);
  text-align: center;
}
.blocked h2 {
  color: var(--text);
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
}
.blocked p {
  max-width: 420px;
}
.infobar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  min-height: 36px;
  padding: 4px 14px;
  background: var(--layer);
  border-bottom: 1px solid var(--divider);
  font-size: 12px;
}
.web-frame {
  flex: 1;
  width: 100%;
  border: 0;
  background: #fff;
}

@container (max-width: 640px) {
  .tb-extra,
  .edge-favbar {
    display: none;
  }
  .paper {
    padding: 2.5em 2em;
  }
}
</style>
