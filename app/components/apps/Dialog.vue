<script setup lang="ts">
import type { WinState } from '~/composables/useWindows'

const props = defineProps<{ win: WinState; active: boolean }>()
const wm = useWindows()
const okButton = ref<HTMLButtonElement>()

const data = computed(() => props.win.props as { message?: string; icon?: string; rows?: [string, string][] })

onMounted(() => okButton.value?.focus())
</script>

<template>
  <div class="dlg" @keydown.esc="wm.close(win.id)">
    <div class="dlg-main">
      <OsIcon v-if="data.icon" :name="data.icon" :size="32" />
      <div class="dlg-text selectable">
        <p v-if="data.message">{{ data.message }}</p>
        <dl v-if="data.rows?.length" class="dlg-rows">
          <template v-for="[label, value] in data.rows" :key="label">
            <dt>{{ label }}:</dt>
            <dd>{{ value }}</dd>
          </template>
        </dl>
      </div>
    </div>
    <footer class="dlg-foot">
      <button ref="okButton" class="fl-btn accent" @click="wm.close(win.id)">OK</button>
    </footer>
  </div>
</template>

<style scoped>
.dlg {
  display: flex;
  flex-direction: column;
  background: var(--surface);
}
.dlg-main {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px 28px;
}
.dlg-text {
  min-width: 0;
  padding-top: 5px;
  line-height: 20px;
}
.dlg-rows {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
  margin: 0;
  font-size: 13px;
}
.dlg-rows dt {
  color: var(--text-2);
}
.dlg-rows dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.dlg-foot {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  background: var(--mica-inactive);
  border-top: 1px solid var(--divider);
}
.dlg-foot .fl-btn {
  min-width: 120px;
}
</style>
