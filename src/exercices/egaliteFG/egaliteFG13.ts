import { texteItalique } from '../../lib/outils/embellissements'
import ExerciceVraiFaux from '../ExerciceVraiFaux'

export const titre = 'Zoé et Paul : deux méthodes de calcul littéral'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'qcm'
export const uuid = '71cc1'
export const refs = {
  'fr-fr': ['3L1-1', 'EgaliteFG4-3e-13'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG13 extends ExerciceVraiFaux {
  constructor() {
    super()
    this.pasDeVersionAleatoire = true
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>$x$ désigne un nombre supérieur ou égal à $3$. $ABCD$ est un carré et $AEFD$ est un rectangle, avec $E$ sur $[AB]$ tel que $AE=x+4$ et $EB=x-3$ (donc $AB=AE+EB=2x+1$).<br>" +
      "On note $A$ l'aire du carré $ABCD$, $B$ l'aire du rectangle $AEFD$ (de largeur $AE=x+4$) et $C$ l'aire du rectangle $EBCF$ (de largeur $EB=x-3$), la longueur commune des deux rectangles étant $AD=AB=2x+1$.<br>" +
      'Zoé affirme que l\'aire $A$ du carré est égale à $(2x+1)^2$.<br>' +
      "Paul affirme : « $A=B+C$, donc $A=(x+4)(2x+1)+(x-3)(2x+1)$ »."
    this.nbQuestions = 2
    this.comment =
      'Pour débattre.<br>Les préférences de méthode sont-elles liées au genre ou à l\'expérience personnelle ? Peut-on parler de styles cognitifs genrés ?'
    this.affirmations = [
      {
        texte: "L'affirmation de Zoé, $A=(2x+1)^2$, est correcte.",
        statut: true,
        correction:
          "Le carré $ABCD$ a pour côté $AB=2x+1$, donc son aire est bien $A=(2x+1)^2=4x^2+4x+1$.",
      },
      {
        texte:
          "L'affirmation de Paul, $A=(x+4)(2x+1)+(x-3)(2x+1)$, est correcte.",
        statut: true,
        correction:
          "En factorisant par $(2x+1)$ : $(x+4)(2x+1)+(x-3)(2x+1)=(2x+1)\\big[(x+4)+(x-3)\\big]=(2x+1)(2x+1)=(2x+1)^2$.<br>On retrouve bien $4x^2+4x+1$ : Paul a donc lui aussi raison. Zoé calcule directement l'aire du carré, tandis que Paul le découpe en deux rectangles ($B$ et $C$) dont il additionne les aires : les deux méthodes, bien que différentes, sont toutes les deux valables et donnent le même résultat.",
      },
    ]
  }
}
