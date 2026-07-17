import { orangeMathalea } from '../../lib/colors'
import { isMathliveCompatible, type IExercice } from '../../lib/types'
import { context } from '../../modules/context'
import {
  listOfCustomElements,
  mathaleaCustomElementsRegistry,
} from '../customElements/MathaleaCustomElement'
import { addElement, get } from '../html/dom'
import type { ButtonWithMathaleaListener } from '../types/can'
import { verifQuestionCliqueFigure } from './cliqueFigure'
import { verifQuestionMetaInteractif2d } from './gestionInteractif'
import { verifQuestionMathLive } from './mathLive'
import { verifQuestionQcm } from './qcm'

export function gestionCan(exercice: IExercice) {
  context.nbBonnesReponses = 0
  context.nbMauvaisesReponses = 0
  for (let i = 0; i < exercice.nbQuestions; i++) {
    const type = exercice.interactifType ?? ''
    const button1question = document.querySelector(
      `#boutonVerifexercice${exercice.numeroExercice}Q${i}`,
    ) as ButtonWithMathaleaListener
    if (button1question) {
      if (!button1question.hasMathaleaListener) {
        button1question.addEventListener('click', () => {
          let resultat:
            | {
                isOk: boolean
                feedback?: string
                score: {
                  nbBonnesReponses: number
                  nbReponses: number
                }
              }
            | string
            | string[] = 'KO'
          if (isMathliveCompatible(type ?? '')) {
            resultat = verifQuestionMathLive(exercice, i)?.isOk ? 'OK' : 'KO'
          }
          if (type === 'qcm') {
            resultat = verifQuestionQcm(exercice, i)
          }
          if (type === 'cliqueFigure') {
            resultat = verifQuestionCliqueFigure(exercice, i)
          }
          if (type === 'custom' && exercice.correctionInteractive) {
            resultat = exercice.correctionInteractive(i)
          }
          if (listOfCustomElements.includes(type ?? '')) {
            // On traite le cas de tous les MathaleaCustomElement ici
            const liste = Array.from(mathaleaCustomElementsRegistry)
            const [tag, elementClasse] =
              liste.find((custom) => custom[0] === type) ?? []
            if (tag == null || elementClasse == null) {
              throw Error(
                "Une classe de listOfCustomElements n'est pas enregistrée dans le registre mathaleaCustomElementsRegistry",
              )
            }
            if (
              elementClasse.verifQuestion == null ||
              typeof elementClasse.verifQuestion !== 'function'
            ) {
              throw Error(
                `L'élément '${tag}' n'a pas de méthode verifQuestion ou celle-ci n'est pas une fonction`,
              )
            }
            const result = elementClasse.verifQuestion(exercice, i)
            if (
              result == null ||
              typeof result !== 'object' ||
              !('isOk' in result) ||
              !('score' in result)
            ) {
              throw Error(
                `L'élément '${tag}' a une fonction verifQuestion qui n'a pas retourné une valeur conforme.`,
              )
            }
            resultat = result
          }
          if (type === 'MetaInteractif2d') {
            resultat = verifQuestionMetaInteractif2d(exercice, i)?.isOk
              ? 'OK'
              : 'KO'
          }
          if (type === 'qcm_mathLive')
            throw Error(
              "qcm_mathLive ça n'existe pas comme formatInteractif, c'est qcm ou mathlive",
            )
          // Mise en couleur du numéro de la question dans le menu du haut
          if (
            (typeof resultat === 'string' && resultat === 'OK') ||
            (Array.isArray(resultat) &&
              resultat.every((s) => typeof s === 'string')) ||
            (typeof resultat === 'object' &&
              'isOk' in resultat &&
              resultat.isOk)
          ) {
            document
              .getElementById(`btnMenuexercice${exercice.numeroExercice}Q${i}`)
              ?.classList.add('green')
            context.nbBonnesReponses++
          } else {
            document
              .getElementById(`btnMenuexercice${exercice.numeroExercice}Q${i}`)
              ?.classList.add('red')
            context.nbMauvaisesReponses++
          }
          button1question.classList.add('disabled')
          if (exercicesCanRestants().length) {
            ;(exercicesCanDispoApres() as HTMLButtonElement).click()
          } else {
            afficheScoreCan(
              exercice,
              context.nbBonnesReponses,
              context.nbMauvaisesReponses,
            )
          }
        })
        button1question.hasMathaleaListener = true
      }
    }
  }
}

const exercicesCanRestants = () =>
  document.querySelectorAll(
    '[id ^= "btnMenuexercice"].circular.ui.button:not(.green):not(.red)',
  )
const exercicesCanDispoApres = () => {
  const liste = Array.from(document.querySelectorAll('[id^=btnMenu]'))
  for (let i = Number(context.questionCanEnCours); i < liste.length; i++) {
    if (
      !liste[i].classList.contains('red') &&
      !liste[i].classList.contains('green')
    ) {
      return liste[i]
    }
  }
  return exercicesCanRestants()[0]
}

export function afficheScoreCan(
  exercice: IExercice,
  nbBonnesReponses: number,
  nbMauvaisesReponses: number,
) {
  // const exercice = { id: 'can', sup: document.location.href + 'serie=' + context.graine }
  const divMenuEval = document.querySelector('#menuEval') as HTMLDivElement
  if (divMenuEval) {
    const divScore = addElement(
      divMenuEval,
      'div',
      {
        className: 'score',
        id: 'scoreTotal',
      },
      '',
    )
    divScore.innerHTML = `Résultat : ${nbBonnesReponses} / ${nbBonnesReponses + nbMauvaisesReponses}`
    window.parent.postMessage(
      {
        url: window.location.href,
        graine: context.graine,
        titre: exercice.titre,
        nbBonnesReponses,
        nbMauvaisesReponses,
      },
      '*',
    )
    // Arrête le timer
    if (context.timer) {
      clearInterval(context.timer)
      // ToDo à sauvegarder dans les résultats
      // const tempsRestant = document.getElementById('timer').innerText
    }
    divScore.style.color = orangeMathalea
    divScore.style.fontWeight = 'bold'
    divScore.style.fontSize = 'xx-large'
    divScore.style.marginTop = '20px'
    document.querySelectorAll('[id^=divexcorr]').forEach((e) => {
      ;(e as HTMLDivElement).style.display = 'block'
    })
    const divCorr = get('corrections')
    if (divCorr) {
      divCorr.style.display = 'block'
    }
    ;(
      document.getElementById('btnMenuexercice0Q0') as HTMLButtonElement
    ).click()
  } else {
    console.error('divMenuEval non trouvé')
  }
}
