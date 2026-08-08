import { tableauColonneLigne } from '../../lib/2d/tableau'
import { addDiagramBuilder } from '../../lib/customElements/DiagramBuilderElement'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { choice } from '../../lib/outils/arrayOutils'
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
  'fr-fr': [],
  'fr-2016': [],
  'fr-ch': [],
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
      '0 : Mélange\n1 : Diagramme circulaire\n2 : Diagramme semi-circulaire\n3 : Diagramme en bâtons\n4 : Diagramme cartésien',
    ]
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
      max: 4,
      defaut: 1,
      nbQuestions: this.nbQuestions,
      melange: 0,
    }).map(Number)
    for (let i = 0; i < this.nbQuestions; i++) {
      let nom
      let texte
      let texteCorr
      const contenutableau: number[] = []
      const lstAnimauxExo: string[] = [] // liste des animaux uniquement cités dans l'exercice
      const lstNombresAnimaux: number[] = [] // liste des effectifs de chaque animal

      let paramsEnonce, paramsCorrection, coef, r, lstElementGraph, g
      const objetsEnonce = []
      const objetsCorrection = []
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

      texte =
        'Dans le parc naturel de ' +
        choice(lstNomParc) +
        ", il y a beaucoup d'animaux.<br> Voici un tableau qui donne le nombre d'individus de quelques espèces.<br><br>"
      texteCorr = ''
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

      let emptyValues: string[] = []
      switch (listeIndexTypeDeDiagrammes[i]) {
        case 1:
          emptyValues = new Array(2 * nbAnimaux).fill('', 0, 2 * nbAnimaux)
          texte += `${tableauColonneLigne(entete, ['\\text{Effectifs}'], lstNombresAnimaux.map(String).concat(emptyValues))}<br><br>`
          texte +=
            'Représenter ces données par un diagramme circulaire.<br><br>'
          entete.push('\\text{Totaux}')
          for (let k = 0; k < nbAnimaux; k++) {
            contenutableau.push(lstNombresAnimaux[k])
          }
          contenutableau.push(effectiftotal)
      }
      texte += addDiagramBuilder(this, i, {})
      handleAnswers(
        this,
        i,
        { reponse: { value: '' } },
        { formatInteractif: 'diagram-builder' },
      )
      this.listeQuestions.push(texte)
      this.listeCorrections.push(texteCorr)
      listeQuestionsToContenuSansNumero(this) // On envoie l'exercice à la fonction de mise en page
    }
  }
}
