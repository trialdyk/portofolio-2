export type AppId = 'explorer' | 'notepad' | 'terminal' | 'settings' | 'edge' | 'photos' | 'mail' | 'dialog'

export interface AppMeta {
  id: AppId
  name: string
  icon: string
  width: number
  height: number
  minWidth?: number
  minHeight?: number
  /** 'custom' apps draw their own title area (tabs) and mark it with data-drag. */
  titlebar?: 'default' | 'custom'
  captionHeight?: number
  resizable?: boolean
  maximizable?: boolean
  minimizable?: boolean
  multiInstance?: boolean
  skipTaskbar?: boolean
  autoHeight?: boolean
}

export const APPS: Record<AppId, AppMeta> = {
  explorer: { id: 'explorer', name: 'File Explorer', icon: 'explorer', width: 1040, height: 660, minWidth: 480, minHeight: 340, titlebar: 'custom', captionHeight: 40 },
  notepad: { id: 'notepad', name: 'Notepad', icon: 'notepad', width: 780, height: 580, minWidth: 360, minHeight: 260, titlebar: 'custom', captionHeight: 40 },
  terminal: { id: 'terminal', name: 'Terminal', icon: 'terminal', width: 860, height: 540, minWidth: 380, minHeight: 240, titlebar: 'custom', captionHeight: 40 },
  settings: { id: 'settings', name: 'Settings', icon: 'settings', width: 1020, height: 700, minWidth: 420, minHeight: 360 },
  edge: { id: 'edge', name: 'Microsoft Edge', icon: 'edge', width: 1100, height: 720, minWidth: 420, minHeight: 320, titlebar: 'custom', captionHeight: 40 },
  photos: { id: 'photos', name: 'Photos', icon: 'photos', width: 920, height: 640, minWidth: 380, minHeight: 300, titlebar: 'custom', captionHeight: 40 },
  mail: { id: 'mail', name: 'Mail', icon: 'mail', width: 1000, height: 640, minWidth: 420, minHeight: 340 },
  dialog: { id: 'dialog', name: 'Dialog', icon: 'info', width: 440, height: 0, autoHeight: true, resizable: false, maximizable: false, minimizable: false, multiInstance: true, skipTaskbar: true },
}

export const TASKBAR_PINNED: AppId[] = ['explorer', 'edge', 'notepad', 'terminal', 'photos', 'mail', 'settings']

export const LAUNCHABLE_APPS = (Object.values(APPS) as AppMeta[]).filter(a => a.id !== 'dialog')
