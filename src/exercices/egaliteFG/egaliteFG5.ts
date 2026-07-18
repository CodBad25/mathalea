import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Les femmes à l\'Assemblée nationale'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'a108d'
export const refs = {
  'fr-fr': ['6P3D-3', 'EgaliteFG1-6e-5'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG5 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>L'Assemblée nationale est un groupe de personnes élues qui font les lois en France. Elle est composée de $577$ députés, qui représentent les citoyens et débattent des décisions importantes pour le pays.<br>"
    this.consigne += 'Voici le nombre de femmes élues députées lors de certaines législatures :<br>'
    const tableauHtml = `<table style="border-collapse: collapse; margin: 10px 0;">
      <tr><th style="border: 1px solid #888; padding: 4px 10px;">Année</th><td style="border: 1px solid #888; padding: 4px 10px;">1986</td><td style="border: 1px solid #888; padding: 4px 10px;">1997</td><td style="border: 1px solid #888; padding: 4px 10px;">2007</td><td style="border: 1px solid #888; padding: 4px 10px;">2017</td><td style="border: 1px solid #888; padding: 4px 10px;">2022</td></tr>
      <tr><th style="border: 1px solid #888; padding: 4px 10px;">Nombre de femmes</th><td style="border: 1px solid #888; padding: 4px 10px;">34</td><td style="border: 1px solid #888; padding: 4px 10px;">63</td><td style="border: 1px solid #888; padding: 4px 10px;">107</td><td style="border: 1px solid #888; padding: 4px 10px;">224</td><td style="border: 1px solid #888; padding: 4px 10px;">215</td></tr>
      </table>`
    const tableauLatex =
      'Nombre de femmes députées : 34 en 1986, 63 en 1997, 107 en 2007, 224 en 2017, 215 en 2022 (sur 577 sièges).<br>'
    this.consigne += context.isHtml ? tableauHtml : tableauLatex
    this.nbQuestions = 4
    this.nbQuestionsModifiable = false
    this.comment =
      'Pour débattre.<br>À ton avis, comment pourrait-on agir pour encourager l\'accès des femmes à l\'Assemblée nationale ?'
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 =
      "Quel pourcentage de femmes siégeaient à l'Assemblée nationale en 1986 ? (arrondi à l'unité)"
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 6 } })
    const correction0 = '$\\dfrac{34}{577}\\approx 0{,}0589 \\approx 6\\,\\%$.'

    let texte1 =
      "Même question en 2007."
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 19 } })
    const correction1 = '$\\dfrac{107}{577}\\approx 0{,}1854 \\approx 19\\,\\%$.'

    let texte2 = 'Même question en 2022.'
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 37 } })
    const correction2 = '$\\dfrac{215}{577}\\approx 0{,}3726 \\approx 37\\,\\%$.'

    const texte3 =
      "Constates-tu une évolution dans la représentation des femmes à l'Assemblée nationale entre 1986 et 2022 ? Si oui, peux-tu la décrire ?"
    const correction3 =
      "Le pourcentage de femmes élues progresse globalement entre 1986 ($6\\,\\%$) et 2022 ($37\\,\\%$), avec une légère baisse entre 2017 ($39\\,\\%$) et 2022. Malgré cette forte progression, la parité (environ $50\\,\\%$) n'est toujours pas atteinte."

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
