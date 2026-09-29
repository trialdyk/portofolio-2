<script setup lang="ts">
const os = useOs()
const wm = useWindows()
const q = os.quick

const tiles = computed(() => [
  {
    key: 'wifi',
    label: q.value.wifi && !q.value.airplane ? 'Portfolio-5G' : 'Wi-Fi',
    icon: q.value.wifi && !q.value.airplane ? 'fluent:wifi-1-24-regular' : 'fluent:wifi-off-24-regular',
    on: q.value.wifi && !q.value.airplane,
    toggle: () => {
      q.value.wifi = !q.value.wifi
      if (q.value.wifi) q.value.airplane = false
    },
  },
  {
    key: 'bluetooth',
    label: 'Bluetooth',
    icon: 'fluent:bluetooth-24-regular',
    on: q.value.bluetooth && !q.value.airplane,
    toggle: () => {
      q.value.bluetooth = !q.value.bluetooth
      if (q.value.bluetooth) q.value.airplane = false
    },
  },
  {
    key: 'airplane',
    label: 'Airplane mode',
    icon: 'fluent:airplane-24-regular',
    on: q.value.airplane,
    toggle: () => {
      q.value.airplane = !q.value.airplane
      if (q.value.airplane) {
        q.value.wifi = false
        q.value.bluetooth = false
      }
    },
  },
  {
    key: 'saver',
    label: 'Energy saver',
    icon: 'fluent:leaf-one-24-regular',
    on: q.value.saver,
    toggle: () => (q.value.saver = !q.value.saver),
  },
  {
    key: 'dark',
    label: 'Dark mode',
    icon: 'fluent:dark-theme-24-regular',
    on: os.theme.value === 'dark',
    toggle: () => os.setTheme(os.theme.value === 'dark' ? 'light' : 'dark'),
  },
  {
    key: 'night',
    label: 'Night light',
    icon: 'fluent:weather-moon-24-regular',
    on: q.value.nightLight,
    toggle: () => (q.value.nightLight = !q.value.nightLight),
  },
])

const volumeIcon = computed(() => {
  const v = q.value.volume
  if (v === 0) return 'fluent:speaker-mute-24-regular'
  return v < 50 ? 'fluent:speaker-1-24-regular' : 'fluent:speaker-2-24-regular'
})

function openSettings() {
  os.closeOverlays()
  wm.openApp('settings', { page: 'system' })
}
</script>

<template>
  <Transition name="flyout">
    <div v-if="os.flyout.value === 'quick'" class="qs acrylic" data-flyout role="dialog" aria-label="Quick settings">
      <div class="qs-main">
        <div class="qs-tiles">
          <div v-for="t in tiles" :key="t.key" class="qs-tile">
            <button class="qs-btn" :class="{ on: t.on }" :aria-pressed="t.on" :aria-label="t.label" @click="t.toggle">
              <Icon :name="t.icon" size="16px" />
            </button>
            <span>{{ t.label }}</span>
          </div>
        </div>
        <label class="qs-slider">
          <Icon name="fluent:brightness-high-24-regular" size="20px" />
          <input
            v-model.number="q.brightness"
            class="fl-slider"
            type="range"
            min="20"
            max="100"
            aria-label="Brightness"
            :style="{ '--val': `${((q.brightness - 20) / 80) * 100}%` }"
          >
        </label>
        <div class="qs-slider">
          <button class="fl-icon-btn qs-mute" aria-label="Mute" @click="q.volume = q.volume ? 0 : 50">
            <Icon :name="volumeIcon" size="20px" />
          </button>
          <input
            v-model.number="q.volume"
            class="fl-slider"
            type="range"
            min="0"
            max="100"
            aria-label="Volume"
            :style="{ '--val': `${q.volume}%` }"
          >
        </div>
      </div>
      <footer class="qs-foot">
        <span class="qs-battery">
          <Icon :name="q.charging ? 'fluent:battery-charge-24-regular' : 'fluent:battery-9-24-regular'" size="16px" />
          {{ Math.round(q.battery * 100) }}%
        </span>
        <button class="fl-icon-btn" aria-label="All settings" title="All settings" @click="openSettings">
          <Icon name="fluent:settings-24-regular" size="16px" />
        </button>
      </footer>
    </div>
  </Transition>
</template>

<style scoped>
.qs {
  position: absolute;
  right: 12px;
  bottom: calc(var(--taskbar-h) + 12px);
  z-index: 1100;
  width: min(360px, calc(100vw - 24px));
  border-radius: var(--radius);
  border: 1px solid var(--stroke-2);
  box-shadow: var(--shadow-flyout);
  overflow: hidden;
}
.qs-main {
  padding: 24px 24px 12px;
}
.qs-tiles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px 12px;
  margin-bottom: 20px;
}
.qs-tile {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  min-width: 0;
  font-size: 12px;
  line-height: 16px;
  text-align: center;
}
.qs-tile span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.qs-btn {
  display: grid;
  place-items: center;
  height: 48px;
  border-radius: 4px;
  background: var(--control);
  border: 1px solid var(--stroke);
  border-bottom-color: var(--control-edge);
  transition: background 0.12s;
}
.qs-btn:hover {
  background: var(--control-hover);
}
.qs-btn.on {
  background: var(--accent);
  border-color: transparent;
  color: var(--on-accent);
}
.qs-btn.on:hover {
  background: var(--accent-hover);
}
.qs-slider {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 44px;
  padding-left: 6px;
}
.qs-slider > :first-child {
  flex-shrink: 0;
}
.qs-mute {
  margin-left: -6px;
}
.qs-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 12px 0 24px;
  background: var(--control-alt);
  border-top: 1px solid var(--divider);
}
.qs-battery {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.flyout-enter-active {
  transition: transform 0.26s var(--ease-out), opacity 0.18s ease;
}
.flyout-leave-active {
  transition: transform 0.16s ease-in, opacity 0.14s ease;
}
.flyout-enter-from,
.flyout-leave-to {
  opacity: 0;
  transform: translateY(40px);
}
</style>
