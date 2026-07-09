/**
 * ⚠️ Cet exercice est utilisé dans le test : tests/e2e/tests/interactivity/mathLive.fraction.test.ts ⚠️
 */

import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { arrondi } from '../../lib/outils/nombres'
import { texNombre } from '../../lib/outils/texNombre'
import FractionEtendue from '../../modules/FractionEtendue'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  "Passer d'une fraction à une écriture décimale et inversement"
export const interactifReady = true
export const interactifType = 'mathLive'

export const dateDePublication = '16/03/2022'

/**
 * Propose de passer de l'écriture décimale à l'écriture fractionnaire et inversement
 * Un paramètre permet de limiter cela aux fractions décimales ou d'y incorporer des fractions "simples" (multiples de 1/2, 1/4, 1/5)
 * @author Guillaume Valmont
 */
export const uuid = '91d72'

export const refs = {
  'fr-fr': ['auto5N3B', 'BP2AutoC1'],
  'fr-2016': ['5N10', 'BP2AutoC1'],
  'fr-ch': ['9NO10-2', '1mCN-3'],
}
export default class PasserEcritureDecimaleEcritureFractionnaireInversement extends Exercice {
  constructor() {
    super()

    this.besoinFormulaireNumerique = [
      'Sens demandé',
      3,
      "1 : De l'écriture décimale à une fraction\n2 : D'une fraction à l'écriture décimale\n3 : Mélange",
    ]
    this.sup = 3
    this.besoinFormulaire2CaseACocher = ['Uniquement des fractions décimales']
    this.sup2 = false

    this.nbCols = 2
    this.nbColsCorr = 2
  }

  nouvelleVersion() {
    let typesDesSensDemandes
    if (this.sup === 1) {
      typesDesSensDemandes = ['DecimaleAFractionnaire']
    } else if (this.sup === 2) {
      typesDesSensDemandes = ['FractionnaireADecimale']
    } else {
      typesDesSensDemandes = [
        'DecimaleAFractionnaire',
        'FractionnaireADecimale',
      ]
    }
    const listeDesSensDemandes = combinaisonListes(
      typesDesSensDemandes,
      this.nbQuestions,
    )

    let typesDeFractionsDisponibles
    if (this.sup2) {
      typesDeFractionsDisponibles = ['fractionsDecimales']
    } else {
      typesDeFractionsDisponibles = [
        'fractionsDecimales',
        'fractionsNonDecimales',
      ]
    }
    const listeTypeFractions = combinaisonListes(
      typesDeFractionsDisponibles,
      this.nbQuestions,
    )
    for (
      let i = 0, texte, texteCorr, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      let numerateur = 0
      let denominateur = 1
      if (listeTypeFractions[i] === 'fractionsDecimales') {
        numerateur = 0
        while (numerateur % 2 === 0 || numerateur % 5 === 0) {
          numerateur = choice([
            randint(1, 9),
            randint(11, 99),
            randint(101, 999),
          ])
        }
        denominateur = choice([10, 100, 1000])
      } else if (listeTypeFractions[i] === 'fractionsNonDecimales') {
        numerateur = randint(1, 9)
        denominateur = choice([2, 4, 5])
        if (
          (numerateur * denominateur) % 4 === 0 ||
          (numerateur * denominateur) % 25 === 0
        ) {
          numerateur += 1
        }
      }
      while (
        numerateur % denominateur === 0 ||
        denominateur % numerateur === 0 ||
        (numerateur % 2 === 0 && denominateur === 4)
      ) {
        numerateur += 1
      }
      const ecritureDecimale = numerateur / denominateur

      if (listeDesSensDemandes[i] === 'DecimaleAFractionnaire') {
        texte = `Écrire $${texNombre(ecritureDecimale, 3)}$ sous la forme d'une fraction.`
        if (this.interactif) {
          texte +=
            '<br>' +
            ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierDeBaseAvecFraction,
              {
                texteAvant: `$${texNombre(ecritureDecimale, 3)} = $`,
              },
            )
        }
        if (listeTypeFractions[i] === 'fractionsNonDecimales') {
          const multiple = denominateur === 4 ? 100 : 10
          texteCorr = `$${texNombre(ecritureDecimale, 3)} = ${miseEnEvidence(`\\dfrac{${ecritureDecimale * multiple}}{${multiple}}`)}$  ou $${texNombre(ecritureDecimale, 3)} = ${miseEnEvidence(`\\dfrac{${numerateur}}{${denominateur}}`)}$`
        } else {
          texteCorr = `$${texNombre(ecritureDecimale, 3)} = ${miseEnEvidence(`\\dfrac{${numerateur}}{${denominateur}}`)}$`
        }
        handleAnswers(this, i, {
          reponse: {
            value: new FractionEtendue(numerateur, denominateur),
            options: { fractionEgale: true },
          },
        })
      } else {
        texte = `Donner l'écriture décimale de $${new FractionEtendue(numerateur, denominateur).texFSP}$.`
        if (this.interactif) {
          texte +=
            '<br>' +
            ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers, {
              texteAvant: `$\\dfrac{${numerateur}}{${denominateur}} = $`,
            })
        }
        texteCorr = `$\\dfrac{${numerateur}}{${denominateur}} = ${miseEnEvidence(texNombre(ecritureDecimale, 3))}$`
        handleAnswers(this, i, {
          reponse: {
            value: arrondi(ecritureDecimale, 3),
            options: { nombreDecimalSeulement: true },
          },
        })
      }

      if (
        this.questionJamaisPosee(
          i,
          numerateur,
          denominateur,
          listeTypeFractions[i],
          listeDesSensDemandes[i],
        )
      ) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
