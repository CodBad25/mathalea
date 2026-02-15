import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'

import { randint } from '../../modules/outils'
// import ExerciceQcmA from '../../ExerciceQcmA'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'c091a'
export const refs = {
  'fr-fr': ['1A-C03-15'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = "Calculer le double ou le triple d'un nombre écrit avec une puissance"
export const dateDePublication = '14/02/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class Auto1AC3j extends ExerciceQcmA {
  private appliquerLesValeurs(a: number, n: number, choix: string): void {
    this.enonce = `Le ${choix} de  $${texNombre(a*a, 0)}^{${n}}$ est égal à :`

    this.correction = `On a $${a*a}=${a}^{2}$ donc :<br>
    $\\begin{aligned}
    \\text{${choix==='double' ? `Le double de ` : `Le triple de `} } ${texNombre(a*a, 0)}^{${n}} & = 2 \\times ${texNombre(a*a, 0)}^{${n}} \\\\
    & = 2\\times ${choix==='double' ? ` \\left(2^{2}\\right)^{${n}}` : `\\left(3^{2}\\right)^{${n}}`} \\\\
    &=2\\times ${choix==='double' ? ` 2^{${2*n}}` : `3^{${2*n}}`} \\\\
    &=${choix==='double' ? `${miseEnEvidence(`2^{${2*n+1}}`)}` : `${miseEnEvidence(`3^{${2*n+1}}`)}`} \\\\
    \\end{aligned}$
    `

    this.reponses = [
      `${choix==='double' ? `$2^{${2*n + 1}}$` : `$3^{${2*n + 1}}$`}`,
      `${choix==='double' ? `$${2*a*a}^{${n}}$` : `$${3*a*a}^{${n}}$`}`,
       `${choix==='double' ? `$2^{${n + 1}}$` : `$3^{${n + 1}}$`}`,
         `${choix==='double' ? `$${a*a}^{${2*n}}$` : `$${a*a}^{${3*n}}$`}`,
         
    ]
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(2, 50, 'double')
  }

  versionAleatoire: () => void = () => {
    
    const n = randint(2,5)*10
    const choix = choice(['double', 'triple'])
    const a = choix === 'double' ? 2 : 3
    this.appliquerLesValeurs(a, n, choix)
  }

  constructor() {
    super()
    // this.options = { vertical: true, ordered: false }
    this.versionAleatoire()
  }
}
