<script setup lang="ts">
import { preloadAssets } from '~/utils/preload'

const emit = defineEmits<{ done: [] }>()
const os = useOs()
const contentHidden = ref(false)
const leaving = ref(false)

const VISITED_KEY = 'win11-portfolio:visited'
const MAX_WAIT_MS = 12000
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function isReturningVisitor() {
  try {
    return localStorage.getItem(VISITED_KEY) === '1'
  }
  catch {
    return false
  }
}

onMounted(async () => {
  const minBootMs = isReturningVisitor() ? 1200 : 3000
  const started = performance.now()
  await Promise.race([preloadAssets(os.wallpaperInfo.value.src), wait(MAX_WAIT_MS)])
  const elapsed = performance.now() - started
  if (elapsed < minBootMs) await wait(minBootMs - elapsed)
  try {
    localStorage.setItem(VISITED_KEY, '1')
  }
  catch {
    // storage unavailable — every visit gets the full boot
  }
  contentHidden.value = true
  await wait(450)
  leaving.value = true
  await wait(700)
  emit('done')
})
</script>

<template>
  <div class="boot-screen" :class="{ leaving }" role="progressbar" aria-label="Starting Windows">
    <div class="boot-content" :class="{ hidden: contentHidden }">
      <OsBootVisual />
    </div>
  </div>
</template>

<style scoped>
.boot-screen {
  transition: opacity 0.7s ease;
}
.boot-screen.leaving {
  opacity: 0;
  pointer-events: none;
}
.boot-content {
  transition: opacity 0.45s ease;
}
.boot-content.hidden {
  opacity: 0;
}
</style>
