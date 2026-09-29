import { APPS, type AppId } from '~/utils/apps'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type SnapZone = 'left' | 'right' | 'max'

export interface WinState extends Rect {
  id: string
  appId: AppId
  title: string
  z: number
  minimized: boolean
  maximized: boolean
  snap: 'left' | 'right' | null
  restore: Rect | null
  props: Record<string, any>
  /** Incremented whenever an already-open single-instance app is launched again with new props. */
  launch: number
}

export const TASKBAR_HEIGHT = 48
export const isCompact = () => window.innerWidth < 768

let seq = 0

export function workArea() {
  return { w: window.innerWidth, h: window.innerHeight - TASKBAR_HEIGHT }
}

export function snapRect(zone: SnapZone): Rect {
  const area = workArea()
  const half = Math.floor(area.w / 2)
  if (zone === 'left') return { x: 0, y: 0, w: half, h: area.h }
  if (zone === 'right') return { x: half, y: 0, w: area.w - half, h: area.h }
  return { x: 0, y: 0, w: area.w, h: area.h }
}

export function useWindows() {
  const windows = useState<WinState[]>('wm:windows', () => [])
  const activeId = useState<string | null>('wm:active', () => null)
  const topZ = useState('wm:z', () => 10)
  const snapPreview = useState<SnapZone | null>('wm:snap', () => null)
  const peeked = useState<string[]>('wm:peeked', () => [])

  const get = (id: string) => windows.value.find(w => w.id === id)

  function activateTop() {
    const visible = windows.value.filter(w => !w.minimized).sort((a, b) => b.z - a.z)
    activeId.value = visible[0]?.id ?? null
  }

  function focus(id: string) {
    const w = get(id)
    if (!w) return
    w.minimized = false
    if (w.z !== topZ.value) w.z = ++topZ.value
    activeId.value = id
    peeked.value = []
  }

  function openApp(appId: AppId, props: Record<string, any> = {}): WinState {
    const meta = APPS[appId]
    if (!meta.multiInstance) {
      const existing = windows.value.find(w => w.appId === appId)
      if (existing) {
        existing.props = props
        existing.launch++
        focus(existing.id)
        return existing
      }
    }
    const area = workArea()
    const w = Math.min(meta.width, area.w - 24)
    const h = meta.autoHeight ? 0 : Math.min(meta.height, area.h - 24)
    const cascade = (windows.value.filter(x => !x.minimized && !APPS[x.appId].skipTaskbar).length % 5) * 28
    const x = meta.autoHeight
      ? Math.round((area.w - w) / 2)
      : Math.max(8, Math.round((area.w - w) / 2 - 60 + cascade))
    const y = meta.autoHeight
      ? Math.round(area.h * 0.26)
      : Math.max(8, Math.round((area.h - h) / 2 - 24 + cascade))
    windows.value.push({
      id: `win-${++seq}`,
      appId,
      title: props.title ?? meta.name,
      x,
      y,
      w,
      h,
      z: ++topZ.value,
      minimized: false,
      maximized: false,
      snap: null,
      restore: null,
      props,
      launch: 0,
    })
    const win = windows.value[windows.value.length - 1]!
    activeId.value = win.id
    peeked.value = []
    return win
  }

  function close(id: string) {
    windows.value = windows.value.filter(w => w.id !== id)
    if (activeId.value === id) activateTop()
  }

  function closeAll() {
    windows.value = []
    activeId.value = null
  }

  function minimize(id: string) {
    const w = get(id)
    if (!w) return
    w.minimized = true
    if (activeId.value === id) activateTop()
  }

  function toggleMaximize(id: string) {
    const w = get(id)
    if (!w || APPS[w.appId].maximizable === false || isCompact()) return
    if (w.snap && w.restore) {
      Object.assign(w, w.restore)
      w.snap = null
      w.restore = null
    }
    else {
      w.maximized = !w.maximized
    }
    focus(id)
  }

  /** `before` is the window rect at the start of the drag, used as the restore position. */
  function snapTo(id: string, zone: SnapZone, before: Rect) {
    const w = get(id)
    if (!w) return
    if (zone === 'max') {
      Object.assign(w, before)
      w.maximized = true
      return
    }
    w.restore = { ...before }
    w.snap = zone
    Object.assign(w, snapRect(zone))
  }

  function setTitle(id: string, title: string) {
    const w = get(id)
    if (w && w.title !== title) w.title = title
  }

  function taskbarClick(appId: AppId) {
    const top = windows.value.filter(w => w.appId === appId).sort((a, b) => b.z - a.z)[0]
    if (!top) return openApp(appId)
    if (top.id === activeId.value && !top.minimized) minimize(top.id)
    else focus(top.id)
  }

  function toggleDesktop() {
    const visible = windows.value.filter(w => !w.minimized)
    if (visible.length) {
      peeked.value = visible.map(w => w.id)
      visible.forEach((w) => { w.minimized = true })
      activeId.value = null
    }
    else {
      const ids = peeked.value
      windows.value.forEach((w) => { if (ids.includes(w.id)) w.minimized = false })
      peeked.value = []
      activateTop()
    }
  }

  return {
    windows,
    activeId,
    snapPreview,
    get,
    focus,
    openApp,
    close,
    closeAll,
    minimize,
    toggleMaximize,
    snapTo,
    setTitle,
    taskbarClick,
    toggleDesktop,
  }
}
