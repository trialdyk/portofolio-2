<script setup lang="ts">
const os = useOs()

useHead({
  htmlAttrs: {
    'data-theme': computed(() => os.theme.value),
    'style': computed(() => `--accent-l:${os.accentColors.value.light};--accent-d:${os.accentColors.value.dark}`),
  },
})
</script>

<template>
  <OsDesktop />
  <OsLockScreen />
  <OsBootScreen v-if="os.phase.value === 'booting'" @done="os.lock()" />
  <OsPowerScreen />
</template>
