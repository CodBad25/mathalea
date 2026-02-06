import { complex, conj } from 'mathjs'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = "Déterminer le conjugué d'un nombre complexe"
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'
export const dateDePublication = '07/092025'

/**
 * Question de can : Partie réelle/imaginaire
 * @author Stéphane Guyon

*/
export const uuid = 'ac62a'

export const refs = {
  'fr-fr': ['canTEC1-05'],
  'fr-ch': [],
}
export default class Conjugue extends ExerciceSimple {
  constructor() {
    super()

    this.nbQuestions = 1
    this.typeExercice = 'simple'
  }

  nouvelleVersion() {
    const ReZ = randint(-5, 5)
    const ImZ = randint(-5, 5)
    const z = complex(ReZ, ImZ)
    const moinsZ = complex(-ReZ, -ImZ)
    const iZ = complex(-ImZ, ReZ)
    const conjZ = complex(ReZ, -ImZ)
    const conjIz = complex(ImZ, ReZ)
    const moinsIz = complex(ImZ, -ReZ)
    const scenario = randint(0, 4)
    this.question = `On donne le nombre complexe $z = ${z.toString()}$.<br>`
    this.correction =
      "Par définition, le conjugué d'un nombre complexe qui s'écrit sous la forme $z=a+ib$, avec $a$ et $b$ deux réels, est $\\overline{z} =a-ib$.<br>"
    switch (scenario) {
      case 0:
        this.question += 'Déterminer le conjugué de $z$.'
        this.correction += `On a donc ici : $\\overline{z} = ${miseEnEvidence(`${conjZ.toString()}`)}$.`

        this.reponse = `${conjZ.toString()}`
        break
      case 1:
        this.question += 'Déterminer $\\overline{z}$.'
        this.correction += `On a donc ici : $\\overline{z} = ${miseEnEvidence(`${conjZ.toString()}`)}$.`

        this.reponse = `${conjZ.toString()}`
        break
      case 2:
        this.question += 'Déterminer la forme algébrique de $Z=\\overline{-z}$.'
        this.correction += `
    $\\begin{aligned}
    Z&=\\overline{-z}\\\\
     &= \\overline{${moinsZ.toString()}}\\\\
    &=${miseEnEvidence(`${conj(moinsZ).toString()}`)}.
    \\end{aligned}$`

        this.reponse = `${conj(moinsZ).toString()}`
        break
      case 3:
        this.question += 'Déterminer la forme algébrique de $Z=\\overline{iz}$.'
        this.correction += `
    $\\begin{aligned}
    Z&=\\overline{iz}\\\\
      &= \\overline{i\\left(${z.toString()}\\right)}\\\\
      &= \\overline{${iZ.toString()}}\\\\
    &=${miseEnEvidence(`${conjIz.toString()}`)}.
    \\end{aligned}$<br>
    On aurait pu aussi utiliser la propriété  des produits des conjugués :<br>
     $\\begin{aligned}
    Z&=\\overline{iz}\\\\
      &= \\overline{i} \\times \\overline{${z.toString()}}\\\\
       &= -i \\left({${conjZ.toString()}}\\right)\\\\
       &=${miseEnEvidence(`${conjIz.toString()}`)}.
    \\end{aligned}$<br>`

        this.reponse = `${conjIz.toString()}`
        break
      case 4:
        this.question +=
          'Déterminer la forme algébrique de $Z=\\overline{-iz}$.'
        this.correction += `
    $\\begin{aligned}
    Z&=\\overline{-iz}\\\\
      &= \\overline{-i\\left(${z.toString()}\\right)}\\\\
      &= \\overline{${moinsIz.toString()}}\\\\
    &=${miseEnEvidence(`${conj(moinsIz).toString()}`)}.
    \\end{aligned}$<br>
    On aurait pu aussi utiliser la propriété  des produits des conjugués :<br>
     $\\begin{aligned}
    Z&=\\overline{-iz}\\\\
      &= \\overline{-i} \\times \\left(\\overline{${z.toString()} }\\right)\\\\
       &= i \\left({${conjZ.toString()}}\\right)\\\\
      &=${miseEnEvidence(`${conj(moinsIz).toString()}`)}.
    \\end{aligned}$<br>`

        this.reponse = `${conj(moinsIz).toString()}`
        break
    }
  }
}
