import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Les nombres premiers de Sophie Germain'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '3b5b0'
export const refs = {
  'fr-fr': ['2N20-9', 'EgaliteFG5-2de-3'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFGLycee3 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>On appelle nombre premier de Germain un nombre premier $p$ tel que $2p+1$ soit aussi un nombre premier. On étudie les nombres premiers $p\\in\\{2,3,5,7,11,13,17,19,23,29\\}$."
    this.nbQuestions = 7
    this.nbQuestionsModifiable = false
    this.comment =
      "Pour approfondir.<br>Réfléchissez aux contextes historiques et sociaux qui ont influencé l'accès des femmes au savoir et aux sciences, à travers l'exemple de Sophie Germain, qui a dû se faire passer pour un homme pour correspondre avec des mathématiciens de son époque."
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 =
      'Parmi les dix nombres premiers $2, 3, 5, 7, 11, 13, 17, 19, 23, 29$, combien sont des nombres premiers de Germain (c\'est-à-dire tels que $2p+1$ soit aussi premier) ?'
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 6 } })
    const correction0 =
      "$2\\to 5$ (premier), $3\\to 7$ (premier), $5\\to 11$ (premier), $7\\to 15=3\\times 5$ (non premier), $11\\to 23$ (premier), $13\\to 27=3^3$ (non premier), $17\\to 35=5\\times 7$ (non premier), $19\\to 39=3\\times 13$ (non premier), $23\\to 47$ (premier), $29\\to 59$ (premier).<br>Il y a donc $6$ nombres premiers de Germain parmi ces dix valeurs : $2,3,5,11,23,29$."

    const texteQ1 = "$p=7$ est un nombre premier de Germain."
    this.autoCorrection[1] = {
      enonce: texteQ1,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Vrai', statut: false },
        { texte: 'Faux', statut: true },
      ],
    }
    const monQcm1 = propositionsQcm(this, 1)
    let texte1 = texteQ1
    if (!context.isAmc) texte1 += monQcm1.texte
    const correction1 = "$2\\times 7+1=15=3\\times 5$ n'est pas premier : $7$ n'est donc pas un nombre de Germain."

    const texteQ2 = "$p=23$ est un nombre premier de Germain."
    this.autoCorrection[2] = {
      enonce: texteQ2,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Vrai', statut: true },
        { texte: 'Faux', statut: false },
      ],
    }
    const monQcm2 = propositionsQcm(this, 2)
    let texte2 = texteQ2
    if (!context.isAmc) texte2 += monQcm2.texte
    const correction2 = "$2\\times 23+1=47$ est premier : $23$ est donc bien un nombre de Germain."

    const texteQ3 = 'Tous les nombres premiers sont-ils des nombres de Germain ?'
    this.autoCorrection[3] = {
      enonce: texteQ3,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Oui', statut: false },
        { texte: 'Non', statut: true },
      ],
    }
    const monQcm3 = propositionsQcm(this, 3)
    let texte3 = texteQ3
    if (!context.isAmc) texte3 += monQcm3.texte
    const correction3 =
      "Non : par exemple $7$, $13$, $17$ et $19$ sont premiers mais ne sont pas des nombres de Germain (voir question précédente pour $7$). On peut conjecturer que les nombres premiers de Germain sont plus rares que les nombres premiers en général."

    const texteQ4 = 'Si $p$ est impair, que peut-on dire de $2p+1$ ?'
    this.autoCorrection[4] = {
      enonce: texteQ4,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Il est pair', statut: false },
        { texte: 'Il est impair', statut: true },
      ],
    }
    const monQcm4 = propositionsQcm(this, 4)
    let texte4 = texteQ4
    if (!context.isAmc) texte4 += monQcm4.texte
    const correction4 =
      "$2p$ est toujours pair, donc $2p+1$ est toujours impair, que $p$ soit pair ou impair. Cela ne suffit pas à garantir que $2p+1$ est premier : c'est une condition nécessaire (un nombre pair strictement supérieur à $2$ ne peut pas être premier) mais pas suffisante, il faut vérifier au cas par cas."

    let texte5 = 'Étudier le cas $p=41$ : calculer $2p+1$.'
    if (this.interactif) texte5 += ajouteChampTexteMathLive(this, 5) + '<br>'
    handleAnswers(this, 5, { reponse: { value: 83 } })
    const correction5 = '$2\\times 41+1=83$.'

    const texteQ6 = '$41$ est-il un nombre de Germain ?'
    this.autoCorrection[6] = {
      enonce: texteQ6,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Oui', statut: true },
        { texte: 'Non', statut: false },
      ],
    }
    const monQcm6 = propositionsQcm(this, 6)
    let texte6 = texteQ6
    if (!context.isAmc) texte6 += monQcm6.texte
    const correction6 = "$83$ est premier (il n'est divisible ni par $2$, ni $3$, ni $5$, ni $7$) : $41$ est donc un nombre de Germain."

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
    this.listeQuestions[6] = texte6
    this.listeCorrections[6] = correction6

    listeQuestionsToContenu(this)
  }
}
