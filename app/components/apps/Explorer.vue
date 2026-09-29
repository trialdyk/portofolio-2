<script setup lang="ts">
import type { MenuItem } from '~/composables/useOs'
import type { WinState } from '~/composables/useWindows'
import { projectShots } from '~/utils/covers'
import {
  PATHS,
  QUICK_ACCESS,
  RECENT_FILES,
  childrenOf,
  displayPath,
  formatDate,
  formatSize,
  getNode,
  pathSegments,
  resolvePath,
  searchIn,
  sortNodes,
  type FsNode,
  type SortKey,
} from '~/utils/fs'

const props = defineProps<{ win: WinState; active: boolean }>()
const wm = useWindows()
const os = useOs()
const shell = useShell()

interface Tab {
  id: number
  history: string[]
  index: number
}

type ViewMode = 'large' | 'medium' | 'details'

function requestedPath(p: Record<string, unknown>) {
  return typeof p.path === 'string' && getNode(p.path) ? p.path : PATHS.home
}

let tabSeq = 1
const tabs = ref<Tab[]>([{ id: 1, history: [requestedPath(props.win.props)], index: 0 }])
const activeTabId = ref(1)
const view = ref<ViewMode>('large')
const sortKey = ref<SortKey>('name')
const sortDir = ref<1 | -1>(1)
const showDetails = ref(window.innerWidth > 1000)
const selectedId = ref<string | null>(null)
const search = ref('')
const refreshKey = ref(0)
const editingAddress = ref(false)
const addressText = ref('')
const addressEl = ref<HTMLInputElement>()

const tab = computed(() => tabs.value.find(t => t.id === activeTabId.value) ?? tabs.value[0]!)
const path = computed(() => tab.value.history[tab.value.index]!)
const current = computed(() => getNode(path.value)!)
const selected = computed(() => getNode(selectedId.value))
const isSearching = computed(() => search.value.trim().length > 0)
const special = computed(() => {
  if (isSearching.value) return null
  if (path.value === PATHS.home) return 'home'
  if (path.value === PATHS.thispc) return 'thispc'
  return null
})

const items = computed(() => {
  void refreshKey.value
  const list = isSearching.value ? searchIn(path.value, search.value) : childrenOf(path.value)
  return sortNodes(list, sortKey.value, sortDir.value)
})
const quickNodes = computed(() => QUICK_ACCESS.map(id => getNode(id)!))
const recentNodes = computed(() => RECENT_FILES.map(id => getNode(id)).filter((n): n is FsNode => !!n))
const segments = computed(() => pathSegments(path.value))
const tabItems = computed(() => tabs.value.map((t) => {
  const node = getNode(t.history[t.index])!
  return { id: t.id, title: node.name, icon: node.icon }
}))

const canBack = computed(() => tab.value.index > 0)
const canForward = computed(() => tab.value.index < tab.value.history.length - 1)
const canUp = computed(() => !!current.value.parent)
const iconSize = computed(() => (view.value === 'large' ? 80 : 48))

const NAV_PINNED = QUICK_ACCESS
const NAV_BOTTOM = [PATHS.thispc, PATHS.recycle]

watch([current, isSearching], () => {
  wm.setTitle(props.win.id, `${isSearching.value ? 'Search Results' : current.value.name} - File Explorer`)
}, { immediate: true })

function resetView() {
  selectedId.value = null
  search.value = ''
  editingAddress.value = false
}

function openTab(target: string = PATHS.home) {
  const t: Tab = { id: ++tabSeq, history: [target], index: 0 }
  tabs.value.push(t)
  activeTabId.value = t.id
  resetView()
}

function closeTab(id: number) {
  if (tabs.value.length === 1) return wm.close(props.win.id)
  const i = tabs.value.findIndex(t => t.id === id)
  tabs.value.splice(i, 1)
  if (activeTabId.value === id) activeTabId.value = tabs.value[Math.max(0, i - 1)]!.id
  resetView()
}

function selectTab(id: number) {
  if (activeTabId.value === id) return
  activeTabId.value = id
  resetView()
}

function navigate(target: string) {
  const node = getNode(target)
  if (!node) return
  if (node.message) return shell.openNode(node)
  if (node.target) return navigate(node.target)
  if (node.kind === 'file') return shell.openNode(node)
  const t = tab.value
  if (t.history[t.index] !== target) {
    t.history.splice(t.index + 1)
    t.history.push(target)
    t.index = t.history.length - 1
  }
  resetView()
}

function back() {
  if (!canBack.value) return
  tab.value.index--
  resetView()
}
function forward() {
  if (!canForward.value) return
  tab.value.index++
  resetView()
}
function up() {
  if (current.value.parent) navigate(current.value.parent)
}
function refresh() {
  refreshKey.value++
}

watch(() => props.win.launch, () => {
  const requested = requestedPath(props.win.props)
  if (path.value !== requested) openTab(requested)
})

function openItem(node: FsNode) {
  if (node.kind !== 'file' || (node.target && getNode(node.target)?.kind !== 'file')) navigate(node.id)
  else shell.openNode(node)
}

function onItemClick(e: MouseEvent, node: FsNode) {
  selectedId.value = node.id
  if ((e as PointerEvent).pointerType === 'touch') openItem(node)
}

function startEditAddress() {
  addressText.value = displayPath(path.value)
  editingAddress.value = true
  nextTick(() => addressEl.value?.select())
}

function submitAddress() {
  const text = addressText.value.trim()
  editingAddress.value = false
  if (!text) return
  const node = resolvePath(text)
  if (node) openItem(node)
  else shell.dialog({ title: 'File Explorer', message: `Windows can't find '${text}'. Check the spelling and try again.`, icon: 'error' })
}

function menuAt(e: MouseEvent, items: MenuItem[]) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  os.openMenu(r.left, r.bottom + 4, items)
}

function setSort(key: SortKey) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 1 ? -1 : 1
  else {
    sortKey.value = key
    sortDir.value = 1
  }
}

const SORT_LABELS: [SortKey, string][] = [['name', 'Name'], ['modified', 'Date modified'], ['type', 'Type'], ['bytes', 'Size']]
const sortItems = (): MenuItem[] => [
  ...SORT_LABELS.map(([key, label]) => ({ label, checked: sortKey.value === key, action: () => (sortKey.value = key) })),
  { separator: true },
  { label: 'Ascending', checked: sortDir.value === 1, action: () => (sortDir.value = 1) },
  { label: 'Descending', checked: sortDir.value === -1, action: () => (sortDir.value = -1) },
]
const viewItems = (): MenuItem[] => [
  { label: 'Large icons', checked: view.value === 'large', action: () => (view.value = 'large') },
  { label: 'Medium icons', checked: view.value === 'medium', action: () => (view.value = 'medium') },
  { label: 'Details', checked: view.value === 'details', action: () => (view.value = 'details') },
  { separator: true },
  { label: 'Details pane', checked: showDetails.value, action: () => (showDetails.value = !showDetails.value) },
]
const newItems = (): MenuItem[] => [
  { label: 'Folder', icon: 'folder', disabled: true },
  { label: 'Text Document', icon: 'file-txt', action: () => wm.openApp('notepad', { new: true }) },
]
const moreItems = (): MenuItem[] => [
  { label: 'Open in new tab', icon: 'fluent:tab-add-24-regular', action: () => openTab(path.value) },
  { label: 'Open in Terminal', icon: 'terminal', action: () => wm.openApp('terminal', { cwd: path.value }) },
  { separator: true },
  { label: 'Properties', icon: 'fluent:info-24-regular', action: () => shell.properties(current.value) },
]

function copyPath(node: FsNode) {
  navigator.clipboard?.writeText(`"${displayPath(node.id)}"`).catch(() => {})
}

function onItemContextMenu(e: MouseEvent, node: FsNode) {
  selectedId.value = node.id
  const items: MenuItem[] = [{ label: 'Open', icon: 'fluent:open-24-regular', action: () => openItem(node) }]
  if (node.kind !== 'file') items.push({ label: 'Open in new tab', icon: 'fluent:tab-add-24-regular', action: () => openTab(node.id) })
  if (isSearching.value && node.parent) {
    const parent = node.parent
    items.push({ label: 'Open file location', icon: 'fluent:folder-open-24-regular', action: () => navigate(parent) })
  }
  items.push(
    { separator: true },
    { label: 'Copy as path', icon: 'fluent:copy-24-regular', shortcut: 'Ctrl+Shift+C', action: () => copyPath(node) },
    { separator: true },
    { label: 'Properties', icon: 'fluent:info-24-regular', shortcut: 'Alt+Enter', action: () => shell.properties(node) },
  )
  os.openMenu(e.clientX, e.clientY, items)
}

function onBackgroundContextMenu(e: MouseEvent) {
  selectedId.value = null
  os.openMenu(e.clientX, e.clientY, [
    { label: 'View', icon: 'fluent:grid-24-regular', children: viewItems() },
    { label: 'Sort by', icon: 'fluent:arrow-sort-24-regular', children: sortItems() },
    { label: 'Refresh', icon: 'fluent:arrow-clockwise-24-regular', action: refresh },
    { separator: true },
    ...moreItems(),
  ])
}

function onKeyDown(e: KeyboardEvent) {
  const typing = (e.target as HTMLElement).closest('input')
  if (e.altKey && e.key === 'ArrowLeft') back()
  else if (e.altKey && e.key === 'ArrowRight') forward()
  else if (e.altKey && e.key === 'ArrowUp') up()
  else if (typing) return
  else if (e.key === 'Backspace') back()
  else if (e.key === 'Enter' && selected.value) openItem(selected.value)
  else if (e.key === 'F5') {
    e.preventDefault()
    refresh()
  }
}

function previewOf(node: FsNode) {
  if (node.image) return node.image
  if (node.project) return projectShots(node.project)[0]
  return undefined
}

function driveUsage(node: FsNode) {
  const d = node.drive!
  return { pct: `${((d.total - d.free) / d.total) * 100}%`, label: `${d.free} GB free of ${d.total} GB` }
}
</script>

<template>
  <div class="explorer" tabindex="-1" @keydown="onKeyDown">
    <OsTabStrip :tabs="tabItems" :active="activeTabId" @select="selectTab" @close="closeTab" @add="openTab()" />

    <div class="ex-toolbar">
      <div class="ex-navrow">
        <button class="fl-icon-btn" :disabled="!canBack" aria-label="Back" title="Back (Alt+Left Arrow)" @click="back">
          <Icon name="fluent:arrow-left-20-regular" size="16px" />
        </button>
        <button class="fl-icon-btn" :disabled="!canForward" aria-label="Forward" title="Forward (Alt+Right Arrow)" @click="forward">
          <Icon name="fluent:arrow-right-20-regular" size="16px" />
        </button>
        <button class="fl-icon-btn" :disabled="!canUp" aria-label="Up" title="Up to parent folder (Alt+Up Arrow)" @click="up">
          <Icon name="fluent:arrow-up-20-regular" size="16px" />
        </button>
        <button class="fl-icon-btn" aria-label="Refresh" title="Refresh (F5)" @click="refresh">
          <Icon name="fluent:arrow-clockwise-20-regular" size="16px" />
        </button>

        <div class="ex-address" :class="{ editing: editingAddress }" @click.self="startEditAddress">
          <template v-if="!editingAddress">
            <OsIcon :name="current.icon" :size="16" class="addr-icon" />
            <template v-for="seg in segments" :key="seg.id">
              <Icon name="fluent:chevron-right-12-regular" size="12px" class="addr-sep" />
              <button class="addr-seg" @click="navigate(seg.id)">{{ seg.name }}</button>
            </template>
            <template v-if="isSearching">
              <Icon name="fluent:chevron-right-12-regular" size="12px" class="addr-sep" />
              <span class="addr-seg static">Search Results in {{ current.name }}</span>
            </template>
            <div class="addr-fill" @click="startEditAddress" />
          </template>
          <input
            v-else
            ref="addressEl"
            v-model="addressText"
            class="addr-input"
            spellcheck="false"
            aria-label="Address"
            @keydown.enter="submitAddress"
            @keydown.esc="editingAddress = false"
            @blur="editingAddress = false"
          >
        </div>

        <label class="ex-search">
          <input v-model="search" :placeholder="`Search ${current.name}`" spellcheck="false">
          <Icon name="fluent:search-20-regular" size="14px" />
        </label>
      </div>

      <div class="ex-cmdbar">
        <button class="cmd-btn" @click="menuAt($event, newItems())">
          <Icon name="fluent:add-circle-20-regular" size="18px" />
          <span>New</span>
          <Icon name="fluent:chevron-down-12-regular" size="10px" />
        </button>
        <span class="cmd-sep" />
        <button class="fl-icon-btn" disabled aria-label="Cut"><Icon name="fluent:cut-20-regular" size="18px" /></button>
        <button class="fl-icon-btn" :disabled="!selected" aria-label="Copy path" title="Copy path" @click="selected && copyPath(selected)">
          <Icon name="fluent:copy-20-regular" size="18px" />
        </button>
        <button class="fl-icon-btn" disabled aria-label="Paste"><Icon name="fluent:clipboard-paste-20-regular" size="18px" /></button>
        <button class="fl-icon-btn" disabled aria-label="Rename"><Icon name="fluent:rename-20-regular" size="18px" /></button>
        <button class="fl-icon-btn" disabled aria-label="Share"><Icon name="fluent:share-20-regular" size="18px" /></button>
        <button class="fl-icon-btn" disabled aria-label="Delete"><Icon name="fluent:delete-20-regular" size="18px" /></button>
        <span class="cmd-sep" />
        <button class="cmd-btn" @click="menuAt($event, sortItems())">
          <Icon name="fluent:arrow-sort-20-regular" size="18px" />
          <span>Sort</span>
          <Icon name="fluent:chevron-down-12-regular" size="10px" />
        </button>
        <button class="cmd-btn" @click="menuAt($event, viewItems())">
          <Icon name="fluent:grid-20-regular" size="18px" />
          <span>View</span>
          <Icon name="fluent:chevron-down-12-regular" size="10px" />
        </button>
        <button class="fl-icon-btn" aria-label="See more" @click="menuAt($event, moreItems())">
          <Icon name="fluent:more-horizontal-20-regular" size="18px" />
        </button>
        <button class="cmd-btn cmd-details" :class="{ on: showDetails }" @click="showDetails = !showDetails">
          <Icon name="fluent:panel-right-20-regular" size="18px" />
          <span>Details</span>
        </button>
      </div>
    </div>

    <div class="ex-main">
      <nav class="ex-nav" aria-label="Navigation pane">
        <button class="nav-item" :class="{ on: path === PATHS.home }" @click="navigate(PATHS.home)">
          <OsIcon name="home" :size="16" />
          <span>Home</span>
        </button>
        <div class="nav-sep" />
        <button v-for="id in NAV_PINNED" :key="id" class="nav-item" :class="{ on: path === id }" @click="navigate(id)">
          <OsIcon :name="getNode(id)!.icon" :size="16" />
          <span>{{ getNode(id)!.name }}</span>
          <Icon name="fluent:pin-12-regular" size="12px" class="nav-pin" />
        </button>
        <div class="nav-sep" />
        <button v-for="id in NAV_BOTTOM" :key="id" class="nav-item" :class="{ on: path === id }" @click="navigate(id)">
          <OsIcon :name="getNode(id)!.icon" :size="16" />
          <span>{{ getNode(id)!.name }}</span>
        </button>
      </nav>

      <div :key="refreshKey" class="ex-content" @pointerdown.self="selectedId = null" @contextmenu.self.prevent="onBackgroundContextMenu">
        <!-- Home -->
        <div v-if="special === 'home'" class="ex-home" @pointerdown.self="selectedId = null">
          <h3 class="ex-group">
            <Icon name="fluent:chevron-down-12-regular" size="10px" />
            Quick access
          </h3>
          <div class="qa-grid">
            <button
              v-for="n in quickNodes"
              :key="n.id"
              class="qa-item"
              :class="{ selected: selectedId === n.id }"
              @click="onItemClick($event, n)"
              @dblclick="openItem(n)"
              @contextmenu.prevent.stop="onItemContextMenu($event, n)"
            >
              <OsIcon :name="n.icon" :size="48" />
              <span class="qa-text">
                <b>{{ n.name }}</b>
                <small>Stored locally</small>
                <Icon name="fluent:pin-12-regular" size="12px" class="qa-pin" />
              </span>
            </button>
          </div>
          <h3 class="ex-group">
            <Icon name="fluent:chevron-down-12-regular" size="10px" />
            Recent
          </h3>
          <div class="ex-table recent">
            <div class="ex-thead">
              <span>Name</span>
              <span>Date modified</span>
              <span>File location</span>
            </div>
            <button
              v-for="n in recentNodes"
              :key="n.id"
              class="ex-row"
              :class="{ selected: selectedId === n.id }"
              @click="onItemClick($event, n)"
              @dblclick="openItem(n)"
              @contextmenu.prevent.stop="onItemContextMenu($event, n)"
            >
              <span class="c-name"><OsIcon :name="n.icon" :size="16" /><span>{{ n.name }}</span></span>
              <span>{{ formatDate(n.modified) }}</span>
              <span>{{ n.parent ? getNode(n.parent)!.name : '' }}</span>
            </button>
          </div>
        </div>

        <!-- This PC -->
        <div v-else-if="special === 'thispc'" class="ex-home">
          <h3 class="ex-group">
            <Icon name="fluent:chevron-down-12-regular" size="10px" />
            Devices and drives
          </h3>
          <div class="drive-grid">
            <button
              v-for="d in items"
              :key="d.id"
              class="drive"
              :class="{ selected: selectedId === d.id }"
              @click="onItemClick($event, d)"
              @dblclick="openItem(d)"
              @contextmenu.prevent.stop="onItemContextMenu($event, d)"
            >
              <OsIcon :name="d.icon" :size="48" />
              <span class="drive-info">
                <b>{{ d.name }}</b>
                <span v-if="d.drive" class="usage"><span :style="{ width: driveUsage(d).pct }" /></span>
                <small v-if="d.drive">{{ driveUsage(d).label }}</small>
              </span>
            </button>
          </div>
        </div>

        <!-- Folder / search results -->
        <template v-else>
          <p v-if="!items.length" class="ex-empty">{{ isSearching ? 'No items match your search.' : 'This folder is empty.' }}</p>

          <div v-else-if="view === 'details'" class="ex-table">
            <div class="ex-thead">
              <button v-for="[key, label] in SORT_LABELS" :key="key" :class="{ sorted: sortKey === key }" @click="setSort(key)">
                {{ label }}
                <Icon v-if="sortKey === key" :name="sortDir === 1 ? 'fluent:chevron-up-12-regular' : 'fluent:chevron-down-12-regular'" size="10px" />
              </button>
            </div>
            <button
              v-for="n in items"
              :key="n.id"
              class="ex-row"
              :class="{ selected: selectedId === n.id }"
              @click="onItemClick($event, n)"
              @dblclick="openItem(n)"
              @contextmenu.prevent.stop="onItemContextMenu($event, n)"
            >
              <span class="c-name"><OsIcon :name="n.icon" :size="16" :shortcut="n.shortcut" /><span>{{ n.name }}</span></span>
              <span>{{ formatDate(n.modified) }}</span>
              <span>{{ n.type }}</span>
              <span class="c-size">{{ n.kind === 'file' ? formatSize(n.bytes) : '' }}</span>
            </button>
          </div>

          <div v-else class="ex-grid" :class="view" @pointerdown.self="selectedId = null" @contextmenu.self.prevent="onBackgroundContextMenu">
            <button
              v-for="n in items"
              :key="n.id"
              class="ex-item"
              :class="{ selected: selectedId === n.id }"
              :title="n.name"
              @click="onItemClick($event, n)"
              @dblclick="openItem(n)"
              @contextmenu.prevent.stop="onItemContextMenu($event, n)"
            >
              <span class="ex-thumb" :style="{ height: `${iconSize}px` }">
                <img v-if="n.image" :src="n.image" alt="" loading="lazy" draggable="false" :style="{ maxWidth: `${iconSize}px`, maxHeight: `${iconSize}px` }">
                <OsIcon v-else :name="n.icon" :size="iconSize" :shortcut="n.shortcut" />
              </span>
              <span class="ex-name">{{ n.name }}</span>
            </button>
          </div>
        </template>
      </div>

      <aside v-if="showDetails" class="ex-details">
        <template v-if="selected">
          <div class="dp-preview">
            <img v-if="previewOf(selected)" :src="previewOf(selected)" alt="">
            <OsIcon v-else :name="selected.icon" :size="96" />
          </div>
          <div class="dp-body">
            <h2 class="dp-name">{{ selected.name }}</h2>
            <p class="dp-type">{{ selected.type }}</p>
            <template v-if="selected.project">
              <p class="dp-desc selectable">{{ selected.project.description }}</p>
              <div class="dp-tags">
                <span v-for="t in selected.project.tech" :key="t">{{ t }}</span>
              </div>
              <div class="dp-actions">
                <button class="fl-btn accent" @click="openItem(selected)">Open folder</button>
                <button v-if="selected.project.demo" class="fl-btn" @click="wm.openApp('edge', { url: selected.project.demo })">
                  <Icon name="fluent:globe-20-regular" size="16px" />
                  Live demo
                </button>
                <button v-if="selected.project.repo" class="fl-btn" @click="shell.openExternal(selected.project.repo)">
                  <Icon name="mdi:github" size="16px" />
                  Source
                </button>
              </div>
            </template>
            <h3 class="dp-h">Properties</h3>
            <dl class="dp-props">
              <template v-if="selected.project">
                <dt>Year</dt><dd>{{ selected.project.year }}</dd>
                <dt>Role</dt><dd>{{ selected.project.role }}</dd>
                <dt>Status</dt><dd>{{ selected.project.status }}</dd>
              </template>
              <template v-if="selected.bytes !== undefined">
                <dt>Size</dt><dd>{{ formatSize(selected.bytes) }}</dd>
              </template>
              <template v-if="selected.modified">
                <dt>Date modified</dt><dd>{{ formatDate(selected.modified) }}</dd>
              </template>
              <template v-if="selected.parent">
                <dt>Location</dt><dd>{{ displayPath(selected.parent) }}</dd>
              </template>
            </dl>
          </div>
        </template>
        <div v-else class="dp-empty">
          <OsIcon :name="current.icon" :size="64" />
          <b>{{ special === 'home' ? 'Home' : current.name }}</b>
          <p>{{ path === PATHS.projects ? 'Select a project to see its details.' : 'Select a single file to get more information and share your cloud content.' }}</p>
        </div>
      </aside>
    </div>

    <footer class="ex-status">
      <span>{{ special === 'home' ? quickNodes.length + recentNodes.length : items.length }} items</span>
      <span v-if="selected" class="st-sep">1 item selected {{ selected.kind === 'file' && selected.bytes ? formatSize(selected.bytes) : '' }}</span>
      <span class="st-views">
        <button class="fl-icon-btn" :class="{ on: view === 'details' }" aria-label="Details view" @click="view = 'details'">
          <Icon name="fluent:text-bullet-list-ltr-20-regular" size="14px" />
        </button>
        <button class="fl-icon-btn" :class="{ on: view !== 'details' }" aria-label="Large icons view" @click="view = 'large'">
          <Icon name="fluent:grid-20-regular" size="14px" />
        </button>
      </span>
    </footer>
  </div>
</template>

<style scoped>
.explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
  container-type: inline-size;
  --tab-bg: var(--layer);
}

.ex-toolbar {
  flex-shrink: 0;
  background: var(--layer);
  border-bottom: 1px solid var(--divider);
}
.ex-navrow {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 48px;
  padding: 0 8px;
}
.ex-address {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  height: 32px;
  margin-left: 6px;
  padding: 0 6px 0 10px;
  border-radius: 4px;
  background: var(--control);
  border: 1px solid var(--stroke);
  overflow: hidden;
}
.ex-address.editing {
  padding: 0;
  border-bottom: 2px solid var(--accent);
  background: var(--input-focus);
}
.addr-icon {
  margin-right: 2px;
}
.addr-sep {
  flex-shrink: 0;
  margin: 0 2px;
  color: var(--text-2);
}
.addr-seg {
  flex: 0 1 auto;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border-radius: 4px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 13px;
}
.addr-seg:last-of-type {
  flex-shrink: 0;
}
.addr-seg:not(.static):hover {
  background: var(--subtle-hover);
}
.addr-seg.static {
  line-height: 24px;
}
.addr-fill {
  flex: 1;
  align-self: stretch;
}
.addr-input {
  width: 100%;
  height: 100%;
  padding: 0 10px;
  border: 0;
  background: transparent;
  font-size: 13px;
}
.ex-search {
  position: relative;
  display: flex;
  align-items: center;
  flex: 0 0 min(260px, 28%);
  height: 32px;
  margin-left: 4px;
  border-radius: 4px;
  background: var(--control);
  border: 1px solid var(--stroke);
  border-bottom-color: var(--text-3);
}
.ex-search:focus-within {
  background: var(--input-focus);
  border-bottom: 2px solid var(--accent);
}
.ex-search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0 8px 0 12px;
  border: 0;
  background: transparent;
  font-size: 13px;
}
.ex-search input::placeholder {
  color: var(--text-2);
}
.ex-search :deep(.iconify) {
  margin-right: 10px;
  color: var(--text-2);
}

.ex-cmdbar {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 48px;
  padding: 0 12px;
  border-top: 1px solid var(--divider);
  overflow: hidden;
}
.cmd-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  height: 32px;
  padding: 0 10px;
  border-radius: 4px;
  font-size: 13px;
}
.cmd-btn:hover,
.cmd-btn.on {
  background: var(--subtle-hover);
}
.cmd-btn.on {
  background: var(--subtle-selected);
}
.cmd-details {
  margin-left: auto;
}
.cmd-sep {
  flex-shrink: 0;
  width: 1px;
  height: 24px;
  margin: 0 6px;
  background: var(--divider);
}

.ex-main {
  display: flex;
  flex: 1;
  min-height: 0;
  background: var(--surface);
}
.ex-nav {
  flex-shrink: 0;
  width: 208px;
  padding: 8px 6px;
  overflow-y: auto;
  border-right: 1px solid var(--divider);
}
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 32px;
  padding: 0 10px 0 24px;
  border-radius: 4px;
  font-size: 13px;
  text-align: left;
}
.nav-item > span:nth-child(2) {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.nav-item:hover {
  background: var(--subtle-hover);
}
.nav-item.on {
  background: var(--subtle-selected);
}
.nav-pin {
  color: var(--text-3);
}
.nav-sep {
  height: 1px;
  margin: 8px 8px;
  background: var(--divider);
}

.ex-content {
  position: relative;
  flex: 1;
  min-width: 0;
  padding: 6px 10px 16px;
  overflow: auto;
}
.ex-empty {
  padding-top: 12px;
  color: var(--text-2);
  font-size: 13px;
  text-align: center;
}

.ex-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 4px;
  align-content: start;
  min-height: 100%;
}
.ex-grid.medium {
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
}
.ex-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px 6px;
  border-radius: 4px;
  border: 1px solid transparent;
}
.ex-item:hover,
.ex-row:hover,
.qa-item:hover,
.drive:hover {
  background: var(--sel-hover);
}
.ex-item.selected,
.ex-row.selected,
.qa-item.selected,
.drive.selected {
  background: var(--sel-bg);
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
}
.ex-thumb {
  display: grid;
  place-items: center;
}
.ex-thumb img {
  border: 1px solid var(--stroke-2);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
  object-fit: contain;
  background: #fff;
}
.ex-name {
  max-width: 100%;
  font-size: 12px;
  line-height: 16px;
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.ex-table {
  display: flex;
  flex-direction: column;
  min-width: 520px;
}
.ex-thead,
.ex-row {
  display: grid;
  grid-template-columns: minmax(200px, 3fr) minmax(140px, 1.6fr) minmax(130px, 1.5fr) minmax(70px, 0.8fr);
  align-items: center;
}
.recent .ex-thead,
.recent .ex-row {
  grid-template-columns: minmax(200px, 3fr) minmax(140px, 1.6fr) minmax(130px, 1.5fr);
}
.ex-thead {
  position: sticky;
  top: -6px;
  z-index: 1;
  height: 32px;
  background: var(--surface);
  font-size: 12px;
  color: var(--text-2);
}
.ex-thead > * {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  padding: 0 10px;
  border-right: 1px solid var(--divider);
  text-align: left;
}
.ex-thead button:hover {
  background: var(--subtle-hover);
}
.ex-thead .sorted {
  color: var(--text);
}
.ex-row {
  height: 32px;
  border-radius: 4px;
  border: 1px solid transparent;
  font-size: 12px;
  color: var(--text-2);
  text-align: left;
}
.ex-row > span {
  padding: 0 10px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ex-row .c-name {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
}
.ex-row .c-name span {
  overflow: hidden;
  text-overflow: ellipsis;
}
.c-size {
  text-align: right;
}

.ex-home {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ex-group {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 6px 6px;
  font-size: 14px;
  font-weight: 600;
}
.qa-grid,
.drive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(236px, 1fr));
  gap: 4px;
  margin-bottom: 8px;
}
.qa-item,
.drive {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid transparent;
  text-align: left;
}
.qa-text,
.drive-info {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  font-size: 12px;
  line-height: 16px;
}
.qa-text b,
.drive-info b {
  font-size: 13px;
  font-weight: 400;
  line-height: 18px;
}
.qa-text small,
.drive-info small {
  color: var(--text-2);
  font-size: 12px;
}
.qa-pin {
  position: absolute;
  right: 0;
  bottom: 1px;
  color: var(--text-3);
}
.usage {
  display: block;
  height: 14px;
  margin: 4px 0;
  border: 1px solid var(--stroke-strong);
  background: var(--control-alt);
}
.usage span {
  display: block;
  height: 100%;
  background: var(--accent);
}

.ex-details {
  flex-shrink: 0;
  width: 290px;
  overflow-y: auto;
  border-left: 1px solid var(--divider);
}
.dp-preview {
  display: grid;
  place-items: center;
  min-height: 170px;
  padding: 16px;
}
.dp-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
  border: 1px solid var(--stroke-2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
}
.dp-body {
  padding: 0 16px 16px;
}
.dp-name {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  overflow-wrap: anywhere;
}
.dp-type {
  color: var(--text-2);
  font-size: 12px;
}
.dp-desc {
  margin-top: 12px;
  font-size: 13px;
  line-height: 19px;
}
.dp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}
.dp-tags span {
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--sel-bg);
  font-size: 12px;
  line-height: 16px;
}
.dp-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.dp-h {
  margin: 20px 0 8px;
  font-size: 14px;
  font-weight: 600;
}
.dp-props {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 12px;
  margin: 0;
  font-size: 12px;
}
.dp-props dt {
  color: var(--text-2);
}
.dp-props dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.dp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  text-align: center;
}
.dp-empty b {
  font-size: 16px;
  font-weight: 600;
}
.dp-empty p {
  color: var(--text-2);
  font-size: 12px;
}

.ex-status {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  height: 28px;
  padding: 0 4px 0 14px;
  background: var(--surface);
  font-size: 12px;
}
.st-sep {
  padding-left: 16px;
  border-left: 1px solid var(--divider);
}
.st-views {
  display: flex;
  margin-left: auto;
}
.st-views .fl-icon-btn {
  width: 26px;
  height: 22px;
}

@container (max-width: 820px) {
  .ex-details { display: none; }
  .cmd-details { display: none; }
}
@container (max-width: 620px) {
  .ex-nav { display: none; }
  .ex-search { display: none; }
  .ex-cmdbar .fl-icon-btn[disabled] { display: none; }
  .cmd-sep { display: none; }
}
</style>
