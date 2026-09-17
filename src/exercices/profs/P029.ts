import { addCribleEratosthene } from '../../lib/customElements/CribleEratostheneElement'
import Exercice from '../Exercice'

export const titre = "Illustrer le crible d'Ératosthène"

export const refs = {
  'fr-fr': ['P029'],
  'fr-ch': [],
}
export const uuid = 'a9f82'

/** Support animé pour présenter le crible d'Ératosthène. */
export default class CribleEratosthene extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
    this.pasDeVersionAleatoire = true
  }

  nouvelleVersion() {
    const contenuGenere = addCribleEratosthene(this, 0)
    this.contenu = contenuGenere
    this.listeQuestions[0] = contenuGenere
  }
}
