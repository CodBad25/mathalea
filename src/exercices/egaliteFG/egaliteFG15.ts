import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { texteItalique } from '../../lib/outils/embellissements'
import { listeQuestionsToContenu } from '../../modules/outils'
import ExerciceVraiFaux from '../ExerciceVraiFaux'

export const titre = "Un programme de calcul (Inès et Arthur)"
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'qcm'
export const uuid = '11ede'
export const refs = {
  'fr-fr': ['3L1-2', 'EgaliteFG4-3e-15'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG15 extends ExerciceVraiFaux {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>$x$ désigne un nombre positif ou nul. On considère un rectangle dont la largeur est $x+2$ et la longueur est $x+5$.<br>" +
      "La professeure de mathématiques organise une séance en salle informatique et demande aux élèves de se mettre en binômes mixtes. Inès et Arthur ont réalisé un programme Scratch qui, à partir d'un nombre $x$ saisi, calcule $l=x+2$, $L=x+5$, le périmètre $P=2\\times(l+L)$ et l'aire $A=l\\times L$ du rectangle.<br>" +
      "Inès affirme : « $P=3x+9$ et $A=x^2+7x+10$ ». Arthur affirme : « $P=4x+14$ et $A=x^2+10x+7$ »."
    this.nbQuestions = 4
    this.comment =
      "Pour débattre.<br>Pourquoi, selon vous, les filles sont-elles encore sous-représentées dans les métiers de la programmation informatique ? Comment peut-on encourager davantage les filles à s'investir dans ce domaine et à choisir des carrières scientifiques et techniques ?"
    this.affirmations = [
      {
        texte: "L'affirmation d'Inès sur le périmètre, $P=3x+9$, est correcte.",
        statut: false,
        correction:
          "$P=2\\times\\big((x+2)+(x+5)\\big)=2\\times(2x+7)=4x+14$. L'affirmation d'Inès est donc fausse : c'est l'expression d'Arthur qui est correcte.",
      },
      {
        texte: "L'affirmation d'Inès sur l'aire, $A=x^2+7x+10$, est correcte.",
        statut: true,
        correction:
          "$A=(x+2)(x+5)=x^2+5x+2x+10=x^2+7x+10$. L'affirmation d'Inès est donc correcte.",
      },
      {
        texte: "L'affirmation d'Arthur sur le périmètre, $P=4x+14$, est correcte.",
        statut: true,
        correction:
          "$P=2\\times\\big((x+2)+(x+5)\\big)=2\\times(2x+7)=4x+14$. L'affirmation d'Arthur est donc correcte.",
      },
      {
        texte: "L'affirmation d'Arthur sur l'aire, $A=x^2+10x+7$, est correcte.",
        statut: false,
        correction:
          "$A=(x+2)(x+5)=x^2+7x+10\\neq x^2+10x+7$. L'affirmation d'Arthur est donc fausse : c'est l'expression d'Inès qui est correcte.<br>Chacun des deux élèves a donc une expression correcte et une expression fausse : la réussite n'est donc pas la propriété d'un seul binôme ou d'une seule personne.",
      },
    ]
  }

  nouvelleVersion() {
    super.nouvelleVersion()

    let texte4 =
      "Partie 2 - Au lycée général et technologique, en cours de sciences de l'ingénieur, la classe est composée de $30$ élèves et $10\\,\\%$ sont des filles. Quel est l'effectif des filles dans cette classe ?"
    if (this.interactif) texte4 += ajouteChampTexteMathLive(this, 4) + '<br>'
    handleAnswers(this, 4, { reponse: { value: 3 } })
    const correction4 = "$30\\times \\dfrac{10}{100}=3$ : il y a $3$ filles dans cette classe."

    this.listeQuestions[4] = texte4
    this.listeCorrections[4] = correction4
    this.nbQuestions = 5

    listeQuestionsToContenu(this)
  }
}
