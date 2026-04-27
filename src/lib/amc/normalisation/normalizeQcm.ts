import type { UneProposition } from '../../types'
import type { QCMNormalized, QCMProposition, QuestionContext } from '../types'
type QuestionQcmContext = QuestionContext & {
  type: 'qcm' | 'qcmMult'
}

function normalizeTexte(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}

function deduplicatePropositions(
  propositions: QCMProposition[],
): QCMProposition[] {
  const map = new Map<string, QCMProposition>()

  for (const p of propositions) {
    const key = normalizeTexte(p.texte)

    if (!map.has(key)) {
      map.set(key, { ...p })
    } else {
      const existing = map.get(key)!

      // ⚠️ cas critique : contradiction
      if (existing.correct !== p.correct) {
        console.warn(`Conflit sur "${p.texte}" : vrai/faux → on garde "vrai"`)

        // règle : on privilégie la bonne réponse
        existing.correct = true
      }
    }
  }

  return Array.from(map.values())
}

function validateQCM(qcm: QCMNormalized): QCMNormalized {
  const correctCount = qcm.propositions.filter((p) => p.correct).length

  if (qcm.mode === 'mono' && correctCount !== 1) {
    console.warn('QCM mono avec != 1 bonne réponse')
  }

  if (qcm.mode === 'mult' && correctCount === 0) {
    console.warn('QCM mult sans bonne réponse')
  }
  return qcm
}

export function normalizeQcm(
  autoCorrectionItem: UneProposition,
  contexte: QuestionQcmContext,
): QCMNormalized {
  const { ref, id, exercice, index } = contexte

  const options = autoCorrectionItem.options || {}
  const propositions = deduplicatePropositions(
    (autoCorrectionItem.propositions || []).map((p) => ({
      texte: p.texte,
      correct: !!p.statut,
    })),
  )

  return validateQCM({
    type: 'qcm',
    mode: contexte.type === 'qcmMult' ? 'mult' : 'mono',
    id,
    ref,
    enonce: autoCorrectionItem.enonce ?? exercice.listeQuestions[index],
    layout: options.vertical ? 'reponses' : 'reponseshoriz',
    ordered: !!options.ordered,
    lastChoice: options.lastChoice ?? null,
    propositions,
  })
}
