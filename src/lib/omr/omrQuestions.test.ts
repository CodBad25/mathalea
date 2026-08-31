import { describe, expect, it } from 'vitest'
import {
  colonnesNumeriques,
  exercicesDepuisExercices,
  identifiantQuestion,
  questionsDepuisExercice,
  questionsDepuisExercices,
  type ExercicePourOmr,
} from './omrQuestions'

describe('colonnesNumeriques', () => {
  it('donne une colonne par chiffre attendu, pas une de plus', () => {
    const colonnes = colonnesNumeriques('125')
    expect(colonnes).toHaveLength(3)
    expect(colonnes.map((c) => c.attendu)).toEqual(['1', '2', '5'])
    expect(colonnes[0].valeurs).toHaveLength(10)
  })

  it('ajoute une colonne de signe seulement si la réponse est négative', () => {
    expect(colonnesNumeriques('42')[0].attendu).toBe('4')
    const negatif = colonnesNumeriques('-42')
    expect(negatif[0]).toMatchObject({ attendu: '-', valeurs: ['+', '-'] })
    expect(negatif).toHaveLength(3)
  })

  it('ignore la virgule d’un décimal, dont la position est imprimée', () => {
    expect(colonnesNumeriques('3,14').map((c) => c.attendu)).toEqual([
      '3',
      '1',
      '4',
    ])
  })

  it('ne produit aucune colonne pour une réponse sans chiffre', () => {
    expect(colonnesNumeriques('abc')).toHaveLength(0)
  })
})

describe('questionsDepuisExercice', () => {
  it('reconnaît un QCM à choix unique', () => {
    const exercice: ExercicePourOmr = {
      listeQuestions: ['Combien font 3 × 4 ?'],
      autoCorrection: [
        {
          propositions: [
            { texte: '12', statut: true },
            { texte: '7', statut: false },
          ],
        },
      ],
    }
    const [question] = questionsDepuisExercice(exercice, 0)
    expect(question).toMatchObject({ qid: 'e0q0', type: 'qcmMono', points: 1 })
    expect(question.type === 'qcmMono' && question.propositions).toHaveLength(2)
  })

  it('bascule en choix multiples dès qu’il y a deux bonnes réponses', () => {
    const exercice: ExercicePourOmr = {
      listeQuestions: ['Lesquels sont pairs ?'],
      autoCorrection: [
        {
          propositions: [
            { texte: '2', statut: true },
            { texte: '4', statut: true },
            { texte: '3', statut: false },
          ],
        },
      ],
    }
    expect(questionsDepuisExercice(exercice, 0)[0].type).toBe('qcmMult')
  })

  it('respecte un amcType « qcmMult » même avec une seule bonne réponse', () => {
    const exercice: ExercicePourOmr = {
      amcType: 'qcmMult',
      listeQuestions: ['Lesquels sont pairs ?'],
      autoCorrection: [
        {
          propositions: [
            { texte: '2', statut: true },
            { texte: '3', statut: false },
          ],
        },
      ],
    }
    expect(questionsDepuisExercice(exercice, 0)[0].type).toBe('qcmMult')
  })

  it('construit une grille de chiffres depuis une réponse numérique', () => {
    const exercice: ExercicePourOmr = {
      listeQuestions: ['Calculez 57 + 68.'],
      autoCorrection: [{ reponse: { valeur: '125' } }],
    }
    const [question] = questionsDepuisExercice(exercice, 1)
    expect(question).toMatchObject({ qid: 'e1q0', type: 'AMCNum' })
    expect(question.type === 'AMCNum' && question.colonnes).toHaveLength(3)
  })

  it('écarte une question sans structure de réponse exploitable', () => {
    // imprimer une question sans case produirait une note impossible à lire
    const exercice: ExercicePourOmr = {
      listeQuestions: ['Rédigez.'],
      autoCorrection: [{}],
    }
    expect(questionsDepuisExercice(exercice, 0)).toHaveLength(0)
  })

  it('garde les questions ouvertes quand l’exercice est déclaré AMCOpen', () => {
    const exercice: ExercicePourOmr = {
      amcType: 'AMCOpen',
      listeQuestions: ['Rédigez.'],
      autoCorrection: [{}],
      pointsParQuestion: 4,
    }
    const [question] = questionsDepuisExercice(exercice, 0)
    expect(question).toMatchObject({ type: 'AMCOpen', points: 4 })
  })

  it('numérote les questions par exercice, sans collision', () => {
    const qcm = {
      propositions: [
        { texte: 'a', statut: true },
        { texte: 'b', statut: false },
      ],
    }
    const questions = questionsDepuisExercices([
      { listeQuestions: ['A', 'B'], autoCorrection: [qcm, qcm] },
      { listeQuestions: ['C'], autoCorrection: [qcm] },
    ])
    expect(questions.map((q) => q.qid)).toEqual(['e0q0', 'e0q1', 'e1q0'])
    expect(new Set(questions.map((q) => q.qid)).size).toBe(3)
  })

  it('compose des identifiants stables', () => {
    expect(identifiantQuestion(2, 5)).toBe('e2q5')
  })
})

describe('exercicesDepuisExercices', () => {
  const qcm = {
    propositions: [
      { texte: 'a', statut: true },
      { texte: 'b', statut: false },
    ],
  }

  it('garde le groupement, l’unité que règle la palette de l’aperçu', () => {
    const exercices = exercicesDepuisExercices([
      {
        titre: 'Calculs',
        listeQuestions: ['A', 'B'],
        autoCorrection: [qcm, qcm],
      },
      { titre: 'Fractions', listeQuestions: ['C'], autoCorrection: [qcm] },
    ])
    expect(exercices.map((e) => e.titre)).toEqual(['Calculs', 'Fractions'])
    expect(exercices.map((e) => e.questions.length)).toEqual([2, 1])
  })

  it('écarte un exercice dont aucune question n’a de cases', () => {
    // imprimer son titre seul laisserait un exercice sans rien à noircir
    const exercices = exercicesDepuisExercices([
      { titre: 'Sans cases', listeQuestions: ['A'], autoCorrection: [{}] },
      { titre: 'Avec cases', listeQuestions: ['B'], autoCorrection: [qcm] },
    ])
    expect(exercices.map((e) => e.titre)).toEqual(['Avec cases'])
  })
})
