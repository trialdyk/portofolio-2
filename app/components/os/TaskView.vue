<script setup lang="ts">
import { APPS } from '~/utils/apps'

const os = useOs()
const wm = useWindows()

const windows = computed(() => wm.windows.value.filter(w => !APPS[w.appId].skipTaskbar).sort((a, b) => b.z - a.z))

function pick(id: string) {
  os.closeOverlays()
  wm.focus(id)
}
</script>

<template>
  <Transition name="tv">
    <div v-if="os.flyout.value === 'taskview'" class="taskview" data-flyout @click.self="os.closeOverlays()">
      <div class="tv-grid" @click.self="os.closeOverlays()">
        <div
          v-for="w in windows"
          :key="w.id"
          class="tv-card"
          role="button"
          tabindex="0"
          @click="pick(w.id)"
          @keydown.enter="pick(w.id)"
        >
          <header class="tv-head">
            <OsIcon :name="APPS[w.appId].icon" :size="16" />
            <span>{{ w.title }}</span>
            <button class="fl-icon-btn tv-close" aria-label="Close window" @click.stop="wm.close(w.id)">
              <Icon name="fluent:dismiss-16-regular" size="12px" />
            </button>
          </header>
          <div class="tv-thumb" :style="{ backgroundImage: `url(${os.wallpaperInfo.value.src})` }">
            <div class="tv-thumb-inner">
              <OsIcon :name="APPS[w.appId].icon" :size="56" />
            </div>
          </div>
        </div>
        <p v-if="!windows.length" class="tv-empty">No open windows. Open an app from the taskbar or Start.</p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.taskview {
  position: absolute;
  inset: 0 0 var(--taskbar-h) 0;
  z-index: 1090;
  display: grid;
  place-items: center;
  padding: 32px;
  background: rgba(0, 0, 0, 0.25);
  -webkit-backdrop-filter: blur(30px) saturate(1.2);
  backdrop-filter: blur(30px) saturate(1.2);
}
.tv-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: center;
  gap: 24px;
  width: 100%;
  height: 100%;
}
.tv-card {
  width: 280px;
  padding: 0 0 8px;
  border-radius: var(--radius);
  background: var(--acrylic-strong);
  border: 1px solid var(--stroke-2);
  box-shadow: var(--shadow-flyout);
  transition: transform 0.15s var(--ease-out), outline-color 0.1s;
  outline: 3px solid transparent;
}
.tv-card:hover {
  outline-color: var(--text-3);
}
.tv-head {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 36px;
  padding: 0 4px 0 12px;
  font-size: 12px;
}
.tv-head > span:not(.os-icon) {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.tv-close {
  width: 28px;
  height: 28px;
  opacity: 0;
}
.tv-card:hover .tv-close {
  opacity: 1;
}
.tv-close:hover {
  background: #c42b1c;
  color: #fff;
}
.tv-thumb {
  margin: 0 8px;
  height: 160px;
  border-radius: 4px;
  background-size: cover;
  background-position: center;
  overflow: hidden;
}
.tv-thumb-inner {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background: color-mix(in srgb, var(--mica) 80%, transparent);
}
.tv-empty {
  color: #fff;
  font-size: 14px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}
.tv-enter-active,
.tv-leave-active {
  transition: opacity 0.2s ease;
}
.tv-enter-from,
.tv-leave-to {
  opacity: 0;
}
</style>
