import { tableauColonneLigne } from '../../lib/2d/tableau'
import {
  addDiagramBarAssessment,
  type BarAssessmentMode,
} from '../../lib/customElements/DiagramBarAssessmentElement'
import {
  addDiagramPieAssessment,
  type PieAssessmentMode,
  type PieAssessmentShape,
} from '../../lib/customElements/DiagramPieAssessmentElement'
import {
  lireFormulaireComplexe,
  serialiseFormulaireComplexe,
  valeursParDefaut,
  type FormulaireComplexe,
} from '../../lib/formulaireComplexe'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { choice, shuffle2tableaux } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import {
  listeQuestionsToContenuSansNumero,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

export const interactifReady = true
export const interactifType = 'diagram-builder'
export const dateDePublication = '07/08/2026' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag
export const titre = 'Représenter des données par un diagramme'

const leSuperFormulaire: FormulaireComplexe = {
  champs: [
    {
      type: 'selection',
      nom: 'nbEspeces',
      label: "Nombre d'espèces différentes",
      options: [
        { valeur: '1', label: 'Deux espèces' },
        { valeur: '2', label: 'Trois espèces' },
        { valeur: '3', label: 'Quatre espèces' },
      ],
      defaut: '3',
    },
    {
      type: 'selection',
      nom: 'nombres',
      label: 'Valeurs numériques',
      options: [
        { valeur: '1', label: 'Entre 1 et 100' },
        { valeur: '2', label: 'Entre 100 et 1 000' },
      ],
      defaut: '1',
    },
    {
      type: 'selection',
      nom: 'diagramme',
      label: 'Type de diagramme',
      options: [
        { valeur: '1', label: 'Diagramme circulaire' },
        { valeur: '2', label: 'Diagramme semi-circulaire' },
        { valeur: '3', label: 'Diagramme en bâtons' },
      ],
      defaut: '1',
    },
    {
      type: 'case',
      nom: 'status',
      label: "Avec aide pour l'intéractivité (affiche le status du graphique)",
      defaut: false,
    },
    {
      type: 'case',
      nom: 'melange',
      label: 'Noms des animaux mélangés',
      defaut: false,
    },
    {
      type: 'case',
      nom: 'coloration',
      label: 'Avec de la couleur en version imprimable',
      defaut: false,
    },
  ],
}

/**
 * @author Jean-claude Lhote
 */
export const uuid = 'd3ba7'

export const refs = {
  'fr-fr': ['5D1D-1'],
  'fr-2016': [],
  'fr-ch': ['10FA3A-5'],
}

function shuffleNumbers(values: number[]): number[] {
  const shuffled = [...values]
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = randint(0, index)
    const value = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = value
  }
  return shuffled
}

function repartitionsPositivesDistinctes(
  total: number,
  nbParts: number,
): number[][] {
  const repartitions: number[][] = []

  function ajoutePart(
    depart: number,
    partsRestantes: number,
    reste: number,
    parts: number[],
  ) {
    if (partsRestantes === 0) {
      if (reste === 0) repartitions.push([...parts])
      return
    }

    for (let valeur = depart; valeur <= reste; valeur++) {
      parts.push(valeur)
      ajoutePart(valeur + 1, partsRestantes - 1, reste - valeur, parts)
      parts.pop()
    }
  }

  ajoutePart(1, nbParts, total, [])
  return repartitions
}

function effectifsBasePourDiagrammeCirculaire(nbAnimaux: number): number[] {
  const candidats = [2, 3, 4, 6, 9, 12, 15].flatMap((denominateur) =>
    repartitionsPositivesDistinctes(denominateur, nbAnimaux).flatMap(
      (parts) => {
        const maxPart = Math.max(...parts)
        const facteurMax = Math.floor(20 / maxPart)
        const facteurMin = Math.ceil(10 / denominateur)
        const repartitions: number[][] = []

        for (let facteur = facteurMin; facteur <= facteurMax; facteur++) {
          const effectifs = parts.map((part) => part * facteur)
          const total = effectifs.reduce(
            (somme, effectif) => somme + effectif,
            0,
          )
          const anglesEntiers = effectifs.every(
            (effectif) =>
              (360 * effectif) % total === 0 && (180 * effectif) % total === 0,
          )
          if (anglesEntiers) repartitions.push(shuffleNumbers(effectifs))
        }

        return repartitions
      },
    ),
  )

  return choice(candidats)
}

function effectifsBasePourDiagrammeEnBarres(nbAnimaux: number): number[] {
  return shuffleNumbers([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]).slice(
    0,
    nbAnimaux,
  )
}

export default class ConstruireUnDiagramme2 extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireComplexe = leSuperFormulaire
    this.sup = serialiseFormulaireComplexe(
      leSuperFormulaire,
      valeursParDefaut(leSuperFormulaire),
    )
    /*   this.besoinFormulaireTexte = [
      "Nombre d'espèces différentes",
      '0 : Mélange\n1 : Deux espèces\n2 : Trois espèces\n3 : Quatre espèces',
    ]
    this.besoinFormulaire2Texte = [
      'Valeurs numériques',
      '0 : Mélange\n1 : Entre 1 et 100\n2 : Entre 100 et 1 000',
    ]
    this.besoinFormulaire3Texte = [
      'Type de diagramme',
      '0 : Mélange\n1 : Diagramme circulaire\n2 : Diagramme semi-circulaire\n3 : Diagramme en bâtons',
    ]
    this.besoinFormulaire4CaseACocher = [
      'Afficher le status du graphique',
      false,
    ]
      */

    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    const params = lireFormulaireComplexe(leSuperFormulaire, this.sup)
    const listeNombreEspeces =
      params.selection('nbEspeces') === '0'
        ? 4
        : Number(params.selection('nbEspeces')) + 1
    const indexValeursNumeriques =
      params.selection('nombres') === '0'
        ? 1
        : Number(params.selection('nombres'))
    const typeDeDiagramme =
      params.selection('diagramme') === '0'
        ? 1
        : Number(params.selection('diagramme'))
    const statusOn = params.case('status')
    const melangeOn = params.case('melange')
    const colorOn = params.case('coloration')

    for (let i = 0; i < this.nbQuestions; i++) {
      let nom
      const contenutableau: string[] = []
      const lstAnimauxExo: string[] = [] // liste des animaux uniquement cités dans l'exercice
      const lstNombresAnimaux: number[] = [] // liste des effectifs de chaque animal

      const lstAnimaux = [
        'girafes',
        'zèbres',
        'buffles',
        'gazelles',
        'crocodiles',
        'rhinocéros',
        'léopards',
        'guépards',
        'hyènes',
      ]
      const lstNomParc = [
        'Dramve',
        'Fatenmin',
        'Batderfa',
        'Vihi',
        'Genser',
        'Barbetdou',
        'Dramrendu',
        'Secai',
        'Cipeudram',
        'Cigel',
        'Lisino',
        'Fohenlan',
        'Farnfoss',
        'Kinecardine',
        'Zeffari',
        'Barmwich',
        'Swadlincote',
        'Swordbreak',
        'Loshull',
        'Ruyron',
        'Fluasall',
        'Blueross',
        'Vlane',
      ]

      let texte =
        'Dans le parc naturel de ' +
        choice(lstNomParc) +
        ", il y a beaucoup d'animaux.<br> Voici un tableau qui donne le nombre d'individus de quelques espèces.<br><br>"
      let texteCorr = ''
      const entete = ['\\text{Animaux}']

      const nbAnimaux = listeNombreEspeces // nombre d'animaux différents dans l'énoncé

      const effectifsBase =
        typeDeDiagramme === 1 || typeDeDiagramme === 2
          ? effectifsBasePourDiagrammeCirculaire(nbAnimaux)
          : effectifsBasePourDiagrammeEnBarres(nbAnimaux)
      const facteurValeurs = indexValeursNumeriques === 1 ? 1 : 10
      lstNombresAnimaux.push(
        ...effectifsBase.map((effectif) => effectif * facteurValeurs),
      )
      let effectiftotal = 0
      for (let k = 0; k < nbAnimaux; k++) {
        effectiftotal += lstNombresAnimaux[k]
      }
      for (let k = 0; k < nbAnimaux; k++) {
        nom = choice(lstAnimaux, lstAnimauxExo) // choisit un animal au hasard sauf parmi ceux déjà utilisés
        lstAnimauxExo.push(nom)
        entete.push(`\\text{${nom}}`)
      }

      entete.push('\\text{Total}')
      for (let k = 0; k < nbAnimaux; k++) {
        contenutableau.push(texNombre(lstNombresAnimaux[k], 0))
      }
      contenutableau.push(texNombre(effectiftotal, 0))
      texte += `${tableauColonneLigne(entete, ['\\text{Effectifs}'], contenutableau.map(String))}<br><br>`
      // On mélange les données pour en changer l'ordre (pour tous les cas)
      if (melangeOn) {
        shuffle2tableaux(lstAnimauxExo, lstNombresAnimaux)
      }
      let expectedAnswer: string = ''
      switch (typeDeDiagramme) {
        case 2:
        case 1: {
          // diagramme circulaire
          const shape = typeDeDiagramme === 1 ? 'pie' : 'semi-pie'
          const targetAngle = shape === 'pie' ? 360 : 180
          const emptyValues = {
            items: lstAnimauxExo.map((animal) =>
              Object.assign({}, { label: animal, effectif: null, angle: null }),
            ),
            mode: 'angle' as PieAssessmentMode,
            shape: shape as PieAssessmentShape,
            targetAngle,
            infosStatus: statusOn,
            interactivityOn: this.interactif,
            colorOn,
          }
          const value = {
            items: lstAnimauxExo.map((animal, index) =>
              Object.assign(
                {},
                {
                  label: animal,
                  effectif: lstNombresAnimaux[index],
                  angle:
                    (targetAngle * lstNombresAnimaux[index]) / effectiftotal,
                },
              ),
            ),
            mode: 'angle' as PieAssessmentMode,
            shape: shape as PieAssessmentShape,
            targetAngle,
            infosStatus: statusOn,
            interactivityOn: false,
            colorOn,
            correctionOn: true,
          }
          expectedAnswer = JSON.stringify(value)
          texte +=
            'Représenter ces données par un diagramme circulaire.<br><br>' +
            addDiagramPieAssessment(this, i, emptyValues)
          texteCorr = `Pour réaliser le diagramme ${targetAngle === 360 ? 'circulaire' : 'semi-circulaire'}, on calcule l'angle de chaque secteur proportionnellement à l'effectif de chaque animal par rapport à l'effectif total.<br>
          Il y a ${effectiftotal} animaux au total, donc l'angle de chaque secteur est calculé par la formule :<br>
          $\\text{angle du secteur} = \\dfrac{\\text{effectif de l'animal}}{${effectiftotal}} \\times ${targetAngle}^\\circ$.<br>
          Ce qui donne les angles suivants :<br>
          ${lstNombresAnimaux.map((effectif, index) => `${lstAnimauxExo[index]} : $\\dfrac{${effectif}}{${effectiftotal}}\\times ${targetAngle}^\\circ = ${miseEnEvidence(texNombre((targetAngle * effectif) / effectiftotal, 0))}^\\circ$`).join('<br><br>')}<br>
          Le diagramme circulaire correspondant est le suivant :<br><br>${addDiagramPieAssessment(this, i, value)}`

          break
        }
        case 3:
        default: {
          // diagramme en bâtons
          const valMax = Math.max(...lstNombresAnimaux)
          const unitValue = indexValeursNumeriques === 1 ? 20 : 200

          const emptyValues = {
            unitValue,
            unitLabel: `individus`,
            yMax: Math.ceil(valMax / unitValue) * unitValue,
            mode: 'hauteur' as BarAssessmentMode,
            infosStatus: statusOn,
            interactivityOn: this.interactif,
            colorOn,
            items: lstAnimauxExo.map((animal, index) =>
              Object.assign(
                {},
                {
                  label: animal,
                  effectif: this.interactif ? lstNombresAnimaux[index] : null,
                  height: this.interactif
                    ? lstNombresAnimaux[index] / unitValue
                    : null,
                },
              ),
            ),
          }
          const value = {
            unitValue,
            unitLabel: `individus`,
            yMax: Math.ceil(valMax / unitValue) * unitValue,
            mode: 'hauteur' as BarAssessmentMode,
            labelValueKind: 'hauteur' as const,
            infosStatus: statusOn,
            interactivityOn: false,
            colorOn,
            correctionOn: true,
            items: lstAnimauxExo.map((animal, index) =>
              Object.assign(
                {},
                {
                  label: animal,
                  effectif: lstNombresAnimaux[index],
                  height: lstNombresAnimaux[index] / unitValue,
                },
              ),
            ),
          }
          expectedAnswer = JSON.stringify(value)
          texte +=
            `Représenter ces données par un diagramme en bâtons (une unité représente ${unitValue} individus).<br><br>` +
            addDiagramBarAssessment(this, i, emptyValues)
          texteCorr = `Pour réaliser le diagramme en bâtons, on calcule la hauteur de chaque barre proportionnellement à l'effectif de chaque animal par rapport à l'unité choisie.<br>
          Ce qui donne les hauteurs suivantes :<br>
          ${lstNombresAnimaux.map((effectif, index) => `${lstAnimauxExo[index]} : $\\dfrac{${effectif}}{${unitValue}} = ${miseEnEvidence(texNombre(effectif / unitValue, 2))}$ unité(s)`).join('<br><br>')}<br>
          Le diagramme en bâtons correspondant est le suivant :<br><br>${addDiagramBarAssessment(this, i, value)}`
          break
        }
        // Ce cas n'a aucun intérêt ici c'est juste pour illustrer le payload du diagramme cartésien inutilisé dans cet exercice
        /*   case 4: {
          const valMax = Math.max(...lstNombresAnimaux)
          const unitValue = listeIndexValeursNumeriques[i] === 1 ? 20 : 200
          const emptyValues = {
            unitValue,
            unitLabel: `individus`,
            xMin: 0,
            xMax: 5,
            yMin: 0,
            yMax: Math.ceil(valMax / unitValue) * unitValue,
            points: lstAnimauxExo.map((animal, index) =>
              Object.assign({}, { label: animal, x: null, y: null }),
            ),
            infosStatus: this.sup4,
            interactivityOn: true,
            items: lstAnimauxExo.map((animal, index) =>
              Object.assign(
                {},
                {
                  label: animal,
                  height: lstNombresAnimaux[index] / unitValue,
                },
              ),
            ),
          }
          const value = {
            unitValue,
            unitLabel: `individus`,
            xMin: 0,
            xMax: 5,
            yMin: 0,
            yMax: Math.ceil(valMax / unitValue) * unitValue,
            points: lstAnimauxExo.map((animal, index) =>
              Object.assign(
                {},
                {
                  label: animal,
                  x: index,
                  y: lstNombresAnimaux[index] / unitValue,
                },
              ),
            ),
            mode: 'hauteur' as BarAssessmentMode,
            labelValueKind: 'hauteur' as const,
            infosStatus: this.sup4,
            interactivityOn: false,
            items: lstAnimauxExo.map((animal, index) =>
              Object.assign(
                {},
                {
                  label: animal,
                  effectif: lstNombresAnimaux[index],
                  height: lstNombresAnimaux[index] / unitValue,
                },
              ),
            ),
          }
          expectedAnswer = JSON.stringify(value)
          texte +=
            `Représenter ces données par un diagramme en bâtons (une unité représente ${unitValue} individus).<br><br>` +
            addDiagramCartesianAssessment(this, i, emptyValues)
          texteCorr = `Le diagramme en bâtons correspondant est le suivant :<br><br>${addDiagramCartesianAssessment(this, i, value)}`
        }
          */
      }
      handleAnswers(
        this,
        i,
        { reponse: { value: expectedAnswer } },
        {
          formatInteractif:
            typeDeDiagramme === 1 || typeDeDiagramme === 2
              ? 'diagram-pie-assessment'
              : 'diagram-bar-assessment',
        },
      )
      this.listeQuestions.push(texte)
      this.listeCorrections.push(texteCorr)
      listeQuestionsToContenuSansNumero(this) // On envoie l'exercice à la fonction de mise en page
    }
  }
}
