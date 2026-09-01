import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import seedrandom from 'seedrandom'
import { describe, expect, it } from 'vitest'

import { context } from '../../modules/context'
import { mathaleaHandleExerciceSimple } from '../mathalea'
import type { IExercice } from '../types'
import { mathaleaEnsureAMCCompatibility } from './amcInference'

const exerciseModules = import.meta.glob('../../exercices/**/*.{ts,js}')
const qcmDeclaration =
  /(?:formatInteractif\s*[:=]\s*['"](?:qcm|mathalea-qcm)['"]|amcType\s*=\s*['"]qcm(?:Mono|Mult)['"])/

const candidates = Object.entries(exerciseModules).filter(([path]) => {
  if (/(?:^|\/)(?:beta)(?:\/|$)/i.test(path)) return false
  if (/old/i.test(path.split('/').at(-1) ?? '')) return false
  if (/\/(?:MetaExerciceCan|QuestionsDeCours)\.ts$/.test(path)) return false
  const absolutePath = resolve(import.meta.dirname, path)
  const source = readFileSync(absolutePath, 'utf8')
  return /export\s+const\s+refs\s*=/.test(source) && qcmDeclaration.test(source)
})

function generate(exercice: IExercice, isHtml: boolean, isAmc: boolean) {
  ;(exercice as any).lastCallback = ''
  exercice.interactif = isHtml
  context.isHtml = isHtml
  context.isAmc = isAmc
  seedrandom(exercice.seed, { global: true })
  if (exercice.typeExercice === 'simple') {
    mathaleaHandleExerciceSimple(exercice, isHtml, 0)
  } else {
    exercice.nouvelleVersionWrapper()
  }
}

function qcmSignature(item: any) {
  return (item?.propositions ?? [])
    .map((proposition: any) => ({
      texte: String(proposition?.texte ?? ''),
      statut: Boolean(proposition?.statut),
    }))
    .sort((left: { texte: string }, right: { texte: string }) =>
      left.texte.localeCompare(right.texte),
    )
}

describe('audit du corpus QCM AMC', () => {
  it('conserve les QCM générés par les exercices actifs', async () => {
    const failures: string[] = []
    let generatedQcmCount = 0

    for (const [path, loadModule] of candidates) {
      try {
        const module = (await loadModule()) as { default?: new () => IExercice }
        if (typeof module.default !== 'function') continue
        const exercice = new module.default()
        exercice.id = exercice.id ?? exercice.uuid ?? path
        exercice.seed = 'amc-qcm-corpus'

        generate(exercice, true, false)
        const interactive = exercice.autoCorrection.map((item) => ({
          ...item,
          propositions: item?.propositions?.map((proposition) => ({
            ...proposition,
          })),
        }))
        const qcmIndexes = interactive.flatMap((item, index) =>
          Array.isArray(item?.propositions) && item.propositions.length >= 2
            ? [index]
            : [],
        )
        if (qcmIndexes.length === 0) continue
        generatedQcmCount += qcmIndexes.length

        generate(exercice, false, true)
        ;(exercice as any).interactiveAutoCorrectionForAMC = interactive
        mathaleaEnsureAMCCompatibility(exercice)

        for (const index of qcmIndexes) {
          const exported = exercice.autoCorrectionAMC?.[index]
          expect(
            qcmSignature(exported),
            `${path}, question ${index + 1}`,
          ).toEqual(qcmSignature(interactive[index]))
        }
      } catch (error) {
        failures.push(
          `${path}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    expect(failures, failures.join('\n')).toEqual([])
    expect(candidates.length).toBeGreaterThanOrEqual(70)
    expect(generatedQcmCount).toBeGreaterThanOrEqual(50)
  }, 120_000)
})
