
import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'
import FractionEtendue from '../../modules/FractionEtendue'

export const uuid = 'ae51e'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Effectuer un calcul avec des fractions '
export const dateDePublication = '02/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoQ1CEns2026 extends ExerciceQcmA {
  private appliquerLesValeurs(a: number, b: number, c: number): void {
    const unSurC = new FractionEtendue(1, c) // 1/c
    const produit = new FractionEtendue(b, c) // b × 1/c = b/c

    // Numérateur du résultat (dénominateur c) : a × c - b
    const num = a * c - b
    const resultat = new FractionEtendue(num, c) // (ac - b)/c, toujours irréductible (b = c±1)

    // Distracteurs (chacun cible une erreur précise)
    const dist1 = new FractionEtendue(a - b, c).texFractionSimplifiee // (a-b)/c : oubli de la priorité
    const dist2 = new FractionEtendue(a, c).texFractionSimplifiee // a/c : on multiplie le mauvais facteur
    const dist3 = new FractionEtendue(a * c - 1, c).texFractionSimplifiee // (ac-1)/c : b oublié dans b×1/c

    this.enonce = `On considère $A=${a}-${b}\\times ${unSurC.texFraction}$. On a :`

    this.correction = `On applique la priorité de la multiplication sur la soustraction : on effectue d'abord la multiplication $${b}\\times ${unSurC.texFraction}=${produit.texFraction}$.<br>
$\\begin{aligned}
A&=${a}-${b}\\times ${unSurC.texFraction}\\\\
&=${a}-${produit.texFraction}\\\\
&=\\dfrac{${a}\\times ${c}}{${c}}-${produit.texFraction}\\\\
&=\\dfrac{${a * c}-${b}}{${c}}\\\\
&=${miseEnEvidence(`${resultat.texFractionSimplifiee}`)}
\\end{aligned}$`

    this.reponses = [
      `$A=${resultat.texFractionSimplifiee}$`,
      `$A=${dist1}$`,
      `$A=${dist2}$`,
      `$A=${dist3}$`,
    ]
  }

  versionOriginale: () => void = () => {
    // 4 - 2 × 1/3
    this.appliquerLesValeurs(4, 2, 3)
  }

  versionAleatoire = () => {
    // Pont avec le mécanisme Can : si le méta a coché « sujet officiel »,
    // on produit la version originale figée au lieu d'un tirage aléatoire.
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }
    let compteur = 0
    do {
      const a = randint(2, 7)
      const c = randint(3, 7)
      const b = choice([c - 1, c + 1]) // b = c-1 ou c+1
      this.appliquerLesValeurs(a, b, c)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
