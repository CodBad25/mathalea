import Decimal from 'decimal.js'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import FractionEtendue from '../../modules/FractionEtendue'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Résoudre des problèmes de croissance  et décroissance exponentielle'
export const dateDePublication = '03/02/2026'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'bfc77'
export const refs = {
  'fr-fr': [],
  'fr-ch': ['2mLogExp-8'],
}

/**
 * Problèmes de croissance et décroissance exponentielle
 * @author Nathan Scheinmann
 */

export default class CroissanceExponentielle extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 3
    this.besoinFormulaireTexte = [
      'Contexte',
      [
        'Nombres séparés par des tirets :',
        '1 : Population',
        '2 : Bactéries (décroissance)',
        '3 : Bactéries (croissance)',
        '4 : Médicament (demi-vie)',
        '5 : Radioactivité',
        '6 : Inflation/prix',
        '7 : Mélange',
      ].join('\n'),
    ]
    this.besoinFormulaire2Texte = [
      'Type de questions',
      [
        'Nombres séparés par des tirets :',
        '1 : Valeur finale',
        '2 : Valeur initiale',
        '3 : Pourcentage',
        '4 : Temps pour atteindre une valeur',
        '5 : Mélange',
      ].join('\n'),
    ]
    this.sup = '6'
    this.sup2 = '5'
  }

  nouvelleVersion() {
    const listeContextes = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: 6,
      melange: 7,
      defaut: 7,
      listeOfCase: [
        'population',
        'bacteriesDecroissance',
        'bacteriesCroissance',
        'medicament',
        'radioactivite',
        'inflation',
      ],
      nbQuestions: this.nbQuestions,
      shuffle: true,
    })

    const listeTypeDeQuestions = gestionnaireFormulaireTexte({
      saisie: this.sup2,
      min: 1,
      max: 4,
      melange: 5,
      defaut: 5,
      listeOfCase: ['valeurFinale', 'valeurInitiale', 'pourcentage', 'temps'],
      nbQuestions: this.nbQuestions,
      shuffle: true,
    })

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      let texte = ''
      let texteCorr = ''
      let reponse = ''
      let unite = ''
      let cleUnique = '' // Clé pour vérifier l'unicité

      const contexte = listeContextes[i]
      const typeQuestion = listeTypeDeQuestions[i]

      if (contexte === 'population') {
        // Croissance de population
        const P0 = randint(50, 500) * 10 // Population en milliers ou millions
        const tauxCroissanceNum = randint(10, 55) // Taux 1.0-3.5%
        const tauxCroissance = new FractionEtendue(tauxCroissanceNum, 10)
        const tauxDecimal = tauxCroissance.valeurDecimale / 100
        const anneeDepart = randint(1980, 2010)
        const duree = randint(10, 40)

        const facteur = new Decimal(1).plus(tauxDecimal)
        const Pn = new Decimal(P0).mul(facteur.pow(duree))
        cleUnique = `pop-${P0}-${tauxCroissanceNum}-${duree}`

        if (typeQuestion === 'valeurFinale') {
          texte = `En ${anneeDepart}, une population comptait $${texNombre(P0, 0)}$ milliers d'habitants. `
          texte += `Cette population croît au taux annuel de $${texNombre(tauxCroissance.valeurDecimale, 1)}\\,\\%$. `
          texte += `Combien d'habitants y aura-t-il en ${anneeDepart + duree} (en milliers) ? Arrondir au dixième près.`

          const resultat = Pn.toDecimalPlaces(1)
          reponse = resultat.toFixed(1)
          unite = "milliers d'habitants"

          texteCorr = `La croissance de population suit le modèle $P(t) = P_0 \\cdot (1 + r)^t$ où :<br>`
          texteCorr += `$\\bullet$ $P_0 = ${texNombre(P0, 0)}$ milliers (population initiale)<br>`
          texteCorr += `$\\bullet$ $r = ${texNombre(tauxCroissance.valeurDecimale, 1)}\\,\\% = ${texNombre(tauxDecimal, 3)}$ (taux de croissance)<br>`
          texteCorr += `$\\bullet$ $t = ${duree}$ ans (durée)<br><br>`
          texteCorr += `On obtient :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `P(${duree}) &= ${texNombre(P0, 0)} \\cdot (${texNombre(facteur, 3)})^{${duree}}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(resultat, 1))}\\text{ milliers d'habitants}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `La population après $${duree}$ ans sera d'environ $${`${miseEnEvidence(texNombre(resultat, 1))}\\text{ milliers d'habitants}`}$.`
        } else if (typeQuestion === 'valeurInitiale') {
          const PnArrondi = Pn.toDecimalPlaces(0).toNumber()
          texte = `En ${anneeDepart + duree}, une population compte $${texNombre(PnArrondi, 0)}$ milliers d'habitants. `
          texte += `Cette population a crû au taux annuel de $${texNombre(tauxCroissance.valeurDecimale, 1)}\\,\\%$ depuis ${anneeDepart}. `
          texte += `Quelle était la population en ${anneeDepart} (en milliers) ? Arrondir au dixième près.`

          const P0Trouve = new Decimal(PnArrondi).div(facteur.pow(duree))
          reponse = P0Trouve.toDecimalPlaces(1).toFixed(1)
          unite = "milliers d'habitants"

          texteCorr = `La croissance de population suit le modèle $P(t) = P_0 \\cdot (1 + r)^t$ où :<br>`
          texteCorr += `$\\bullet$ $P(t) = ${texNombre(PnArrondi, 0)}$ milliers (population finale)<br>`
          texteCorr += `$\\bullet$ $r = ${texNombre(tauxCroissance.valeurDecimale, 1)}\\,\\% = ${texNombre(tauxDecimal, 3)}$ (taux de croissance)<br>`
          texteCorr += `$\\bullet$ $t = ${duree}$ ans (durée)<br>`
          texteCorr += `$\\bullet$ $P_0 = ?$ (population initiale recherchée)<br><br>`
          texteCorr += `On isole $P_0$ :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `P_0 &= \\dfrac{P(t)}{(1 + r)^t}\\\\\n`
          texteCorr += `&= \\dfrac{${texNombre(PnArrondi, 0)}}{(${texNombre(facteur, 3)})^{${duree}}}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(P0Trouve, 1))}\\text{ milliers}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `La population initiale était d'environ $${`${miseEnEvidence(texNombre(P0Trouve, 1))}\\text{ milliers d'habitants}`}$.`
        } else if (typeQuestion === 'pourcentage') {
          texte = `Une population croît au taux annuel de $${texNombre(tauxCroissance.valeurDecimale, 1)}\\,\\%$. `
          texte += `Quel est le taux de croissance total de la population sur ${duree} ans ? Arrondir au dixième de pourcent près.`

          const pourcentage = facteur.pow(duree).mul(100)
          const pourcentageFin = pourcentage.minus(100)
          reponse = pourcentageFin.toDecimalPlaces(1).toFixed(1)
          unite = '%'

          texteCorr = `Avec $P(t) = P_0 \\cdot (1 + r)^t$, le pourcentage de la population initiale est $\\dfrac{P(t)}{P_0} \\times 100 = (1 + r)^t \\times 100$ où :<br>`
          texteCorr += `$\\bullet$ $r = ${texNombre(tauxCroissance.valeurDecimale, 1)}\\,\\% = ${texNombre(tauxDecimal, 3)}$ (taux de croissance)<br>`
          texteCorr += `$\\bullet$ $t = ${duree}$ ans (durée)<br><br>`
          texteCorr += `On obtient :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `\\text{Pourcentage} &= (${texNombre(facteur, 3)})^{${duree}} \\times 100\\\\\n`
          texteCorr += `&\\approx ${texNombre(pourcentage, 1)}\\,\\%\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `Le taux de croissance sur ${duree} ans est de $${texNombre(pourcentage, 1)}\\%-100\\%=${`${miseEnEvidence(texNombre(pourcentageFin, 1))}\\,\\%`}$.`
        } else {
          const PnArrondi = Pn.toDecimalPlaces(0).toNumber()
          texte = `Une population de $${texNombre(P0, 0)}$ milliers d'habitants croît au taux de $${texNombre(tauxCroissance.valeurDecimale, 1)}\\,\\%$ par an. `
          texte += `En combien d'années atteindra-t-elle $${texNombre(PnArrondi, 0)}$ milliers ? Arrondir à l'année près.`

          const tempsTrouve = new Decimal(PnArrondi)
            .div(P0)
            .ln()
            .div(facteur.ln())
          reponse = tempsTrouve.toDecimalPlaces(0).toFixed(0)
          unite = 'ans'

          texteCorr = `La croissance de population suit le modèle $P(t) = P_0 \\cdot (1 + r)^t$ où :<br>`
          texteCorr += `$\\bullet$ $P_0 = ${texNombre(P0, 0)}$ milliers (population initiale)<br>`
          texteCorr += `$\\bullet$ $P(t) = ${texNombre(PnArrondi, 0)}$ milliers (population finale)<br>`
          texteCorr += `$\\bullet$ $r = ${texNombre(tauxCroissance.valeurDecimale, 1)}\\,\\% = ${texNombre(tauxDecimal, 3)}$ (taux de croissance)<br>`
          texteCorr += `$\\bullet$ $t = ?$ (durée recherchée)<br><br>`
          texteCorr += `On isole $t$ :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `(1 + r)^t &= \\dfrac{P(t)}{P_0}\\\\\n`
          texteCorr += `t &= \\dfrac{\\ln\\left(\\dfrac{P(t)}{P_0}\\right)}{\\ln(1 + r)}\\\\\n`
          texteCorr += `&= \\dfrac{\\ln\\left(\\dfrac{${texNombre(PnArrondi, 0)}}{${texNombre(P0, 0)}}\\right)}{\\ln(${texNombre(facteur, 3)})}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(tempsTrouve, 0))}\\text{ ans}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `La population atteindra ce niveau après environ $${`${miseEnEvidence(texNombre(tempsTrouve, 0))}\\text{ ans}`}$.`
        }
      } else if (contexte === 'bacteriesDecroissance') {
        // Décroissance de bactéries
        const kNum = randint(1, 4)
        const kDen = choice([10, 20])
        const k = new FractionEtendue(kNum, kDen)
        const kDecimal = k.valeurDecimale
        // Limiter t pour que e^(-kt) >= 2% (kt <= 4), garantissant des survivants > 0
        const tMax = Math.min(20, Math.floor(4 / kDecimal))
        const t = randint(5, Math.max(5, tMax))
        const N0 = randint(100, 1000)

        const Nt = new Decimal(N0).mul(
          Decimal.exp(new Decimal(-kDecimal).mul(t)),
        )
        cleUnique = `coh-${kNum}-${kDen}-${t}-${N0}`

        if (typeQuestion === 'valeurFinale') {
          texte = `Une population de $${texNombre(N0, 0)}$ bactéries suit une loi de décroissance exponentielle $N(t) = N_0 \\cdot \\text{e}^{-kt}$ avec $k = ${k.texFractionSimplifiee}$. `
          texte += `Combien de bactéries restera-t-il après $${t}$ heures ? Arrondir à l'unité.`

          const resultat = Nt.toDecimalPlaces(0)
          reponse = resultat.toFixed(0)
          unite = 'bactéries'

          texteCorr = `La décroissance suit $N(t) = N_0 \\cdot \\text{e}^{-kt}$ où :<br>`
          texteCorr += `$\\bullet$ $N_0 = ${texNombre(N0, 0)}$ bactéries (population initiale)<br>`
          texteCorr += `$\\bullet$ $k = ${k.texFractionSimplifiee}$ (coefficient de décroissance)<br>`
          texteCorr += `$\\bullet$ $t = ${t}$ h (durée)<br><br>`
          texteCorr += `On obtient :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `N(${t}) &= ${texNombre(N0, 0)} \\cdot \\text{e}^{-${k.texFractionSimplifiee} \\times ${t}}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(resultat, 0))}\\text{ bactéries}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `Il restera environ $${`${miseEnEvidence(texNombre(resultat, 0))}\\text{ bactéries}`}$ après $${t}$ heures.`
        } else if (typeQuestion === 'pourcentage') {
          texte = `Une population de bactéries suit une loi de décroissance exponentielle $N(t) = N_0 \\cdot \\text{e}^{-kt}$ avec $k = ${k.texFractionSimplifiee}$. `
          texte += `Quel pourcentage de la population restera-t-il après $${t}$ heures ? Arrondir au dixième de pourcent près.`

          const pourcentage = Decimal.exp(new Decimal(-kDecimal).mul(t)).mul(
            100,
          )
          reponse = pourcentage.toDecimalPlaces(1).toFixed(1)
          unite = '%'

          texteCorr = `La décroissance suit $N(t) = N_0 \\cdot \\text{e}^{-kt}$ où :<br>`
          texteCorr += `$\\bullet$ $k = ${k.texFractionSimplifiee}$ (coefficient de décroissance)<br>`
          texteCorr += `$\\bullet$ $t = ${t}$ h (durée)<br><br>`
          texteCorr += `Le pourcentage restant est $\\text{e}^{-kt} \\times 100$ :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `\\text{Pourcentage} &= \\text{e}^{-${k.texFractionSimplifiee} \\times ${t}} \\times 100\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(pourcentage, 1))}\\,\\%`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `Il restera environ $${`${miseEnEvidence(texNombre(pourcentage, 1))}\\,\\%`}$ de la population initiale après $${t}$ heures.`
        } else if (typeQuestion === 'valeurInitiale') {
          const NtArrondi = Nt.toDecimalPlaces(0).toNumber()
          texte = `Après $${t}$ heures, une population de bactéries compte $${texNombre(NtArrondi, 0)}$ bactéries. `
          texte += `La décroissance suit $N(t) = N_0 \\cdot \\text{e}^{-kt}$ avec $k = ${k.texFractionSimplifiee}$. `
          texte += `Quelle était la population initiale ? Arrondir à l'unité.`

          const N0Trouve = new Decimal(NtArrondi).div(
            Decimal.exp(new Decimal(-kDecimal).mul(t)),
          )
          reponse = N0Trouve.toDecimalPlaces(0).toFixed(0)
          unite = 'bactéries'

          texteCorr = `La décroissance suit $N(t) = N_0 \\cdot \\text{e}^{-kt}$ où :<br>`
          texteCorr += `$\\bullet$ $N(t) = ${texNombre(NtArrondi, 0)}$ bactéries (population après $${t}$ h)<br>`
          texteCorr += `$\\bullet$ $k = ${k.texFractionSimplifiee}$ (coefficient de décroissance)<br>`
          texteCorr += `$\\bullet$ $t = ${t}$ h (durée)<br>`
          texteCorr += `$\\bullet$ $N_0 = ?$ (population initiale recherchée)<br><br>`
          texteCorr += `On isole $N_0$ :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `N_0 &= \\dfrac{N(t)}{\\text{e}^{-kt}}\\\\\n`
          texteCorr += `&= \\dfrac{${texNombre(NtArrondi, 0)}}{\\text{e}^{-${k.texFractionSimplifiee} \\times ${t}}}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(N0Trouve, 0))}\\text{ bactéries}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `La population initiale comptait environ $${`${miseEnEvidence(texNombre(N0Trouve, 0))}\\text{ bactéries}`}$.`
        } else {
          const pourcentageCible = randint(10, 50)
          texte = `Une population de bactéries suit une loi de décroissance $N(t) = N_0 \\cdot \\text{e}^{-kt}$ avec $k = ${k.texFractionSimplifiee}$. `
          texte += `Au bout de combien d'heures restera-t-il $${pourcentageCible}\\,\\%$ de la population ? Arrondir au dixième d'heure près.`

          // e^(-kt) = pourcentageCible/100, donc t = -ln(pourcentageCible/100)/k
          const tempsTrouve = new Decimal(pourcentageCible)
            .div(100)
            .ln()
            .neg()
            .div(kDecimal)
          reponse = tempsTrouve.toDecimalPlaces(1).toFixed(1)
          unite = 'heures'

          texteCorr = `La décroissance suit $N(t) = N_0 \\cdot \\text{e}^{-kt}$ où :<br>`
          texteCorr += `$\\bullet$ $k = ${k.texFractionSimplifiee}$ (coefficient de décroissance)<br>`
          texteCorr += `$\\bullet$ $\\text{e}^{-kt} = ${texNombre(pourcentageCible / 100, 2)}$ (fraction restante)<br>`
          texteCorr += `$\\bullet$ $t = ?$ (durée recherchée)<br><br>`
          texteCorr += `On isole $t$ :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `-kt &= \\ln(${texNombre(pourcentageCible / 100, 2)})\\\\\n`
          texteCorr += `t &= \\dfrac{-\\ln(${texNombre(pourcentageCible / 100, 2)})}{${k.texFractionSimplifiee}}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(tempsTrouve, 1))}\\text{ heures}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `Il restera $${pourcentageCible}\\,\\%$ de la population après environ $${`${miseEnEvidence(texNombre(tempsTrouve, 1))}\\text{ heures}`}$.`
        }
      } else if (contexte === 'bacteriesCroissance') {
        // Croissance exponentielle de bactéries
        const kNum = randint(1, 5)
        const kDen = choice([10, 20])
        const k = new FractionEtendue(kNum, kDen)
        const kDecimal = k.valeurDecimale
        const t = randint(5, 20)
        const N0 = randint(100, 500) * 10

        const Nt = new Decimal(N0).mul(
          Decimal.exp(new Decimal(kDecimal).mul(t)),
        )
        cleUnique = `bac-${kNum}-${kDen}-${t}-${N0}`

        if (typeQuestion === 'valeurFinale') {
          texte = `Une culture de bactéries compte initialement $${texNombre(N0, 0)}$ bactéries et suit une croissance exponentielle $N(t) = N_0 \\cdot \\text{e}^{kt}$ avec $k = ${k.texFractionSimplifiee}$. `
          texte += `Combien de bactéries y aura-t-il après $${t}$ heures ? Arrondir à l'unité.`

          const resultat = Nt.toDecimalPlaces(0)
          reponse = resultat.toFixed(0)
          unite = 'bactéries'

          texteCorr = `La croissance suit $N(t) = N_0 \\cdot \\text{e}^{kt}$ où :<br>`
          texteCorr += `$\\bullet$ $N_0 = ${texNombre(N0, 0)}$ bactéries (population initiale)<br>`
          texteCorr += `$\\bullet$ $k = ${k.texFractionSimplifiee}$ (coefficient de croissance)<br>`
          texteCorr += `$\\bullet$ $t = ${t}$ h (durée)<br><br>`
          texteCorr += `On obtient :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `N(${t}) &= ${texNombre(N0, 0)} \\cdot \\text{e}^{${k.texFractionSimplifiee} \\times ${t}}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(resultat, 0))}\\text{ bactéries}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `La population atteindra environ $${`${miseEnEvidence(texNombre(resultat, 0))}\\text{ bactéries}`}$ après $${t}$ heures.`
        } else if (typeQuestion === 'pourcentage') {
          texte = `Une culture de bactéries suit une croissance exponentielle $N(t) = N_0 \\cdot \\text{e}^{kt}$ avec $k = ${k.texFractionSimplifiee}$. `
          texte += `De quel pourcentage la population aura-t-elle augmenté après $${t}$ heures ? Arrondir au dixième de pourcent près.`

          const facteurCroissance = Decimal.exp(new Decimal(kDecimal).mul(t))
          const augmentation = facteurCroissance.minus(1).mul(100)
          reponse = augmentation.toDecimalPlaces(1).toFixed(1)
          unite = '%'

          texteCorr = `La croissance suit $N(t) = N_0 \\cdot \\text{e}^{kt}$ où :<br>`
          texteCorr += `$\\bullet$ $k = ${k.texFractionSimplifiee}$ (coefficient de croissance)<br>`
          texteCorr += `$\\bullet$ $t = ${t}$ h (durée)<br><br>`
          texteCorr += `Le pourcentage d'augmentation est $(\\text{e}^{kt} - 1) \\times 100$ :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `\\text{Augmentation} &= (\\text{e}^{${k.texFractionSimplifiee} \\times ${t}} - 1) \\times 100\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(augmentation, 1))}\\,\\%`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `La population aura augmenté d'environ $${`${miseEnEvidence(texNombre(augmentation, 1))}\\,\\%`}$.`
        } else if (typeQuestion === 'valeurInitiale') {
          const NtArrondi = Nt.toDecimalPlaces(0).toNumber()
          texte = `Après $${t}$ heures, une culture de bactéries compte $${texNombre(NtArrondi, 0)}$ bactéries. `
          texte += `La croissance suit $N(t) = N_0 \\cdot \\text{e}^{kt}$ avec $k = ${k.texFractionSimplifiee}$. `
          texte += `Quelle était la population initiale ? Arrondir à l'unité.`

          const N0Trouve = new Decimal(NtArrondi).div(
            Decimal.exp(new Decimal(kDecimal).mul(t)),
          )
          reponse = N0Trouve.toDecimalPlaces(0).toFixed(0)
          unite = 'bactéries'

          texteCorr = `La croissance suit $N(t) = N_0 \\cdot \\text{e}^{kt}$ où :<br>`
          texteCorr += `$\\bullet$ $N(t) = ${texNombre(NtArrondi, 0)}$ bactéries (population après $${t}$ h)<br>`
          texteCorr += `$\\bullet$ $k = ${k.texFractionSimplifiee}$ (coefficient de croissance)<br>`
          texteCorr += `$\\bullet$ $t = ${t}$ h (durée)<br>`
          texteCorr += `$\\bullet$ $N_0 = ?$ (population initiale recherchée)<br><br>`
          texteCorr += `On isole $N_0$ :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `N_0 &= \\dfrac{N(t)}{\\text{e}^{kt}}\\\\\n`
          texteCorr += `&= \\dfrac{${texNombre(NtArrondi, 0)}}{\\text{e}^{${k.texFractionSimplifiee} \\times ${t}}}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(N0Trouve, 0))}\\text{ bactéries}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `La population initiale comptait environ $${`${miseEnEvidence(texNombre(N0Trouve, 0))}\\text{ bactéries}`}$.`
        } else {
          const multiplicateur = randint(2, 5)
          texte = `Une culture de bactéries suit une croissance exponentielle $N(t) = N_0 \\cdot \\text{e}^{kt}$ avec $k = ${k.texFractionSimplifiee}$. `
          texte += `Au bout de combien d'heures la population sera-t-elle multipliée par $${multiplicateur}$ ? Arrondir au dixième d'heure près.`

          // e^(kt) = multiplicateur, donc t = ln(multiplicateur)/k
          const tempsTrouve = new Decimal(multiplicateur).ln().div(kDecimal)
          reponse = tempsTrouve.toDecimalPlaces(1).toFixed(1)
          unite = 'heures'

          texteCorr = `La croissance suit $N(t) = N_0 \\cdot \\text{e}^{kt}$ où :<br>`
          texteCorr += `$\\bullet$ $k = ${k.texFractionSimplifiee}$ (coefficient de croissance)<br>`
          texteCorr += `$\\bullet$ $\\text{e}^{kt} = ${multiplicateur}$ (facteur multiplicatif)<br>`
          texteCorr += `$\\bullet$ $t = ?$ (durée recherchée)<br><br>`
          texteCorr += `On isole $t$ :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `kt &= \\ln(${multiplicateur})\\\\\n`
          texteCorr += `t &= \\dfrac{\\ln(${multiplicateur})}{${k.texFractionSimplifiee}}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(tempsTrouve, 1))}\\text{ heures}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `La population sera multipliée par $${multiplicateur}$ après environ $${`${miseEnEvidence(texNombre(tempsTrouve, 1))}\\text{ heures}`}$.`
        }
      } else if (contexte === 'medicament') {
        // Demi-vie d'un médicament
        const demiVieHeures = choice([2, 3, 4, 5, 6, 8, 12])
        const doseInitiale = choice([100, 200, 250, 400, 500, 600, 800])
        const tempsEcoule = randint(4, 36)

        // M(t) = M0 * (1/2)^(t/T)
        const Mt = new Decimal(doseInitiale).mul(
          new Decimal(0.5).pow(new Decimal(tempsEcoule).div(demiVieHeures)),
        )
        cleUnique = `med-${demiVieHeures}-${doseInitiale}-${tempsEcoule}`

        if (typeQuestion === 'valeurFinale') {
          texte = `Un médicament a une demi-vie de $${demiVieHeures}$ heures dans l'organisme. La quantité restante suit la loi $M(t) = M_0 \\cdot \\left(\\dfrac{1}{2}\\right)^{t/T}$. `
          texte += `Si on administre une dose initiale de $${doseInitiale}$ mg, quelle quantité (en mg) reste-t-il après $${tempsEcoule}$ heures ? Arrondir au dixième de mg près.`

          const resultat = Mt.toDecimalPlaces(1)
          reponse = resultat.toFixed(1)
          unite = 'mg'

          texteCorr = `La quantité de médicament suit $M(t) = M_0 \\cdot \\left(\\dfrac{1}{2}\\right)^{t/T}$ où :<br>`
          texteCorr += `$\\bullet$ $M_0 = ${doseInitiale}$ mg (dose initiale)<br>`
          texteCorr += `$\\bullet$ $T = ${demiVieHeures}$ h (demi-vie)<br>`
          texteCorr += `$\\bullet$ $t = ${tempsEcoule}$ h (temps écoulé)<br><br>`
          texteCorr += `On obtient :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `M(${tempsEcoule}) &= ${doseInitiale} \\cdot \\left(\\dfrac{1}{2}\\right)^{${tempsEcoule}/${demiVieHeures}}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(resultat, 1))}\\text{ mg}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `Il restera environ $${`${miseEnEvidence(texNombre(resultat, 1))}\\text{ mg}`}$ de médicament après $${tempsEcoule}$ heures.`
        } else if (typeQuestion === 'valeurInitiale') {
          const MtArrondi = Mt.toDecimalPlaces(1).toNumber()
          texte = `Un médicament a une demi-vie de $${demiVieHeures}$ heures. La quantité restante suit la loi $M(t) = M_0 \\cdot \\left(\\dfrac{1}{2}\\right)^{t/T}$. `
          texte += `Après $${tempsEcoule}$ heures, il reste $${texNombre(MtArrondi, 1)}$ mg dans l'organisme. `
          texte += `Quelle était la dose initiale administrée ? Arrondir au mg près.`

          const M0Trouve = new Decimal(MtArrondi).div(
            new Decimal(0.5).pow(new Decimal(tempsEcoule).div(demiVieHeures)),
          )
          reponse = M0Trouve.toDecimalPlaces(0).toFixed(0)
          unite = 'mg'

          texteCorr = `La quantité de médicament suit $M(t) = M_0 \\cdot \\left(\\dfrac{1}{2}\\right)^{t/T}$ où :<br>`
          texteCorr += `$\\bullet$ $M(t) = ${texNombre(MtArrondi, 1)}$ mg (quantité restante)<br>`
          texteCorr += `$\\bullet$ $T = ${demiVieHeures}$ h (demi-vie)<br>`
          texteCorr += `$\\bullet$ $t = ${tempsEcoule}$ h (temps écoulé)<br>`
          texteCorr += `$\\bullet$ $M_0 = ?$ (dose initiale recherchée)<br><br>`
          texteCorr += `On isole $M_0$ :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `M_0 &= \\dfrac{M(t)}{\\left(\\dfrac{1}{2}\\right)^{t/T}}\\\\\n`
          texteCorr += `&= \\dfrac{${texNombre(MtArrondi, 1)}}{\\left(\\dfrac{1}{2}\\right)^{${tempsEcoule}/${demiVieHeures}}}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(M0Trouve, 0))}\\text{ mg}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `La dose initiale était d'environ $${`${miseEnEvidence(texNombre(M0Trouve, 0))}\\text{ mg}`}$.`
        } else if (typeQuestion === 'pourcentage') {
          texte = `Un médicament a une demi-vie de $${demiVieHeures}$ heures. La quantité restante suit la loi $M(t) = M_0 \\cdot \\left(\\dfrac{1}{2}\\right)^{t/T}$. `
          texte += `Quel pourcentage de la dose initiale reste-t-il après $${tempsEcoule}$ heures ? Arrondir au dixième de pourcent près.`

          const pourcentage = new Decimal(0.5)
            .pow(new Decimal(tempsEcoule).div(demiVieHeures))
            .mul(100)
          reponse = pourcentage.toDecimalPlaces(1).toFixed(1)
          unite = '%'

          texteCorr = `Avec $M(t) = M_0 \\cdot \\left(\\dfrac{1}{2}\\right)^{t/T}$, le pourcentage restant est $\\left(\\dfrac{1}{2}\\right)^{t/T} \\times 100$ où :<br>`
          texteCorr += `$\\bullet$ $T = ${demiVieHeures}$ h (demi-vie)<br>`
          texteCorr += `$\\bullet$ $t = ${tempsEcoule}$ h (temps écoulé)<br><br>`
          texteCorr += `On obtient :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `\\text{Pourcentage} &= \\left(\\dfrac{1}{2}\\right)^{${tempsEcoule}/${demiVieHeures}} \\times 100\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(pourcentage, 1))}\\,\\%`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `Il restera environ $${`${miseEnEvidence(texNombre(pourcentage, 1))}\\,\\%`}$ de la dose initiale après $${tempsEcoule}$ heures.`
        } else {
          const pourcentageCible = randint(5, 25)
          texte = `Un médicament a une demi-vie de $${demiVieHeures}$ heures. La quantité restante suit la loi $M(t) = M_0 \\cdot \\left(\\dfrac{1}{2}\\right)^{t/T}$. `
          texte += `Au bout de combien d'heures ne restera-t-il que $${pourcentageCible}\\,\\%$ de la dose initiale ? Arrondir au dixième d'heure près.`

          // (1/2)^(t/T) = pourcentageCible/100
          // t/T = log_{1/2}(pourcentageCible/100) = ln(pourcentageCible/100) / ln(0.5)
          const tempsTrouve = new Decimal(pourcentageCible)
            .div(100)
            .ln()
            .div(new Decimal(0.5).ln())
            .mul(demiVieHeures)
          reponse = tempsTrouve.toDecimalPlaces(1).toFixed(1)
          unite = 'heures'

          texteCorr = `Avec $M(t) = M_0 \\cdot \\left(\\dfrac{1}{2}\\right)^{t/T}$ où :<br>`
          texteCorr += `$\\bullet$ $T = ${demiVieHeures}$ h (demi-vie)<br>`
          texteCorr += `$\\bullet$ $\\left(\\dfrac{1}{2}\\right)^{t/T} = ${texNombre(pourcentageCible / 100, 2)}$ (fraction restante)<br>`
          texteCorr += `$\\bullet$ $t = ?$ (temps recherché)<br><br>`
          texteCorr += `On isole $t$ :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `\\dfrac{t}{T} &= \\dfrac{\\ln(${texNombre(pourcentageCible / 100, 2)})}{\\ln(0{,}5)}\\\\\n`
          texteCorr += `t &= ${demiVieHeures} \\cdot \\dfrac{\\ln(${texNombre(pourcentageCible / 100, 2)})}{\\ln(0{,}5)}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(tempsTrouve, 1))}\\text{ heures}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `Il ne restera que $${pourcentageCible}\\,\\%$ de la dose après environ $${`${miseEnEvidence(texNombre(tempsTrouve, 1))}\\text{ heures}`}$.`
        }
      } else if (contexte === 'radioactivite') {
        // Décroissance radioactive
        const demiVieAns = choice([5, 8, 10, 15, 20, 30, 50, 100])
        const masseInitiale = randint(10, 200)
        // Limiter à 5 demi-vies max pour avoir au moins ~3% restant
        const tempsRadio = randint(
          Math.floor(demiVieAns * 0.5),
          Math.floor(demiVieAns * 5),
        )

        // M(t) = M0 * (1/2)^(t/T)
        const Mt = new Decimal(masseInitiale).mul(
          new Decimal(0.5).pow(new Decimal(tempsRadio).div(demiVieAns)),
        )
        cleUnique = `rad-${demiVieAns}-${masseInitiale}-${tempsRadio}`

        if (typeQuestion === 'valeurFinale') {
          texte = `Un isotope radioactif a une demi-vie de $${demiVieAns}$ ans. La masse restante suit la loi $M(t) = M_0 \\cdot \\left(\\dfrac{1}{2}\\right)^{t/T}$. `
          texte += `Si on dispose initialement de $${masseInitiale}$ grammes, quelle masse reste-t-il après $${tempsRadio}$ ans ? Arrondir au dixième de gramme près.`

          const resultat = Mt.toDecimalPlaces(1)
          reponse = resultat.toFixed(1)
          unite = 'g'

          texteCorr = `La décroissance radioactive suit $M(t) = M_0 \\cdot \\left(\\dfrac{1}{2}\\right)^{t/T}$ où :<br>`
          texteCorr += `$\\bullet$ $M_0 = ${masseInitiale}$ g (masse initiale)<br>`
          texteCorr += `$\\bullet$ $T = ${demiVieAns}$ ans (demi-vie)<br>`
          texteCorr += `$\\bullet$ $t = ${tempsRadio}$ ans (temps écoulé)<br><br>`
          texteCorr += `On obtient :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `M(${tempsRadio}) &= ${masseInitiale} \\cdot \\left(\\dfrac{1}{2}\\right)^{${tempsRadio}/${demiVieAns}}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(resultat, 1))}\\text{ g}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `La masse restante après $${tempsRadio}$ ans est d'environ $${`${miseEnEvidence(texNombre(resultat, 1))}\\text{ g}`}$.`
        } else if (typeQuestion === 'valeurInitiale') {
          const MtArrondi = Mt.toDecimalPlaces(1).toNumber()
          texte = `Un isotope radioactif a une demi-vie de $${demiVieAns}$ ans. La masse restante suit la loi $M(t) = M_0 \\cdot \\left(\\dfrac{1}{2}\\right)^{t/T}$. `
          texte += `Après $${tempsRadio}$ ans, il reste $${texNombre(MtArrondi, 1)}$ g. `
          texte += `Quelle était la masse initiale ? Arrondir au gramme près.`

          const M0Trouve = new Decimal(MtArrondi).div(
            new Decimal(0.5).pow(new Decimal(tempsRadio).div(demiVieAns)),
          )
          reponse = M0Trouve.toDecimalPlaces(0).toFixed(0)
          unite = 'g'

          texteCorr = `La décroissance radioactive suit $M(t) = M_0 \\cdot \\left(\\dfrac{1}{2}\\right)^{t/T}$ où :<br>`
          texteCorr += `$\\bullet$ $M(t) = ${texNombre(MtArrondi, 1)}$ g (masse restante)<br>`
          texteCorr += `$\\bullet$ $T = ${demiVieAns}$ ans (demi-vie)<br>`
          texteCorr += `$\\bullet$ $t = ${tempsRadio}$ ans (temps écoulé)<br>`
          texteCorr += `$\\bullet$ $M_0 = ?$ (masse initiale recherchée)<br><br>`
          texteCorr += `On isole $M_0$ :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `M_0 &= \\dfrac{M(t)}{\\left(\\dfrac{1}{2}\\right)^{t/T}}\\\\\n`
          texteCorr += `&= \\dfrac{${texNombre(MtArrondi, 1)}}{\\left(\\dfrac{1}{2}\\right)^{${tempsRadio}/${demiVieAns}}}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(M0Trouve, 0))}\\text{ g}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `La masse initiale était d'environ $${`${miseEnEvidence(texNombre(M0Trouve, 0))}\\text{ g}`}$.`
        } else if (typeQuestion === 'pourcentage') {
          texte = `Un isotope radioactif a une demi-vie de $${demiVieAns}$ ans. La masse restante suit la loi $M(t) = M_0 \\cdot \\left(\\dfrac{1}{2}\\right)^{t/T}$. `
          texte += `Quel pourcentage de la masse initiale reste-t-il après $${tempsRadio}$ ans ? Arrondir au dixième de pourcent près.`

          const pourcentage = new Decimal(0.5)
            .pow(new Decimal(tempsRadio).div(demiVieAns))
            .mul(100)
          reponse = pourcentage.toDecimalPlaces(1).toFixed(1)
          unite = '%'

          texteCorr = `Avec $M(t) = M_0 \\cdot \\left(\\dfrac{1}{2}\\right)^{t/T}$, le pourcentage restant est $\\left(\\dfrac{1}{2}\\right)^{t/T} \\times 100$ où :<br>`
          texteCorr += `$\\bullet$ $T = ${demiVieAns}$ ans (demi-vie)<br>`
          texteCorr += `$\\bullet$ $t = ${tempsRadio}$ ans (temps écoulé)<br><br>`
          texteCorr += `On obtient :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `\\text{Pourcentage} &= \\left(\\dfrac{1}{2}\\right)^{${tempsRadio}/${demiVieAns}} \\times 100\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(pourcentage, 1))}\\,\\%`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `Il restera environ $${`${miseEnEvidence(texNombre(pourcentage, 1))}\\,\\%`}$ de la masse initiale après $${tempsRadio}$ ans.`
        } else {
          const pourcentageCible = randint(1, 20)
          texte = `Un isotope radioactif a une demi-vie de $${demiVieAns}$ ans. La masse restante suit la loi $M(t) = M_0 \\cdot \\left(\\dfrac{1}{2}\\right)^{t/T}$. `
          texte += `Au bout de combien d'années ne restera-t-il que $${pourcentageCible}\\,\\%$ de la masse initiale ? Arrondir au dixième d'année près.`

          const tempsTrouve = new Decimal(pourcentageCible)
            .div(100)
            .ln()
            .div(new Decimal(0.5).ln())
            .mul(demiVieAns)
          reponse = tempsTrouve.toDecimalPlaces(1).toFixed(1)
          unite = 'ans'

          texteCorr = `Avec $M(t) = M_0 \\cdot \\left(\\dfrac{1}{2}\\right)^{t/T}$ où :<br>`
          texteCorr += `$\\bullet$ $T = ${demiVieAns}$ ans (demi-vie)<br>`
          texteCorr += `$\\bullet$ $\\left(\\dfrac{1}{2}\\right)^{t/T} = ${texNombre(pourcentageCible / 100, 2)}$ (fraction restante)<br>`
          texteCorr += `$\\bullet$ $t = ?$ (temps recherché)<br><br>`
          texteCorr += `On isole $t$ :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `\\left(\\dfrac{1}{2}\\right)^{t/T} &= ${texNombre(pourcentageCible / 100, 2)}\\\\\n`
          texteCorr += `t &= T \\cdot \\dfrac{\\ln(${texNombre(pourcentageCible / 100, 2)})}{\\ln(0{,}5)}\\\\\n`
          texteCorr += `&= ${demiVieAns} \\cdot \\dfrac{\\ln(${texNombre(pourcentageCible / 100, 2)})}{\\ln(0{,}5)}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(tempsTrouve, 1))}\\text{ ans}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `Il ne restera que $${pourcentageCible}\\,\\%$ de la masse après environ $${`${miseEnEvidence(texNombre(tempsTrouve, 1))}\\text{ ans}`}$.`
        }
      } else {
        // Inflation / prix
        const prixInitial = randint(3, 300)
        const tauxInflationNum = randint(2, 7)
        const tauxInflation = new FractionEtendue(tauxInflationNum, 1)
        const tauxDecimal = tauxInflation.valeurDecimale / 100
        const dureeInflation = randint(15, 60)

        const facteur = new Decimal(1).plus(tauxDecimal)
        const prixFinal = new Decimal(prixInitial).mul(
          facteur.pow(dureeInflation),
        )
        cleUnique = `inf-${prixInitial}-${tauxInflationNum}-${dureeInflation}`

        if (typeQuestion === 'valeurFinale') {
          texte = `Un bien coûtait $${prixInitial}$ CHF il y a $${dureeInflation}$ ans. `
          texte += `Avec un taux d'inflation moyen de $${texNombre(tauxInflation.valeurDecimale, 0)}\\,\\%$ par an, quel serait son prix équivalent aujourd'hui ? Arrondir au franc près.`

          const resultat = prixFinal.toDecimalPlaces(0)
          reponse = resultat.toFixed(0)
          unite = 'CHF'

          texteCorr = `L'inflation suit $P(t) = P_0 \\cdot (1 + r)^t$ où :<br>`
          texteCorr += `$\\bullet$ $P_0 = ${prixInitial}$ CHF (prix initial)<br>`
          texteCorr += `$\\bullet$ $r = ${texNombre(tauxInflation.valeurDecimale, 0)}\\,\\% = ${texNombre(tauxDecimal, 2)}$ (taux d'inflation)<br>`
          texteCorr += `$\\bullet$ $t = ${dureeInflation}$ ans (durée)<br><br>`
          texteCorr += `On obtient :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `P(${dureeInflation}) &= ${prixInitial} \\cdot (${texNombre(facteur, 4)})^{${dureeInflation}}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(resultat, 0))}\\text{ CHF}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `Le prix actuel serait d'environ $${`${miseEnEvidence(texNombre(resultat, 0))}\\text{ CHF}`}$.`
        } else if (typeQuestion === 'valeurInitiale') {
          const prixFinalArrondi = prixFinal.toDecimalPlaces(0).toNumber()
          texte = `Un bien coûte aujourd'hui $${texNombre(prixFinalArrondi, 0)}$ CHF. `
          texte += `Avec un taux d'inflation moyen de $${texNombre(tauxInflation.valeurDecimale, 0)}\\,\\%$ par an sur $${dureeInflation}$ ans, `
          texte += `quel était son prix équivalent il y a $${dureeInflation}$ ans ? Arrondir au franc près.`

          const P0Trouve = new Decimal(prixFinalArrondi).div(
            facteur.pow(dureeInflation),
          )
          reponse = P0Trouve.toDecimalPlaces(0).toFixed(0)
          unite = 'CHF'

          texteCorr = `L'inflation suit $P(t) = P_0 \\cdot (1 + r)^t$ où :<br>`
          texteCorr += `$\\bullet$ $P(t) = ${texNombre(prixFinalArrondi, 0)}$ CHF (prix actuel)<br>`
          texteCorr += `$\\bullet$ $r = ${texNombre(tauxInflation.valeurDecimale, 0)}\\,\\% = ${texNombre(tauxDecimal, 2)}$ (taux d'inflation)<br>`
          texteCorr += `$\\bullet$ $t = ${dureeInflation}$ ans (durée)<br>`
          texteCorr += `$\\bullet$ $P_0 = ?$ (prix initial recherché)<br><br>`
          texteCorr += `On isole $P_0$ :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `P_0 &= \\dfrac{P(t)}{(1 + r)^t}\\\\\n`
          texteCorr += `&= \\dfrac{${texNombre(prixFinalArrondi, 0)}}{(${texNombre(facteur, 4)})^{${dureeInflation}}}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(P0Trouve, 0))}\\text{ CHF}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `Le prix initial était d'environ $${`${miseEnEvidence(texNombre(P0Trouve, 0))}\\text{ CHF}`}$.`
        } else if (typeQuestion === 'pourcentage') {
          texte = `Avec un taux d'inflation de $${texNombre(tauxInflation.valeurDecimale, 0)}\\,\\%$ par an pendant $${dureeInflation}$ ans, `
          texte += `de quel pourcentage un prix aura-t-il augmenté ? Arrondir au dixième de pourcent près.`

          const augmentation = facteur.pow(dureeInflation).minus(1).mul(100)
          reponse = augmentation.toDecimalPlaces(1).toFixed(1)
          unite = '%'

          texteCorr = `Avec $P(t) = P_0 \\cdot (1 + r)^t$, l'augmentation en pourcentage est $((1 + r)^t - 1) \\times 100$ où :<br>`
          texteCorr += `$\\bullet$ $r = ${texNombre(tauxInflation.valeurDecimale, 0)}\\,\\% = ${texNombre(tauxDecimal, 2)}$ (taux d'inflation)<br>`
          texteCorr += `$\\bullet$ $t = ${dureeInflation}$ ans (durée)<br><br>`
          texteCorr += `On obtient :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `\\text{Augmentation} &= ((${texNombre(facteur, 4)})^{${dureeInflation}} - 1) \\times 100\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(augmentation, 1))}\\,\\%`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `Le prix aura augmenté d'environ $${`${miseEnEvidence(texNombre(augmentation, 1))}\\,\\%`}$.`
        } else {
          const prixFinalArrondi = prixFinal.toDecimalPlaces(0).toNumber()
          texte = `Un bien qui coûtait $${prixInitial}$ CHF coûte maintenant $${texNombre(prixFinalArrondi, 0)}$ CHF. `
          texte += `Si l'inflation a été de $${texNombre(tauxInflation.valeurDecimale, 0)}\\,\\%$ par an, combien d'années se sont écoulées ? Arrondir à l'année près.`

          const tempsTrouve = new Decimal(prixFinalArrondi)
            .div(prixInitial)
            .ln()
            .div(facteur.ln())
          reponse = tempsTrouve.toDecimalPlaces(0).toFixed(0)
          unite = 'ans'

          texteCorr = `L'inflation suit $P(t) = P_0 \\cdot (1 + r)^t$ où :<br>`
          texteCorr += `$\\bullet$ $P_0 = ${prixInitial}$ CHF (prix initial)<br>`
          texteCorr += `$\\bullet$ $P(t) = ${texNombre(prixFinalArrondi, 0)}$ CHF (prix actuel)<br>`
          texteCorr += `$\\bullet$ $r = ${texNombre(tauxInflation.valeurDecimale, 0)}\\,\\% = ${texNombre(tauxDecimal, 2)}$ (taux d'inflation)<br>`
          texteCorr += `$\\bullet$ $t = ?$ (durée recherchée)<br><br>`
          texteCorr += `On isole $t$ :<br>`
          texteCorr += `$\\begin{aligned}\n`
          texteCorr += `(1 + r)^t &= \\dfrac{P(t)}{P_0}\\\\\n`
          texteCorr += `t &= \\dfrac{\\ln\\left(\\dfrac{${texNombre(prixFinalArrondi, 0)}}{${prixInitial}}\\right)}{\\ln(${texNombre(facteur, 4)})}\\\\\n`
          texteCorr += `&\\approx ${`${miseEnEvidence(texNombre(tempsTrouve, 0))}\\text{ ans}`}\n`
          texteCorr += `\\end{aligned}$<br><br>`
          texteCorr += `Il s'est écoulé environ $${`${miseEnEvidence(texNombre(tempsTrouve, 0))}\\text{ ans}`}$.`
        }
      }

      // Champ interactif
      if (this.interactif) {
        texte += ajouteChampTexteMathLive(this, i, KeyboardType.clavierDeBase, {
          texteAvant: '<br>',
          texteApres: ` ${unite}`,
        })
        handleAnswers(this, i, {
          reponse: {
            value: reponse,
            options: { nombreDecimalSeulement: true },
          },
        })
      }

      if (this.questionJamaisPosee(i, cleUnique, typeQuestion)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
