import { texteItalique } from '../../lib/outils/embellissements'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'La place des femmes parmi les enseignants'
export const dateDePublication = '15/07/2026'
export const uuid = 'e5d3e'
export const refs = {
  'fr-fr': ['5P1A-3', 'EgaliteFG2-5e-6'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG6 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>L'égalité entre les femmes et les hommes est un principe fondamental de notre société. Pourtant, ce droit n'a pas toujours été inscrit dans la loi. Ce n'est qu'en $1946$, après la Seconde Guerre mondiale, que l'égalité entre les sexes a été affirmée pour la première fois dans la Constitution française, à travers le préambule de la Constitution de la IV<sup>e</sup> République. Cette reconnaissance a été réaffirmée dans la Constitution actuelle de $1958$, qui sert encore de base à notre République."
    this.nbQuestions = 5
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    this.listeQuestions[0] =
      "Partie 1 - À égalité dans notre formation ?<br>Commence par compter parmi tes enseignants le nombre de femmes et le nombre d'hommes, puis calcule le nombre total d'enseignants. Calcule la part de femmes et la part d'hommes sous forme de fractions irréductibles, puis exprime ces fractions en pourcentage (arrondi à l'unité). Complète un tableau avec ces trois informations (nombre, fraction irréductible, pourcentage) pour les femmes, les hommes et le total."
    this.listeCorrections[0] =
      "Réponse personnelle, qui dépend de la composition réelle de ta classe.<br>Méthode : si $f$ est le nombre d'enseignantes et $h$ le nombre d'enseignants, le total est $f+h$ ; la part des femmes est la fraction $\\dfrac{f}{f+h}$ (à simplifier), soit en pourcentage $\\dfrac{f}{f+h}\\times 100$, arrondi à l'unité (et de même pour les hommes)."

    this.listeQuestions[1] =
      "Partie 2 - D'après le graphique « Proportion de femmes parmi les enseignants selon le niveau d'enseignement en France », donne une estimation du pourcentage de femmes pour chaque niveau : école maternelle, école élémentaire, collège, lycée général et technologique, lycée professionnel."
    this.listeCorrections[1] =
      "Estimations à partir du graphique (les valeurs peuvent varier légèrement selon la lecture) : école maternelle $\\approx 97\\,\\%$, école élémentaire $\\approx 83\\,\\%$, collège $\\approx 58\\,\\%$, lycée général et technologique $\\approx 54\\,\\%$, lycée professionnel $\\approx 45\\,\\%$."

    this.listeQuestions[2] =
      'Le pourcentage que tu obtiens pour ta classe est-il conforme au pourcentage lu sur le graphique pour le collège ? Si non, comment peux-tu l\'expliquer ?'
    this.listeCorrections[2] =
      "Réponse personnelle. Un écart peut s'expliquer par le faible effectif d'une seule classe (l'échantillon des enseignants d'une classe est petit et peu représentatif), contrairement à la statistique nationale qui porte sur l'ensemble des enseignants de collège."

    this.listeQuestions[3] =
      'Selon le graphique, quel niveau est le plus paritaire (le plus égalitaire) en termes de nombre d\'enseignantes et d\'enseignants ? Justifie ta réponse.'
    this.listeCorrections[3] =
      "C'est le lycée professionnel qui semble le plus paritaire : la proportion de femmes y est la plus proche de $50\\,\\%$."

    this.listeQuestions[4] =
      'Entre quelles catégories consécutives l\'écart est-il le plus élevé ? Pourquoi, à ton avis ?'
    this.listeCorrections[4] =
      "L'écart le plus important se situe entre l'école élémentaire (très féminisée) et le collège, où la proportion de femmes chute nettement. Une explication possible : au collège, l'enseignement devient disciplinaire (mathématiques, sciences...), des matières encore perçues comme davantage masculines, ce qui peut influencer les choix d'orientation vers le métier d'enseignant."

    listeQuestionsToContenu(this)
  }
}
