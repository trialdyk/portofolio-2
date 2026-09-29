import { displayPath, formatDate, formatSize, getNode, type FsNode } from '~/utils/fs'

export interface DialogOptions {
  title: string
  message: string
  icon?: 'info' | 'warning' | 'error'
  rows?: [string, string][]
}

export function useShell() {
  const wm = useWindows()

  function dialog(opts: DialogOptions) {
    wm.openApp('dialog', { ...opts })
  }

  function openExternal(url: string) {
    if (url.startsWith('mailto:')) window.location.href = url
    else window.open(url, '_blank', 'noopener,noreferrer')
  }

  function openNode(input: FsNode | string | undefined) {
    const node = typeof input === 'string' ? getNode(input) : input
    if (!node) return
    if (node.message) return dialog({ title: node.message.title, message: node.message.text, icon: node.message.icon })
    if (node.target) return openNode(node.target)
    if (node.app) return wm.openApp(node.app, node.appProps ?? {})
    if (node.kind !== 'file') return wm.openApp('explorer', { path: node.id })
    if (node.content !== undefined) return wm.openApp('notepad', { file: node.id })
    if (node.image) return wm.openApp('photos', { file: node.id })
    if (node.url) return wm.openApp('edge', { url: node.url })
  }

  function properties(node: FsNode) {
    const rows: [string, string][] = [['Type', node.type]]
    if (node.parent) rows.push(['Location', displayPath(node.parent)])
    if (node.bytes !== undefined) rows.push(['Size', formatSize(node.bytes)])
    if (node.children.length) rows.push(['Contains', `${node.children.length} items`])
    if (node.modified) rows.push(['Modified', formatDate(node.modified)])
    if (node.project) rows.push(['Tech', node.project.tech.join(', ')])
    dialog({ title: `${node.name} Properties`, message: '', icon: undefined, rows })
  }

  return { dialog, openExternal, openNode, properties, openApp: wm.openApp }
}
