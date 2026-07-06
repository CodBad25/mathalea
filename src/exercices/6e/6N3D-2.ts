import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { segment, segmentAvecExtremites } from '../../lib/2d/segmentsVecteurs'
import { labelPoint } from '../../lib/2d/textes'
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
  'fr-fr': [],
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
    this.besoinFormulaire2CaseACocher = [
      'Avec partage en 5 pour la version latex',
      false,
    ]
    this.sup = 2
    this.sup2 = false
    this.comment = `Cet exercice est dans la lignée de la série CM2N2E, mais il se distingue par le fait que l'élève doit lui-même graduer l'axe.<br>
    En version HTML, on peut avoir un diviseur allant de 2 à 7 (le bouton |+ permet de modifier le nombre de parts).<br>
    En version LaTex, les diviseurs sont limités à 2, 4 et 5 (ou 2 et 4 seulement si la case est décochée), car l'élève doit effectuer lui même le partage du segment $[OT]$.`
  }

  nouvelleVersion() {
    this.consigne = context.isHtml
      ? `Utiliser les boutons pour modifier la demi-droite graduée et créer les graduations nécessaires pour placer ${
          this.sup === 1
            ? 'le point $A$'
            : `les points ${['A', 'B', 'C']
                .slice(0, this.sup - 1)
                .map((p) => `$${p}$`)
                .join(', ')}` + `et $${['A', 'B', 'C'][this.sup - 1]}$`
        }.`
      : "L'unité est le cm. Un segment $[OT]$ est à construire sur la demi-droite graduée, puis à partager en parties égales pour placer le point $A$."
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const abscisseT = randint(3, 5)
      const den = context.isHtml
        ? randint(2, 7)
        : this.sup2
          ? choice([2, 4, 5])
          : choice([2, 4])
      const nums: number[] = []
      for (let j = 0; j < this.sup; j++) {
        nums.push(randint(1, den * abscisseT - 1, [...nums, den]))
      }
      let texte =
        this.sup === 1
          ? `Placer le point $A$ d'abscisse $\\dfrac{${nums[0]}}{${den}}$ sur la demi-droite graduée ci-dessous.<br><br>`
          : `Placer les points ${nums.map((n, i) => `$${`${['A', 'B', 'C'][i]}(\\dfrac{${n}}{${den}})`}$`).join(', ')} sur la demi-droite graduée ci-dessous.<br><br>`
      let texteCorr = `On partage $[OT]$ en $${den * abscisseT}$ parties égales.<br>`
      if (this.correctionDetaillee) {
        texteCorr += `En effet, $${abscisseT} = ${den * abscisseT} \\times \\dfrac{${1}}{${den}}$.<br><br>`
      }
      if (this.sup === 1) {
        texteCorr += `Le point A est placé sur la ${adverbeNumeral(nums[0])} graduation après $O$.<br>`
      } else {
        texteCorr += `${nums
          .map((num, i) => {
            return `Le point ${['A', 'B', 'C'][i]} est placé sur la ${adverbeNumeral(num)} graduation après $O$.<br>`
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
        })
        texteCorr += demiDroiteInteractive(this, i, {
          initialT: abscisseT,
          minT: abscisseT,
          maxT: abscisseT,
          interactivityOn: false,
          partsCount: den * abscisseT,
          points: nums.map((num, i) => ({
            pointValue: num / den,
            label: ['A', 'B', 'C'][i],
          })),
          id: `demi-droite-gradueeEx${this.numeroExercice}Q${i}Corr`,
          pointsColor: orangeMathalea,
          multiplePoints: this.sup > 1,
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
    const spanResultat = document.querySelector(
      `#resultatCheckEx${this.numeroExercice}Q${i}`,
    ) as HTMLDivElement | null

    if (host === null || this.reponsesAttendues[i] === undefined) return []

    const value = host.value
    this.answers ??= {}
    this.answers[`Ex${this.numeroExercice}Q${i}`] = JSON.stringify(value)
    const results: ('OK' | 'KO')[] = []
    for (let j = 0; j < nbPoints; j++) {
      const attendu =
        this.reponsesAttendues[i].nums[j] / this.reponsesAttendues[i].den
      const saisi = value.points[j]?.pointValue
      const ok = saisi !== undefined && Math.abs(saisi - attendu) < 1e-9

      host.disableControls()

      if (spanResultat) {
        spanResultat.innerHTML = ok ? '😎' : '☹️'
      }
      results.push(ok ? 'OK' : 'KO')
    }
    return results
  }
}
