import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = "Orientation en première : probabilités et genre"
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '26347'
export const refs = {
  'fr-fr': ['1Tec-P2-1', 'EgaliteFG6-1e-15'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFGLycee15 extends Exercice {
  constructor() {
    super()
    this.pasDeVersionAleatoire = true
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne += "<br><br>Dans un lycée, on observe la répartition des élèves en première selon le tableau suivant :<br>"
    const tableauHtml = `<table style="border-collapse: collapse; margin: 10px 0;">
      <tr><th style="border: 1px solid #888; padding: 4px 10px;">Filière</th><th style="border: 1px solid #888; padding: 4px 10px;">Filles</th><th style="border: 1px solid #888; padding: 4px 10px;">Garçons</th><th style="border: 1px solid #888; padding: 4px 10px;">Total</th></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">Générale</td><td style="border: 1px solid #888; padding: 4px 10px;">180</td><td style="border: 1px solid #888; padding: 4px 10px;">200</td><td style="border: 1px solid #888; padding: 4px 10px;">380</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">Technologique</td><td style="border: 1px solid #888; padding: 4px 10px;">120</td><td style="border: 1px solid #888; padding: 4px 10px;">100</td><td style="border: 1px solid #888; padding: 4px 10px;">220</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">Professionnelle</td><td style="border: 1px solid #888; padding: 4px 10px;">60</td><td style="border: 1px solid #888; padding: 4px 10px;">100</td><td style="border: 1px solid #888; padding: 4px 10px;">160</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">Total</td><td style="border: 1px solid #888; padding: 4px 10px;">360</td><td style="border: 1px solid #888; padding: 4px 10px;">400</td><td style="border: 1px solid #888; padding: 4px 10px;">760</td></tr>
      </table>`
    const tableauLatex =
      'Générale : 180 filles, 200 garçons (380). Technologique : 120 filles, 100 garçons (220). Professionnelle : 60 filles, 100 garçons (160). Total : 360 filles, 400 garçons (760).<br>'
    this.consigne += context.isHtml ? tableauHtml : tableauLatex
    this.nbQuestions = 4
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 = 'Un élève est choisi au hasard. Quelle est la probabilité que ce soit une fille (arrondie au millième) ?'
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 0.474 } })
    const correction0 = '$p=\\dfrac{360}{760}\\approx 0{,}474$.'

    let texte1 =
      "Un élève est choisi au hasard. Quelle est la probabilité que ce soit un garçon en filière technologique (arrondie au millième) ?"
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 0.132 } })
    const correction1 = '$p=\\dfrac{100}{760}\\approx 0{,}132$.'

    let texte2 =
      "Un élève est choisi au hasard parmi les élèves en filière générale. Quelle est la probabilité que ce soit une fille (arrondie au millième) ?"
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 0.474 } })
    const correction2 = '$p=\\dfrac{180}{380}\\approx 0{,}474$.'

    const texte3 =
      "Comparer les proportions de filles dans chaque filière et expliquer ce que ces résultats révèlent sur les choix d'orientation selon le genre."
    const correction3 =
      "Proportion de filles : générale $\\dfrac{180}{380}\\approx 47{,}4\\,\\%$ (identique à la proportion globale de filles, $\\dfrac{360}{760}\\approx 47{,}4\\,\\%$ : pas de déséquilibre marqué) ; technologique $\\dfrac{120}{220}\\approx 54{,}5\\,\\%$ (légère surreprésentation des filles) ; professionnelle $\\dfrac{60}{160}=37{,}5\\,\\%$ (nette sous-représentation des filles, donc surreprésentation des garçons). Le choix de la filière professionnelle apparaît donc comme le plus genré des trois."

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
