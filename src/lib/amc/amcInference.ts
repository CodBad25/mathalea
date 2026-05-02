import { type IExercice } from '../types'
import {
  ensureAMCOpenAutoCorrection,
  extractAMCOptions,
  extractAMCValue,
  inferNumericValueForAMC,
  mergeNumericParamsFromOptions,
} from './amcInferenceHelpers'
import { normalizeAMCNumBlocks } from './amcNormalize'
import type { IExerciceAMC } from './amcTypes'

/**
 * Applique une compatibilité AMC par défaut quand un exercice n'est pas paramétré finement.
 * Cette fonction privilégie un export possible (fallback AMCOpen) plutôt qu'un rejet.
 */
export function mathaleaEnsureAMCCompatibility(
  exercice: IExercice | IExerciceAMC,
): IExerciceAMC {
  // Ici on débute l'inférence du type AMC de l'exercice.
  // Si l'exercice est déja amcReady, on suppose que le type AMC est correctement défini et on ne fait rien.
  // Ensuite, si le type AMC n'est pas défini, on va essayer de l'inférer à partir des données disponibles dans les autoCorrections, les réponses interactives mises en cache, et la réponse de l'exercice lui-même.

  if (exercice.amcReady) {
    // L'exercice est déjà prêt pour AMC, on suppose que tout est en ordre.
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
    return exercice as IExerciceAMC
  }

  if (exercice.interactifType === 'qcm') {
    // Si l'exercice est de type QCM interactif, alors il est compatible avec AMC, et on peut inférer le type AMC à partir du nombre de bonnes réponses dans la première autoCorrection.
    const firstAutoCorrection = exercice.autoCorrection.find(
      (item) => item != null,
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
    return exercice as IExerciceAMC
  }

  // Si c'est un exercice de type liste déroulante interactif, on transforme la liste déroulante en propositions de type QCM pour l'autoCorrection AMC.
  // On le signale car l'exo peut avoir un export AMC qcmMono en utilisant la fonction listeDeroulanteToQcm.
  if (exercice.interactifType === 'listeDeroulante') {
    exercice.amcType = 'qcmMono'
    exercice.amcReady = true
    window.notify(
      "Cet exercice utilise une liste déroulante interactive, il est donc compatible avec AMC, veuillez modifier l'exo avec listeDeroulanteToQcm pour avoir un export AMC opérationnel.",
      { uuidExercice: JSON.stringify(exercice.uuid), titre: exercice.titre },
    )
    // En attendant, on infère en amcOpen pour éviter de bloquer l'exercice.
    exercice.amcType = 'AMCOpen'
    exercice.amcReady = true
    ensureAMCOpenAutoCorrection(exercice)
    return exercice as IExerciceAMC
  }

  if (exercice.interactifType !== 'mathlive') {
    // Pour ce qui ne rentre pas dans les cas précédents : fallback AMCOpen.
    exercice.amcType = 'AMCOpen'
    exercice.amcReady = true
    ensureAMCOpenAutoCorrection(exercice)
    return exercice as IExerciceAMC
  }

  // Cas Mathlive à détailler
  // à priori, les données pour AMC n'ont pas été renseignées sinon on peut espérer que amcReady serait true et amcType défini
  // On va essayer d'inférer un type AMCNum à partir des réponses numériques présentes dans les autoCorrections ou les réponses interactives mises en cache.

  const cachedInteractiveAutoCorrection = exercice.autoCorrection.filter(
    (item) => item?.reponse?.valeur !== undefined,
  )
  if (cachedInteractiveAutoCorrection.length === 0) {
    window.notify(
      "amcInference n'a pas de réponse interactive valide pour cet exercice 'mathLive', l'exercice sera considéré comme un AMCOpen.",
      {
        uuidExercice: JSON.stringify(exercice.uuid),
        titre: exercice.titre,
      },
    )
  }
  const autoCorrectionAmc = []
  let canInferAMCNum = exercice.autoCorrection.length > 0

  for (const [index, item] of exercice.autoCorrection.entries()) {
    if (item == null) {
      canInferAMCNum = false
      break
    }

    const valeur = inferNumericValueForAMC(extractAMCValue(item.reponse))
    const options = extractAMCOptions(item.reponse)
    const param = mergeNumericParamsFromOptions(item.reponse?.param, options)

    if (valeur === undefined) {
      canInferAMCNum = false
      break
    }

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
        ...item.reponse,
        valeur,
        param,
      },
    })
  }

  if (canInferAMCNum) {
    exercice.autoCorrection = autoCorrectionAmc as any
    exercice.amcType = 'AMCNum'
    exercice.amcReady = true
    return exercice as IExerciceAMC
  }

  window.notify(
    "amcInference n'a pas pu inférer un AMCNum fiable pour cet exercice 'mathLive', fallback AMCOpen.",
    {
      uuidExercice: JSON.stringify(exercice.uuid),
      titre: exercice.titre,
    },
  )
  exercice.amcType = 'AMCOpen'
  exercice.amcReady = true
  ensureAMCOpenAutoCorrection(exercice)
  return exercice as IExerciceAMC
}
