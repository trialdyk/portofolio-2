<script setup lang="ts">
import { profile } from '~/data/portfolio'

withDefaults(defineProps<{ size?: number }>(), { size: 32 })

const initials = profile.name
  .split(/\s+/)
  .map(w => w[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()
</script>

<template>
  <span class="avatar" :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.42)}px` }">
    <img v-if="profile.avatar" :src="profile.avatar" :alt="profile.name">
    <span v-else>{{ initials }}</span>
  </span>
</template>

<style scoped>
.avatar {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 50%;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 55%, #fff), var(--accent));
  color: var(--on-accent);
  font-family: var(--font-display);
  font-weight: 600;
  line-height: 1;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
