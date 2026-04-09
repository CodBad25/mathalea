import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Trouver le nombre d’entiers entre deux valeurs'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora
 * Créé pendant l'été 2021

 * Date de publication
*/
export const uuid = '1f399'

export const refs = {
  'fr-fr': ['can2C01'],
  'fr-ch': ['NR'],
}
export default class NombreDeNombresEntiersEntreDeuxValeurs2 extends ExerciceSimple {
  constructor() {
    super()

    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    let a, b
    switch (choice(['a', 'b', 'c'])) {
      case 'a':
        a = randint(3, 5)
        b = randint(8, 18)
        this.question = `Combien y a-t-il d'entiers $n$ tels que : <br>$${a}\\leqslant n \\leqslant ${b}$ ?`
        this.correction = `Il y en a $${b}-${a}+1$, soit $${miseEnEvidence(b - a + 1)}$.`
        this.reponse = b - a + 1
        break

      case 'b':
        a = randint(3, 5)
        b = randint(8, 18)
        this.question = `Combien y a-t-il d'entiers $n$ tels que :<br> $${a}< n \\leqslant ${b}$ ?`
        this.correction = `Il y en a $${b}-${a}$, soit $${miseEnEvidence(b - a)}$.`
        this.reponse = b - a
        break
      case 'c':
        a = randint(3, 5)
        b = randint(8, 18)
        this.question = `Combien y a-t-il d'entiers $n$ tels que : <br>$${a}\\leqslant n < ${b}$ ?`
        this.correction = `Il y en a $${b}-${a}$, soit $${miseEnEvidence(b - a)}$.`
        this.reponse = b - a
        break
    }
  }
}
