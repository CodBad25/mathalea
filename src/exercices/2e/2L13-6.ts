import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { Polynome } from '../../lib/mathFonctions/Polynome'
import { combinaisonListes } from '../../lib/outils/arrayOutils'
import {
  ecritureAlgebrique,
  ecritureAlgebriqueSauf1,
  reduireAxPlusB,
} from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { lettreDepuisChiffre } from '../../lib/outils/outilString'
import { pgcd } from '../../lib/outils/primalite'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Factoriser une expression avec un facteur commun'
export const dateDePublication = '24/08/2026'
export const uuid = '0fe88'

export const refs = {
  'fr-fr': ['2L13-6'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Factoriser des expressions en mettant en évidence un facteur commun.
 * @author Stéphane Guyon
 */
export default class FactoriserAvecFacteurCommun extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 3
    this.sup = '8'
    this.spacing = 2
    this.spacingCorr = 2
    this.listeAvecNumerotation = false
    this.besoinFormulaireTexte = [
      'Types de questions',
      [
        'Nombres séparés par des tirets :',
        '1 : $ax^2+bx$',
        '2 : $x(ax+b)+kx$',
        '3 : $(ax+b)(cx+d)+(ax+b)(ex+f)$',
        '4 : $(ax+b)(cx+d)-(ax+b)(ex+f)$',
        '5 : $(ax+b)^2+(ax+b)(ex+f)$',
        '6 : $(ax+b)^2-(ax+b)(ex+f)$',
        '7 : $x^2-a^2$ ou $a^2-x^2$',
        '8 : Mélange',
      ].join('\n'),
    ]
  }

  nouvelleVersion() {
    this.consigne =
      this.nbQuestions > 1
        ? 'Factoriser au maximum les expressions suivantes.'
        : "Factoriser au maximum l'expression suivante."

    const types = combinaisonListes(
      gestionnaireFormulaireTexte({
        saisie: this.sup,
        min: 1,
        max: 7,
        melange: 8,
        defaut: 8,
        nbQuestions: this.nbQuestions,
      }),
      this.nbQuestions,
    )

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; cpt++) {
      const type = types[i]
      let a = randint(-6, 6, 0)
      let b = randint(-9, 9, 0)
      let c = randint(-6, 6, [0, a])
      let d = randint(-9, 9, [0, b])
      let e = randint(-6, 6, [0, a, c])
      let f = randint(-9, 9, [0, b, d])

      if (type === 1) {
        while (pgcd(Math.abs(a), Math.abs(b)) !== 1) {
          a = randint(-6, 6, 0)
          b = randint(-9, 9, 0)
        }
      }

      if (type === 2) {
        let k = randint(-9, 9, [0, -b])
        while (pgcd(Math.abs(a), Math.abs(b + k)) !== 1) {
          k = randint(-9, 9, [0, -b])
        }
        c = k
      }

      if (type === 3 || type === 4) {
        while (
          (type === 3 && (c + e === 0 || d + f === 0)) ||
          (type === 4 && (c - e === 0 || d - f === 0))
        ) {
          e = randint(-6, 6, [0, a, c])
          f = randint(-9, 9, [0, b, d])
        }
      }

      if (type === 5 || type === 6) {
        while (
          (type === 5 && (a + e === 0 || b + f === 0)) ||
          (type === 6 && (a - e === 0 || b - f === 0))
        ) {
          e = randint(-6, 6, [0, a])
          f = randint(-9, 9, [0, b])
        }
      }

      if (type === 7) {
        a = randint(2, 12)
        c = randint(0, 1)
      }

      const facteurCommun = reduireAxPlusB(a, b)
      const facteurC = reduireAxPlusB(c, d)
      const facteurE = reduireAxPlusB(e, f)
      let expression = ''
      let reponse = ''
      let correction = ''

      switch (type) {
        case 1: {
          expression = new Polynome({
            rand: false,
            coeffs: [0, b, a],
          }).toLatex()
          reponse = `x(${facteurCommun})`
          correction = `Les deux termes ont le facteur commun $x$.<br>
          $\\begin{aligned}
          ${expression}&=x\\times(${reduireAxPlusB(a, 0)})+x\\times(${b})\\\\
          &=${miseEnEvidence(reponse)}.
          \\end{aligned}$`
          break
        }
        case 2: {
          const k = c
          expression = `x(${facteurCommun})${k > 0 ? '+' : ''}${k}x`
          reponse = `x(${reduireAxPlusB(a, b + k)})`
          correction = `Les deux termes ont le facteur commun $x$.<br>
          $\\begin{aligned}
          ${expression}&=x\\left[(${facteurCommun})${k > 0 ? '+' : ''}${k}\\right]\\\\
          &=${miseEnEvidence(reponse)}.
          \\end{aligned}$`
          break
        }
        case 3: {
          expression = `(${facteurCommun})(${facteurC})+(${facteurCommun})(${facteurE})`
          reponse = `(${facteurCommun})(${reduireAxPlusB(c + e, d + f)})`
          correction = `On reconnaît le facteur commun $(${facteurCommun})$.<br>
          $\\begin{aligned}
          ${expression}&=(${facteurCommun})\\left[(${facteurC})+(${facteurE})\\right]\\\\
          &=${miseEnEvidence(reponse)}.
          \\end{aligned}$`
          break
        }
        case 4: {
          expression = `(${facteurCommun})(${facteurC})-(${facteurCommun})(${facteurE})`
          reponse = `(${facteurCommun})(${reduireAxPlusB(c - e, d - f)})`
          correction = `On reconnaît le facteur commun $(${facteurCommun})$.<br>
          $\\begin{aligned}
          ${expression}&=(${facteurCommun})\\left[(${facteurC})-(${facteurE})\\right]\\\\
          &=(${facteurCommun})\\left[${facteurC}${ecritureAlgebriqueSauf1(-e)}x${ecritureAlgebrique(-f)}\\right]\\\\
          &=${miseEnEvidence(reponse)}.
          \\end{aligned}$`
          break
        }
        case 5: {
          expression = `(${facteurCommun})^2+(${facteurCommun})(${facteurE})`
          reponse = `(${facteurCommun})(${reduireAxPlusB(a + e, b + f)})`
          correction = `On reconnaît le facteur commun $(${facteurCommun})$.<br>
          $\\begin{aligned}
          ${expression}&=(${facteurCommun})(${facteurCommun})+(${facteurCommun})(${facteurE})\\\\
          &=(${facteurCommun})\\left[(${facteurCommun})+(${facteurE})\\right]\\\\
          &=${miseEnEvidence(reponse)}.
          \\end{aligned}$`
          break
        }
        case 6: {
          expression = `(${facteurCommun})^2-(${facteurCommun})(${facteurE})`
          reponse = `(${facteurCommun})(${reduireAxPlusB(a - e, b - f)})`
          correction = `On reconnaît le facteur commun $(${facteurCommun})$.<br>
          $\\begin{aligned}
          ${expression}&=(${facteurCommun})(${facteurCommun})-(${facteurCommun})(${facteurE})\\\\
          &=(${facteurCommun})\\left[(${facteurCommun})-(${facteurE})\\right]\\\\
          &=(${facteurCommun})\\left[${facteurCommun}${ecritureAlgebriqueSauf1(-e)}x${ecritureAlgebrique(-f)}\\right]\\\\
          &=${miseEnEvidence(reponse)}.
          \\end{aligned}$`
          break
        }
        case 7: {
          const xCarreEnPremier = c === 1
          expression = xCarreEnPremier ? `x^2-${a}^2` : `${a}^2-x^2`
          reponse = xCarreEnPremier
            ? `(x-${a})(x+${a})`
            : `(${a}-x)(${a}+x)`
          correction = `On reconnaît l'identité remarquable $A^2-B^2=(A-B)(A+B)$.<br>
          $\\begin{aligned}
          ${expression}&=${miseEnEvidence(reponse)}.
          \\end{aligned}$`
          break
        }
      }

      if (this.questionJamaisPosee(i, expression)) {
        const lettre = lettreDepuisChiffre(i + 1)
        const texte = this.interactif
          ? `$${lettre}=${expression}=$` +
            ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierDeBaseAvecVariable,
            )
          : `$${lettre}=${expression}$`
        this.listeQuestions.push(texte)
        this.listeCorrections.push(`$${lettre}=${expression}$<br>${correction}`)
        handleAnswers(this, i, {
          reponse: {
            value: reponse,
            options: { factorisation: true },
          },
        })
        i++
      }
    }
    listeQuestionsToContenu(this)
  }
}
