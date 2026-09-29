import { profile, projects } from '~/data/portfolio'

export const SYSTEM_ICONS = [
  'windows', 'shortcut-arrow', 'folder', 'folder-desktop', 'folder-documents', 'folder-downloads', 'folder-music',
  'folder-pictures', 'folder-videos', 'folder-projects', 'explorer', 'notepad', 'terminal', 'powershell', 'settings',
  'edge', 'photos', 'mail', 'this-pc', 'recycle-bin', 'recycle-bin-full', 'drive-windows', 'home', 'task-view',
  'file-txt', 'file-md', 'file-code', 'file-pdf', 'file-image', 'file-link', 'file-exe', 'file-zip', 'file-audio',
  'info', 'warning', 'error',
]

function loadImage(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onerror = () => resolve()
    img.onload = () => {
      img.decode().then(() => resolve(), () => resolve())
    }
    img.src = src
  })
}

/** Resolves once the wallpaper, system icons and user images are decoded. */
export function preloadAssets(wallpaper: string) {
  const urls = [
    wallpaper,
    ...SYSTEM_ICONS.map(n => `/icons/${n}.svg`),
    ...(profile.avatar ? [profile.avatar] : []),
    ...projects.flatMap(p => p.images ?? []),
  ]
  return Promise.all([...urls.map(loadImage), document.fonts?.ready]).then(() => undefined)
}
