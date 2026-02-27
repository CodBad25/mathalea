import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'
import { choice } from '../../../lib/outils/arrayOutils'
import FractionEtendue from '../../../modules/FractionEtendue'
import { rienSi1 } from '../../../lib/outils/ecritures'
export const titre = 'Résoudre une équation produit-nul'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'psts5'
export const refs = {
  'fr-fr': [],
  'fr-ch': ['NR'],
}
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/
export default class Can2a2026Q28 extends ExerciceCan {
  enonce(a?: number, signe?: string): void {
    if (a == null || signe == null) {
      a = randint(2, 5)
      signe = choice(['+', '-'])
    }

    this.formatChampTexte = KeyboardType.clavierDeBaseAvecFraction
    this.optionsChampTexte = { texteAvant: ' $S=\\{$', texteApres: '$\\}$' }
    
    // ax² ± x = 0
    // x(ax ± 1) = 0
    // Solutions : x = 0 ou ax ± 1 = 0
    const sol2 = signe === '+' ? new FractionEtendue(1,a).multiplieEntier(-1) : new FractionEtendue(1,a)
    
    this.reponse =  [`0;${sol2.texFSD}`, `${sol2.texFSD};0`, `0;${sol2.valeurDecimale}`, `${sol2.valeurDecimale};0`]

    
    const equationTexte = signe === '+' ? `${rienSi1(a)}x^2+x=0` : `${rienSi1(a)}x^2-x=0`
    const factorisationTexte = signe === '+' ? `x(${rienSi1(a)}x+1)=0` : `x(${rienSi1(a)}x-1)=0`
    const equation2Texte = signe === '+' ? `${rienSi1(a)}x+1=0` : `${rienSi1(a)}x-1=0`
    const valeurSol2 = signe === '+' ? `-1` : `1`
    
    this.question = `Résoudre dans $\\mathbb{R}$ l'équation : $${rienSi1(a)}x^2 ${signe} x=0$.`
    
    this.correction = `$${equationTexte}$<br>
    En factorisant, on obtient une équation produit-nul  : $${factorisationTexte}$<br>
    Un produit de facteurs est nul si et seulement si l'un au moins de ses facteurs est nul.<br>
    Donc : $x=0$ ou $${equation2Texte}$.<br>

    Ainsi : $x=0$ ou $x=\\dfrac{${valeurSol2}}{${a}}$.<br>
    $S=\\left\\{${miseEnEvidence(`0\\,;\\,\\dfrac{${valeurSol2}}{${a}}`)}\\right\\}$`
    
    this.canEnonce = `Résoudre dans $\\mathbb{R}$ l'équation : $${equationTexte}$`
    this.canReponseACompleter = '$S=\\ldots$'
    
    if (this.interactif) {
      this.question += '<br>'
    }
  }

  nouvelleVersion(): void {
    this.canOfficielle ? this.enonce(1, '+') : this.enonce()
  }
}