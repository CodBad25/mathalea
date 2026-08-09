import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { Polynome } from '../../lib/mathFonctions/Polynome'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import {
  ecritureAlgebrique,
  reduireAxPlusB,
  rienSi1,
} from '../../lib/outils/ecritures'
import FractionEtendue from '../../modules/FractionEtendue'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Calculer une limite par composition'
export const dateDePublication = '08/08/2026'
export const interactifReady = true
export const interactifType = 'mathLive'

export const uuid = 'dbe69'
export const refs = {
  'fr-fr': ['TSA2-18', 'TCA2-18'],
  'fr-ch': [],
}

type SensLimite = '+' | '-'
type CasQuestion = 1 | 2 | 3 | 4 | 5
type TypeQuestion =
  | 'racinePolynome'
  | 'racineRationnelleInfini'
  | 'racineRationnelleZero'
  | 'racineRationnelleConstante'
  | 'exponentiellePolynome'
  | 'exponentielleRationnelleInfini'
  | 'exponentielleRationnelleZero'
  | 'exponentielleRationnelleConstante'
  | 'trigonometrie'
  | 'affineOuPuissance'

function ecriturePolynome(
  coefficient: number,
  degre: number,
  constante: number,
): string {
  const coefficients = Array.from({ length: degre + 1 }, () => 0)
  coefficients[0] = constante
  coefficients[degre] = coefficient
  return new Polynome({ coeffs: coefficients, letter: 'x' }).toString()
}

function signeLimiteMonome(
  coefficient: number,
  degre: number,
  sens: SensLimite,
): number {
  const signePuissance = sens === '+' || degre % 2 === 0 ? 1 : -1
  return coefficient * signePuissance > 0 ? 1 : -1
}

function infini(signe: number): '+\\infty' | '-\\infty' {
  return signe > 0 ? '+\\infty' : '-\\infty'
}

function limitePuissanceDeX(
  limiteInterieure: '+\\infty' | '-\\infty',
  exposant: number,
): '+\\infty' | '-\\infty' {
  if (limiteInterieure === '+\\infty' || exposant % 2 === 0) {
    return '+\\infty'
  }
  return '-\\infty'
}

/**
 * Limites obtenues par composition de fonctions usuelles.
 * @author Stéphane Guyon
 */
export default class LimitesParComposition extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 2
  }

  nouvelleVersion(): void {
    const typesRacineRationnelle: TypeQuestion[] = [
      'racineRationnelleInfini',
      'racineRationnelleZero',
      'racineRationnelleConstante',
    ]
    const typesExponentielle: TypeQuestion[] = [
      'exponentiellePolynome',
      'exponentielleRationnelleInfini',
      'exponentielleRationnelleZero',
      'exponentielleRationnelleConstante',
    ]
    const casQuestions = combinaisonListes<CasQuestion>(
      [1, 2, 3, 4, 5],
      this.nbQuestions,
    )
    const types = casQuestions.map((cas): TypeQuestion => {
      switch (cas) {
        case 1:
          return 'racinePolynome'
        case 2:
          return choice(typesRacineRationnelle)
        case 3:
          return choice(typesExponentielle)
        case 4:
          return 'trigonometrie'
        case 5:
          return 'affineOuPuissance'
      }
    })
    const sensDesLimites = combinaisonListes<SensLimite>(
      ['+', '-'],
      this.nbQuestions,
    )

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; cpt++) {
      const type = types[i]
      const sens = sensDesLimites[i]
      const indice = `x\\to${sens}\\infty`
      let domaine = '\\mathbb R'
      let expression: string
      let reponse: string
      let correction: string

      if (type === 'racinePolynome') {
        const coefficient = randint(1, 5)
        const degre = choice([2, 4])
        const constante = randint(1, 8)
        const u = ecriturePolynome(coefficient, degre, constante)
        expression = `\\sqrt{${u}}`
        reponse = '+\\infty'
        correction = `On pose $u$ la fonction définie sur $${domaine}$ par $u(x)=${u}$.<br>
        Ainsi, pour tout $x\\in D_f$, $f(x)=\\sqrt{u(x)}$.<br>
        On sait que $\\displaystyle \\lim_{${indice}}x^{${degre}}=+\\infty$, donc $\\displaystyle \\lim_{${indice}}u(x)=+\\infty$.<br>
        Or $\\displaystyle \\lim_{X\\to+\\infty}\\sqrt X=+\\infty$.<br>
        Par composition, $\\displaystyle \\lim_{${indice}}f(x)=${miseEnEvidence(reponse)}$.`
      } else if (type.startsWith('racineRationnelle')) {
        const a = randint(1, 5)
        const b = randint(1, 8)
        const c = randint(1, 5)
        const d = randint(1, 8)
        let numerateur: string
        let denominateur: string
        let limiteU: string
        let limiteExterieure: string

        if (type === 'racineRationnelleInfini') {
          numerateur = ecriturePolynome(a, 4, b)
          denominateur = ecriturePolynome(c, 2, d)
          limiteU = '+\\infty'
          reponse = '+\\infty'
          limiteExterieure =
            '\\displaystyle \\lim_{X\\to+\\infty}\\sqrt X=+\\infty'
        } else if (type === 'racineRationnelleZero') {
          numerateur = ecriturePolynome(a, 2, b)
          denominateur = ecriturePolynome(c, 4, d)
          limiteU = '0^+'
          reponse = '0'
          limiteExterieure =
            '\\displaystyle \\lim_{X\\to0^+}\\sqrt X=0'
        } else {
          const p = randint(1, 4)
          const q = randint(1, 4)
          numerateur = ecriturePolynome(p * p, 2, b)
          denominateur = ecriturePolynome(q * q, 2, d)
          const limiteFraction = new FractionEtendue(p * p, q * q)
          limiteU = limiteFraction.texFractionSimplifiee
          reponse = new FractionEtendue(p, q).texFractionSimplifiee
          limiteExterieure = `\\displaystyle \\lim_{X\\to${limiteU}}\\sqrt X=${reponse}`
        }
        const u = `\\dfrac{${numerateur}}{${denominateur}}`
        expression = `\\sqrt{${u}}`
        correction = `On pose $u$ la fonction définie sur $${domaine}$ par $u(x)=${u}$.<br>
        Ainsi, pour tout $x\\in D_f$, $f(x)=\\sqrt{u(x)}$.<br>
        En comparant les degrés du numérateur et du dénominateur, on obtient $\\displaystyle \\lim_{${indice}}u(x)=${limiteU}$.<br>
        Or $${limiteExterieure}$.<br>
        Par composition, $\\displaystyle \\lim_{${indice}}f(x)=${miseEnEvidence(reponse)}$.`
      } else if (type.startsWith('exponentielle')) {
        let u: string
        let limiteU: string
        let limiteExterieure: string

        if (type === 'exponentiellePolynome') {
          const coefficient = randint(-5, 5, 0)
          const degre = randint(1, 3)
          const constante = randint(-6, 6)
          u = ecriturePolynome(coefficient, degre, constante)
          limiteU = infini(signeLimiteMonome(coefficient, degre, sens))
          reponse = limiteU === '+\\infty' ? '+\\infty' : '0'
          limiteExterieure = `\\displaystyle \\lim_{X\\to${limiteU}}\\mathrm{e}^{X}=${reponse}`
        } else {
          const signe = choice([-1, 1])
          const a = randint(1, 5)
          const b = randint(1, 8)
          const c = randint(1, 5)
          const d = randint(1, 8)
          let numerateur: string
          let denominateur: string
          if (type === 'exponentielleRationnelleInfini') {
            numerateur = ecriturePolynome(signe * a, 4, signe * b)
            denominateur = ecriturePolynome(c, 2, d)
            limiteU = infini(signe)
            reponse = signe > 0 ? '+\\infty' : '0'
          } else if (type === 'exponentielleRationnelleZero') {
            numerateur = ecriturePolynome(signe * a, 2, signe * b)
            denominateur = ecriturePolynome(c, 4, d)
            limiteU = '0'
            reponse = '1'
          } else {
            numerateur = ecriturePolynome(signe * a, 2, signe * b)
            denominateur = ecriturePolynome(c, 2, d)
            limiteU = new FractionEtendue(signe * a, c).texFractionSimplifiee
            reponse = `\\mathrm{e}^{${limiteU}}`
          }
          u = `\\dfrac{${numerateur}}{${denominateur}}`
          limiteExterieure = `\\displaystyle \\lim_{X\\to${limiteU}}\\mathrm{e}^{X}=${reponse}`
        }
        expression = `\\mathrm{e}^{${u}}`
        correction = `On pose $u$ la fonction définie sur $${domaine}$ par $u(x)=${u}$.<br>
        Ainsi, pour tout $x\\in D_f$, $f(x)=\\mathrm{e}^{u(x)}$.<br>
        On obtient $\\displaystyle \\lim_{${indice}}u(x)=${limiteU}$.<br>
        Or $${limiteExterieure}$.<br>
        Par composition, $\\displaystyle \\lim_{${indice}}f(x)=${miseEnEvidence(reponse)}$.`
      } else if (type === 'trigonometrie') {
        const fonctionTrigo = choice(['\\cos', '\\sin'])
        const numerateurInitial = randint(-6, 6, 0)
        const coefficientAffineInitial = randint(-4, 4, 0)
        const changementSigne =
          numerateurInitial < 0 && coefficientAffineInitial < 0 ? -1 : 1
        const coefficientNumerateur = changementSigne * numerateurInitial
        const coefficientAffine = changementSigne * coefficientAffineInitial
        const racine = randint(-5, 5)
        const affine = reduireAxPlusB(
          coefficientAffine,
          -coefficientAffine * racine,
        )
        const u = `\\dfrac{${coefficientNumerateur}}{${affine}}`
        expression = `${fonctionTrigo}\\left(${u}\\right)`
        domaine = `\\mathbb R\\setminus\\{${racine}\\}`
        reponse = fonctionTrigo === '\\cos' ? '1' : '0'
        correction = `On pose $u$ la fonction définie sur $${domaine}$ par $u(x)=${u}$.<br>
        Ainsi, pour tout $x\\in D_f$, $f(x)=${fonctionTrigo}(u(x))$.<br>
        Comme $\\displaystyle \\lim_{${indice}}(${affine})=${infini(signeLimiteMonome(coefficientAffine, 1, sens))}$, on obtient $\\displaystyle \\lim_{${indice}}u(x)=0$.<br>
        Or $\\displaystyle \\lim_{X\\to0}${fonctionTrigo}(X)=${reponse}$.<br>
        Par composition, $\\displaystyle \\lim_{${indice}}f(x)=${miseEnEvidence(reponse)}$.`
      } else {
        const uCoefficient = randint(-4, 4, 0)
        const uDegre = randint(1, 3)
        const uConstante = randint(-5, 5)
        const u = ecriturePolynome(uCoefficient, uDegre, uConstante)
        const limiteU = infini(
          signeLimiteMonome(uCoefficient, uDegre, sens),
        )

        if (choice([true, false])) {
          const exposant = choice([3, 4, 5])
          expression = `\\left(${u}\\right)^{${exposant}}`
          reponse = limitePuissanceDeX(limiteU, exposant)
          correction = `On pose $u$ la fonction définie sur $${domaine}$ par $u(x)=${u}$.<br>
          Ainsi, pour tout $x\\in D_f$, $f(x)=u(x)^{${exposant}}$.<br>
          On a $\\displaystyle \\lim_{${indice}}u(x)=${limiteU}$.<br>
          Or $\\displaystyle \\lim_{X\\to${limiteU}}X^{${exposant}}=${reponse}$.<br>
          Par composition, $\\displaystyle \\lim_{${indice}}f(x)=${miseEnEvidence(reponse)}$.`
        } else {
          const coefficientAffine = randint(-5, 5, 0)
          const constanteAffine = randint(-6, 6)
          expression = `${rienSi1(coefficientAffine)}\\left(${u}\\right)${ecritureAlgebrique(constanteAffine)}`
          const signeReponse =
            coefficientAffine * (limiteU === '+\\infty' ? 1 : -1)
          reponse = infini(signeReponse)
          const fonctionExterieure = `${rienSi1(coefficientAffine)}X${ecritureAlgebrique(constanteAffine)}`
          correction = `On pose $u$ la fonction définie sur $${domaine}$ par $u(x)=${u}$.<br>
          Ainsi, pour tout $x\\in D_f$, $f(x)=${fonctionExterieure.replace('X', 'u(x)')}$.<br>
          On a $\\displaystyle \\lim_{${indice}}u(x)=${limiteU}$.<br>
          Or $\\displaystyle \\lim_{X\\to${limiteU}}\\left(${fonctionExterieure}\\right)=${reponse}$.<br>
          Par composition, $\\displaystyle \\lim_{${indice}}f(x)=${miseEnEvidence(reponse)}$.`
        }
      }

      let texte = `Soit $f$ la fonction définie sur $D_f=${domaine}$ par $f(x)=${expression}$.<br>`
      if (this.interactif) {
        texte += `$\\displaystyle \\lim_{${indice}}f(x)=$${ajouteChampTexteMathLive(this, i, KeyboardType.clavierLimites)}`
      } else {
        texte += `Calculer $\\displaystyle \\lim_{${indice}}f(x)$.`
      }

      if (this.questionJamaisPosee(i, expression, sens)) {
        handleAnswers(this, i, { reponse: { value: reponse } })
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = correction
        i++
      }
    }
    listeQuestionsToContenu(this)
  }
}
