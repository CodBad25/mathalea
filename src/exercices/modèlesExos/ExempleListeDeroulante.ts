import { shapeDefToShapeSvg } from '../../lib/2d/figures2d/shapes2d'
import { choixDeroulant } from '../../lib/customElements/ListeDeroulanteElement'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = "Reconnaitre une fonction d'après sa courbe"
export const interactifReady = true
export const interactifType = 'liste-deroulante'

export const dateDePublication = '22/06/2023' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag
export const uuid = 'addd5' // @todo à changer dans un nouvel exo (utiliser pnpm getNewUuid)

export const refs = {
  'fr-fr': ['betaListeDeroulante'],
  'fr-ch': [],
}
const choix = [
  { label: 'Choisir un élément', value: '' },
  { label: '<strong>Un texte en gras</strong>', value: 'unTexte' },
  { label: '<strike>Un label barré</strike>', value: 'unLabel' },
  { latex: '\\dfrac{1+\\sqrt{5}}{2}', value: 'phi' },
  { image: 'images/balancoire_trebuchet.png', value: 'balançoire' },
  { svg: '<circle cx="0" cy="0" r="10"/>', value: 'cercle' },
  { svg: shapeDefToShapeSvg('soleil'), value: 'soleil' },
]

/**
 * Affiche une courbe et demande de choisir sa définition dans une liste
 * @author Jean-claude Lhote

 */
export default class BetaListeDeroulante extends Exercice {
  constructor() {
    super()

    this.nbQuestions = 1 // Nombre de questions par défaut
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    // Voilà ce qu'il faut pour mettre une liste déroulante interactive.
    // Attention, il n'y a pas de version latex ou html non intéractive.
    // Il faudra prévoir une autre version pour ça.
    const enonce = `Choisir l'expression mathématique<br>${choixDeroulant(this, 0, { choices: choix, choix0: false })}`

    const texteCorrection =
      "Vous avez choisi : <span id='choixEffectué'></span>." // Je mets un span vide ici pour y déposer le choix de l'utilisateur après correction.
    handleAnswers(
      this,
      0,
      { reponse: { value: 'phi' } },
      { formatInteractif: 'liste-deroulante' },
    )

    this.listeQuestions.push(enonce)
    this.listeCorrections.push(texteCorrection)
    listeQuestionsToContenu(this)

    // ça c'est pour mettre à jour la correction pour affiché ce que l'utilisateur a choisi.
    // C'est une fioriture pour cet exemple, mais ça n'a aucune utilité dans un exercice réel.
    document.addEventListener('correctionsAffichees', () => {
      const laListeDeroulante = document.getElementById(
        'ex0Q0',
      ) as HTMLSelectElement | null
      const leSpan = document.getElementById('choixEffectué')
      if (leSpan && laListeDeroulante) {
        leSpan.textContent = laListeDeroulante.value ?? 'Aucun choix effectué'
      }
    })
  }
}
