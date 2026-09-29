<script setup lang="ts">
import { APPS, TASKBAR_PINNED, type AppId } from '~/utils/apps'

const os = useOs()
const wm = useWindows()

const now = ref(new Date())
let clock: ReturnType<typeof setInterval> | undefined

onMounted(async () => {
  clock = setInterval(() => (now.value = new Date()), 1000)
  try {
    const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean; addEventListener: (e: string, cb: () => void) => void }> }
    const battery = await nav.getBattery?.()
    if (battery) {
      const sync = () => {
        os.quick.value.battery = battery.level
        os.quick.value.charging = battery.charging
      }
      sync()
      battery.addEventListener('levelchange', sync)
      battery.addEventListener('chargingchange', sync)
    }
  }
  catch {
    // Battery API unsupported — keep the default full battery
  }
})
onBeforeUnmount(() => clearInterval(clock))

const time = computed(() => now.value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
const date = computed(() => now.value.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' }))

const items = computed(() => {
  const ids: AppId[] = [...TASKBAR_PINNED]
  for (const w of wm.windows.value) {
    if (!APPS[w.appId].skipTaskbar && !ids.includes(w.appId)) ids.push(w.appId)
  }
  return ids.map((id, index) => {
    const wins = wm.windows.value.filter(w => w.appId === id).sort((a, b) => b.z - a.z)
    return {
      id,
      meta: APPS[id],
      running: wins.length > 0,
      active: wins.some(w => w.id === wm.activeId.value && !w.minimized),
      tip: wins[0]?.title ?? APPS[id].name,
      pinnedExtra: index >= 4 && index < TASKBAR_PINNED.length && wins.length === 0,
    }
  })
})

const wifiIcon = computed(() => {
  const q = os.quick.value
  if (q.airplane) return 'fluent:airplane-24-regular'
  return q.wifi ? 'fluent:wifi-1-24-regular' : 'fluent:wifi-off-24-regular'
})
const volumeIcon = computed(() => {
  const v = os.quick.value.volume
  if (v === 0) return 'fluent:speaker-mute-24-regular'
  if (v < 34) return 'fluent:speaker-0-24-regular'
  if (v < 67) return 'fluent:speaker-1-24-regular'
  return 'fluent:speaker-2-24-regular'
})
const batteryIcon = computed(() => {
  const q = os.quick.value
  if (q.charging) return 'fluent:battery-charge-24-regular'
  if (q.saver) return 'fluent:battery-saver-24-regular'
  return `fluent:battery-${Math.min(10, Math.round(q.battery * 10))}-24-regular`
})
const trayTip = computed(() => {
  const q = os.quick.value
  const net = q.airplane ? 'Airplane mode' : q.wifi ? 'Portfolio-5G — Internet access' : 'Not connected'
  return `${net}\nSpeakers: ${q.volume}%\nBattery: ${Math.round(q.battery * 100)}%`
})

function openSearch() {
  os.toggleFlyout('search')
}
</script>

<template>
  <nav class="taskbar" aria-label="Taskbar">
    <div class="tb-center">
      <button
        class="tb-btn tb-start"
        :class="{ pressed: os.flyout.value === 'start' }"
        data-flyout-toggle
        data-tip="Start"
        aria-label="Start"
        @click="os.toggleFlyout('start')"
      >
        <OsIcon name="windows" :size="24" />
      </button>
      <button class="tb-search" data-flyout-toggle aria-label="Search" @click="openSearch">
        <Icon name="fluent:search-20-regular" size="16px" />
        <span>Search</span>
      </button>
      <button class="tb-btn tb-search-icon" data-flyout-toggle data-tip="Search" aria-label="Search" @click="openSearch">
        <Icon name="fluent:search-24-regular" size="22px" />
      </button>
      <button
        class="tb-btn tb-hide-sm"
        :class="{ pressed: os.flyout.value === 'taskview' }"
        data-flyout-toggle
        data-tip="Task View"
        aria-label="Task View"
        @click="os.toggleFlyout('taskview')"
      >
        <OsIcon name="task-view" :size="24" />
      </button>
      <button
        v-for="item in items"
        :key="item.id"
        class="tb-btn tb-app"
        :class="{ running: item.running, active: item.active, 'tb-hide-sm': item.pinnedExtra }"
        :data-tip="item.tip"
        :aria-label="item.meta.name"
        @click="wm.taskbarClick(item.id)"
      >
        <OsIcon :name="item.meta.icon" :size="24" />
        <span class="indicator" />
      </button>
    </div>

    <div class="tb-right">
      <button
        class="tray-btn tray-group"
        :class="{ pressed: os.flyout.value === 'quick' }"
        data-flyout-toggle
        :data-tip="trayTip"
        aria-label="Quick settings"
        @click="os.toggleFlyout('quick')"
      >
        <Icon :name="wifiIcon" size="16px" />
        <Icon :name="volumeIcon" size="16px" />
        <Icon :name="batteryIcon" size="16px" class="tb-hide-sm" />
      </button>
      <button
        class="tray-btn tray-clock"
        :class="{ pressed: os.flyout.value === 'calendar' }"
        data-flyout-toggle
        aria-label="Clock and notifications"
        @click="os.toggleFlyout('calendar')"
      >
        <span class="clock">
          <span>{{ time }}</span>
          <span>{{ date }}</span>
        </span>
        <span class="bell">
          <Icon name="fluent:alert-24-regular" size="16px" />
          <span v-if="os.notifications.value.length" class="badge">{{ os.notifications.value.length }}</span>
        </span>
      </button>
      <button class="show-desktop" data-tip="Show desktop" aria-label="Show desktop" @click="wm.toggleDesktop()" />
    </div>
  </nav>
</template>

<style scoped>
.taskbar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  height: var(--taskbar-h);
  background: var(--taskbar-bg);
  -webkit-backdrop-filter: blur(40px) saturate(1.6);
  backdrop-filter: blur(40px) saturate(1.6);
  border-top: 1px solid var(--stroke-2);
  --tb-hover: rgba(255, 255, 255, 0.62);
  --tb-active: rgba(255, 255, 255, 0.72);
}
[data-theme='dark'] .taskbar {
  --tb-hover: rgba(255, 255, 255, 0.08);
  --tb-active: rgba(255, 255, 255, 0.06);
}

.tb-center {
  position: absolute;
  top: 0;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  transform: translateX(-50%);
}
.tb-btn,
.tray-btn {
  position: relative;
  display: grid;
  place-items: center;
  height: 40px;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: background 0.1s, border-color 0.1s;
}
.tb-btn {
  width: 40px;
}
.tb-btn:hover,
.tray-btn:hover,
.tb-btn.pressed,
.tray-btn.pressed,
.tb-btn.active {
  background: var(--tb-hover);
  border-color: var(--stroke);
}
.tb-btn.active {
  background: var(--tb-active);
}
.tb-btn :deep(.os-icon) {
  transition: transform 0.2s var(--ease-out);
}
.tb-btn:active :deep(.os-icon) {
  transform: scale(0.82);
}
.indicator {
  position: absolute;
  bottom: 2px;
  left: 50%;
  width: 0;
  height: 3px;
  border-radius: 2px;
  background: var(--text-3);
  transform: translateX(-50%);
  transition: width 0.25s var(--ease-out), background 0.2s;
}
.tb-app.running .indicator {
  width: 6px;
}
.tb-app.active .indicator {
  width: 16px;
  background: var(--accent);
}

.tb-search {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 190px;
  height: 32px;
  margin: 0 4px;
  padding: 0 14px 0 12px;
  border-radius: 16px;
  background: var(--control);
  border: 1px solid var(--stroke);
  color: var(--text-2);
  font-size: 13px;
}
.tb-search:hover {
  background: var(--control-hover);
}
.tb-search-icon {
  display: none;
}

.tb-right {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 100%;
  margin-left: auto;
}
.tray-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  font-size: 12px;
  line-height: 16px;
}
.clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  white-space: nowrap;
}
.bell {
  position: relative;
  display: grid;
  place-items: center;
}
.badge {
  position: absolute;
  top: -7px;
  right: -8px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--accent);
  color: var(--on-accent);
  font-size: 10px;
  line-height: 16px;
  text-align: center;
}
.show-desktop {
  position: relative;
  width: 12px;
  height: 100%;
}
.show-desktop::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 12px;
  bottom: 12px;
  width: 1px;
  background: var(--text-3);
  opacity: 0;
  transition: opacity 0.1s;
}
.show-desktop:hover::before {
  opacity: 1;
}

[data-tip]:hover::after {
  content: attr(data-tip);
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  z-index: 10;
  padding: 5px 9px 6px;
  border-radius: 4px;
  border: 1px solid var(--stroke-2);
  background: var(--tooltip-bg);
  box-shadow: var(--shadow-menu);
  color: var(--text);
  font-size: 12px;
  line-height: 16px;
  white-space: pre;
  text-align: left;
  pointer-events: none;
  transform: translateX(-50%);
  animation: tip-in 0.15s 0.6s both;
}
.tb-right [data-tip]:hover::after {
  left: auto;
  right: 0;
  transform: none;
}
@keyframes tip-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (max-width: 1100px) {
  .tb-search { display: none; }
  .tb-search-icon { display: grid; }
}
@media (max-width: 640px) {
  .tb-center {
    position: static;
    transform: none;
    margin-left: 4px;
    gap: 2px;
  }
  .tb-hide-sm { display: none; }
  .clock span:last-child { display: none; }
  .bell { display: none; }
}
</style>
