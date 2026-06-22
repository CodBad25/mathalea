import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice, shuffle } from '../../lib/outils/arrayOutils'
import { reduireAxPlusB } from '../../lib/outils/ecritures'
import { abs } from '../../lib/outils/nombres'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '6e534'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Retrouver l\'expression d\'une fonction affine '
export const dateDePublication = '02/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoQ2AGns2026 extends ExerciceQcmA {
  private appliquerLesValeurs(
    f: string,
    dist1: string,
    dist2: string,
    dist3: string,
    explicationCorrecte: string
  ): void {
    this.enonce = `Laquelle de ces fonctions est représentée graphiquement par une droite ?`

    // On mélange les noms des fonctions pour que la bonne réponse ne soit pas toujours f(x)
    const noms = shuffle(['f', 'g', 'h', 'u', 'v'])
    const nomCorrect = noms[0]

    this.reponses = [
      `$${nomCorrect}(x) = ${f}$`,
      `$${noms[1]}(x) = ${dist1}$`,
      `$${noms[2]}(x) = ${dist2}$`,
      `$${noms[3]}(x) = ${dist3}$`
    ]

    this.correction = `Une fonction affine $f$ est une fonction définie sur $\\mathbb{R}$ par une expression de la forme $f(x)=ax+b$ avec $a$ et $b$ des réels.<br><br>`
    this.correction += `Parmi les propositions, seule l'expression de la fonction $${nomCorrect}$ peut se ramener à cette forme :<br>`
    this.correction += explicationCorrecte
  }

  versionOriginale: () => void = () => {
    // Reproduction de la question de l'image (légèrement adaptée pour s'intégrer au moteur QCM)
    const explication = `$f(x) = \\dfrac{5}{2}x - 5$ correspond bien à la forme $ax+b$ avec $a = \\dfrac{5}{2}$ et $b = -5$.`
    this.appliquerLesValeurs(
      '\\dfrac{5}{2}x - 5',
      'x^3',
      '-\\dfrac{1}{x} + 3',
      '2x^2 + 3x + 1',
      explication
    )
    // On force les noms originaux de l'image pour la version figée
    this.reponses = [
      `$f(x) = \\dfrac{5}{2}x - 5$`,
      `$g(x) = x^3$`,
      `$h(x) = -\\dfrac{1}{x} + 3$`,
      `$i(x) = 2x^2 + 3x + 1$`
    ]
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    let compteur = 0
    do {
      // --- GÉNÉRATION DE LA BONNE RÉPONSE ---
      const typeCorrect = choice([1, 2, 3, 4])
      let f = ''
      let explication = ''
      
      const a = randint(-9, 9, 0)
      const b = randint(-9, 9, 0)
      const c = randint(2, 9,[a,b]) 

      switch (typeCorrect) {
        case 1: // (ax+b)/c
          f = `\\dfrac{${reduireAxPlusB(a, b)}}{${c}}`
          explication = `$${f} = \\dfrac{${a}}{${c}}x ${b > 0 ? '+' : '-'} \\dfrac{${abs(b)}}{${c}}$, ce qui est bien une expression affine.`
          break
        case 2: // a/c x + b
          f = `\\dfrac{${a}}{${c}}x ${b > 0 ? '+' : '-'} ${Math.abs(b)}`
          explication = `$${f}$ est directement de la forme $ax+b$.`
          break
        case 3: // a(bx+c)
          f = `${a}\\left(${reduireAxPlusB(b, c)}\\right)`
          explication = `En développant, on obtient $${a}\\left(${reduireAxPlusB(b, c)}\\right) = ${reduireAxPlusB(a * b, a * c)}$, ce qui est bien une expression affine.`
          break
        case 4: // ax (fonction linéaire)
          f = `${reduireAxPlusB(a, 0)}`
          explication = `$${f}$ est une fonction linéaire (un cas particulier de fonction affine avec $b=0$).`
          break
      }

      // --- GÉNÉRATION DES 3 DISTRACTEURS ---
      const typesDist = shuffle([1, 2, 3, 4, 5]).slice(0, 3)
      const distracteurs: string[] = []

      for (const t of typesDist) {
        const aD = randint(-9, 9, [0])
        const bD = randint(-9, 9, [0])
        const cD = randint(-9, 9, [0])
        let exp = ''
        
        switch (t) {
          case 1: // ax^2+b
            exp = `${aD === 1 ? 'x^2' : aD === -1 ? '-x^2' : aD + 'x^2'} ${bD > 0 ? '+' : '-'} ${Math.abs(bD)}`
            break
          case 2: // a/x+b
            exp = `\\dfrac{${aD}}{x} ${bD > 0 ? '+' : '-'} ${Math.abs(bD)}`
            break
          case 3: // cx^3
            exp = cD === 1 ? 'x^3' : cD === -1 ? '-x^3' : `${cD}x^3`
            break
          case 4: // (ax+b)/x
            exp = `\\dfrac{${reduireAxPlusB(aD, bD)}}{x}`
            break
          case 5: // ax^2+bx+c
          default:
            {
            const term1 = aD === 1 ? 'x^2' : aD === -1 ? '-x^2' : `${aD}x^2`
            const term2 = bD === 1 ? '+ x' : bD === -1 ? '- x' : bD > 0 ? `+ ${bD}x` : `- ${Math.abs(bD)}x`
            const term3 = cD > 0 ? `+ ${cD}` : `- ${Math.abs(cD)}`
            exp = `${term1} ${term2} ${term3}`
            }
            break
        }
        distracteurs.push(exp)
      }

      this.appliquerLesValeurs(f, distracteurs[0], distracteurs[1], distracteurs[2], explication)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}