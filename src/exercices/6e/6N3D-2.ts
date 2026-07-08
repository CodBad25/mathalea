import { droite } from '../../lib/2d/droites'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { segment } from '../../lib/2d/segmentsVecteurs'
import { Latex2d, latex2d } from '../../lib/2d/textes'
import {
  TracePointSurDroite,
  tracePointSurDroite,
} from '../../lib/2d/TracePointSurDroite'
import { orangeMathalea } from '../../lib/colors'
import { demiDroiteInteractive } from '../../lib/interactif/demi_droite_interactive'
import { choice } from '../../lib/outils/arrayOutils'
import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import { adverbeNumeral } from '../../modules/nombreEnLettres'
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
export const uuid = 'cff14'

export const refs = {
  'fr-fr': ['6N3D-2'],
  'fr-2016': [],
  'fr-ch': [],
}

export default class DonnerSensDefinitionQuotient2 extends Exercice {
  private reponsesAttendues: { nums: number[]; den: number }[] = []

  constructor() {
    super()
    this.nbQuestions = 5
    this.exoCustomResultat = true
    this.correctionDetaillee = true
    this.correctionDetailleeDisponible = true
    this.besoinFormulaireNumerique = [
      'Nombres de points à placer (de 1 à 3)',
      3,
    ]
    this.besoinFormulaire2CaseACocher = ['Origine visible', true]
    this.besoinFormulaire3Numerique = [
      'Nombre de clics nécessaires pour graduer',
      3,
      '1: 10 ou moins\n2: 15 ou moins\n3: 20 ou moins',
    ]
    this.besoinFormulaire4Numerique = [
      "Nombre d'unités visibles sur la demi-droite graduée (en LaTeX : 3 maxi)",
      3,
      '1: 2 unités\n2: 3 unités\n3: 4 unités',
    ]
    this.sup = 2
    this.sup2 = true
    this.sup3 = 1
    this.sup4 = 2

    this.comment = `Pour des exercices de placement de points d'abscisses fractionnaires, voir la série CM2N2E.<br>
    Celui-ci demande à l'élève de graduer l'axe.<br>
    En version HTML, on peut avoir un diviseur allant de 2 à 7 (le bouton |+ permet de modifier le nombre de parts).<br>
    En version LaTeX, les diviseurs sont limités à 2, 4 et 5 avec une unité à 4 cm pour faciliter la graduation de l'axe.`
  }

  nouvelleVersion() {
    const nbClicsMax = (1 + this.sup3) * 5
    const nbUnits = 1 + (context.isHtml ? this.sup4 : Math.min(this.sup4, 2))
    this.consigne = context.isHtml
      ? `Utiliser les boutons pour modifier la demi-droite graduée et créer les graduations nécessaires pour placer ${
          this.sup === 1
            ? 'le point $A$'
            : `les points ${['A', 'B', 'C']
                .slice(0, this.sup - 1)
                .map((p) => `$${p}$`)
                .join(', ')}` + `et $${['A', 'B', 'C'][this.sup - 1]}$`
        }.`
      : `L'unité fait 4 cm. Graduer régulièrement l'axe et placer  ${
          this.sup === 1
            ? 'le point $A$'
            : `les points ${['A', 'B', 'C']
                .slice(0, this.sup - 1)
                .map((p) => `$${p}$`)
                .join(', ')}` + `et $${['A', 'B', 'C'][this.sup - 1]}$`
        }.`
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const x0 = this.sup2 ? 0 : randint(1, 3)
      let den: number
      const abscisseT = x0 + nbUnits
      do {
        den = context.isHtml ? randint(2, 5) : choice([2, 4, 5])
      } while (den * (abscisseT - x0) > nbClicsMax)

      const nums: number[] = []
      for (let j = 0; j < this.sup; j++) {
        nums.push(randint(den * x0 + 1, den * abscisseT - 1, [...nums, den]))
      }
      let texte =
        this.sup === 1
          ? `Placer le point $A$ d'abscisse $\\dfrac{${nums[0]}}{${den}}$ sur la demi-droite graduée ci-dessous.<br><br>`
          : `Placer les points ${nums.map((n, i) => `$${`${['A', 'B', 'C'][i]}(\\dfrac{${n}}{${den}})`}$`).join(', ')} sur la demi-droite graduée ci-dessous.<br><br>`
      let texteCorr = `On partage le segment de $${nbUnits}$ unités en $${den * (abscisseT - x0)}$ parties égales.<br>`
      if (this.correctionDetaillee) {
        texteCorr += `En effet, $${abscisseT - x0} = ${den * (abscisseT - x0)} \\times \\dfrac{${1}}{${den}}$.<br><br>`
      }
      if (!this.sup2) {
        texteCorr += `À compter de l'abscisse $${x0}$...<br>`
      }
      if (this.sup === 1) {
        texteCorr += `Le point A est placé sur la ${adverbeNumeral(nums[0] - x0 * den)} graduation${nums[0] - x0 * den < den ? '' : `, soit $${Math.floor((nums[0] - x0 * den) / den)}$ unités plus $${(nums[0] - x0 * den) % den}$ graduation${(nums[0] - x0 * den) % den < 2 ? '' : 's'}`}.<br>`
      } else {
        texteCorr += `${nums
          .map((num, i) => {
            return `Le point ${['A', 'B', 'C'][i]} est placé sur la ${adverbeNumeral(num - x0 * den)} graduation${num - x0 * den < den ? '' : `, soit $${Math.floor((num - x0 * den) / den)}$ unités plus $${(num - x0 * den) % den}$ graduation${(num - x0 * den) % den < 2 ? '' : 's'}`}.<br>`
          })
          .join('')}`
      }

      texteCorr +=
        this.sup === 1
          ? `Le point d'abscisse $\\dfrac{${nums[0]}}{${den}}$ est placé sur la demi-droite graduée ci-dessous.<br><br>`
          : `Les points d'abscisse ${['A', 'B', 'C']
              .slice(0, this.sup)
              .map((p, i) => `$${p}(\\dfrac{${nums[i]}}{${den}})$`)
              .join(
                ', ',
              )} sont placés sur la demi-droite graduée ci-dessous.<br><br>`
      if (context.isHtml) {
        texte += demiDroiteInteractive(this, i, {
          initialT: abscisseT,
          minT: abscisseT,
          maxT: abscisseT,
          multiplePoints: this.sup > 1,
          x0,
        })
        texteCorr += demiDroiteInteractive(this, i, {
          initialT: abscisseT,
          x0,
          minT: abscisseT,
          maxT: abscisseT,
          interactivityOn: false,
          partsCount: den * (abscisseT - x0),
          points: nums.map((num, i) => ({
            pointValue: num / den,
            label: ['A', 'B', 'C'][i],
          })),
          id: `demi-droite-gradueeEx${this.numeroExercice}Q${i}Corr`,
          pointsColor: orangeMathalea,
          multiplePoints: this.sup > 1,
        })
      } else {
        const O = pointAbstrait(0, 0)
        const I = pointAbstrait(2, 0)

        const F = pointAbstrait((abscisseT - x0) * 4 + 0.5, 0)
        const axe = segment(O, F)
        const d = droite(O, F)
        axe.epaisseur = 2
        axe.styleExtremites = '->'
        const ticks: TracePointSurDroite[] = []
        const labels: Latex2d[] = []
        for (let j = 0; j <= abscisseT - x0; j++) {
          const tick = tracePointSurDroite(pointAbstrait(j * 4, 0), d, 'black')
          ticks.push(tick)
          labels.push(latex2d(`$${j + x0}$`, j * 4, -0.7, {}))
        }

        const objets = [axe, ...ticks, ...labels]
        texte += mathalea2d(
          Object.assign({ scale: 1 }, fixeBordures(objets, { rxmin: 0 })),
          objets,
        )
      }

      if (this.questionJamaisPosee(i, nums.join(''), den)) {
        // Si la question n'a jamais été posée, on en crée une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        this.reponsesAttendues[i] = { nums, den }
        i++
      }
      cpt++
    }

    listeQuestionsToContenu(this)
  }

  correctionInteractive = (i?: number): string[] => {
    if (i === undefined) return []
    const nbPoints = this.sup

    const host = document.querySelector(
      `#demi-droite-gradueeEx${this.numeroExercice}Q${i}`,
    ) as
      | (HTMLElement & {
          disableControls: () => void
          value: {
            partsCount: number
            maxT: number
            showwNegative: boolean
            points: { pointValue: number; label: string }[]
          }
        })
      | null

    if (host === null || this.reponsesAttendues[i] === undefined) return []
    host.disableControls()

    const value = host.value
    this.answers ??= {}
    this.answers[`Ex${this.numeroExercice}Q${i}`] = JSON.stringify(value)
    const results: ('OK' | 'KO')[] = []
    for (let j = 0; j < nbPoints; j++) {
      const attendu =
        this.reponsesAttendues[i].nums[j] / this.reponsesAttendues[i].den
      const saisi = value.points[j]?.pointValue
      const ok = saisi !== undefined && Math.abs(saisi - attendu) < 1e-9

      results.push(ok ? 'OK' : 'KO')
    }
    const spanResultat = document.querySelector(
      `#resultatCheckEx${this.numeroExercice}Q${i}`,
    ) as HTMLDivElement | null
    if (spanResultat) {
      const ok = results.every((r) => r === 'OK')
      spanResultat.innerHTML = ok ? '😎' : '☹️'
    }

    return results
  }
}
