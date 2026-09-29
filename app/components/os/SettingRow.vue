<script setup lang="ts">
defineProps<{ icon?: string; title: string; subtitle?: string; clickable?: boolean; expanded?: boolean }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <component :is="clickable ? 'button' : 'div'" class="set-row" :class="{ clickable }" @click="clickable && $emit('click')">
    <OsIcon v-if="icon" :name="icon" :size="20" class="set-row-icon" />
    <span class="set-row-text">
      <span class="set-row-title">{{ title }}</span>
      <span v-if="subtitle" class="set-row-sub">{{ subtitle }}</span>
    </span>
    <span v-if="$slots.default" class="set-row-control" @click.stop>
      <slot />
    </span>
    <Icon
      v-if="clickable"
      :name="expanded === undefined ? 'fluent:chevron-right-16-regular' : expanded ? 'fluent:chevron-up-16-regular' : 'fluent:chevron-down-16-regular'"
      size="12px"
      class="set-row-chev"
    />
  </component>
</template>

<style scoped>
.set-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  min-height: 68px;
  padding: 12px 16px 12px 18px;
  border-radius: var(--radius-sm);
  background: var(--card);
  border: 1px solid var(--stroke);
  text-align: left;
}
.set-row.clickable:hover {
  background: var(--card-hover);
}
.set-row.clickable:active {
  background: var(--control-press);
}
.set-row-icon {
  color: var(--text);
}
.set-row-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.set-row-title {
  font-size: 14px;
  line-height: 20px;
}
.set-row-sub {
  color: var(--text-2);
  font-size: 12px;
  line-height: 16px;
}
.set-row-control {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  color: var(--text-2);
  font-size: 14px;
}
.set-row-chev {
  flex-shrink: 0;
  color: var(--text-2);
}
@container (max-width: 520px) {
  .set-row {
    flex-wrap: wrap;
  }
  .set-row-control {
    width: 100%;
    padding-left: 36px;
  }
}
</style>
