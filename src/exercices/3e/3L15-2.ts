import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { rienSi1 } from '../../lib/outils/ecritures'
import { texNombre } from '../../lib/outils/texNombre'
import FractionEtendue from '../../modules/FractionEtendue'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  "Résoudre une équation du second degré à l'aide la racine carrée"
export const dateDePublication = '14/05/2024'
export const interactifReady = false
export const uuid = '0f844'
export const refs = {
  'fr-fr': ['3L15-2'],
  'fr-ch': ['11FA10-14', '1mCL4-0'],
}

// export const dateDeModifImportante = '24/10/2021'

/**
 *
 * @author Nathan Scheinmann
 */

export default class nomExercice extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireNumerique = [
      'Types de solution',
      4,
      '1 : Entier\n2 : Fraction\n3 : Racine\n4 : Mélange',
    ]
    this.sup = 4
    this.nbQuestions = 3
  }

  nouvelleVersion() {
    if (this.nbQuestions === 1) {
      this.consigne = "Résoudre l'équation suivante."
    } else {
      this.consigne = 'Résoudre les équations suivantes.'
    }
    if (this.interactif) {
      this.consigne +=
        " Entrer les solutions sous forme d'un ensemble en séparant chaque élément par un point-virgule. Si une équation n'a pas de solution entrer l'ensemble vide."
    }
    let typeQuestionsDisponibles = []
    if (this.sup === 1) {
      typeQuestionsDisponibles = ['entier', 'entierPasDeSol']
    } else if (this.sup === 2) {
      typeQuestionsDisponibles = ['fraction', 'fractionPasDeSol']
    } else if (this.sup === 3) {
      typeQuestionsDisponibles = ['racine', 'racinePasDeSol']
    } else {
      typeQuestionsDisponibles = [
        'entier',
        'entierPasDeSol',
        'fraction',
        'fractionPasDeSol',
        'racine',
        'racinePasDeSol',
      ]
    }

    const listeTypeQuestions = combinaisonListes(
      typeQuestionsDisponibles,
      this.nbQuestions,
    )
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      let texte = ''
      let texteCorr = ''
      let coeffX = choice([1, -1, 2, -2, 3, -3])
      let coeffConstant = new FractionEtendue(0, 1)
      let expReduite = ''
      let sol = ''

      switch (listeTypeQuestions[i]) {
        case 'entier':
          do {
            coeffConstant = new FractionEtendue(
              choice([1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144]),
              1,
            )
            if (coeffX > 0) {
              coeffConstant = coeffConstant.multiplieEntier(-1)
            }
          } while (
            coeffConstant.num === 0 ||
            Math.abs(coeffX * coeffConstant.num) > 144
          )
          break
        case 'entierPasDeSol':
          do {
            coeffConstant = new FractionEtendue(
              choice([1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144]),
              1,
            )
            if (coeffX < 0) {
              coeffConstant = coeffConstant.multiplieEntier(-1)
            }
          } while (
            coeffConstant.num === 0 ||
            Math.abs(coeffX * coeffConstant.num) > 144
          )
          break
        case 'fraction':
          {
            coeffX = choice([1, -1])
            const num = choice([1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144])
            const den = choice(
              [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144],
              [num],
            )
            coeffConstant = new FractionEtendue(num, den)
            if (coeffX > 0) {
              coeffConstant = coeffConstant.multiplieEntier(-1)
            }
          }
          break
        case 'fractionPasDeSol':
          {
            coeffX = choice([1, -1])
            const num = choice([1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144])
            const den = choice(
              [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144],
              [num],
            )
            coeffConstant = new FractionEtendue(num, den)
            if (coeffX < 0) {
              coeffConstant = coeffConstant.multiplieEntier(-1)
            }
          }
          break
        case 'racine':
          {
            coeffX = choice([1, -1])
            const num = randint(1, 100, [1, 4, 9, 16, 25, 36, 49, 64, 81, 100])
            const den = randint(1, 100, [
              1,
              4,
              9,
              16,
              25,
              36,
              49,
              64,
              81,
              100,
              num,
            ])
            coeffConstant = new FractionEtendue(num, den)
            if (coeffX > 0) {
              coeffConstant = coeffConstant.multiplieEntier(-1)
            }
          }
          break
        case 'racinePasDeSol':
          {
            coeffX = choice([1, -1])
            const num = randint(1, 100, [1, 4, 9, 16, 25, 36, 49, 64, 81, 100])
            const den = randint(1, 100, [
              1,
              4,
              9,
              16,
              25,
              36,
              49,
              64,
              81,
              100,
              num,
            ])
            coeffConstant = new FractionEtendue(num, den)
            if (coeffX < 0) {
              coeffConstant = coeffConstant.multiplieEntier(-1)
            }
          }
          break
      }
      expReduite = `$${rienSi1(coeffX)}x^2  ${coeffConstant.texFractionSignee}=0$`
      texte = `${expReduite}.`
      texteCorr = `On commence par isoler le terme en $x^2$ : \\[${rienSi1(coeffX)}x^2=${coeffConstant.multiplieEntier(-1).texFSD}.\\]`
      if (!(coeffX === 1)) {
        texteCorr += `On divise par $${texNombre(coeffX)}$ et on s'assure que la fraction est irréductible pour obtenir $x^2=${coeffConstant.multiplieEntier(-1).entierDivise(coeffX).texFractionSimplifiee}$.`
      } else if (!coeffConstant.estIrreductible) {
        texteCorr += ` On réduit pour obtenir $x^2=${coeffConstant.multiplieEntier(-1).entierDivise(coeffX).texFractionSimplifiee}$.`
      }
      if (coeffConstant.multiplieEntier(-1).entierDivise(coeffX).signe === -1) {
        texteCorr += " On en déduit que l'équation n'a pas de solution réelle."
      } else {
        texteCorr += ` On en déduit que $x=\\pm\\sqrt{${coeffConstant.multiplieEntier(-1).entierDivise(coeffX).texFractionSimplifiee}}`
      }
      if (
        !(listeTypeQuestions[i] === 'racine') &&
        !listeTypeQuestions[i].includes('PasDeSol')
      ) {
        texteCorr += `=\\pm${coeffConstant.multiplieEntier(-1).entierDivise(coeffX).texRacineCarree(false)}$.`
      } else if (listeTypeQuestions[i] === 'racine') {
        texteCorr += '$.'
      }
      if (listeTypeQuestions[i].includes('PasDeSol')) {
        sol = '\\emptyset$.'
      } else if (listeTypeQuestions[i] === 'racine') {
        sol = `\\left\\{-\\sqrt{${coeffConstant.multiplieEntier(-1).entierDivise(coeffX).texFractionSimplifiee}},\\sqrt{${coeffConstant.multiplieEntier(-1).entierDivise(coeffX).texFractionSimplifiee}}\\right\\}$.`
      } else {
        sol = `\\left\\{-${coeffConstant.multiplieEntier(-1).entierDivise(coeffX).texRacineCarree(false)};${coeffConstant.multiplieEntier(-1).entierDivise(coeffX).texRacineCarree(false)}\\right\\}$.`
      }
      texteCorr += ` L'ensemble de solutions est $S=${sol}`
      if (this.questionJamaisPosee(i, coeffConstant, coeffX)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
