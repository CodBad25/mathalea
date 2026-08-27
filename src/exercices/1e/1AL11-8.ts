import { texteGras } from '../../lib/format/style'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { randint } from '../../modules/outils'
import ExerciceSimple from '../ExerciceSimple'

export const titre = 'Calculer une somme de termes'
export const interactifReady = true

export const dateDePublication = '28/12/2022'

/**
 * Calculer une somme du type S = 3 + 5 + 7 + ... + 29
 * @author Rémi Angot
 */
export const uuid = '8ed19'

export const refs = {
  'fr-fr': ['1AL11-8'],
  'fr-ch': [],
}
export default class SommeSuite extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.spacingCorr = 2
    this.formatChampTexte = KeyboardType.clavierDeBase
    this.optionsChampTexte = { texteAvant: '<br>$S=$' }
  }

  nouvelleVersion() {
    const u0 = randint(2, 10)
    const r = randint(2, 8)
    const n = randint(12, 30)
    this.question = `Calculer $S = ${u0} + ${u0 + r} + ${u0 + 2 * r} + ${u0 + 3 * r} + ... + ${u0 + n * r}$.`
    this.reponse = ((n + 1) * (u0 + u0 + n * r)) / 2
    this.correction = `$S = ${u0} + (${u0} + ${r}) + (${u0} + 2 \\times ${r}) + (${u0} + 3 \\times ${r}) + ... + (${u0} + ${n} \\times ${r})$`
    this.correction += `<br>$S = (\\underbrace{${u0} + ${u0} + ${u0} + ... + ${u0}}_{${n + 1}\\times${u0}}) + ${r} \\times (1 + 2 + 3 + ... + ${n})$`
    this.correction +=
      "<br> Or, on sait d'après le cours que : $1 + 2 + 3 + ... + n = \\dfrac{n(n+1)}{2}$."
    this.correction += `<br>$S = ${n + 1} \\times ${u0} + ${r} \\times \\dfrac{${n} \\times ${n + 1}}{2}$`
    this.correction += `<br>$S = ${texNombre(this.reponse)}$`
    this.correction += `<br><br>${texteGras('Autre méthode')} : on reconnait la somme des $${n + 1}$ premiers termes d'une suite arithmétique de premier terme $${u0}$ et de raison $${r}$.`
    this.correction += "<br>Donc d'après le cours :"
    this.correction += `<br>$S=(\\text{nombre de termes})\\times\\dfrac{\\text{premier terme} + \\text{dernier terme}}{2}=${n + 1}\\times\\dfrac{${u0} + ${u0 + n * r}}{2}=${miseEnEvidence(texNombre(this.reponse))}$.`
  }
}
