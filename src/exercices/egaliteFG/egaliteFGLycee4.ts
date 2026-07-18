import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Taux de chômage des hommes et des femmes en 2009'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '4fb1f'
export const refs = {
  'fr-fr': ['EgaliteFG5-2de-4', 'EgaliteFG6-1e-4'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles (source : Insee)
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFGLycee4 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>On appelle population active les personnes ayant un emploi ainsi que les personnes au chômage (source Insee).<br>" +
      "En 2009, en France, il y avait en moyenne $2\\,577\\,000$ chômeurs (hommes et femmes confondus), ce qui représentait $9{,}1\\,\\%$ de la population active. Par ailleurs, il y avait $1\\,318\\,000$ hommes au chômage pour une population active de $14\\,806\\,000$ hommes, et $1\\,259\\,000$ femmes au chômage pour une population active de $13\\,463\\,000$ femmes."
    this.nbQuestions = 4
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 =
      "Déterminer la population active totale en 2009 (arrondie au millier)."
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 28319000 } })
    const correction0 =
      "$\\dfrac{2\\,577\\,000}{0{,}091}\\approx 28\\,318\\,681$, soit environ $28\\,319\\,000$ personnes (arrondi au millier)."

    let texte1 = 'Déterminer le taux de chômage des hommes, en France, en 2009 (arrondi à $0{,}1\\,\\%$).'
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 8.9 } })
    const correction1 = "$\\dfrac{1\\,318\\,000}{14\\,806\\,000}\\times 100\\approx 8{,}9\\,\\%$."

    let texte2 = 'Même question pour les femmes.'
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 9.4 } })
    const correction2 = "$\\dfrac{1\\,259\\,000}{13\\,463\\,000}\\times 100\\approx 9{,}4\\,\\%$."

    const texteQ3 =
      "Le gouvernement annonçait qu'il y avait moins de femmes au chômage que d'hommes, ce qui indiquerait une bonne amélioration des inégalités femmes-hommes. Cette affirmation, bien que vraie en valeur absolue, est-elle trompeuse ?"
    this.autoCorrection[3] = {
      enonce: texteQ3,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Oui', statut: true },
        { texte: 'Non', statut: false },
      ],
    }
    const monQcm3 = propositionsQcm(this, 3)
    let texte3 = texteQ3
    if (!context.isAmc) texte3 += monQcm3.texte
    const correction3 =
      "Oui : bien que le nombre absolu de femmes au chômage ($1\\,259\\,000$) soit inférieur à celui des hommes ($1\\,318\\,000$), le taux de chômage des femmes ($9{,}4\\,\\%$) est en réalité plus élevé que celui des hommes ($8{,}9\\,\\%$), car la population active féminine est plus petite. Comparer des effectifs bruts sans tenir compte de la taille des populations de référence est trompeur : c'est en comparant des taux (proportions) que l'on peut réellement juger de l'égalité entre les deux populations. Au 1er trimestre 2025, les taux de chômage des hommes et des femmes sont devenus identiques (environ $7{,}4\\,\\%$), mais l'égalité des taux ne signifie pas forcément une égalité réelle sur le marché du travail (temps partiel subi, écarts de salaire, plafond de verre...)."

    this.listeQuestions[0] = texte0
    this.listeCorrections[0] = correction0
    this.listeQuestions[1] = texte1
    this.listeCorrections[1] = correction1
    this.listeQuestions[2] = texte2
    this.listeCorrections[2] = correction2
    this.listeQuestions[3] = texte3
    this.listeCorrections[3] = correction3

    listeQuestionsToContenu(this)
  }
}
