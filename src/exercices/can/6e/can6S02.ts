import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { context } from '../../../modules/context'
import FractionEtendue from '../../../modules/FractionEtendue'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Enrichir son vocabulaire sur les probabilités'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Éric Elter

 */
export const uuid = '2a91a'

export const refs = {
  'fr-fr': ['can6S02', '6P2A-flash1'],
  'fr-ch': ['NR'],
}
export default class ChancesSurEtProbabilites extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecFraction
    this.optionsChampTexte = { texteApres: '.' }
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const nbChances = randint(1, 3)
    const nbTotal = nbChances + randint(1, 3)
    this.reponse = new FractionEtendue(nbChances, nbTotal).texFraction
    this.question = `S'il y a $${nbChances}$ chance${nbChances === 1 ? '' : 's'} sur $${nbTotal}$ qu'un événement se produise, alors la probabilité
    que cet événement se réalise est de : `
    if (!this.interactif && context.isHtml) {
      this.question += '$\\ldots$'
    }
    this.correction = `S'il y a $${nbChances}$ chance${nbChances === 1 ? '' : 's'} sur $${nbTotal}$ qu'un événement se produise, alors la probabilité
    que cet événement se réalise est de $${miseEnEvidence(this.reponse)}$.`
  }
}
