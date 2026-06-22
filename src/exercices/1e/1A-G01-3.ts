import { droiteGraduee } from '../../lib/2d/DroiteGraduee'
import { orangeMathalea } from '../../lib/colors'
import { choice, shuffle } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { pgcd } from '../../lib/outils/primalite'
import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const titre =
  "Lire l'abscisse fractionnaire d'un point sur une droite graduée"
export const dateDePublication = '21/06/2026'

export const uuid = 'b8e31'

export const refs = {
  'fr-fr': ['1A-G01-3'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

type Fraction = [numerateur: number, denominateur: number]

/**
 * Lire une abscisse sur une droite dont l'unité est partagée en tiers,
 * en quarts ou en cinquièmes.
 * @author Stéphane Guyon
 */
export default class LireAbscisseFractionnaireQcm extends ExerciceQcmA {
  private fractionIrreductible([numerateur, denominateur]: Fraction): Fraction {
    const diviseur = pgcd(Math.abs(numerateur), Math.abs(denominateur))
    const signe = denominateur < 0 ? -1 : 1
    return [(signe * numerateur) / diviseur, Math.abs(denominateur) / diviseur]
  }

  private fractionTex(fraction: Fraction) {
    const [numerateur, denominateur] = this.fractionIrreductible(fraction)
    return denominateur === 1
      ? `${numerateur}`
      : `\\dfrac{${numerateur}}{${denominateur}}`
  }

  private construireFigure(numerateur: number, denominateur: number) {
    const abscisseNegative = numerateur < 0
    const droite = droiteGraduee({
      Unite: 4,
      Min: abscisseNegative ? -3.2 : 0,
      Max: abscisseNegative ? 0.2 : 3.2,
      x: 0,
      y: 0,
      thickDistance: 1,
      thickSecDist: 1 / denominateur,
      thickSec: true,
      thickOffset: 0,
      axeStyle: '->',
      pointListe: [[numerateur / denominateur, 'A']],
      pointCouleur: orangeMathalea,
      pointStyle: 'x',
      pointTaille: 5,
      labelsPrincipaux: true,
      step1: 1,
      step2: 1,
    })
    return mathalea2d(
      {
        xmin: -1,
        ymin: -1.5,
        xmax: 14,
        ymax: 1.5,
        scale: 0.75,
        style: 'margin: auto',
      },
      droite,
    )
  }

  versionAleatoire = () => {
    const denominateur = choice([3, 4, 5])
    let valeurAbsolueNumerateur: number
    do {
      valeurAbsolueNumerateur = randint(1, 3 * denominateur - 1)
    } while (valeurAbsolueNumerateur % denominateur === 0)
    const numerateur =
      randint(0, 1) === 0 ? valeurAbsolueNumerateur : -valeurAbsolueNumerateur

    const bonneReponse: Fraction = [numerateur, denominateur]
    const reste = numerateur % denominateur
    const candidats = shuffle<Fraction>([
      [numerateur, denominateur + 1],
      [numerateur, denominateur - 1],
      [denominateur, numerateur],
      [reste, denominateur],
      [-numerateur, denominateur],
      [numerateur + denominateur, denominateur],
      [numerateur - denominateur, denominateur],
    ])
    const bonneReponseReduite = this.fractionIrreductible(bonneReponse)
    const valeursDejaUtilisees = new Set([bonneReponseReduite.join('/')])
    const distracteurs = candidats.filter((fraction) => {
      const fractionReduite = this.fractionIrreductible(fraction)
      const cle = fractionReduite.join('/')
      if (valeursDejaUtilisees.has(cle)) return false
      valeursDejaUtilisees.add(cle)
      return true
    })

    this.reponses = [bonneReponse, ...distracteurs.slice(0, 3)].map(
      (fraction) => `$${this.fractionTex(fraction)}$`,
    )

    const figure = this.construireFigure(numerateur, denominateur)
    const valeurTex = this.fractionTex(bonneReponse)
    const fractionEstIrreductible =
      pgcd(Math.abs(numerateur), denominateur) === 1
    const conclusion = fractionEstIrreductible
      ? miseEnEvidence(valeurTex)
      : `\\dfrac{${numerateur}}{${denominateur}}=${miseEnEvidence(valeurTex)}`
    this.enonce = `Quelle est l'abscisse du point $A$ sur la droite graduée ci-dessous ?${figure}`
    this.correction = `Chaque unité est partagée en $${denominateur}$ parts égales : une petite graduation représente donc $\\dfrac{1}{${denominateur}}$.<br>
Le point $A$ se trouve à la ${valeurAbsolueNumerateur === 1 ? 'première' : `${valeurAbsolueNumerateur}e`} petite graduation ${numerateur < 0 ? 'avant' : 'après'} $0$. Son abscisse est donc $${conclusion}$.`
  }

  constructor() {
    super()
    this.options = { vertical: false, ordered: false }
    this.nbQuestions = 1
    this.besoinFormulaireCaseACocher = false
    this.besoinFormulaire4CaseACocher = false
    this.versionAleatoire()
  }
}
