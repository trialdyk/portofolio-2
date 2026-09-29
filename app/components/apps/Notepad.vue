<script setup lang="ts">
import type { MenuItem } from '~/composables/useOs'
import type { WinState } from '~/composables/useWindows'
import { PATHS, getNode } from '~/utils/fs'

const props = defineProps<{ win: WinState; active: boolean }>()
const wm = useWindows()
const os = useOs()

interface NoteTab {
  id: number
  name: string
  fileId?: string
  content: string
  saved: string
}

let tabSeq = 0
const tabs = ref<NoteTab[]>([])
const activeId = ref(0)
const textarea = ref<HTMLTextAreaElement>()
const wordWrap = ref(true)
const statusBar = ref(true)
const zoom = ref(100)
const cursor = reactive({ ln: 1, col: 1 })

const tab = computed(() => tabs.value.find(t => t.id === activeId.value) ?? tabs.value[0]!)
const tabItems = computed(() => tabs.value.map(t => ({ id: t.id, title: t.name, dirty: t.content !== t.saved })))
const charCount = computed(() => tab.value.content.length.toLocaleString('en-US'))

function focusEditor(resetCaret = false) {
  nextTick(() => {
    const el = textarea.value
    if (!el) return
    if (resetCaret) {
      el.setSelectionRange(0, 0)
      el.scrollTop = 0
    }
    if (props.active) el.focus()
    updateCursor()
  })
}

function addTab(t: Omit<NoteTab, 'id'>) {
  tabs.value.push({ ...t, id: ++tabSeq })
  activeId.value = tabSeq
  focusEditor(true)
}

function openFile(fileId: string) {
  const existing = tabs.value.find(t => t.fileId === fileId)
  if (existing) {
    activeId.value = existing.id
    return focusEditor()
  }
  const node = getNode(fileId)
  if (node?.content === undefined) return
  addTab({ name: node.name, fileId, content: node.content, saved: node.content })
}

function newTab() {
  addTab({ name: 'Untitled', content: '', saved: '' })
}

function closeTab(id: number) {
  if (tabs.value.length === 1) return wm.close(props.win.id)
  const i = tabs.value.findIndex(t => t.id === id)
  tabs.value.splice(i, 1)
  if (activeId.value === id) activeId.value = tabs.value[Math.max(0, i - 1)]!.id
  focusEditor()
}

function selectTab(id: number) {
  activeId.value = id
  focusEditor(true)
}

function handleLaunch(p: Record<string, unknown>) {
  if (typeof p.file === 'string') openFile(p.file)
  else if (p.new) newTab()
  if (!tabs.value.length) openFile(PATHS.about)
}
handleLaunch(props.win.props)
watch(() => props.win.launch, () => handleLaunch(props.win.props))
watch(() => tab.value.name, name => wm.setTitle(props.win.id, `${name} - Notepad`), { immediate: true })
watch(() => props.active, (a) => {
  if (a) focusEditor()
})

function updateCursor() {
  const el = textarea.value
  if (!el) return
  const lines = el.value.slice(0, el.selectionStart).split('\n')
  cursor.ln = lines.length
  cursor.col = lines[lines.length - 1]!.length + 1
}

function insert(text: string) {
  const el = textarea.value
  if (!el) return
  el.focus()
  el.setRangeText(text, el.selectionStart, el.selectionEnd, 'end')
  tab.value.content = el.value
  updateCursor()
}

function exec(command: 'undo' | 'cut' | 'copy' | 'delete' | 'selectAll') {
  textarea.value?.focus()
  document.execCommand(command)
  updateCursor()
}

async function paste() {
  try {
    insert(await navigator.clipboard.readText())
  }
  catch {
    os.notify({ app: 'Notepad', icon: 'notepad', title: 'Paste blocked', body: 'Your browser didn\'t allow clipboard access. Use Ctrl+V instead.' }, 5000)
  }
}

function insertTimeDate() {
  const now = new Date()
  insert(`${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} ${now.toLocaleDateString('en-US')}`)
}

function save() {
  tab.value.saved = tab.value.content
}

function saveAs() {
  const t = tab.value
  const blob = new Blob([t.content.replace(/\r?\n/g, '\r\n')], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = t.name.includes('.') ? t.name : `${t.name}.txt`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  t.saved = t.content
}

function setZoom(value: number) {
  zoom.value = Math.min(500, Math.max(10, value))
}

function onKeyDown(e: KeyboardEvent) {
  const mod = e.ctrlKey || e.metaKey
  if (mod && e.key.toLowerCase() === 's') {
    e.preventDefault()
    if (e.shiftKey) saveAs()
    else save()
  }
  else if (e.key === 'F5') {
    e.preventDefault()
    insertTimeDate()
  }
  else if (mod && (e.key === '=' || e.key === '+')) {
    e.preventDefault()
    setZoom(zoom.value + 10)
  }
  else if (mod && e.key === '-') {
    e.preventDefault()
    setZoom(zoom.value - 10)
  }
  else if (mod && e.key === '0') {
    e.preventDefault()
    setZoom(100)
  }
}

function onWheel(e: WheelEvent) {
  if (!e.ctrlKey) return
  e.preventDefault()
  setZoom(zoom.value + (e.deltaY < 0 ? 10 : -10))
}

const menus: Record<string, () => MenuItem[]> = {
  File: () => [
    { label: 'New tab', shortcut: 'Ctrl+N', action: newTab },
    { label: 'New window', shortcut: 'Ctrl+Shift+N', disabled: true },
    { label: 'Open', shortcut: 'Ctrl+O', action: () => wm.openApp('explorer', { path: PATHS.documents }) },
    { separator: true },
    { label: 'Save', shortcut: 'Ctrl+S', action: save },
    { label: 'Save as', shortcut: 'Ctrl+Shift+S', action: saveAs },
    { separator: true },
    { label: 'Close tab', shortcut: 'Ctrl+W', action: () => closeTab(activeId.value) },
    { label: 'Close window', shortcut: 'Ctrl+Shift+W', action: () => wm.close(props.win.id) },
    { label: 'Exit', action: () => wm.close(props.win.id) },
  ],
  Edit: () => [
    { label: 'Undo', shortcut: 'Ctrl+Z', action: () => exec('undo') },
    { separator: true },
    { label: 'Cut', shortcut: 'Ctrl+X', action: () => exec('cut') },
    { label: 'Copy', shortcut: 'Ctrl+C', action: () => exec('copy') },
    { label: 'Paste', shortcut: 'Ctrl+V', action: paste },
    { label: 'Delete', shortcut: 'Del', action: () => exec('delete') },
    { separator: true },
    { label: 'Select all', shortcut: 'Ctrl+A', action: () => exec('selectAll') },
    { label: 'Time/Date', shortcut: 'F5', action: insertTimeDate },
  ],
  View: () => [
    {
      label: 'Zoom',
      children: [
        { label: 'Zoom in', shortcut: 'Ctrl+Plus', action: () => setZoom(zoom.value + 10) },
        { label: 'Zoom out', shortcut: 'Ctrl+Minus', action: () => setZoom(zoom.value - 10) },
        { label: 'Restore default zoom', shortcut: 'Ctrl+0', action: () => setZoom(100) },
      ],
    },
    { label: 'Status bar', checked: statusBar.value, action: () => (statusBar.value = !statusBar.value) },
    { label: 'Word wrap', checked: wordWrap.value, action: () => (wordWrap.value = !wordWrap.value) },
  ],
}

function openMenu(e: MouseEvent, name: string) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  os.openMenu(r.left, r.bottom + 2, menus[name]!())
}
</script>

<template>
  <div class="notepad">
    <OsTabStrip :tabs="tabItems" :active="activeId" @select="selectTab" @close="closeTab" @add="newTab" />
    <div class="np-menubar">
      <button v-for="name in Object.keys(menus)" :key="name" class="np-menu" @click="openMenu($event, name)">{{ name }}</button>
      <button class="fl-icon-btn np-settings" aria-label="Settings" title="Settings" @click="wm.openApp('settings', { page: 'personalization' })">
        <Icon name="fluent:settings-20-regular" size="16px" />
      </button>
    </div>
    <div class="np-editor">
      <textarea
        ref="textarea"
        v-model="tab.content"
        :wrap="wordWrap ? 'soft' : 'off'"
        :class="{ nowrap: !wordWrap }"
        :style="{ fontSize: `${(14.5 * zoom) / 100}px` }"
        spellcheck="false"
        aria-label="Text editor"
        @keydown="onKeyDown"
        @keyup="updateCursor"
        @click="updateCursor"
        @input="updateCursor"
        @select="updateCursor"
        @wheel="onWheel"
      />
    </div>
    <footer v-if="statusBar" class="np-status">
      <span>Ln {{ cursor.ln }}, Col {{ cursor.col }}</span>
      <span>{{ charCount }} characters</span>
      <span class="np-right">{{ zoom }}%</span>
      <span>Windows (CRLF)</span>
      <span>UTF-8</span>
    </footer>
  </div>
</template>

<style scoped>
.notepad {
  --np-bg: #ffffff;
  --tab-bg: var(--np-bg);
  display: flex;
  flex-direction: column;
  height: 100%;
}
[data-theme='dark'] .notepad {
  --np-bg: #272727;
}
.np-menubar {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  height: 40px;
  padding: 0 8px;
  background: var(--np-bg);
}
.np-menu {
  height: 30px;
  padding: 0 10px;
  border-radius: 4px;
  font-size: 13px;
}
.np-menu:hover {
  background: var(--subtle-hover);
}
.np-settings {
  margin-left: auto;
}
.np-editor {
  flex: 1;
  min-height: 0;
  background: var(--np-bg);
  border-top: 1px solid var(--divider);
}
textarea {
  display: block;
  width: 100%;
  height: 100%;
  padding: 8px 14px;
  border: 0;
  resize: none;
  background: transparent;
  color: var(--text);
  font-family: var(--font-mono);
  line-height: 1.45;
  tab-size: 4;
  white-space: pre-wrap;
  overflow: auto;
}
textarea.nowrap {
  white-space: pre;
}
textarea::selection {
  background: var(--accent);
  color: var(--on-accent);
}
textarea:focus-visible {
  outline: none;
}
.np-status {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 28px;
  padding: 0 8px;
  background: var(--np-bg);
  border-top: 1px solid var(--divider);
  font-size: 12px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
}
.np-status span {
  padding: 0 12px;
}
.np-status span + span {
  border-left: 1px solid var(--divider);
}
.np-right {
  margin-left: auto;
}
</style>
