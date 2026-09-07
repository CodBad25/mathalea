/**
 * Banque FFJM livrée avec le site : manifest versionné valide, chargement en
 * provenance `builtin`, non retirable, non référencée dans les liens partagés.
 * @see src/lib/stores/banquesExternesStore.ts (chargerBanquesIntegrees)
 */
import { get } from 'svelte/store'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ffjmManifest from '../../json/banques/ffjm.manifest.json'
import {
  uuidBanqueExterne,
  validerManifest,
} from '../components/banquesExternes'
import {
  banquesExternes,
  chargerBanquesIntegrees,
  clesBanquesPartageables,
  referentielBanquesExternes,
  supprimerBanque,
} from './banquesExternesStore'

describe('manifest FFJM versionné', () => {
  it('est un manifest de banque valide', () => {
    const manifest = validerManifest(ffjmManifest)
    expect(manifest.id).toBe('ffjm')
    expect(manifest.titre).toBe('Exercices de la FFJM')
    expect(manifest.auteur).toBe('Claire Stephan')
    expect(manifest.exercices.length).toBeGreaterThan(0)
  })
})

describe('chargerBanquesIntegrees', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    banquesExternes.set([])
    // une nouvelle Response à chaque appel : un corps de Response ne se lit
    // qu'une fois (préambule tex puis typ)
    fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response('% préambule', { status: 200 })),
      )
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    banquesExternes.set([])
  })

  it('publie la banque FFJM en provenance builtin', async () => {
    const erreurs = await chargerBanquesIntegrees()
    expect(erreurs).toEqual([])
    const banques = get(banquesExternes)
    expect(banques).toHaveLength(1)
    expect(banques[0].source.type).toBe('builtin')
    expect(banques[0].source.cle).toBe('builtin:ffjm')
    expect(banques[0].manifest.id).toBe('ffjm')
  })

  it('résout les assets en URL statiques sous static/ffjm/ (ni blob, ni API forge)', async () => {
    await chargerBanquesIntegrees()
    const url = get(banquesExternes)[0].assets.get('png/tirelire.png')
    expect(url).toMatch(/\/static\/ffjm\/png\/tirelire\.png$/)
    expect(url).not.toContain('blob:')
    expect(url).not.toContain('/api/v4/')
  })

  it('charge les préambules LaTeX et Typst déclarés par le manifest', async () => {
    await chargerBanquesIntegrees()
    const banque = get(banquesExternes)[0]
    expect(banque.preambuleTexte?.tex).toBe('% préambule')
    expect(banque.preambuleTexte?.typ).toBe('% préambule')
    const urls = fetchMock.mock.calls.map((appel) => String(appel[0]))
    expect(urls.some((u) => u.endsWith('static/ffjm/preambule.tex'))).toBe(true)
    expect(urls.some((u) => u.endsWith('static/ffjm/preambule.typ'))).toBe(true)
  })

  it('expose un nœud « Exercices de la FFJM » avec des uuid bq-ffjm-… et l’attribution', async () => {
    await chargerBanquesIntegrees()
    const referentiel = referentielBanquesExternes()
    expect(Object.keys(referentiel)).toContain('Exercices de la FFJM')
    const serialise = JSON.stringify(referentiel)
    expect(serialise).toContain(uuidBanqueExterne('ffjm', 'tirelire'))
    expect(serialise).toContain('Claire Stephan')
  })

  it('n’est pas retirable par supprimerBanque', async () => {
    await chargerBanquesIntegrees()
    await supprimerBanque('builtin:ffjm')
    expect(get(banquesExternes)).toHaveLength(1)
  })

  it('n’ajoute aucune clé partageable (pas de paramètre bq dans les liens)', async () => {
    await chargerBanquesIntegrees()
    const uuids = [uuidBanqueExterne('ffjm', 'tirelire')]
    expect(clesBanquesPartageables(uuids)).toEqual([])
  })
})
