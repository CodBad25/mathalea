import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import FractionEtendue from '../../modules/FractionEtendue'
import ExerciceQcmACourt from '../ExerciceQcmACourt'

export const uuid = '664a7'
export const refs = {
  'fr-fr': ['1A-E05-3'],
  'fr-ch': ['10QCM-48', '11QCM-50'],
}
export const interactifReady = true

export const amcReady = 'true'
export const titre =
  'Calculer le coefficient multiplicateur réciproque (avec des décimaux)'
export const dateDePublication = '28/12/2025'
export const dateDeModifImportante = '20/10/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class TauxReciproqueP extends ExerciceQcmACourt {
  // Fraction exacte saisie lorsque la version QCM est désactivée, et sa correction
  private reponseSaisie = ''
  private correctionSaisie = ''

  private appliquerLesValeurs(augmentation: boolean, taux: number): void {
    const signe = augmentation ? '+' : '-'
    const signeMot = augmentation ? 'augmenté' : 'diminué'
    const motContexte = augmentation ? "l'augmentation" : 'la réduction'

    // Calcul du coefficient (1 + taux/100 ou 1 - taux/100)
    const coeff = augmentation ? 1 + taux / 100 : 1 - taux / 100

    this.enonce = `Le prix d'un article a ${signeMot} de $${texNombre(taux, 3)}~\\%$.<br>
    Pour retrouver son prix avant ${motContexte}, il faut multiplier son prix actuel par :`

    // Bonne réponse
    const bonneReponse = `$\\dfrac{1}{${texNombre(coeff, 3)}}$`

    // Mauvaises réponses
    const coeffOppose = augmentation ? 1 - taux / 100 : 1 + taux / 100
    const mauvaiseReponse1 = `$\\dfrac{1}{${texNombre(coeffOppose, 3)}}$`
    const mauvaiseReponse2 = `$${texNombre(coeff, 3)}$`
    const mauvaiseReponse3 = `$\\dfrac{1}{${texNombre(taux / 100, 3)}}$`

    this.reponses = [
      bonneReponse,
      mauvaiseReponse1,
      mauvaiseReponse2,
      mauvaiseReponse3,
    ]

    // Saisie libre : 1 / coeff = 100 / (100 ± taux) = 10000 / ((100 ± taux) × 100), puis simplification
    const denominateurSaisie = Math.round(
      (augmentation ? 100 + taux : 100 - taux) * 100,
    )
    this.reponseSaisie = new FractionEtendue(
      10000,
      denominateurSaisie,
    ).texFractionSimplifiee

    // Correction unifiée : seule la valeur attendue est mise en évidence
    const corrige = (
      mise: string,
      detail: string,
    ) => `${augmentation ? 'Augmenter' : 'Diminuer'} de $${texNombre(taux, 1)}~\\%$ revient à multiplier par $1${signe}\\dfrac{${texNombre(taux, 2)}}{100}=${texNombre(coeff, 3)}$.<br>
  Pour retrouver le prix initial, il faut diviser par ce coefficient, c'est-à-dire multiplier par le coefficient multiplicateur réciproque $\\dfrac{1}{${texNombre(coeff, 3)}}$.<br>
  ${detail}Le coefficient multiplicateur pour retrouver le prix initial est donc $${miseEnEvidence(mise)}$.`
    this.correction = corrige(`\\dfrac{1}{${texNombre(coeff, 3)}}`, '')
    this.correctionSaisie = corrige(
      this.reponseSaisie,
      `$\\dfrac{1}{${texNombre(coeff, 3)}}=\\dfrac{10000}{${denominateurSaisie}}=${this.reponseSaisie}$.<br>
  `,
    )
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(true, 35)
  }

  versionAleatoire: () => void = () => {
    let compteur = 0
    do {
      const augmentation = choice([true, false])
      const listeTaux = [
        5, 8, 10, 12, 15, 18, 20, 25, 28, 30, 35, 38, 40, 45, 48, 50, 2.5, 3.5,
        7.5, 12.5, 17.5, 22.5, 27.5, 32.5, 37.5, 42.5,
      ]
      const taux = choice(listeTaux)

      this.appliquerLesValeurs(augmentation, taux)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.enonceCourt = () =>
      this.enonce.replace(
        /Pour retrouver son prix avant (.*), il faut multiplier son prix actuel par :\s*$/,
        'Quel coefficient multiplicateur faut-il appliquer à son prix actuel pour retrouver son prix avant $1 ?',
      )
    this.reponseCourte = () => this.reponseSaisie
    this.correctionCourte = () => this.correctionSaisie

    this.versionAleatoire()
    this.spacingCorr = 2
  }
}
