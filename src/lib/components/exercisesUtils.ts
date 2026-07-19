import seedrandom from 'seedrandom'
import { get } from 'svelte/store'
import Exercice from '../../exercices/Exercice'
import referentielStaticCH from '../../json/referentielStaticCH.json'
import referentielStaticFR from '../../json/referentielStaticFR.json'
import {
  computeStaticExerciceTypUrl,
  computeStaticExercicePngUrls,
  retrieveResourceFromUuid,
} from '../../lib/components/refUtils'
import {
  resourceHasPlace,
  type JSONReferentielObject,
} from '../../lib/types/referentiels'
import {
  mathaleaFormatExercice,
  mathaleaHandleExerciceSimple,
  mathaleaHandleParamOfOneExercice,
  mathaleaLoadExerciceFromUuid,
} from '../mathalea'
import { exercicesParams } from '../stores/generalStore'
import { globalOptions } from '../stores/globalOptions'
import type { IExercice } from '../types'
import { isStatic } from './componentsUtils'
import { referentielMathadata } from './mathadataReferentiel'

const allStaticReferentiels: JSONReferentielObject = {
  ...referentielStaticFR,
  ...referentielStaticCH,
  ...referentielMathadata,
}

// on supprime les entrées par thème qui entraîne des doublons
delete allStaticReferentiels['BrevetTags']
delete allStaticReferentiels['EVACOMTags']
delete allStaticReferentiels['E3CTags']
delete allStaticReferentiels['crpeTags']

/**
 * Construit la liste des exercices basée sur le contenu du store exercicesParams
 * @returns liste des exercices EN PROMESSE
 */
export const buildExercisesList = (
  filter: string[] = [],
): Promise<IExercice>[] => {
  const promiseExos: Promise<IExercice>[] = []
  const options = get(globalOptions)
  const exosParams = get(exercicesParams)
  for (const paramsExercice of exosParams) {
    if (filter.length > 0 && !filter.includes(paramsExercice.uuid)) {
      continue
    }
    if (isStatic(paramsExercice.uuid)) {
      const p = new Promise<IExercice>((resolve) => {
        // console.log('id' + paramsExercice.id)
        const exo = new Exercice()
        exo.typeExercice = 'statique'
        exo.titre = `Uuid ${paramsExercice.uuid}`
        exo.listeQuestions[0] = ''
        exo.listeCorrections[0] = ''
        exo.nbQuestions = 1
        const foundResource = retrieveResourceFromUuid(
          allStaticReferentiels,
          paramsExercice.uuid,
        )
        if (resourceHasPlace(foundResource)) {
          exo.titre = `${foundResource.typeExercice.toUpperCase()} ${foundResource.mois || ''} ${foundResource.annee} ${foundResource.lieu} ${foundResource.jour || ''} Ex ${foundResource.numeroInitial}`
        }
        const pngUrls = computeStaticExercicePngUrls(foundResource)
        if (pngUrls != null) {
          exo.listeQuestions[0] = pngUrls.png
            .map(
              (url) =>
                `<img src="${url}" style="width: calc(100% * {zoomFactor})" alt="énoncé" />`,
            )
            .join('<br>')
          exo.listeCorrections[0] = pngUrls.pngCor
            .map(
              (url) =>
                `<img src="${url}" style="width: calc(100% * {zoomFactor})" alt="correction" />`,
            )
            .join('<br>')
        } else {
          exo.listeQuestions[0] = `Uuid ${paramsExercice.uuid}<br>`
          exo.listeCorrections[0] = `Uuid ${paramsExercice.uuid}<br>`
        }
        mathaleaHandleParamOfOneExercice(exo, paramsExercice)
        if (options.setInteractive === '1' && exo?.interactifReady) {
          exo.interactif = true
        }
        resolve(exo)
        // console.log('id resolu' + paramsExercice.id)
      })
      promiseExos.push(p)
    } else {
      const p = new Promise<IExercice>((resolve) => {
        // console.log('id' + paramsExercice.id)
        mathaleaLoadExerciceFromUuid(paramsExercice.uuid).then((exo) => {
          if (typeof exo === 'undefined') {
            throw new Error(
              "L'exercice correspondant à l'uuid " +
                paramsExercice.uuid +
                " n'est pas défini...",
            )
          }
          mathaleaHandleParamOfOneExercice(exo, paramsExercice)
          if (options.setInteractive === '1' && exo?.interactifReady) {
            exo.interactif = true
          }
          resolve(exo)
        })
        // console.log('id resolu' + paramsExercice.id)
      })
      promiseExos.push(p)
    }
  }
  return promiseExos
}

/**
 * Calcule l'URL locale du fichier source Typst d'une ressource statique
 * (annales DNB, BAC...), si son entrée de référentiel déclare la clé
 * `typ: true`. Utilisé par la vue Typst uniquement (voir `Typst.svelte`) :
 * les autres vues (A4, QuestionParPage...) continuent d'afficher le png.
 * @param uuid uuid de la ressource statique
 * @returns l'URL relative du fichier `.typ`, ou `null` si non déclarée
 */
export const getStaticExerciceTypUrl = (uuid: string): string | null => {
  const foundResource = retrieveResourceFromUuid(allStaticReferentiels, uuid)
  return computeStaticExerciceTypUrl(foundResource)
}

export const splitExercisesIntoQuestions = (
  exercices: IExercice[],
): {
  questions: (string | IExercice)[]
  consignes: string[]
  corrections: string[]
  consignesCorrections: string[]
  isCorrectionVisible: boolean[]
  indiceExercice: number[]
  indiceQuestionInExercice: number[]
} => {
  let questions: (string | IExercice)[] = []
  let consignes: string[] = []
  let corrections: string[] = []
  let consignesCorrections: string[] = []

  const isCorrectionVisible: boolean[] = []
  const indiceExercice: number[] = []
  const indiceQuestionInExercice: number[] = []

  for (const [k, exercice] of exercices.entries()) {
    exercice.score = 0
    exercice.numeroExercice = k
    if (exercice.typeExercice === 'simple') {
      mathaleaHandleExerciceSimple(exercice, exercice.interactif, k)
    } else {
      if (exercice.nouvelleVersionWrapper !== undefined) {
        if (exercice.seed !== undefined) {
          seedrandom(exercice.seed, { global: true })
        }
        exercice.nouvelleVersionWrapper(k)
      }
    }
    isCorrectionVisible[k] = false
    const cumulConsignesCorrections = []
    if (exercice.listeQuestions === undefined) {
      exercice.listeQuestions = []
    }
    if (exercice.listeCorrections === undefined) {
      exercice.listeCorrections = []
    }
    for (let i = 0; i < exercice.listeQuestions.length; i++) {
      consignes.push(
        `${exercice?.consigne} ${exercice?.consigne && exercice?.introduction ? '<br>\n' : ''} ${exercice?.introduction}`,
      )
      indiceExercice.push(k)
      indiceQuestionInExercice.push(i)
      if (exercice.consigneCorrection !== undefined) {
        cumulConsignesCorrections.push(exercice.consigneCorrection)
      }
    }
    let newQuestions: (string | IExercice)[] = exercice.listeQuestions.map(
      mathaleaFormatExercice,
    )
    let newCorrections: string[] = exercice.listeCorrections.map(
      mathaleaFormatExercice,
    )
    if (exercice.typeExercice === 'html') {
      newQuestions = [exercice]
      newCorrections = ['']
      cumulConsignesCorrections.push('')
      consignes.push('')
      indiceExercice.push(k)
      indiceQuestionInExercice.push(0)
    }
    questions = [...questions, ...newQuestions]
    corrections = [...corrections, ...newCorrections]
    consignesCorrections = [
      ...consignesCorrections,
      ...cumulConsignesCorrections,
    ].map(mathaleaFormatExercice)
    consignes = consignes.map(mathaleaFormatExercice)
  }

  return {
    questions,
    consignes,
    corrections,
    consignesCorrections,
    isCorrectionVisible,
    indiceExercice,
    indiceQuestionInExercice,
  }
}
