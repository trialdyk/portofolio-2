<script setup lang="ts">
import type { WinState } from '~/composables/useWindows'
import { PATHS, childrenOf, displayPath, formatDate, formatSize, getNode, type FsNode } from '~/utils/fs'
import { WALLPAPERS } from '~/utils/theme'
import { projects } from '~/data/portfolio'

const props = defineProps<{ win: WinState; active: boolean }>()
const wm = useWindows()
const os = useOs()

const root = ref<HTMLElement>()
const images = ref<FsNode[]>([])
const index = ref(0)
const scale = ref(1)
const rotation = ref(0)
const offset = reactive({ x: 0, y: 0 })
const showInfo = ref(false)
const liked = ref(new Set<string>())

const current = computed(() => images.value[index.value])
const project = computed(() => {
  const n = current.value
  if (!n) return undefined
  const parent = getNode(n.parent)
  if (parent?.project) return parent.project
  const slug = n.name.replace(/-\d+\.png$/, '')
  return projects.find(p => p.slug === slug)
})
const wallpaper = computed(() => WALLPAPERS.find(w => w.src === current.value?.image))

function resetView() {
  scale.value = 1
  rotation.value = 0
  offset.x = 0
  offset.y = 0
}

function load(p: Record<string, unknown>) {
  const node = typeof p.file === 'string' ? getNode(p.file) : undefined
  const target = node?.image ? node : childrenOf(PATHS.screenshots)[0]
  if (!target) return
  const siblings = target.parent ? childrenOf(target.parent).filter(n => n.image) : [target]
  images.value = siblings
  index.value = Math.max(0, siblings.findIndex(n => n.id === target.id))
  resetView()
}
load(props.win.props)
watch(() => props.win.launch, () => load(props.win.props))
watch(current, (n) => {
  if (n) wm.setTitle(props.win.id, `Photos - ${n.name}`)
}, { immediate: true })
watch(() => props.active, (a) => {
  if (a) root.value?.focus({ preventScroll: true })
})
onMounted(() => root.value?.focus({ preventScroll: true }))

function go(delta: number) {
  const count = images.value.length
  if (count < 2) return
  index.value = (index.value + delta + count) % count
  resetView()
}

function zoomBy(factor: number) {
  scale.value = Math.min(8, Math.max(0.2, scale.value * factor))
  if (scale.value <= 1) {
    offset.x = 0
    offset.y = 0
  }
}

function onWheel(e: WheelEvent) {
  zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15)
}

function toggleZoom() {
  if (scale.value === 1) zoomBy(2)
  else resetView()
}

function startPan(e: PointerEvent) {
  if (scale.value <= 1 || e.button !== 0) return
  const start = { x: e.clientX - offset.x, y: e.clientY - offset.y }
  const move = (ev: PointerEvent) => {
    offset.x = ev.clientX - start.x
    offset.y = ev.clientY - start.y
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}

function toggleLike() {
  const n = current.value
  if (!n) return
  const next = new Set(liked.value)
  if (next.has(n.id)) next.delete(n.id)
  else next.add(n.id)
  liked.value = next
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') go(-1)
  else if (e.key === 'ArrowRight') go(1)
  else if (e.key === '+' || e.key === '=') zoomBy(1.25)
  else if (e.key === '-') zoomBy(0.8)
  else if (e.key === '0') resetView()
}

function openMore(e: MouseEvent) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const n = current.value
  os.openMenu(r.right - 240, r.bottom + 4, [
    {
      label: 'Set as desktop background',
      icon: 'fluent:image-24-regular',
      disabled: !wallpaper.value,
      action: () => wallpaper.value && os.setWallpaper(wallpaper.value.id),
    },
    { label: 'Open file location', icon: 'fluent:folder-open-24-regular', disabled: !n?.parent, action: () => n?.parent && wm.openApp('explorer', { path: n.parent }) },
    ...(project.value ? [{ label: `Open ${project.value.name}`, icon: 'folder', action: () => wm.openApp('explorer', { path: `${PATHS.projects}/${project.value!.name}` }) }] : []),
    { separator: true },
    { label: 'File information', icon: 'fluent:info-24-regular', checked: showInfo.value, action: () => (showInfo.value = !showInfo.value) },
  ])
}
</script>

<template>
  <div ref="root" class="photos" tabindex="-1" @keydown="onKey">
    <header class="ph-title" data-drag>
      <OsIcon name="photos" :size="16" />
      <span class="ph-name">{{ current?.name ?? 'Photos' }}</span>
      <span v-if="images.length > 1" class="ph-count">{{ index + 1 }} / {{ images.length }}</span>
    </header>

    <div class="ph-toolbar">
      <button class="fl-icon-btn" aria-label="Zoom out" @click="zoomBy(0.8)"><Icon name="fluent:zoom-out-20-regular" size="18px" /></button>
      <button class="ph-zoom" title="Reset zoom" @click="resetView">{{ Math.round(scale * 100) }}%</button>
      <button class="fl-icon-btn" aria-label="Zoom in" @click="zoomBy(1.25)"><Icon name="fluent:zoom-in-20-regular" size="18px" /></button>
      <span class="ph-sep" />
      <button class="fl-icon-btn" aria-label="Rotate" @click="rotation += 90"><Icon name="fluent:arrow-rotate-clockwise-20-regular" size="18px" /></button>
      <button class="fl-icon-btn" :aria-label="current && liked.has(current.id) ? 'Unfavorite' : 'Favorite'" @click="toggleLike">
        <Icon :name="current && liked.has(current.id) ? 'fluent:heart-20-filled' : 'fluent:heart-20-regular'" size="18px" :class="{ liked: current && liked.has(current.id) }" />
      </button>
      <button class="fl-icon-btn" aria-label="Delete" disabled><Icon name="fluent:delete-20-regular" size="18px" /></button>
      <span class="ph-sep" />
      <button class="fl-icon-btn" :class="{ on: showInfo }" aria-label="File information" @click="showInfo = !showInfo"><Icon name="fluent:info-20-regular" size="18px" /></button>
      <button class="fl-icon-btn" aria-label="See more" @click="openMore"><Icon name="fluent:more-horizontal-20-regular" size="18px" /></button>
    </div>

    <div class="ph-main">
      <div class="ph-stage" :class="{ pannable: scale > 1 }" @wheel.prevent="onWheel" @pointerdown="startPan" @dblclick="toggleZoom">
        <img
          v-if="current"
          :key="current.id"
          :src="current.image"
          alt=""
          draggable="false"
          class="ph-img"
          :style="{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotation}deg)` }"
        >
        <p v-else class="ph-empty">No photos to show.</p>
        <template v-if="images.length > 1">
          <button class="ph-nav prev" aria-label="Previous" @click.stop="go(-1)" @dblclick.stop>
            <Icon name="fluent:chevron-left-20-regular" size="18px" />
          </button>
          <button class="ph-nav next" aria-label="Next" @click.stop="go(1)" @dblclick.stop>
            <Icon name="fluent:chevron-right-20-regular" size="18px" />
          </button>
        </template>
      </div>

      <aside v-if="showInfo && current" class="ph-info">
        <h3>File information</h3>
        <dl>
          <dt>Name</dt><dd>{{ current.name }}</dd>
          <dt>Date modified</dt><dd>{{ formatDate(current.modified) }}</dd>
          <dt>Size</dt><dd>{{ formatSize(current.bytes) }}</dd>
          <dt>Folder</dt><dd>{{ current.parent ? displayPath(current.parent) : '' }}</dd>
        </dl>
        <template v-if="project">
          <h3>Project</h3>
          <p class="ph-proj-name">{{ project.name }}</p>
          <p class="ph-proj-desc">{{ project.summary }}</p>
          <button class="fl-btn accent" @click="wm.openApp('explorer', { path: `${PATHS.projects}/${project.name}` })">Open project</button>
        </template>
        <template v-if="wallpaper">
          <h3>Wallpaper</h3>
          <button class="fl-btn" @click="os.setWallpaper(wallpaper.id)">Set as desktop background</button>
        </template>
      </aside>
    </div>

    <div v-if="images.length > 1" class="ph-film">
      <button
        v-for="(img, i) in images"
        :key="img.id"
        class="ph-thumb"
        :class="{ on: i === index }"
        :title="img.name"
        @click="index = i; resetView()"
      >
        <img :src="img.image" alt="" loading="lazy" draggable="false">
      </button>
    </div>
  </div>
</template>

<style scoped>
.photos {
  display: flex;
  flex-direction: column;
  height: 100%;
  outline: none;
}
.ph-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  height: 40px;
  padding: 0 150px 0 14px;
  font-size: 12px;
}
.ph-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ph-count {
  color: var(--text-2);
}
.ph-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-shrink: 0;
  height: 44px;
  padding: 0 8px;
}
.ph-zoom {
  min-width: 52px;
  height: 32px;
  border-radius: 4px;
  font-size: 13px;
}
.ph-zoom:hover {
  background: var(--subtle-hover);
}
.ph-sep {
  width: 1px;
  height: 20px;
  margin: 0 8px;
  background: var(--divider);
}
.liked {
  color: #e81123;
}
.ph-main {
  display: flex;
  flex: 1;
  min-height: 0;
}
.ph-stage {
  position: relative;
  display: grid;
  place-items: center;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  padding: 12px 56px;
}
.ph-stage.pannable {
  cursor: grab;
}
.ph-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 2px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.22);
  transition: transform 0.18s var(--ease-out);
}
.ph-stage.pannable .ph-img {
  transition: none;
}
.ph-empty {
  color: var(--text-2);
}
.ph-nav {
  position: absolute;
  top: 50%;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-top: -18px;
  border-radius: 50%;
  background: var(--acrylic-strong);
  border: 1px solid var(--stroke-2);
  box-shadow: var(--shadow-menu);
  opacity: 0;
  transition: opacity 0.15s;
}
.ph-stage:hover .ph-nav {
  opacity: 1;
}
.ph-nav.prev {
  left: 12px;
}
.ph-nav.next {
  right: 12px;
}
.ph-info {
  flex-shrink: 0;
  width: 280px;
  padding: 8px 20px 20px;
  overflow-y: auto;
  border-left: 1px solid var(--divider);
  font-size: 13px;
}
.ph-info h3 {
  margin: 14px 0 8px;
  font-size: 14px;
  font-weight: 600;
}
.ph-info dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 12px;
  margin: 0;
  font-size: 12px;
}
.ph-info dt {
  color: var(--text-2);
}
.ph-info dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.ph-proj-name {
  font-weight: 600;
}
.ph-proj-desc {
  margin: 4px 0 12px;
  color: var(--text-2);
}
.ph-film {
  display: flex;
  justify-content: safe center;
  gap: 6px;
  flex-shrink: 0;
  height: 76px;
  padding: 8px 12px 12px;
  overflow-x: auto;
}
.ph-thumb {
  flex-shrink: 0;
  width: 80px;
  height: 56px;
  padding: 2px;
  border-radius: 6px;
  border: 2px solid transparent;
  opacity: 0.75;
  transition: opacity 0.12s, border-color 0.12s;
}
.ph-thumb:hover {
  opacity: 1;
}
.ph-thumb.on {
  border-color: var(--accent);
  opacity: 1;
}
.ph-thumb img {
  width: 100%;
  height: 100%;
  border-radius: 3px;
  object-fit: cover;
}
@media (max-width: 767px) {
  .ph-info {
    display: none;
  }
  .ph-stage {
    padding: 8px;
  }
}
</style>
