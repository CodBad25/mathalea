import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { segment, segmentAvecExtremites } from '../../lib/2d/segmentsVecteurs'
import { labelPoint } from '../../lib/2d/textes'
import { demiDroiteInteractive } from '../../lib/interactif/demi_droite_interactive'
import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const dateDePublication = '05/07/2026'
export const titre =
  'Placer une abscisse fractionnaire sur une demi-droite graduée'
export const interactifReady = true
export const interactifType = 'custom'
export const amcReady = true
export const amcType = 'AMCHybride'

/** Placer une abscisse fractionnaire sur une demi-droite graduée
 * @author Jean-Claude Lhote
 */
export const uuid = 'cff13'

export const refs = {
  'fr-fr': ['6N3D-1'],
  'fr-2016': [],
  'fr-ch': [],
}

export default class DonnerSensDefinitionQuotient2 extends Exercice {
  private reponsesAttendues: { num: number; den: number }[] = []

  constructor() {
    super()
    this.nbQuestions = 5
    this.exoCustomResultat = true
    this.correctionDetaillee = true
    this.correctionDetailleeDisponible = true
    this.besoinFormulaireCaseACocher = ['Avec une multiplication', false]
    // this.besoinFormulaire2Numerique = ['Nombre de points à placer', 3]
    // this.besoinFormulaire3CaseACocher = ['Avec les abscisses négatives', false]
    // this.sup2 = 1
    this.sup = false
    // this.sup3 = false
  }

  nouvelleVersion() {
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const abscisseT = randint(4, 9)
      const den = randint(3, 7, abscisseT)
      const num = this.sup ? randint(2, den - 1) * abscisseT : abscisseT

      let texte = `Placer le point $A$ d'abscisse $\\dfrac{${num}}{${den}}$ sur la demi-droite graduée ci-dessous.<br><br>`
      let texteCorr = `Le point d'abscisse $\\dfrac{${num}}{${den}}$ est placé sur la demi-droite graduée ci-dessous.<br><br>`

      if (context.isHtml) {
        texte += demiDroiteInteractive(this, i, {
          initialT: 2,
          minT: 2,
          maxT: 10,
        })
        texteCorr += demiDroiteInteractive(this, i, {
          initialT: abscisseT,
          minT: 2,
          maxT: 10,
          interactivityOn: false,
          partsCount: den,
          points: [{ pointValue: num / den, label: 'A' }],
        })
      } else {
        const O = pointAbstrait(0, 0, 'O', 'above')
        const I = pointAbstrait(1, 0, 'I', 'above')
        const u = segmentAvecExtremites(O, I)
        u.epaisseur = 2
        const axe = segment(O, pointAbstrait(10, 0))
        axe.epaisseur = 2
        axe.styleExtremites = '->'
        const objets = [u, labelPoint(O, I), axe]
        texte += mathalea2d(
          Object.assign({ scale: 1 }, fixeBordures(objets)),
          objets,
        )
      }

      if (this.questionJamaisPosee(i, num, den)) {
        // Si la question n'a jamais été posée, on en crée une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        this.reponsesAttendues[i] = { num, den }
        i++
      }
      cpt++
    }

    listeQuestionsToContenu(this)
  }

  correctionInteractive = (i?: number): string => {
    if (i === undefined) return ''

    const host = document.querySelector(
      `#demi-droite-gradueeEx${this.numeroExercice}Q${i}`,
    ) as
      | (HTMLElement & {
          value: {
            partsCount: number
            maxT: number
            showwNegative: boolean
            points: { pointValue: number; label: string }[]
          }
        })
      | null
    const spanResultat = document.querySelector(
      `#resultatCheckEx${this.numeroExercice}Q${i}`,
    ) as HTMLDivElement | null

    if (host === null || this.reponsesAttendues[i] === undefined) return ''

    const value = host.value
    this.answers ??= {}
    this.answers[`Ex${this.numeroExercice}Q${i}`] = JSON.stringify(value)

    const attendu =
      this.reponsesAttendues[i].num / this.reponsesAttendues[i].den
    const saisi = value.points[0]?.pointValue
    const ok = saisi !== undefined && Math.abs(saisi - attendu) < 1e-9

    if (spanResultat) {
      spanResultat.innerHTML = ok ? '😎' : '☹️'
    }
    return ok ? 'OK' : 'KO'
  }
}
