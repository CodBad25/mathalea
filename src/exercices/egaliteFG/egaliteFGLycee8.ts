import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Choix de spécialités en médecine : un plan d\'inclusivité'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '6e064'
export const refs = {
  'fr-fr': ['1AL11-9', 'EgaliteFG6-1e-8'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFGLycee8 extends Exercice {
  constructor() {
    super()
    this.pasDeVersionAleatoire = true
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>Dans une université de médecine, les choix de spécialités restent très genrés. En 2025, les femmes représentent $67\\,\\%$ des $500$ étudiants en médecine, $30\\,\\%$ des femmes choisissent une spécialité chirurgicale, et $30\\,\\%$ des hommes choisissent la pédiatrie.<br>" +
      "Un plan d'inclusivité est mis en place : chaque année, le pourcentage de femmes en chirurgie augmente de $4$ points, et le pourcentage d'hommes en pédiatrie augmente de $10\\,\\%$ par rapport à l'année précédente.<br>" +
      "On note $f_n$ le pourcentage de femmes en chirurgie l'année $2025+n$, et $h_n$ le pourcentage d'hommes en pédiatrie l'année $2025+n$. On a donc $f_0=30$ et $h_0=30$."
    this.nbQuestions = 10
    this.nbQuestionsModifiable = false
    this.comment =
      "Pour débattre.<br>Pourquoi est-il plus difficile de motiver les hommes à choisir la pédiatrie ? Quelle politique (augmentation en points ou en pourcentage) semble la plus efficace ?"
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 = 'Quel est le pourcentage de femmes en chirurgie en 2026, soit $f_1$ ?'
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 34 } })
    const correction0 = "Le pourcentage augmente de $4$ points par an : $f_1=30+4=34$."

    const texteQ1 = 'Quelle est la nature de la suite $(f_n)$ ?'
    this.autoCorrection[1] = {
      enonce: texteQ1,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Arithmétique de raison $4$', statut: true },
        { texte: 'Géométrique de raison $4$', statut: false },
        { texte: "Ni arithmétique, ni géométrique", statut: false },
      ],
    }
    const monQcm1 = propositionsQcm(this, 1)
    let texte1 = texteQ1
    if (!context.isAmc) texte1 += monQcm1.texte
    const correction1 =
      "$f_{n+1}=f_n+4$ : $(f_n)$ est arithmétique de raison $4$ et de premier terme $f_0=30$, donc $f_n=30+4n$."

    let texte2 =
      "À partir de quelle année (donner $n$ tel que l'année soit $2025+n$) atteindra-t-on $50\\,\\%$ de femmes en chirurgie ?"
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 5 } })
    const correction2 =
      "$30+4n=50 \\iff 4n=20 \\iff n=5$ : on atteint $50\\,\\%$ en $2025+5=2030$."

    let texte3 = "Quel est le pourcentage d'hommes en pédiatrie en 2026, soit $h_1$ ?"
    if (this.interactif) texte3 += ajouteChampTexteMathLive(this, 3, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 3, { reponse: { value: 33 } })
    const correction3 = '$h_1=30\\times 1{,}1=33$.'

    const texteQ4 = 'Quelle est la nature de la suite $(h_n)$ ?'
    this.autoCorrection[4] = {
      enonce: texteQ4,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Arithmétique de raison $1{,}1$', statut: false },
        { texte: 'Géométrique de raison $1{,}1$', statut: true },
        { texte: "Ni arithmétique, ni géométrique", statut: false },
      ],
    }
    const monQcm4 = propositionsQcm(this, 4)
    let texte4 = texteQ4
    if (!context.isAmc) texte4 += monQcm4.texte
    const correction4 =
      "$h_{n+1}=1{,}1\\times h_n$ : $(h_n)$ est géométrique de raison $1{,}1$ et de premier terme $h_0=30$, donc $h_n=30\\times 1{,}1^n$."

    let texte5 =
      "Quel est le pourcentage d'hommes en pédiatrie en 2030, soit $h_5$ (arrondi au dixième) ?"
    if (this.interactif) texte5 += ajouteChampTexteMathLive(this, 5, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 5, { reponse: { value: 48.3 } })
    const correction5 = '$h_5=30\\times 1{,}1^5\\approx 48{,}3$.'

    const texteQ6 =
      'Quand on atteint la parité (50\\%) en chirurgie (en 2030), est-elle également atteinte en pédiatrie ?'
    this.autoCorrection[6] = {
      enonce: texteQ6,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Oui', statut: false },
        { texte: 'Non', statut: true },
      ],
    }
    const monQcm6 = propositionsQcm(this, 6)
    let texte6 = texteQ6
    if (!context.isAmc) texte6 += monQcm6.texte
    const correction6 =
      "En 2030, $h_5\\approx 48{,}3\\,\\% <50\\,\\%$ : la parité n'est pas encore tout à fait atteinte en pédiatrie, même si elle en est proche."

    let texte7 =
      "L'université compte $500$ étudiants dont $67\\,\\%$ de femmes. Quel est l'effectif de femmes en chirurgie en 2025 (arrondi à l'unité) ?"
    if (this.interactif) texte7 += ajouteChampTexteMathLive(this, 7) + '<br>'
    handleAnswers(this, 7, { reponse: { value: 101 } })
    const correction7 =
      "Il y a $0{,}67\\times 500=335$ femmes, dont $30\\,\\%$ en chirurgie : $0{,}30\\times 335=100{,}5\\approx 101$."

    let texte8 = "Quel est l'effectif d'hommes en pédiatrie en 2025 (arrondi à l'unité) ?"
    if (this.interactif) texte8 += ajouteChampTexteMathLive(this, 8) + '<br>'
    handleAnswers(this, 8, { reponse: { value: 50 } })
    const correction8 =
      "Il y a $500-335=165$ hommes, dont $30\\,\\%$ en pédiatrie : $0{,}30\\times 165=49{,}5\\approx 50$."

    let texte9 = "Quel est l'effectif de femmes en chirurgie en 2030 (arrondi à l'unité) ?"
    if (this.interactif) texte9 += ajouteChampTexteMathLive(this, 9) + '<br>'
    handleAnswers(this, 9, { reponse: { value: 168 } })
    const correction9 = "$0{,}50\\times 335=167{,}5\\approx 168$."

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
    this.listeQuestions[7] = texte7
    this.listeCorrections[7] = correction7
    this.listeQuestions[8] = texte8
    this.listeCorrections[8] = correction8
    this.listeQuestions[9] = texte9
    this.listeCorrections[9] = correction9

    listeQuestionsToContenu(this)
  }
}
