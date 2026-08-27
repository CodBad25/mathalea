import { tableauColonneLigne } from '../../lib/2d/tableau'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { AddTabDbleEntryMathlive } from '../../lib/interactif/tableaux/AjouteTableauMathlive'
import { balancedLatinSquare } from '../../lib/outils/grid'

import type { Valeur } from '../../lib/types'
import Exercice from '../Exercice'

export const dateDePublication = '15/08/2026'
export const titre = 'Résoudre une grille de Gratte-ciel'
export const interactifReady = true

/** Résoudre une grille de gratte ciel
 * @author Claire Stephan
 */

export const uuid = '74d07'
export const refs = {
  'fr-fr': ['EN-Gratte-ciel'],
  'fr-ch': [],
}

export default class gratteciel extends Exercice {
  // On déclare des propriétés supplémentaires pour cet exercice afin de pouvoir les réutiliser dans la correction

  constructor() {
    super()

    this.besoinFormulaireNumerique = ['Taille de la grille', 6]
    this.sup = 4
    this.nbQuestions = 1

    const immeubles = Array.from(Array(this.sup).keys()).map(
      (x) => (x + 1) * 10,
    )

    this.consigne = 'Cette grille représente une ville vue du ciel.<br>'
    this.consigne += 'Chaque case contient un immeuble de '
    this.consigne +=
      immeubles.slice(0, -1).join(', ') +
      ' ou ' +
      immeubles[this.sup - 1] +
      ' étages.<br>'
    this.consigne +=
      'Les immeubles d’une même rangée, ligne ou colonne, sont tous de tailles différentes.<br>'
    this.consigne +=
      'Les informations données sur les bords indiquent le nombre d’immeubles visibles '
    this.consigne +=
      'sur la rangée correspondante par un observateur situé à cet endroit.<br>'
    this.consigne +=
      'Le but du jeu est de trouver la disposition des immeubles dans la grille.<br>'
  }

  computeClue(line: number[]): number {
    let max = 0
    let view = 0
    for (let l of line) {
      if (l > max) {
        max = l
        view += 1
      }
    }
    return view
  }

  nouvelleVersion(): void {
    const immeubles = Array.from(Array(this.sup).keys()).map(
      (x) => (x + 1) * 10,
    )

    this.consigne =
      this.nbQuestions === 1
        ? 'Cette grille représente une ville vue du ciel.<br>'
        : 'Ces grilles représentent des villes vue du ciel.<br>'
    this.consigne += 'Chaque case contient un immeuble de '
    this.consigne +=
      immeubles.slice(0, -1).join(', ') +
      ' ou ' +
      immeubles[this.sup - 1] +
      ' étages.<br>'
    this.consigne +=
      'Les immeubles d’une même rangée, ligne ou colonne, sont tous de tailles différentes.<br>'
    this.consigne +=
      'Les informations données sur les bords indiquent le nombre d’immeubles visibles '
    this.consigne +=
      'sur la rangée correspondante par un observateur situé à cet endroit.<br>'
    this.consigne +=
      'Le but du jeu est de trouver la disposition des immeubles dans la grille.<br>'

    // this.comment = "aide au formulaire?"

    const tabStyle = {
      // 4 corners are white
      L0C0: 'white',
      [`L0C${this.sup + 1}`]: 'white',
      [`L${this.sup + 1}C0`]: 'white',
      [`L${this.sup + 1}C${this.sup + 1}`]: 'white',
    }

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50;) {
      // fill the grid using balancedLatinSquare
      const grid = balancedLatinSquare(immeubles)
      const inline_grid: number[] = []
      grid.forEach((x) => {
        inline_grid.push(...x)
      })

      // compute the clues
      const west = grid.map((row) => this.computeClue(row))
      const east = grid.map((row) => this.computeClue([...row].reverse()))
      const north: number[] = new Array()
      const south: number[] = new Array()
      for (let i = 0; i < this.sup; i++) {
        const column: number[] = []
        for (let j = 0; j < this.sup; j++) {
          column.push(grid[j][i])
        }
        north.push(this.computeClue(column))
        south.push(this.computeClue([...column].reverse()))
      }

      // transform it as tab header and footer
      const corner = this.interactif ? ['~'] : ['\\phantom{rrrrr}']
      const tabColHeaders = corner
        .concat(north.map((x) => x.toString()))
        .concat(corner)
      const tabLineHeaders = west
      const tabColFooters = corner
        .concat(south.map((x) => x.toString()))
        .concat(corner)
      const tabLineFooters = east

      let texte: string
      if (this.interactif) {
        const emptyTab = AddTabDbleEntryMathlive.convertTclToTableauMathlive(
          tabColHeaders,
          tabLineHeaders,
          Array.from({ length: this.sup * this.sup }, () => ''),
          tabColFooters,
          tabLineFooters,
        )
        const mathliveTab = AddTabDbleEntryMathlive.create(
          this.numeroExercice,
          i,
          emptyTab,
          `tableauMathlive`,
          true,
          tabStyle,
        )
        texte = mathliveTab.output
      } else {
        texte = tableauColonneLigne(
          tabColHeaders,
          tabLineHeaders,
          Array.from({ length: this.sup * this.sup }, () => '\\phantom{rrrrr}'),
          2.5,
          true,
          this.numeroExercice,
          i,
          false,
          tabStyle,
          tabColFooters,
          tabLineFooters,
        )
      }
      const texteCorr = tableauColonneLigne(
        tabColHeaders,
        tabLineHeaders,
        inline_grid,
        1.2,
        true,
        this.numeroExercice,
        i,
        false,
        tabStyle,
        tabColFooters,
        tabLineFooters,
      )

      let objetReponse: Valeur = {}
      for (let i = 0; i < this.sup; i++) {
        for (let j = 0; j < this.sup; j++) {
          // TODO
          // objetReponse[`L${i + 1}C${j + 1}`] = {value : grid[i][j], options: { fonction: true }}
          const cellule = Object.fromEntries([
            [
              `L${i + 1}C${j + 1}`,
              { value: grid[i][j], options: { fonction: true } },
            ],
          ])
          objetReponse = Object.assign(objetReponse, cellule)
        }
      }

      handleAnswers(this, i, objetReponse)

      if (this.questionJamaisPosee(i, ...inline_grid)) {
        // Si la question n'a jamais été posée, on en créé une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
  }
}
