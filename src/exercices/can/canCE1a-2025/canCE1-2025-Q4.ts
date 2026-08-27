import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { prenomF } from '../../../lib/outils/Personne'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Résoudre un petit problème'
export const interactifReady = true

export const uuid = '7a795'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Gilles Mora

*/
export default class Can2025CE1Q4 extends ExerciceCan {
  enonce(a?: number, b?: number, c?: number) {
    let quidam = 'Zoé'

    if (a == null || b == null || c == null) {
      quidam = prenomF() as string

      b = randint(2, 5)
      a = randint(6, 9)
      c = randint(2, 5, b)
    }
    this.reponse = a + b - c
    this.question = `${quidam} est sur la case $${a}$ de la piste.<br>
Elle avance de $${b}$ cases et tombe sur « recule de $${c}$ cases ».<br>
${quidam}  doit alors aller sur la case`
    if (!this.interactif) {
      this.question += ' $\\ldots$'
    }
    this.optionsChampTexte = { texteApres: '.' }
    this.correction = `$${a}+${b}-${c}=${a + b - c}$<br>
    ${quidam}  arrive donc sur la case $${miseEnEvidence(a + b - c)}$.`
    this.canEnonce = `${quidam} est sur la case $${a}$ de la piste.<br>
Elle avance de $${b}$ cases et tombe sur «recule de $${c}$ cases».`
    this.canReponseACompleter = `${quidam} doit alors aller sur la case $\\ldots$`
  }

  nouvelleVersion() {
    this.canOfficielle ? this.enonce(7, 5, 2) : this.enonce()
  }
}
