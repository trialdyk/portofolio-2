<script setup lang="ts">
import type { WinState } from '~/composables/useWindows'
import type { Skill } from '~/data/portfolio'
import { ACCENTS, WALLPAPERS, type ThemeMode } from '~/utils/theme'
import { RESUME_URL } from '~/utils/fs'
import { deviceSpecs, education, experience, learning, profile, skills, socials } from '~/data/portfolio'

const props = defineProps<{ win: WinState; active: boolean }>()
const wm = useWindows()
const os = useOs()
const shell = useShell()

type Page = 'system' | 'about' | 'network' | 'personalization' | 'apps' | 'accounts' | 'time' | 'update'

const NAV: { id: Page; label: string; icon: string; color: string; keywords: string }[] = [
  { id: 'system', label: 'System', icon: 'fluent:laptop-24-filled', color: '#0078d4', keywords: 'about specs display sound night light device' },
  { id: 'network', label: 'Network & internet', icon: 'fluent:wifi-1-24-filled', color: '#0f6cbd', keywords: 'contact socials github linkedin email' },
  { id: 'personalization', label: 'Personalization', icon: 'fluent:paint-brush-24-filled', color: '#d97706', keywords: 'theme dark light wallpaper background accent color' },
  { id: 'apps', label: 'Apps', icon: 'fluent:apps-24-filled', color: '#6b69d6', keywords: 'skills tech stack installed' },
  { id: 'accounts', label: 'Accounts', icon: 'fluent:person-24-filled', color: '#10893e', keywords: 'profile your info resume' },
  { id: 'time', label: 'Time & language', icon: 'fluent:globe-clock-24-filled', color: '#0078d4', keywords: 'language location timezone clock' },
  { id: 'update', label: 'Windows Update', icon: 'fluent:arrow-sync-circle-24-filled', color: '#0078d4', keywords: 'experience work career history' },
]
const PAGE_IDS = new Set<string>([...NAV.map(n => n.id), 'about'])

const PAGE_TITLES: Record<Page, [string, string?]> = {
  system: ['System'],
  about: ['System', 'About'],
  network: ['Network & internet'],
  personalization: ['Personalization'],
  apps: ['Apps', 'Installed apps'],
  accounts: ['Accounts', 'Your info'],
  time: ['Time & language'],
  update: ['Windows Update'],
}
const PARENT_PAGE: Partial<Record<Page, Page>> = { about: 'system' }

const page = ref<Page>('system')
const navSearch = ref('')
const contentEl = ref<HTMLElement>()

function go(p: Page) {
  page.value = p
  contentEl.value?.scrollTo({ top: 0 })
}

function handleLaunch(p: Record<string, unknown>) {
  if (typeof p.page === 'string' && PAGE_IDS.has(p.page)) go(p.page as Page)
}
handleLaunch(props.win.props)
watch(() => props.win.launch, () => handleLaunch(props.win.props))

const navActive = computed(() => PARENT_PAGE[page.value] ?? page.value)
const filteredNav = computed(() => {
  const q = navSearch.value.trim().toLowerCase()
  return q ? NAV.filter(n => n.label.toLowerCase().includes(q) || n.keywords.includes(q)) : NAV
})
function submitNavSearch() {
  const first = filteredNav.value[0]
  if (first) {
    go(first.id)
    navSearch.value = ''
  }
}

const deviceName = deviceSpecs[0]?.[1] ?? 'PORTFOLIO-PC'
const yearsCoding = new Date().getFullYear() - profile.codingSince
const windowsSpecs: [string, string][] = [
  ['Edition', 'Portfolio 11 Pro'],
  ['Version', String(new Date().getFullYear())],
  ['Installed on', String(profile.codingSince)],
  ['OS build', 'Nuxt 4 · Vue 3 · Bun'],
  ['Experience', `${yearsCoding}+ years of hands-on development`],
]

const copied = ref(false)
function copySpecs() {
  const text = [...deviceSpecs, ...windowsSpecs].map(([k, v]) => `${k}\t${v}`).join('\n')
  navigator.clipboard?.writeText(text).then(() => {
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  }).catch(() => {})
}

// Apps (skills)
const appSearch = ref('')
const appCategory = ref('All')
const appSort = ref<'level' | 'name' | 'since'>('level')
const categories = ['All', ...new Set(skills.map(s => s.category))]
const filteredSkills = computed(() => {
  const q = appSearch.value.trim().toLowerCase()
  return skills
    .filter(s => (appCategory.value === 'All' || s.category === appCategory.value) && s.name.toLowerCase().includes(q))
    .sort((a, b) => {
      if (appSort.value === 'name') return a.name.localeCompare(b.name)
      if (appSort.value === 'since') return a.since - b.since
      return b.level - a.level
    })
})
function skillMenu(e: MouseEvent, skill: Skill) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  os.openMenu(r.left - 120, r.bottom + 4, [
    { label: 'Advanced options', disabled: true },
    { label: 'Modify', disabled: true },
    {
      label: 'Uninstall',
      action: () => shell.dialog({ title: `Uninstall ${skill.name}`, message: `${skill.name} can't be uninstalled — it's a core part of this developer. 😉`, icon: 'info' }),
    },
  ])
}

// Time & language
const now = ref(new Date())
let clock: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  clock = setInterval(() => (now.value = new Date()), 1000)
})
onBeforeUnmount(() => clearInterval(clock))
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

// Windows Update
const updateState = ref<'idle' | 'checking' | 'available'>('idle')
const lastChecked = ref(new Date(Date.now() - 2 * 3600 * 1000))
const expanded = ref<number | null>(0)
const LEARNING_PROGRESS = [37, 62, 18, 80, 45]
function checkUpdates() {
  updateState.value = 'checking'
  setTimeout(() => {
    updateState.value = 'available'
    lastChecked.value = new Date()
  }, 2200)
}

function setMode(e: Event) {
  os.setTheme((e.target as HTMLSelectElement).value as ThemeMode)
}

const contactEmail = () => wm.openApp('mail', { compose: true })
</script>

<template>
  <div class="settings">
    <aside class="set-side">
      <button class="set-user" @click="go('accounts')">
        <OsAvatar :size="64" />
        <span class="set-user-text">
          <b>{{ profile.name }}</b>
          <small>{{ profile.email }}</small>
        </span>
      </button>
      <label class="set-find">
        <input v-model="navSearch" class="fl-input" placeholder="Find a setting" @keydown.enter="submitNavSearch">
        <Icon name="fluent:search-20-regular" size="14px" />
      </label>
      <nav class="set-nav">
        <button v-for="n in filteredNav" :key="n.id" class="nav-btn" :class="{ on: navActive === n.id }" :title="n.label" @click="go(n.id)">
          <Icon :name="n.icon" size="18px" :style="{ color: n.color }" />
          <span class="nav-label">{{ n.label }}</span>
        </button>
      </nav>
    </aside>

    <main ref="contentEl" class="set-main">
      <h1 class="set-title">
        <template v-if="PAGE_TITLES[page][1]">
          <button class="crumb" :class="{ link: PARENT_PAGE[page] }" @click="PARENT_PAGE[page] && go(PARENT_PAGE[page]!)">{{ PAGE_TITLES[page][0] }}</button>
          <Icon name="fluent:chevron-right-20-regular" size="18px" class="crumb-sep" />
          <span>{{ PAGE_TITLES[page][1] }}</span>
        </template>
        <span v-else>{{ PAGE_TITLES[page][0] }}</span>
      </h1>

      <!-- System -->
      <div v-if="page === 'system'" class="set-stack">
        <div class="hero">
          <div class="device">
            <div class="device-screen" :style="{ backgroundImage: `url(${os.wallpaperInfo.value.src})` }" />
          </div>
          <div class="hero-info">
            <b>{{ deviceName }}</b>
            <span>{{ profile.role }}</span>
            <button class="fl-link" @click="go('about')">Rename</button>
          </div>
          <div class="hero-tiles">
            <button class="hero-tile" @click="go('update')">
              <Icon name="fluent:arrow-sync-circle-24-filled" size="24px" class="accent-icon" />
              <span><b>Windows Update</b><small>Last checked: {{ lastChecked.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }}</small></span>
            </button>
            <button class="hero-tile" @click="go('network')">
              <Icon name="fluent:wifi-1-24-filled" size="24px" class="accent-icon" />
              <span><b>Portfolio-5G</b><small>Connected, secured</small></span>
            </button>
          </div>
        </div>
        <OsSettingRow icon="fluent:desktop-24-regular" title="Display" subtitle="Theme, wallpaper, accent color" clickable @click="go('personalization')" />
        <OsSettingRow icon="fluent:speaker-2-24-regular" title="Sound" subtitle="Volume levels, output">
          <input v-model.number="os.quick.value.volume" class="fl-slider set-slider" type="range" min="0" max="100" aria-label="Volume" :style="{ '--val': `${os.quick.value.volume}%` }">
        </OsSettingRow>
        <OsSettingRow icon="fluent:weather-moon-24-regular" title="Night light" subtitle="Use warmer colors to help block blue light">
          <span>{{ os.quick.value.nightLight ? 'On' : 'Off' }}</span>
          <button class="fl-toggle" :class="{ on: os.quick.value.nightLight }" role="switch" :aria-checked="os.quick.value.nightLight" aria-label="Night light" @click="os.quick.value.nightLight = !os.quick.value.nightLight" />
        </OsSettingRow>
        <OsSettingRow icon="fluent:info-24-regular" title="About" subtitle="Device specifications, developer details" clickable @click="go('about')" />
      </div>

      <!-- About -->
      <div v-else-if="page === 'about'" class="set-stack">
        <div class="hero small">
          <div class="device">
            <div class="device-screen" :style="{ backgroundImage: `url(${os.wallpaperInfo.value.src})` }" />
          </div>
          <div class="hero-info">
            <b>{{ deviceName }}</b>
            <span>Portfolio 11 Pro</span>
          </div>
        </div>
        <section class="card">
          <header class="card-head">
            <Icon name="fluent:laptop-24-regular" size="20px" />
            <b>Device specifications</b>
            <button class="fl-btn" @click="copySpecs">{{ copied ? 'Copied' : 'Copy' }}</button>
          </header>
          <dl class="spec-list selectable">
            <template v-for="[k, v] in deviceSpecs" :key="k">
              <dt>{{ k }}</dt>
              <dd>{{ v }}</dd>
            </template>
          </dl>
        </section>
        <section class="card">
          <header class="card-head">
            <OsIcon name="windows" :size="20" />
            <b>Windows specifications</b>
          </header>
          <dl class="spec-list selectable">
            <template v-for="[k, v] in windowsSpecs" :key="k">
              <dt>{{ k }}</dt>
              <dd>{{ v }}</dd>
            </template>
          </dl>
        </section>
        <h2 class="set-section">Related</h2>
        <OsSettingRow icon="fluent:document-pdf-24-regular" title="Resume" subtitle="View my resume in Microsoft Edge" clickable @click="wm.openApp('edge', { url: RESUME_URL })" />
        <OsSettingRow icon="fluent:code-24-regular" title="Installed skills" subtitle="Everything in my tech stack" clickable @click="go('apps')" />
      </div>

      <!-- Personalization -->
      <div v-else-if="page === 'personalization'" class="set-stack">
        <div class="pz-hero">
          <div class="pz-preview" :style="{ backgroundImage: `url(${os.wallpaperInfo.value.src})` }">
            <div class="pz-window">
              <div class="pz-window-bar" />
              <div class="pz-window-line accent" />
              <div class="pz-window-line" />
              <div class="pz-window-line short" />
            </div>
            <div class="pz-taskbar">
              <span v-for="n in 5" :key="n" :class="{ accent: n === 3 }" />
            </div>
          </div>
          <div class="pz-themes">
            <b>Select a theme to apply</b>
            <div class="pz-theme-grid">
              <button
                v-for="w in WALLPAPERS"
                :key="w.id"
                class="pz-theme"
                :class="{ on: os.wallpaperInfo.value.id === w.id && os.theme.value === w.theme }"
                :title="w.name"
                :style="{ backgroundImage: `url(${w.src})` }"
                @click="os.applyPreset(w)"
              >
                <span class="pz-theme-win" :class="w.theme">
                  <span :style="{ background: w.accent }" />
                </span>
              </button>
            </div>
          </div>
        </div>

        <h2 class="set-section">Background</h2>
        <OsSettingRow icon="fluent:image-24-regular" title="Personalize your background" subtitle="A picture background applies to your current desktop">
          <select class="fl-select" :value="os.wallpaper.value" @change="os.setWallpaper(($event.target as HTMLSelectElement).value)">
            <option value="auto">Windows (match theme)</option>
            <option v-for="w in WALLPAPERS" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </OsSettingRow>
        <div class="wall-grid">
          <button
            v-for="w in WALLPAPERS"
            :key="w.id"
            class="wall-thumb"
            :class="{ on: os.wallpaperInfo.value.id === w.id }"
            :title="w.name"
            :style="{ backgroundImage: `url(${w.src})` }"
            @click="os.setWallpaper(w.id)"
          />
        </div>

        <h2 class="set-section">Colors</h2>
        <OsSettingRow icon="fluent:dark-theme-24-regular" title="Choose your mode" subtitle="Change the colors that appear in Windows and your apps">
          <select class="fl-select" :value="os.theme.value" @change="setMode">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </OsSettingRow>
        <div class="set-row-block">
          <div class="srb-head">
            <Icon name="fluent:color-24-regular" size="20px" />
            <span>
              <span class="srb-title">Accent color</span>
              <span class="srb-sub">Used for highlights, buttons and the Start menu</span>
            </span>
          </div>
          <div class="accent-grid">
            <button
              v-for="a in ACCENTS"
              :key="a.base"
              class="accent-swatch"
              :class="{ on: os.accent.value === a.base }"
              :style="{ background: a.base }"
              :aria-label="`Accent ${a.base}`"
              @click="os.setAccent(a.base)"
            >
              <Icon v-if="os.accent.value === a.base" name="fluent:checkmark-16-regular" size="16px" />
            </button>
          </div>
        </div>
      </div>

      <!-- Apps / Skills -->
      <div v-else-if="page === 'apps'" class="set-stack">
        <div class="apps-toolbar">
          <label class="apps-search">
            <input v-model="appSearch" class="fl-input" placeholder="Search apps">
            <Icon name="fluent:search-20-regular" size="14px" />
          </label>
          <label class="apps-filter">
            <span>Filter by:</span>
            <select v-model="appCategory" class="fl-select">
              <option v-for="c in categories" :key="c" :value="c">{{ c === 'All' ? 'All categories' : c }}</option>
            </select>
          </label>
          <label class="apps-filter">
            <span>Sort by:</span>
            <select v-model="appSort" class="fl-select">
              <option value="level">Proficiency</option>
              <option value="name">Name (A to Z)</option>
              <option value="since">Install date</option>
            </select>
          </label>
        </div>
        <p class="apps-count">{{ filteredSkills.length }} apps found</p>
        <div v-for="s in filteredSkills" :key="s.name" class="skill-row">
          <OsIcon :name="s.icon" :size="32" />
          <span class="skill-text">
            <span class="skill-name">{{ s.name }}</span>
            <span class="skill-sub">{{ s.category }} | Installed {{ s.since }}</span>
          </span>
          <span class="skill-level">
            <span class="skill-bar"><span :style="{ width: `${s.level}%` }" /></span>
            <span>{{ s.level }}%</span>
          </span>
          <button class="fl-icon-btn" aria-label="More options" @click="skillMenu($event, s)">
            <Icon name="fluent:more-horizontal-20-regular" size="16px" />
          </button>
        </div>
      </div>

      <!-- Accounts -->
      <div v-else-if="page === 'accounts'" class="set-stack">
        <div class="acc-hero">
          <OsAvatar :size="96" />
          <div class="acc-info">
            <b>{{ profile.name }}</b>
            <span>{{ profile.role }}</span>
            <span>{{ profile.email }}</span>
            <span class="acc-badge" :class="{ on: profile.openToWork }">
              <Icon :name="profile.openToWork ? 'fluent:checkmark-circle-16-filled' : 'fluent:info-16-regular'" size="14px" />
              {{ profile.openToWork ? 'Open to work' : 'Not looking right now' }}
            </span>
          </div>
        </div>
        <h2 class="set-section">Account settings</h2>
        <OsSettingRow icon="fluent:mail-24-regular" title="Email" :subtitle="profile.email">
          <button class="fl-btn" @click="contactEmail">Send email</button>
        </OsSettingRow>
        <OsSettingRow icon="fluent:location-24-regular" title="Location" :subtitle="profile.location" />
        <OsSettingRow icon="fluent:document-pdf-24-regular" title="Resume" subtitle="My latest CV">
          <button class="fl-btn" @click="wm.openApp('edge', { url: RESUME_URL })">View</button>
          <a v-if="profile.resumeFile" class="fl-btn accent" :href="profile.resumeFile" download>Download</a>
        </OsSettingRow>
        <OsSettingRow icon="fluent:heart-24-regular" title="Interests" :subtitle="profile.interests.join(' · ')" />
        <h2 class="set-section">Related settings</h2>
        <OsSettingRow icon="fluent:wifi-1-24-regular" title="Social profiles" subtitle="GitHub, LinkedIn and more" clickable @click="go('network')" />
        <OsSettingRow icon="fluent:arrow-sync-circle-24-regular" title="Work experience" subtitle="See my update history" clickable @click="go('update')" />
      </div>

      <!-- Network -->
      <div v-else-if="page === 'network'" class="set-stack">
        <div class="net-hero">
          <Icon :name="os.quick.value.wifi && !os.quick.value.airplane ? 'fluent:wifi-1-24-regular' : 'fluent:wifi-off-24-regular'" size="44px" class="accent-icon" />
          <div class="hero-info">
            <b>{{ os.quick.value.wifi && !os.quick.value.airplane ? 'Portfolio-5G' : 'Not connected' }}</b>
            <span>{{ os.quick.value.wifi && !os.quick.value.airplane ? 'Connected, secured — always happy to connect with you' : 'Turn on Wi-Fi in Quick Settings' }}</span>
          </div>
        </div>
        <h2 class="set-section">Connections</h2>
        <OsSettingRow v-for="s in socials" :key="s.id" :icon="s.icon" :title="s.name" :subtitle="s.handle">
          <span class="net-status">Connected</span>
          <button v-if="s.id === 'email'" class="fl-btn" @click="contactEmail">Compose</button>
          <button v-else class="fl-btn" @click="shell.openExternal(s.url)">Open</button>
        </OsSettingRow>
      </div>

      <!-- Time & language -->
      <div v-else-if="page === 'time'" class="set-stack">
        <div class="time-hero">
          <b>{{ now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }}</b>
          <span>{{ now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) }}</span>
        </div>
        <OsSettingRow icon="fluent:globe-clock-24-regular" title="Time zone" :subtitle="timeZone" />
        <OsSettingRow icon="fluent:location-24-regular" title="Based in" :subtitle="profile.location" />
        <h2 class="set-section">Preferred languages</h2>
        <OsSettingRow v-for="l in profile.languages" :key="l.name" icon="fluent:local-language-24-regular" :title="l.name" :subtitle="l.level" />
      </div>

      <!-- Windows Update -->
      <div v-else-if="page === 'update'" class="set-stack">
        <div class="upd-hero">
          <div class="upd-icon" :class="{ spinning: updateState === 'checking' }">
            <Icon name="fluent:arrow-sync-circle-24-filled" size="56px" class="accent-icon" />
          </div>
          <div class="hero-info">
            <b v-if="updateState === 'idle'">You're up to date</b>
            <b v-else-if="updateState === 'checking'">Checking for updates...</b>
            <b v-else>Updates available</b>
            <span>Last checked: Today, {{ lastChecked.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }}</span>
          </div>
          <button class="fl-btn accent upd-btn" :disabled="updateState === 'checking'" @click="checkUpdates">
            {{ updateState === 'available' ? 'Check again' : 'Check for updates' }}
          </button>
        </div>
        <div v-if="updateState === 'checking'" class="upd-progress"><span /></div>
        <template v-if="updateState === 'available'">
          <div v-for="(item, i) in learning" :key="item" class="upd-item">
            <Icon name="fluent:arrow-download-24-regular" size="20px" />
            <span class="upd-item-text">
              <span>Skill update: {{ item }}</span>
              <small>Downloading — {{ LEARNING_PROGRESS[i % LEARNING_PROGRESS.length] }}% · currently learning</small>
            </span>
            <span class="upd-bar"><span :style="{ width: `${LEARNING_PROGRESS[i % LEARNING_PROGRESS.length]}%` }" /></span>
          </div>
        </template>

        <h2 class="set-section">Update history</h2>
        <p class="upd-group">Feature updates (work experience)</p>
        <div v-for="(e, i) in experience" :key="`${e.company}-${e.start}`" class="upd-history">
          <OsSettingRow
            icon="fluent:briefcase-24-regular"
            :title="`${e.role} — ${e.company}`"
            :subtitle="`Successfully installed ${e.start} – ${e.end} · ${e.location}`"
            clickable
            :expanded="expanded === i"
            @click="expanded = expanded === i ? null : i"
          />
          <div v-if="expanded === i" class="upd-details selectable">
            <p>{{ e.summary }}</p>
            <ul>
              <li v-for="h in e.highlights" :key="h">{{ h }}</li>
            </ul>
          </div>
        </div>
        <p class="upd-group">Quality updates (education)</p>
        <OsSettingRow
          v-for="ed in education"
          :key="ed.school"
          icon="fluent:hat-graduation-24-regular"
          :title="ed.degree"
          :subtitle="`${ed.school} · ${ed.start} – ${ed.end}`"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.settings {
  display: flex;
  height: 100%;
  container-type: inline-size;
}
.set-side {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 290px;
  padding: 0 8px 12px 14px;
  overflow-y: auto;
}
.set-user {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 8px 16px;
  border-radius: 4px;
  text-align: left;
}
.set-user-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.set-user-text b {
  font-size: 14px;
  font-weight: 600;
}
.set-user-text small {
  overflow: hidden;
  color: var(--text-2);
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.set-find {
  position: relative;
  display: block;
  margin: 0 4px 14px;
}
.set-find .fl-input {
  padding-right: 32px;
}
.set-find :deep(.iconify) {
  position: absolute;
  top: 50%;
  right: 10px;
  color: var(--text-2);
  transform: translateY(-50%);
}
.nav-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  height: 36px;
  margin: 2px 0;
  padding: 0 14px;
  border-radius: 4px;
  font-size: 14px;
  text-align: left;
}
.nav-btn:hover {
  background: var(--subtle-hover);
}
.nav-btn.on {
  background: var(--subtle-selected);
}
.nav-btn.on::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 3px;
  height: 16px;
  margin-top: -8px;
  border-radius: 2px;
  background: var(--accent);
}
.nav-label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.set-main {
  flex: 1;
  min-width: 0;
  padding: 0 36px 40px 24px;
  overflow-y: auto;
}
.set-title {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0 22px;
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 600;
  line-height: 36px;
}
.crumb {
  color: var(--text-2);
  font: inherit;
}
.crumb.link:hover {
  color: var(--text);
}
.crumb-sep {
  color: var(--text-2);
}
.set-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 1000px;
}
.set-section {
  margin: 24px 0 6px;
  font-size: 14px;
  font-weight: 600;
}
.accent-icon {
  color: var(--accent);
}

.hero {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  padding: 0 0 20px;
}
.device {
  width: 190px;
  padding: 6px;
  border-radius: 8px;
  background: #1b1b1b;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
.hero.small .device {
  width: 150px;
}
.device-screen {
  aspect-ratio: 16 / 10;
  border-radius: 3px;
  background-size: cover;
  background-position: center;
}
.hero-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
}
.hero-info b {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
}
.hero-info span {
  color: var(--text-2);
  font-size: 13px;
}
.hero-info .fl-link {
  margin-top: 4px;
  font-size: 13px;
}
.hero-tiles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}
.hero-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
  padding: 12px 16px;
  border-radius: 6px;
  background: var(--card);
  border: 1px solid var(--stroke);
  text-align: left;
}
.hero-tile:hover {
  background: var(--card-hover);
}
.hero-tile > span:last-child {
  display: flex;
  flex-direction: column;
}
.hero-tile b {
  font-size: 14px;
  font-weight: 600;
}
.hero-tile small {
  color: var(--text-2);
  font-size: 12px;
}
.set-slider {
  width: 180px;
}

.card {
  border-radius: 4px;
  background: var(--card);
  border: 1px solid var(--stroke);
}
.card-head {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 60px;
  padding: 10px 16px 10px 18px;
  border-bottom: 1px solid var(--divider);
}
.card-head b {
  flex: 1;
  font-weight: 600;
}
.spec-list {
  display: grid;
  grid-template-columns: minmax(120px, 180px) 1fr;
  gap: 10px 24px;
  margin: 0;
  padding: 16px 18px 18px 54px;
  font-size: 13px;
}
.spec-list dt {
  color: var(--text-2);
}
.spec-list dd {
  margin: 0;
}

.pz-hero {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding-bottom: 12px;
}
.pz-preview {
  position: relative;
  width: 280px;
  aspect-ratio: 16 / 10;
  border-radius: 8px;
  border: 6px solid #1b1b1b;
  background-size: cover;
  background-position: center;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
.pz-window {
  position: absolute;
  top: 24%;
  left: 22%;
  width: 56%;
  height: 50%;
  padding: 8px;
  border-radius: 4px;
  background: var(--mica);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}
.pz-window-bar {
  height: 6px;
  margin-bottom: 8px;
  border-radius: 3px;
  background: var(--stroke-strong);
}
.pz-window-line {
  height: 6px;
  margin-bottom: 6px;
  border-radius: 3px;
  background: var(--stroke-2);
}
.pz-window-line.accent {
  width: 40%;
  background: var(--accent);
}
.pz-window-line.short {
  width: 60%;
}
.pz-taskbar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 4px;
  background: var(--taskbar-bg);
}
.pz-taskbar span {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--text-3);
}
.pz-taskbar span.accent {
  background: var(--accent);
}
.pz-themes {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-width: 240px;
}
.pz-themes b {
  font-weight: 600;
}
.pz-theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}
.pz-theme,
.wall-thumb {
  position: relative;
  aspect-ratio: 16 / 10;
  border-radius: 6px;
  background-size: cover;
  background-position: center;
  border: 2px solid transparent;
  outline: 1px solid var(--stroke-2);
  transition: transform 0.12s var(--ease-out);
}
.pz-theme:hover,
.wall-thumb:hover {
  transform: scale(1.03);
}
.pz-theme.on,
.wall-thumb.on {
  border-color: var(--accent);
}
.pz-theme-win {
  position: absolute;
  left: 22%;
  top: 26%;
  width: 56%;
  height: 48%;
  padding: 6px;
  border-radius: 3px;
  background: #f3f3f3;
}
.pz-theme-win.dark {
  background: #202020;
}
.pz-theme-win span {
  display: block;
  width: 50%;
  height: 5px;
  border-radius: 3px;
}
.wall-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  padding: 12px 16px 16px 54px;
  border-radius: 4px;
  background: var(--card);
  border: 1px solid var(--stroke);
}
.set-row-block {
  border-radius: 4px;
  background: var(--card);
  border: 1px solid var(--stroke);
}
.srb-head {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 68px;
  padding: 12px 18px;
}
.srb-head > span:last-child {
  display: flex;
  flex-direction: column;
}
.srb-title {
  font-size: 14px;
}
.srb-sub {
  color: var(--text-2);
  font-size: 12px;
}
.accent-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 18px 18px 54px;
}
.accent-swatch {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  color: #fff;
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.accent-swatch:hover,
.accent-swatch.on {
  outline-color: var(--text);
}

.apps-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
  margin-bottom: 8px;
}
.apps-search {
  position: relative;
  flex: 1 1 220px;
  max-width: 340px;
}
.apps-search :deep(.iconify) {
  position: absolute;
  top: 50%;
  right: 10px;
  color: var(--text-2);
  transform: translateY(-50%);
}
.apps-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.apps-count {
  margin: 8px 0 4px;
  color: var(--text-2);
  font-size: 13px;
}
.skill-row {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 68px;
  padding: 10px 12px 10px 18px;
  border-radius: 4px;
  background: var(--card);
  border: 1px solid var(--stroke);
}
.skill-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.skill-name {
  font-size: 14px;
}
.skill-sub {
  color: var(--text-2);
  font-size: 12px;
}
.skill-level {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-2);
  font-size: 13px;
}
.skill-bar,
.upd-bar {
  width: 120px;
  height: 4px;
  border-radius: 2px;
  background: var(--stroke-strong);
  overflow: hidden;
}
.skill-bar span,
.upd-bar span {
  display: block;
  height: 100%;
  border-radius: 2px;
  background: var(--accent);
}

.acc-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-bottom: 12px;
}
.acc-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}
.acc-info b {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
}
.acc-info span {
  color: var(--text-2);
  font-size: 13px;
}
.acc-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 2px 10px;
  border-radius: 12px;
  background: var(--subtle-selected);
}
.acc-badge.on {
  background: color-mix(in srgb, #10893e 18%, transparent);
  color: color-mix(in srgb, #10893e 70%, var(--text)) !important;
}

.net-hero,
.upd-hero {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  padding: 8px 0 16px;
}
.net-status {
  color: #10893e;
  font-size: 13px;
}
.time-hero {
  display: flex;
  flex-direction: column;
  padding: 0 0 20px;
}
.time-hero b {
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 600;
  line-height: 60px;
}
.time-hero span {
  color: var(--text-2);
}

.upd-icon.spinning {
  animation: spin 1.2s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.upd-btn {
  margin-left: auto;
}
.upd-progress {
  position: relative;
  height: 3px;
  margin-bottom: 12px;
  border-radius: 2px;
  background: var(--stroke-2);
  overflow: hidden;
}
.upd-progress span {
  position: absolute;
  top: 0;
  left: -30%;
  width: 30%;
  height: 100%;
  border-radius: 2px;
  background: var(--accent);
  animation: indeterminate 1.4s var(--ease-in-out) infinite;
}
@keyframes indeterminate {
  to { left: 100%; }
}
.upd-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  min-height: 64px;
  padding: 10px 18px;
  border-radius: 4px;
  background: var(--card);
  border: 1px solid var(--stroke);
}
.upd-item-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 160px;
}
.upd-item-text small {
  color: var(--text-2);
  font-size: 12px;
}
.upd-group {
  margin: 8px 0 4px;
  color: var(--text-2);
  font-size: 13px;
}
.upd-history {
  display: flex;
  flex-direction: column;
}
.upd-details {
  margin-top: -1px;
  padding: 12px 18px 16px 54px;
  border-radius: 0 0 4px 4px;
  background: var(--card);
  border: 1px solid var(--stroke);
  border-top: 0;
  font-size: 13px;
  line-height: 20px;
}
.upd-details ul {
  margin: 8px 0 0;
  padding-left: 18px;
}

@container (max-width: 760px) {
  .set-side {
    width: 64px;
    padding: 0 8px 12px;
  }
  .set-user {
    justify-content: center;
    padding: 12px 0;
  }
  .set-user :deep(.avatar) {
    width: 36px !important;
    height: 36px !important;
    font-size: 15px !important;
  }
  .set-user-text,
  .set-find,
  .nav-label {
    display: none;
  }
  .nav-btn {
    justify-content: center;
    padding: 0;
  }
  .set-main {
    padding: 0 16px 32px 12px;
  }
  .spec-list,
  .accent-grid,
  .wall-grid,
  .upd-details {
    padding-left: 18px;
  }
  .skill-level .skill-bar {
    display: none;
  }
}
</style>
