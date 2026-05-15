import { type AutoCorrection, type IExercice } from '../types'
import {
  ensureAMCOpenAutoCorrection,
  extractAMCValue,
  inferAmcOptionsFromAnswerType,
  inferNumericValueForAMC,
  mergeNumericParamsFromOptions,
} from './amcInferenceHelpers'
import { normalizeAMCNumBlocks } from './amcNormalize'
import type { IExerciceAMC, ReponseParams } from './amcTypes'

/**
 * Applique une compatibilité AMC par défaut quand un exercice n'est pas paramétré finement.
 * Cette fonction privilégie un export possible (fallback AMCOpen) plutôt qu'un rejet.
 */
export function mathaleaEnsureAMCCompatibility(
  exercice: IExercice | IExerciceAMC,
): IExerciceAMC {
  type InferenceAutoCorrectionItem = {
    enonce?: string
    propositions?: Array<{ statut?: unknown; [key: string]: unknown }>
    reponse?: {
      valeur?: unknown
      param?: ReponseParams
      [key: string]: unknown
    }
    [key: string]: unknown
  }

  const exerciseAny = exercice as any
  const interactiveAutoCorrection = Array.isArray(
    exerciseAny.interactiveAutoCorrectionForAMC,
  )
    ? exerciseAny.interactiveAutoCorrectionForAMC
    : []
  const amcAutoCorrection = Array.isArray(exerciseAny.autoCorrectionAMC)
    ? exerciseAny.autoCorrectionAMC
    : []
  const autoCorrectionSource: AutoCorrection[] =
    interactiveAutoCorrection.length > 0
      ? interactiveAutoCorrection
      : exercice.autoCorrection

  // Ici on débute l'inférence du type AMC de l'exercice.
  // Si l'exercice est déja amcReady, on suppose que le type AMC est correctement défini et on ne fait rien.
  // Ensuite, si le type AMC n'est pas défini, on va essayer de l'inférer à partir des données disponibles dans les autoCorrections, les réponses interactives mises en cache, et la réponse de l'exercice lui-même.

  if (exercice.amcReady) {
    // L'exercice est déjà prêt pour AMC, on suppose que tout est en ordre, mais c'est faux.
    // On doit pour les AMCNum s'assurer que les données dans autoCorrectionAMC comme digits, decimals, signe, etc sont bien renseignées
    // On doit aussi s'assurer que pour les qcm la propriété 'correction' de options est bien renseignée pour l'afficher à l'lélève dans le détail de correction AMC.
    if (exercice.amcType === 'AMCNum') {
      const autoCorrectionAmc = []
      for (const [index, item] of amcAutoCorrection.entries()) {
        if (item == null) continue
        const valeur = inferNumericValueForAMC(
          extractAMCValue(item.reponse.valeur),
        )
        if (valeur === undefined) continue

        const options = inferAmcOptionsFromAnswerType(item.reponse?.valeur)
        const param = mergeNumericParamsFromOptions(
          item.reponse?.param,
          options,
        )

        const blocks = normalizeAMCNumBlocks({
          valeur,
          param,
        })

        if (blocks.length === 0) continue

        autoCorrectionAmc.push({
          ...item,
          enonce: item.enonce ?? exercice.listeQuestions[index],
          reponse: {
            ...item.reponse,
            valeur,
            param,
          },
        })
      }
      exercice.autoCorrection = autoCorrectionAmc as any
      exerciseAny.autoCorrectionAMC = autoCorrectionAmc as any
    } else if (
      exercice.amcType === 'qcmMono' ||
      exercice.amcType === 'qcmMult'
    ) {
      const autoCorrectionAmc = autoCorrectionSource.map(
        (item: InferenceAutoCorrectionItem, index) => {
          if (item == null) return item

          const propositions = Array.isArray(item.propositions)
            ? item.propositions.map((p) => ({
                ...p,
                statut: Boolean(p.statut),
              }))
            : item.propositions

          return {
            ...item,
            enonce: item.enonce ?? exercice.listeQuestions[index],
            propositions,
          }
        },
      )
      exerciseAny.autoCorrectionAMC = autoCorrectionAmc as any
    }
    return exercice as IExerciceAMC
  }

  // Respecte un marquage explicite "non prêt AMC" quand un type AMC est déjà posé.
  // Cela permet d'exclure volontairement un exercice de l'export sans qu'un fallback le réactive.
  if (exercice.amcReady === false && exercice.amcType != null) {
    return exercice as IExerciceAMC
  }

  if (exercice.interactifType == null) {
    // Si l'exercice n'est pas interactif, on suppose que c'est un exercice ouvert compatible avec AMC.
    exercice.amcType = 'AMCOpen'
    exercice.amcReady = true
    ensureAMCOpenAutoCorrection(exercice, amcAutoCorrection)
    exerciseAny.autoCorrectionAMC = amcAutoCorrection
    return exercice as IExerciceAMC
  }

  // type interactifs non supportés par AMC : svgSelection, cliqueFigure, DragAndDrop, apiGeom, tableur, MetaInteractif2d : on les considère comme des AMCOpen car ils ne sont pas incompatibles avec AMC, mais ils nécessitent une correction personnalisée.
  if (
    [
      'svgSelection', // inadapté clairement pour AMC
      'cliqueFigure', // inadapté clairement pour AMC
      'dnd', // inadapté clairement pour AMC
      'tableur', // Difficile à faire rentrer dans AMC
      'MetaInteractif2d', // Difficile à faire rentrer dans AMC
      'multiMathfield', // On pourra essayer de faire mieux qu'AmcOpen
      'tableauMathlive', // On pourra essayer de faire mieux qu'AmcOpen
      'fillInTheBlank', // On pourra essayer de faire mieux qu'AmcOpen
      'texte', // inadapté pour AMC, mais on peut faire du AMCOpen
      'custom', // inadapté pour AMC (contient du apiGeom et autres), mais on peut faire du AMCOpen
    ].includes(exercice.interactifType)
  ) {
    exercice.amcType = 'AMCOpen'
    exercice.amcReady = true
    ensureAMCOpenAutoCorrection(exercice)
    exerciseAny.autoCorrectionAMC = exercice.autoCorrection.map((item) => ({
      ...item,
    }))
    return exercice as IExerciceAMC
  }

  if (exercice.interactifType === 'qcm') {
    // Si l'exercice est de type QCM interactif, alors il est compatible avec AMC, et on peut inférer le type AMC à partir du nombre de bonnes réponses dans la première autoCorrection.
    const firstAutoCorrection = autoCorrectionSource.find(
      (item: InferenceAutoCorrectionItem) => item != null,
    ) as
      | {
          propositions?: Array<{ statut?: unknown }>
        }
      | undefined

    if (firstAutoCorrection?.propositions) {
      const goodAnswersCount = firstAutoCorrection.propositions.filter((p) =>
        Boolean(p.statut),
      ).length
      exercice.amcType = goodAnswersCount > 1 ? 'qcmMult' : 'qcmMono'
    } else {
      // Si on ne trouve pas d'autoCorrection avec des propositions, on suppose que c'est un QCM à une seule bonne réponse par défaut.
      exercice.amcType = 'qcmMono'
    }
    exercice.amcReady = true
    exerciseAny.autoCorrectionAMC =
      autoCorrectionSource.length > 0
        ? autoCorrectionSource.map((item: InferenceAutoCorrectionItem) => ({
            ...item,
          }))
        : [...exercice.autoCorrection]
    return exercice as IExerciceAMC
  }

  // Si c'est un exercice de type liste déroulante interactif, on transforme la liste déroulante en propositions de type QCM pour l'autoCorrection AMC.
  // On le signale car l'exo peut avoir un export AMC qcmMono en utilisant la fonction listeDeroulanteToQcm.
  if (exercice.interactifType === 'listeDeroulante') {
    exercice.amcType = 'qcmMono'
    exercice.amcReady = true
    // En attendant, on infère en amcOpen pour éviter de bloquer l'exercice.
    exercice.amcType = 'AMCOpen'
    exercice.amcReady = true
    ensureAMCOpenAutoCorrection(exercice)
    exerciseAny.autoCorrectionAMC = exercice.autoCorrection.map((item) => ({
      ...item,
    }))
    return exercice as IExerciceAMC
  }

  if (exercice.interactifType !== 'mathLive') {
    // Pour ce qui ne rentre pas dans les cas précédents : fallback AMCOpen.
    exercice.amcType = 'AMCOpen'
    exercice.amcReady = true
    ensureAMCOpenAutoCorrection(exercice)
    exerciseAny.autoCorrectionAMC = exercice.autoCorrection.map((item) => ({
      ...item,
    }))
    return exercice as IExerciceAMC
  }

  // Cas Mathlive à détailler
  // à priori, les données pour AMC n'ont pas été renseignées sinon on peut espérer que amcReady serait true et amcType défini
  // On va essayer d'inférer un type AMCNum à partir des réponses numériques présentes dans les autoCorrections ou les réponses interactives mises en cache.

  const autoCorrectionAmc = []
  let canInferAMCNum = autoCorrectionSource.length > 0

  for (const [index, item] of autoCorrectionSource.entries()) {
    if (item == null) {
      canInferAMCNum = false
      break
    }

    const valeur = inferNumericValueForAMC(
      extractAMCValue(item.valeur?.reponse?.value),
    )
    if (valeur === undefined) {
      canInferAMCNum = false
      break
    }

    // On infère des options AMCNum à partir de la réponse interactive
    // ({ value, options, compare }) au lieu de réutiliser directement
    // les options de comparaison interactive.
    const options = inferAmcOptionsFromAnswerType(item.valeur?.reponse)
    const param = mergeNumericParamsFromOptions(item.options, options)

    const blocks = normalizeAMCNumBlocks({
      valeur,
      param,
    })

    if (blocks.length === 0) {
      canInferAMCNum = false
      break
    }

    autoCorrectionAmc.push({
      ...item,
      enonce: item.enonce ?? exercice.listeQuestions[index],
      reponse: {
        ...item.valeur,
        valeur,
        param,
      },
    })
  }

  if (canInferAMCNum) {
    exercice.autoCorrection = autoCorrectionAmc as any
    exerciseAny.autoCorrectionAMC = autoCorrectionAmc as any
    exercice.amcType = 'AMCNum'
    exercice.amcReady = true
    return exercice as IExerciceAMC
  }

  exercice.amcType = 'AMCOpen'
  exercice.amcReady = true
  ensureAMCOpenAutoCorrection(exercice)
  exerciseAny.autoCorrectionAMC = exercice.autoCorrection.map((item) => ({
    ...item,
  }))
  return exercice as IExerciceAMC
}
