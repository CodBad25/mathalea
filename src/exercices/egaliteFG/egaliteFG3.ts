import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Le temps consacré aux tâches ménagères'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '95c40'
export const refs = {
  'fr-fr': ['6P3C-3', 'EgaliteFG1-6e-3'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG3 extends Exercice {
  constructor() {
    super()
    this.pasDeVersionAleatoire = true
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles (source : femmes et maths)",
    )
    this.consigne +=
      '<br><br>En France, en 2010, avec 160 minutes en moyenne par jour (week-end compris) consacrées aux tâches ménagères, les femmes qui travaillent 35 heures dépassent de loin les hommes qui travaillent le même nombre d\'heures et y consacrent 105 minutes par jour.<br>'
    this.consigne +=
      '<i>Source : Enquête « emploi du temps », publiée en 2010 par l\'Insee, pour laquelle 12 000 ménages ont tenu sur une longue période un carnet de bord détaillant toutes leurs activités en une journée.</i>'
    this.nbQuestions = 4
    this.nbQuestionsModifiable = false
    this.comment =
      'Pour débattre.<br>Quelles sont les conséquences de cette répartition sur l\'égalité des tâches ménagères dans la famille ?<br>Et toi, participes-tu à certaines tâches ? Si oui, lesquelles ?'
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    let texte0 =
      'Combien de minutes par semaine les femmes consacrent-elles aux tâches ménagères ?'
    if (this.interactif) texte0 += ajouteChampTexteMathLive(this, 0, '', { texteApres: 'min' }) + '<br>'
    handleAnswers(this, 0, { reponse: { value: 1120 } })
    const correction0 = '$160\\times 7=1\\,120$ minutes par semaine, soit environ $18\\,\\text{h}\\,40\\,\\text{min}$.'

    let texte1 =
      'Combien de minutes par semaine les hommes consacrent-ils aux tâches ménagères ?'
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1, '', { texteApres: 'min' }) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 735 } })
    const correction1 = '$105\\times 7=735$ minutes par semaine, soit $12\\,\\text{h}\\,15\\,\\text{min}$.'

    let texte2 =
      "En déduire la part des tâches ménagères, en \\%, assurée par les femmes (arrondi à l'unité)."
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 60 } })
    const correction2 =
      "Au total, $160+105=265$ minutes sont consacrées chaque jour aux tâches ménagères par le couple.<br>$\\dfrac{160}{265}\\approx 0{,}604=60\\,\\%$ (arrondi à l'unité) : les femmes assurent donc environ $60\\,\\%$ des tâches ménagères du couple."

    let texte3 =
      "Quelle est alors la part assurée par les hommes, en \\% (arrondi à l'unité) ?"
    if (this.interactif) texte3 += ajouteChampTexteMathLive(this, 3, '', { texteApres: '%' }) + '<br>'
    handleAnswers(this, 3, { reponse: { value: 40 } })
    const correction3 =
      "$\\dfrac{105}{265}\\approx 0{,}396=40\\,\\%$ (ou $100-60=40\\,\\%$) : les hommes assurent donc environ $40\\,\\%$ des tâches ménagères du couple."

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
