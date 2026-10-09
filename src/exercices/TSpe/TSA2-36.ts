import { addMathaleaQcm } from '../../lib/customElements/MathaleaQcm'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import {
  choice,
  combinaisonListes,
  shuffle,
} from '../../lib/outils/arrayOutils'
import { reduireAxPlusB } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Identifier une limite déterminable par comparaison'
export const dateDePublication = '09/10/2026'
export const interactifReady = true
export const uuid = '5ade2'
export const refs = { 'fr-fr': ['TSA2-36', 'TCA2-36'], 'fr-ch': [] }

/** @author Stéphane Guyon */
export default class LimitesDeterminablesParComparaison extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 3
  }

  nouvelleVersion(): void {
    this.consigne = this.interactif
      ? ''
      : 'Déterminer quelle limite de $f$ peut être déduite de la seule information donnée.'
    const types = combinaisonListes(
      ['minorantAffine', 'majorantAffine', 'constante'],
      this.nbQuestions,
    )
    for (
      let i = 0, attempts = 0;
      i < this.nbQuestions && attempts < 50;
      attempts++
    ) {
      const type = types[i]
      const constant = randint(-6, 6)
      const coefficient = type === 'constante' ? 0 : randint(-4, 4, 0)
      const lowerBound =
        type === 'minorantAffine' ||
        (type === 'constante' && choice([true, false]))
      const strict = choice([true, false])
      const bound = reduireAxPlusB(coefficient, constant)
      const inequality = lowerBound
        ? `${bound}${strict ? '\\lt' : '\\leqslant'} f(x)`
        : `f(x)${strict ? '\\lt' : '\\leqslant'} ${bound}`
      const finitePoint = randint(-3, 3)
      if (!this.questionJamaisPosee(i, inequality, finitePoint)) continue

      const direction =
        coefficient === 0 ? null : coefficient > 0 === lowerBound ? '+' : '-'
      const limit = (at: string) => `\\displaystyle\\lim_{x\\to${at}}f(x)`
      const propositions = shuffle([
        {
          texte: `$${limit('-\\infty')}$`,
          statut: direction === '-',
        },
        {
          texte: `$${limit(String(finitePoint))}$`,
          statut: false,
        },
        {
          texte: `$${limit('+\\infty')}$`,
          statut: direction === '+',
        },
        { texte: 'Aucune de ces limites.', statut: direction === null },
      ])
      let correction: string
      if (direction === null) {
        correction = `Une borne constante ne permet de déterminer aucune des trois limites proposées.<br>
        L’inégalité donne seulement ${lowerBound ? 'un minorant' : 'un majorant'} constant, égal à $${constant}$. Elle ne force $f(x)$ à tendre ni vers une valeur précise, ni vers un infini.<br>
        La bonne réponse est $${miseEnEvidence('\\text{Aucune de ces limites}')}$.`
      } else {
        const value = lowerBound ? '+\\infty' : '-\\infty'
        const otherDirection = direction === '+' ? '-' : '+'
        const otherValue = lowerBound ? '-\\infty' : '+\\infty'
        const finiteBound = coefficient * finitePoint + constant
        correction = `On sait que $\\displaystyle\\lim_{x\\to${direction}\\infty}(${bound})=${value}$.<br>
        Comme $${inequality}$ pour tout réel $x$, le théorème de comparaison permet de conclure que $${limit(`${direction}\\infty`)}=${miseEnEvidence(value)}$.<br>
        À l’autre infini, on a $\\displaystyle\\lim_{x\\to${otherDirection}\\infty}(${bound})=${otherValue}$.<br>
        ${
          lowerBound
            ? 'Être au-dessus d’une fonction qui tend vers $-\\infty$ ne force pas $f$ à tendre vers $-\\infty$. Pour appliquer le théorème de comparaison, il faudrait un majorant qui tende vers $-\\infty$.'
            : 'Être en dessous d’une fonction qui tend vers $+\\infty$ ne force pas $f$ à tendre vers $+\\infty$. Pour appliquer le théorème de comparaison, il faudrait un minorant qui tende vers $+\\infty$.'
        }<br>
        On ne peut donc pas déterminer $${limit(`${otherDirection}\\infty`)}$ avec cette comparaison.<br><br>
        En $${finitePoint}$, on a $\\displaystyle\\lim_{x\\to${finitePoint}}(${bound})=${finiteBound}$. Une seule ${lowerBound ? 'minoration' : 'majoration'} ne force pas $f$ à avoir cette limite. Il faudrait un encadrement par deux fonctions ayant la même limite pour appliquer le théorème des gendarmes.<br>
        On ne peut donc pas non plus déterminer $${limit(String(finitePoint))}$.`
      }
      let text = `Soit $f$ une fonction définie sur $\\mathbb R$. On sait que, pour tout réel $x$, $${inequality}$.<br>
      Quelle limite peut-on déterminer ?`
      const options = { radio: true, vertical: false }
      handleAnswers(
        this,
        i,
        {
          qcm: { enonce: text, propositions, correction, options },
        },
        { formatInteractif: 'mathalea-qcm' },
      )
      if (context.isHtml) {
        text += addMathaleaQcm(this, i, {
          ...options,
          interactivityOn: this.interactif,
        })
      } else if (!context.isAmc) {
        text += propositionsQcm(this, i).texte
      }
      this.listeQuestions[i] = text
      this.listeCorrections[i] = correction
      i++
    }
    listeQuestionsToContenu(this)
  }
}
