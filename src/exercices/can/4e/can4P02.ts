import { choice } from '../../../lib/outils/arrayOutils'
import {
  miseEnEvidence,
  texteEnCouleur,
} from '../../../lib/outils/embellissements'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Résoudre un problème de vitesse'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-Claude Lhote
 * Créé pendant l'été 2021

 */
export const uuid = '7374f'

export const refs = {
  'fr-fr': ['can4P02'],
  'fr-ch': [],
}
export default class ProblemesDeVitesse extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'

    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const a = choice([2, 3, 5, 6, 10]) // diviseur de l'heure
    const b = 60 / a // nombre de minutes de l'énoncé
    const c = choice([30, 60, 90, 120])
    this.reponse = c / a
    this.question = `Une voiture roule à $${c}\\text{ km/h}$. <br>
    
    Combien de kilomètres parcourt-elle en $${b}$ minutes ?`
    this.correction = `La voiture parcourt $${miseEnEvidence(c / a)}\\text{ km}$.`
    this.correction += texteEnCouleur(
      `<br> Mentalement : <br>
    On cherche combien de "$${b}$ minutes" il y a dans $1$ heure soit $60$ minutes. Il y en a $${a}$,
    car $${a}\\times ${b}=60$.<br>
    Cela signifie qu'en $${b}$ minutes, elle parcourt $${a}$ fois moins de $\\text{km}$ qu'en $1$ heure, soit $\\dfrac{${c}}{${a}}=
    ${c / a}\\text{ km}$.`,
      'blue',
    )
  }
}
