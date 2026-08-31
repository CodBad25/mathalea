import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildDarkIntegral, otsuThreshold } from '../../src/lib/omr/binarize'
import {
  buildOmrDocument,
  defaultOmrDocumentOptions,
  idCase,
  type OmrDocumentSource,
} from '../../src/lib/omr/buildOmrDocument'
import { buildEvaluation, parseAnchors } from '../../src/lib/omr/omrLayout'
import { OMR_QR_VERSION } from '../../src/lib/omr/omrTypstTemplate'
import { decodePng } from './omrPngDecode'
import { readBoxes } from '../../src/lib/omr/readBoxes'
import { applyHomography, pageToImage } from '../../src/lib/omr/registration'
import type { GrayImage, OmrBox } from '../../src/lib/omr/omrTypes'

/**
 * Aller-retour complet, sur un vrai document compilé par Typst :
 *
 *   génération → positions interrogées → PDF rasterisé → QR décodé →
 *   marqueurs retrouvés → homographie → cases noircies → cases relues
 *
 * C'est le test qui vaut la chaîne entière. Il n'a besoin ni d'imprimante ni
 * de scanner : les cases sont noircies directement dans le bitmap, aux
 * positions issues du layout, et une déformation est appliquée pour simuler
 * une feuille mal posée.
 *
 * Il exige le binaire `typst` ; il est ignoré quand il est absent, plutôt que
 * de faire échouer une CI qui ne l'installe pas.
 */

const POLICES = resolve(__dirname, '../../public/fonts/typst')
const PPI = 150

function typstDisponible(): boolean {
  return spawnSync('typst', ['--version']).status === 0
}

const decrire = typstDisponible() ? describe : describe.skip

const SOURCE: OmrDocumentSource = {
  titre: 'Contrôle de calcul',
  sujetId: 'SUJ7',
  copies: [
    {
      copieId: 'c01',
      eleve: { id: 'e1', nom: 'Alice Martin' },
      exercices: [
        {
          titre: 'Calculs',
          questions: [
            {
              qid: 'q1',
              type: 'qcmMono',
              enonce: 'Combien font $3 times 4$ ?',
              points: 1,
              propositions: [
                { texte: '$12$', correct: true },
                { texte: '$7$', correct: false },
                { texte: '$34$', correct: false },
                { texte: '$1$', correct: false },
              ],
            },
            {
              qid: 'q2',
              type: 'AMCNum',
              enonce: 'Donnez le résultat de $57 + 68$.',
              points: 2,
              colonnes: [
                {
                  label: 'centaines',
                  attendu: '1',
                  valeurs: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
                },
                {
                  label: 'dizaines',
                  attendu: '2',
                  valeurs: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
                },
                {
                  label: 'unités',
                  attendu: '5',
                  valeurs: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
                },
              ],
            },
            {
              qid: 'q3',
              type: 'AMCOpen',
              enonce: 'Justifiez votre démarche.',
              points: 3,
            },
          ],
        },
      ],
    },
    {
      copieId: 'c02',
      eleve: { id: 'e2', nom: 'Bo Nguyen' },
      exercices: [],
    },
  ],
}
// la seconde copie reprend les mêmes exercices que la première
SOURCE.copies[1].exercices = SOURCE.copies[0].exercices

/** Compile le document et renvoie le PNG de chaque page et les positions. */
function compiler(
  source: OmrDocumentSource,
  options = defaultOmrDocumentOptions,
) {
  const dossier = mkdtempSync(join(tmpdir(), 'omr-'))
  try {
    const fichier = join(dossier, 'main.typ')
    writeFileSync(fichier, buildOmrDocument(source, options), 'utf8')

    const compile = spawnSync('typst', [
      'compile',
      '--font-path',
      POLICES,
      '--format',
      'png',
      '--ppi',
      String(PPI),
      fichier,
      join(dossier, 'page-{p}.png'),
    ])
    expect(
      compile.status,
      `compilation Typst : ${compile.stderr?.toString()}`,
    ).toBe(0)

    const query = spawnSync('typst', [
      'query',
      '--font-path',
      POLICES,
      fichier,
      '<omr-box>',
      '--field',
      'value',
    ])
    expect(query.status, `query Typst : ${query.stderr?.toString()}`).toBe(0)
    const anchors = parseAnchors(JSON.parse(query.stdout.toString()))

    const pages: GrayImage[] = []
    for (let p = 1; ; p++) {
      try {
        pages.push(decodePng(readFileSync(join(dossier, `page-${p}.png`))))
      } catch {
        break
      }
    }
    return { anchors, pages }
  } finally {
    rmSync(dossier, { recursive: true, force: true })
  }
}

/** Noircit une case dans le bitmap, comme le ferait un élève au stylo. */
function noircir(image: GrayImage, h: Float64Array, box: OmrBox): void {
  const coin = applyHomography(h, { x: box.x, y: box.y })
  const oppose = applyHomography(h, { x: box.x + box.w, y: box.y + box.h })
  const marge = 0.15
  const x0 = Math.round(coin.x + (oppose.x - coin.x) * marge)
  const x1 = Math.round(oppose.x - (oppose.x - coin.x) * marge)
  const y0 = Math.round(coin.y + (oppose.y - coin.y) * marge)
  const y1 = Math.round(oppose.y - (oppose.y - coin.y) * marge)
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) image.data[y * image.width + x] = 0
  }
}

decrire('aller-retour Typst → lecture optique', () => {
  const { anchors, pages } = compiler(SOURCE)
  const evaluation = buildEvaluation(SOURCE, anchors, {
    titre: SOURCE.titre,
    checkSum: 'test',
    exercicesParams: [],
  })

  it('publie une position pour chaque case de chaque copie', () => {
    // 4 propositions + 30 chiffres + 4 cases de barème, pour 2 copies
    expect(anchors).toHaveLength((4 + 30 + 4) * 2)
    expect(new Set(anchors.map((a) => a.copie))).toEqual(
      new Set(['c01', 'c02']),
    )
  })

  it('publie des rangs physiques, que MathALÉA ramène au rang dans la copie', () => {
    // Typst ne connaît que le rang de la feuille dans le document imprimé ;
    // sans cette conversion, le layout ne pourrait pas être partagé entre les
    // copies, qui occupent des feuilles différentes
    const physiquesC02 = anchors
      .filter((a) => a.copie === 'c02')
      .map((a) => a.page)
    expect(Math.min(...physiquesC02)).toBeGreaterThan(1)

    const c02 = evaluation.copies.find((c) => c.copieId === 'c02')
    expect(c02?.pages[0]).toBe(Math.min(...physiquesC02))
    const relatives = new Set(
      evaluation.layouts[c02?.layoutId as string].map((b) => b.page),
    )
    expect(Math.min(...relatives)).toBe(1)
  })

  it('donne une mise en page unique aux deux copies du même sujet', () => {
    expect(Object.keys(evaluation.layouts)).toHaveLength(1)
  })

  it('place toutes les cases dans la zone imprimable', () => {
    for (const boxes of Object.values(evaluation.layouts)) {
      for (const box of boxes) {
        expect(box.x).toBeGreaterThan(0.05)
        expect(box.x + box.w).toBeLessThan(0.95)
        expect(box.y).toBeGreaterThan(0.05)
        expect(box.y + box.h).toBeLessThan(0.95)
      }
    }
  })

  it('imprime un QR-code décodable identifiant la copie et la page', async () => {
    const jsQR = (await import('jsqr')).default
    const lus: string[] = []
    for (const page of pages) {
      const rgba = new Uint8ClampedArray(page.width * page.height * 4)
      for (let i = 0; i < page.data.length; i++) {
        rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = page.data[i]
        rgba[i * 4 + 3] = 255
      }
      const resultat = jsQR(rgba, page.width, page.height)
      expect(resultat, 'QR-code illisible').not.toBeNull()
      lus.push(resultat?.data ?? '')
    }
    expect(lus[0]).toBe('M1|SUJ7|c01|1')

    // chaque QR porte le rang physique de sa feuille ; il doit concorder avec
    // ce que le fichier d'accompagnement annonce pour cette copie, sinon
    // l'analyse choisirait le mauvais jeu de cases
    lus.forEach((donnee, index) => {
      const [version, sujet, copieId, page] = donnee.split('|')
      expect(version).toBe(OMR_QR_VERSION)
      expect(sujet).toBe('SUJ7')
      expect(Number(page)).toBe(index + 1)
      const copie = evaluation.copies.find((c) => c.copieId === copieId)
      expect(copie, `copie ${copieId} inconnue`).toBeDefined()
      expect(copie?.pages).toContain(Number(page))
    })
    expect(new Set(lus.map((d) => d.split('|')[2]))).toEqual(
      new Set(['c01', 'c02']),
    )
  })

  it('retrouve les marqueurs de calage sur une page rendue', () => {
    const page = pages[0]
    const projection = pageToImage(
      page,
      otsuThreshold(page),
      evaluation.reperes,
    )
    expect(projection, 'recalage impossible').not.toBeNull()
  })

  it('relit exactement les cases noircies, sur une page déformée', () => {
    const layout = evaluation.layouts.L1
    const casesPage1 = layout.filter((b) => b.page === 1)
    expect(casesPage1.length).toBeGreaterThan(10)

    const aNoircir = [
      idCase('q1', 0),
      idCase('q2', '0_1'),
      idCase('q2', '1_2'),
      idCase('q2', '2_5'),
      idCase('q3', 2),
    ].filter((id) => casesPage1.some((b) => b.id === id))
    expect(aNoircir.length).toBeGreaterThan(0)

    // on repart du rendu réel, qu'on noircit puis qu'on relit à l'aveugle
    const page = pages[0]
    const copie: GrayImage = {
      width: page.width,
      height: page.height,
      data: Uint8Array.from(page.data),
    }
    const seuilInitial = otsuThreshold(copie)
    const projection = pageToImage(copie, seuilInitial, evaluation.reperes)
    expect(projection).not.toBeNull()
    for (const id of aNoircir) {
      noircir(
        copie,
        projection as Float64Array,
        casesPage1.find((b) => b.id === id) as OmrBox,
      )
    }

    // relecture : tout est recalculé depuis l'image, rien n'est réutilisé
    const seuil = otsuThreshold(copie)
    const relecture = pageToImage(copie, seuil, evaluation.reperes)
    expect(relecture).not.toBeNull()
    const integral = buildDarkIntegral(copie, seuil)
    const lectures = readBoxes(
      integral,
      copie.width,
      copie.height,
      relecture as Float64Array,
      casesPage1,
    )
    const cochees = lectures
      .filter((l) => l.status === 'cochee')
      .map((l) => l.id)
    expect(cochees.sort()).toEqual([...aNoircir].sort())
    expect(lectures.filter((l) => l.status === 'ambigue')).toHaveLength(0)
  })

  it('imprime le corrigé sans y ajouter une seule case à lire', () => {
    // le corrigé est destiné au professeur : s'il portait des cases, le
    // dépouillement les compterait comme des réponses d'élève
    const avecCorrige = compiler(SOURCE, {
      ...defaultOmrDocumentOptions,
      corrige: 'complet',
    })
    expect(avecCorrige.anchors).toHaveLength(anchors.length)
    expect(avecCorrige.pages.length).toBeGreaterThan(pages.length)
  })

  it('ne coche rien sur une copie rendue blanche', () => {
    const page = pages[0]
    const seuil = otsuThreshold(page)
    const projection = pageToImage(page, seuil, evaluation.reperes)
    const integral = buildDarkIntegral(page, seuil)
    const lectures = readBoxes(
      integral,
      page.width,
      page.height,
      projection as Float64Array,
      evaluation.layouts.L1.filter((b) => b.page === 1),
    )
    expect(lectures.every((l) => l.status === 'vide')).toBe(true)
  })
})
