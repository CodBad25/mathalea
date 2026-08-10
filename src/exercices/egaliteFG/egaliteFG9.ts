import { miseEnEvidence, texteGras, texteItalique } from '../../lib/outils/embellissements'
import { ajouterLien } from '../../lib/outils/enrichissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import ExerciceVraiFaux from '../ExerciceVraiFaux'

export const titre = 'Une étagère pour pompiers (Pythagore et trigonométrie)'
export const dateDePublication = '15/07/2026'
export const interactifReady = true
export const interactifType = 'qcm'
export const uuid = 'a40d0'
export const refs = {
  'fr-fr': ['EgaliteFG3-4e-9', 'EgaliteFG4-3e-9'],
  'fr-ch': [],
}

export const tags = ['égalité filles-garçons']

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG9 extends ExerciceVraiFaux {
  commentaireDebat = ''
  commentaireApprofondir = ''

  constructor() {
    super()
    this.pasDeVersionAleatoire = true
    this.consigne = texteItalique(
      "D'après " + ajouterLien('https://nuage03.apps.education.fr/index.php/s/NZgmoFpcSCW8Cag?dir=/&editing=false&openfile=true', '« Sur le chemin de l\'égalité en mathématiques pour tous les élèves » - Académie de Versailles'),
    )
    this.consigne +=
      "<br><br>Pour s'entraîner au concours des pompiers de Paris, Sam et Camélia veulent se construire une étagère pour la fameuse épreuve de la planche. Ils ont fait le croquis ci-dessous, qui n'est pas à l'échelle. Le triangle $ABC$ représente l'étagère $[AB]$, le mur $[AC]$ et le support diagonal $[BC]$, avec $AB=72\\text{ cm}$, $AC=96\\text{ cm}$ et $BC=1{,}2\\text{ m}$.<br>" +
      (context.isHtml ? '<div class="not-prose" style="text-align:center; margin: 0.75rem 0;"><img src="/alea/images/egalite/etagere-pompiers.jpg" alt="Étagère de pompiers : triangle ABC avec AB=72 cm, AC=96 cm, BC=1,2 m" style="max-width:260px; width:100%; height:auto;"></div>' : '') +
      'Camélia affirme : « Pour calculer les mesures des angles $\\widehat{ABC}$ et $\\widehat{ACB}$, on doit utiliser la formule du sinus ». Sam affirme : « Tu as tort, on doit utiliser la formule du cosinus ».'
    this.nbQuestions = 2
    this.nbQuestionsModifiable = false
    this.commentaireDebat =
      texteGras('Pour débattre') + '.<br>Comment percevez-vous la place des femmes et des hommes dans la profession de pompier ?<br>Est-ce que l\'équité entre les sexes est réellement présente dans les équipes de pompiers, et quelles seraient les solutions pour rendre cette profession plus inclusive ?'
    this.besoinFormulaireCaseACocher = ['Afficher « Pour débattre »', true]
    this.sup = true
    this.commentaireApprofondir =
      texteGras('Pour aller plus loin') + '.<br>Pour en savoir plus sur le métier de pompier et découvrir qu\'il est accessible à toutes et à tous, vous pouvez consulter ' +
      ajouterLien('https://www.onisep.fr/ressources/univers-metier/metiers/sapeur-pompier', 'cette fiche métier') +
      ' ou ' +
      ajouterLien('https://oniseptv.onisep.fr/video/sapeur-pompier-1', 'cette vidéo') +
      ' proposées par l\'Onisep.'
    this.besoinFormulaire2CaseACocher = ['Afficher « Pour aller plus loin »', true]
    this.sup2 = true
    this.affirmations = [
      {
        texte:
          "L'étagère $[AB]$ est bien perpendiculaire au mur $[AC]$.",
        statut: true,
        correction:
          `Dans le triangle $ABC$, le plus grand côté est $[BC]$ avec $BC=120\\text{ cm}$. On compare $BC^2$ et $AB^2+AC^2$ : $BC^2=120^2=14\\,400$ et $AB^2+AC^2=72^2+96^2=5\\,184+9\\,216=14\\,400$.<br>Comme $BC^2=AB^2+AC^2$, d'après la réciproque du théorème de Pythagore, le triangle $ABC$ est rectangle en $A$ : $${miseEnEvidence("\\text{l'étagère }[AB]\\text{ est donc bien perpendiculaire au mur }[AC]")}$.`,
      },
      {
        texte:
          'Sam a raison : seule la formule du cosinus permet de calculer les angles $\\widehat{ABC}$ et $\\widehat{ACB}$.',
        statut: false,
        correction:
          `Le triangle $ABC$ est rectangle en $A$ et ses trois côtés sont connus ($72\\text{ cm}$, $96\\text{ cm}$ et $120\\text{ cm}$). On peut donc calculer l'angle $\\widehat{ABC}$ aussi bien avec le sinus ($\\sin(\\widehat{ABC})=\\dfrac{AC}{BC}=\\dfrac{96}{120}=0{,}8$) qu'avec le cosinus ($\\cos(\\widehat{ABC})=\\dfrac{AB}{BC}=\\dfrac{72}{120}=0{,}6$) : les deux calculs donnent bien $\\widehat{ABC}\\approx 53{,}1\\text{°}$. $${miseEnEvidence("\\text{Camélia et Sam ont donc chacun raison}")}$ : ni l'une ni l'autre des deux méthodes n'est fausse.`,
      },
    ]
  }

  nouvelleVersion() {
    const introConsigne = this.consigne
    super.nouvelleVersion()
    this.consigne = introConsigne + '<br><br>' + this.consigne
    if (this.sup) this.listeQuestions[this.listeQuestions.length - 1] += '<br><br>' + this.commentaireDebat
    if (this.sup2) this.listeQuestions[this.listeQuestions.length - 1] += '<br><br>' + this.commentaireApprofondir

    listeQuestionsToContenu(this)
  }
}
