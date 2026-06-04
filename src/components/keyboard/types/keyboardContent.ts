import { specialKeys } from '../layouts/keysBlocks'
import type { keys } from '../lib/keycaps'
import { GAP_BETWEEN_KEYS, KEYCAP_WIDTH } from '../lib/sizes'
export type Keys = keyof typeof keys
export type KeysList = Keys[]
export type AlphanumericPages = 'AlphaUp' | 'AlphaLow' | 'Numeric'
export type BlockForKeyboard =
  | 'alphanumeric'
  | 'advanced'
  | 'angles'
  | 'areas'
  | 'basicOperations'
  | 'basicOperations2'
  | 'basicOperationsPlus'
  | 'capacities'
  | 'compare'
  | 'complexes'
  | 'degre'
  | 'degreCelsius'
  | 'emvxBlock'
  | 'equationsTerminale'
  | 'ensemble'
  | 'ensembleDefini'
  | 'fullOperations'
  | 'greek'
  | 'hms'
  | 'lengths'
  | 'clavierFonctionsTerminales'
  | 'lectureLimites'
  | 'majuscules'
  | 'minuscules'
  | 'masses'
  | 'numbers'
  | 'numbersX'
  | 'numbers2'
  | 'numbersOperations'
  | 'numbersOperationsX'
  | 'limites'
  | 'numbersSpace'
  | 'numeration'
  | 'probabilite'
  | 'suite'
  | 'trigo'
  | 'variableN'
  | 'variables'
  | 'volumes'
  | 'vFON'
  | 'uppercaseAToH'
  | 'uppercaseIToP'
  | 'uppercaseQToW'
  | 'uppercaseXToZ'
  | 'estOuestSudNord'

export interface CompleteKeysList {
  inline: KeysList
  block: KeysList
}

export interface KeyboardBlock {
  keycaps: CompleteKeysList
  cols: number
  title: string
  isUnits: boolean
}

export class Keyboard {
  blocks: KeyboardBlock[] = [specialKeys]

  constructor(kb?: KeyboardBlock) {
    if (kb) {
      this.blocks.push(kb)
    }
  }

  /**
   * Ajoute un bloc de touche au clavier
   * @param kb {KeyboardBlock} bloc de touches à ajouter
   * @returns le clavier lui-même (on peut donc chaîner cette fonction)
   */
  add = (kb: KeyboardBlock): Keyboard => {
    this.blocks.push(kb)
    return this
  }

  empty = (): void => {
    this.blocks.length = 0
    this.blocks.push(specialKeys)
  }

  /**
   * Retrouve le nombre de blocs dans le clavier
   * @returns nombre de blocs dans le clavier
   */
  numberOfBlocks = (): number => this.blocks.length

  /**
   * Construit un tableau dont les éléments sont le nombre de touche par bloc
   * @returns nombre de touches par bloc (liste de nombres)
   */
  numberOfKeysPerBlock = (): number[] => {
    const result: number[] = []
    for (const block of this.blocks) {
      result.push(block.keycaps.inline.length)
    }
    return result
  }

  /**
   * Calcule le nombre total de touches dans le clavier
   * @returns nombre total de touches
   */
  numberOfKeys = (): number =>
    this.numberOfKeysPerBlock().reduce((prev, current) => prev + current)

  /**
   * Décide si on passe le bloc des touches spéciales sur deux colonnes
   * lorsqu'on a que deux touches par bloc
   * (utile dans la cas de clavier cotenant très peu de touches)
   */
  checkSmallLayoutAllowed = (): void => {
    const maximumNbKeysPerBlock = this.numberOfKeysPerBlock()
      .slice(1)
      .reduce((prev, current) => (prev < current ? current : prev), 0)
    if (maximumNbKeysPerBlock <= 2) {
      // le premier bloc est celui des touches spéciales, on le passe en deux colonnes.
      this.blocks[0].cols = 2
    }
  }
}

export const inLineBlockWidth = (
  block: KeyboardBlock,
  mode: 'sm' | 'md' | 'lg' | 'xl',
): number => {
  // 3G30-1 renvoie un keycaps undefined, pourquoi ?
  const numberOfKeys = block?.keycaps?.inline?.length || 0
  // console.log('nb of keys: ' + numberOfKeys + ' / key width: ' + KEYCAP_WIDTH[mode]s + ' / gap between keys: ' + GAP_BETWEEN_KEYS[mode])
  return (
    numberOfKeys * KEYCAP_WIDTH[mode] +
    (numberOfKeys - 1) * GAP_BETWEEN_KEYS[mode]
  )
}
export const usualBlockWidth = (
  block: KeyboardBlock,
  mode: 'sm' | 'md' | 'lg' | 'xl',
): number => {
  const numberOfCols = block.cols
  return (
    numberOfCols * KEYCAP_WIDTH[mode] +
    (numberOfCols - 1) * GAP_BETWEEN_KEYS[mode]
  )
}
