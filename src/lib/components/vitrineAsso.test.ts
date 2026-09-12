import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  loadVitrineHtml,
  prepareVitrineHtml,
  resetVitrineCache,
} from './vitrineAsso'

const fragment = `<div class="vitrine-alea"><style>.vitrine-alea{color:red}</style>
<a href="https://coopmaths.fr/www/about">À propos</a>
<a href="mailto:contact@coopmaths.fr">Contact</a>
<script>alert(1)</script></div>`

describe('prepareVitrineHtml', () => {
  it('renvoie null si le HTML ne contient pas la vitrine', () => {
    expect(prepareVitrineHtml('<h1>404 Not Found</h1>')).toBeNull()
    expect(prepareVitrineHtml('')).toBeNull()
  })

  it('ne garde que le conteneur de la vitrine, sans script', () => {
    const html = prepareVitrineHtml(`<p>bruit</p>${fragment}`)
    expect(html).not.toBeNull()
    expect(html).toMatch(/^<div class="vitrine-alea">/)
    expect(html).not.toContain('bruit')
    expect(html).not.toContain('<script')
    expect(html).toContain('<style>')
  })

  it('ouvre les liens dans un nouvel onglet, sauf les mailto', () => {
    const html = prepareVitrineHtml(fragment) ?? ''
    expect(html).toContain(
      '<a href="https://coopmaths.fr/www/about" target="_blank" rel="noopener noreferrer">',
    )
    expect(html).toContain('<a href="mailto:contact@coopmaths.fr">')
  })
})

describe('loadVitrineHtml', () => {
  afterEach(() => {
    resetVitrineCache()
    vi.unstubAllGlobals()
  })

  it('récupère le fragment sur l’origine courante et mémorise le résultat', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(fragment),
    })
    vi.stubGlobal('fetch', fetchMock)
    const first = await loadVitrineHtml()
    const second = await loadVitrineHtml()
    expect(first).toContain('vitrine-alea')
    expect(second).toBe(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(
      `${window.location.origin}/www/vitrine/fragment/`,
    )
  })

  it('renvoie null si le serveur répond en erreur', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, text: () => Promise.resolve('') }),
    )
    expect(await loadVitrineHtml()).toBeNull()
  })

  it('renvoie null si la requête échoue', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await loadVitrineHtml()).toBeNull()
  })
})
