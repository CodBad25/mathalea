import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { nombreElementsDifferents } from '../../ExerciceQcm'
import ExerciceQcmA from '../../ExerciceQcmA'

export const uuid = '67e17'
export const refs = {
  'fr-fr': ['3P1QCM-2'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Problème de vitesse (2013 Polynésie)'
export const dateDePublication = '30/10/2024'
/**
 *
 * @author Jean-Claude LHOTE
 */
export default class PolynesieJuin13Exo1Q2 extends ExerciceQcmA {
  private appliquerLesValeurs(d: number, v: number): void {
    const t = (d * 3.6) / v
    const s = t % 60
    const m = (t - s) / 60

    this.reponses = [
      `$${String(m)}$ min $${String(s)}$ s`,
      `$${String(m)}$ min $${String(s + 8)}$ s`,
      `$${String(m)}$ min $${String(s - 10)}$ s`,
    ]
    this.enonce = `Combien faut-il de temps pour parcourir $${texNombre(d)}\\text{ m}$ à la vitesse moyenne de $${v}\\text{ km/h}$ ?`
    this.correction = `Une vitesse de $${v}\\text{ km/h}$ permet de parcourir $${v}\\text{ km}$ en $1$h, soit $${texNombre(v * 1000)}\\text{ m}$ en $${texNombre(3600)}$ s ou encore $${v}\\text{ m}$ en $3,6$ s.<br>`
    this.correction += `Donc, pour parcourir $${texNombre(d)}\\text{ m}$, il faut $\\dfrac{${texNombre(d)}\\text{ m}}{${v}\\text{ m}}\\times 3,6\\text{ s}=${t.toString()}$ s, soit $${miseEnEvidence(`${m.toString()} \\text{ min } ${s.toString()} \\text{ s }`)}$.`
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(800, 40)
  }

  versionAleatoire: () => void = () => {
    const n = 3
    do {
      const v = choice([20, 30, 40, 50, 60, 70, 80, 90, 100])
      const d = v * choice([10, 20, 30, 40])

      this.appliquerLesValeurs(d, v)
    } while (nombreElementsDifferents(this.reponses) < n)
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
