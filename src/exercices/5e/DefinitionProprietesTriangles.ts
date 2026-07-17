import { choixDeroulant } from '../../lib/customElements/ListeDeroulanteElement'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { combinaisonListes, shuffle } from '../../lib/outils/arrayOutils'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
} from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  'Connaitre les définitions et propriétés du triangle et des droites remarquables'

export const interactifReady = true
export const interactifType = 'liste-deroulante'

export const dateDePublication = '18/1/2025'
export const dateDeModifImportante = '25/04/2026' // Rémi Angot ajout interactivité

export const uuid = '043ca'
export const refs = {
  'fr-fr': [],
  'fr-ch': ['9ES2-14'],
}
/**
 * @author Rémi Angot
 */
export default class DefinitionProprietesTriangles extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 7
    this.sup = 8
    this.besoinFormulaireTexte = [
      'Type de questions',
      [
        'Nombres séparés par des tirets  :',
        '1 : Définition hauteur',
        '2 : Définition médiatrice',
        '3 : Propriété point de la médiatrice',
        '4 : Propriété point à égale distance des extrémités',
        "5 : Somme des angles d'un triangle",
        "6 : Somme des angles aigus d'un triangle rectangle",
        '7 : Inégalité triangulaire',
        '8 : Mélange',
      ].join('\n'),
    ]
    this.comment =
      'Le nombre effectif de questions ne peut pas être supérieur au nombre de types de questions choisis.'
  }

  nouvelleVersion() {
    const typesDeQuestionsDisponibles = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: 7,
      melange: 8,
      defaut: 8,
      nbQuestions: 7,
      enleveDoublons: true,
    }).map(Number)

    const listeTypeQuestions = combinaisonListes(
      [...new Set(typesDeQuestionsDisponibles)],
      this.nbQuestions,
    )

    this.consigne =
      Math.min(this.nbQuestions, typesDeQuestionsDisponibles.length) > 1
        ? 'Compléter les phrases suivantes.'
        : 'Compléter la phrase suivante.'

    for (
      let i = 0, cpt = 0;
      i < Math.min(this.nbQuestions, typesDeQuestionsDisponibles.length) &&
      cpt < 50;
    ) {
      let texte = ''
      let texteCorr = ''
      const choix = [
        { label: 'Choisir une réponse :', value: '' },
        {
          label: [1, 2, 5, 6, 7].includes(listeTypeQuestions[i])
            ? 'une droite passant par un sommet et perpendiculaire au côté opposé.'
            : 'ce point est une droite passant par un sommet et perpendiculaire au côté opposé.',
          value: '1',
        },
        {
          label: [1, 2, 5, 6, 7].includes(listeTypeQuestions[i])
            ? 'la droite perpendiculaire à ce segment et passant par son milieu.'
            : 'ce point est la droite perpendiculaire à ce segment et passant par son milieu.',
          value: '2',
        },
        {
          label: [1, 2, 5, 6, 7].includes(listeTypeQuestions[i])
            ? 'à égale distance des extrémités du segment.'
            : 'il est à égale distance des extrémités du segment.',
          value: '3',
        },
        {
          label: [1, 2, 5, 6, 7].includes(listeTypeQuestions[i])
            ? 'sur la médiatrice de ce segment.'
            : 'il est sur la médiatrice de ce segment.',
          value: '4',
        },
        {
          label: [1, 2, 5, 6, 7].includes(listeTypeQuestions[i])
            ? 'égale à 180°.'
            : 'il est égal à 180°.',
          value: '5',
        },
        {
          label: [1, 2, 5, 6, 7].includes(listeTypeQuestions[i])
            ? 'égale à 90°.'
            : 'il est égal à 90°.',
          value: '6',
        },
        {
          label: [1, 2, 5, 6, 7].includes(listeTypeQuestions[i])
            ? 'inférieure à la somme des longueurs des deux autres côtés.'
            : 'il est inférieur à la somme des longueurs des deux autres côtés.',
          value: '7',
        },
      ]
      const choixFinal = [choix[0], ...shuffle(choix.slice(1))]
      switch (listeTypeQuestions[i]) {
        case 1: // 'Définition hauteur'
          texte = 'Dans un triangle, une hauteur est '
          texteCorr =
            'Dans un triangle, une hauteur est une droite passant par un sommet et perpendiculaire au côté opposé.'
          break
        case 2: // 'Définition médiatrice'
          texte = "La médiatrice d'un segment est "
          texteCorr =
            "La médiatrice d'un segment est la droite perpendiculaire à ce segment et passant par son milieu."
          break
        case 3: // 'Propriété point de la médiatrice'
          texte = "Si un point est sur la médiatrice d'un segment, alors "
          texteCorr =
            "Si un point est sur la médiatrice d'un segment, alors il est à égale distance des extrémités du segment."
          break
        case 4: // 'Propriété point à égale distance des extrémités'
          texte =
            "Si un point est à égale distance des extrémités d'un segment, alors "
          texteCorr =
            "Si un point est à égale distance des extrémités d'un segment, alors il est sur la médiatrice de ce segment."
          break
        case 5: // 'Somme des angles d\'un triangle'
          texte = "La somme des angles d'un triangle est "
          texteCorr = "La somme des angles d'un triangle est égale à 180°."
          break
        case 6: // 'Somme des angles aigus d\'un triangle rectangle':
          texte = "La somme des angles aigus d'un triangle rectangle est "
          texteCorr =
            "La somme des angles aigus d'un triangle rectangle est égale à 90°."
          break
        case 7: // 'Inégalité triangulaire'
          texte = "Dans un triangle, la longueur d'un côté est "
          texteCorr =
            "Dans un triangle, la longueur d'un côté est inférieure à la somme des longueurs des deux autres côtés."
          break
      }
      if (this.interactif) {
        texte += choixDeroulant(this, i, { choices: choixFinal })
        handleAnswers(
          this,
          i,
          {
            reponse: {
              value: String(listeTypeQuestions[i]),
              options: { texteSansCasse: true },
            },
          },
          { formatInteractif: 'liste-deroulante' },
        )
      } else texte += '$\\ldots$'
      if (this.questionJamaisPosee(i, listeTypeQuestions[i])) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
