import { texteItalique } from '../../lib/outils/embellissements'
import ExerciceVraiFaux from '../ExerciceVraiFaux'

export const titre = "Un mur bien droit ? (théorème de Pythagore)"
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'qcm'
export const uuid = 'e9ee9'
export const refs = {
  'fr-fr': ['4G21-1', 'EgaliteFG3-4e-8'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG8 extends ExerciceVraiFaux {
  constructor() {
    super()
    this.pasDeVersionAleatoire = true
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      '<br><br>Au lycée professionnel, deux groupes sont missionnés pour construire un mur :<br>' +
      '$\\bullet$ Le groupe 1 est composé de Léa et Daniel.<br>' +
      '$\\bullet$ Le groupe 2 est composé d\'Enzo et Anita.<br><br>' +
      'En tant que futurs maçons, les deux groupes doivent construire chacun un mur. Leur professeure, Mme Ecker, doit vérifier si chaque mur est bien « droit », c\'est-à-dire perpendiculaire au sol. Elle choisit, pour chaque mur, trois points : un point $I$ au pied du mur, un point $H$ situé à $60\\text{ cm}$ au-dessus de $I$ sur le mur, et un point $S$ au sol, à $80\\text{ cm}$ de $I$. Elle mesure ensuite la distance $HS$.<br>' +
      'Pour le mur du groupe 1, $HS=1\\text{ m}$. Pour le mur du groupe 2, $HS=95\\text{ cm}$.'
    this.nbQuestions = 2
    this.comment =
      'Pour débattre.<br>Pensez-vous que le métier de maçon est réservé uniquement aux hommes ? Plus généralement, que pensez-vous de la place des femmes dans les métiers du bâtiment ?'
    this.affirmations = [
      {
        texte: 'Le mur du groupe 1 (Léa et Daniel) est bien perpendiculaire au sol.',
        statut: true,
        correction:
          "Si le mur était perpendiculaire au sol, le triangle $HIS$ serait rectangle en $I$, et on aurait $HS^2=HI^2+IS^2=60^2+80^2=3\\,600+6\\,400=10\\,000$, soit $HS=\\sqrt{10\\,000}=100\\text{ cm}=1\\text{ m}$.<br>Or on mesure bien $HS=1\\text{ m}$ : d'après la réciproque du théorème de Pythagore, le triangle $HIS$ est rectangle en $I$, donc le mur du groupe 1 est bien perpendiculaire au sol.",
      },
      {
        texte: 'Le mur du groupe 2 (Enzo et Anita) est bien perpendiculaire au sol.',
        statut: false,
        correction:
          "Si le mur était perpendiculaire au sol, on aurait $HS=100\\text{ cm}$ (voir calcul ci-dessus). Or on mesure $HS=95\\text{ cm}\\neq 100\\text{ cm}$ : le triangle $HIS$ n'est donc pas rectangle en $I$, et le mur du groupe 2 n'est pas perpendiculaire au sol.",
      },
    ]
  }
}
