import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import { randint } from '../../modules/outils'
import ExerciceSimple from '../ExerciceSimple'
export const dateDePublication = '19/12/2025'
export const dateDeModifImportante = '30/09/2026'
export const uuid = '54103'

export const refs = {
  'fr-fr': ['1A-C05-4', '2A-N5-4'],
  'fr-ch': [],
}
export const interactifReady = true

export const amcReady = true
export const amcType = 'qcmMono'
export const titre = 'Déterminer un ordre de grandeur avec un pourcentage'

export default class auto1AC5d extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.spacing = 1.5
    this.formatChampTexte = KeyboardType.clavierDeBase
    this.optionsDeComparaison = { nombreDecimalSeulement: true }
    this.versionQcmDisponible = true
    this.versionQcm = false
  }

  nouvelleVersion() {
    if (context.isAmc) this.versionQcm = true

    const contexte = choice(['voiture', 'maison'] as const)
    const multiplicateur = contexte === 'voiture' ? 1 : 10
    const cas = this.quotaChoice('cas', [1, 2, 3, 4])
    const prixRond = randint(211, 279) * 100 * multiplicateur
    // Remise proche de 0,1 %, 1 %, 10 % ou 20 % du prix
    const [minRemise, maxRemise, pas] = [
      [2, 5, 10],
      [18, 35, 10],
      [18, 35, 100],
      [60, 70, 100],
    ][cas - 1]
    const remise = randint(minRemise, maxRemise) * pas * multiplicateur
    const prixInitial = prixRond + remise

    const pourcentageReel = (remise / prixInitial) * 100
    const dixPourcent = prixInitial / 10
    const unPourcent = prixInitial / 100

    // Déterminer la réponse correcte (le pourcentage le plus proche)
    const choixPourcentages = [0.1, 1, 10, 20]
    const reponseCorrecte = choixPourcentages.reduce((meilleur, p) =>
      Math.abs(pourcentageReel - p) < Math.abs(pourcentageReel - meilleur)
        ? p
        : meilleur,
    )

    const article = contexte === 'voiture' ? "d'une voiture" : "d'une maison"

    // Correction avec raisonnement adapté selon le cas
    let explicationOrdreGrandeur: string
    if (reponseCorrecte === 0.1) {
      explicationOrdreGrandeur = `La remise ($${texNombre(remise)}$ €) est très petite par rapport au prix.<br>
      On prend $1\\,\\%$ de $${texNombre(prixInitial)}$ €. Cela revient à diviser par $100$.<br>
      On obtient $${texNombre(unPourcent)}$ €.<br>
      On remarque que la remise est environ $10$ fois plus petite que $1\\,\\%$ du prix.<br>`
    } else if (reponseCorrecte === 1) {
      explicationOrdreGrandeur = `La remise ($${texNombre(remise)}$ €) est petite par rapport au prix.<br>
      On prend $1\\,\\%$ de $${texNombre(prixInitial)}$ €. Cela revient à diviser par $100$.<br>
      On obtient $${texNombre(unPourcent)}$ €.<br>
      On remarque que la remise est proche de $1\\,\\%$ du prix.<br>`
    } else if (reponseCorrecte === 10) {
      explicationOrdreGrandeur = `On prend $10\\,\\%$ de $${texNombre(prixInitial)}$ €. Cela revient à diviser par $10$.<br>
      On obtient $${texNombre(dixPourcent)}$ €.<br>
      On remarque que la remise ($${texNombre(remise)}$ €) est proche de $10\\,\\%$ du prix.<br>`
    } else {
      explicationOrdreGrandeur = `On prend $10\\,\\%$ de $${texNombre(prixInitial)}$ €. Cela revient à diviser par $10$.<br>
      On obtient $${texNombre(dixPourcent)}$ €.<br>
      On remarque que la remise ($${texNombre(remise)}$ €) est environ $2$ fois plus grande que $10\\,\\%$ du prix.<br>`
    }

    this.correction = `Pour déterminer un ordre de grandeur, on cherche à comparer la remise avec des pourcentages simples du prix initial.<br>
    Les pourcentages de référence les plus utiles sont $1\\,\\%$ et $10\\,\\%$ car ils sont faciles à calculer mentalement.<br>
    ${explicationOrdreGrandeur}
    Le pourcentage le plus proche parmi les propositions est $${miseEnEvidence(texNombre(reponseCorrecte) + '\\,\\%')}$.`

    const enonce = `Le prix ${article} est $${texNombre(prixInitial)}$ €.<br>
    Le vendeur propose une remise de $${texNombre(remise)}$ €.<br><br>`
    if (this.versionQcm) {
      this.question = `${enonce}Le pourcentage de remise le plus proche est :`
      this.reponse = `$${texNombre(reponseCorrecte)}\\,\\%$`
      this.distracteurs = choixPourcentages
        .filter((p) => p !== reponseCorrecte)
        .map((p) => `$${texNombre(p)}\\,\\%$`)
    } else {
      this.question = `${enonce}Parmi les pourcentages $${choixPourcentages.map((p) => `${texNombre(p)}\\,\\%`).join('$, $')}$, quel est le plus proche du pourcentage de remise ?`
      this.optionsChampTexte = { texteApres: '$\\,\\%$' }
      this.reponse = String(reponseCorrecte)
    }
  }
}
