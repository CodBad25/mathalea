import katex from 'katex'
import { describe, expect, it } from 'vitest'
import {
  erreursBanqueQuestionsDeCours,
  questionDeCoursParId,
  questionsDeCours,
  questionsDeCoursParTheme,
} from './banque'

describe('banque des questions de cours', () => {
  it('ne contient aucune question invalide', () => {
    expect(erreursBanqueQuestionsDeCours).toEqual([])
  })

  it("n'est pas vide", () => {
    expect(questionsDeCours.length).toBeGreaterThan(200)
  })

  it('a des identifiants uniques et retrouvables', () => {
    const ids = questionsDeCours.map((question) => question.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(questionDeCoursParId(id)?.id).toBe(id)
    }
  })

  it('range chaque question dans tous ses thèmes', () => {
    for (const question of questionsDeCours) {
      for (const theme of question.themes) {
        expect(questionsDeCoursParTheme.get(theme)).toContain(question)
      }
    }
  })

  it('a des énoncés et des corrections que KaTeX sait rendre', () => {
    const erreurs: string[] = []
    for (const question of questionsDeCours) {
      for (const texte of [question.question, question.correction ?? '']) {
        for (const formule of texte.match(/\$([^$]+)\$/g) ?? []) {
          try {
            katex.renderToString(formule.slice(1, -1), { throwOnError: true })
          } catch (erreur) {
            erreurs.push(`${question.id} : ${formule} (${String(erreur)})`)
          }
        }
      }
    }
    expect(erreurs).toEqual([])
  })

  it('propose une bonne réponse parmi les propositions des QCM', () => {
    for (const question of questionsDeCours) {
      if (question.type !== 'qcm') continue
      expect(question.propositions.length).toBeGreaterThan(1)
      for (const answer of question.answers) {
        expect(question.propositions).toContain(answer)
      }
    }
  })
})
