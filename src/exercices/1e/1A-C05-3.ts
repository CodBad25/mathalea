import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import { randint } from '../../modules/outils'
import ExerciceSimple from '../ExerciceSimple'
export const dateDePublication = '15/10/2025'
export const dateDeModifImportante = '30/09/2026'
export const uuid = '67316'

export const refs = {
  'fr-fr': ['1A-C05-3', '2A-N5-3'],
  'fr-ch': [],
}
export const interactifReady = true

export const amcReady = true
export const amcType = 'qcmMono'
export const titre = 'Déterminer un ordre de grandeur'

export default class auto1AC5b extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.spacing = 1.5
    this.formatChampTexte = KeyboardType.clavierDeBase
    this.versionQcmDisponible = true
    this.versionQcm = false
  }

  nouvelleVersion() {
    if (context.isAmc) this.versionQcm = true

    const casChoisi = this.quotaChoice('cas', [1, 2, 3, 4])
    // Cas 1 : 2 chiffres × 3 chiffres ; cas 2 : 3 × 3 ; cas 3 : 2 × 4 ; cas 4 : 3 × 4
    const [echelleA, ecartA, echelleB, ecartB] = [
      [10, 4, 100, 29],
      [100, 29, 100, 29],
      [10, 4, 1000, 199],
      [100, 29, 1000, 199],
    ][casChoisi - 1]
    const chiffreA = randint(2, 9)
    const chiffreB = randint(2, 9)
    const arrondiA = chiffreA * echelleA
    const arrondiB = chiffreB * echelleB
    const a = arrondiA + randint(-ecartA, ecartA, 0)
    const b = arrondiB + randint(-ecartB, ecartB, 0)
    const resultat = arrondiA * arrondiB

    this.correction = `On arrondit $${texNombre(a)}$ à $${texNombre(arrondiA)}$ et $${texNombre(b)}$ à $${texNombre(arrondiB)}$.<br>
     On obtient : $${texNombre(arrondiA)} \\times ${texNombre(arrondiB)} = ${texNombre(arrondiA * arrondiB)}$.<br>
     Un ordre de grandeur de $${texNombre(a)} \\times ${texNombre(b)}$ est donc $${miseEnEvidence(texNombre(resultat))}$.`

    if (this.versionQcm) {
      this.question = `Un ordre de grandeur de $${texNombre(a)} \\times ${texNombre(b)}$ est :`
      this.reponse = `$${texNombre(resultat)}$`
      this.distracteurs = [
        `$${texNombre(resultat * 10)}$`,
        `$${texNombre(resultat / 10)}$`,
        `$${texNombre(resultat / 100)}$`,
      ]
    } else {
      this.question = `Donner un ordre de grandeur de $${texNombre(a)} \\times ${texNombre(b)}$.`
      this.reponse = String(resultat)
    }
  }
}
