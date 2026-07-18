import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Katherine Johnson et la hauteur de la fusée (théorème de Thalès)'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '3e8ec'
export const refs = {
  'fr-fr': ['4G30-2', 'EgaliteFG3-4e-10', 'EgaliteFG4-3e-10'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription et programmation par Lydie El-Halougi
 */
export default class EgaliteFG10 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>En 1961, Katherine Johnson a joué un rôle crucial dans le calcul de la trajectoire du vol spatial de la mission Mercury-Redstone 3. Avant cet exploit, elle avait tenté de mesurer la hauteur d'une fusée en se basant sur sa propre taille.<br>" +
      'Katherine Johnson mesure $1{,}64\\text{ m}$. Elle se place à l\'extrémité de l\'ombre de la fusée, de sorte que l\'extrémité de son ombre et celle de la fusée coïncident. Cela se produit lorsque la fusée est à $50\\text{ m}$ devant elle, avec $2{,}50\\text{ m}$ d\'ombre derrière elle.'
    this.nbQuestions = 2
    this.nbQuestionsModifiable = false
    this.comment =
      "Pour débattre.<br>Pourquoi les femmes sont-elles moins nombreuses que les hommes dans des domaines comme l'astronautique et les sciences spatiales ? Cela est-il dû à des préjugés sociaux, à un manque de modèles féminins, ou à des barrières dans l'éducation ?"
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 =
      "En utilisant la méthode de Katherine Johnson (triangles semblables formés par les ombres), quelle est la hauteur de la fusée, en mètres (arrondie au centième) ?"
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0, '', { texteApres: 'm' }) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 34.44 } })
    const correction0 =
      "Le point où coïncident les deux ombres est à $2{,}5\\text{ m}$ de Katherine et à $50+2{,}5=52{,}5\\text{ m}$ du pied de la fusée. Les deux triangles formés (Katherine/son ombre et la fusée/son ombre) sont semblables (configuration de Thalès), donc :<br>$\\dfrac{\\text{hauteur fusée}}{52{,}5}=\\dfrac{1{,}64}{2{,}5}$, soit hauteur fusée $=\\dfrac{1{,}64\\times 52{,}5}{2{,}5}=34{,}44\\text{ m}$."

    const texte1 =
      "Sachant que la fusée mesure en réalité $43$ mètres, calculer la longueur $FT$ (la Tyrolienne de secours), en utilisant à nouveau une configuration de Thalès dans le schéma."
    const correction1 =
      "En reprenant les triangles semblables $FF_1T_1$ et $FKP T$ (ou la configuration analogue du schéma) avec la hauteur réelle de la fusée ($43\\text{ m}$) et les distances lues sur le schéma, on applique la même méthode que ci-dessus (produit en croix dans une configuration de Thalès) pour obtenir $FT$."

    this.listeQuestions[0] = texte0
    this.listeCorrections[0] = correction0
    this.listeQuestions[1] = texte1
    this.listeCorrections[1] = correction1

    listeQuestionsToContenu(this)
  }
}
