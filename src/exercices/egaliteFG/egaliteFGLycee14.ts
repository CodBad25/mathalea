import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'La filière STMG deviendra-t-elle majoritairement féminine ?'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'c62f0'
export const refs = {
  'fr-fr': ['1Tec-S2-4', 'EgaliteFG6-1e-14'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFGLycee14 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>Dans un lycée, une filière STMG compte $35\\,\\%$ de filles et $65\\,\\%$ de garçons en 2024. Chaque année, le pourcentage de filles augmente de $2$ points tandis que celui des garçons diminue d'autant.<br>" +
      "On note $P_n$ le pourcentage de filles $n$ années après 2024, avec $P_0=35$."
    this.nbQuestions = 3
    this.nbQuestionsModifiable = false
    this.comment = 'Pour débattre.<br>Discutez des facteurs pouvant influencer cette évolution.'
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    const texte0 =
      'Donner la relation de récurrence de la suite $(P_n)$ ainsi que son premier terme, et préciser sa nature.'
    const correction0 =
      "$P_{n+1}=P_n+2$ et $P_0=35$ : la suite $(P_n)$ est arithmétique, de raison $2$ et de premier terme $35$, donc $P_n=35+2n$."

    let texte1 = 'Quel sera le pourcentage de filles en 2028 ($n=4$) ?'
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 43 } })
    const correction1 = '$P_4=35+2\\times 4=43$.'

    let texte2 = 'À partir de quelle année (donner $n$, avec l\'année $2024+n$) les filles seront-elles majoritaires dans cette filière ?'
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 8 } })
    const correction2 =
      "On cherche le plus petit entier $n$ tel que $35+2n>50$, soit $n>7{,}5$, donc $n=8$ : les filles deviendront majoritaires en $2024+8=2032$."

    this.listeQuestions[0] = texte0
    this.listeCorrections[0] = correction0
    this.listeQuestions[1] = texte1
    this.listeCorrections[1] = correction1
    this.listeQuestions[2] = texte2
    this.listeCorrections[2] = correction2

    listeQuestionsToContenu(this)
  }
}
