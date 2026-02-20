import { propositionsQcm } from '../../../lib/interactif/qcm'
import {
  combinaisonListesSansChangerOrdre,
  enleveElementBis,
} from '../../../lib/outils/arrayOutils'
import { gestionnaireFormulaireTexte } from '../../../modules/outils'

import seedrandom from 'seedrandom'
import uuidToUrl from '../../../json/uuidsToUrlFR.json'
import {
  mathaleaHandleExerciceSimple,
  mathaleaLoadExerciceFromUuid,
} from '../../../lib/mathalea'
import Exercice from '../../Exercice'
export const titre = 'Choix aléatoires des questions'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = false

/**
 * @author Mickael Guironnet
 * Créé 12 novembre 2023
 * Exercice qui permet de charger les différentes questions du CAN 6e pour un export LATEX ou la vue PROF
 * ATTENTION : exercice avec chargement dynamique des questions.
 */
export const uuid = '315b6'

export const refs = {
  'fr-fr': ['can6a-Aléa'],
  'fr-ch': ['NR'],
}

const log = function (str: string) {
  if (window.logDebug > 1) console.info(str)
}

export default class can6eAll extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireTexte = [
      'Type de questions',
      [
        'Nombres séparés\n par des tirets :',
        'All : Mélange',
        'C1 à C65 : can de 6C01 à 6C65 (sauf 6C37)',
        'G1 à G8 : can de 6G01 à 6G08',
        'M1 à M20 : can de 6M01 à 6M20',
        'N1 à N20 : can de 6N01 à 6N20',
        'C : Mélange calcul',
        'G : Mélange géométrie',
        'M : Mélange mesure',
        'N : Mélange numération',
      ].join('\n'),
    ]
    this.nbQuestions = 4
    this.sup = 'All'
    this.lastCallback = ''

    this.nouvelleVersionWrapper = function () {
      this.nouvelleVersion()
    }
  }

  nouvelleVersion() {
    this.questionJamaisPosee(
      0,
      this.seed ?? 'empty',
      this.sup,
      this.sup2,
      this.sup3,
      String(this.interactif),
      this.nbQuestions,
    )
    if (this.lastCallback === this.listeArguments[0]) {
      // identique
      // pas de recalcul à faire
      log('pas de recalcul')
      return
    }
    this.lastCallback = this.listeArguments[0]

    if (this.sup === null || this.sup === '') {
      this.sup = 'All'
    } else {
      this.sup = this.sup.toString()
    }

    log(this.sup)
    const qCal = this.sup.replaceAll('C', '')
    let questionsDisponiblesCalc = enleveElementBis(
      gestionnaireFormulaireTexte({
        saisie: qCal,
        min: 0,
        max: 65,
        defaut: 0,
        melange: 66,
        nbQuestions: 0,
        shuffle: false,
        exclus: [37, 0],
      }),
      0,
    )
    log('pass1:' + questionsDisponiblesCalc)

    if (
      questionsDisponiblesCalc.length === 0 &&
      (this.sup.includes('C') || this.sup.includes('All'))
    ) {
      // pas de question du type C1
      questionsDisponiblesCalc = gestionnaireFormulaireTexte({
        saisie: 66,
        min: 1,
        max: 65,
        defaut: 1,
        melange: 66,
        nbQuestions: this.nbQuestions,
        shuffle: true,
        exclus: [37],
      })
      log('pass2:' + questionsDisponiblesCalc)
    }

    const qGeo = this.sup.replaceAll('G', '')
    let questionsDisponiblesGeo = enleveElementBis(
      gestionnaireFormulaireTexte({
        saisie: qGeo,
        min: 0,
        max: 8,
        defaut: 0,
        melange: 9,
        nbQuestions: 0,
        shuffle: false,
      }),
      0,
    )
    log('pass1:' + questionsDisponiblesGeo)
    if (
      questionsDisponiblesGeo.length === 0 &&
      (this.sup.includes('G') || this.sup.includes('All'))
    ) {
      // pas de question du type G2
      questionsDisponiblesGeo = gestionnaireFormulaireTexte({
        saisie: 9,
        min: 1,
        max: 8,
        defaut: 1,
        melange: 9,
        nbQuestions: this.nbQuestions,
        shuffle: true,
      })
      log('pass2:' + questionsDisponiblesGeo)
    }

    const qNum = this.sup.replaceAll('N', '')
    let questionsDisponiblesNum = enleveElementBis(
      gestionnaireFormulaireTexte({
        saisie: qNum,
        min: 0,
        max: 20,
        defaut: 0,
        melange: 21,
        nbQuestions: 0,
        shuffle: false,
      }),
      0,
    )
    log('pass1:' + questionsDisponiblesNum)
    if (
      questionsDisponiblesNum.length === 0 &&
      (this.sup.includes('N') || this.sup.includes('All'))
    ) {
      // pas de question du type N2
      questionsDisponiblesNum = gestionnaireFormulaireTexte({
        saisie: 21,
        min: 1,
        max: 20,
        defaut: 1,
        melange: 21,
        nbQuestions: this.nbQuestions,
        shuffle: true,
      })
      log('pass2:' + questionsDisponiblesNum)
    }

    const qMes = this.sup.replaceAll('M', '')
    let questionsDisponiblesMes = enleveElementBis(
      gestionnaireFormulaireTexte({
        saisie: qMes,
        min: 0,
        max: 20,
        defaut: 0,
        melange: 21,
        nbQuestions: 0,
        shuffle: false,
      }),
      0,
    )
    log('pass1:' + questionsDisponiblesMes)
    if (
      questionsDisponiblesMes.length === 0 &&
      (this.sup.includes('M') || this.sup.includes('All'))
    ) {
      // pas de question du type N2
      questionsDisponiblesMes = gestionnaireFormulaireTexte({
        saisie: 21,
        min: 1,
        max: 20,
        defaut: 1,
        melange: 21,
        nbQuestions: this.nbQuestions,
        shuffle: true,
      })
      log('pass2:' + questionsDisponiblesMes)
    }

    function combineTheme(...args: string[][]) {
      const output = []
      let countA = 0
      for (let k = 0; k < args.length; k++) {
        countA = Math.max(args[k].length, countA)
      }
      for (let p = 0; p < countA; p++) {
        for (let h = 0; h < args.length; h++) {
          const a = args[h].shift()
          if (a) output.push(a)
        }
      }
      return output
    }

    if (
      questionsDisponiblesCalc.length === 0 &&
      questionsDisponiblesGeo.length === 0 &&
      questionsDisponiblesNum.length === 0 &&
      questionsDisponiblesMes.length === 0
    ) {
      // pas de question du type C2-G4
      questionsDisponiblesCalc[0] = '1'
      questionsDisponiblesGeo[0] = '1'
      questionsDisponiblesNum[0] = '1'
      questionsDisponiblesMes[0] = '1'
    }
    const comQuestions = combineTheme(
      Array.from(
        questionsDisponiblesCalc,
        (x) => 'C' + String(x).padStart(2, '0'),
      ),
      Array.from(
        questionsDisponiblesGeo,
        (x) => 'G' + String(x).padStart(2, '0'),
      ),
      Array.from(
        questionsDisponiblesNum,
        (x) => 'N' + String(x).padStart(2, '0'),
      ),
      Array.from(
        questionsDisponiblesMes,
        (x) => 'M' + String(x).padStart(2, '0'),
      ),
    )

    const questionsDisponibles = combinaisonListesSansChangerOrdre(
      comQuestions,
      this.nbQuestions,
    ).slice(0, this.nbQuestions)
    log(questionsDisponibles.join('\n'))

    async function loadAllQuests(exercice: can6eAll, numeros: string[]) {
      const promises = []
      for (let q = 0; q < numeros.length; q++) {
        if (q === 0) {
          /** MGu
           * On est obligé car la première question (indice:0) dans HandleAnswers réinitialise : exercice.autoCorrection
           */
          await loadQuest(exercice, `can6${numeros[q]}`, q)
        } else {
          promises.push(loadQuest(exercice, `can6${numeros[q]}`, q))
        }
      }

      await Promise.all(promises)

      const updateAsyncEx = new window.Event('updateAsyncEx', {
        bubbles: true,
      })
      document.dispatchEvent(updateAsyncEx)
      log('dispatched all Questions chargées')
    }

    function findUuid(fileScript: string) {
      const uuids = Object.entries(uuidToUrl)
      const found =
        uuids.find((element) => {
          const [filename, ,] = element[1]
            .replaceAll('\\', '/')
            .split('/')
            .reverse()
          if (filename.split('.')[0] === fileScript) {
            return true
          }
          return false
        }) ?? []
      return found[0]
    }

    async function loadQuest(
      exercice: Exercice,
      fileScript: string,
      i: number,
    ) {
      // const uuid = refToUuid[fileScript]
      const uuid = findUuid(fileScript) ?? ''
      const quest = mathaleaLoadExerciceFromUuid(uuid)
        .then((exports) => {
          // const quest =  import(fileScript).then(exports => {
          const q2 = exports // new exports.default()
          const k = i
          exercice.interactif ? (q2.interactif = true) : (q2.interactif = false)
          q2.numeroExercice = exercice.numeroExercice
          q2.seed = exercice.seed
          if (q2?.typeExercice === 'simple') {
            mathaleaHandleExerciceSimple(
              q2,
              q2.interactif,
              q2.numeroExercice,
              q2.seed,
            )
          } else {
            seedrandom(q2.seed, { global: true })
            q2.nouvelleVersion(q2.numeroExercice)
          }
          exercice.listeCorrections[k] = q2.listeCorrections[0]
          exercice.listeCanEnonces[k] = q2.listeCanEnonces[0]
          exercice.listeCanReponsesACompleter[k] =
            q2.listeCanReponsesACompleter[0]
          exercice.autoCorrection[k] = q2.autoCorrection[0]
          exercice.listeQuestions[k] = q2.listeQuestions[0]

          if (q2?.autoCorrection[0]?.propositions === undefined) {
            // mathlive
            // update les références HTML
            exercice.listeQuestions[k] = exercice.listeQuestions[k].replaceAll(
              `champTexteEx${exercice.numeroExercice}Q${0}`,
              `champTexteEx${exercice.numeroExercice}Q${k}`,
            )
            exercice.listeQuestions[k] = exercice.listeQuestions[k].replaceAll(
              `resultatCheckEx${exercice.numeroExercice}Q${0}`,
              `resultatCheckEx${exercice.numeroExercice}Q${k}`,
            )
            exercice.listeQuestions[k] = exercice.listeQuestions[k].replaceAll(
              `tabMathliveEx${exercice.numeroExercice}Q${0}`,
              `tabMathliveEx${exercice.numeroExercice}Q${k}`,
            )
            exercice.listeQuestions[k] = exercice.listeQuestions[k].replaceAll(
              `tabMathliveEx${exercice.numeroExercice}Q${0}`,
              `tabMathliveEx${exercice.numeroExercice}Q${k}`,
            )
            exercice.listeQuestions[k] = exercice.listeQuestions[k].replaceAll(
              `spanEx${exercice.numeroExercice}Q${0}`,
              `spanEx${exercice.numeroExercice}Q${k}`,
            )
          } else {
            // qcm
            const monQcm = propositionsQcm(exercice, k) // update les références HTML
            exercice.listeCanReponsesACompleter[k] = monQcm.texte
            exercice.listeQuestions[k] =
              exercice.autoCorrection[k].enonce + monQcm.texte
          }
          log('Question chargée' + i)
        })
        .catch(function (err) {
          if (exercice instanceof Exercice) {
            log(err)
            exercice.listeQuestions[i] = 'Erreur de chargement:' + fileScript
          } else {
            window.notify('Erreur de chargement:' + fileScript, { error: err })
          }
        })

      log('Calling Question chargée' + i)
      return quest
    }

    loadAllQuests(this, questionsDisponibles)

    this.listeQuestions = []
    this.listeCorrections = []
    this.listeCanEnonces = []
    this.listeCanReponsesACompleter = []
    this.autoCorrection = []
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; cpt++) {
      this.listeCorrections[i] = ''
      this.listeCanEnonces[i] = ''
      this.listeCanReponsesACompleter[i] = ''
      this.listeQuestions[i] = 'chargement...'
      i++
    }
    log('fin nouvelleVersion')
  }
}
