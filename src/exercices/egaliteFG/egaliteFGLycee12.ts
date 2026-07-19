import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Tabagisme au travail : un paradoxe statistique'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '49e3a'
export const refs = {
  'fr-fr': ['1Tec-P1-1', 'EgaliteFG6-1e-12'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFGLycee12 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>Une caisse d'assurance maladie emploie $1\\,630$ personnes. Voici les effectifs par catégorie :<br>"
    const tableauHtml = `<table style="border-collapse: collapse; margin: 10px 0;">
      <tr><th style="border: 1px solid #888; padding: 4px 10px;"></th><th style="border: 1px solid #888; padding: 4px 10px;">18-30 ans</th><th style="border: 1px solid #888; padding: 4px 10px;">31-50 ans</th><th style="border: 1px solid #888; padding: 4px 10px;">Plus de 50 ans</th><th style="border: 1px solid #888; padding: 4px 10px;">Total</th></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">Hommes</td><td style="border: 1px solid #888; padding: 4px 10px;">150</td><td style="border: 1px solid #888; padding: 4px 10px;">600</td><td style="border: 1px solid #888; padding: 4px 10px;">230</td><td style="border: 1px solid #888; padding: 4px 10px;">980</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">Femmes</td><td style="border: 1px solid #888; padding: 4px 10px;">500</td><td style="border: 1px solid #888; padding: 4px 10px;">50</td><td style="border: 1px solid #888; padding: 4px 10px;">100</td><td style="border: 1px solid #888; padding: 4px 10px;">650</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">Total</td><td style="border: 1px solid #888; padding: 4px 10px;">650</td><td style="border: 1px solid #888; padding: 4px 10px;">650</td><td style="border: 1px solid #888; padding: 4px 10px;">330</td><td style="border: 1px solid #888; padding: 4px 10px;">1 630</td></tr>
      </table>
      <p>Pourcentages de fumeurs par catégorie : Hommes $60\\,\\%$ / $25\\,\\%$ / $30\\,\\%$ (18-30, 31-50, plus de 50 ans) ; Femmes $50\\,\\%$ / $20\\,\\%$ / $25\\,\\%$.</p>
      <p>La cheffe de centre affirme que les femmes, tranche d'âge par tranche d'âge, fument moins que les hommes.</p>`
    const tableauLatex =
      "Effectifs : Hommes 150/600/230 (18-30, 31-50, plus de 50 ans), total 980. Femmes 500/50/100, total 650.<br>" +
      "Pourcentages de fumeurs : Hommes 60 \\%/25 \\%/30 \\%. Femmes 50 \\%/20 \\%/25 \\%.<br>" +
      "La cheffe de centre affirme que les femmes, tranche d'âge par tranche d'âge, fument moins que les hommes.<br>"
    this.consigne += context.isHtml ? tableauHtml : tableauLatex
    this.nbQuestions = 5
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 = "Quel est le pourcentage de fumeurs dans l'ensemble du personnel (arrondi au centième) ?"
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 36.44 } })
    const correction0 =
      "Fumeurs hommes : $150\\times 0{,}6+600\\times 0{,}25+230\\times 0{,}3=90+150+69=309$. Fumeurs femmes : $500\\times 0{,}5+50\\times 0{,}2+100\\times 0{,}25=250+10+25=285$. Total fumeurs : $309+285=594$. $\\dfrac{594}{1\\,630}\\times 100\\approx 36{,}44\\,\\%$."

    let texte1 = "Calculer le pourcentage de fumeurs parmi les hommes (arrondi au centième)."
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 31.53 } })
    const correction1 = '$\\dfrac{309}{980}\\times 100\\approx 31{,}53\\,\\%$.'

    let texte2 = 'Calculer le pourcentage de fumeurs parmi les femmes (arrondi au centième).'
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 43.85 } })
    const correction2 = '$\\dfrac{285}{650}\\times 100\\approx 43{,}85\\,\\%$.'

    const texteQ3 =
      "L'affirmation de la cheffe de centre (tranche d'âge par tranche d'âge, les femmes fument moins que les hommes) est-elle vraie ?"
    this.autoCorrection[3] = {
      enonce: texteQ3,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Vrai', statut: true },
        { texte: 'Faux', statut: false },
      ],
    }
    const monQcm3 = propositionsQcm(this, 3)
    let texte3 = texteQ3
    if (!context.isAmc) texte3 += monQcm3.texte
    const correction3 =
      "Vrai : dans chaque tranche d'âge, le pourcentage de fumeuses est inférieur à celui des fumeurs ($50\\,\\%<60\\,\\%$, $20\\,\\%<25\\,\\%$, $25\\,\\%<30\\,\\%$)."

    const texteQ4 =
      "Peut-on pour autant affirmer, globalement (toutes tranches d'âge confondues), que les femmes fument moins que les hommes dans cette entreprise ?"
    this.autoCorrection[4] = {
      enonce: texteQ4,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Oui', statut: false },
        { texte: 'Non, au contraire', statut: true },
      ],
    }
    const monQcm4 = propositionsQcm(this, 4)
    let texte4 = texteQ4
    if (!context.isAmc) texte4 += monQcm4.texte
    const correction4 =
      "Non : globalement, $43{,}85\\,\\%$ des femmes fument contre seulement $31{,}53\\,\\%$ des hommes, soit l'inverse de ce que suggère la comparaison par tranche d'âge ! Cela s'explique par le fait que les femmes de cette entreprise sont très majoritairement jeunes (500 sur 650 ont entre 18 et 30 ans, tranche où le tabagisme est le plus élevé), alors que les hommes sont surtout dans la tranche 31-50 ans (600 sur 980), où le tabagisme est plus faible. Ce phénomène, où une tendance vraie dans chaque sous-groupe s'inverse au global à cause d'une répartition différente des effectifs, est un exemple classique de « paradoxe de Simpson »."

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
