import { addMathaleaQcm } from '../../lib/customElements/MathaleaQcm'
import { choixDeroulant } from '../../lib/customElements/ListeDeroulanteElement'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { fonctionComparaison } from '../../lib/interactif/comparisonFunctions'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { ajouteChampTexte } from '../../lib/interactif/questionMathLive'
import { texteEnCouleurEtGras } from '../../lib/outils/embellissements'
import type { CompareFunction } from '../../lib/types'
import { context } from '../../modules/context'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
} from '../../modules/outils'
import Exercice from '../Exercice'

export const interactifReady = true

export const titre = "Trouver le nom d'un solide par ses caractéristiques"
export const uuid = '95371'
export const dateDePublication = '09/06/2026' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag
export const dateDeModificationImportante = '12/10/2026'
export const refs = {
  'fr-fr': ['6G8A-2', '6AutoE1-1'],
  'fr-ch': ['9ES2A-5', '10ES2A-7', '11ES2A-2'],
}

type Solide = {
  cle: string
  nom: string // Orthographe attendue, affichée dans les listes de choix et dans les messages
  reponses: string[] // Réponses acceptées sans remarque
  fautesToleres: string[] // Réponses acceptées mais signalées comme mal orthographiées
  texte: string
  texteCorr: string
}

// L'ordre de cette liste correspond aux numéros du paramètre « Solides à demander » : ne pas le modifier.
const solides: Solide[] = [
  {
    cle: 'cube',
    nom: 'cube',
    reponses: ['cube'],
    fautesToleres: ['qube'],
    texte:
      'Je suis un pavé droit dont toutes les arêtes sont de même longueur.',
    texteCorr: `Un pavé droit dont toutes les arêtes sont de même longueur est un ${texteEnCouleurEtGras('cube')}.`,
  },
  {
    cle: 'pave',
    nom: 'pavé droit',
    reponses: ['pavé droit', 'pavé'],
    fautesToleres: ['pave droit', 'pave', 'pavé doit', 'pavé droite'],
    texte:
      "Je possède le même nombre de faces, de sommets et d'arêtes que le cube, mais je ne suis pas toujours un cube.",
    texteCorr: `Le solide qui possède le même nombre de faces, de sommets et d'arêtes que le cube, sans pour autant être toujours un cube, c'est un ${texteEnCouleurEtGras('pavé droit')}.`,
  },
  {
    cle: 'prisme',
    nom: 'prisme droit',
    reponses: ['prisme droit', 'prisme'],
    fautesToleres: ['prime', 'prisme doit', 'prysme'],
    texte:
      'Je possède deux faces identiques parallèles, et toutes mes autres faces sont des rectangles, mais je ne suis pas un pavé droit.',
    texteCorr: `Le solide qui possède deux faces identiques parallèles et dont toutes les autres faces sont des rectangles (sans pour autant être un pavé droit) est un ${texteEnCouleurEtGras('prisme droit')}.`,
  },
  {
    cle: 'cylindre',
    nom: 'cylindre',
    reponses: ['cylindre'],
    fautesToleres: ['cilindre', 'silindre', 'cylindr'],
    texte:
      'Je possède deux faces identiques circulaires parallèles et une face courbe.',
    texteCorr: `Le solide qui possède deux faces identiques circulaires parallèles et une face courbe est un ${texteEnCouleurEtGras('cylindre')}.`,
  },
  {
    cle: 'pyramide',
    nom: 'pyramide',
    reponses: ['pyramide'],
    fautesToleres: ['piramide', 'pyramyde', 'pyramid'],
    texte: "J'ai une face de plus que le nombre de côtés de ma base.",
    texteCorr: `Le solide qui a une face de plus que le nombre de côtés de sa base est une ${texteEnCouleurEtGras('pyramide')}.`,
  },
  {
    cle: 'cone',
    nom: 'cône',
    reponses: ['cône'],
    fautesToleres: ['cone', 'conne'],
    texte: "J'ai un seul sommet.",
    texteCorr: `Le solide qui a un seul sommet est un ${texteEnCouleurEtGras('cône')}.`,
  },
  {
    cle: 'boule',
    nom: 'boule',
    reponses: ['boule', 'sphère'],
    fautesToleres: ['sphere', 'boulle'],
    texte: "Je n'ai ni sommet, ni arête, ni face.",
    texteCorr: `Le solide qui n'a ni sommet, ni arête, ni face est une ${texteEnCouleurEtGras('boule')}.`,
  },
]

// Propositions du QCM et de la liste déroulante : ordre alphabétique pour ne pas donner d'indice.
const solidesParOrdreAlphabetique = [...solides].sort((a, b) =>
  a.nom.localeCompare(b.nom, 'fr'),
)

/**
 * Compare la saisie aux réponses attendues puis, à défaut, à une liste de fautes d'orthographe tolérées.
 * Un « s » final en trop (cubes, pavés droits) est aussi toléré.
 * Une faute tolérée est acceptée (la question est réussie) mais la remarque invite à corriger l'orthographe.
 */
function compareAvecFautesToleres(solide: Solide): CompareFunction {
  return (saisie, reponse, options) => {
    const resultat = fonctionComparaison(saisie, reponse, options)
    if (resultat.isOk) return resultat
    const singulier = saisie.trim().replace(/s(?=\s|$)/gi, '')
    const faute =
      solide.fautesToleres.some(
        (mot) => fonctionComparaison(saisie, mot, options).isOk,
      ) ||
      (singulier !== '' &&
        singulier !== saisie.trim() &&
        [reponse, ...solide.fautesToleres].some(
          (mot) => fonctionComparaison(singulier, mot, options).isOk,
        ))
    return faute
      ? {
          isOk: true,
          feedback: `Attention à l'orthographe : écrire « ${solide.nom} ».`,
        }
      : resultat
  }
}

/**
 *
 * @author Mireille Gain
 */
export default class nomSolides extends Exercice {
  constructor() {
    super()
    this.consigne = ''
    this.nbQuestions = 5 // Nombre de questions par défaut
    this.besoinFormulaireTexte = [
      'Solides à demander',
      [
        'Nombres séparés par des tirets :',
        '1 : Cube',
        '2 : Pavé droit',
        '3 : Prisme droit',
        '4 : Cylindre',
        '5 : Pyramide',
        '6 : Cône',
        '7 : Boule',
        '8 : Mélange',
      ].join('\n'),
    ]
    this.sup = '8'
    this.besoinFormulaire2Numerique = [
      'Format de la réponse',
      3,
      '1 : Champ de saisie\n2 : Liste déroulante\n3 : QCM',
    ]
    this.sup2 = 1
  }

  nouvelleVersion() {
    this.consigne =
      this.nbQuestions === 1
        ? 'Parmi les solides étudiés au collège, donner le nom de celui qui est présenté ci-dessous.'
        : 'Parmi les solides étudiés au collège, donner le nom de chacun de ceux qui sont présentés ci-dessous.'
    this.spacing = 1.5
    this.spacingCorr = 1.5

    const listeCles = gestionnaireFormulaireTexte({
      min: 1,
      max: solides.length,
      defaut: solides.length + 1,
      melange: solides.length + 1,
      nbQuestions: this.nbQuestions,
      saisie: this.sup,
      listeOfCase: solides.map((s) => s.cle),
    }) as string[] // Tous les types de questions sont posés mais l'ordre diffère à chaque "cycle"

    for (let i = 0; i < this.nbQuestions; i++) {
      const solide = solides.find((s) => s.cle === listeCles[i]) as Solide
      let texte = solide.texte
      const texteCorr = solide.texteCorr
      if (this.sup2 === 3) {
        const propositions = solidesParOrdreAlphabetique.map((s) => ({
          texte: s.nom,
          statut: s.cle === solide.cle,
        }))
        const qcmOptions = { radio: true, vertical: false }
        handleAnswers(
          this,
          i,
          { qcm: { enonce: texte, propositions, options: qcmOptions } },
          { formatInteractif: 'mathalea-qcm' },
        )
        if (context.isHtml) {
          texte += addMathaleaQcm(this, i, {
            ...qcmOptions,
            interactivityOn: this.interactif,
          })
        } else if (!context.isAmc) {
          texte += propositionsQcm(this, i).texte
        }
      } else if (this.interactif && this.sup2 === 2) {
        texte += `<br>Je suis un/une ${choixDeroulant(this, i, {
          choices: [
            { label: '?', value: '' },
            ...solidesParOrdreAlphabetique.map((s) => ({
              label: s.nom,
              value: s.cle,
            })),
          ],
        })}.`
        handleAnswers(
          this,
          i,
          { reponse: { value: solide.cle } },
          { formatInteractif: 'liste-deroulante' },
        )
      } else if (this.interactif) {
        texte += `<br>${ajouteChampTexte(this, i, KeyboardType.alphanumeric, {
          texteAvant: 'Je suis un/une ',
          texteApres: '.',
        })}`
        handleAnswers(
          this,
          i,
          {
            reponse: {
              value: solide.reponses,
              options: { texteSansCasse: true },
              compare: compareAvecFautesToleres(solide),
            },
          },
          { formatInteractif: 'mathalea-textfield' },
        )
      }
      this.listeQuestions[i] = texte
      this.listeCorrections[i] = texteCorr
    }
    listeQuestionsToContenu(this) // On envoie l'exercice à la fonction de mise en page
  }
}
