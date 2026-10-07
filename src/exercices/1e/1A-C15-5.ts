import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
// import ExerciceQcmA from '../../ExerciceQcmA'
import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { arrondi } from '../../lib/outils/nombres'
import { prenom } from '../../lib/outils/Personne'
import FractionEtendue from '../../modules/FractionEtendue'
import ExerciceQcmACourt from '../ExerciceQcmACourt'

export const dateDeModifImportante = '30/09/2026'

export const uuid = '90f36'
export const refs = {
  'fr-fr': ['1A-C15-5'],
  'fr-ch': ['10QCM-35', '11QCM-40'],
}
export const interactifReady = true

export const amcReady = 'true'
export const titre = "Calculer le coût de consommation électrique d'un appareil"
export const dateDePublication = '09/12/2025'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora assisté de Claude ai
 *
 */
export default class Auto1C15r extends ExerciceQcmACourt {
  private appliquerLesValeurs(
    puissance: number,
    duree: number,
    appareil: string,
  ): void {
    const puissanceKW = puissance / 1000
    const dureeH = new FractionEtendue(duree, 60)
    const energie = puissanceKW * dureeH.valeurDecimale
    const cout = 0.2

    // Choisir aléatoirement entre "0,2 €" et "20 centimes" pour l'énoncé
    const coutEnonce = choice([
      '$0,2\\text{ €}$',
      "$20\\text{ centimes d'euro}$",
    ])

    this.enonce = `${prenom()} utilise ${appareil} pendant $${duree}$ minutes.<br>
      La puissance de cet appareil est $${texNombre(puissance)}$ watts.<br>
      Le coût d'un kilowatt-heure d'électricité est ${coutEnonce}.<br>
      Le coût en électricité pour cette utilisation est :`

    // Calculer la bonne réponse en euros et centimes
    const coutTotalEuros = energie * cout
    let coutEuros: string
    let coutCentimes: string

    if (coutTotalEuros < 0.01) {
      coutEuros = `$${texNombre(coutTotalEuros, 3)}\\text{ €}$`
      coutCentimes = `$${texNombre(coutTotalEuros * 100, 2)}\\text{ centimes d'euro}$`
    } else if (coutTotalEuros === 0.01) {
      coutEuros = '$0,01\\text{ €}$'
      coutCentimes = "$1\\text{ centime d'euro}$"
    } else if (coutTotalEuros < 0.1) {
      coutEuros = `$${texNombre(coutTotalEuros, 2)}\\text{ €}$`
      const centimes = Math.round(coutTotalEuros * 100)
      coutCentimes =
        centimes === 1
          ? "$1\\text{ centime d'euro}$"
          : `$${centimes}\\text{ centimes d'euro}$`
    } else {
      coutEuros = `$${texNombre(coutTotalEuros, 1)}\\text{ €}$`
      const centimes = Math.round(coutTotalEuros * 100)
      coutCentimes = `$${centimes}\\text{ centimes d'euro}$`
    }

    // Générer les distracteurs
    const distracteurs = [
      `$${texNombre(coutTotalEuros * 10, 1)}\\text{ €}$`, // Erreur facteur 10
      `$${texNombre(puissanceKW * cout, 2)}\\text{ €}$`, // Oubli de la durée
      `$${texNombre(coutTotalEuros * 10, 1)}\\text{ ${arrondi(coutTotalEuros * 10, 1) < 1.05 ? "centime d'euro" : "centimes d'euro"}}$`, // Confusion avec centimes
    ]

    // Bonne réponse en premier (choisir aléatoirement euros ou centimes)
    const reponseTiree = choice([coutEuros, coutCentimes])
    const bonneReponse = this.sup3 ? reponseTiree : coutEuros

    // Conserver les valeurs exactes jusqu'à la conclusion.
    const puissanceExacte = new FractionEtendue(puissance, 1000)
    const energieExacte = puissanceExacte.produitFraction(dureeH).simplifie()
    const tarifExact = new FractionEtendue(1, 5)
    const coutExact = energieExacte.produitFraction(tarifExact).simplifie()
    let correctionFinale = `La puissance de l'appareil est de $${texNombre(puissance)}\\,\\text{W}$, soit $\\dfrac{${puissance}}{1000}=${puissanceExacte.texFractionSimplifiee}\\,\\text{kW}$.<br>
      La durée d'utilisation est de $${duree}$ minutes, soit $\\dfrac{${duree}}{60}=${dureeH.texFractionSimplifiee}\\,\\text{h}$.<br>
      Le prix d'un kilowatt-heure est de $0,2=\\dfrac{1}{5}$ euro.<br>
      L'énergie consommée est donc $${puissanceExacte.texFractionSimplifiee}\\times ${dureeH.texFractionSimplifiee}=${energieExacte.texFractionSimplifiee}\\,\\text{kWh}$.<br>
      Le coût de la consommation est $${energieExacte.texFractionSimplifiee}\\times ${tarifExact.texFractionSimplifiee}=${coutExact.texFractionSimplifiee}\\,\\text{€}$.<br>`

    // Une écriture décimale finie existe si le dénominateur ne contient que 2 et 5.
    let denominateur = coutExact.den
    while (denominateur % 2 === 0) denominateur /= 2
    while (denominateur % 5 === 0) denominateur /= 5
    if (denominateur === 1) {
      const enCentimes = bonneReponse === coutCentimes
      const valeur = coutExact.valeurDecimale * (enCentimes ? 100 : 1)
      const unite = enCentimes
        ? valeur === 1
          ? "centime d'euro"
          : "centimes d'euro"
        : '€'
      correctionFinale += `Le coût est donc $${miseEnEvidence(`${texNombre(valeur, 3)}\\,\\text{${unite}}`)}$.`
    } else {
      correctionFinale += `Ce coût n'a pas d'écriture décimale finie. La réponse proposée, $${miseEnEvidence(bonneReponse.slice(1, -1))}$, est une valeur approchée arrondie ${bonneReponse === coutCentimes ? 'au centime' : "au centième d'euro"}.`
    }

    this.correction = correctionFinale

    this.reponses = [bonneReponse, ...distracteurs]
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(1200, 10, 'un aspirateur')
  }

  versionAleatoire: () => void = () => {
    let compteur = 0
    do {
      // Tableau des configurations simples
      const configurations = [
        { puissance: 600, duree: 5 },
        { puissance: 600, duree: 10 },
        { puissance: 1000, duree: 6 },
        { puissance: 1000, duree: 10 },
        { puissance: 1200, duree: 5 },
        { puissance: 1200, duree: 10 },
        { puissance: 1200, duree: 20 },
        { puissance: 1500, duree: 10 },
        { puissance: 1500, duree: 20 },
        { puissance: 2000, duree: 15 },
        { puissance: 3000, duree: 10 },
      ]

      const config = choice(configurations)
      const appareils = [
        'un aspirateur',
        'un sèche-cheveux',
        'un fer à repasser',
        'un radiateur',
        'une bouilloire',
      ]
      const appareil = choice(appareils)

      this.appliquerLesValeurs(config.puissance, config.duree, appareil)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.enonceCourt = () =>
      this.enonce.replace(
        'Le coût en électricité pour cette utilisation est :',
        'Calculer le coût en euros de cette utilisation.',
      )
    this.versionAleatoire()
    this.spacing = 1.5
  }
}
