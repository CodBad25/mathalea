import Decimal from 'decimal.js'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'
import { choice } from '../../../lib/outils/arrayOutils'
import { texNombre } from '../../../lib/outils/texNombre'
export const titre = 'Déterminer un encadrement avec la fonction carré'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '23b3e'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/export default class Can2026TermQ9 extends ExerciceCan {
  constructor() {
    super()
   this.optionsDeComparaison = {  nombreDecimalSeulement: true }
     this.formatChampTexte = KeyboardType.clavierDeBase
  }

  enonce(nombre?: Decimal, puissance?: number): void {
    if (nombre == null || puissance == null) {
      const nbChiffresAvant = choice([1, 2])
      const nbChiffresApres = choice([1, 2])
      let partieEntiere: number
      let partieDecimale: number
      if (nbChiffresAvant === 1) {
        partieEntiere = randint(1, 9)
      } else {
        partieEntiere = randint(10, 99)
      }
      if (nbChiffresApres === 1) {
        partieDecimale = randint(1, 9)
        nombre = new Decimal(partieEntiere).add(new Decimal(partieDecimale).div(10))
      } else {
        partieDecimale = randint(1, 99)
        nombre = new Decimal(partieEntiere).add(new Decimal(partieDecimale).div(100))
      }
      puissance = choice([-2, -3, -4])
    }

    const resultat = nombre.mul(new Decimal(10).pow(puissance))
 this.optionsChampTexte = { texteAvant: " <br>" }
   
    this.reponse = texNombre(resultat, 10)
    this.question = `Écriture décimale de $${texNombre(nombre, 2)}\\times 10^{${puissance}}$.`
    
    this.correction = `$${texNombre(nombre, 2)}\\times 10^{${puissance}}=${texNombre(nombre, 2)}\\times ${texNombre(10**puissance, 4)}=${miseEnEvidence(texNombre(resultat, 10))}$<br>
    `
    this.canEnonce = `Écriture décimale de $${texNombre(nombre, 2)}\\times 10^{${puissance}}$.`
    this.canReponseACompleter = '$\\ldots$'
  }

  nouvelleVersion(): void {
    this.canOfficielle ? this.enonce(new Decimal(20.26), -3) : this.enonce()
  }
}
