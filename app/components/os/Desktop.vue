<script setup lang="ts">
import type { MenuItem } from '~/composables/useOs'
import { DESKTOP_ICONS, PATHS, getNode, type FsNode } from '~/utils/fs'
import { profile } from '~/data/portfolio'

const os = useOs()
const wm = useWindows()
const shell = useShell()

type IconSize = 'large' | 'medium' | 'small'
type SortMode = 'default' | 'name' | 'type'

const iconSize = ref<IconSize>('medium')
const sortMode = ref<SortMode>('default')
const refreshing = ref(false)
const selected = ref(new Set<string>())
const marquee = ref<{ x: number; y: number; w: number; h: number } | null>(null)
const iconsEl = ref<HTMLElement>()

const ICON_PX: Record<IconSize, number> = { large: 80, medium: 48, small: 32 }

const icons = computed(() => {
  const list = DESKTOP_ICONS.map(id => getNode(id)!)
  if (sortMode.value === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name))
  if (sortMode.value === 'type') return [...list].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
  return list
})

function select(ids: string[]) {
  selected.value = new Set(ids)
}

function onShellPointerDown(e: PointerEvent) {
  const t = e.target as HTMLElement
  if (!t.closest('[data-menu]')) os.menu.value = null
  if (!t.closest('[data-flyout], [data-flyout-toggle]')) os.flyout.value = null
}

function onShellContextMenu(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest('input, textarea')) e.preventDefault()
}

function onSurfacePointerDown(e: PointerEvent) {
  wm.activeId.value = null
  if (e.button !== 0) return
  select([])
  const start = { x: e.clientX, y: e.clientY }
  const onMove = (ev: PointerEvent) => {
    const rect = {
      x: Math.min(start.x, ev.clientX),
      y: Math.min(start.y, ev.clientY),
      w: Math.abs(ev.clientX - start.x),
      h: Math.abs(ev.clientY - start.y),
    }
    if (rect.w + rect.h < 4) return
    marquee.value = rect
    const hits: string[] = []
    iconsEl.value?.querySelectorAll<HTMLElement>('[data-id]').forEach((node) => {
      const r = node.getBoundingClientRect()
      if (r.right > rect.x && r.left < rect.x + rect.w && r.bottom > rect.y && r.top < rect.y + rect.h) hits.push(node.dataset.id!)
    })
    select(hits)
  }
  const onUp = () => {
    marquee.value = null
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}

function onIconPointerDown(e: PointerEvent, node: FsNode) {
  wm.activeId.value = null
  if (e.ctrlKey || e.metaKey) {
    const next = new Set(selected.value)
    if (next.has(node.id)) next.delete(node.id)
    else next.add(node.id)
    selected.value = next
  }
  else if (!selected.value.has(node.id) || e.button === 0) {
    select([node.id])
  }
}

function onIconClick(e: MouseEvent, node: FsNode) {
  if ((e as PointerEvent).pointerType === 'touch') open(node)
}

function open(node: FsNode) {
  shell.openNode(node)
}

function refresh() {
  refreshing.value = true
  setTimeout(() => (refreshing.value = false), 180)
}

function onSurfaceContextMenu(e: MouseEvent) {
  select([])
  const items: MenuItem[] = [
    {
      label: 'View',
      icon: 'fluent:grid-24-regular',
      children: (['large', 'medium', 'small'] as IconSize[]).map(size => ({
        label: `${size[0]!.toUpperCase()}${size.slice(1)} icons`,
        checked: iconSize.value === size,
        action: () => (iconSize.value = size),
      })),
    },
    {
      label: 'Sort by',
      icon: 'fluent:arrow-sort-24-regular',
      children: [
        { label: 'Name', checked: sortMode.value === 'name', action: () => (sortMode.value = 'name') },
        { label: 'Item type', checked: sortMode.value === 'type', action: () => (sortMode.value = 'type') },
        { label: 'Default', checked: sortMode.value === 'default', action: () => (sortMode.value = 'default') },
      ],
    },
    { label: 'Refresh', icon: 'fluent:arrow-clockwise-24-regular', action: refresh },
    { separator: true },
    {
      label: 'New',
      icon: 'fluent:add-circle-24-regular',
      children: [
        { label: 'Folder', icon: 'folder', disabled: true },
        { label: 'Text Document', icon: 'file-txt', action: () => wm.openApp('notepad', { new: true }) },
      ],
    },
    { separator: true },
    { label: 'Display settings', icon: 'fluent:desktop-24-regular', action: () => wm.openApp('settings', { page: 'system' }) },
    { label: 'Personalize', icon: 'fluent:paint-brush-24-regular', action: () => wm.openApp('settings', { page: 'personalization' }) },
    { separator: true },
    { label: 'Open in Terminal', icon: 'terminal', action: () => wm.openApp('terminal') },
  ]
  os.openMenu(e.clientX, e.clientY, items)
}

function onIconContextMenu(e: MouseEvent, node: FsNode) {
  select([node.id])
  const items: MenuItem[] = [
    { label: 'Open', icon: 'fluent:open-24-regular', action: () => open(node) },
  ]
  if (node.target || node.parent) {
    items.push({
      label: 'Open file location',
      icon: 'fluent:folder-open-24-regular',
      action: () => wm.openApp('explorer', { path: node.target ? getNode(node.target)?.parent ?? PATHS.desktop : PATHS.desktop }),
    })
  }
  items.push({ separator: true }, { label: 'Properties', icon: 'fluent:info-24-regular', action: () => shell.properties(node) })
  os.openMenu(e.clientX, e.clientY, items)
}

let metaAlone = false
function onKeyDown(e: KeyboardEvent) {
  if (os.phase.value !== 'ready') return
  if (e.key === 'Meta' || e.key === 'OS') {
    metaAlone = true
    return
  }
  metaAlone = false
  if (e.key === 'Escape' && (os.menu.value || os.flyout.value)) os.closeOverlays()
}
function onKeyUp(e: KeyboardEvent) {
  if ((e.key === 'Meta' || e.key === 'OS') && metaAlone && os.phase.value === 'ready') os.toggleFlyout('start')
  metaAlone = false
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})

// Greet once per boot, right after the first sign-in.
let welcomed = false
watch(() => os.phase.value, (phase) => {
  if (phase === 'booting') welcomed = false
  if (phase !== 'ready' || welcomed) return
  welcomed = true
  setTimeout(() => {
    os.notify({
      app: 'Get Started',
      icon: 'windows',
      title: `Welcome to ${profile.name}'s PC 👋`,
      body: 'Double-click the icons on the desktop or open Start to explore my projects, skills and experience.',
      action: { label: 'Read about me', run: () => shell.openNode(PATHS.about) },
    })
  }, 900)
})
</script>

<template>
  <div class="shell" @pointerdown.capture="onShellPointerDown" @contextmenu="onShellContextMenu">
    <Transition name="wall">
      <div :key="os.wallpaperInfo.value.src" class="wallpaper" :style="{ backgroundImage: `url(${os.wallpaperInfo.value.src})` }" />
    </Transition>

    <div class="surface" @pointerdown="onSurfacePointerDown" @contextmenu="onSurfaceContextMenu" />

    <div ref="iconsEl" class="desktop-icons" :class="[`size-${iconSize}`, { refreshing }]">
      <button
        v-for="node in icons"
        :key="node.id"
        class="d-icon"
        :class="{ selected: selected.has(node.id) }"
        :data-id="node.id"
        @pointerdown.stop="onIconPointerDown($event, node)"
        @click="onIconClick($event, node)"
        @dblclick="open(node)"
        @keydown.enter="open(node)"
        @contextmenu.prevent.stop="onIconContextMenu($event, node)"
      >
        <OsIcon :name="node.icon" :size="ICON_PX[iconSize]" :shortcut="node.shortcut" />
        <span class="d-label">{{ node.name }}</span>
      </button>
    </div>

    <div v-if="marquee" class="marquee" :style="{ left: `${marquee.x}px`, top: `${marquee.y}px`, width: `${marquee.w}px`, height: `${marquee.h}px` }" />

    <OsWindowLayer />
    <OsTaskView />
    <OsStartMenu />
    <OsQuickSettings />
    <OsCalendarFlyout />
    <OsToasts />
    <OsTaskbar />
    <OsContextMenu />

    <div v-if="os.quick.value.nightLight" class="night-light" />
    <div class="brightness" :style="{ opacity: ((100 - os.quick.value.brightness) / 100) * 0.8 }" />
  </div>
</template>

<style scoped>
.shell {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #000;
}
.wallpaper {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}
.wall-enter-active,
.wall-leave-active {
  transition: opacity 0.6s ease;
}
.wall-enter-from,
.wall-leave-to {
  opacity: 0;
}
.surface {
  position: absolute;
  inset: 0;
}

.desktop-icons {
  --cell-w: 78px;
  --cell-h: 94px;
  position: absolute;
  inset: 4px 0 calc(var(--taskbar-h) + 4px) 2px;
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(auto-fill, var(--cell-h));
  grid-auto-columns: var(--cell-w);
  gap: 2px 2px;
  align-content: start;
  justify-content: start;
  pointer-events: none;
  transition: opacity 0.1s;
}
.desktop-icons.size-large { --cell-w: 108px; --cell-h: 128px; }
.desktop-icons.size-small { --cell-w: 72px; --cell-h: 78px; }
.desktop-icons.refreshing { opacity: 0; }

.d-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: var(--cell-w);
  height: var(--cell-h);
  padding: 5px 2px 2px;
  border: 1px solid transparent;
  border-radius: 4px;
  color: #fff;
  pointer-events: auto;
}
.d-icon:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.14);
}
.d-icon.selected {
  background: rgba(160, 200, 255, 0.3);
  border-color: rgba(190, 220, 255, 0.45);
}
.d-icon :deep(.os-icon) {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}
.d-label {
  max-width: 100%;
  font-size: 12px;
  line-height: 16px;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.75), 0 0 1px rgba(0, 0, 0, 0.6);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.marquee {
  position: absolute;
  z-index: 3;
  background: rgba(0, 102, 204, 0.3);
  border: 1px solid #0078d7;
  pointer-events: none;
}

.night-light {
  position: absolute;
  inset: 0;
  z-index: 18000;
  background: rgba(255, 138, 30, 0.2);
  mix-blend-mode: multiply;
  pointer-events: none;
}
.brightness {
  position: absolute;
  inset: 0;
  z-index: 18001;
  background: #000;
  pointer-events: none;
}
</style>
