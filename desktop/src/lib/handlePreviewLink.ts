import { classifyPreviewLink } from './previewLinkRouter'

export type PreviewLinkDeps = {
  sessionId: string
  serverBaseUrl: string
  openBrowser: (sessionId: string, url: string) => void
  openFilePreview: (sessionId: string, path: string) => void
  openExternal: (url: string) => void
}

/**
 * Build a `/preview-fs/<sessionId>/<path>` URL for the local server.
 *
 * Absolute file paths (leading slash) are preserved as-is, so the resulting URL
 * carries a `//` between `<sessionId>` and the path. That double slash is
 * intentional: the server slices everything after the `<sessionId>` segment and
 * runs `path.resolve(workDir, relPath)`, so an absolute path is resolved as an
 * absolute-within-workspace path and sandbox-checked against the work dir root.
 */
function previewFsUrl(base: string, sessionId: string, filePath: string): string {
  return `${base.replace(/\/$/, '')}/preview-fs/${encodeURIComponent(sessionId)}/${filePath.replace(/^\/+/, '/')}`
}

/** Returns true if handled (caller should preventDefault). */
export function handlePreviewLink(href: string, deps: PreviewLinkDeps): boolean {
  const cls = classifyPreviewLink(href)
  switch (cls.kind) {
    case 'browser-localhost':
      deps.openBrowser(deps.sessionId, cls.url!)
      return true
    case 'browser-file':
      deps.openBrowser(deps.sessionId, previewFsUrl(deps.serverBaseUrl, deps.sessionId, cls.path!))
      return true
    case 'file-preview':
      deps.openFilePreview(deps.sessionId, cls.path!)
      return true
    case 'remote':
      deps.openExternal(cls.url!)
      return true
    default:
      return false
  }
}
