import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '471c3'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Exprimer en fonction de '
export const dateDePublication = '02/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoQ10CEns2026 extends ExerciceQcmA {
   // Isoler une grandeur dans F = G × (m_1 × m_2) / R². 4 cas : m_1, m_2, G, R.
  private appliquerLesValeurs(cas: string): void {
    const formule = 'F=G\\times\\dfrac{m_1\\times m_2}{R^2}'
    this.enonce = `Soit la formule $${formule}$. On a :`

    switch (cas) {
      case 'm_1':
        this.correction = `On multiplie les deux membres par $R^2$, puis on divise par $G\\times m_2$ :<br>
$\\begin{aligned}
${formule}&\\\\
F\\times R^2&=G\\times m_1\\times m_2\\\\
m_1&=\\dfrac{F\\times R^2}{G\\times m_2}
\\end{aligned}$<br>
On obtient $${miseEnEvidence('m_1=\\dfrac{F\\times R^2}{G\\times m_2}')}$.`
        this.reponses = [
          '$m_1=\\dfrac{F\\times R^2}{G\\times m_2}$',
          '$m_1=\\dfrac{F\\times G}{R^2\\times m_2}$',
          '$m_1=\\sqrt{\\dfrac{G\\times R^2}{F\\times m_2}}$',
          '$m_1=F\\times R^2\\times G\\times m_2$',
        ]
        break

      case 'm_2':
        this.correction = `On multiplie les deux membres par $R^2$, puis on divise par $G\\times m_1$ :<br>
$\\begin{aligned}
${formule}&\\\\
F\\times R^2&=G\\times m_1\\times m_2\\\\
m_2&=\\dfrac{F\\times R^2}{G\\times m_1}
\\end{aligned}$<br>
On obtient $${miseEnEvidence('m_2=\\dfrac{F\\times R^2}{G\\times m_1}')}$.`
        this.reponses = [
          '$m_2=\\dfrac{F\\times R^2}{G\\times m_1}$',
          '$m_2=\\dfrac{F\\times G}{R^2\\times m_1}$',
          '$m_2=\\sqrt{\\dfrac{G\\times R^2}{F\\times m_1}}$',
          '$m_2=F\\times R^2\\times G\\times m_1$',
        ]
        break

      case 'G':
        this.correction = `On multiplie les deux membres par $R^2$, puis on divise par $m_1\\times m_2$ :<br>
$\\begin{aligned}
${formule}&\\\\
F\\times R^2&=G\\times m_1\\times m_2\\\\
G&=\\dfrac{F\\times R^2}{m_1\\times m_2}
\\end{aligned}$<br>
On obtient $${miseEnEvidence('G=\\dfrac{F\\times R^2}{m_1\\times m_2}')}$.`
        this.reponses = [
          '$G=\\dfrac{F\\times R^2}{m_1\\times m_2}$',
          '$G=\\dfrac{F\\times m_1\\times m_2}{R^2}$',
          '$G=\\sqrt{\\dfrac{F\\times R^2}{m_1\\times m_2}}$',
          '$G=F\\times R^2\\times m_1\\times m_2$',
        ]
        break

      case 'R':
        this.correction = `On multiplie les deux membres par $R^2$, on divise par $F$, puis on prend la racine carrée :<br>
$\\begin{aligned}
${formule}&\\\\
F\\times R^2&=G\\times m_1\\times m_2\\\\
R^2&=\\dfrac{G\\times m_1\\times m_2}{F}\\\\
R&=\\sqrt{\\dfrac{G\\times m_1\\times m_2}{F}}
\\end{aligned}$<br>
On obtient $${miseEnEvidence('R=\\sqrt{\\dfrac{G\\times m_1\\times m_2}{F}}')}$.`
        this.reponses = [
          '$R=\\sqrt{\\dfrac{G\\times m_1\\times m_2}{F}}$',
          '$R=\\dfrac{G\\times m_1\\times m_2}{F}$',
          '$R=\\sqrt{\\dfrac{F}{G\\times m_1\\times m_2}}$',
          '$R=G\\times m_1\\times m_2\\times F$',
        ]
        break
    }
  }

  versionOriginale: () => void = () => {
    // Cas de l'énoncé : on isole m_1
    this.appliquerLesValeurs('m_1')
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }
    // Seulement 4 cas : la grandeur à isoler
    this.appliquerLesValeurs(choice(['m_1', 'm_2', 'G', 'R']))
  }

  constructor() {
    super()
    this.versionAleatoire()
    this.spacing = 1.5
     this.options = { vertical: true } 
  }
}
