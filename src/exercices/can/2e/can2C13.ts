import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { ecritureParentheseSiNegatif } from '../../../lib/outils/ecritures'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { context } from '../../../modules/context'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Calculer avec  des puissances'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDePublication = '15/09/2022' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag
export const dateDeModifImportante = '07/07/2025'
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gille Mora
 *
 */

export const uuid = 'b31eb'

export const refs = {
  'fr-fr': ['can2C13'],
  'fr-ch': [],
}
export default class CalculPuissancesOperation extends ExerciceSimple {
  constructor() {
    super()
    this.versionQcmDisponible = true
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte =
      KeyboardType.clavierDeBaseAvecFractionPuissanceCrochets
  }

  nouvelleVersion() {
    if (!this.versionQcm) {
      this.question = `Écrire sous la forme $a^n$ où $a$ et $n$  sont ${context.isDiaporama ? '<br>' : ''} des  entiers relatifs. <br>`
    } else {
      this.question = ''
    }
    let a, b, n, p, s
    switch (
      choice(['a', 'b', 'c', 'd', 'e']) //
    ) {
      case 'a':
        a = randint(-9, 9, [0, 1, -1])
        n = randint(-9, 9, [0, 1, -1])
        p = randint(-9, 9, [0, 1, -1])
        s = n + p
        this.question += `$${ecritureParentheseSiNegatif(a)}^{${n}}\\times ${ecritureParentheseSiNegatif(a)}^{${p}}$`
        this.correction = `On utilise la formule $a^n\\times a^m=a^{n+m}$ avec $a=${a}$, $n=${n}$ et $p=${p}$.<br>
        $${ecritureParentheseSiNegatif(a)}^{${n}}\\times ${ecritureParentheseSiNegatif(a)}^{${p}}=${ecritureParentheseSiNegatif(a)}^{${n}+${ecritureParentheseSiNegatif(p)}}=${miseEnEvidence(`${ecritureParentheseSiNegatif(a)}^{${n + p}}`)}$`
        this.distracteurs = [
          `$${ecritureParentheseSiNegatif(a)}^{${n - p}}$`,
          `$${ecritureParentheseSiNegatif(a)}^{${n * p}}$`,
          `$${ecritureParentheseSiNegatif(a * a)}^{${n + p}}$`,
        ]
        this.reponse = `$${ecritureParentheseSiNegatif(a)}^{${n + p}}$`

        break
      case 'b':
        a = randint(-9, 9, [0, 1, -1])
        b = randint(-9, 9, [0, 1, -1])
        n = randint(-9, 9, [0, 1, -1])
        p = a * b
        this.question += `$${ecritureParentheseSiNegatif(a)}^{${n}}\\times ${ecritureParentheseSiNegatif(b)}^{${n}}$`
        this.distracteurs = [
          `$${ecritureParentheseSiNegatif(p)}^{${n + n}}$`,
          `$${ecritureParentheseSiNegatif(p)}^{${n * n}}$`,
          `$${ecritureParentheseSiNegatif(a * a * -1)}^{${n}}$`,
        ]
        this.correction = `On utilise la formule $a^n\\times b^n=(a\\times b)^{n}$
        avec $a=${a}$,  $b=${b}$ et $n=${n}$.<br>
        $${ecritureParentheseSiNegatif(a)}^{${n}}\\times ${ecritureParentheseSiNegatif(b)}^{${n}}=(${ecritureParentheseSiNegatif(a)}\\times ${ecritureParentheseSiNegatif(b)})^{${n}}=${miseEnEvidence(`${ecritureParentheseSiNegatif(p)}^{${n}}`)}$ `
        this.reponse = `$${ecritureParentheseSiNegatif(p)}^{${n}}$`
        break

      case 'c':
        a = randint(-9, 9, [0, 1, -1])
        p = randint(-9, 9, [0, 1])
        n = randint(-9, 9, [0, 1, -1])
        s = n * p
        this.question += ` $\\left(${ecritureParentheseSiNegatif(a)}^{${n}}\\right)^{${p}}$`
        this.distracteurs = [
          `$${ecritureParentheseSiNegatif(a)}^{${n + p}}$`,
          `$${ecritureParentheseSiNegatif(a * n)}^{${p}}$`,
          `$${ecritureParentheseSiNegatif(a * p)}^{${n}}$`,
        ]
        this.correction = `On utilise la formule $\\left(a^n\\right)^p=a^{n\\times p}$
        avec $a=${a}$,  $n=${n}$ et $p=${p}$.<br>
        $\\left(${ecritureParentheseSiNegatif(a)}^{${n}}\\right)^{${p}}=${ecritureParentheseSiNegatif(a)}^{${n}\\times ${ecritureParentheseSiNegatif(p)}}=${miseEnEvidence(`${ecritureParentheseSiNegatif(a)}^{${n * p}}`)}$ `
        this.reponse = `$${ecritureParentheseSiNegatif(a)}^{${s}}$`
        break

      case 'd':
        a = randint(-9, 9, [0, 1, -1])
        p = randint(-9, 9, [0, 1])
        n = randint(-9, 9, [0, 1, -1, p])
        s = n - p
        this.question += `$\\dfrac{${ecritureParentheseSiNegatif(a)}^{${n}}}{${ecritureParentheseSiNegatif(a)}^{${p}}}$`
        this.correction = `On utilise la formule $\\dfrac{a^n}{a^p}=a^{n-p}$ avec $a=${a}$,  $n=${n}$ et $p=${p}$.<br>
        $\\dfrac{${ecritureParentheseSiNegatif(a)}^{${n}}}{${ecritureParentheseSiNegatif(a)}^{${p}}}=${ecritureParentheseSiNegatif(a)}^{${n}- ${ecritureParentheseSiNegatif(p)}}=${miseEnEvidence(`${ecritureParentheseSiNegatif(a)}^{${n - p}}`)}$`
        this.distracteurs = [
          `$${ecritureParentheseSiNegatif(a)}^{${n + p}}$`,
          `$${ecritureParentheseSiNegatif(a)}^{${-s}}$`,
          `$${ecritureParentheseSiNegatif(a)}^{${n * p}}$`,
        ]
        this.reponse = `$${ecritureParentheseSiNegatif(a)}^{${s}}$`
        break
      case 'e':
        b = randint(2, 6, [0, 1, -1])
        a = choice([2, 3, 4, 5, 6, 7]) * b
        n = randint(-9, 9, [0, 1, -1])
        s = a / b
        this.question += ` $\\dfrac{${ecritureParentheseSiNegatif(a)}^{${n}}}{${ecritureParentheseSiNegatif(b)}^{${n}}}$`
        this.correction = `On utilise la formule $\\dfrac{a^n}{b^n}=\\left(\\dfrac{a}{b}\\right)^{n}$ avec
        $a=${a}$,  $b=${b}$ et $n=${n}$.<br>
        $\\dfrac{${ecritureParentheseSiNegatif(a)}^{${n}}}{${ecritureParentheseSiNegatif(b)}^{${n}}}=\\left(\\dfrac{${ecritureParentheseSiNegatif(a)}}{${ecritureParentheseSiNegatif(b)}}\\right)^{${n}}=${miseEnEvidence(`${s}^{${n}}`)}$
        `
        this.distracteurs = [
          `$${ecritureParentheseSiNegatif(s)}^{${n - 2}}$`,
          `$${ecritureParentheseSiNegatif(a)}^{0}$`,
          `$${ecritureParentheseSiNegatif(s)}^{0}$`,
        ]
        this.reponse = `$${s}^{${n}}$`
        break
    }
    if (this.interactif || this.versionQcm) {
      this.question += '$=$'
    }
  }
}
