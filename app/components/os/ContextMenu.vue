<script setup lang="ts">
const os = useOs()
const el = ref<HTMLElement>()
const pos = ref({ x: 0, y: 0 })

watch(
  () => os.menu.value,
  async (menu) => {
    if (!menu) return
    pos.value = { x: menu.x, y: menu.y }
    await nextTick()
    const r = el.value?.getBoundingClientRect()
    if (!r) return
    const above = menu.placement === 'above' || menu.y + r.height > window.innerHeight - 4
    pos.value = {
      x: Math.max(4, Math.min(menu.x, window.innerWidth - r.width - 4)),
      y: above ? Math.max(4, menu.y - r.height) : menu.y,
    }
  },
)
</script>

<template>
  <Transition name="menu">
    <div
      v-if="os.menu.value"
      :key="`${os.menu.value.x}:${os.menu.value.y}`"
      ref="el"
      class="ctx"
      data-menu
      :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
      @contextmenu.prevent
    >
      <OsMenuList :items="os.menu.value.items" @done="os.menu.value = null" />
    </div>
  </Transition>
</template>

<style scoped>
.ctx {
  position: fixed;
  z-index: 1300;
}
.menu-enter-active {
  transition: opacity 0.12s ease, transform 0.2s var(--ease-out);
}
.menu-leave-active {
  transition: opacity 0.08s ease;
}
.menu-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.menu-leave-to {
  opacity: 0;
}
</style>
