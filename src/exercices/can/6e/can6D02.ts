import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Calculer un reste en minutes'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDeModificationImportante = '21/03/2026'
/**
 * @author Jean-Claude Lhote & Gilles Mora
 * Créé pendant l'été 2021

 */
export const uuid = '46e66'

export const refs = {
  'fr-fr': ['can6D02', '6M4C-flash2'],
  'fr-ch': [],
}
export default class ResteEnMinutes extends ExerciceSimple {
  constructor() {
    super()
    this.nbQuestions = 1
this.formatChampTexte = KeyboardType.clavierDeBase
    this.typeExercice = 'simple'
    this.optionsChampTexte = {texteAvant : '<br>', texteApres: ' minutes' }
    this.optionsDeComparaison = { nombreDecimalSeulement: true }
  }

  nouvelleVersion() {
    const a = randint(1, 2)
    const b = randint(10, 59)
    const d = a * 60 + b
    this.question = ` Si on met $${d}$ minutes au format heures-minutes, quel serait le nombre de minutes ?`
    this.correction = `$${d} = ${a} \\times 60 + ${b}$ donc $${d}$ minutes $= ${a}$ h $${miseEnEvidence(b)}$ min.`
    this.reponse = b
    this.canReponseACompleter = `$\\ldots$ minutes `
  }
}
