<script setup lang="ts">
const wm = useWindows()

const preview = computed(() => (wm.snapPreview.value ? snapRect(wm.snapPreview.value) : null))
const topZ = computed(() => Math.max(0, ...wm.windows.value.map(w => w.z)))
</script>

<template>
  <div class="window-layer">
    <Transition name="snap">
      <div
        v-if="preview"
        class="snap-preview"
        :style="{
          left: `${preview.x + 8}px`,
          top: `${preview.y + 8}px`,
          width: `${preview.w - 16}px`,
          height: `${preview.h - 16}px`,
          zIndex: topZ,
        }"
      />
    </Transition>
    <TransitionGroup name="win">
      <OsWindow v-for="w in wm.windows.value" :key="w.id" :win="w" />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.window-layer {
  position: absolute;
  inset: 0 0 var(--taskbar-h) 0;
  z-index: 10;
  pointer-events: none;
}
.snap-preview {
  position: absolute;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.45);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  backdrop-filter: blur(24px) saturate(1.4);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  transition: left 0.2s var(--ease-out), top 0.2s var(--ease-out), width 0.2s var(--ease-out), height 0.2s var(--ease-out);
}
.snap-enter-active,
.snap-leave-active {
  transition: opacity 0.18s ease, transform 0.22s var(--ease-out);
}
.snap-enter-from,
.snap-leave-to {
  opacity: 0;
  transform: scale(0.94);
}

.win-enter-active {
  transition: opacity 0.16s ease, transform 0.24s var(--ease-out) !important;
}
.win-leave-active {
  transition: opacity 0.12s ease, transform 0.14s ease-in !important;
}
.win-enter-from {
  opacity: 0;
  transform: scale(0.92);
}
.win-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
