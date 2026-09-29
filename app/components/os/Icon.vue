<script setup lang="ts">
const props = withDefaults(defineProps<{ name: string; size?: number; shortcut?: boolean; color?: string }>(), { size: 24 })

const kind = computed(() => {
  if (props.name.startsWith('/') || props.name.startsWith('data:')) return 'src'
  return props.name.includes(':') ? 'iconify' : 'local'
})
const src = computed(() => (kind.value === 'src' ? props.name : `/icons/${props.name}.svg`))
</script>

<template>
  <span class="os-icon" :style="{ width: `${size}px`, height: `${size}px`, color }">
    <Icon v-if="kind === 'iconify'" :name="name" :size="size" />
    <img v-else class="os-icon-img" :src="src" :width="size" :height="size" alt="" draggable="false">
    <img v-if="shortcut" class="os-icon-arrow" src="/icons/shortcut-arrow.svg" alt="" draggable="false">
  </span>
</template>

<style scoped>
.os-icon {
  position: relative;
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  line-height: 0;
}
.os-icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
/* Wide iconify glyphs (e.g. logos:nuxt-icon) are 1.5em wide; keep them inside the square box. */
.os-icon :deep(.iconify) {
  max-width: 100%;
  background-size: contain !important;
  background-position: center !important;
  -webkit-mask-size: contain !important;
  mask-size: contain !important;
  -webkit-mask-position: center !important;
  mask-position: center !important;
}
.os-icon-arrow {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 36%;
  height: 36%;
  min-width: 8px;
  min-height: 8px;
}
</style>
