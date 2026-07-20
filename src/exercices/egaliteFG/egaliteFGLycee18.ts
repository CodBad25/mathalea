import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = "La sorcière d'Agnesi : étude d'une fonction rationnelle"
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '8d8d5'
export const refs = {
  'fr-fr': ['TSA2-1-1', 'TSA3-2-1', 'EgaliteFG7-Tle-18'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFGLycee18 extends Exercice {
  constructor() {
    super()
    this.pasDeVersionAleatoire = true
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>Maria Gaetana Agnesi (1718-1799), mathématicienne italienne, a étudié une courbe appelée « sorcière d'Agnesi », lieu géométrique de points construits à partir d'un cercle. Dans un repère orthonormé, en prenant $a=2$, on montre que ce lieu géométrique est la courbe représentative de la fonction $A$ définie sur $\\mathbb{R}$ par $A(x)=\\dfrac{8}{x^2+4}$."
    this.nbQuestions = 6
    this.nbQuestionsModifiable = false
    this.comment =
      "Pour approfondir.<br>« Les filles sont-elles “naturellement” moins douées en maths ? » « Le fait que peu de femmes soient reconnues dans l'histoire des maths veut-il dire qu'elles n'y ont pas contribué ? » Ces questions peuvent nourrir un exposé de Grand Oral sur les mathématiciennes (Ada Lovelace, Hypatie d'Alexandrie, Maryam Mirzakhani...)."
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    const texte0 =
      "En dérivant $A$, montrer que $A'(x)=\\dfrac{-16x}{(x^2+4)^2}$, en déduire les variations de $A$, puis calculer son maximum."
    const correction0 =
      "En écrivant $A(x)=8(x^2+4)^{-1}$, la dérivée d'une composée donne $A'(x)=8\\times(-1)\\times 2x\\times(x^2+4)^{-2}=\\dfrac{-16x}{(x^2+4)^2}$. Comme $(x^2+4)^2>0$ pour tout $x$, le signe de $A'(x)$ est celui de $-16x$ : $A$ est croissante sur $]-\\infty\\,;\\,0]$ et décroissante sur $[0\\,;\\,+\\infty[$."

    let texte1 = 'Quel est le maximum de la fonction $A$, atteint en $x=0$ ?'
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 2 } })
    const correction1 = '$A(0)=\\dfrac{8}{0^2+4}=\\dfrac{8}{4}=2$ : le maximum de $A$ est $2$.'

    const texteQ2 =
      'La courbe $C_A$ possède-t-elle une asymptote horizontale ?'
    this.autoCorrection[2] = {
      enonce: texteQ2,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Oui, la droite $y=0$', statut: true },
        { texte: 'Non', statut: false },
        { texte: 'Oui, la droite $y=2$', statut: false },
      ],
    }
    const monQcm2 = propositionsQcm(this, 2)
    let texte2 = texteQ2
    if (!context.isAmc) texte2 += monQcm2.texte
    const correction2 =
      "Quand $x\\to\\pm\\infty$, $x^2+4\\to +\\infty$ donc $A(x)=\\dfrac{8}{x^2+4}\\to 0$ : la courbe admet la droite d'équation $y=0$ (l'axe des abscisses) comme asymptote horizontale en $+\\infty$ et en $-\\infty$."

    const texteQ3 = "La courbe $C_A$ possède-t-elle une asymptote verticale ?"
    this.autoCorrection[3] = {
      enonce: texteQ3,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Non', statut: true },
        { texte: 'Oui', statut: false },
      ],
    }
    const monQcm3 = propositionsQcm(this, 3)
    let texte3 = texteQ3
    if (!context.isAmc) texte3 += monQcm3.texte
    const correction3 =
      "Non : le dénominateur $x^2+4$ ne s'annule jamais (il vaut toujours au moins $4$), donc $A$ est définie et continue sur $\\mathbb{R}$ tout entier, sans aucune asymptote verticale."

    let texte4 =
      "En étudiant le signe de $A''(x)$, on trouve deux points d'inflexion, d'abscisses opposées. Donner la valeur positive de cette abscisse (arrondie au millième)."
    if (this.interactif) texte4 += ajouteChampTexteMathLive(this, 4) + '<br>'
    handleAnswers(this, 4, { reponse: { value: 1.155 } })
    const correction4 =
      "On calcule $A''(x)=\\dfrac{48x^2-64}{(x^2+4)^3}$, qui s'annule et change de signe pour $x^2=\\dfrac{4}{3}$, soit $x=\\pm\\dfrac{2}{\\sqrt{3}}=\\pm\\dfrac{2\\sqrt{3}}{3}\\approx \\pm 1{,}155$. La fonction $A$ est concave sur $\\left]-\\dfrac{2\\sqrt3}{3}\\,;\\,\\dfrac{2\\sqrt3}{3}\\right[$ et convexe à l'extérieur de cet intervalle."

    let texte5 = "Calculer l'ordonnée de ces points d'inflexion, c'est-à-dire $A\\left(\\dfrac{2}{\\sqrt 3}\\right)$."
    if (this.interactif) texte5 += ajouteChampTexteMathLive(this, 5) + '<br>'
    handleAnswers(this, 5, { reponse: { value: 1.5 } })
    const correction5 =
      "$A\\left(\\dfrac{2}{\\sqrt3}\\right)=\\dfrac{8}{\\frac{4}{3}+4}=\\dfrac{8}{\\frac{16}{3}}=\\dfrac{24}{16}=1{,}5$."

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
