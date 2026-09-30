import Decimal from 'decimal.js'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import { randint } from '../../modules/outils'
import ExerciceSimple from '../ExerciceSimple'
export const dateDePublication = '12/10/2025'
export const dateDeModifImportante = '30/09/2026'
export const uuid = '5a213'

export const refs = {
  'fr-fr': ['1A-C05-1', '2A-N5-1'],
  'fr-ch': [],
}
export const interactifReady = true

export const amcReady = true
export const amcType = 'qcmMono'
export const titre =
  'Déterminer un ordre de grandeur du pourcentage d’un nombre'

export default class auto1AC5 extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.spacing = 1.5
    this.formatChampTexte = KeyboardType.clavierDeBase
    this.optionsDeComparaison = { estDansIntervalle: true }
    this.versionQcmDisponible = true
    this.versionQcm = false
  }

  nouvelleVersion() {
    if (context.isAmc) this.versionQcm = true

    let pourcentageReel: number
    let nombreReel: number
    let bonneReponse: number
    let pourcentageArrondi: number
    let nombreArrondi: number
    let distracteurs: number[]
    let compteur = 0
    do {
      // Génération du pourcentage (8, 9, 11, 12, 18, 19, 21, 22, etc.)
      const dizaine = randint(0, 8) * 10
      const unite = dizaine === 0 ? 9 : choice([1, 9])
      pourcentageReel = dizaine + unite

      // Génération du nombre selon différentes valeurs
      const valeurs = this.quotaChoice('valeurs', [
        'centaines',
        'milliers',
        'dizainesMilliers',
        'centainesMilliers',
      ])
      switch (valeurs) {
        case 'centaines':
          nombreReel = randint(4, 9) * 100 + randint(-19, 19, 0)
          break
        case 'milliers':
          nombreReel = randint(4, 9) * 1000 + randint(-199, 199, 0)
          break
        case 'dizainesMilliers':
          nombreReel = randint(4, 9) * 10000 + randint(-2000, 2000, 0)
          break
        case 'centainesMilliers':
        default:
          nombreReel = 100000 + randint(-5000, 5000, 0)
          break
      }

      // Arrondir le pourcentage à la dizaine la plus proche
      pourcentageArrondi = Math.round(pourcentageReel / 10) * 10
      // Arrondir le nombre selon sa valeur
      if (nombreReel < 1000) {
        nombreArrondi = Math.round(nombreReel / 100) * 100
      } else if (nombreReel < 10000) {
        nombreArrondi = Math.round(nombreReel / 1000) * 1000
      } else {
        nombreArrondi = Math.round(nombreReel / 10000) * 10000
      }
      bonneReponse = (pourcentageArrondi * nombreArrondi) / 100

      if (nombreReel < 1000) {
        distracteurs = [
          Math.round(bonneReponse / 10) * 100, // Arrondi à la dizaine (ex: 32 → 30)
          Math.round(bonneReponse / 2 / 100) * 100, // Arrondi à la centaine (ex: 160 → 200)
          Math.round(bonneReponse / 4 / 10) * 10, // Arrondi à la dizaine (ex: 80 → 80)
        ]
      } else {
        distracteurs = [
          bonneReponse / 10,
          Math.round(bonneReponse / 2000) * 1000,
          Math.round(pourcentageReel / 10) * 10 === 50
            ? Math.round((nombreReel - bonneReponse) / 2000) * 3000
            : Math.round((nombreReel - bonneReponse) / 1000) * 1000,
        ]
      }
      distracteurs = distracteurs.map((d) => Math.round(d))
      compteur++
      // On s'assure d'avoir 4 réponses différentes, sinon on retire de nouvelles valeurs
    } while (
      compteur < 100 &&
      new Set([bonneReponse, ...distracteurs]).size < 4
    )

    this.correction = `$${pourcentageReel}\\,\\%$ est proche de $${pourcentageArrondi}\\,\\%$ et $${texNombre(nombreReel)}$ est proche de $${texNombre(nombreArrondi)}$.<br>
      Ainsi, le calcul de $${pourcentageReel}\\,\\%$ de $${texNombre(nombreReel)}$ est proche de $${pourcentageArrondi}\\,\\%$ de $${texNombre(nombreArrondi)}$`
    this.correction +=
      pourcentageArrondi === 50
        ? `, soit la moitié de $${texNombre(nombreArrondi)}$, soit $${miseEnEvidence(texNombre(bonneReponse))}$.`
        : `.<br>Et $${pourcentageArrondi}\\,\\%$ de $${texNombre(nombreArrondi)}=\\dfrac{${pourcentageArrondi}}{100}\\times${texNombre(nombreArrondi)}=${pourcentageArrondi}\\times\\dfrac{${texNombre(nombreArrondi)}}{100}=${pourcentageArrondi}\\times${texNombre(nombreArrondi / 100)}=${miseEnEvidence(texNombre(bonneReponse))}$.`

    if (this.versionQcm) {
      this.question = `Parmi les valeurs proposées, la valeur la plus proche  de $${pourcentageReel}\\,\\%$ de $${texNombre(nombreReel)}$ est :`
      this.reponse = `$${texNombre(bonneReponse)}$`
      this.distracteurs = distracteurs.map((d) => `$${texNombre(d)}$`)
    } else {
      this.question = `Donner un ordre de grandeur de $${pourcentageReel}\\,\\%$ de $${texNombre(nombreReel)}$.`
      // Toute valeur à 10 % près de la valeur exacte est acceptée, ainsi que l'ordre de grandeur attendu
      const exacte = new Decimal(pourcentageReel).mul(nombreReel).div(100)
      const min = Decimal.min(exacte.mul(0.9), bonneReponse)
      const max = Decimal.max(exacte.mul(1.1), bonneReponse)
      this.reponse = `[${min.toDecimalPlaces(2).toFixed()};${max.toDecimalPlaces(2).toFixed()}]`
    }
  }
}
