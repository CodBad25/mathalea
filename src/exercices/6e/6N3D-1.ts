import { droite } from '../../lib/2d/droites'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { segment, segmentAvecExtremites } from '../../lib/2d/segmentsVecteurs'
import { labelPoint, latex2d, Latex2d } from '../../lib/2d/textes'
import { tracePoint } from '../../lib/2d/TracePoint'
import {
  tracePointSurDroite,
  type TracePointSurDroite,
} from '../../lib/2d/TracePointSurDroite'
import { orangeMathalea } from '../../lib/colors'
import { demiDroiteInteractive } from '../../lib/customElements/demi_droite_interactive'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { choice } from '../../lib/outils/arrayOutils'
import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import { adverbeNumeral } from '../../modules/nombreEnLettres'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import type { NestedObjetMathalea2dArray } from '../../types/2d'
import Exercice from '../Exercice'

export const dateDePublication = '05/07/2026'
export const titre =
  'Placer une abscisse fractionnaire sur une demi-droite (fraction quotient)'
export const interactifReady = true
export const interactifType = 'demi-droite-interactive'

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
    this.correctionDetaillee = true
    this.correctionDetailleeDisponible = true
    this.besoinFormulaireCaseACocher = ['Avec une multiplication', false]
    this.besoinFormulaire2CaseACocher = [
      'Avec partage en 5 et 10 pour la version latex',
      false,
    ]
    this.sup = false
    this.sup2 = false
    this.comment = `Cet exercice se distingue de la série CM2N2E par le fait qu'on utilise la notion de quotient pour placer le point A.<br>
    En version HTML, on peut avoir un diviseur allant de 2 à 10 (le bouton |+ permet de modifier le nombre de parts).<br>
    En version LaTex, les diviseurs sont limités à 2, 4, 5 et 10 (ou 2 et 4 seulement si la case est décochée), car l'élève doit effectuer lui même le partage du segment [OT] après avoir placé le point T.`
  }

  nouvelleVersion() {
    this.consigne = context.isHtml
      ? 'Utiliser les boutons pour modifier la demi-droite graduée et créer les graduations nécessaires pour placer le point $A$.'
      : "L'unité est le cm. Un segment [OT] est à construire sur la demi-droite graduée, puis à partager en parties égales pour placer le point $A$."
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const abscisseT = randint(4, 9)
      const den = context.isHtml
        ? randint(2, 10, abscisseT)
        : this.sup2
          ? choice([2, 4, 5, 10], abscisseT)
          : choice([2, 4], abscisseT)
      const num = this.sup ? randint(2, den - 1) * abscisseT : abscisseT

      let texte = `Placer le point $A$ d'abscisse $\\dfrac{${num}}{${den}}$ sur la demi-droite graduée ci-dessous.<br><br>`
      let texteCorr = `On construit le segment [OT] de longueur ${abscisseT} cm, puis on le partage en ${den} parties égales.<br>
        Le point A est placé sur la ${adverbeNumeral(num / abscisseT)} graduation après $O$.<br>`
      texteCorr +=
        this.correctionDetaillee && this.sup
          ? `En effet, $\\dfrac{${num}}{${den}} =${num / abscisseT} \\times \\dfrac{${abscisseT}}{${den}}$.<br><br>`
          : ''
      texteCorr += `Le point d'abscisse $\\dfrac{${num}}{${den}}$ est placé sur la demi-droite graduée ci-dessous.<br><br>`
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
          id: `demi-droite-gradueeEx${this.numeroExercice}Q${i}Corr`,
          pointsColor: orangeMathalea,
        })
      } else {
        const O = pointAbstrait(0, 0, 'O', 'above')
        const I = pointAbstrait(1, 0, 'I', 'above')
        const u = segmentAvecExtremites(O, I)
        u.epaisseur = 1
        const axe = segment(O, pointAbstrait(10, 0))
        axe.epaisseur = 1.5
        axe.styleExtremites = '->'
        const objets: NestedObjetMathalea2dArray = [u, labelPoint(O, I), axe]
        texte += mathalea2d(
          Object.assign({ scale: 1 }, fixeBordures(objets, { rxmin: 0 })),
          objets,
        )
        const objetsCorr: NestedObjetMathalea2dArray = [
          u,
          labelPoint(O, I),
          axe,
        ]
        const ticks: TracePointSurDroite[] = []
        const d = droite(O, pointAbstrait(10, 0))
        const labels: Latex2d[] = []
        for (let j = 0; j <= abscisseT; j++) {
          const tick = tracePointSurDroite(pointAbstrait(j, 0), d, 'black')
          tick.taille = 0.1
          ticks.push(tick)
          labels.push(latex2d(`$${j}$`, j, -0.7, {}))
        }
        const cuts: TracePointSurDroite[] = []
        const marques: Latex2d[] = []
        for (let k = 1; k <= den; k++) {
          const cut = tracePointSurDroite(
            pointAbstrait((k * abscisseT) / den, 0),
            d,
          )
          cut.epaisseur = 2
          cuts.push(cut)
          const marque: Latex2d = latex2d(
            `//`,
            (((2 * k - 1) / 2) * abscisseT) / den,
            0,
            { letterSize: 'tiny', gras: true, color: 'red' },
          )

          marque.gras = true
          marques.push(marque)
        }
        const A = pointAbstrait(abscisseT / den, 0, 'A', 'above')
        const labelPointA = latex2d('A', A.x, A.y + 0.5, {
          color: orangeMathalea,
          gras: true,
          letterSize: 'normalsize',
        })
        const tracePointA = tracePoint(A, orangeMathalea)
        tracePointA.epaisseur = 2

        objetsCorr.push(ticks, labels, marques, cuts, tracePointA, labelPointA)
        texteCorr += mathalea2d(
          Object.assign({ scale: 1 }, fixeBordures(objetsCorr, { rxmin: 0 })),
          objetsCorr,
        )
      }

      if (this.questionJamaisPosee(i, num, den)) {
        handleAnswers(
          this,
          i,
          {
            reponse: {
              value: JSON.stringify({
                partsCount: den,
                maxT: num,
                showwNegative: false,
                points: [{ pointValue: num / den, label: 'A' }],
                x0: 0,
              }),
            },
          },
          { formatInteractif: 'demi-droite-interactive' },
        )
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
          disableControls: () => void
          value: {
            partsCount: number
            maxT: number
            showwNegative: boolean
            points: { pointValue: number; label: string }[]
          }
        })
      | null

    if (host === null || this.reponsesAttendues[i] === undefined) return ''
    host.disableControls()

    const value = host.value
    this.answers ??= {}
    this.answers[`Ex${this.numeroExercice}Q${i}`] = JSON.stringify(value)

    const attendu =
      this.reponsesAttendues[i].num / this.reponsesAttendues[i].den
    const saisi = value.points[0]?.pointValue
    const ok = saisi !== undefined && Math.abs(saisi - attendu) < 1e-9

    const spanResultat = document.querySelector(
      `#resultatCheckEx${this.numeroExercice}Q${i}`,
    ) as HTMLDivElement | null

    if (spanResultat) {
      spanResultat.innerHTML = ok ? '😎' : '☹️'
    }
    return ok ? 'OK' : 'KO'
  }
}
