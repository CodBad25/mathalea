import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexte } from '../../lib/interactif/questionMathLive' // fonctions de mise en place des éléments interactifs
import { combinaisonListes } from '../../lib/outils/arrayOutils'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { texteEnCouleurEtGras } from '../../lib/outils/embellissements'
export const interactifReady = true
export const interactifType = 'mathLive'

export const titre = "Trouver le nom d'un solide par ses caractéristiques"
export const uuid = '95371'
export const dateDePublication = '09/06/2026' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag
export const refs = {
  'fr-fr': ['6G8A-2'],
  'fr-ch': [],
}
/**
 *
 * @author Mireille Gain
 */
export default class nomSolides extends Exercice {
  constructor() {
    super()
    this.consigne = ''
    this.nbQuestions = 5 // Nombre de questions par défaut
  }

  nouvelleVersion() {
    if (this.nbQuestions === 1) {
      this.consigne = this.interactif
        ? "Parmi les solides étudiés au collège, donner le nom de celui qui est présenté ci-dessous, sans le faire précéder d'un déterminant."
        : 'Parmi les solides étudiés au collège, donner le nom de celui qui est présenté ci-dessous.'
    } else {
      this.consigne = this.interactif
        ? "Parmi les solides étudiés au collège, donner le nom de chacun de ceux qui sont présentés ci-dessous, sans les faire précéder d'un déterminant."
        : 'Parmi les solides étudiés au collège, donner le nom de chacun de ceux qui sont présentés ci-dessous.'
    }
    this.spacing = 1.5
    this.spacingCorr = 1.5
    const typeQuestionsDisponibles = [
      'cube',
      'pave',
      'prisme',
      'cylindre',
      'pyramide',
      'cone',
      'boule',
    ] // On crée les 7 types de questions

    const listeTypeQuestions = combinaisonListes(
      typeQuestionsDisponibles,
      this.nbQuestions,
    ) // Tous les types de questions sont posés mais l'ordre diffère à chaque "cycle"
    for (
      let i = 0, texte, rep, texteCorr, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      // Boucle principale où i+1 correspond au numéro de la question
      switch (
        listeTypeQuestions[i] // Suivant le type de question, le contenu sera différent
      ) {
        case 'cube':
          texte =
            'Je suis un pavé droit dont toutes les arêtes sont de même longueur.' // Le LateX entre deux symboles $, les variables dans des ${ }
          rep = 'cube'
          texteCorr = `Un pavé droit dont toutes les arêtes sont de même longueur est un ${texteEnCouleurEtGras('cube')}.`
          break
        case 'pave':
          texte =
            "Je possède le même nombre de faces, de sommets et d'arêtes que le cube, mais je ne suis pas toujours un cube."
          rep = ['pavé droit', 'pave droit', 'pave']
          texteCorr = `Le solide qui possède le même nombre de faces, de sommets et d'arêtes que le cube, sans pour autant être toujours un cube, c'est un ${texteEnCouleurEtGras('pavé droit')}.`
          break
        case 'prisme':
          texte =
            'Je possède deux faces identiques parallèles, et toutes mes autres faces sont des rectangles, mais je ne suis pas un pavé droit.'
          rep = ['prisme droit', 'prisme']
          texteCorr = `Le solide qui possède deux faces identiques parallèles et dont toutes les autres faces sont des rectangles (sans pour autant être un pavé droit) est un ${texteEnCouleurEtGras('prisme droit')}.`
          break
        case 'cylindre':
          texte =
            'Je possède deux faces identiques circulaires parallèles et une face courbe.'
          rep = 'cylindre'
          texteCorr = `Le solide qui possède deux faces identiques circulaires parallèles et une face courbe est un ${texteEnCouleurEtGras('cylindre')}.`
          break
        case 'pyramide':
          texte = "J'ai une face de plus que le nombre de côtés de ma base."
          rep = 'pyramide'
          texteCorr = `Le solide qui a une face de plus que le nombre de côtés de sa base est une ${texteEnCouleurEtGras('pyramide')}.`
          break
        case 'cone':
          texte = "J'ai un seul sommet."
          rep = ['cone', 'cône']
          texteCorr = `Le solide qui a un seul sommet est un ${texteEnCouleurEtGras('cône')}.`
          break
        default: //boule
          texte = "Je n'ai ni sommet, ni arête, ni face."
          rep = ['boule', 'sphère', 'sphere']
          texteCorr = `Le solide qui n'a ni sommet, ni arête, ni face est une ${texteEnCouleurEtGras('boule')}.`
          break
      }
      if (this.interactif) {
        texte += ajouteChampTexte(this, i, KeyboardType.alphanumeric)
        handleAnswers(this, i, {
          reponse: { value: rep, options: { texteSansCasse: true } },
        })
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      } else {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this) // On envoie l'exercice à la fonction de mise en page
  }
}
