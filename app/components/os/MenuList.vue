<script setup lang="ts">
import type { MenuItem } from '~/composables/useOs'

const props = defineProps<{ items: MenuItem[]; sub?: boolean }>()
const emit = defineEmits<{ done: [] }>()

const openIndex = ref<number | null>(null)
const root = ref<HTMLElement>()
const flipX = ref(false)
const shiftY = ref(0)
let hoverTimer: ReturnType<typeof setTimeout> | undefined

const hasChecks = computed(() => props.items.some(i => i.checked !== undefined))

onMounted(() => {
  if (!props.sub || !root.value) return
  const r = root.value.getBoundingClientRect()
  if (r.right > window.innerWidth - 4) flipX.value = true
  if (r.bottom > window.innerHeight - 4) shiftY.value = window.innerHeight - 4 - r.bottom
})

function hover(index: number, item: MenuItem) {
  clearTimeout(hoverTimer)
  hoverTimer = setTimeout(() => {
    openIndex.value = item.children && !item.disabled ? index : null
  }, item.children ? 120 : 200)
}

function run(index: number, item: MenuItem) {
  if (item.disabled) return
  if (item.children) {
    openIndex.value = index
    return
  }
  item.action?.()
  emit('done')
}
</script>

<template>
  <div
    ref="root"
    class="fl-menu menu-list"
    :class="{ sub, flip: flipX }"
    :style="shiftY ? { transform: `translateY(${shiftY}px)` } : undefined"
    role="menu"
  >
    <template v-for="(item, i) in items" :key="i">
      <div v-if="item.separator" class="fl-menu-sep" />
      <div v-else class="mi-wrap" @mouseenter="hover(i, item)">
        <button class="fl-menu-item" :class="{ open: openIndex === i }" :disabled="item.disabled" role="menuitem" @click="run(i, item)">
          <span v-if="hasChecks || item.icon" class="mi-lead">
            <Icon v-if="item.checked" name="fluent:checkmark-16-regular" size="16px" />
            <OsIcon v-else-if="item.icon && item.checked === undefined" :name="item.icon" :size="16" />
          </span>
          <span class="mi-label">{{ item.label }}</span>
          <span v-if="item.shortcut" class="mi-shortcut">{{ item.shortcut }}</span>
          <Icon v-if="item.children" name="fluent:chevron-right-16-regular" size="12px" class="mi-chev" />
        </button>
        <OsMenuList v-if="item.children && openIndex === i" :items="item.children" sub @done="emit('done')" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.menu-list {
  min-width: 200px;
}
.menu-list.sub {
  position: absolute;
  top: -5px;
  left: calc(100% + 2px);
  z-index: 2;
}
.menu-list.sub.flip {
  left: auto;
  right: calc(100% + 2px);
}
.mi-wrap {
  position: relative;
}
.mi-lead {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--text);
}
.fl-menu-item:disabled .mi-lead {
  opacity: 0.45;
}
.mi-label {
  flex: 1;
  padding-right: 12px;
}
.mi-shortcut {
  color: var(--text-2);
  font-size: 12px;
}
.mi-chev {
  color: var(--text-2);
}
</style>
