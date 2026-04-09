import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { combinaisonListes } from '../../lib/outils/arrayOutils'
import { ecritureAlgebrique } from '../../lib/outils/ecritures'
import { context } from '../../modules/context'
import FractionEtendue from '../../modules/FractionEtendue'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

import { orangeMathalea } from '../../lib/colors'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { texFractionFromString } from '../../lib/outils/deprecatedFractions'
import { miseEnEvidence } from '../../lib/outils/embellissements'

export const titre = 'Déterminer un antécédent par une fonction affine'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'd341f'

export const refs = {
  'fr-fr': ['3F23-1'],
  'fr-ch': ['1mF2-17', '11FA8-20'],
}
export const dateDePublication = '08/10/2024'
export const dateDeModifImportante = '11/06/2025'

/**
 * Reconnaitre une fonction affine
 * @author Erwan Duplessy
 * @author Jean-claude Lhote // remis au gout du jour et adapté à l'interactif
 * 3F23
 * date : 2021/02/21
 * référentiel 3F23 - Déterminer de manière algébrique l\'antécédent par une fonction, dans des cas se ramenant à la résolution d\'une équation du premier degré.
 * plusieurs cas :
 * f(x) = ax + b avec a et b petits relatifs
 * f(x) = ax + b avec a et b grands relatifs
 * f(x) = a(x + b) + c avec a, b, c petits relatifs
 * f(x) = a(bx + c) + dx + e  avec a, b, c, d petits relatifs
 */

export default class AntecedentParCalcul extends Exercice {
  constructor() {
    super()

    this.besoinFormulaireTexte = [
      'Type de fonction affine',
      '1 : ax+b (a et b petits relatifs)\n2 : ax+b (a et b grands relatifs)\n3 : a(x+b) + c (petits relatifs)\n4 : a(bx + c) + dx + e (petits relatifs)\n5 : Mélange',
    ]

    this.consigne =
      'Répondre aux questions suivantes avec une valeur exacte simplifiée. '
    this.nbQuestions = 4

    this.spacingCorr = context.isHtml ? 2 : 1
    this.sup = '1'
  }

  nouvelleVersion() {
    const typesDeQuestionsDisponibles = gestionnaireFormulaireTexte({
      saisie: this.sup,
      nbQuestions: this.nbQuestions,
      min: 1,
      max: 4,
      melange: 5,
      defaut: 1,
    })
    const listeTypeDeQuestions = combinaisonListes(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    )

    for (
      let i = 0, texte, texteCorr, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      texte = ''
      let a = 0
      let b = 0
      let c = 0
      let d = 0
      let e = 0
      let m = 0
      let expr = ''
      let ante: FractionEtendue
      texteCorr = `On cherche un nombre $x$ tel que $f(x) = ${m}$.<br>`
      texteCorr += `On résout donc l'équation : $f(x) = ${m}$. <br>`

      switch (
        listeTypeDeQuestions[i] // Chaque question peut être d'un type différent
      ) {
        case 2:
          // f(x) = ax + b avec a et b grands relatifs
          a = randint(-999, 999, [-1, 0, 1])
          b = randint(-999, 999, [0])
          m = randint(-999, 999, [0])
          expr = `$f(x)=${a}x ${ecritureAlgebrique(b)}$`
          texte += `Déterminer l'antécédent de $${m}$ par la fonction $f$ définie par ${expr}. `
          texteCorr += '$\\begin{aligned} '
          texteCorr += ` ${a}x ${ecritureAlgebrique(b)}&= ${m} \\\\ `
          texteCorr += ` ${a}x &= ${m} ${ecritureAlgebrique(-b)}\\\\ `
          ante = new FractionEtendue(m - b, a)
          break

        case 3:
          // f(x) = a(x + b) + c avec a, b, c petits relatifs
          a = randint(-20, 20, [-1, 0, 1])
          b = randint(-20, 20, [0])
          c = randint(-20, 20, [0])
          m = randint(-20, 20)
          expr = `$f(x)=${a}(x ${ecritureAlgebrique(b)})${ecritureAlgebrique(c)}$`
          texte += `Déterminer l'antécédent de $${m}$ par la fonction $f$ définie par ${expr}. `
          texteCorr += '$\\begin{aligned} '
          texteCorr += `${a}(x ${ecritureAlgebrique(b)})${ecritureAlgebrique(c)} &= ${m}\\\\`
          texteCorr += `${a}x ${ecritureAlgebrique(a * b)}${ecritureAlgebrique(c)} &= ${m}\\\\`
          texteCorr += `${a}x ${ecritureAlgebrique(a * b + c)} &= ${m}\\\\`
          texteCorr += `${a}x &= ${m} ${ecritureAlgebrique(-a * b - c)}\\\\`
          ante = new FractionEtendue(m - b * a - c, a)
          break

        case 4:
          // f(x) = a(bx + c) + dx + e  avec a, b, c, d petits relatifs
          a = randint(-20, 20, [-1, 0, 1])
          b = randint(-20, 20, [-1, 0, 1])
          c = randint(-20, 20, [0])
          d = randint(-20, 20, [-1, 0, 1, -a * b]) // d différent de -ab pour assurer une solution
          e = randint(-20, 20, [0])
          m = randint(-20, 20)
          expr = `$f(x)=${a}(${b}x ${ecritureAlgebrique(c)})${ecritureAlgebrique(d)}x${ecritureAlgebrique(e)}$`
          texte += `Déterminer l'antécédent de $${m}$ par la fonction $f$ définie par ${expr}. `
          texteCorr += '$\\begin{aligned} '
          texteCorr += `${a}(${b}x ${ecritureAlgebrique(c)})${ecritureAlgebrique(d)}x${ecritureAlgebrique(e)} &= ${m}\\\\`
          texteCorr += `${a * b}x ${ecritureAlgebrique(a * c)}${ecritureAlgebrique(d)}x${ecritureAlgebrique(e)} &= ${m}\\\\`
          texteCorr += `${a * b + d}x ${ecritureAlgebrique(a * c + e)} &= ${m}\\\\`
          texteCorr += `${a * b + d}x  &= ${m}${ecritureAlgebrique(-a * c - e)}\\\\`
          texteCorr += `${a * b + d}x &= ${m - a * c - e}\\\\`
          ante = new FractionEtendue(m - a * c - e, a * b + d)
          break
        case 1:
        default:
          // f(x) = ax + b avec a et b petits relatifs
          a = randint(-20, 20, [-1, 0, 1])
          b = randint(-20, 20)
          m = randint(-20, 20)
          expr = `$f(x)=${a}x ${ecritureAlgebrique(b)}$`
          texte += `Déterminer l'antécédent de $${m}$ par la fonction $f$ définie par ${expr}. `

          texteCorr += '$\\begin{aligned} '
          texteCorr += `${a}x ${ecritureAlgebrique(b)} &= ${m} \\\\ `
          texteCorr += `${a}x &= ${m} ${ecritureAlgebrique(-b)} \\\\ `
          texteCorr += `${a}x &= ${m - b} \\\\ `
          texteCorr += `${texFractionFromString(a + 'x', a)} &= ${texFractionFromString(m - b, a)} \\\\ ` // EE : Ne pas mettre fractionEtendue car sinon 0/14 affiche 0.
          ante = new FractionEtendue(m - b, a)
          break
      }

      if ((!ante.estIrreductible || ante.inferieurstrict(0)) && ante.num !== 0)
        texteCorr += `x &=${ante.texFraction}${ante.texSimplificationAvecEtapes('none', orangeMathalea)} \\\\` // c'est la couleur de miseEnEvidence
      else texteCorr += `x &=${miseEnEvidence(ante.texFSD)}`
      texteCorr += '\\end{aligned}$'
      if (this.questionJamaisPosee(i, a, b, listeTypeDeQuestions[i])) {
        if (this.interactif) {
          texte += `<br>${ajouteChampTexteMathLive(this, i, KeyboardType.clavierDeBaseAvecFraction)}`
          handleAnswers(this, i, {
            reponse: {
              value: ante.simplifie().texFSD,
              options: { fractionEgale: true, nombreDecimalSeulement: true },
            },
          })
        }
        // Si la question n'a jamais été posée, on la stocke dans la liste des questions
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this) // On envoie l'exercice à la fonction de mise en page
  }
}
