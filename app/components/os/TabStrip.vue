<script setup lang="ts">
export interface TabItem {
  id: number
  title: string
  icon?: string
  dirty?: boolean
}

withDefaults(defineProps<{ tabs: TabItem[]; active: number; addLabel?: string }>(), { addLabel: 'New tab' })
const emit = defineEmits<{ select: [id: number]; close: [id: number]; add: [] }>()
</script>

<template>
  <div class="tabstrip" data-drag>
    <div class="ts-tabs" data-drag>
      <slot name="before" />
      <div
        v-for="t in tabs"
        :key="t.id"
        class="ts-tab"
        :class="{ active: t.id === active }"
        :title="t.title"
        data-no-drag
        @pointerdown="emit('select', t.id)"
        @auxclick.middle.prevent="emit('close', t.id)"
      >
        <OsIcon v-if="t.icon" :name="t.icon" :size="16" />
        <span class="ts-title">{{ t.title }}</span>
        <button class="ts-close" :class="{ dirty: t.dirty }" aria-label="Close tab" @pointerdown.stop @click.stop="emit('close', t.id)">
          <span class="ts-dot" />
          <svg viewBox="0 0 10 10"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" /></svg>
        </button>
      </div>
      <button class="ts-add" :aria-label="addLabel" :title="addLabel" @click="emit('add')">
        <svg viewBox="0 0 12 12"><path d="M6 1v10M1 6h10" /></svg>
      </button>
      <slot name="after" />
    </div>
  </div>
</template>

<style scoped>
.tabstrip {
  display: flex;
  align-items: flex-end;
  height: 40px;
  flex-shrink: 0;
  padding: 0 146px 0 8px;
}
.ts-tabs {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  min-width: 0;
  height: 100%;
  flex: 1;
}
.ts-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 1 240px;
  min-width: 72px;
  height: 32px;
  padding: 0 4px 0 12px;
  border-radius: 8px 8px 0 0;
  font-size: 12px;
  color: var(--text-2);
}
.ts-tab:not(.active):hover {
  background: var(--subtle-hover);
  border-radius: 6px;
  height: 28px;
  margin-bottom: 4px;
}
.ts-tab.active {
  background: var(--tab-bg, var(--layer));
  color: var(--text);
  box-shadow: 0 0 0 1px var(--stroke);
  clip-path: inset(-1px -9px 0 -9px);
}
.ts-tab.active::before,
.ts-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  width: 8px;
  height: 8px;
}
.ts-tab.active::before {
  left: -8px;
  background: radial-gradient(circle at 0 0, transparent 7.5px, var(--tab-bg, var(--layer)) 8px);
}
.ts-tab.active::after {
  right: -8px;
  background: radial-gradient(circle at 100% 0, transparent 7.5px, var(--tab-bg, var(--layer)) 8px);
}
.ts-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ts-close {
  position: relative;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  color: var(--text-2);
}
.ts-close:hover {
  background: var(--subtle-hover);
  color: var(--text);
}
.ts-close svg {
  width: 10px;
  height: 10px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.1;
}
.ts-dot {
  display: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-2);
}
.ts-close.dirty:not(:hover) svg {
  display: none;
}
.ts-close.dirty:not(:hover) .ts-dot {
  display: block;
}
.ts-add {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 28px;
  margin: 0 0 4px 4px;
  border-radius: 6px;
  color: var(--text);
}
.ts-add:hover {
  background: var(--subtle-hover);
}
.ts-add svg {
  width: 12px;
  height: 12px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.1;
}
</style>
