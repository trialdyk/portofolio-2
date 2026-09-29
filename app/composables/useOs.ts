import { ACCENTS, WALLPAPERS, accentOf, type ThemeMode, type Wallpaper } from '~/utils/theme'

export type Phase = 'booting' | 'locked' | 'ready' | 'signing-out' | 'restarting' | 'shutting-down' | 'off' | 'sleep'
export type LockView = 'lock' | 'signin'
export type Flyout = 'start' | 'search' | 'quick' | 'calendar' | 'taskview' | null

export interface MenuItem {
  label?: string
  icon?: string
  shortcut?: string
  action?: () => void
  disabled?: boolean
  checked?: boolean
  children?: MenuItem[]
  separator?: boolean
}

export interface MenuState {
  x: number
  y: number
  items: MenuItem[]
  /** 'above' anchors the menu's bottom edge at y. */
  placement?: 'below' | 'above'
}

export interface Toast {
  id: number
  app: string
  icon: string
  title: string
  body: string
  time: number
  action?: { label: string; run: () => void }
}

const STORAGE_PREFIX = 'win11-portfolio:'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  }
  catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  }
  catch {
    // storage unavailable (private mode) — settings just won't persist
  }
}

let toastSeq = 0

export function useOs() {
  const wm = useWindows()
  const phase = useState<Phase>('os:phase', () => 'booting')
  const lockView = useState<LockView>('os:lockView', () => 'lock')
  const flyout = useState<Flyout>('os:flyout', () => null)
  const menu = useState<MenuState | null>('os:menu', () => null)
  const theme = useState<ThemeMode>('os:theme', () =>
    load('theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  const accent = useState('os:accent', () => load('accent', ACCENTS[0]!.base))
  const wallpaper = useState('os:wallpaper', () => load('wallpaper', 'auto'))
  const toasts = useState<Toast[]>('os:toasts', () => [])
  const notifications = useState<Toast[]>('os:notifications', () => [])
  const quick = useState('os:quick', () => ({
    wifi: true,
    bluetooth: true,
    airplane: false,
    saver: false,
    nightLight: false,
    brightness: 100,
    volume: 64,
    battery: 1,
    charging: true,
  }))

  const wallpaperInfo = computed<Wallpaper>(() => {
    const id = wallpaper.value === 'auto' ? `bloom-${theme.value}` : wallpaper.value
    return WALLPAPERS.find(w => w.id === id) ?? WALLPAPERS[0]!
  })
  const accentColors = computed(() => accentOf(accent.value))

  function setTheme(mode: ThemeMode) {
    theme.value = mode
    save('theme', mode)
  }
  function setAccent(base: string) {
    accent.value = base
    save('accent', base)
  }
  function setWallpaper(id: string) {
    wallpaper.value = id
    save('wallpaper', id)
  }
  function applyPreset(w: Wallpaper) {
    setTheme(w.theme)
    setAccent(w.accent)
    setWallpaper(w.id.startsWith('bloom-') ? 'auto' : w.id)
  }

  function toggleFlyout(f: Flyout) {
    menu.value = null
    flyout.value = flyout.value === f ? null : f
  }
  function closeOverlays() {
    flyout.value = null
    menu.value = null
  }
  function openMenu(x: number, y: number, items: MenuItem[], placement: MenuState['placement'] = 'below') {
    menu.value = { x, y, items, placement }
  }

  function dismissToast(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }
  function notify(t: Omit<Toast, 'id' | 'time'>, duration = 8000) {
    const toast: Toast = { ...t, id: ++toastSeq, time: Date.now() }
    toasts.value = [...toasts.value, toast]
    notifications.value = [toast, ...notifications.value]
    setTimeout(() => dismissToast(toast.id), duration)
  }
  function clearNotifications() {
    notifications.value = []
  }

  function lock(view: LockView = 'lock') {
    closeOverlays()
    lockView.value = view
    phase.value = 'locked'
  }

  function signOut() {
    closeOverlays()
    phase.value = 'signing-out'
    setTimeout(() => {
      wm.closeAll()
      toasts.value = []
      lock('signin')
    }, 1800)
  }

  function power(action: 'restart' | 'shutdown' | 'sleep') {
    closeOverlays()
    if (action === 'sleep') {
      phase.value = 'sleep'
      return
    }
    phase.value = action === 'restart' ? 'restarting' : 'shutting-down'
    setTimeout(() => {
      wm.closeAll()
      toasts.value = []
      lockView.value = 'lock'
      phase.value = action === 'restart' ? 'booting' : 'off'
    }, 2800)
  }

  return {
    phase,
    lockView,
    lock,
    signOut,
    flyout,
    menu,
    theme,
    accent,
    wallpaper,
    wallpaperInfo,
    accentColors,
    toasts,
    notifications,
    quick,
    setTheme,
    setAccent,
    setWallpaper,
    applyPreset,
    toggleFlyout,
    closeOverlays,
    openMenu,
    notify,
    dismissToast,
    clearNotifications,
    power,
  }
}
