import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import FractionEtendue from '../../modules/FractionEtendue'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'pt6q4'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = "Calculer la proportion d'un événement contraire"
export const dateDePublication = '04/07/2026'

const nomsFractions = new Map<string, string>([
  ['1/4', 'un quart'],
  ['3/4', 'trois quarts'],
  ['1/5', 'un cinquième'],
  ['2/5', 'deux cinquièmes'],
  ['3/5', 'trois cinquièmes'],
  ['4/5', 'quatre cinquièmes'],
])

/**
 * @author Stéphane Guyon
 */
export default class AutoQ4PolynesieTechno2026 extends ExerciceQcmA {
  private appliquerLesValeurs(numerateur: number, denominateur: number): void {
    const proportionAdherents = new FractionEtendue(
      numerateur,
      denominateur,
    ).simplifie()
    const pourcentageAdherents = (100 * numerateur) / denominateur
    const pourcentageNonAdherents = 100 - pourcentageAdherents
    const pourcentagePartUnitaire = 100 / denominateur
    const distracteurs = [
      pourcentageAdherents,
      pourcentagePartUnitaire,
      100 - pourcentagePartUnitaire,
      (100 * Math.max(1, denominateur - numerateur - 1)) / denominateur,
      (100 * Math.min(denominateur, numerateur + 1)) / denominateur,
      20,
      25,
      40,
      60,
      75,
      80,
    ].filter(
      (valeur) =>
        valeur > 0 && valeur < 100 && valeur !== pourcentageNonAdherents,
    )

    const reponses = [pourcentageNonAdherents]
    for (const distracteur of distracteurs) {
      if (!reponses.includes(distracteur)) reponses.push(distracteur)
      if (reponses.length === 4) break
    }

    this.enonce = `Dans un lycée, les adhérents de l'association sportive représentent ${nomsFractions.get(`${numerateur}/${denominateur}`)} des élèves.<br>
    Quelle est la proportion d'élèves du lycée qui ne sont pas adhérents à l'association sportive ?`

    this.reponses = reponses.map(
      (reponse) => `$${texNombre(reponse, 0)}\\,\\%$`,
    )

    this.correction = `$${proportionAdherents.texFractionSimplifiee}=\\dfrac{${texNombre(pourcentageAdherents, 0)}}{100}=${texNombre(pourcentageAdherents, 0)}\\,\\%$.<br>
    Donc $${texNombre(pourcentageAdherents, 0)}\\,\\%$ des élèves sont adhérents à l'association sportive.<br>
    La proportion d'élèves qui ne sont pas adhérents est donc $100\\,\\%-${texNombre(pourcentageAdherents, 0)}\\,\\%=${miseEnEvidence(`${texNombre(pourcentageNonAdherents, 0)}\\,\\%`)}$.`
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(1, 4)
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    let compteur = 0
    do {
      const [numerateur, denominateur] = choice([
        [1, 4],
        [3, 4],
        [1, 5],
        [2, 5],
        [3, 5],
        [4, 5],
      ])
      this.appliquerLesValeurs(numerateur, denominateur)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
