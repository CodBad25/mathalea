import { describe, expect, it } from 'vitest'
import ConvertirCelsius from '../../src/exercices/1e/1A-C12-2'
import CalculerF from '../../src/exercices/1e/1A-C12-1'
import ExprimerVariable from '../../src/exercices/1e/1A-C11-2'
import SigneAffine from '../../src/exercices/1e/1A-C14-1'
import SigneProduit from '../../src/exercices/1e/1A-C14-2'
import FonctionDepuisSignes from '../../src/exercices/1e/1A-C14-3'
import FonctionDepuisDonnees from '../../src/exercices/1e/1A-C14-5'
import ResoudreInequation from '../../src/exercices/1e/1A-C14-4'
import FractionCredit from '../../src/exercices/1e/1A-C15-2'
import CalculFacture from '../../src/exercices/1e/1A-C15-4'
import MasseHuile from '../../src/exercices/1e/1A-C15-9'

describe('Automatismes avec saisie courte et Version QCM', () => {
  it('attend un nombre sans unité par défaut pour une conversion', () => {
    const exercice = new ConvertirCelsius()
    exercice.interactif = true
    exercice.nouvelleVersion()

    expect(exercice.autoCorrection[0].formatInteractif).toBe(
      'mathalea-mathfield',
    )
    expect(exercice.autoCorrection[0].valeur).toBeDefined()
    expect(JSON.stringify(exercice.autoCorrection[0].valeur)).not.toContain(
      'circ',
    )
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
    expect(exercice.listeQuestions[0]).toContain(
      'Calculer la température correspondante',
    )
  })

  it.each([SigneAffine, SigneProduit])(
    'demande de compléter un tableau de signes',
    (ClasseExercice) => {
      const exercice = new ClasseExercice()
      exercice.interactif = true
      exercice.nouvelleVersion()

      expect(exercice.listeQuestions[0]).toContain(
        'Déterminer le tableau de signes de $f$.',
      )
      expect(exercice.autoCorrection[0].formatInteractif).toBe(
        'tableau-signes-variations',
      )
      expect(exercice.autoCorrection[0].valeur?.bareme?.([1, 1, 1])).toEqual([
        1, 1,
      ])
    },
  )

  it('accepte toute fonction affine vérifiant les données sur le signe', () => {
    const exercice = new FonctionDepuisDonnees()
    exercice.interactif = true
    exercice.nouvelleVersion()

    expect(exercice.listeQuestions[0]).toContain('vérifiant ces conditions')
    expect(exercice.autoCorrection[0].valeur?.reponse?.compare).toBeDefined()
    expect(exercice.listeQuestions[0]).not.toContain(
      'Parmi les quatre expressions',
    )
    expect(exercice.autoCorrection[0].formatInteractif).toBe(
      'mathalea-mathfield',
    )
  })

  it('accepte toute fonction affine ayant le tableau de signes donné', () => {
    const exercice = new FonctionDepuisSignes()
    exercice.interactif = true
    exercice.nouvelleVersion()

    expect(exercice.listeQuestions[0]).toContain('ayant ce tableau de signes')
    expect(exercice.listeQuestions[0]).not.toContain(
      'Parmi les quatre expressions',
    )
    expect(exercice.autoCorrection[0].formatInteractif).toBe(
      'mathalea-mathfield',
    )

    expect(exercice.autoCorrection[0].valeur?.reponse?.compare).toBeDefined()
  })

  it('formule les consignes de calcul et de réponse courte à l’infinitif', () => {
    const calculerF = new CalculerF()
    calculerF.nouvelleVersion()
    expect(calculerF.question).toContain('Calculer la valeur de $F$ lorsque')

    const conversion = new ConvertirCelsius()
    conversion.nouvelleVersion()
    expect(conversion.listeQuestions[0]).toContain(
      'Calculer la température correspondante',
    )

    const expressions = new ExprimerVariable()
    expressions.nouvelleVersion()
    expect(expressions.listeQuestions[0]).toContain('Exprimer')
    expect(expressions.listeQuestions[0]).not.toContain('Une expression de')

    const inequation = new ResoudreInequation()
    inequation.nouvelleVersion()
    expect(inequation.listeQuestions[0]).toContain(
      "Déterminer l'ensemble des solutions",
    )

    const credit = new FractionCredit()
    credit.nouvelleVersion()
    expect(credit.listeQuestions[0]).toContain('Déterminer la part du crédit')

    const facture = new CalculFacture()
    facture.nouvelleVersion()
    expect(facture.listeQuestions[0]).toContain(
      'Écrire le calcul permettant de déterminer',
    )

    const huile = new MasseHuile()
    huile.nouvelleVersion()
    expect(huile.listeQuestions[0]).toContain('Calculer la masse')
    expect(huile.listeQuestions[0]).toContain('Exprimer la réponse en')
  })
})
