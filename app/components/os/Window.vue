<script setup lang="ts">
import type { Component } from 'vue'
import type { Rect, WinState } from '~/composables/useWindows'
import { APPS, type AppId } from '~/utils/apps'
import Explorer from '~/components/apps/Explorer.vue'
import Notepad from '~/components/apps/Notepad.vue'
import Terminal from '~/components/apps/Terminal.vue'
import Settings from '~/components/apps/Settings.vue'
import Edge from '~/components/apps/Edge.vue'
import Photos from '~/components/apps/Photos.vue'
import Mail from '~/components/apps/Mail.vue'
import Dialog from '~/components/apps/Dialog.vue'

const APP_COMPONENTS: Record<AppId, Component> = {
  explorer: Explorer,
  notepad: Notepad,
  terminal: Terminal,
  settings: Settings,
  edge: Edge,
  photos: Photos,
  mail: Mail,
  dialog: Dialog,
}

const RESIZE_DIRS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const
type ResizeDir = (typeof RESIZE_DIRS)[number]

const props = defineProps<{ win: WinState }>()
const wm = useWindows()

const meta = computed(() => APPS[props.win.appId])
const active = computed(() => wm.activeId.value === props.win.id)
const captionHeight = computed(() => `${meta.value.captionHeight ?? 32}px`)
const canResize = computed(() => meta.value.resizable !== false && !props.win.maximized)

const el = ref<HTMLElement>()
const dragging = ref(false)
const resizing = ref(false)
const animating = ref(false)

const style = computed(() => {
  const w = props.win
  const s: Record<string, string | number> = { zIndex: w.z + (dragging.value ? 1 : 0) }
  if (!w.maximized) {
    s.left = `${w.x}px`
    s.top = `${w.y}px`
    s.width = `${w.w}px`
    if (!meta.value.autoHeight) s.height = `${w.h}px`
  }
  return s
})

let animTimer: ReturnType<typeof setTimeout> | undefined
watch(() => [props.win.maximized, props.win.snap], () => {
  if (dragging.value) return
  animating.value = true
  clearTimeout(animTimer)
  animTimer = setTimeout(() => (animating.value = false), 280)
})

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
const setBusy = (on: boolean) => document.body.classList.toggle('wm-busy', on)
const isChrome = (t: HTMLElement) => !!t.closest('[data-drag]') && !t.closest('button, input, textarea, select, a, [data-no-drag]')

function onPointerDown(e: PointerEvent) {
  if (!active.value || wm.windows.value.some(w => w.z > props.win.z)) wm.focus(props.win.id)
  if (e.button !== 0 || isCompact() || !isChrome(e.target as HTMLElement)) return
  startDrag(e)
}

function onDblClick(e: MouseEvent) {
  if (isChrome(e.target as HTMLElement)) wm.toggleMaximize(props.win.id)
}

function startDrag(e: PointerEvent) {
  const w = props.win
  const start = { x: e.clientX, y: e.clientY }
  const before: Rect = w.snap && w.restore ? { ...w.restore } : { x: w.x, y: w.y, w: w.w, h: w.h }
  let origin = { x: w.x, y: w.y }
  let moved = false

  const onMove = (ev: PointerEvent) => {
    const dx = ev.clientX - start.x
    const dy = ev.clientY - start.y
    if (!moved) {
      if (Math.abs(dx) + Math.abs(dy) < 4) return
      moved = true
      dragging.value = true
      setBusy(true)
      if (w.maximized || w.snap) {
        const rect = el.value!.getBoundingClientRect()
        const ratio = (start.x - rect.left) / rect.width
        const size = w.snap && w.restore ? w.restore : { w: w.w, h: w.h }
        w.maximized = false
        w.snap = null
        w.restore = null
        w.w = size.w
        w.h = size.h
        origin = { x: start.x - size.w * ratio, y: rect.top }
      }
    }
    const area = workArea()
    w.x = Math.round(clamp(origin.x + dx, -w.w + 120, area.w - 120))
    w.y = Math.round(clamp(origin.y + dy, 0, area.h - 40))
    if (meta.value.maximizable === false) return
    wm.snapPreview.value = ev.clientY <= 2 ? 'max' : ev.clientX <= 2 ? 'left' : ev.clientX >= window.innerWidth - 3 ? 'right' : null
  }

  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
    if (!moved) return
    const zone = wm.snapPreview.value
    wm.snapPreview.value = null
    dragging.value = false
    setBusy(false)
    if (zone) wm.snapTo(w.id, zone, before)
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}

function startResize(e: PointerEvent, dir: ResizeDir) {
  if (e.button !== 0) return
  e.preventDefault()
  wm.focus(props.win.id)
  const w = props.win
  w.snap = null
  w.restore = null
  const start = { x: e.clientX, y: e.clientY, left: w.x, top: w.y, width: w.w, height: w.h }
  const minW = meta.value.minWidth ?? 320
  const minH = meta.value.minHeight ?? 200
  resizing.value = true
  setBusy(true)

  const onMove = (ev: PointerEvent) => {
    const dx = ev.clientX - start.x
    const dy = ev.clientY - start.y
    if (dir.includes('e')) w.w = Math.max(minW, start.width + dx)
    if (dir.includes('s')) w.h = Math.max(minH, Math.min(start.height + dy, workArea().h - start.top))
    if (dir.includes('w')) {
      const width = Math.max(minW, start.width - dx)
      w.x = start.left + start.width - width
      w.w = width
    }
    if (dir.includes('n')) {
      const top = clamp(start.top + dy, 0, start.top + start.height - minH)
      w.h = start.top + start.height - top
      w.y = top
    }
  }
  const onUp = () => {
    resizing.value = false
    setBusy(false)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}
</script>

<template>
  <section
    ref="el"
    class="window"
    :class="{
      active,
      maximized: win.maximized,
      minimized: win.minimized,
      snapped: !!win.snap,
      animating,
      dragging,
      'is-dialog': meta.autoHeight,
    }"
    :style="style"
    role="dialog"
    :aria-label="win.title"
    @pointerdown="onPointerDown"
    @dblclick="onDblClick"
  >
    <div class="win-frame">
      <header v-if="meta.titlebar !== 'custom'" class="titlebar" data-drag :style="{ height: captionHeight }">
        <OsIcon v-if="!meta.autoHeight" :name="meta.icon" :size="16" />
        <span class="title">{{ win.title }}</span>
      </header>
      <div class="win-body">
        <component :is="APP_COMPONENTS[win.appId]" :win="win" :active="active" />
      </div>
      <div class="captions" :style="{ height: captionHeight }">
        <button v-if="meta.minimizable !== false" class="cap" aria-label="Minimize" @click="wm.minimize(win.id)">
          <svg viewBox="0 0 10 10"><path d="M0 5.5h10" /></svg>
        </button>
        <button v-if="meta.maximizable !== false" class="cap cap-max" :aria-label="win.maximized ? 'Restore Down' : 'Maximize'" @click="wm.toggleMaximize(win.id)">
          <svg v-if="win.maximized || win.snap" viewBox="0 0 10 10">
            <path d="M2.5 2.5v-1a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-1" />
            <rect x=".5" y="2.5" width="7" height="7" rx="1" />
          </svg>
          <svg v-else viewBox="0 0 10 10"><rect x=".5" y=".5" width="9" height="9" rx="1.5" /></svg>
        </button>
        <button class="cap cap-close" aria-label="Close" @click="wm.close(win.id)">
          <svg viewBox="0 0 10 10"><path d="M.5.5l9 9M9.5.5l-9 9" /></svg>
        </button>
      </div>
    </div>
    <template v-if="canResize">
      <div v-for="d in RESIZE_DIRS" :key="d" class="rz" :class="`rz-${d}`" @pointerdown.stop="startResize($event, d)" />
    </template>
  </section>
</template>

<style scoped>
.window {
  position: absolute;
  pointer-events: auto;
  border-radius: var(--radius);
  box-shadow: var(--shadow-window-inactive);
  transition: opacity 0.18s ease, transform 0.22s var(--ease-out), box-shadow 0.2s ease, visibility 0s;
}
.window.active {
  box-shadow: var(--shadow-window);
}
.window.animating {
  transition: left 0.26s var(--ease-out), top 0.26s var(--ease-out), width 0.26s var(--ease-out), height 0.26s var(--ease-out), opacity 0.18s ease, transform 0.22s var(--ease-out), box-shadow 0.2s ease;
}
.window.maximized {
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border-radius: 0;
  box-shadow: none;
}
.window.minimized {
  opacity: 0;
  transform: translateY(40%) scale(0.55);
  pointer-events: none;
  visibility: hidden;
  transition: opacity 0.2s ease, transform 0.26s var(--ease-in-out), visibility 0s linear 0.26s;
}
.window.dragging {
  transition: box-shadow 0.2s ease;
}

.win-frame {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
  border: 1px solid var(--win-stroke);
  background: var(--mica-inactive);
  transition: background 0.2s ease;
}
.window.active .win-frame {
  background: var(--mica);
}
.window.maximized .win-frame {
  border: 0;
}

.titlebar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  padding: 0 150px 0 14px;
  font-size: 12px;
}
.is-dialog .titlebar {
  padding-left: 16px;
}
.title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--text);
}
.window:not(.active) .title {
  color: var(--text-3);
}

.win-body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.win-body > :deep(*) {
  flex: 1;
  min-height: 0;
}

.captions {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 5;
  display: flex;
}
.cap {
  display: grid;
  place-items: center;
  width: 46px;
  height: 100%;
  color: var(--text);
  transition: background 0.1s, color 0.1s;
}
.window:not(.active) .cap {
  color: var(--text-3);
}
.cap svg {
  width: 10px;
  height: 10px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1;
  overflow: visible;
}
.cap:hover {
  background: var(--subtle-hover);
  color: var(--text);
}
.cap:active {
  background: var(--subtle-press);
  color: var(--text-2);
}
.cap-close:hover,
.window:not(.active) .cap-close:hover {
  background: #c42b1c;
  color: #fff;
}
.cap-close:active {
  background: #c83c31;
  color: rgba(255, 255, 255, 0.8);
}
.window:not(.maximized) .cap-close {
  border-top-right-radius: calc(var(--radius) - 1px);
}

.rz {
  position: absolute;
  z-index: 6;
}
.rz-n { top: -4px; left: 8px; right: 8px; height: 8px; cursor: ns-resize; }
.rz-s { bottom: -4px; left: 8px; right: 8px; height: 8px; cursor: ns-resize; }
.rz-e { right: -4px; top: 8px; bottom: 8px; width: 8px; cursor: ew-resize; }
.rz-w { left: -4px; top: 8px; bottom: 8px; width: 8px; cursor: ew-resize; }
.rz-ne { top: -4px; right: -4px; width: 14px; height: 14px; cursor: nesw-resize; }
.rz-sw { bottom: -4px; left: -4px; width: 14px; height: 14px; cursor: nesw-resize; }
.rz-nw { top: -4px; left: -4px; width: 14px; height: 14px; cursor: nwse-resize; }
.rz-se { bottom: -4px; right: -4px; width: 14px; height: 14px; cursor: nwse-resize; }

@media (max-width: 767px) {
  .window:not(.is-dialog) {
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: 100% !important;
    border-radius: 0;
    box-shadow: none;
  }
  .window:not(.is-dialog) .win-frame {
    border: 0;
  }
  .cap-max,
  .rz {
    display: none;
  }
}
</style>
