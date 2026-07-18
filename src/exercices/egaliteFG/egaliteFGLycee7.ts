import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = "L'écart salarial en équivalent temps plein (EQTP)"
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '1e058'
export const refs = {
  'fr-fr': ['2A-R1-10', 'EgaliteFG5-2de-7', 'EgaliteFG6-1e-7'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles (source : Insee)
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFGLycee7 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>Selon les dernières données de l'Insee, en France, les femmes gagnent en moyenne $14{,}2\\,\\%$ de moins que les hommes en Équivalent Temps Plein (EQTP), à poste égal. On considère une entreprise où le salaire mensuel moyen des hommes est de $2\\,500$ €. On suppose qu'un salarié travaille $365$ jours payés par an."
    this.nbQuestions = 5
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 = 'Calculer le salaire mensuel moyen des femmes dans cette entreprise.'
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0, '', { texteApres: '€' }) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 2145 } })
    const correction0 = '$2\\,500\\times(1-0{,}142)=2\\,500\\times 0{,}858=2\\,145$ €.'

    let texte1 = 'Calculer le manque à gagner annuel moyen pour une femme par rapport à un homme.'
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1, '', { texteApres: '€' }) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 4260 } })
    const correction1 = "$(2\\,500-2\\,145)\\times 12=355\\times 12=4\\,260$ € par an."

    let texte2 =
      "À partir de combien de jours avant la fin de l'année les femmes travaillent-elles symboliquement « gratuitement » ? (arrondi à l'unité de jour)"
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2, '', { texteApres: 'jours' }) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 52 } })
    const correction2 =
      "$14{,}2\\,\\%$ de $365$ jours $\\approx 51{,}8$, soit environ $52$ jours : les femmes travaillent donc symboliquement « gratuitement » les $52$ derniers jours de l'année, soit à partir d'environ le $9$ novembre (date proche de la « journée de l'égalité salariale » réellement observée chaque année en France)."

    const texteQ3 =
      "Pour rétablir l'égalité salariale, une augmentation de $14{,}2\\,\\%$ du salaire des femmes suffirait-elle à rattraper celui des hommes ?"
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
      "$2\\,145\\times 1{,}142=2\\,449{,}59$ € $<2\\,500$ € : cette augmentation ne suffit pas. En effet, une baisse de $14{,}2\\,\\%$ et une hausse de $14{,}2\\,\\%$ ne sont pas des évolutions réciproques : le taux d'évolution nécessaire pour compenser une baisse est toujours plus grand, en valeur absolue, que le taux de la baisse elle-même."

    let texte4 =
      "Quel pourcentage d'augmentation faudrait-il réellement appliquer pour atteindre l'égalité salariale (arrondi à $0{,}1\\,\\%$) ?"
    if (this.interactif) texte4 += ajouteChampTexteMathLive(this, 4, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 4, { reponse: { value: 16.6 } })
    const correction4 = "$\\dfrac{2\\,500-2\\,145}{2\\,145}\\times 100\\approx 16{,}6\\,\\%$."

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
