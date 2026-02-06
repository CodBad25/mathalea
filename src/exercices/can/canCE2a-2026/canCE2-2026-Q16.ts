import { fixeBordures } from '../../../lib/2d/fixeBordures'
import { PieceBuilder } from '../../../lib/2d/pieces'
import { selectionSvg } from '../../../lib/interactif/questionSvgSelection/questionSvgSelection'
import { choice } from '../../../lib/outils/arrayOutils'
import { texPrix } from '../../../lib/outils/texNombre'
import { context } from '../../../modules/context'
import { mathalea2d } from '../../../modules/mathalea2d'
import type { NestedObjetMathalea2dArray } from '../../../types/2d'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Compter avec des pièces de monnaie'
export const interactifReady = true
export const interactifType = 'svgSelection'
export const uuid = '1474f'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Jean-Claude Lhote
 * Calcule les pièces qui font la somme cible et retourne le résultat encodé en base n
 */
export default class Can2026CE2Q16 extends ExerciceCan {
  /**
   * Calcule toutes les valeurs codées possibles pour atteindre la somme cible.
   */
  private calculateCorrectValues(
    pieces: number[],
    targetSum: number,
  ): number[] {
    const n = pieces.length
    const results: number[] = []
    const epsilon = 1e-9

    const recurse = (index: number, sum: number, value: number) => {
      if (index === n) {
        if (Math.abs(sum - targetSum) <= epsilon) {
          results.push(value)
        }
        return
      }

      // Ne pas sélectionner cette pièce
      recurse(index + 1, sum, value)

      // Sélectionner cette pièce
      recurse(index + 1, sum + pieces[index], value + Math.pow(n, index))
    }

    recurse(0, 0, 0)
    return results.sort((a, b) => a - b)
  }

  enonce(pieces: number[], somme: number) {
    const objets: NestedObjetMathalea2dArray = []
    const correctValues = this.calculateCorrectValues(pieces, somme)

    this.question = `Tu dois $${texPrix(somme)}$€ à ton frère.<br>${context.isHtml ? 'Sélectionne ce que tu lui donnes' : 'Entoure ce que tu lui donnes'}.<br>`
    for (let i = 0; i < pieces.length; i++) {
      const piece = new PieceBuilder(pieces[i]).make(i * 1.2, 0)
      objets.push(piece)
    }

    const figure = mathalea2d(
      Object.assign(
        { pixelsParCm: 30, scale: 0.7 },
        fixeBordures(
          (
            objets
              .map((obj) => {
                if (Array.isArray(obj)) {
                  return obj[0]
                } else return null
              })
              .filter((o) => o !== null) as NestedObjetMathalea2dArray
          ).flat(),
          {
            rxmin: 0,
            rxmax: 0,
            rymin: 0,
            rymax: 0,
          },
        ),
      ),
      objets,
    )
    this.canReponseACompleter = figure
    this.canEnonce = this.question
    if (context.isHtml) {
      const svgItems = pieces.map((valeur) => {
        const piece = new PieceBuilder(valeur).make(0, 0, 2)
        return mathalea2d(
          Object.assign(
            { pixelsParCm: 30, scale: 1, style: 'display: inline-block' },
            fixeBordures(
              (
                piece
                  .map((obj) => {
                    if (Array.isArray(obj)) {
                      return obj[0]
                    } else return null
                  })
                  .filter((o) => o !== null) as NestedObjetMathalea2dArray
              ).flat(),
              {
                rxmin: 0,
                rxmax: 0,
                rymin: 0,
                rymax: 0,
              },
            ),
          ),
          piece,
        )
      })
      this.question += selectionSvg(this, 0, svgItems)
    } else {
      this.question = this.question + figure
    }
    this.reponse = correctValues.map(String)
    this.correction = ``
  }

  nouvelleVersion() {
    const pieces =
      this.canOfficielle || this.sup
        ? [2, 2, 0.5, 0.5, 0.5]
        : [2, 2, 1, 0.5, 0.5]
    this.formatInteractif = 'svgSelection'
    this.canOfficielle || this.sup
      ? this.enonce(pieces, 3)
      : this.enonce(pieces, choice([2.5, 3, 3.5, 4, 5]))
  }
}
