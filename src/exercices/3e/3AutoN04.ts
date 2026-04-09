import { choice } from '../../lib/outils/arrayOutils'
import { nombreEnLettres } from '../../modules/nombreEnLettres'
import { randint } from '../../modules/outils'
import ExerciceSimple from '../ExerciceSimple'

export const titre =
  "Prendre un tiers, un quart ou un cinquième d'un nombre donné"

export const interactifReady = true
export const interactifType = 'mathLive'

export const dateDePublication = '05/12/2025'

export const uuid = '4a987'

export const refs = {
  'fr-fr': ['3AutoN04'],
  'fr-ch': [],
}
/**
 * @author Jean-claude Lhote
 */
export default class TiersQuartsEtCinquiemes extends ExerciceSimple {
  constructor() {
    super()
    this.besoinFormulaireCaseACocher = [
      'Sujet original (2e paramètre inutile si coché)',
      false,
    ]
    this.besoinFormulaire2CaseACocher = ['Numérateur différent de 1', true]
    this.sup = false
    this.sup2 = true
    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const denominateur = this.sup ? 3 : choice([3, 4, 5])
    const numerateur = !this.sup2 || this.sup ? 1 : randint(2, denominateur - 1)
    const nomFraction =
      denominateur === 3 ? 'tiers' : denominateur === 4 ? 'quart' : 'cinquième'
    const nombreADiviser = this.sup ? 18 : denominateur * randint(2, 9)
    this.reponse = ((numerateur * nombreADiviser) / denominateur).toString()

    this.question =
      numerateur === 1
        ? `Quel est le ${nomFraction} de $${nombreADiviser}$ ?`
        : `Combien valent les ${nombreEnLettres(numerateur)} ${nomFraction}${denominateur === 3 ? '' : 's'} de $${nombreADiviser}$ ?`
    this.correction =
      numerateur === 1
        ? `Le ${nomFraction} de $${nombreADiviser}$ est égal à $${nombreADiviser} \\div ${denominateur} = ${this.reponse}$.`
        : `Un ${nomFraction} de $${nombreADiviser}$ est égal à $${nombreADiviser} \\div ${denominateur}$, soit ${nombreADiviser / denominateur}.<br>
        Donc les ${nombreEnLettres(numerateur)} ${nomFraction}s de $${nombreADiviser}$ valent $${numerateur} \\times ${nombreADiviser / denominateur} = ${this.reponse}$.`
  }
}
