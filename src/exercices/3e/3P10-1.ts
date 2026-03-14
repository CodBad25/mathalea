/**
 * ⚠️ Cet exercice est utilisé dans le test : tests/e2e/tests/interactivity/mathLive.texte.test.ts ⚠️
 */

import Decimal from 'decimal.js'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { setReponse } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import {
  miseEnEvidence,
  texteEnCouleurEtGras,
} from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import {
  contraindreValeur,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  "Lier un coefficient multiplicateur d'une variation à un pourcentage et réciproquement"
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Déterminer le coefficient de proportionnalité associé à une évolution en pourcentage ou l'inverse
 * @author Rémi Angot
 */
export const uuid = '4ce2d'

export const refs = {
  'fr-fr': ['3P10-1', 'BP2CCF12'],
  'fr-ch': ['10FA4-6'],
}
export default class CoefficientEvolution extends Exercice {
  version = 1
  constructor() {
    super()
    this.besoinFormulaireNumerique = [
      'Niveau de difficulté',
      3,
      '1 : Déterminer le coefficient\n2 : Exprimer une variation en pourcentage\n3 : Mélange',
    ]

    this.consigne = 'Compléter.'
    this.nbQuestions = 4

    this.sup = 1
    this.version = 1
  }

  // }
  nouvelleVersion() {
    let typesDeQuestionsDisponibles = []
    this.sup = contraindreValeur(1, 3, this.sup, 1)
    if (this.sup === 1) {
      typesDeQuestionsDisponibles = ['coef+', 'coef-']
      this.introduction = this.interactif
        ? '<em>Il faut saisir un nombre décimal.</em>'
        : ''
    } else if (this.sup === 2) {
      typesDeQuestionsDisponibles = ['taux+', 'taux-']
      this.introduction = this.interactif
        ? '<em>Il faut saisir une réponse de la forme +10% ou -10%.</em>'
        : ''
    } else {
      typesDeQuestionsDisponibles = ['coef+', 'coef-', 'taux+', 'taux-']
      this.introduction = this.interactif
        ? '<em>Il faut saisir un nombre décimal ou une réponse de la forme +10% ou -10%.</em>'
        : ''
    }
    const listeTypeDeQuestions = combinaisonListes(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    ) // Tous les types de questions sont posées mais l'ordre diffère à chaque "cycle"
    for (
      let i = 0, texte, texteCorr, reponse, taux, coeff, cpt = 0;
      i < this.nbQuestions && cpt < 100;
    ) {
      if (['taux-', 'coef-'].includes(listeTypeDeQuestions[i])) {
        taux = choice([randint(1, 9) * 10, randint(1, 29, [10, 20])])
      } else {
        taux = choice([randint(1, 19) * 10, randint(1, 29, [10, 20])])
      }
      switch (listeTypeDeQuestions[i]) {
        case 'coef+':
          texte = `Augmenter de $${taux}~\\%$ revient à multiplier par `
          coeff = texNombre(1 + taux / 100, 2)
          texteCorr = `Augmenter de $${taux}~\\%$ revient à multiplier par $${miseEnEvidence(coeff)}$ car $100~\\% + ${taux}~\\% = ${100 + taux}~\\%$.`
          if (this.version === 2) {
            texteCorr = `On cherche le coefficient multiplicateur $CM$ connaissant le taux d'évolution $T=${taux}~\\%=${texNombre(taux / 100, 2)}$.<br>
         Comme $CM=1+T$ alors $CM=1+${texNombre(taux / 100, 2)}=${coeff}$.<br>
         Ainsi, augmenter de $${taux}~\\%$ revient à multiplier par $${miseEnEvidence(coeff)}$.`
          }
          reponse = new Decimal(taux).div(100).add(1)
          setReponse(this, i, reponse, { formatInteractif: 'calcul' })

          break
        case 'coef-':
          texte = `Diminuer de $${taux}~\\%$ revient à multiplier par `
          coeff = texNombre(1 - taux / 100, 2)
          texteCorr = `Diminuer de $${taux}~\\%$ revient à multiplier par $${miseEnEvidence(coeff)}$ car $100~\\% - ${taux}~\\% = ${100 - taux}~\\%$.`
          if (this.version === 2) {
            texteCorr = `On cherche le coefficient multiplicateur $CM$ connaissant le taux d'évolution $T=-${taux}~\\%=-${texNombre(taux / 100, 2)}$.<br>
          Comme $CM=1+T$ alors $CM=1-${texNombre(taux / 100, 2)}=${coeff}$.<br>
          Ainsi, diminuer de $${taux}~\\%$ revient à multiplier par $${miseEnEvidence(coeff)}$.`
          }
          reponse = new Decimal(-taux).div(100).add(1)
          setReponse(this, i, reponse, { formatInteractif: 'calcul' })

          break
        case 'taux+':
          coeff = texNombre(1 + taux / 100, 2)
          texte = this.interactif
            ? `Multiplier par $${coeff}$ revient à faire `
            : `Multiplier par $${coeff}$ revient à `

          texteCorr = `Multiplier par $${coeff}$ revient à ${texteEnCouleurEtGras('augmenter de ', 'blue')} $${miseEnEvidence(`${taux}~\\%`, 'blue')}$  car $${coeff} = ${100 + taux}~\\% = 100~\\% ${miseEnEvidence(`+ ${taux}~\\%`)}$.`
          if (this.version === 2) {
            texteCorr = `On cherche le taux d'évolution $T$   connaissant le coefficient multiplicateur $CM=${coeff}$.<br>
          Comme $T=CM-1$, alors $T=${coeff}-1=${texNombre(taux / 100, 2)}$.<br>
          Ainsi, multiplier par $${coeff}$ revient à  augmenter de $${taux}~\\%$, soit $T=${miseEnEvidence(`+ ${taux}~\\%`)}$.
          `
          }
          reponse = `+${taux}\\%`
          setReponse(this, i, reponse, { formatInteractif: 'texte' })

          break
        case 'taux-':
        default:
          coeff = texNombre(1 - taux / 100, 2)
          texte = this.interactif
            ? `Multiplier par $${coeff}$ revient à faire `
            : `Multiplier par $${coeff}$ revient à `
          texteCorr = `Multiplier par $${coeff}$ revient à ${texteEnCouleurEtGras('diminuer de ', 'blue')} $${miseEnEvidence(`${taux}~\\%`, 'blue')}$ car $${coeff} = ${100 - taux}~\\% = 100~\\% ${miseEnEvidence(`- ${taux}~\\%`)}$.`
          if (this.version === 2) {
            texteCorr = `On cherche le taux d'évolution $T$  connaissant le coefficient multiplicateur $CM=${coeff}$.<br>
          Comme $T=CM-1$, alors $T=${coeff}-1=-${texNombre(taux / 100, 2)}$.<br>
          Ainsi, multiplier par $${coeff}$ revient à diminuer de $${taux}~\\%$, soit $T=${miseEnEvidence(`- ${taux}~\\%`)}$.
          `
          }
          reponse = `-${taux}\\%`
          setReponse(this, i, reponse, { formatInteractif: 'texte' })
          break
      }
      texte += this.interactif
        ? ajouteChampTexteMathLive(this, i, KeyboardType.clavierFullOperations)
        : '...'
      if (this.questionJamaisPosee(i, taux)) {
        // Si la question n'a jamais été posée, on en créé une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
