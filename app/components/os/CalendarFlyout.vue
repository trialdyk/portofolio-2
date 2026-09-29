<script setup lang="ts">
const os = useOs()

const today = ref(new Date())
const cursor = ref(new Date(today.value.getFullYear(), today.value.getMonth(), 1))
const collapsed = ref(false)

watch(() => os.flyout.value, (f) => {
  if (f !== 'calendar') return
  today.value = new Date()
  cursor.value = new Date(today.value.getFullYear(), today.value.getMonth(), 1)
})

const longDate = computed(() => today.value.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }))
const monthLabel = computed(() => cursor.value.toLocaleDateString([], { month: 'long', year: 'numeric' }))
// Jan 7, 2024 is a Sunday
const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + i).toLocaleDateString([], { weekday: 'short' }).slice(0, 2))

const days = computed(() => {
  const first = cursor.value
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    return {
      key: d.toDateString(),
      day: d.getDate(),
      inMonth: d.getMonth() === first.getMonth(),
      today: d.toDateString() === today.value.toDateString(),
    }
  })
})

function shift(months: number) {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + months, 1)
}

function timeAgo(t: number) {
  const mins = Math.round((Date.now() - t) / 60000)
  if (mins < 1) return 'Now'
  if (mins < 60) return `${mins}m ago`
  return new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
</script>

<template>
  <Transition name="flyout">
    <div v-if="os.flyout.value === 'calendar'" class="cal-wrap" data-flyout>
      <section class="nc acrylic" aria-label="Notifications">
        <header class="nc-head">
          <span>Notifications</span>
          <button v-if="os.notifications.value.length" class="fl-btn subtle nc-clear" @click="os.clearNotifications()">Clear all</button>
        </header>
        <div v-if="!os.notifications.value.length" class="nc-empty">No new notifications</div>
        <div v-else class="nc-list">
          <article v-for="n in os.notifications.value" :key="n.id" class="nc-item">
            <header>
              <OsIcon :name="n.icon" :size="16" />
              <span>{{ n.app }}</span>
              <time>{{ timeAgo(n.time) }}</time>
            </header>
            <b>{{ n.title }}</b>
            <p>{{ n.body }}</p>
            <button v-if="n.action" class="fl-btn" @click="n.action.run(); os.closeOverlays()">{{ n.action.label }}</button>
          </article>
        </div>
      </section>

      <section class="cal acrylic" aria-label="Calendar">
        <header class="cal-head">
          <span>{{ longDate }}</span>
          <button class="fl-icon-btn" :aria-label="collapsed ? 'Expand' : 'Collapse'" @click="collapsed = !collapsed">
            <Icon :name="collapsed ? 'fluent:chevron-up-16-regular' : 'fluent:chevron-down-16-regular'" size="14px" />
          </button>
        </header>
        <div v-if="!collapsed" class="cal-body">
          <div class="cal-month">
            <span>{{ monthLabel }}</span>
            <div>
              <button class="fl-icon-btn" aria-label="Previous month" @click="shift(-1)">
                <Icon name="fluent:caret-up-16-filled" size="12px" />
              </button>
              <button class="fl-icon-btn" aria-label="Next month" @click="shift(1)">
                <Icon name="fluent:caret-down-16-filled" size="12px" />
              </button>
            </div>
          </div>
          <div class="cal-grid">
            <span v-for="w in weekdays" :key="w" class="cal-wd">{{ w }}</span>
            <span v-for="d in days" :key="d.key" class="cal-day" :class="{ out: !d.inMonth, today: d.today }">{{ d.day }}</span>
          </div>
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped>
.cal-wrap {
  position: absolute;
  right: 12px;
  bottom: calc(var(--taskbar-h) + 12px);
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(334px, calc(100vw - 24px));
  max-height: calc(100% - var(--taskbar-h) - 24px);
}
.nc,
.cal {
  border-radius: var(--radius);
  border: 1px solid var(--stroke-2);
  box-shadow: var(--shadow-flyout);
  overflow: hidden;
}
.nc {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.nc-head,
.cal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 8px 0 16px;
  font-size: 14px;
  font-weight: 600;
}
.nc-clear {
  min-height: 28px;
  font-size: 12px;
  font-weight: 400;
}
.nc-empty {
  padding: 18px 16px 36px;
  color: var(--text-2);
  font-size: 12px;
  text-align: center;
}
.nc-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 12px 12px;
  overflow-y: auto;
}
.nc-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 12px;
  border-radius: 6px;
  background: var(--card);
  border: 1px solid var(--stroke);
  font-size: 12px;
  line-height: 16px;
}
.nc-item header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 6px;
  color: var(--text-2);
}
.nc-item time {
  margin-left: auto;
}
.nc-item b {
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}
.nc-item p {
  color: var(--text-2);
}
.nc-item .fl-btn {
  margin-top: 8px;
  width: 100%;
}
.cal-head {
  border-bottom: 1px solid var(--divider);
  font-weight: 400;
}
.cal-body {
  padding: 8px 12px 16px;
}
.cal-month {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding-left: 8px;
  font-weight: 600;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  text-align: center;
}
.cal-wd {
  height: 40px;
  line-height: 40px;
  font-size: 13px;
}
.cal-day {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border-radius: 50%;
  font-size: 13px;
}
.cal-day:hover {
  background: var(--subtle-hover);
}
.cal-day.out {
  color: var(--text-3);
}
.cal-day.today {
  background: var(--accent);
  color: var(--on-accent);
  font-weight: 600;
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
  transform: translateX(60px);
}
</style>
