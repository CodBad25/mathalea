import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyTextToClipboard } from '../../src/lib/components/clipboard'

describe('copyTextToClipboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    // @ts-expect-error nettoyage du stub éventuel
    delete document.execCommand
  })

  it('utilise navigator.clipboard quand il est disponible', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    await expect(copyTextToClipboard('abc')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith('abc')
  })

  it('bascule sur execCommand en contexte non sécurisé (clipboard absent)', async () => {
    vi.stubGlobal('navigator', {})
    document.execCommand = vi.fn().mockReturnValue(true)
    await expect(copyTextToClipboard('abc')).resolves.toBe(true)
    expect(document.execCommand).toHaveBeenCalledWith('copy')
  })

  it('bascule aussi si clipboard.writeText échoue (permission refusée)', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    document.execCommand = vi.fn().mockReturnValue(true)
    await expect(copyTextToClipboard('abc')).resolves.toBe(true)
    expect(document.execCommand).toHaveBeenCalledWith('copy')
  })

  it('renvoie false sans lever d’erreur si aucune méthode ne fonctionne', async () => {
    vi.stubGlobal('navigator', {})
    document.execCommand = vi.fn().mockImplementation(() => {
      throw new Error('not implemented')
    })
    await expect(copyTextToClipboard('abc')).resolves.toBe(false)
  })
})
