import {
  miseEnEvidence,
  texteGras,
  texteItalique,
} from '../../lib/outils/embellissements'
import { ajouterLien } from '../../lib/outils/enrichissements'
import { context } from '../../modules/context'
import { listeQuestionsToContenu } from '../../modules/outils'
import ExerciceVraiFaux from '../ExerciceVraiFaux'

export const titre = 'Un mur bien droit ? (théorème de Pythagore)'
export const dateDePublication = '15/07/2026'
export const interactifReady = true

export const uuid = 'e9ee9'
export const refs = {
  'fr-fr': ['EgaliteFG3-4e-8'],
  'fr-ch': [],
}

export const tags = ['égalité filles-garçons']

/**
 * @author Sur le chemin de l'égalité en mathématiques pour tous les élèves - Académie de Versailles
 * Transcription par Lydie El-Halougi
 */
export default class EgaliteFG8 extends ExerciceVraiFaux {
  commentaireDebat = ''
  commentaireApprofondir = ''

  constructor() {
    super()
    this.pasDeVersionAleatoire = true
    this.consigne = texteItalique(
      "D'après " +
        ajouterLien(
          'https://nuage03.apps.education.fr/index.php/s/NZgmoFpcSCW8Cag?dir=/&editing=false&openfile=true',
          "« Sur le chemin de l'égalité en mathématiques pour tous les élèves » - Académie de Versailles",
        ),
    )
    this.consigne +=
      '<br><br>Au lycée professionnel, deux groupes sont missionnés pour construire un mur :<br>' +
      '$\\bullet$ Le groupe 1 est composé de Léa et Daniel.<br>' +
      "$\\bullet$ Le groupe 2 est composé d'Enzo et Anita.<br><br>" +
      "En tant que futurs maçons, les deux groupes doivent construire chacun un mur. Leur professeure, Mme Ecker, doit vérifier si chaque mur est bien « droit », c'est-à-dire perpendiculaire au sol. La professeure a un seul outil : un mètre ruban. Pour chaque mur, elle choisit trois points :<br>" +
      '$\\bullet$ Un point $I$ au pied du mur,<br>' +
      '$\\bullet$ Un point $H$ situé à $60\\text{ cm}$ au-dessus de $I$ sur le mur,<br>' +
      '$\\bullet$ Un point $S$ au sol, à $80\\text{ cm}$ de $I$.<br><br>' +
      'Ensuite, elle mesure la distance $HS$.<br>' +
      (context.isHtml
        ? '<div class="not-prose" style="text-align:center; margin: 0.75rem 0;"><img src="/alea/images/egalite/mur-equerrage.jpg" alt="Contrôle d\'équerrage d\'un mur avec les points H, I, S" style="max-width:200px; width:100%; height:auto;"></div>'
        : '') +
      'Voici les résultats obtenus :<br>' +
      '$\\bullet$ Pour le mur du groupe 1 (Léa et Daniel), la distance $HS$ est de $1$ mètre.<br>' +
      '$\\bullet$ Pour le mur du groupe 2 (Enzo et Anita), la distance $HS$ est de $95\\text{ cm}$.'
    this.nbQuestions = 2
    this.nbQuestionsModifiable = false
    this.commentaireDebat =
      texteGras('Pour débattre') +
      '.<br>Pensez-vous que le métier de maçon est réservé uniquement aux hommes ?<br>Plus généralement, que pensez-vous de la place des femmes dans les métiers du bâtiment ?'
    this.besoinFormulaireCaseACocher = ['Afficher « Pour débattre »', true]
    this.sup = true
    this.commentaireApprofondir =
      texteGras('Pour aller plus loin') +
      ".<br>Pour en savoir plus sur le métier de maçon et découvrir qu'il est accessible à toutes et à tous, vous pouvez consulter " +
      ajouterLien(
        'https://www.onisep.fr/ressources/univers-metier/metiers/macon-maconne',
        "cette fiche métier complète proposée par l'Onisep",
      ) +
      '.'
    this.besoinFormulaire2CaseACocher = [
      'Afficher « Pour aller plus loin »',
      true,
    ]
    this.sup2 = true
    this.affirmations = [
      {
        texte:
          'Le mur du groupe 1 (Léa et Daniel) est bien perpendiculaire au sol.',
        statut: true,
        correction: `Si le mur était perpendiculaire au sol, le triangle $HIS$ serait rectangle en $I$, et on aurait $HS^2=HI^2+IS^2=60^2+80^2=3\\,600+6\\,400=10\\,000$, soit $HS=\\sqrt{10\\,000}=100\\text{ cm}=1\\text{ m}$.<br>Or on mesure bien $HS=1\\text{ m}$ : d'après la réciproque du théorème de Pythagore, le triangle $HIS$ est rectangle en $I$, donc $${miseEnEvidence('\\text{le mur du groupe 1 est bien perpendiculaire au sol}')}$.`,
      },
      {
        texte:
          'Le mur du groupe 2 (Enzo et Anita) est bien perpendiculaire au sol.',
        statut: false,
        correction: `Si le mur était perpendiculaire au sol, on aurait $HS=100\\text{ cm}$ (voir calcul ci-dessus). Or on mesure $HS=95\\text{ cm}\\neq 100\\text{ cm}$ : le triangle $HIS$ n'est donc pas rectangle en $I$, et $${miseEnEvidence("\\text{le mur du groupe 2 n'est pas perpendiculaire au sol}")}$.`,
      },
    ]
  }

  nouvelleVersion() {
    const introConsigne = this.consigne
    super.nouvelleVersion()
    this.consigne = introConsigne + '<br><br>' + this.consigne
    if (this.sup)
      this.listeQuestions[this.listeQuestions.length - 1] +=
        '<br><br>' + this.commentaireDebat
    if (this.sup2)
      this.listeQuestions[this.listeQuestions.length - 1] +=
        '<br><br>' + this.commentaireApprofondir

    listeQuestionsToContenu(this)
  }
}
