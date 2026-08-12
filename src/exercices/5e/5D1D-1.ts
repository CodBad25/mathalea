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
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { choice, shuffle2tableaux } from '../../lib/outils/arrayOutils'
import { rangeMinMax } from '../../lib/outils/nombres'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenuSansNumero,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

export const interactifReady = true
export const interactifType = 'diagram-builder'
export const dateDePublication = '07/08/2026' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag
export const titre = 'Représenter des données par un diagramme'

/**
 * @author Jean-claude Lhote
 */
export const uuid = 'd3ba7'

export const refs = {
  'fr-fr': ['5D1D-1'],
  'fr-2016': [],
  'fr-ch': ['10FA3A-5'],
}
export default class ConstruireUnDiagramme2 extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireTexte = [
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
    this.sup4 = false
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
    this.sup = '3'
    this.sup2 = '1'
    this.sup3 = '1'
  }

  nouvelleVersion() {
    const baseNombreAnimaux = 20
    const listeNombreEspeces = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: 3,
      defaut: 0,
      nbQuestions: this.nbQuestions,
      melange: 0,
    }).map((v) => Number(v) + 1)
    const listeIndexValeursNumeriques = gestionnaireFormulaireTexte({
      saisie: this.sup2,
      min: 1,
      max: 2,
      defaut: 1,
      nbQuestions: this.nbQuestions,
      melange: 0,
    }).map(Number)
    const listeIndexTypeDeDiagrammes = gestionnaireFormulaireTexte({
      saisie: this.sup3,
      min: 1,
      max: 3,
      defaut: 1,
      nbQuestions: this.nbQuestions,
      melange: 0,
    }).map(Number)
    for (let i = 0; i < this.nbQuestions; i++) {
      let nom
      const contenutableau: number[] = []
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

      const nbAnimaux = listeNombreEspeces[i] // nombre d'animaux différents dans l'énoncé

      const lstCoeffAnimaux = [] // liste des effectifs de chaque animal sur 20
      lstCoeffAnimaux.push(baseNombreAnimaux)
      const max = Math.floor(baseNombreAnimaux / nbAnimaux)
      for (let k = 0; k < nbAnimaux - 1; k++) {
        let k1: number = choice(rangeMinMax(2, max, lstCoeffAnimaux))
        if (k1 === undefined || k1 === null) {
          k1 = choice(rangeMinMax(2, max))
        }
        lstCoeffAnimaux.push(k1)
        lstCoeffAnimaux[0] -= k1
      }

      const factor = randint(3, 6)

      switch (listeIndexValeursNumeriques[i]) {
        case 1:
          for (let k = 0; k < nbAnimaux; k++) {
            lstNombresAnimaux.push(lstCoeffAnimaux[k] * factor)
          }
          break
        case 2:
          for (let k = 0; k < nbAnimaux; k++) {
            lstNombresAnimaux.push(lstCoeffAnimaux[k] * factor * 10)
          }
          break
      }
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
        contenutableau.push(lstNombresAnimaux[k])
      }
      contenutableau.push(effectiftotal)
      texte += `${tableauColonneLigne(entete, ['\\text{Effectifs}'], contenutableau.map(String))}<br><br>`
      // On mélange les données pour en changer l'ordre (pour tous les cas)
      shuffle2tableaux(lstAnimauxExo, lstNombresAnimaux)
      let expectedAnswer: string = ''
      switch (listeIndexTypeDeDiagrammes[i]) {
        case 2:
        case 1: {
          // diagramme circulaire
          const shape = listeIndexTypeDeDiagrammes[i] === 1 ? 'pie' : 'semi-pie'
          const targetAngle = shape === 'pie' ? 360 : 180
          const emptyValues = {
            items: lstAnimauxExo.map((animal) =>
              Object.assign({}, { label: animal, effectif: 0, angle: 0 }),
            ),
            mode: 'angle' as PieAssessmentMode,
            shape: shape as PieAssessmentShape,
            targetAngle,
            infosStatus: this.sup4,
            interactivityOn: true,
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
            infosStatus: this.sup4,
            interactivityOn: false,
          }
          expectedAnswer = JSON.stringify(value)
          texte +=
            'Représenter ces données par un diagramme circulaire.<br><br>' +
            addDiagramPieAssessment(this, i, emptyValues)
          texteCorr = `Le diagramme circulaire correspondant est le suivant :<br><br>${addDiagramPieAssessment(this, i, value)}`

          break
        }
        case 3:
        default: {
          // diagramme en bâtons
          const valMax = Math.max(...lstNombresAnimaux)
          const unitValue = listeIndexValeursNumeriques[i] === 1 ? 20 : 200
          // Ces values sont là en guise d'exemples d'utilisation de l'élément pour différents scénarios.
          // value1 demandera de choisir le label à partir de la donnée de la hauteur des barres (le graphique est déjà construit mais les labels sont anonymes)
          // value2 demandera de donner l'effectif (on suppose que vous avez donné les hauteurs des barres dans l'énoncé, le diagramme se construit au fur et à mesure à partir des effectifs)
          /*   const value1 = {
            unitValue,
            unitLabel: `individus`,
            yMax: Math.ceil(valMax / unitValue) * unitValue,
            mode: 'label' as BarAssessmentMode,
            labelValueKind: 'hauteur' as const,
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
          const value2 = {
            unitValue,
            unitLabel: `individus`,
            yMax: Math.ceil(valMax / unitValue) * unitValue,
            mode: 'effectif' as BarAssessmentMode,
            infosStatus: this.sup4,
            interactivityOn: true,
            items: shuffle(lstAnimauxExo.map((animal) => ({ label: animal }))),
          }
            */
          const emptyValues = {
            unitValue,
            unitLabel: `individus`,
            yMax: Math.ceil(valMax / unitValue) * unitValue,
            mode: 'hauteur' as BarAssessmentMode,
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
            yMax: Math.ceil(valMax / unitValue) * unitValue,
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
            addDiagramBarAssessment(this, i, emptyValues)
          texteCorr = `Le diagramme en bâtons correspondant est le suivant :<br><br>${addDiagramBarAssessment(this, i, value)}`
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
            listeIndexTypeDeDiagrammes[i] === 1 ||
            listeIndexTypeDeDiagrammes[i] === 2
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
