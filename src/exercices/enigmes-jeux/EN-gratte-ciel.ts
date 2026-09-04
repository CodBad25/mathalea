import type { AllChoiceType } from '../../lib/customElements/ListeDeroulanteElement';
import type { TableauHybrideCell } from '../../lib/customElements/TableauHybride';
import { creeTableauHybrideElement } from '../../lib/customElements/TableauHybride';
import { handleAnswers } from '../../lib/interactif/gestionInteractif';
import { balancedLatinSquare } from '../../lib/outils/grid';

import type { Valeur } from '../../lib/types';
import Exercice from '../Exercice';

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

function celluleTexte(
  texte: string | number,
  header: boolean = true
): TableauHybrideCell {
  return { type: 'text', texte, header: header, latex: true }
}

function celluleListe(
  id: string,
  choices: AllChoiceType[],
  value: string | number,
): TableauHybrideCell {
  return {
    type: 'select',
    id,
    value,
    choix0: true,
    choices
  }
}

export function responseSelect(
  immeubles: number[]
): AllChoiceType[]{
  const select: AllChoiceType[]= [{ label: 'Choisir', value: '' }]
  immeubles.forEach((val) => select.push({latex: `${val}`, value: `${val}`}))
  return select;
}

export default class gratteciel extends Exercice {
  // On déclare des propriétés supplémentaires pour cet exercice afin de pouvoir les réutiliser dans la correction

  constructor() {
    super()

    this.besoinFormulaireNumerique = ['Taille de la grille', 6]
    this.sup = 3
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

  // compute the clue displayed at the beginning of each line
  computeClue(line: number[]): number {
    let max = 0
    let view = 0
    for (const l of line) {
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
      const north: number[] = []
      const south: number[] = []
      for (let i = 0; i < this.sup; i++) {
        const column: number[] = []
        for (let j = 0; j < this.sup; j++) {
          column.push(grid[j][i])
        }
        north.push(this.computeClue(column))
        south.push(this.computeClue([...column].reverse()))
      }

      // transform it as tab header and footer
      const corner = this.interactif ? [celluleTexte('~', false)] : [celluleTexte('\\phantom{rrrrr}', false)];
      const tabColHeaders: TableauHybrideCell[] = corner
        .concat(north.map((x) => celluleTexte(x.toString())))
        .concat(corner)
      const tabColFooters: TableauHybrideCell[] = corner
        .concat(south.map((x) => celluleTexte(x.toString())))
        .concat(corner)

      // create the whole tab
      const select: AllChoiceType[] = responseSelect(immeubles);
      const tab = {rows: [tabColHeaders]}; // init with header
      for (let i = 0; i < this.sup; i++ ){
        const line = [celluleTexte(west[i])];
        for (let j = 0; j < this.sup; j++){
          line.push(celluleListe(`L${i + 1}C${j + 1}`, select, grid[i][j]));
        }
        line.push(celluleTexte(east[i]));
        tab.rows.push(line);
      }
      tab.rows.push(tabColFooters);

      const texte: string = creeTableauHybrideElement({
        numeroExercice: this.numeroExercice ?? 0,
        questionIndex: i,
        tableau: tab,
        interactivityOn: this.interactif,
      })

      const texteCorr = 'Voici une solution possible :<br>' + creeTableauHybrideElement({
        numeroExercice: this.numeroExercice ?? 0,
        questionIndex: i,
        tableau: tab,
        interactivityOn: false,
        correctionOn: true,
      })

      let objetReponse: Valeur = {}
      for (let i = 0; i < this.sup; i++) {
        for (let j = 0; j < this.sup; j++) {
          // TODO
          // objetReponse[`L${i + 1}C${j + 1}`] = {value : grid[i][j], options: { fonction: true }}
          const cellule = Object.fromEntries([[`L${i + 1}C${j + 1}`, { value: grid[i][j] }]])
          objetReponse = Object.assign(objetReponse, cellule)
        }
      }

      handleAnswers(this, i, objetReponse, { formatInteractif: 'tableau-hybride' },);

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
