import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Ada Lovelace : un programme de calcul'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'e95b3'
export const refs = {
  'fr-fr': ['3L1-3', '3I1-2', 'EgaliteFG4-3e-17'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG17 extends Exercice {
  constructor() {
    super()
    this.pasDeVersionAleatoire = true
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>Ada Lovelace (1815-1852), mathématicienne et comtesse anglaise, est principalement connue pour avoir réalisé le premier véritable programme informatique, lors de son travail sur la machine analytique de Charles Babbage.<br>" +
      "Voici un programme réalisé avec Scratch : on demande un nombre de départ (la « réponse »), puis on calcule $A=\\text{réponse}-7$, $B=3\\times\\text{réponse}+1$, et enfin $C=A\\times B$."
    this.nbQuestions = 6
    this.nbQuestionsModifiable = false
    this.comment =
      "Pour débattre.<br>Pourquoi, selon vous, les filles sont-elles encore sous-représentées dans les métiers de la programmation informatique ?"
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 = 'Combien de variables comporte ce programme ?'
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 3 } })
    const correction0 = 'Ce programme comporte $3$ variables : $A$, $B$ et $C$.'

    let texte1 =
      'Montrer que si l\'on choisit $2$ comme nombre de départ, alors le programme renvoie $-35$. Quelle est la valeur affichée ?'
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1) + '<br>'
    handleAnswers(this, 1, { reponse: { value: -35 } })
    const correction1 =
      "Avec $\\text{réponse}=2$ : $A=2-7=-5$ et $B=3\\times 2+1=7$, donc $C=A\\times B=-5\\times 7=-35$."

    let texte2 = 'Que renvoie le programme si l\'on choisit au départ le nombre $-3$ ?'
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 80 } })
    const correction2 =
      "Avec $\\text{réponse}=-3$ : $A=-3-7=-10$ et $B=3\\times(-3)+1=-8$, donc $C=(-10)\\times(-8)=80$."

    let texte3 =
      'Que renvoie le programme si l\'on choisit au départ le nombre $\\dfrac{19}{3}$ ? (arrondi au centième)'
    if (this.interactif) texte3 += ajouteChampTexteMathLive(this, 3) + '<br>'
    handleAnswers(this, 3, { reponse: { value: -13.33 } })
    const correction3 =
      "Avec $\\text{réponse}=\\dfrac{19}{3}$ : $A=\\dfrac{19}{3}-7=-\\dfrac{2}{3}$ et $B=3\\times\\dfrac{19}{3}+1=20$, donc $C=-\\dfrac{2}{3}\\times 20=-\\dfrac{40}{3}\\approx -13{,}33$ (valeur exacte : $-\\dfrac{40}{3}$)."

    const texteQ4 =
      "En prenant $x$ comme nombre de départ, l'expression littérale correspondant à ce programme est $(x-7)(3x+1)$. Quel est son développement ?"
    this.autoCorrection[4] = {
      enonce: texteQ4,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: '$3x^2-20x-7$', statut: true },
        { texte: '$3x^2+20x-7$', statut: false },
        { texte: '$3x^2-20x+7$', statut: false },
      ],
    }
    const monQcm4 = propositionsQcm(this, 4)
    let texte4 = texteQ4
    if (!context.isAmc) texte4 += monQcm4.texte
    const correction4 =
      "$(x-7)(3x+1)=3x^2+x-21x-7=3x^2-20x-7$."

    const texteQ5 =
      "L'affirmation suivante est-elle correcte ? « Pour tout nombre $x$, $(x-7)(3x+1)$ est égale à $2x(3x-7)-(7+3x^2+6x)$ »."
    this.autoCorrection[5] = {
      enonce: texteQ5,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Vrai', statut: true },
        { texte: 'Faux', statut: false },
      ],
    }
    const monQcm5 = propositionsQcm(this, 5)
    let texte5 = texteQ5
    if (!context.isAmc) texte5 += monQcm5.texte
    const correction5 =
      "$2x(3x-7)-(7+3x^2+6x)=6x^2-14x-7-3x^2-6x=3x^2-20x-7$, qui est bien égal au développement de $(x-7)(3x+1)$ trouvé à la question précédente. L'affirmation est donc vraie."

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
