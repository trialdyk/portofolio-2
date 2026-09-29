<script setup lang="ts">
import { profile } from '~/data/portfolio'

const os = useOs()

type View = 'lock' | 'signin' | 'welcome'

const view = ref<View>('lock')
const now = ref(new Date())
const powerOpen = ref(false)
const signInButton = ref<HTMLButtonElement>()
let clock: ReturnType<typeof setInterval> | undefined

// Stays mounted underneath the boot screen so the lock screen is revealed as boot fades out.
const visible = computed(() => os.phase.value === 'booting' || os.phase.value === 'locked')
const interactive = computed(() => os.phase.value === 'locked')

const time = computed(() =>
  new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' })
    .formatToParts(now.value)
    .filter(p => p.type !== 'dayPeriod')
    .map(p => p.value)
    .join('')
    .trim())
const date = computed(() => now.value.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }))

function focusSignIn() {
  setTimeout(() => signInButton.value?.focus({ preventScroll: true }), 420)
}

watch(visible, (v) => {
  if (!v) return
  view.value = os.lockView.value
  powerOpen.value = false
}, { immediate: true })

watch(interactive, (v) => {
  if (v && view.value === 'signin') focusSignIn()
})

function unlock() {
  if (!interactive.value || view.value !== 'lock') return
  view.value = 'signin'
  focusSignIn()
}

function signIn() {
  if (view.value !== 'signin') return
  view.value = 'welcome'
  powerOpen.value = false
  setTimeout(() => {
    os.phase.value = 'ready'
  }, 1700)
}

function backToLock() {
  view.value = 'lock'
  powerOpen.value = false
}

function onKey(e: KeyboardEvent) {
  if (!interactive.value || ['Shift', 'Control', 'Alt', 'Meta', 'OS', 'Tab'].includes(e.key)) return
  if (view.value === 'lock') {
    e.preventDefault()
    unlock()
  }
  else if (view.value === 'signin') {
    if (e.key === 'Escape') backToLock()
    else if (e.key === 'Enter' && document.activeElement?.tagName !== 'BUTTON') signIn()
  }
}

function power(action: 'sleep' | 'shutdown' | 'restart') {
  powerOpen.value = false
  os.power(action)
}

onMounted(() => {
  clock = setInterval(() => (now.value = new Date()), 1000)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  clearInterval(clock)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <Transition name="lock-fade">
    <div v-if="visible" class="lock" @contextmenu.prevent>
      <div class="lock-bg" :class="{ blurred: view !== 'lock' }" :style="{ backgroundImage: `url(${os.wallpaperInfo.value.src})` }" />
      <div class="lock-shade" :class="{ on: view !== 'lock' }" />

      <Transition name="lock-up">
        <div v-if="view === 'lock'" class="lock-screen" role="button" tabindex="0" aria-label="Unlock" @click="unlock" @wheel.passive="unlock">
          <div class="lock-clock">
            <span class="lock-time">{{ time }}</span>
            <span class="lock-date">{{ date }}</span>
          </div>
          <p v-if="interactive" class="lock-hint">
            <Icon name="fluent:chevron-up-24-regular" size="20px" />
            Click or press any key to sign in
          </p>
          <div class="lock-status">
            <Icon name="fluent:wifi-1-24-regular" size="20px" />
            <Icon :name="os.quick.value.charging ? 'fluent:battery-charge-24-regular' : 'fluent:battery-9-24-regular'" size="20px" />
          </div>
        </div>
      </Transition>

      <Transition name="signin">
        <div v-if="view !== 'lock'" class="signin" @click.self="powerOpen = false">
          <div class="si-center">
            <OsAvatar :size="192" class="si-avatar" />
            <h1 class="si-name">{{ profile.name }}</h1>
            <button v-if="view === 'signin'" ref="signInButton" class="si-btn" @click="signIn">Sign in</button>
            <div v-else class="si-welcome" role="status">
              <div class="win-spinner">
                <i v-for="n in 5" :key="n" />
              </div>
              <span>Welcome</span>
            </div>
          </div>

          <div v-if="view === 'signin'" class="si-users">
            <div class="si-user">
              <OsAvatar :size="40" />
              <span>{{ profile.name }}</span>
            </div>
          </div>

          <div v-if="view === 'signin'" class="si-actions">
            <span class="si-icon" title="Portfolio-5G — Connected"><Icon name="fluent:wifi-1-24-regular" size="20px" /></span>
            <span class="si-icon" title="Accessibility"><Icon name="fluent:accessibility-24-regular" size="20px" /></span>
            <div class="si-power">
              <Transition name="menu-pop">
                <div v-if="powerOpen" class="fl-menu si-power-menu">
                  <button class="fl-menu-item" @click="power('sleep')">
                    <Icon name="fluent:weather-moon-24-regular" size="16px" />
                    Sleep
                  </button>
                  <button class="fl-menu-item" @click="power('shutdown')">
                    <Icon name="fluent:power-24-regular" size="16px" />
                    Shut down
                  </button>
                  <button class="fl-menu-item" @click="power('restart')">
                    <Icon name="fluent:arrow-counterclockwise-24-regular" size="16px" />
                    Restart
                  </button>
                </div>
              </Transition>
              <button class="si-icon" aria-label="Power" @click="powerOpen = !powerOpen">
                <Icon name="fluent:power-24-regular" size="20px" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.lock {
  position: fixed;
  inset: 0;
  z-index: 18500;
  overflow: hidden;
  background: #000;
  color: #fff;
  color-scheme: dark;
  --text: #fff;
  --text-2: rgba(255, 255, 255, 0.786);
  --acrylic-strong: rgba(44, 44, 44, 0.94);
  --stroke-2: rgba(255, 255, 255, 0.093);
  --divider: rgba(255, 255, 255, 0.084);
  --subtle-hover: rgba(255, 255, 255, 0.06);
  --text-disabled: rgba(255, 255, 255, 0.36);
  --shadow-menu: 0 8px 16px rgba(0, 0, 0, 0.36);
}
.lock-bg {
  position: absolute;
  inset: -60px;
  background-size: cover;
  background-position: center;
  transition: filter 0.5s var(--ease-out), transform 0.5s var(--ease-out);
}
.lock-bg.blurred {
  filter: blur(42px) brightness(0.78) saturate(1.2);
  transform: scale(1.06);
}
.lock-shade {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.1);
  transition: background 0.5s ease;
}
.lock-shade.on {
  background: rgba(0, 0, 0, 0.26);
}

.lock-screen {
  position: absolute;
  inset: 0;
  outline: none;
}
.lock-clock {
  position: absolute;
  top: 11%;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.35);
}
.lock-time {
  font-family: var(--font-display);
  font-size: clamp(72px, 11vw, 136px);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.02em;
}
.lock-date {
  margin-top: 14px;
  font-size: clamp(18px, 2vw, 24px);
  font-weight: 500;
}
.lock-hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
  opacity: 0;
  animation: hint-in 0.6s ease 2.5s forwards, hint-bob 2s ease-in-out 3.1s infinite;
}
@keyframes hint-in {
  to { opacity: 0.85; }
}
@keyframes hint-bob {
  50% { transform: translateY(-4px); }
}
.lock-status {
  position: absolute;
  right: 28px;
  bottom: 28px;
  display: flex;
  gap: 18px;
  filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.4));
}

.signin {
  position: absolute;
  inset: 0;
}
.si-center {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: min(420px, 90vw);
  transform: translate(-50%, -58%);
}
.si-avatar {
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.3);
}
.si-name {
  margin-top: 6px;
  font-family: var(--font-display);
  font-size: 30px;
  font-weight: 600;
  line-height: 38px;
  text-align: center;
}
.si-btn {
  min-width: 132px;
  height: 36px;
  margin-top: 10px;
  padding: 0 28px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 14px;
  transition: background 0.1s;
}
.si-btn:hover {
  background: rgba(255, 255, 255, 0.26);
}
.si-btn:active {
  background: rgba(255, 255, 255, 0.12);
}
.si-btn:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
.si-welcome {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
  font-size: 20px;
}
.si-welcome .win-spinner {
  position: relative;
  top: auto;
  left: auto;
  width: 30px;
  height: 30px;
  margin: 0;
}
.si-users {
  position: absolute;
  left: 24px;
  bottom: 24px;
}
.si-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 20px 8px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 14px;
}
.si-actions {
  position: absolute;
  right: 24px;
  bottom: 24px;
  display: flex;
  gap: 6px;
}
.si-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  color: #fff;
}
button.si-icon:hover {
  background: rgba(255, 255, 255, 0.12);
}
.si-power {
  position: relative;
}
.si-power-menu {
  position: absolute;
  right: 0;
  bottom: calc(100% + 8px);
  min-width: 160px;
}

.lock-up-enter-active {
  transition: transform 0.45s var(--ease-out), opacity 0.35s ease;
}
.lock-up-leave-active {
  transition: transform 0.45s var(--ease-in-out), opacity 0.4s ease;
}
.lock-up-enter-from {
  transform: translateY(-20%);
  opacity: 0;
}
.lock-up-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
.signin-enter-active {
  transition: opacity 0.4s ease 0.15s;
}
.signin-leave-active {
  transition: opacity 0.2s ease;
}
.signin-enter-from,
.signin-leave-to {
  opacity: 0;
}
.lock-fade-leave-active {
  transition: opacity 0.6s ease;
}
.lock-fade-leave-to {
  opacity: 0;
}
.menu-pop-enter-active {
  transition: opacity 0.12s ease, transform 0.2s var(--ease-out);
}
.menu-pop-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 560px) {
  .si-users {
    display: none;
  }
}
</style>
