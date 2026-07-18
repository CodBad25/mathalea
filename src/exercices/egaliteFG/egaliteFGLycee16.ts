import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Les filières technologiques : effectifs et fréquences'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '9ca12'
export const refs = {
  'fr-fr': ['1Tec-P1-2', 'EgaliteFG6-1e-16'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFGLycee16 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne += "<br><br>Voici les effectifs des classes de première technologique d'un lycée :<br>"
    const tableauHtml = `<table style="border-collapse: collapse; margin: 10px 0;">
      <tr><th style="border: 1px solid #888; padding: 4px 10px;"></th><th style="border: 1px solid #888; padding: 4px 10px;">Filles</th><th style="border: 1px solid #888; padding: 4px 10px;">Garçons</th><th style="border: 1px solid #888; padding: 4px 10px;">Total</th></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">1<sup>re</sup> STMG</td><td style="border: 1px solid #888; padding: 4px 10px;">54</td><td style="border: 1px solid #888; padding: 4px 10px;">90</td><td style="border: 1px solid #888; padding: 4px 10px;">144</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">1<sup>re</sup> ST2S</td><td style="border: 1px solid #888; padding: 4px 10px;">59</td><td style="border: 1px solid #888; padding: 4px 10px;">18</td><td style="border: 1px solid #888; padding: 4px 10px;">77</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">1<sup>re</sup> STI2D</td><td style="border: 1px solid #888; padding: 4px 10px;">27</td><td style="border: 1px solid #888; padding: 4px 10px;">72</td><td style="border: 1px solid #888; padding: 4px 10px;">99</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">1<sup>re</sup> STL</td><td style="border: 1px solid #888; padding: 4px 10px;">60</td><td style="border: 1px solid #888; padding: 4px 10px;">18</td><td style="border: 1px solid #888; padding: 4px 10px;">78</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">1<sup>re</sup> STD2A</td><td style="border: 1px solid #888; padding: 4px 10px;">34</td><td style="border: 1px solid #888; padding: 4px 10px;">18</td><td style="border: 1px solid #888; padding: 4px 10px;">52</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">Total</td><td style="border: 1px solid #888; padding: 4px 10px;">234</td><td style="border: 1px solid #888; padding: 4px 10px;">216</td><td style="border: 1px solid #888; padding: 4px 10px;">450</td></tr>
      </table>`
    const tableauLatex =
      '1re STMG : 54 filles, 90 garçons (144). 1re ST2S : 59 filles, 18 garçons (77). 1re STI2D : 27 filles, 72 garçons (99). 1re STL : 60 filles, 18 garçons (78). 1re STD2A : 34 filles, 18 garçons (52). Total : 234 filles, 216 garçons (450).<br>'
    this.consigne += context.isHtml ? tableauHtml : tableauLatex
    this.nbQuestions = 5
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 = "Quel est le pourcentage d'élèves en 1re ST2S (arrondi au centième) ?"
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 17.11 } })
    const correction0 = '$\\dfrac{77}{450}\\times 100\\approx 17{,}11\\,\\%$.'

    let texte1 = 'Quel est le pourcentage de filles en 1re STI2D (arrondi au centième) ?'
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 27.27 } })
    const correction1 = '$\\dfrac{27}{99}\\times 100\\approx 27{,}27\\,\\%$.'

    let texte2 = 'Parmi les élèves de 1re STL, quel est le pourcentage de filles (arrondi au centième) ?'
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 76.92 } })
    const correction2 = '$\\dfrac{60}{78}\\times 100\\approx 76{,}92\\,\\%$.'

    let texte3 =
      "Parmi les garçons, quel est le pourcentage d'élèves qui choisit de s'orienter en ST2S (arrondi au centième) ?"
    if (this.interactif) texte3 += ajouteChampTexteMathLive(this, 3, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 3, { reponse: { value: 8.33 } })
    const correction3 = '$\\dfrac{18}{216}\\times 100\\approx 8{,}33\\,\\%$.'

    const texte4 =
      "En construisant le tableau des fréquences conditionnelles par ligne, que peut-on déduire quant à la proportion des élèves dans chaque filière technologique au regard de leur genre ?"
    const correction4 =
      "On constate un très fort déséquilibre selon les filières : les filles sont largement majoritaires en ST2S ($\\approx 76{,}6\\,\\%$) et en STL ($\\approx 76{,}9\\,\\%$), alors qu'elles sont minoritaires en STI2D ($\\approx 27{,}3\\,\\%$). Ce contraste illustre une orientation encore très genrée selon les filières technologiques (santé/social et laboratoire perçus comme féminins, industrie perçue comme masculine)."

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
