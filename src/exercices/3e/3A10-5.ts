import type { MathfieldElement } from 'mathlive'
import { amcConvert } from '../../lib/amc/amcBuilders'
import { bleuMathalea } from '../../lib/colors'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { sp } from '../../lib/outils/outilString'
import { factorisation } from '../../lib/outils/primalite'
import { texNombre } from '../../lib/outils/texNombre'
import type { IExercice } from '../../lib/types'
import { context } from '../../modules/context'
import {
  contraindreValeur,
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  'Recourir à une décomposition en facteurs premiers dans des cas simples'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCOpen'
export const dateDePublication = '29/08/2022'
export const dateDeModifImportante = '16/09/2024'
/**
 *
 * Attendus de 3e : Recourir à une décomposition en facteurs premiers dans des cas simples
 * @author Éric Elter
 */

export const uuid = 'eee79'

export const refs = {
  'fr-fr': ['3A10-5'],
  'fr-ch': ['9NO4-28'],
}

export function extraitLaDecomposition(expression: string) {
  const listeFacteurs = expression.split('\\times')
  const decompo: [number, number][] = []

  for (const facteur of listeFacteurs) {
    if (facteur.includes('^')) {
      // c'est une puissance
      const puissance = facteur.split('^')
      const mantisse = Number(puissance[0])
      const exposant = Number(puissance[1].replace('{', '').replace('}', ''))
      // Validation des nombres
      if (
        isNaN(mantisse) ||
        isNaN(exposant) ||
        !Number.isInteger(mantisse) ||
        !Number.isInteger(exposant)
      ) {
        return []
      }
      const element = decompo.find((el) => el[0] === mantisse)
      if (element == null) {
        // il n'y a pas eu encore ce facteur, on crée son élément dans decompo
        decompo.push([mantisse, exposant])
      } else {
        // il y a déjà eu un facteur mantisse, on incrément l'exposant
        element[1] += exposant
      }
    } else {
      // c'est un facteur simple
      const mantisse = Number(facteur)
      const exposant = 1
      // Validation des nombres
      if (
        isNaN(mantisse) ||
        isNaN(exposant) ||
        !Number.isInteger(mantisse) ||
        !Number.isInteger(exposant)
      ) {
        return []
      }
      const element = decompo.find((el) => el[0] === mantisse)
      if (element == null) {
        // il n'y a pas eu encore ce facteur, on crée son élément dans decompo
        decompo.push([mantisse, exposant])
      } else {
        // il y a déjà eu un facteur mantisse, on incrément l'exposant
        element[1] += exposant
      }
    }
  }
  return decompo
}
function ecrireReponse(
  alpha: number,
  a: number,
  beta: number,
  b: number,
  gamma: number,
  c: number,
) {
  let reponse = ''
  let reponse2 = ''
  if (a !== 0) {
    reponse += `${alpha}`
    reponse2 += `${alpha}`
    if (a !== 1) {
      for (let k = 1; k < a; k++) {
        reponse += `\\times${alpha}`
      }
      reponse2 += `^${a}`
    }
  }
  if (b !== 0) {
    reponse += a === 0 ? '' : '\\times'
    reponse2 += a === 0 ? '' : '\\times'
    reponse += `${beta}`
    reponse2 += `${beta}`
    if (b !== 1) {
      for (let k = 1; k < b; k++) {
        reponse += `\\times${beta}`
      }
      reponse2 += `^${b}`
    }
  }
  if (c !== 0) {
    reponse += `\\times${gamma}`
    reponse2 += `\\times${gamma}`
    if (c !== 1) {
      for (let k = 1; k < c; k++) {
        reponse += `\\times${gamma}`
      }
      reponse2 += `^${c}`
    }
  }
  return [reponse, reponse2]
}
function compareLesDecomposition(
  decompo1: [number, number][],
  decompo2: [number, number][],
) {
  if (!(Array.isArray(decompo1) && Array.isArray(decompo2)))
    return { isOk: false, feedback: "La réponse n'a pas la forme attendue" }
  // On verifie que les deux décomposition sont bien le même nombre sinon on sort
  let nb1 = 1
  for (const facteur of decompo1) {
    nb1 *= facteur[0] ** facteur[1]
  }
  let nb2 = 1
  for (const facteur of decompo2) {
    nb2 *= facteur[0] ** facteur[1]
  }
  if (nb1 !== nb2) {
    return {
      isOk: false,
      feedback: `La décomposition saisie ne donne pas $${texNombre(nb2, 0)}$ mais $${texNombre(nb1, 0)}$.`,
    }
  }
  // On continue parce que les décompositions donnent le même résultat
  for (const facteur of decompo1) {
    const mantisse = facteur[0]
    const exposant = facteur[1]
    const element = decompo2.find((el) => el[0] === mantisse)
    if (element == null) {
      return {
        isOk: false,
        feedback: `$${texNombre(mantisse, 0)}$ n'est pas un facteur premier.`,
      }
    }
    const exposant2 = element[1]
    if (exposant !== exposant2) {
      return {
        isOk: false,
        feedback: `Le nombre de facteur $${mantisse}$ dans la décomposition est incorrect.`,
      }
    }
  }
  return { isOk: true, feedback: '' }
}

export default class RecourirDecompositionFacteursPremiers extends Exercice {
  constructor() {
    super()

    this.nbQuestions = 4
    this.besoinFormulaireTexte = [
      'Nombres premiers utilisés ',
      'Nombres séparés par des tirets :\n1 : 2, 3 et 5\n2 : 2, 3 et 7\n3 : 2, 5 et 7\n4 : 3, 5 et 7\n5 : Au moins un nombre premier entre 10 et 20\n6 : Mélange',
    ]
    this.besoinFormulaire2Numerique = [
      'Puissance la plus élevée possible (entre 2 et 5)',
      3,
    ]
    this.sup = 6
    this.sup2 = 4
  }

  nouvelleVersion() {
    this.sup2 = contraindreValeur(1, 3, parseInt(this.sup2), 3)
    this.consigne = 'Décomposer, en produit de facteurs premiers, '
    this.consigne +=
      this.nbQuestions === 1 || context.isAmc
        ? 'le nombre suivant.'
        : 'les nombres suivants.'
    const listeTypeDeQuestions = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: 5,
      melange: 6,
      defaut: 6,
      nbQuestions: this.nbQuestions,
    })
    const puissanceMax = contraindreValeur(2, 5, this.sup2, 3)
    for (
      let i = 0,
        texte,
        texteCorr,
        facteur1,
        facteur2,
        facteurX,
        solution,
        cpt = 0,
        a,
        b,
        c,
        nbADecomposer;
      i < this.nbQuestions && cpt < 50;
    ) {
      a = randint(0, puissanceMax)
      b = randint(0, puissanceMax, a)
      c = randint(0, puissanceMax, [a, b])
      switch (listeTypeDeQuestions[i]) {
        case 1: // 2, 3 et 5
          nbADecomposer = Math.pow(2, a) * Math.pow(3, b) * Math.pow(5, c)
          texte = `$${texNombre(nbADecomposer)}`
          texteCorr =
            texte +
            `${sp(2)}=${sp(1)}` +
            miseEnEvidence(ecrireReponse(2, a, 3, b, 5, c)[0], bleuMathalea) +
            `${sp(2)}=${sp(1)}` +
            miseEnEvidence(ecrireReponse(2, a, 3, b, 5, c)[1]) +
            '$'
          texte +=
            '$' +
            ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierFullOperations,
              { texteAvant: `${sp(2)}=` },
            )
          break
        case 2: // 2, 3 et 7
          nbADecomposer = Math.pow(2, a) * Math.pow(3, b) * Math.pow(7, c)
          texte = `$${texNombre(nbADecomposer)}`
          texteCorr =
            texte +
            `${sp(2)}=${sp(1)}` +
            miseEnEvidence(ecrireReponse(2, a, 3, b, 7, c)[0], bleuMathalea) +
            `${sp(2)}=${sp(1)}` +
            miseEnEvidence(ecrireReponse(2, a, 3, b, 7, c)[1]) +
            '$'
          texte +=
            '$' +
            ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierFullOperations,
              { texteAvant: `${sp(2)}=` },
            )
          break
        case 3: // 2, 5 et 7
          nbADecomposer = Math.pow(2, a) * Math.pow(5, b) * Math.pow(7, c)
          texte = `$${texNombre(nbADecomposer)}`
          texteCorr =
            texte +
            `${sp(2)}=${sp(1)}` +
            miseEnEvidence(ecrireReponse(2, a, 5, b, 7, c)[0], bleuMathalea) +
            `${sp(2)}=${sp(1)}` +
            miseEnEvidence(ecrireReponse(2, a, 5, b, 7, c)[1]) +
            '$'
          texte +=
            '$' +
            ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierFullOperations,
              { texteAvant: `${sp(2)}=` },
            )
          break
        case 4: // 3, 5 et 7
          nbADecomposer = Math.pow(3, a) * Math.pow(5, b) * Math.pow(7, c)
          texte = `$${texNombre(nbADecomposer)}`
          texteCorr =
            texte +
            `${sp(2)}=${sp(1)}` +
            miseEnEvidence(ecrireReponse(3, a, 5, b, 7, c)[0], bleuMathalea) +
            `${sp(2)}=${sp(1)}` +
            miseEnEvidence(ecrireReponse(3, a, 5, b, 7, c)[1]) +
            '$'
          texte +=
            '$' +
            ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierFullOperations,
              { texteAvant: `${sp(2)}=` },
            )
          break
        case 5: // 11, 13, 17 ou 19 et deux autres facteurs parmi 2, 3 et 5
        default:
          facteur1 = choice([2, 3, 5])
          facteur2 = choice([2, 3, 5], [facteur1])
          if (facteur1 > facteur2) {
            facteurX = facteur1
            facteur1 = facteur2
            facteur2 = facteurX
          }
          facteurX = choice([11, 13, 17, 19])
          nbADecomposer =
            Math.pow(facteurX, 1) *
            Math.pow(facteur1, b) *
            Math.pow(facteur2, c)
          texte = `$${texNombre(nbADecomposer)}`
          solution = ecrireReponse(facteur1, b, facteur2, c, facteurX, 1)
          texteCorr =
            texte +
            `${sp(2)}=${sp(1)}` +
            miseEnEvidence(solution[0], bleuMathalea) +
            `${sp(2)}=${sp(1)}` +
            miseEnEvidence(solution[1]) +
            '$'
          texte +=
            '$' +
            ajouteChampTexteMathLive(
              this,
              i,
              KeyboardType.clavierFullOperations,
              { texteAvant: `${sp(2)}=` },
            )
          break
      }
      const bonneDecomposition = factorisation(nbADecomposer)
      handleAnswers(this, i, {
        // @ts-expect-error bonneDecomposition est de type [number, number][] mais handleAnswers attend une string, on s'arrange pour que ça marche dans le callback
        reponse: { value: bonneDecomposition },
        callback: (exercice: IExercice, question: number) => {
          let isOk
          let feedback = ''
          const mfe = document.querySelector(
            `#champTexteEx${exercice.numeroExercice}Q${question}`,
          ) as MathfieldElement
          if (mfe == null)
            return {
              isOk: false,
              feedback: '',
              score: { nbBonnesReponses: 0, nbReponses: 1 },
            }
          let expression = mfe.getValue()
          expression = expression
            .replaceAll('²', '^2')
            .replaceAll('³', '^3')
            .replaceAll('^{}', '')
            .replaceAll('^{^', '^{')
          if (expression == null || expression === '') {
            isOk = false
            feedback = ''
          } else {
            const decompoSaisie = extraitLaDecomposition(expression)
            if (decompoSaisie.length === 0) {
              isOk = false
              feedback = "La réponse n'a pas la forme attendue"
            } else {
              const result = compareLesDecomposition(
                decompoSaisie,
                bonneDecomposition,
              )
              isOk = result.isOk
              feedback = String(result.feedback)
            }
          }

          const spanReponseLigne = document.querySelector(
            `#resultatCheckEx${exercice.numeroExercice}Q${question}`,
          )
          if (spanReponseLigne != null) {
            spanReponseLigne.innerHTML = isOk ? '😎' : '☹️'
          }
          return {
            isOk,
            feedback,
            score: { nbBonnesReponses: isOk ? 1 : 0, nbReponses: 1 },
          }
        },
      })

      if (this.questionJamaisPosee(i, a, b, c)) {
        // Si la question n'a jamais été posée, on en crée une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr

        if (context.isAmc) {
          this.autoCorrectionAMC[i] = {
            enonce:
              this.consigne.substring(0, this.consigne.length - 1) +
              ' : ' +
              texte +
              '.<br>',
            propositions: [
              {
                texte: texteCorr,
                statut: 1,
                feedback: '',
                sanscadre: false,
                pointilles: false,
              },
            ],
          }
          this.questionsAMC[i] = amcConvert(this.autoCorrectionAMC[i])
        }
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
