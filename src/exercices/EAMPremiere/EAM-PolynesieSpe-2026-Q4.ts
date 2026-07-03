import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'ps264'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Exprimer une variable dans une formule'
export const dateDePublication = '01/07/2026'

type CasFormule = 'energie-m' | 'energie-v' | 'chute-t'

/**
 * @author Stéphane Guyon
 */
export default class AutoQ4PolynesieSpe2026 extends ExerciceQcmA {
  private appliquerLesValeurs(cas: CasFormule): void {
    if (cas === 'chute-t') {
      const correct = 't=\\sqrt{\\dfrac{2d}{g}}'

      this.enonce = `La distance $d$ parcourue lors d'une chute libre peut être donnée par la formule $d=\\dfrac12gt^2$, où $g$ représente l'intensité de la pesanteur et $t$ la durée de la chute.<br>
      L'expression permettant d'exprimer la durée $t$ en fonction de $d$ et de $g$ est :`

      this.reponses = [
        `$${correct}$`,
        '$t=\\dfrac{2d}{g}$',
        '$t=\\sqrt{\\dfrac{d}{2g}}$',
        '$t=\\sqrt{2gd}$',
      ]

      this.correction = `$d=\\dfrac12gt^2\\iff 2d=gt^2\\iff t^2=\\dfrac{2d}{g}$.<br>
      Comme $t$ est une durée, alors $t$ est positif, d'où $${miseEnEvidence(correct)}$.`
      return
    }

    this.enonce = `On peut calculer l'énergie cinétique d'un objet en mouvement.<br>
    Cette énergie est notée $E_C$ et elle est donnée par la formule $E_C=\\dfrac12mv^2$ où $m$ représente la masse de l'objet et $v$ sa vitesse.<br>
    L'expression permettant d'exprimer ${cas === 'energie-v' ? 'la vitesse $v$ en fonction de $E_C$ et de $m$' : 'la masse $m$ en fonction de $E_C$ et de $v$'} est :`

    if (cas === 'energie-v') {
      const correct = 'v=\\sqrt{\\dfrac{2E_C}{m}}'
      this.reponses = [
        `$${correct}$`,
        '$v=\\dfrac{E_C^2}{2m}$',
        '$v=\\sqrt{\\dfrac{E_C}{2m}}$',
        '$v=\\sqrt{2mE_C}$',
      ]

      this.correction = `$E_C=\\dfrac12mv^2\\iff 2E_C=mv^2\\iff v^2=\\dfrac{2E_C}{m}$.<br>
      Comme $v$ est une vitesse positive, $${miseEnEvidence(correct)}$.`
      return
    }

    const correct = 'm=\\dfrac{2E_C}{v^2}'
    this.reponses = [
      `$${correct}$`,
      '$m=\\dfrac{E_C}{2v^2}$',
      '$m=\\sqrt{\\dfrac{2E_C}{v}}$',
      '$m=2E_Cv^2$',
    ]

    this.correction = `$E_C=\\dfrac12mv^2\\iff 2E_C=mv^2\\iff m=\\dfrac{2E_C}{v^2}$.<br>
    Ainsi, $${miseEnEvidence(correct)}$.`
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs('energie-v')
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    let compteur = 0
    do {
      this.appliquerLesValeurs(choice(['energie-m', 'energie-v', 'chute-t']))
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
