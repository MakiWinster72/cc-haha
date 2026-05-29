import { describe, expect, it, vi } from 'vitest'
import { handlePreviewLink, type PreviewLinkDeps } from './handlePreviewLink'

function makeDeps(overrides?: Partial<PreviewLinkDeps>): PreviewLinkDeps {
  return {
    sessionId: 's1',
    serverBaseUrl: 'http://127.0.0.1:8787',
    openBrowser: vi.fn(),
    openFilePreview: vi.fn(),
    openExternal: vi.fn(),
    ...overrides,
  }
}

describe('handlePreviewLink', () => {
  it('routes loopback urls to openBrowser with the url', () => {
    const deps = makeDeps()
    const handled = handlePreviewLink('http://localhost:5173/', deps)
    expect(handled).toBe(true)
    expect(deps.openBrowser).toHaveBeenCalledWith('s1', 'http://localhost:5173/')
    expect(deps.openFilePreview).not.toHaveBeenCalled()
    expect(deps.openExternal).not.toHaveBeenCalled()
  })

  it('routes absolute html file paths to openBrowser with the preview-fs url', () => {
    const deps = makeDeps()
    const handled = handlePreviewLink('/Users/x/index.html', deps)
    expect(handled).toBe(true)
    // previewFsUrl preserves the leading slash, yielding an intentional `//`
    // between <sessionId> and the absolute path so the server resolves it as
    // an absolute-within-workspace path.
    expect(deps.openBrowser).toHaveBeenCalledWith(
      's1',
      'http://127.0.0.1:8787/preview-fs/s1//Users/x/index.html',
    )
    expect(deps.openFilePreview).not.toHaveBeenCalled()
    expect(deps.openExternal).not.toHaveBeenCalled()
  })

  it('routes relative previewable docs to openFilePreview with the relative path', () => {
    const deps = makeDeps()
    const handled = handlePreviewLink('docs/report.md', deps)
    expect(handled).toBe(true)
    expect(deps.openFilePreview).toHaveBeenCalledWith('s1', 'docs/report.md')
    expect(deps.openBrowser).not.toHaveBeenCalled()
    expect(deps.openExternal).not.toHaveBeenCalled()
  })

  it('routes remote http(s) to openExternal with the url', () => {
    const deps = makeDeps()
    const handled = handlePreviewLink('https://example.com/', deps)
    expect(handled).toBe(true)
    expect(deps.openExternal).toHaveBeenCalledWith('https://example.com/')
    expect(deps.openBrowser).not.toHaveBeenCalled()
    expect(deps.openFilePreview).not.toHaveBeenCalled()
  })

  it('returns false for ignored links and calls no deps', () => {
    const deps = makeDeps()
    const handled = handlePreviewLink('#x', deps)
    expect(handled).toBe(false)
    expect(deps.openBrowser).not.toHaveBeenCalled()
    expect(deps.openFilePreview).not.toHaveBeenCalled()
    expect(deps.openExternal).not.toHaveBeenCalled()
  })
})
