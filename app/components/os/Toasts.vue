<script setup lang="ts">
import type { Toast } from '~/composables/useOs'

const os = useOs()

function runAction(t: Toast) {
  os.dismissToast(t.id)
  t.action?.run()
}
</script>

<template>
  <TransitionGroup v-show="os.flyout.value !== 'calendar'" name="toast" tag="div" class="toast-stack">
    <article v-for="t in os.toasts.value" :key="t.id" class="toast acrylic" role="status">
      <header class="toast-head">
        <OsIcon :name="t.icon" :size="16" />
        <span>{{ t.app }}</span>
        <button class="fl-icon-btn toast-x" aria-label="Dismiss" @click="os.dismissToast(t.id)">
          <Icon name="fluent:dismiss-16-regular" size="12px" />
        </button>
      </header>
      <div class="toast-body">
        <b>{{ t.title }}</b>
        <p>{{ t.body }}</p>
      </div>
      <footer v-if="t.action" class="toast-actions">
        <button class="fl-btn accent" @click="runAction(t)">{{ t.action.label }}</button>
        <button class="fl-btn" @click="os.dismissToast(t.id)">Dismiss</button>
      </footer>
    </article>
  </TransitionGroup>
</template>

<style scoped>
.toast-stack {
  position: absolute;
  right: 12px;
  bottom: calc(var(--taskbar-h) + 12px);
  z-index: 1050;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(364px, calc(100vw - 24px));
  pointer-events: none;
}
.toast {
  pointer-events: auto;
  border-radius: var(--radius);
  border: 1px solid var(--stroke-2);
  box-shadow: var(--shadow-flyout);
  overflow: hidden;
}
.toast-head {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 4px 0 16px;
  font-size: 12px;
  color: var(--text-2);
}
.toast-x {
  margin-left: auto;
}
.toast-body {
  padding: 0 16px 16px;
}
.toast-body b {
  display: block;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}
.toast-body p {
  margin-top: 2px;
  color: var(--text-2);
  font-size: 13px;
  line-height: 18px;
}
.toast-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 0 16px 16px;
}
.toast-enter-active {
  transition: transform 0.36s var(--ease-out), opacity 0.2s ease;
}
.toast-leave-active {
  transition: transform 0.2s ease-in, opacity 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(110%);
}
</style>
