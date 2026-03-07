import Decimal from 'decimal.js'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { stringNombre, texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'

export const titre = ''
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'hug50'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Gilles Mora

*/
export default class Can32026Q29 extends ExerciceCan {
  constructor() {
    super()
    this.optionsDeComparaison = { ecritureScientifique: true }
    this.formatChampTexte = KeyboardType.clavierFullOperations
    this.optionsChampTexte = { texteAvant: '<br>' }
  }

  enonce(nombre?: number) {
    if (nombre == null) {
      // Version aléatoire : nombre entre 10 000 et 999 999
      // Génération : a,bc × 10^n avec 1 ≤ a,bc < 10
      const a = new Decimal(randint(101, 999, 200)).div(100)
      const puiss = randint(2, 6)
      nombre = new Decimal(10).pow(puiss).mul(a).toNumber()
    }
    // Calculer la puissance
    let puissance: number
    let coefficient: Decimal

    if (nombre >= 1) {
      // Compter les chiffres avant la virgule
      const partieEntiere = Math.floor(nombre).toString()
      puissance = partieEntiere.length - 1
      coefficient = new Decimal(nombre).div(new Decimal(10).pow(puissance))
    } else {
      // Pour les nombres < 1 (pas dans cet exercice mais au cas où)
      puissance = 0
      coefficient = new Decimal(nombre)
    }

    this.question = `Écriture scientifique de $${texNombre(nombre)}$`

    this.correction = `La notation scientifique est de la forme $a\\times 10^{n}$ avec $1\\leqslant a <10$ et $n$ un entier relatif.<br>
Ici : $${texNombre(nombre)}=\\underbrace{${miseEnEvidence(texNombre(coefficient))}}_{1\\leqslant ${texNombre(coefficient)} <10}${miseEnEvidence('\\times')} ${miseEnEvidence(`10^{${puissance}}`)}$.`

    this.reponse = `${stringNombre(coefficient)}\\times 10^{${puissance}}`

    this.canEnonce = this.question
    this.canReponseACompleter = ''

    if (!this.interactif) {
      this.question += '<br>$\\ldots$'
    }
  }

  nouvelleVersion() {
    this.canOfficielle ? this.enonce(62500) : this.enonce()
  }
}
