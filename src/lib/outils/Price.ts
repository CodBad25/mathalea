import { randint } from '../../modules/outils';

export const coins: number[] = [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01];

/**
 * Renvoie une valeur de pièce ou billet en euro.
 *
 * @param {number} [min = 0.01] - valeur minimale attendue
 * @param {number} [max = 500] - valeur maximale attendue
 * @param {number[]} [exclude = [10, 50]] - valeur à exclure de la liste
 *
 * @returns {Price} 
 *  
 *
 * @author Claire Stephan
 *
 * @example
 * randCoin();
 * // → {value: 0.2}
 *
 * @example
 * randCoin(1,2,1);
 * // → {value: 2}
 */
export function randCoin(
  min: number = 0.01,
  max: number = 500,
  exclude: number[] = []
): Price {
  const blacklist = new Set(exclude);
  const shortlist = coins.filter(x => x >= min).filter(x => x <= max).filter(x => !blacklist.has(x))
  if (shortlist.length === 0) {
    window.notify(
      `Il n'y a plus de pièce disponible dans la liste. On renvoie arbitrairement ${max}`,
      { min, max, exclude },
    )
    return new Price(max)
  }
  return new Price(shortlist[randint(0, shortlist.length - 1)])
}

/**
 * Définit l'objet Price
 * @author Claire Stephan
 * 
 */
export class Price {
  value: number
  constructor(price: number) {
    this.value = Math.round(price * 100) / 100
  }

  /**
   * Renvoie la valeur formattée en latex
   *
   * @returns {string}
   *
   * @example
   * // → "$20 \\text{centimes}$"
   * // → "$1$€$05$"
   */

  public toString(): string {
    const euro = Math.floor(this.value)
    const cent = Math.round((this.value - euro)*100)
    let res = "$"
    if (euro === 0) {
      res += cent + ' \\text{centime'
      if (cent != 1) res += 's'
      res += '}$'
    } else {
      res += euro + '$€'
      if (cent > 9) {
        res += '$' + cent + '$'
      } else {
        res += (cent != 0) ? '$0' + cent + '$' : ''
      }
    }
    return res;
  }
}
