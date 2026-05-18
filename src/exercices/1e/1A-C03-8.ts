import { miseEnEvidence } from '../../lib/outils/embellissements'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'
export const dateDePublication = '10/08/2025'
export const uuid = '7fe71'
// @Author Stéphane Guyon
export const refs = {
  'fr-fr': ['1A-C03-8'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Calculer avec des puissances de $-1$'
export default class Auto1AC3h extends ExerciceQcmA {
  private appliquerLesValeurs(k: number): void {
    this.enonce = `Soit $n$ un entier non nul.<br> À quelle expression est égale $\\left(-1\\right)^{n+${k}}$ ?`

    if (k % 2 === 0) {
      // k est pair
      this.correction = `$\\begin{aligned} \\left(-1\\right)^{n+${k}}&=\\left(-1\\right)^{${k}} \\times \\left(-1\\right)^{n} \\\\  
      &=1\\times \\left(-1\\right)^{n} \\\\    
      &=${miseEnEvidence('\\left(-1\\right)^{n}')}      
      \\end{aligned}$<br>`

      this.reponses = [
        '$\\left(-1\\right)^{n} $',
        '$\\left(-1\\right)^{n+1}$ ',
        '$-\\left(-1\\right)^{n} $',
        '$\\left(-1\\right)^{n-1}$ ',
      ]
    } else {
      // k est impair
      this.correction = `$\\begin{aligned} \\left(-1\\right)^{n+${k}}&=\\left(-1\\right)^{${k - 1}}\\times \\left(-1\\right)^{n+1} \\\\    
      &=1\\times \\left(-1\\right)^{n+1} \\\\    
      &=${miseEnEvidence('\\left(-1\\right)^{n+1}')}   
      \\end{aligned}$<br>`

      this.reponses = [
        '$\\left(-1\\right)^{n+1} $',
        '$\\left(-1\\right)^{n+2} $',
        '$-\\left(-1\\right)^{n+1} $',
        '$\\left(-1\\right)^{n}$ ',
      ]
    }
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(2)
  }

  versionAleatoire = () => {
    const k = randint(3, 10)
    this.appliquerLesValeurs(k)
  }

  constructor() {
    super()
    this.nbQuestions = 4
    this.nbQuestionsModifiable = true
    const originalQJP = this.questionJamaisPosee.bind(this)
    this.questionJamaisPosee = (i, ...args) => originalQJP(i, this.enonce, ...args)
    this.versionAleatoire()
  }
}
