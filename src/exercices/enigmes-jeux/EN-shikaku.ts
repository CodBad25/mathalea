import Figure from 'apigeom'
import remove from 'apigeom/src/assets/svg/restart.svg'
import type { Coords } from 'apigeom/src/elements/calculus/Coords'
import {
  orangeMathalea,
  orangeMathaleaLight,
} from 'apigeom/src/elements/defaultValues'
import figureApigeom from '../../lib/figureApigeom'
import { choice } from '../../lib/outils/arrayOutils'
import { range1 } from '../../lib/outils/nombres'
import { context } from '../../modules/context'
import { randint } from '../../modules/outils'
import Exercice from '../Exercice'
import bluePolygon from './svg/bluePolygon.svg'

export const dateDePublication = '31/07/2024'
export const dateDeModifImportante = '03/09/2024'
export const titre = 'Résoudre une grille de Shikaku'
export const interactifReady = true
export const interactifType = 'custom'

/** Résoudre une grille de Shikaku
 * @author Éric Elter
 * Soutenu par Rémi Angot pour l'aide pour le développement avec ApiGeom
 */

export const uuid = 'ccf19'
export const refs = {
  'fr-fr': ['EN-Shikaku'],
  'fr-ch': [],
}

type Cell = {
  value: number | string
  regionId: number
}

type Rectangle = {
  topLeft: [number, number]
  bottomRight: [number, number]
}

export default class shikaku extends Exercice {
  // On déclare des propriétés supplémentaires pour cet exercice afin de pouvoir les réutiliser dans la correction
  figure!: Figure
  figureCorrection!: Figure
  goodAnswers: Array<Coords[]>
  longueur: number
  largeur: number

  constructor() {
    super()
    this.goodAnswers = []
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false

    this.exoCustomResultat = true
    this.besoinFormulaireTexte = [
      'Hauteur de la grille',
      'Choisir un nombre entier entre 2 et 15.',
    ]
    this.besoinFormulaire2Texte = [
      'Longueur de la grille',
      'Choisir un nombre entier entre 2 et 15.',
    ]
    this.besoinFormulaire3Texte = [
      'Nombre minimum de rectangles ou carrés',
      ' Choisir un nombre entier.',
    ]
    this.sup = 5
    this.sup2 = 5
    this.sup3 = 3
    this.longueur = this.sup
    this.largeur = this.sup2
  }

  nouvelleVersion(): void {
    this.consigne =
      'Cette grille de Shikaku doit être divisée en rectangles ou carrés, chacun contenant un seul nombre. Le nombre indique le nombre de cases que doit contenir le rectangle ou le carré. '
    this.consigne +=
      'Tous les rectangles et carrés doivent se toucher par leurs côtés et remplir la grille entière sans chevauchement. '
    this.consigne +=
      '<br>Pour être certain que rien ne se chevauche, les rectangles et carrés doivent tous avoir strictement la même couleur de fond. '
    this.comment =
      'Grâce au choix de la longueur et de la hauteur de la grille, vous pouvez graduer la difficulté des grilles SquarO proposés.'
    this.comment +=
      '<br>Si vous précisez un nombre minimum de rectangles ou carrés, alors si ce nombre minimum est trop élevé pour créer une grille pertinente pour la taille demandée, il ne sera pas pris en compte.'
    this.longueur = Math.max(2, Math.min(parseInt(this.sup), 15)) || 2
    this.largeur = Math.max(2, Math.min(parseInt(this.sup2), 15)) || 2
    // Quand on duplique un exercice le numeroExercice ne semble pas se mettre à jour
    this.figure = new Figure({
      xMin: -0.25, // On enlève 0.25 unités
      yMin: -0.25,
      // width: this.longueur * 30 + 20, // On ajoute 20 pixels
      // height: this.largeur * 30 + 20,
      height: this.longueur * 30 + 20, // On ajoute 20 pixels
      width: this.largeur * 30 + 20,
      border: false,
    })
    this.figure.create('Grid', {
      strokeWidthGrid: 1,
      color: 'black',
      yMin: 0,
      // yMax: this.largeur,
      // xMax: this.longueur,
      xMax: this.largeur,
      yMax: this.longueur,
      xMin: 0,
      axeX: false,
      axeY: false,
      labelX: false,
      labelY: false,
    })
    this.figure.snapGrid = true
    this.figure.options.color = 'blue'
    this.figure.options.shape = 'o'
    this.figure.options.labelIsVisible = false
    this.figure.options.gridWithTwoPointsOnSamePosition = false // Pour éviter que deux points aient la même position
    this.figure.setToolbar({ tools: ['DRAG', 'REMOVE'], position: 'top' })

    // Figure correction
    this.figureCorrection = new Figure({
      xMin: -0.25,
      yMin: -0.25,
      // width: this.longueur * 30 + 20, // On ajoute 20 pixels
      // height: this.largeur * 30 + 20,
      height: this.longueur * 30 + 20, // On ajoute 20 pixels
      width: this.largeur * 30 + 20,
      border: false,
    })
    this.figureCorrection.create('Grid', {
      strokeWidthGrid: 1,
      color: 'black',
      yMin: 0,
      // yMax: this.largeur,
      // xMax: this.longueur,
      xMax: this.largeur,
      yMax: this.longueur,
      xMin: 0,
      axeX: false,
      axeY: false,
      labelX: false,
      labelY: false,
    })
    this.figureCorrection.snapGrid = true
    this.figureCorrection.options.color = 'red'
    this.figureCorrection.options.shape = 'o'
    this.figureCorrection.options.labelIsVisible = false

    const drawBluePolygon = () => {
      this.figure.options.tmpShape = 'o'
      this.figure.options.shape = '' // inutile car valeur par défaut
      this.figure.options.tmpColor = 'blue'
      this.figure.options.colorPointPolygon = 'none'
      this.figure.options.color = orangeMathalea
      this.figure.options.thickness = 3
      this.figure.options.tmpFillColor = 'blue'
      this.figure.options.fillColor = orangeMathalea
      this.figure.ui?.send({ type: 'POLYGON' })
    }
    const eraseAllPoints = () => {
      for (const element of this.figure.elements.values()) {
        if (element.type === 'Point') {
          element.remove()
        }
      }
      this.figure.saveState()
    }
    this.figure.addCustomButton({
      action: drawBluePolygon,
      tooltip: 'Dessiner un polygone bleu',
      url: bluePolygon,
    })
    this.figure.addCustomButton({
      action: eraseAllPoints,
      tooltip: 'Effacer tous les points',
      url: remove,
    })
    const emplacementPourFigure = figureApigeom({
      exercice: this,
      i: 0,
      figure: this.figure,
    })
    this.goodAnswers = []
    const rows = this.largeur
    const cols = this.longueur
    let regionIdCounter = 1

    // Processus de création d'une grille
    let grid: Cell[][]
    let rectangles: Rectangle[]

    function isValidPlacement(
      row: number,
      col: number,
      height: number,
      width: number,
    ): boolean {
      if (row + height > rows || col + width > cols) return false
      for (let r = row; r < row + height; r++) {
        for (let c = col; c < col + width; c++) {
          if (grid[r][c].value !== -1) return false
        }
      }
      return true
    }
    function placeRegion(
      row: number,
      col: number,
      height: number,
      width: number,
    ): void {
      const value = height * width
      const dejaMis = [] as number[]
      for (let r = row; r < row + height; r++) {
        for (let c = col; c < col + width; c++) {
          const pourComparerAAire = choice(range1(value, dejaMis))
          grid[r][c] = {
            value: pourComparerAAire === value ? value : '',
            regionId: regionIdCounter,
          }
          dejaMis.push(pourComparerAAire)
        }
      }
      // rectangles.push({ topLeft: [col, row], bottomRight: [col + width - 1, row + height - 1] })
      rectangles.push({
        topLeft: [row, col],
        bottomRight: [row + height - 1, col + width - 1],
      })
      regionIdCounter++
    }

    function generateGrid(): void {
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (grid[row][col].value === -1) {
            let placed = false
            while (!placed) {
              const height = randint(1, rows - row)
              const width = randint(1, cols - col)
              if (isValidPlacement(row, col, height, width)) {
                placeRegion(row, col, height, width)
                placed = true
              }
            }
          }
        }
      }
    }

    // Génération de la grille
    let compteur = 0
    do {
      // Cette boucle doit tourner 1O fois maximum et s'arrêter dès que le nb de découpes est supérieur ou égal à this.sup3
      grid = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({ value: -1, regionId: -1 })),
      )
      rectangles = []
      generateGrid()
      compteur++
    } while (rectangles.length < parseInt(this.sup3) && compteur < 10)

    // Rotation des grilles pour éviter d'avoir toujours les gros nombres en bas à gauche.

    function rotate90(
      grid: Cell[][],
      rectangles: Rectangle[],
    ): { grid: Cell[][]; rectangles: Rectangle[] } {
      const n = grid.length
      const newGrid: Cell[][] = Array.from({ length: n }, () =>
        Array(n).fill({ value: ' ', regionId: -1 }),
      )
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          newGrid[j][n - 1 - i] = grid[i][j]
        }
      }
      const newRectangles = rectangles.map((rect) => ({
        // topLeft: [n - 1 - rect.bottomRight[1], rect.topLeft[0]],
        // bottomRight: [n - 1 - rect.topLeft[1], rect.bottomRight[0]]
        topLeft: [rect.topLeft[1], n - 1 - rect.bottomRight[0]],
        bottomRight: [rect.bottomRight[1], n - 1 - rect.topLeft[0]],
      })) as Rectangle[]
      return { grid: newGrid, rectangles: newRectangles }
    }

    function rotate180Carree(
      grid: Cell[][],
      rectangles: Rectangle[],
    ): { grid: Cell[][]; rectangles: Rectangle[] } {
      const n = grid.length
      const newGrid: Cell[][] = Array.from({ length: n }, () =>
        Array(n).fill({ value: ' ', regionId: -1 }),
      )
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          newGrid[n - 1 - i][n - 1 - j] = grid[i][j]
        }
      }
      const newRectangles = rectangles.map((rect) => ({
        topLeft: [n - 1 - rect.bottomRight[0], n - 1 - rect.bottomRight[1]],
        bottomRight: [n - 1 - rect.topLeft[0], n - 1 - rect.topLeft[1]],
      })) as Rectangle[]
      return { grid: newGrid, rectangles: newRectangles }
    }

    function rotate180NonCarree(
      grid: Cell[][],
      rectangles: Rectangle[],
    ): { grid: Cell[][]; rectangles: Rectangle[] } {
      const rows = grid.length
      const cols = grid[0].length
      const newGrid: Cell[][] = Array.from({ length: rows }, () =>
        Array(cols).fill({ value: ' ', regionId: -1 }),
      )
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          newGrid[rows - 1 - i][cols - 1 - j] = grid[i][j]
        }
      }
      const newRectangles = rectangles.map((rect) => ({
        topLeft: [
          rows - 1 - rect.bottomRight[0],
          cols - 1 - rect.bottomRight[1],
        ],
        bottomRight: [rows - 1 - rect.topLeft[0], cols - 1 - rect.topLeft[1]],
        // bottomRight: [rows - 1 - rect.bottomRight[0], cols - 1 - rect.bottomRight[1]],
        // topLeft: [rows - 1 - rect.topLeft[0], cols - 1 - rect.topLeft[1]]
      })) as Rectangle[]
      return { grid: newGrid, rectangles: newRectangles }
    }

    function rotate270(
      grid: Cell[][],
      rectangles: Rectangle[],
    ): { grid: Cell[][]; rectangles: Rectangle[] } {
      const n = grid.length
      const newGrid: Cell[][] = Array.from({ length: n }, () =>
        Array(n).fill({ value: ' ', regionId: -1 }),
      )
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          newGrid[n - 1 - j][i] = grid[i][j]
        }
      }
      const newRectangles = rectangles.map((rect) => ({
        //  topLeft: [rect.topLeft[1], n - 1 - rect.bottomRight[0]],
        // bottomRight: [rect.bottomRight[1], n - 1 - rect.topLeft[0]]
        bottomRight: [n - 1 - rect.topLeft[1], rect.bottomRight[0]],
        topLeft: [n - 1 - rect.bottomRight[1], rect.topLeft[0]],
      })) as Rectangle[]
      return { grid: newGrid, rectangles: newRectangles }
    }

    let result = { grid, rectangles }

    if (this.largeur === this.longueur) {
      // Si la grille est carrée, 3 rotations + l'identité sont possibles
      const choixRotation = choice(range1(4))
      switch (choixRotation) {
        case 2: {
          result = rotate90(grid, rectangles)
          // result = { grid, rectangles }
          break
        }
        case 3: {
          result = rotate180Carree(grid, rectangles)
          break
        }
        case 4: {
          result = rotate270(grid, rectangles)
          break
        }
      }
    } else {
      switch (choice(range1(2))) {
        case 2: {
          result = rotate180NonCarree(grid, rectangles)
          break
        }
      }
    }
    const newGrid = result.grid
    const newRectangles = result.rectangles

    /*
    function displayRectanglesBeforeAndAfterRotation (
      grid: Cell[][],
      rectangles: Rectangle[]
    ): void {
      // Appel de la fonction pour effectuer la rotation
      rectangles.forEach((rect, index) => {
        const originalTopLeft = rect.topLeft
        const originalBottomRight = rect.bottomRight

        const rotatedTopLeft = result.rectangles[index].topLeft
        const rotatedBottomRight = result.rectangles[index].bottomRight

        console log(`Rectangle ${index + 1}:`)
        console log(`  Avant rotation : topLeft = [${originalTopLeft}], bottomRight = [${originalBottomRight}]`)
        console log(`  Après rotation : topLeft = [${rotatedTopLeft}], bottomRight = [${rotatedBottomRight}]`)
      })
    }
    displayRectanglesBeforeAndAfterRotation(grid, rectangles)
    */
    // Positionnement des chiffres dans une grille
    for (let j = 0; j < this.largeur; j++) {
      for (let i = 0; i < this.longueur; i++) {
        this.figure.create('TextByPosition', {
          isDeletable: false,
          anchor: 'middleCenter',
          text: newGrid[this.largeur - j - 1][i].value.toString(),
          //  x: i + 0.5,
          //  y: this.largeur - j - 0.5
          y: i + 0.5,
          x: this.largeur - j - 0.5,
        })
        this.figureCorrection.create('TextByPosition', {
          anchor: 'middleCenter',
          text: newGrid[this.largeur - j - 1][i].value.toString(),
          // x: i + 0.5,
          // y: this.largeur - j - 0.5
          y: i + 0.5,
          x: this.largeur - j - 0.5,
        })
      }
    }
    for (let k = 0; k < newRectangles.length; k++) {
      const A = this.figure.create('Point', {
        x: newRectangles[k].bottomRight[0] + 1,
        y: newRectangles[k].bottomRight[1] + 1,
        isVisible: false,
      })
      const B = this.figure.create('Point', {
        x: newRectangles[k].bottomRight[0] + 1,
        y: newRectangles[k].topLeft[1],
        isVisible: false,
      })
      const C = this.figure.create('Point', {
        x: newRectangles[k].topLeft[0],
        y: newRectangles[k].topLeft[1],
        isVisible: false,
      })
      const D = this.figure.create('Point', {
        x: newRectangles[k].topLeft[0],
        y: newRectangles[k].bottomRight[1] + 1,
        isVisible: false,
      })
      this.goodAnswers.push([
        { x: A.x, y: A.y },
        { x: B.x, y: B.y },
        { x: C.x, y: C.y },
        { x: D.x, y: D.y },
      ])
      this.figureCorrection.create('Polygon', {
        points: [A, B, C, D],
        thickness: 3,
        color: orangeMathalea,
        fillColor: orangeMathaleaLight,
      })
    }
    function handleExercicesAffiches() {
      drawBluePolygon()
      document.removeEventListener('exercicesAffiches', handleExercicesAffiches)
    }
    document.addEventListener('exercicesAffiches', handleExercicesAffiches)

    let texteCorr =
      'Voici une solution possible :<br>' +
      this.figureCorrection.getStaticHtml()
    let texte = emplacementPourFigure

    // Construction de la grille au format voulu par ProfCollege... Inutile finalement car on se passe de ProfCollege pour la correction.
    const tabProfCollege: string[] = []
    for (let j = 0; j < this.largeur; j++) {
      for (let i = 0; i < this.longueur; i++) {
        let contenuCasePC: string = ''
        if (
          i !== 0 &&
          newGrid[this.largeur - j - 1][i].regionId !==
            newGrid[this.largeur - j - 1][i - 1].regionId
        )
          contenuCasePC = '1'
        if (
          j !== this.largeur - 1 &&
          newGrid[this.largeur - j - 1][i].regionId !==
            newGrid[this.largeur - j - 2][i].regionId
        )
          contenuCasePC += 'b'
        contenuCasePC += '/' + newGrid[this.largeur - j - 1][i].value.toString()
        tabProfCollege.push(contenuCasePC)
      }
    }

    if (!context.isHtml) {
      texte += '<br>' + this.figure.latex({ includePreambule: false })
      texteCorr = this.figureCorrection.latex({ includePreambule: false })
    }

    this.listeQuestions.push(texte)
    this.listeCorrections.push(texteCorr)
  }

  correctionInteractive = () => {
    if (this.answers == null) this.answers = {}
    // Sauvegarde de la réponse pour Capytale
    this.answers[this.figure.id] = this.figure.json
    const divFeedback = document.querySelector(
      `#feedbackEx${this.numeroExercice}Q${0}`,
    ) as HTMLDivElement
    let validUnPolygone = true
    const nbPolygon = [...this.figure.elements.values()].filter(
      (e) => e.type === 'Polygon',
    ).length

    let isValid = nbPolygon === this.goodAnswers.length
    let message: string

    if (!isValid) {
      if (nbPolygon > this.goodAnswers.length)
        message = 'Trop de polygones ont été tracés.'
      else if (nbPolygon > 0) message = 'Trop peu de polygones ont été tracés.'
      else message = "Aucun polygone n'a été tracé."
      divFeedback.innerHTML = message
      return ['KO']
    }

    for (let i = 0; i < this.goodAnswers.length; i++) {
      validUnPolygone = this.figure.checkPolygon({
        points: this.goodAnswers[i],
      }).isValid
      isValid &&= validUnPolygone
    }

    this.figure.isDynamic = false
    this.figure.divButtons.style.display = 'none'
    this.figure.divUserMessage.style.display = 'none'
    this.figure.buttons.get('SHAKE')?.click()
    if (isValid) {
      divFeedback.innerHTML = 'Bravo !'
      return ['OK']
    }
    divFeedback.innerHTML = "Au moins un polygone n'a pas la bonne aire."
    return ['KO']
  }
}
