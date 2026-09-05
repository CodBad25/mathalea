import type { MathfieldElement } from 'mathlive'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import type { IExercice } from '../../lib/types'
import ExerciceFractionsDecomposer from '../5e/5N3autoG'
export const titre =
  "Décomposer une fraction (partie entière + fraction inférieure à 1) puis donner l'écriture décimale"
export const interactifReady = true

export const dateDeModifImportante = '05/09/2026' // Vérification personnalisée : toute décomposition égale est acceptée (2 + 2/8, 2 + 25/100…)
/**
 * Clone de 6N20-2 pour les 2nde
 */
export const uuid = '45726'

export const refs = {
  'fr-fr': ['2N30-1'],
  'fr-ch': ['NR'],
}

export default class ExerciceFractionsDifferentesEcritures extends ExerciceFractionsDecomposer {
  constructor() {
    super()
    this.nbQuestions = 2
    this.sup3 = false
  }

  /**
   * Les trois champs séparés sont conservés, mais la vérification est
   * personnalisée : on relit les nombres saisis, on reconstitue
   * `partieEntiere + numérateur / dénominateur` et on l'accepte dès qu'elle
   * est égale à la fraction de départ, y compris avec une fraction non
   * simplifiée (`2 + \dfrac{2}{8}`, `2 + \dfrac{25}{100}`…). La fraction doit
   * rester strictement inférieure à 1.
   */
  enregistreReponses(
    i: number,
    {
      partieEntiere,
      partieFractionnaire,
      denominateur,
    }: {
      partieEntiere: number
      partieFractionnaire: number
      denominateur: number
    },
  ): void {
    handleAnswers(
      this,
      i,
      {
        // Valeurs de référence : état par défaut des champs et corrigé non interactif.
        champ1: { value: String(partieEntiere) },
        champ2: { value: String(partieFractionnaire) },
        champ3: { value: String(denominateur) },
        callback: (exercice: IExercice, question: number) => {
          const scoreVide = { nbBonnesReponses: 0, nbReponses: 0 }
          const mfe = document.querySelector(
            `#champTexteEx${exercice.numeroExercice}Q${question}`,
          ) as MathfieldElement | null
          if (mfe == null) {
            return { isOk: false, feedback: '', score: scoreVide }
          }

          // Lit un champ et renvoie l'entier saisi, `null` si vide, `NaN` si
          // la saisie n'est pas un entier.
          const lireEntier = (nom: string): number | null => {
            const brut = (mfe.getPromptValue(nom) ?? '')
              .replaceAll('\\,', '')
              .replaceAll(' ', '')
            if (brut === '') return null
            return /^-?\d+$/.test(brut) ? Number(brut) : Number.NaN
          }

          const entier = lireEntier('champ1')
          const num = lireEntier('champ2')
          const den = lireEntier('champ3')
          const champManquant = entier == null || num == null || den == null

          const e = entier ?? Number.NaN
          const n = num ?? Number.NaN
          const d = den ?? Number.NaN

          const entierOk = Number.isInteger(e) && e === partieEntiere
          const fractionInferieureA1 =
            Number.isInteger(n) &&
            Number.isInteger(d) &&
            d > 0 &&
            n > 0 &&
            n < d
          // Comparaison exacte par produit en croix (fractions égales acceptées).
          const fractionOk =
            fractionInferieureA1 && n * denominateur === partieFractionnaire * d
          const isOk = !champManquant && entierOk && fractionOk

          mfe.setPromptState('champ1', entierOk ? 'correct' : 'incorrect', true)
          mfe.setPromptState(
            'champ2',
            fractionOk ? 'correct' : 'incorrect',
            true,
          )
          mfe.setPromptState(
            'champ3',
            fractionOk ? 'correct' : 'incorrect',
            true,
          )

          let feedback = ''
          if (champManquant) {
            feedback = 'Il faut compléter les trois zones de saisie.'
          } else if (!isOk) {
            if (
              Number.isInteger(n) &&
              Number.isInteger(d) &&
              d > 0 &&
              n > 0 &&
              n >= d
            ) {
              feedback = 'La fraction doit être inférieure à 1.'
            } else {
              feedback =
                "Cette décomposition n'est pas égale à la fraction proposée."
            }
          }

          const spanReponseLigne = document.querySelector(
            `#resultatCheckEx${exercice.numeroExercice}Q${question}`,
          )
          if (spanReponseLigne != null) {
            spanReponseLigne.innerHTML = isOk ? '😎' : '☹️'
          }

          return {
            isOk,
            feedback,
            score: { nbBonnesReponses: isOk ? 1 : 0, nbReponses: 1 },
          }
        },
      },
      { formatInteractif: 'fillInTheBlank' },
    )
  }
}
