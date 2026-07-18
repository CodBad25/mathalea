import { texteItalique } from '../../lib/outils/embellissements'
import ExerciceVraiFaux from '../ExerciceVraiFaux'

export const titre = 'Une étagère pour pompiers (Pythagore et trigonométrie)'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'qcm'
export const uuid = 'a40d0'
export const refs = {
  'fr-fr': ['4G22-3', '3G31-2', 'EgaliteFG3-4e-9', 'EgaliteFG4-3e-9'],
  'fr-ch': [],
}

export const egaliteFillesGarcons = true

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG9 extends ExerciceVraiFaux {
  constructor() {
    super()
    this.consigne = texteItalique(
      "D'après « Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
    )
    this.consigne +=
      "<br><br>Pour s'entraîner au concours des pompiers de Paris, Sam et Camélia veulent se construire une étagère pour la fameuse épreuve de la planche. Le triangle $ABC$ représente l'étagère $[AB]$, le mur $[AC]$ et le support diagonal $[BC]$, avec $AB=72\\text{ cm}$, $AC=96\\text{ cm}$ et $BC=1{,}2\\text{ m}$.<br>" +
      'Camélia affirme : « Pour calculer les mesures des angles $\\widehat{ABC}$ et $\\widehat{ACB}$, on doit utiliser la formule du sinus ». Sam affirme : « Tu as tort, on doit utiliser la formule du cosinus ».'
    this.nbQuestions = 2
    this.comment =
      'Pour débattre.<br>Comment percevez-vous la place des femmes et des hommes dans la profession de pompier ? Est-ce que l\'équité entre les sexes est réellement présente dans les équipes de pompiers, et quelles seraient les solutions pour rendre cette profession plus inclusive ?'
    this.affirmations = [
      {
        texte:
          "L'étagère $[AB]$ est bien perpendiculaire au mur $[AC]$.",
        statut: true,
        correction:
          "Dans le triangle $ABC$, le plus grand côté est $[BC]$ avec $BC=120\\text{ cm}$. On compare $BC^2$ et $AB^2+AC^2$ : $BC^2=120^2=14\\,400$ et $AB^2+AC^2=72^2+96^2=5\\,184+9\\,216=14\\,400$.<br>Comme $BC^2=AB^2+AC^2$, d'après la réciproque du théorème de Pythagore, le triangle $ABC$ est rectangle en $A$ : l'étagère $[AB]$ est donc bien perpendiculaire au mur $[AC]$.",
      },
      {
        texte:
          'Sam a raison : seule la formule du cosinus permet de calculer les angles $\\widehat{ABC}$ et $\\widehat{ACB}$.',
        statut: false,
        correction:
          "Le triangle $ABC$ est rectangle en $A$ et ses trois côtés sont connus ($72\\text{ cm}$, $96\\text{ cm}$ et $120\\text{ cm}$). On peut donc calculer l'angle $\\widehat{ABC}$ aussi bien avec le sinus ($\\sin(\\widehat{ABC})=\\dfrac{AC}{BC}=\\dfrac{96}{120}=0{,}8$) qu'avec le cosinus ($\\cos(\\widehat{ABC})=\\dfrac{AB}{BC}=\\dfrac{72}{120}=0{,}6$) : les deux calculs donnent bien $\\widehat{ABC}\\approx 53{,}1\\text{°}$. Camélia et Sam ont donc chacun raison : ni l'une ni l'autre des deux méthodes n'est fausse.",
      },
    ]
  }
}
