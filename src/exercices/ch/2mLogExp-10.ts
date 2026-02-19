import Decimal from 'decimal.js'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Propriétés des logarithmes'
export const dateDePublication = '12/02/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = '2l10e'
export const refs = {
  'fr-fr': [],
  'fr-ch': ['2mLogExp-10'],
}

/**
 * Propriétés des logarithmes
 * @author Nathan Scheinmann
 */
export default class ProprietesLogarithmes extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 4
    this.besoinFormulaireCaseACocher = ['Logarithme népérien (ln)', false]
    this.sup = false
  }

  nouvelleVersion() {
    const logString = this.sup ? '\\ln' : '\\log'

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      let texte = ''
      let texteCorr = ''
      let cleUnique = ''

      // Propriétés des logarithmes (somme→produit, différence→quotient, puissance)
      const variante = choice([
        'somme',
        'difference',
        'puissance',
        'combinaison',
      ])

      if (variante === 'somme') {
        // log_a(b) + log_a(c) = log_a(bc)
        const a = choice([2, 3, 5, 10])
        const b = randint(2, 10)
        const c = randint(2, 10)
        const produit = b * c

        cleUnique = `proprietes-somme-${a}-${b}-${c}`

        texte = `Simplifier $\\log_{${a}}(${b}) + \\log_{${a}}(${c})$ en un seul logarithme, puis calculer.`
        texte += ` Arrondir au millième près.`

        const resultat = new Decimal(produit).ln().div(new Decimal(a).ln())
        const resultatArrondi = resultat.toDecimalPlaces(3)

        texteCorr = `On utilise la propriété : $\\log_a(b) + \\log_a(c) = \\log_a(b \\times c)$<br><br>`
        texteCorr += `$\\begin{aligned}\n`
        texteCorr += `\\log_{${a}}(${b}) + \\log_{${a}}(${c}) &= \\log_{${a}}(${b} \\times ${c})\\\\\n`
        texteCorr += `&= \\log_{${a}}(${produit})\\\\\n`
        texteCorr += `&= \\dfrac{${logString}(${produit})}{${logString}(${a})}\\\\\n`
        texteCorr += `&\\approx ${miseEnEvidence(texNombre(resultatArrondi, 3, true))}\n`
        texteCorr += `\\end{aligned}$`

        if (this.interactif) {
          texte += ajouteChampTexteMathLive(
            this,
            i,
            KeyboardType.clavierDeBase,
            {
              texteAvant: '<br>Réponse : ',
            },
          )
          handleAnswers(this, i, {
            reponse: {
              value: resultatArrondi.toFixed(3),
              options: { nombreDecimalSeulement: true },
            },
          })
        }
      } else if (variante === 'difference') {
        // log_a(b) - log_a(c) = log_a(b/c)
        const a = choice([2, 3, 5, 10])
        const c = randint(2, 8)
        const multiple = randint(2, 5)
        const b = c * multiple

        cleUnique = `proprietes-difference-${a}-${b}-${c}`

        texte = `Simplifier $\\log_{${a}}(${b}) - \\log_{${a}}(${c})$ en un seul logarithme, puis calculer.`
        texte += ` Arrondir au millième près.`

        const quotient = b / c
        const resultat = new Decimal(quotient).ln().div(new Decimal(a).ln())
        const resultatArrondi = resultat.toDecimalPlaces(3)

        texteCorr = `On utilise la propriété : $\\log_a(b) - \\log_a(c) = \\log_a\\left(\\dfrac{b}{c}\\right)$<br><br>`
        texteCorr += `$\\begin{aligned}\n`
        texteCorr += `\\log_{${a}}(${b}) - \\log_{${a}}(${c}) &= \\log_{${a}}\\left(\\dfrac{${b}}{${c}}\\right)\\\\\n`
        texteCorr += `&= \\log_{${a}}(${quotient})\\\\\n`
        texteCorr += `&= \\dfrac{${logString}(${quotient})}{${logString}(${a})}\\\\\n`
        texteCorr += `&\\approx ${miseEnEvidence(texNombre(resultatArrondi, 3, true))}\n`
        texteCorr += `\\end{aligned}$`

        if (this.interactif) {
          texte += ajouteChampTexteMathLive(
            this,
            i,
            KeyboardType.clavierDeBase,
            {
              texteAvant: '<br>Réponse : ',
            },
          )
          handleAnswers(this, i, {
            reponse: {
              value: resultatArrondi.toFixed(3),
              options: { nombreDecimalSeulement: true },
            },
          })
        }
      } else if (variante === 'puissance') {
        // n·log_a(b) = log_a(b^n)
        const a = choice([2, 3, 5, 10])
        const b = randint(2, 6)
        const n = randint(2, 4)
        const puissance = b ** n

        cleUnique = `proprietes-puissance-${a}-${b}-${n}`

        texte = `Simplifier $${n}\\log_{${a}}(${b})$ en un seul logarithme, puis calculer.`
        texte += ` Arrondir au millième près.`

        const resultat = new Decimal(puissance).ln().div(new Decimal(a).ln())
        const resultatArrondi = resultat.toDecimalPlaces(3)

        texteCorr = `On utilise la propriété : $n \\cdot \\log_a(b) = \\log_a(b^n)$<br><br>`
        texteCorr += `$\\begin{aligned}\n`
        texteCorr += `${n}\\log_{${a}}(${b}) &= \\log_{${a}}(${b}^{${n}})\\\\\n`
        texteCorr += `&= \\log_{${a}}(${puissance})\\\\\n`
        texteCorr += `&= \\dfrac{${logString}(${puissance})}{${logString}(${a})}\\\\\n`
        texteCorr += `&\\approx ${miseEnEvidence(texNombre(resultatArrondi, 3, true))}\n`
        texteCorr += `\\end{aligned}$`

        if (this.interactif) {
          texte += ajouteChampTexteMathLive(
            this,
            i,
            KeyboardType.clavierDeBase,
            {
              texteAvant: '<br>Réponse : ',
            },
          )
          handleAnswers(this, i, {
            reponse: {
              value: resultatArrondi.toFixed(3),
              options: { nombreDecimalSeulement: true },
            },
          })
        }
      } else {
        // Combinaison : n·log_a(b) + log_a(c) = log_a(b^n·c)
        const a = choice([2, 3, 5, 10])
        const b = randint(2, 5)
        const c = randint(2, 8)
        const n = randint(2, 3)
        const resultatArg = b ** n * c

        cleUnique = `proprietes-combinaison-${a}-${b}-${c}-${n}`

        texte = `Simplifier $${n}\\log_{${a}}(${b}) + \\log_{${a}}(${c})$ en un seul logarithme, puis calculer.`
        texte += ` Arrondir au millième près.`

        const resultat = new Decimal(resultatArg).ln().div(new Decimal(a).ln())
        const resultatArrondi = resultat.toDecimalPlaces(3)

        texteCorr = `On utilise les propriétés : $n \\cdot \\log_a(b) = \\log_a(b^n)$ et $\\log_a(x) + \\log_a(y) = \\log_a(xy)$<br><br>`
        texteCorr += `$\\begin{aligned}\n`
        texteCorr += `${n}\\log_{${a}}(${b}) + \\log_{${a}}(${c}) &= \\log_{${a}}(${b}^{${n}}) + \\log_{${a}}(${c})\\\\\n`
        texteCorr += `&= \\log_{${a}}(${b ** n}) + \\log_{${a}}(${c})\\\\\n`
        texteCorr += `&= \\log_{${a}}(${b ** n} \\times ${c})\\\\\n`
        texteCorr += `&= \\log_{${a}}(${resultatArg})\\\\\n`
        texteCorr += `&= \\dfrac{${logString}(${resultatArg})}{${logString}(${a})}\\\\\n`
        texteCorr += `&\\approx ${miseEnEvidence(texNombre(resultatArrondi, 3, true))}\n`
        texteCorr += `\\end{aligned}$`

        if (this.interactif) {
          texte += ajouteChampTexteMathLive(
            this,
            i,
            KeyboardType.clavierDeBase,
            {
              texteAvant: '<br>Réponse : ',
            },
          )
          handleAnswers(this, i, {
            reponse: {
              value: resultatArrondi.toFixed(3),
              options: { nombreDecimalSeulement: true },
            },
          })
        }
      }

      if (this.questionJamaisPosee(i, cleUnique)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
