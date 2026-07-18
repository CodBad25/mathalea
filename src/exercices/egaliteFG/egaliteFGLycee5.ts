import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Maryam Mirzakhani : trajectoires dans un hexagone régulier'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '6ced7'
export const refs = {
  'fr-fr': ['2G11-11', 'EgaliteFG5-2de-5'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFGLycee5 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>Ce problème s'inspire des travaux de la mathématicienne Maryam Mirzakhani (1977-2017), première femme à recevoir la médaille Fields, en 2014, qui a étudié les trajectoires de points sur des surfaces complexes.<br>" +
      'On considère un hexagone régulier inscrit dans un cercle de centre $O$ et de rayon $6$ cm.'
    this.nbQuestions = 5
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 = "Quelle est la mesure de l'angle au centre correspondant à chaque côté de l'hexagone ?"
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0, '', { texteApres: '°' }) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 60 } })
    const correction0 = "L'hexagone régulier a $6$ côtés, donc chaque angle au centre mesure $\\dfrac{360}{6}=60°$."

    let texte1 = "Calculer la longueur d'un côté de l'hexagone."
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1, '', { texteApres: 'cm' }) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 6 } })
    const correction1 =
      "Chaque triangle formé par deux rayons et un côté de l'hexagone est isocèle en $O$ avec un angle au sommet de $60°$ : c'est donc un triangle équilatéral. Le côté de l'hexagone est donc égal au rayon, soit $6$ cm."

    let texte2 = "Déterminer le périmètre de l'hexagone."
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2, '', { texteApres: 'cm' }) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 36 } })
    const correction2 = '$6\\times 6=36$ cm.'

    const texte3 =
      "Un point $P$ part du centre $O$ de l'hexagone et se déplace en ligne droite. Lorsqu'il atteint un côté, il est réfléchi selon la règle « angle d'incidence = angle de réflexion », comme une bille rebondissant sur une paroi. Que se passe-t-il si le point $P$ part en direction d'un sommet de l'hexagone ? Décrivez la trajectoire."
    const correction3 =
      "Si $P$ part exactement en direction d'un sommet, il l'atteint sans jamais toucher un côté : la trajectoire est un simple segment de $O$ jusqu'au sommet, sans rebond (un sommet n'étant pas une paroi, la réflexion n'a lieu que sur un côté)."

    const texte4 =
      "Maryam Mirzakhani a étudié des trajectoires similaires sur des surfaces complexes (avec des trous ou des replis). À votre avis, pourquoi les mathématiciens s'intéressent-ils à la manière dont un point peut se déplacer ainsi sur une surface ?"
    const correction4 =
      "Ces trajectoires (dites « billards ») permettent de modéliser des phénomènes physiques (propagation d'ondes, optique, dynamique de particules) et soulèvent des questions profondes sur le caractère périodique ou chaotique des trajectoires, très étudiées en géométrie et en systèmes dynamiques — c'est précisément ce type de questions qui a valu à Maryam Mirzakhani la médaille Fields."

    this.listeQuestions[0] = texte0
    this.listeCorrections[0] = correction0
    this.listeQuestions[1] = texte1
    this.listeCorrections[1] = correction1
    this.listeQuestions[2] = texte2
    this.listeCorrections[2] = correction2
    this.listeQuestions[3] = texte3
    this.listeCorrections[3] = correction3
    this.listeQuestions[4] = texte4
    this.listeCorrections[4] = correction4

    listeQuestionsToContenu(this)
  }
}
