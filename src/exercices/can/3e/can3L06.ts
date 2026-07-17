import { choice } from '../../../lib/outils/arrayOutils'
import { rienSi1 } from '../../../lib/outils/ecritures'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'

import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { lettreDepuisChiffre } from '../../../lib/outils/outilString'
import { fraction } from '../../../modules/fractions'
export const titre = 'Réduire une expression avec une fraction'
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDePublication = '08/12/2022'
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora
 */

export const uuid = '3cf30'

export const refs = {
  'fr-fr': ['can3L06'],
  'fr-ch': [],
}
export default class ReduireAvecFraction extends ExerciceSimple {
  constructor() {
    super()
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecVariable
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.besoinFormulaireCaseACocher = [
      'Présentation des corrections en colonnes',
      false,
    ]
    this.versionQcmDisponible = true
  }

  nouvelleVersion() {
    const couplend = this.quotaChoice('couplend', [
      [1, 2],
      [3, 2],
      [5, 2],
      [7, 2],
      [1, 3],
      [2, 3],
      [4, 3],
      [5, 3],
      [3, 4],
      [2, 5],
      [3, 5],
      [4, 5],
      [5, 6],
      [2, 7],
      [3, 7],
      [4, 7],
      [5, 7],
      [6, 7],
      [3, 8],
      [5, 8],
      [7, 8],
      [2, 9],
      [4, 9],
      [5, 9],
      [7, 9],
      [8, 9],
      [3, 10],
      [7, 10],
      [9, 10],
    ]) // n et m sont premiers entre eux
    const n = couplend[0]
    const d = couplend[1]
    const a = this.quotaRandint('a', 1, 9)
    const frac = fraction(n, d).texFraction
    const frac2 = fraction(a * d, d).texFraction
    const decompo = `\\dfrac{${a}\\times${d}}{${d}}`
    const frac10 = `\\dfrac{x}{${d}}`
    const enonceIntro = `Réduire l'expression :`
    this.correction = ''
    const lettre = lettreDepuisChiffre(randint(1, 26, [15, 17, 24]))
    if (this.sup) this.spacingCorr = 3
    switch (
      this.versionQcm
        ? this.quotaChoice('cas', [2, 4])
        : this.quotaChoice('cas', [1, 2, 3, 4])
    ) {
      case 1:
        {
          const frac3 = fraction(n + a * d, d).texFraction
          if (choice([true, false])) {
            this.question = this.versionQcm
              ? `Une simplification de $${frac}x+${rienSi1(a)}x$ est :`
              : `${enonceIntro} $${frac}x+${rienSi1(a)}x$`
            this.correction = `$${frac}x+${rienSi1(a)}x=${frac}x+${decompo}x=${frac}x+${frac2}x=\\dfrac{${n}+${a * d}}{${d}}x=${frac3}x$`
          } else {
            this.question = this.versionQcm
              ? `Une simplification de $${rienSi1(a)}x+${frac}x$ est :`
              : `${enonceIntro} $${rienSi1(a)}x+${frac}x$`
            this.correction = `$${rienSi1(a)}x+${frac}x=${decompo}x+${frac}x=${frac2}x+${frac}x=\\dfrac{${a * d}+${n}}{${d}}x=${frac3}x$`
          }
          this.reponse = [
            frac3 + 'x',
            `\\frac{${n + a * d}x}{${d}}`,
            (n + a * d) / d + 'x',
          ]
        }
        break
      case 2:
        if (choice([true, false])) {
          const frac4 = fraction(n - a * d, d).texFraction
          this.question = this.versionQcm
            ? `Une simplification de $${frac}x-${rienSi1(a)}x$ est :`
            : `${enonceIntro} $${frac}x-${rienSi1(a)}x$`
          this.correction = `$${frac}x-${rienSi1(a)}x=${frac}x-${decompo}x=${frac}x-${frac2}x=\\dfrac{${n}-${a * d}}{${d}}x=${frac4}x$`
          this.reponse = [
            `${n - a * d < 0 ? '-' : ''}\\frac{${Math.abs(n - a * d)}}{${d}}x`,
            `\\frac{${n - a * d}}{${d}}x`,
            `${n - a * d < 0 ? '-' : ''}\\frac{${Math.abs(n - a * d)}x}{${d}}`,
            `\\frac{${n - a * d}x}{${d}}`,
            (n - a * d) / d + 'x',
          ]
        } else {
          const frac5 = fraction(a * d - n, d).texFraction
          this.question = this.versionQcm
            ? `Une simplification de $${rienSi1(a)}x-${frac}x$ est :`
            : `${enonceIntro} $${rienSi1(a)}x-${frac}x$`
          this.correction = `$${rienSi1(a)}x-${frac}x=${decompo}x-${frac}x=${frac2}x-${frac}x=\\dfrac{${a * d}-${n}}{${d}}x=${frac5}x$`
          this.reponse = [
            `${n - a * d < 0 ? '' : '-'}\\frac{${Math.abs(n - a * d)}}{${d}}x`,
            `\\frac{${a * d - n}}{${d}}x`,
            `${n - a * d < 0 ? '' : '-'}\\frac{${Math.abs(n - a * d)}x}{${d}}`,
            `\\frac{${a * d - n}x}{${d}}`,
            (a * d - n) / d + 'x',
          ]
        }
        break
      case 3:
        {
          const frac6 = `\\dfrac{${1 + a * d}}{${d}}`
          const frac7 = `\\dfrac{${1 + a * d}x}{${d}}`
          if (choice([true, false])) {
            this.question = this.versionQcm
              ? `Une simplification de $${frac10}+${rienSi1(a)}x$ est :`
              : `${enonceIntro} $${frac10}+${rienSi1(a)}x$`
            this.correction = `$${frac10}+${rienSi1(a)}x=${frac10}+\\dfrac{${rienSi1(a)}x\\times ${d}}{${d}}=${frac10}+\\dfrac{${a * d}x}{${d}}=\\dfrac{x+${a * d}x}{${d}}=${frac7}=${frac6}x$`
          } else {
            this.question = this.versionQcm
              ? `Une simplification de $${rienSi1(a)}x+${frac10}$ est :`
              : `${enonceIntro} $${rienSi1(a)}x+${frac10}$`
            this.correction = ` $${rienSi1(a)}x+${frac10}=\\dfrac{${rienSi1(a)}x\\times ${d}}{${d}}+${frac10}=\\dfrac{${a * d}x}{${d}}+${frac10}=\\dfrac{${a * d}x+x}{${d}}=${frac7}=${frac6}x$`
          }
          this.reponse = [frac6 + 'x', frac7, (1 + a * d) / d + 'x']
        }
        break

      case 4:
        {
          const frac8 = `\\dfrac{${a * d}x}{${d}}`
          if (choice([true, false])) {
            this.question = this.versionQcm
              ? `Une simplification de $${frac10}-${rienSi1(a)}x$ est :`
              : `${enonceIntro} $${frac10}-${rienSi1(a)}x$`
            this.correction = `$${frac10}-${rienSi1(a)}x=${frac10}-\\dfrac{${rienSi1(a)}x\\times ${d}}{${d}}=${frac10}-${frac8}=\\dfrac{x-${a * d}x}{${d}}=\\dfrac{${1 - a * d}x}{${d}}=\\dfrac{${1 - a * d}}{${d}}x$`
            this.reponse = [
              `${1 - a * d < 0 ? '-' : ''}\\frac{${Math.abs(1 - a * d)}}{${d}}x`,
              `\\frac{${1 - a * d}}{${d}}x`,
              `${1 - a * d < 0 ? '-' : ''}\\frac{${Math.abs(1 - a * d)}x}{${d}}`,
              `\\frac{${1 - a * d}x}{${d}}`,
              (1 - a * d) / d + 'x',
            ]
          } else {
            this.question = this.versionQcm
              ? `Une simplification de $${rienSi1(a)}x-${frac10}$ est :`
              : `${enonceIntro} $${rienSi1(a)}x-${frac10}$`
            this.correction = ` $${rienSi1(a)}x-${frac10}=\\dfrac{${rienSi1(a)}x\\times ${d}}{${d}}-${frac10}=${frac8}-${frac10}=\\dfrac{${a * d}x-x}{${d}}=\\dfrac{${a * d - 1}x}{${d}}=\\dfrac{${a * d - 1}}{${d}}x$`
            this.reponse = [
              `${1 - a * d < 0 ? '' : '-'}\\frac{${Math.abs(1 - a * d)}}{${d}}x`,
              `\\frac{${a * d - 1}}{${d}}x`,
              `${1 - a * d < 0 ? '' : '-'}\\frac{${Math.abs(1 - a * d)}x}{${d}}`,
              `\\frac{${a * d - 1}x}{${d}}`,
              (a * d - 1) / d + 'x',
            ]
          }
        }
        break
    }

    this.optionsChampTexte = { texteAvant: '<br>' }

    if (this.sup) {
      // On découpe
      const etapes = this.correction.split('=')
      this.correction = ''
      let nbEtapes = 0
      for (const etape of etapes) {
        nbEtapes++
        const etapeModifiee = etape.replace('$', '')
        this.correction +=
          etapeModifiee === lettre ? '' : `$${lettre} = ${etapeModifiee}$`
        if (nbEtapes < etapes.length) this.correction += '<br>'
      }
    }

    // Uniformisation : Mise en place de la réponse attendue en interactif en orange et gras
    const textCorrSplit = this.correction.split('=')
    let aRemplacer = textCorrSplit[textCorrSplit.length - 1]
    aRemplacer = aRemplacer.replace('$', '')

    this.correction = ''
    for (let ee = 0; ee < textCorrSplit.length - 1; ee++) {
      this.correction += textCorrSplit[ee] + '='
    }
    this.correction += `$ $${miseEnEvidence(aRemplacer)}$`
    // Fin de cette uniformisation

    if (this.versionQcm) {
      // Génération des distracteurs basés sur des erreurs typiques d'élèves
      const distracteursSet = new Set<string>()
      // Erreur de signe sur le numérateur
      distracteursSet.add(`$\\dfrac{${Math.abs(n - a * d)}}{${d}}x$`)
      distracteursSet.add(`$-\\dfrac{${Math.abs(n - a * d)}}{${d}}x$`)
      distracteursSet.add(`$\\dfrac{${n + a * d}}{${d}}x$`)
      distracteursSet.add(`$-\\dfrac{${n + a * d}}{${d}}x$`)
      distracteursSet.add(`$\\dfrac{${Math.abs(a * d - 1)}}{${d}}x$`)
      distracteursSet.add(`$-\\dfrac{${Math.abs(a * d - 1)}}{${d}}x$`)
      distracteursSet.add(`$\\dfrac{${1 + a * d}}{${d}}x$`)
      // Erreur : oubli de mise au même dénominateur (n+a au lieu de n+a*d)
      distracteursSet.add(`$\\dfrac{${n + a}}{${d}}x$`)
      distracteursSet.add(`$\\dfrac{${Math.abs(n - a)}}{${d}}x$`)
      distracteursSet.add(`$-\\dfrac{${Math.abs(n - a)}}{${d}}x$`)

      // Formatage de la bonne réponse en mode QCM
      const bonneReponse = String(
        Array.isArray(this.reponse) ? this.reponse[0] : this.reponse,
      )
      const reponseQcm = `$${bonneReponse.replace(/\\frac/g, '\\dfrac')}$`

      // On enlève la bonne réponse des distracteurs
      const normalise = (s: string) =>
        s.replace(/\\dfrac/g, '\\frac').replace(/\s/g, '')
      const reponseNormalisee = normalise(reponseQcm)
      const distracteursFiltres = [...distracteursSet].filter(
        (d) => normalise(d) !== reponseNormalisee,
      )

      // Bonne réponse en premier, puis 3 distracteurs
      this.reponse = reponseQcm
      this.distracteurs = distracteursFiltres.slice(0, 3)
    }
  }
}
