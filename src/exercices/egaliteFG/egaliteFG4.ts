import { propositionsQcm } from '../../lib/interactif/qcm'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Les personnages dans les sujets du DNB'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'qcm'
export const uuid = '6c10c'
export const refs = {
  'fr-fr': ['auto6P1A-2', 'EgaliteFG1-6e-4'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles (source : femmes et maths)
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG4 extends Exercice {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>Le DNB est organisé en France métropolitaine, Outre-Mer et centres étrangers. En 2016, l'inventaire des prénoms dans les sujets du DNB a permis d'établir un tableau recensant, zone par zone, le nombre de personnages féminins et masculins apparaissant dans quatre types d'activités : activité purement mathématique, métier, activité sportive et activité courante.<br><br>"
    this.consigne += "Voici un extrait de ce tableau :<br>"
    const tableauHtml = `<table style="border-collapse: collapse; margin: 10px 0;">
      <tr><th style="border: 1px solid #888; padding: 4px 10px;"></th><th style="border: 1px solid #888; padding: 4px 10px;">Activité purement mathématique<br>Fille/femme</th><th style="border: 1px solid #888; padding: 4px 10px;">Activité purement mathématique<br>Garçon/homme</th><th style="border: 1px solid #888; padding: 4px 10px;">Activité sportive<br>Fille/femme</th><th style="border: 1px solid #888; padding: 4px 10px;">Activité courante<br>Fille/femme</th></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">Nouvelle-Calédonie</td><td style="border: 1px solid #888; padding: 4px 10px;">1</td><td style="border: 1px solid #888; padding: 4px 10px;">2</td><td style="border: 1px solid #888; padding: 4px 10px;">-</td><td style="border: 1px solid #888; padding: 4px 10px;">8</td></tr>
      <tr><td style="border: 1px solid #888; padding: 4px 10px;">TOTAL (toutes zones)</td><td style="border: 1px solid #888; padding: 4px 10px;">4</td><td style="border: 1px solid #888; padding: 4px 10px;">4</td><td style="border: 1px solid #888; padding: 4px 10px;">4</td><td style="border: 1px solid #888; padding: 4px 10px;">10</td></tr>
      </table>
      <p>Par ailleurs, la ligne TOTAL indique aussi : Métier, Fille/femme : <b>0</b> ; Garçon/homme : <b>6</b>. Activité sportive, Garçon/homme : <b>7</b>. Activité courante, Garçon/homme : <b>19</b>.</p>`
    const tableauLatex =
      'Extrait du tableau : Nouvelle-Calédonie, activité purement mathématique : 1 fille, 2 garçons ; activité courante : 8 filles.<br>' +
      'Ligne TOTAL (toutes zones) : activité purement mathématique 4 filles/4 garçons ; métier 0 fille/6 garçons ; activité sportive 4 filles/7 garçons ; activité courante 10 filles/19 garçons.<br>'
    this.consigne += context.isHtml ? tableauHtml : tableauLatex
    this.nbQuestions = 4
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    // Q0 : interprétation du 0 dans la ligne TOTAL (QCM)
    const texteQ0 =
      "Que traduit la présence du nombre $0$ dans la colonne « Métier, Fille/femme » de la ligne TOTAL ?"
    this.autoCorrection[0] = {
      enonce: texteQ0,
      options: { ordered: true, radio: true },
      propositions: [
        {
          texte: "Aucun personnage féminin n'exerce un métier dans l'ensemble des sujets étudiés.",
          statut: true,
        },
        {
          texte: "Aucun personnage masculin n'exerce un métier dans l'ensemble des sujets étudiés.",
          statut: false,
        },
      ],
    }
    const monQcm0 = propositionsQcm(this, 0)
    let texte0 = texteQ0
    if (!context.isAmc) texte0 += monQcm0.texte
    const correction0 =
      "Le $0$ signifie qu'aucun personnage féminin n'intervient dans une activité liée à un métier, dans l'ensemble des zones géographiques citées."

    // Q1 : garçon Nouvelle-Calédonie maths
    let texte1 =
      'Combien de fois apparaît un personnage masculin dans le sujet de mathématiques du DNB en Nouvelle-Calédonie ?'
    if (this.interactif) texte1 += ajouteChampTexteMathLive(this, 1) + '<br>'
    handleAnswers(this, 1, { reponse: { value: 2 } })
    const correction1 = "D'après le tableau, un personnage masculin apparaît $2$ fois."

    // Q2 : fille Nouvelle-Calédonie maths
    let texte2 =
      'Même question avec un personnage féminin.'
    if (this.interactif) texte2 += ajouteChampTexteMathLive(this, 2) + '<br>'
    handleAnswers(this, 2, { reponse: { value: 1 } })
    const correction2 = "D'après le tableau, un personnage féminin apparaît $1$ fois."

    // Q3 : sportives vs courantes (QCM)
    const texteQ3 =
      'Au total, les filles sont-elles plus souvent représentées dans les activités sportives ou dans les activités courantes ?'
    this.autoCorrection[3] = {
      enonce: texteQ3,
      options: { ordered: true, radio: true },
      propositions: [
        { texte: 'Dans les activités sportives', statut: false },
        { texte: 'Dans les activités courantes', statut: true },
      ],
    }
    const monQcm3 = propositionsQcm(this, 3)
    let texte3 = texteQ3
    if (!context.isAmc) texte3 += monQcm3.texte
    const correction3 =
      'Les filles apparaissent $4$ fois dans les activités sportives contre $10$ fois dans les activités courantes : elles sont donc plus souvent représentées dans les activités courantes.'

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
