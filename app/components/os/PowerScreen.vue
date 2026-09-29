<script setup lang="ts">
const os = useOs()

const busyLabel = computed(() => {
  if (os.phase.value === 'restarting') return 'Restarting'
  if (os.phase.value === 'shutting-down') return 'Shutting down'
  if (os.phase.value === 'signing-out') return 'Signing out'
  return ''
})

function wake() {
  if (os.phase.value === 'sleep') os.lock()
}

function onKey() {
  wake()
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Transition name="power-fade">
    <div v-if="busyLabel" class="power-screen">
      <div class="power-bg" :style="{ backgroundImage: `url(${os.wallpaperInfo.value.src})` }" />
      <div class="power-status">
        <div class="win-spinner">
          <i v-for="n in 5" :key="n" />
        </div>
        <span>{{ busyLabel }}</span>
      </div>
    </div>
  </Transition>

  <div v-if="os.phase.value === 'off'" class="power-off">
    <button class="power-on" aria-label="Turn on" @click="os.phase.value = 'booting'">
      <Icon name="fluent:power-24-regular" size="30px" />
    </button>
    <p>Click to turn on</p>
  </div>

  <Transition name="power-fade">
    <div v-if="os.phase.value === 'sleep'" class="sleep" @pointerdown="wake" />
  </Transition>
</template>

<style scoped>
.power-screen,
.power-off,
.sleep {
  position: fixed;
  inset: 0;
  z-index: 19000;
  background: #000;
}
.power-bg {
  position: absolute;
  inset: -80px;
  background-size: cover;
  background-position: center;
  filter: blur(48px) brightness(0.45) saturate(1.2);
}
.power-status {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 18px;
  transform: translate(-50%, -50%);
  color: #fff;
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 300;
  line-height: 36px;
}
.power-status .win-spinner {
  position: relative;
  top: auto;
  left: auto;
  width: 34px;
  height: 34px;
  margin: 0;
}
.power-off {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 16px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 13px;
}
.power-on {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: background 0.15s, color 0.15s;
}
.power-on:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.sleep {
  cursor: none;
}
.power-fade-enter-active,
.power-fade-leave-active {
  transition: opacity 0.5s ease;
}
.power-fade-enter-from,
.power-fade-leave-to {
  opacity: 0;
}
</style>
