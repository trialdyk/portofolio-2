export type ThemeMode = 'light' | 'dark'

export interface Wallpaper {
  id: string
  name: string
  /** Placeholder SVGs live in /public/wallpapers — replace them with real images (any format) and update the path. */
  src: string
  theme: ThemeMode
  accent: string
}

export const WALLPAPERS: Wallpaper[] = [
  { id: 'bloom-light', name: 'Windows (light)', src: '/wallpapers/bloom-light.svg', theme: 'light', accent: '#0078d4' },
  { id: 'bloom-dark', name: 'Windows (dark)', src: '/wallpapers/bloom-dark.svg', theme: 'dark', accent: '#0078d4' },
  { id: 'glow', name: 'Glow', src: '/wallpapers/glow.svg', theme: 'dark', accent: '#8764b8' },
  { id: 'sunrise', name: 'Sunrise', src: '/wallpapers/sunrise.svg', theme: 'light', accent: '#f7630c' },
  { id: 'flow', name: 'Flow', src: '/wallpapers/flow.svg', theme: 'light', accent: '#00b7c3' },
]

export interface Accent {
  base: string
  /** Accent used on light surfaces (darker). */
  light: string
  /** Accent used on dark surfaces (lighter). */
  dark: string
}

export const ACCENTS: Accent[] = [
  { base: '#0078d4', light: '#005fb8', dark: '#60cdff' },
  { base: '#0063b1', light: '#004e8c', dark: '#76b9ed' },
  { base: '#8764b8', light: '#6b4f93', dark: '#c9b0ef' },
  { base: '#744da9', light: '#5c3d86', dark: '#b89ae6' },
  { base: '#e3008c', light: '#b5006f', dark: '#ff8ccf' },
  { base: '#e81123', light: '#c50f1f', dark: '#ff99a4' },
  { base: '#f7630c', light: '#c54f0a', dark: '#ffb27a' },
  { base: '#ca5010', light: '#a3400d', dark: '#f7a072' },
  { base: '#10893e', light: '#0e7a37', dark: '#6ccb8c' },
  { base: '#00b7c3', light: '#00838c', dark: '#6fe1ea' },
  { base: '#2d7d9a', light: '#256680', dark: '#8cc9de' },
  { base: '#7a7574', light: '#625e5d', dark: '#c4bfbd' },
]

export function accentOf(base: string): Accent {
  return ACCENTS.find(a => a.base === base) ?? ACCENTS[0]!
}
