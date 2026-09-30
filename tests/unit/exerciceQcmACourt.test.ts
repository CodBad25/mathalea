import { describe, expect, it } from 'vitest'
import ConvertirCelsius from '../../src/exercices/1e/1A-C12-2'
import CalculerF from '../../src/exercices/1e/1A-C12-1'
import ExprimerVariable from '../../src/exercices/1e/1A-C11-2'
import SigneAffine from '../../src/exercices/1e/1A-C14-1'
import FonctionDepuisSignes from '../../src/exercices/1e/1A-C14-3'
import FonctionDepuisDonnees from '../../src/exercices/1e/1A-C14-5'
import ResoudreInequation from '../../src/exercices/1e/1A-C14-4'
import FractionCredit from '../../src/exercices/1e/1A-C15-2'
import CalculFacture from '../../src/exercices/1e/1A-C15-4'
import MasseHuile from '../../src/exercices/1e/1A-C15-9'

describe('Automatismes avec saisie courte et mode QCM', () => {
  it('attend un nombre sans unité par défaut pour une conversion', () => {
    const exercice = new ConvertirCelsius()
    exercice.interactif = true
    exercice.nouvelleVersion()

    expect(exercice.autoCorrection[0].formatInteractif).toBe('mathalea-mathfield')
    expect(exercice.autoCorrection[0].valeur).toBeDefined()
    expect(JSON.stringify(exercice.autoCorrection[0].valeur)).not.toContain('circ')
    expect(exercice.listeQuestions[0]).toContain('mathalea-mathfield')
    expect(exercice.listeQuestions[0]).not.toContain('qcmMult')
  })

  it('conserve le QCM en option', () => {
    const exercice = new ConvertirCelsius()
    exercice.sup3 = true
    exercice.interactif = true
    exercice.nouvelleVersion()

    expect(exercice.autoCorrection[0].formatInteractif).toBe('mathalea-qcm')
    expect(exercice.autoCorrection[0].propositions?.length).toBe(4)
    expect(exercice.listeQuestions[0]).toContain('Calculer la température correspondante')
  })

  it('demande un intervalle pour le signe d’une fonction affine', () => {
    const exercice = new SigneAffine()
    exercice.interactif = true
    exercice.nouvelleVersion()

    expect(exercice.listeQuestions[0]).toContain('$f(x)>0$')
    expect(exercice.autoCorrection[0].formatInteractif).toBe('mathalea-mathfield')
  })

  it.each([FonctionDepuisSignes, FonctionDepuisDonnees])(
    'demande une expression possible avec un coefficient fixé',
    (ClasseExercice) => {
      const exercice = new ClasseExercice()
      exercice.interactif = true
      exercice.nouvelleVersion()

      expect(exercice.listeQuestions[0]).toContain('coefficient directeur')
      expect(exercice.listeQuestions[0]).not.toContain('Parmi les quatre expressions')
      expect(exercice.autoCorrection[0].formatInteractif).toBe('mathalea-mathfield')
    },
  )

  it('formule les consignes de calcul et de réponse courte à l’infinitif', () => {
    const calculerF = new CalculerF()
    calculerF.nouvelleVersion()
    expect(calculerF.question).toContain('Calculer la valeur de $F$ lorsque')

    const conversion = new ConvertirCelsius()
    conversion.nouvelleVersion()
    expect(conversion.listeQuestions[0]).toContain('Calculer la température correspondante')

    const expressions = new ExprimerVariable()
    expressions.nouvelleVersion()
    expect(expressions.listeQuestions[0]).toContain('Exprimer')
    expect(expressions.listeQuestions[0]).not.toContain('Une expression de')

    const inequation = new ResoudreInequation()
    inequation.nouvelleVersion()
    expect(inequation.listeQuestions[0]).toContain("Déterminer l'ensemble des solutions")

    const credit = new FractionCredit()
    credit.nouvelleVersion()
    expect(credit.listeQuestions[0]).toContain('Déterminer la part du crédit')

    const facture = new CalculFacture()
    facture.nouvelleVersion()
    expect(facture.listeQuestions[0]).toContain('Écrire le calcul permettant de déterminer')

    const huile = new MasseHuile()
    huile.nouvelleVersion()
    expect(huile.listeQuestions[0]).toContain('Calculer la masse')
    expect(huile.listeQuestions[0]).toContain('Exprimer la réponse en')
  })
})
