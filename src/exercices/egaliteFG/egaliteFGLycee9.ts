import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Le choix des spécialités en terminale générale'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '60f12'
export const refs = {
  'fr-fr': ['EgaliteFG6-1e-9'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles (source : DEPP)
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFGLycee9 extends Exercice {
  constructor() {
    super()
    this.pasDeVersionAleatoire = true
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles (source : DEPP, Système d'information Scolarité)",
    )
    this.consigne +=
      "<br><br>Depuis la réforme du lycée en 2019, le choix des enseignements de spécialité en terminale générale semble dépendre du genre de l'élève. Voici la proportion de filles parmi les élèves ayant choisi chaque spécialité, en 2022 et 2023 :<br>"
    const tableauHtml = `<table style="border-collapse: collapse; margin: 10px 0;">
      <tr><th style="border: 1px solid #888; padding: 4px 10px;">Spécialité</th><th style="border: 1px solid #888; padding: 4px 10px;">Proportion de filles 2022</th><th style="border: 1px solid #888; padding: 4px 10px;">Proportion de filles 2023</th></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">Mathématiques</td><td style="border: 1px solid #888; padding: 4px 10px;">40,6 %</td><td style="border: 1px solid #888; padding: 4px 10px;">41,6 %</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">Sciences économiques et sociales</td><td style="border: 1px solid #888; padding: 4px 10px;">59,6 %</td><td style="border: 1px solid #888; padding: 4px 10px;">59,4 %</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">Physique-chimie</td><td style="border: 1px solid #888; padding: 4px 10px;">46,9 %</td><td style="border: 1px solid #888; padding: 4px 10px;">46,2 %</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">Humanités, littérature et philosophie</td><td style="border: 1px solid #888; padding: 4px 10px;">80,6 %</td><td style="border: 1px solid #888; padding: 4px 10px;">81,7 %</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">Numérique et sciences informatiques</td><td style="border: 1px solid #888; padding: 4px 10px;">14,6 %</td><td style="border: 1px solid #888; padding: 4px 10px;">15,2 %</td></tr>
      </table>`
    const tableauLatex =
      'Proportion de filles (2022 puis 2023) : Mathématiques 40,6 \\%/41,6 \\% ; SES 59,6 \\%/59,4 \\% ; Physique-chimie 46,9 \\%/46,2 \\% ; HLP 80,6 \\%/81,7 \\% ; NSI 14,6 \\%/15,2 \\%.<br>'
    this.consigne += context.isHtml ? tableauHtml : tableauLatex
    this.nbQuestions = 5
    this.nbQuestionsModifiable = false
    this.comment =
      "Activité complémentaire.<br>Recueille la « triplette » d'enseignements de spécialité de chaque élève de première de ton établissement, regroupe et traite ces données dans une feuille de calcul du tableur. Ces données confirment-elles, dans ton lycée, que le genre exerce une influence sur le choix des enseignements de spécialité ? Argumente."
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    const texteQ0 = 'En 2023, quelle spécialité a la plus faible proportion de filles ?'
    this.autoCorrection[0] = {
      enonce: texteQ0,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Mathématiques', statut: false },
        { texte: 'Numérique et sciences informatiques', statut: true },
        { texte: 'Physique-chimie', statut: false },
      ],
    }
    const monQcm0 = propositionsQcm(this, 0)
    let texte0 = texteQ0
    if (!context.isAmc) texte0 += monQcm0.texte
    const correction0 = "C'est la spécialité « Numérique et sciences informatiques », avec seulement $15{,}2\\,\\%$ de filles."

    const texteQ1 = 'En 2023, quelle spécialité a la plus forte proportion de filles ?'
    this.autoCorrection[1] = {
      enonce: texteQ1,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Sciences économiques et sociales', statut: false },
        { texte: 'Humanités, littérature et philosophie', statut: true },
        { texte: 'Physique-chimie', statut: false },
      ],
    }
    const monQcm1 = propositionsQcm(this, 1)
    let texte1 = texteQ1
    if (!context.isAmc) texte1 += monQcm1.texte
    const correction1 = "C'est la spécialité « Humanités, littérature et philosophie », avec $81{,}7\\,\\%$ de filles."

    let texte2 =
      "Calculer, en 2023, l'écart (en points de pourcentage) entre la proportion de filles en HLP et en NSI."
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2, '', { texteApres: 'points' }) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 66.5 } })
    const correction2 = '$81{,}7-15{,}2=66{,}5$ points.'

    const texteQ3 =
      'Entre 2022 et 2023, la proportion de filles en NSI a-t-elle augmenté ou diminué ?'
    this.autoCorrection[3] = {
      enonce: texteQ3,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Elle a augmenté', statut: true },
        { texte: 'Elle a diminué', statut: false },
        { texte: 'Elle est restée stable', statut: false },
      ],
    }
    const monQcm3 = propositionsQcm(this, 3)
    let texte3 = texteQ3
    if (!context.isAmc) texte3 += monQcm3.texte
    const correction3 = 'Elle est passée de $14{,}6\\,\\%$ à $15{,}2\\,\\%$ : elle a donc légèrement augmenté ($+0{,}6$ point).'

    const texte4 =
      "Cet écart (près de $67$ points entre HLP et NSI) préfigure-t-il, selon toi, des choix futurs différents pour les filles et les garçons dans l'enseignement supérieur ou les métiers ?"
    const correction4 =
      "Réponse ouverte : les enquêtes nationales montrent qu'au niveau national, les filles restent sous-représentées dans les spécialités scientifiques et numériques, ce qui peut influencer leurs choix ultérieurs d'orientation dans le supérieur, avec des conséquences sur l'insertion professionnelle et les inégalités salariales."

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
