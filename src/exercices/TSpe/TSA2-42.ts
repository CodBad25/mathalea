import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { combinaisonListes } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { rienSi1 } from '../../lib/outils/ecritures'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  'Calculer une limite avec le théorème des croissances comparées'
export const dateDePublication = '08/08/2026'
export const interactifReady = true
export const interactifType = 'mathLive'

export const uuid = 'a7c42'
export const refs = {
  'fr-fr': ['TSA2-42'],
  'fr-ch': [],
}

type TypeQuestion =
  | 'exponentielleSurPuissance'
  | 'puissanceFoisExponentielle'
  | 'exponentielleMoinsPolynome'
  | 'exponentielleComposeeSurPuissance'
  | 'puissanceFoisExponentielleComposee'
  | 'exponentielleComposeeMoinsPolynome'

const typesSansChangementDeVariable: TypeQuestion[] = [
  'exponentielleSurPuissance',
  'puissanceFoisExponentielle',
  'exponentielleMoinsPolynome',
]

const typesAvecChangementDeVariable: TypeQuestion[] = [
  'exponentielleComposeeSurPuissance',
  'puissanceFoisExponentielleComposee',
  'exponentielleComposeeMoinsPolynome',
]

function puissance(variable: string, exposant: number): string {
  return exposant === 1 ? variable : `${variable}^{${exposant}}`
}

function coefficientFois(coefficient: number, expression: string): string {
  return `${rienSi1(coefficient)}${expression}`
}

/**
 * Limites obtenues directement avec le théorème des croissances comparées.
 * @author Stéphane Guyon
 */
export default class CroissancesComparees extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 2
    this.sup = 3
    this.besoinFormulaireNumerique = [
      'Type de calcul',
      3,
      '1 : Sans changement de variable\n2 : Avec changement de variable\n3 : Mélange',
    ]
  }

  nouvelleVersion(): void {
    this.consigne =
      this.nbQuestions === 1
        ? 'Déterminer la limite de la fonction.'
        : 'Déterminer les limites des fonctions.'

    const typesDisponibles =
      this.sup === 1
        ? typesSansChangementDeVariable
        : this.sup === 2
          ? typesAvecChangementDeVariable
          : [
              ...typesSansChangementDeVariable,
              ...typesAvecChangementDeVariable,
            ]
    const types = combinaisonListes<TypeQuestion>(
      typesDisponibles,
      this.nbQuestions,
    )

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; cpt++) {
      const type = types[i]
      const exposant = randint(1, 5)
      const coefficient = randint(-5, 5, 0)
      const coefficientExponentielle = randint(2, 4)
      const puissanceDeX = puissance('x', exposant)
      const puissanceDeXMajuscule = puissance('X', exposant)
      let expression: string
      let sens: '+' | '-'
      let reponse: '0' | '+\\infty' | '-\\infty'
      let correction: string

      switch (type) {
        case 'exponentielleSurPuissance': {
          expression = `\\dfrac{${coefficientFois(coefficient, '\\mathrm{e}^{x}')}}{${puissanceDeX}}`
          sens = '+'
          reponse = coefficient > 0 ? '+\\infty' : '-\\infty'
          correction = `D’après le théorème des croissances comparées, pour tout entier naturel $n$,<br>
          $\\displaystyle \\lim_{x\\to+\\infty}\\dfrac{\\mathrm{e}^{x}}{x^n}=+\\infty$.<br>
          On a donc $\\displaystyle \\lim_{x\\to+\\infty}\\dfrac{\\mathrm{e}^{x}}{${puissanceDeX}}=+\\infty$.<br>
          Comme $${coefficient}${coefficient > 0 ? '>0' : '<0'}$, $\\displaystyle \\lim_{x\\to+\\infty}f(x)=${miseEnEvidence(reponse)}$.`
          break
        }
        case 'puissanceFoisExponentielle': {
          expression = coefficientFois(
            coefficient,
            `${puissanceDeX}\\mathrm{e}^{x}`,
          )
          sens = '-'
          reponse = '0'
          correction = `D’après le théorème des croissances comparées, pour tout entier naturel $n$,<br>
          $\\displaystyle \\lim_{x\\to-\\infty}x^n\\mathrm{e}^{x}=0$.<br>
          On a donc $\\displaystyle \\lim_{x\\to-\\infty}${puissanceDeX}\\mathrm{e}^{x}=0$, puis<br>
          $\\displaystyle \\lim_{x\\to-\\infty}f(x)=${miseEnEvidence('0')}$.`
          break
        }
        case 'exponentielleMoinsPolynome': {
          const coefficientPolynome = randint(1, 6)
          const termePolynomial = coefficientFois(
            coefficientPolynome,
            puissanceDeX,
          )
          expression = `\\mathrm{e}^{x}-${termePolynomial}`
          sens = '+'
          reponse = '+\\infty'
          correction = `Pour tout $x\\neq 0$, on factorise par $${puissanceDeX}$ :<br>
          $\\begin{aligned}
          f(x)&=\\mathrm{e}^{x}-${termePolynomial}\\\\
          &=${puissanceDeX}\\left(\\dfrac{\\mathrm{e}^{x}}{${puissanceDeX}}-${coefficientPolynome}\\right).
          \\end{aligned}$<br>
          D’après le théorème des croissances comparées, $\\displaystyle \\lim_{x\\to+\\infty}\\dfrac{\\mathrm{e}^{x}}{${puissanceDeX}}=+\\infty$.<br>
          Ainsi, $\\displaystyle \\lim_{x\\to+\\infty}\\left(\\dfrac{\\mathrm{e}^{x}}{${puissanceDeX}}-${coefficientPolynome}\\right)=+\\infty$.<br>
          De plus, $\\displaystyle \\lim_{x\\to+\\infty}${puissanceDeX}=+\\infty$.<br>
          Par produit, $\\displaystyle \\lim_{x\\to+\\infty}f(x)=${miseEnEvidence('+\\infty')}$.`
          break
        }
        case 'exponentielleComposeeSurPuissance': {
          const coefficientFinal =
            coefficient * coefficientExponentielle ** exposant
          const puissanceApresSubstitution =
            exposant === 1
              ? `\\dfrac{1}{${coefficientExponentielle}}X`
              : `\\left(\\dfrac{1}{${coefficientExponentielle}}X\\right)^{${exposant}}`
          expression = `\\dfrac{${coefficientFois(coefficient, `\\mathrm{e}^{${coefficientExponentielle}x}`)}}{${puissanceDeX}}`
          sens = '+'
          reponse = coefficient > 0 ? '+\\infty' : '-\\infty'
          correction = `On pose $X=${coefficientExponentielle}x$, donc $x=\\dfrac{1}{${coefficientExponentielle}}X$.<br>
          Ainsi,<br>
          $\\begin{aligned}
          f(x)&=\\dfrac{${coefficientFois(coefficient, `\\mathrm{e}^{${coefficientExponentielle}x}`)}}{${puissanceDeX}}\\\\
          &=\\dfrac{${coefficientFois(coefficient, '\\mathrm{e}^{X}')}}{${puissanceApresSubstitution}}\\\\
          &=${coefficientFois(coefficientFinal, `\\dfrac{\\mathrm{e}^{X}}{${puissanceDeXMajuscule}}`)}.
          \\end{aligned}$<br>
          D’après le théorème des croissances comparées, $\\displaystyle \\lim_{X\\to+\\infty}\\dfrac{\\mathrm{e}^{X}}{${puissanceDeXMajuscule}}=+\\infty$.<br>
          Comme $${coefficientFinal}${coefficientFinal > 0 ? '>0' : '<0'}$, $\\displaystyle \\lim_{x\\to+\\infty}f(x)=${miseEnEvidence(reponse)}$.`
          break
        }
        case 'puissanceFoisExponentielleComposee': {
          const denominateurCoefficient =
            coefficientExponentielle ** exposant
          const puissanceApresSubstitution =
            exposant === 1
              ? `\\dfrac{1}{${coefficientExponentielle}}X`
              : `\\left(\\dfrac{1}{${coefficientExponentielle}}X\\right)^{${exposant}}`
          expression = coefficientFois(
            coefficient,
            `${puissanceDeX}\\mathrm{e}^{${coefficientExponentielle}x}`,
          )
          sens = '-'
          reponse = '0'
          correction = `On pose $X=${coefficientExponentielle}x$, donc $x=\\dfrac{1}{${coefficientExponentielle}}X$.<br>
          Ainsi,<br>
          $\\begin{aligned}
          f(x)&=${expression}\\\\
          &=${coefficientFois(coefficient, puissanceApresSubstitution)}\\mathrm{e}^{X}\\\\
          &=\\dfrac{${coefficient}}{${denominateurCoefficient}}${puissanceDeXMajuscule}\\mathrm{e}^{X}.
          \\end{aligned}$<br>
          D’après le théorème des croissances comparées, $\\displaystyle \\lim_{X\\to-\\infty}${puissanceDeXMajuscule}\\mathrm{e}^{X}=0$.<br>
          On en déduit que $\\displaystyle \\lim_{x\\to-\\infty}f(x)=${miseEnEvidence('0')}$.`
          break
        }
        case 'exponentielleComposeeMoinsPolynome': {
          const coefficientPolynome = randint(1, 6)
          const denominateurCoefficient =
            coefficientExponentielle ** exposant
          const termePolynomial = coefficientFois(
            coefficientPolynome,
            puissanceDeX,
          )
          const puissanceApresSubstitution =
            exposant === 1
              ? `\\dfrac{1}{${coefficientExponentielle}}X`
              : `\\left(\\dfrac{1}{${coefficientExponentielle}}X\\right)^{${exposant}}`
          expression = `\\mathrm{e}^{${coefficientExponentielle}x}-${termePolynomial}`
          sens = '+'
          reponse = '+\\infty'
          correction = `On pose $X=${coefficientExponentielle}x$, donc $x=\\dfrac{1}{${coefficientExponentielle}}X$.<br>
          Ainsi,<br>
          $\\begin{aligned}
          f(x)&=\\mathrm{e}^{${coefficientExponentielle}x}-${termePolynomial}\\\\
          &=\\mathrm{e}^{X}-${coefficientFois(coefficientPolynome, puissanceApresSubstitution)}\\\\
          &=${puissanceDeXMajuscule}\\left(\\dfrac{\\mathrm{e}^{X}}{${puissanceDeXMajuscule}}-\\dfrac{${coefficientPolynome}}{${denominateurCoefficient}}\\right).
          \\end{aligned}$<br>
          D’après le théorème des croissances comparées, $\\displaystyle \\lim_{X\\to+\\infty}\\dfrac{\\mathrm{e}^{X}}{${puissanceDeXMajuscule}}=+\\infty$.<br>
          Ainsi, $\\displaystyle \\lim_{X\\to+\\infty}\\left(\\dfrac{\\mathrm{e}^{X}}{${puissanceDeXMajuscule}}-\\dfrac{${coefficientPolynome}}{${denominateurCoefficient}}\\right)=+\\infty$.<br>
          De plus, $\\displaystyle \\lim_{X\\to+\\infty}${puissanceDeXMajuscule}=+\\infty$.<br>
          Par produit, $\\displaystyle \\lim_{x\\to+\\infty}f(x)=${miseEnEvidence('+\\infty')}$.`
          break
        }
      }

      const indice = `x\\to${sens}\\infty`
      let texte = `Soit $f$ la fonction définie sur $\\mathbb R$ par $f(x)=${expression}$.<br>`
      if (type.includes('SurPuissance')) {
        texte = `Soit $f$ la fonction définie sur $\\mathbb R^*$ par $f(x)=${expression}$.<br>`
      }
      if (this.interactif) {
        texte += `$\\displaystyle \\lim_{${indice}}f(x)=$${ajouteChampTexteMathLive(this, i, KeyboardType.clavierLimites)}`
      } else {
        texte += `Calculer $\\displaystyle \\lim_{${indice}}f(x)$.`
      }

      if (this.questionJamaisPosee(i, type, expression)) {
        handleAnswers(this, i, { reponse: { value: reponse } })
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = correction
        i++
      }
    }
    listeQuestionsToContenu(this)
  }
}
