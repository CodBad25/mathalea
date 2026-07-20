import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Maryam Mirzakhani : médailles Fields, prix Nobel et arithmétique'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'e1276'
export const refs = {
  'fr-fr': ['3A10-9', 'EgaliteFG4-3e-18'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles (source : Wikipedia)
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG18 extends Exercice {
  constructor() {
    super()
    this.pasDeVersionAleatoire = true
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>Maryam Mirzakhani (1977-2017), mathématicienne iranienne, est la première femme à avoir reçu la médaille Fields, en 2014.<br>" +
      'De 1901 à 2024, $65$ femmes et $915$ hommes ont reçu un prix Nobel. De 1936 à 2024, $2$ femmes et $62$ hommes ont reçu la médaille Fields.<br>' +
      'On note $A$ le pourcentage de femmes parmi les médailles Fields et $B$ le pourcentage de femmes parmi les prix Nobel (arrondis au centième).'
    this.nbQuestions = 6
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 = 'Calculer $A$, le pourcentage de femmes parmi les médailles Fields.'
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 3.13 } })
    const correction0 = '$A=\\dfrac{2}{2+62}=\\dfrac{2}{64}\\approx 3{,}13\\,\\%$.'

    let texte1 = 'Calculer $B$, le pourcentage de femmes parmi les prix Nobel.'
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 6.63 } })
    const correction1 = '$B=\\dfrac{65}{65+915}=\\dfrac{65}{980}\\approx 6{,}63\\,\\%$.'

    const texteQ2 = 'Comparer $A$ et $B$. Que peut-on en déduire ?'
    this.autoCorrection[2] = {
      enonce: texteQ2,
      options: { ordered: true, radio: true },
      propositions: [
        {
          texte: '$A<B$ : les femmes sont encore moins représentées en mathématiques (médaille Fields) que parmi l\'ensemble des prix Nobel.',
          statut: true,
        },
        {
          texte: '$A>B$ : les femmes sont mieux représentées en mathématiques que parmi l\'ensemble des prix Nobel.',
          statut: false,
        },
      ],
    }
    const monQcm2 = propositionsQcm(this, 2)
    let texte2 = texteQ2
    if (!context.isAmc) texte2 += monQcm2.texte
    const correction2 =
      '$A\\approx 3{,}13\\,\\% < B\\approx 6{,}63\\,\\%$ : la sous-représentation des femmes est donc encore plus marquée pour la médaille Fields que pour l\'ensemble des prix Nobel.'

    const texteQ3 = 'Quelle est la décomposition en produit de facteurs premiers de $630$ ?'
    this.autoCorrection[3] = {
      enonce: texteQ3,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: '$2\\times 3^2\\times 5\\times 7$', statut: true },
        { texte: '$2\\times 3\\times 5\\times 7^2$', statut: false },
        { texte: '$2^2\\times 3^2\\times 5\\times 7$', statut: false },
      ],
    }
    const monQcm3 = propositionsQcm(this, 3)
    let texte3 = texteQ3
    if (!context.isAmc) texte3 += monQcm3.texte
    const correction3 = '$630=2\\times 3^2\\times 5\\times 7$.'

    const texteQ4 = 'Quelle est la décomposition en produit de facteurs premiers de $456$ ?'
    this.autoCorrection[4] = {
      enonce: texteQ4,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: '$2^3\\times 3\\times 19$', statut: true },
        { texte: '$2^2\\times 3\\times 38$', statut: false },
        { texte: '$2\\times 3\\times 76$', statut: false },
      ],
    }
    const monQcm4 = propositionsQcm(this, 4)
    let texte4 = texteQ4
    if (!context.isAmc) texte4 += monQcm4.texte
    const correction4 = '$456=2^3\\times 3\\times 19$.'

    const texteQ5 =
      'Le collège a acheté $630$ chocolats et $456$ caramels, pour constituer des lots identiques utilisant tous les bonbons. Les professeurs ont-ils pu constituer $18$ lots ?'
    this.autoCorrection[5] = {
      enonce: texteQ5,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Oui', statut: false },
        { texte: 'Non', statut: true },
      ],
    }
    const monQcm5 = propositionsQcm(this, 5)
    let texte5 = texteQ5
    if (!context.isAmc) texte5 += monQcm5.texte
    const correction5 =
      "Le nombre de lots doit diviser à la fois $630$ et $456$, donc diviser leur PGCD. D'après les décompositions précédentes, les seuls facteurs premiers communs à $630=2\\times 3^2\\times 5\\times 7$ et $456=2^3\\times 3\\times 19$ sont $2$ et $3$, donc $\\text{PGCD}(630\\,;\\,456)=2\\times 3=6$. Comme $18$ ne divise pas $6$ (et ne divise d'ailleurs pas $456$ : $456\\div 18\\approx 25{,}3$), on ne peut pas constituer $18$ lots.<br>Le nombre maximum de lots que l'on peut constituer est donc $6$, avec $630\\div 6=105$ chocolats et $456\\div 6=76$ caramels par lot."

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
    this.listeQuestions[5] = texte5
    this.listeCorrections[5] = correction5

    listeQuestionsToContenu(this)
  }
}
