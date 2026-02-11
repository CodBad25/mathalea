import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence, texteEnCouleur } from '../../../lib/outils/embellissements'
import { sp } from '../../../lib/outils/outilString'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Convertir en tous sens'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-Claude Lhote & Gilles Mora
 * Créé pendant l'été 2021

 */
export const uuid = 'c0bf1'

export const refs = {
  'fr-fr': ['can6M04', 'auto6M1C-flash3'],
  'fr-ch': [],
}
export default class ConversionEnTousSens extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    let a, resultat
    switch (
      choice(['a', 'b', 'c', 'd']) //
    ) {
      case 'a':
        if (choice([true, false])) {
          a = randint(1, 13) * 50
          resultat = a / 1000
          this.question = `$${texNombre(a)}\\text{ g}$  =`
          if (!this.interactif) {
            this.question += ' $\\ldots\\text{ kg}$'
          }

          this.optionsChampTexte = { texteApres: '$\\text{ kg}$' }
          this.canEnonce = 'Compléter.'
          this.canReponseACompleter = `$${texNombre(a)}\\text{ g}$  $=\\dots\\text{ kg}$`
          this.correction = `$${texNombre(a)}\\text{ g}$$=${miseEnEvidence(texNombre(a / 1000))}\\text{ kg}$`
          this.correction += texteEnCouleur(`<br> Mentalement : <br>
  Comme $1\\text{ kg}$ $=${texNombre(1000)}\\text{ g}$, alors $1\\text{ g}$ $${sp()}=${sp()}${texNombre(0.001)}\\text{ kg}$.<br>
  Ainsi pour passer des $\\text{g}$ au $\\text{kg}$, on divise par $${texNombre(1000)}$.<br>
    Comme $${texNombre(a)}\\div ${texNombre(1000)} =${texNombre(a / 1000)}$, alors $${texNombre(a)}\\text{ g}$$${sp()}=${texNombre(a / 1000)}\\text{ kg}$.  `)
        } else {
          a = randint(1, 5) / 10
          resultat = a * 1000
          this.question = `$${texNombre(a)}\\text{ kg}$  = `
          if (!this.interactif) {
            this.question += ' $\\ldots\\text{ g}$'
          }

          this.optionsChampTexte = {
            texteApres: '$\\text{ g }$' }
          this.canEnonce = 'Compléter.'
          this.canReponseACompleter = `$${texNombre(a)}\\text{ kg}$ $= \\dots\\text{ g}$`
          this.correction = `$${texNombre(a)}\\text{ kg}$ $=${miseEnEvidence(texNombre(a * 1000))}\\text{ g}$`
          this.correction += texteEnCouleur(`<br> Mentalement : <br>
          Comme $1\\text{ kg}$ $=${texNombre(1000)}\\text{ g}$, alors pour passer des $\\text{kg}$ au $\\text{g}$, on multiplie par $${texNombre(1000)}$.<br>
            Comme $${texNombre(a)}\\times ${texNombre(1000)} =${texNombre(a * 1000)}$, alors $${texNombre(a)}\\text{ kg}$$${sp()}=${resultat}\\text{ g}$.  `)
        }
        break
      case 'b':
        if (choice([true, false])) {
          a = randint(1, 13) * 5
          resultat = a * 100
          this.question = `$${texNombre(a)}\\text{ m}$  =`
          if (!this.interactif) {
            this.question += ' $\\ldots\\text{ cm}$'
          }

          this.optionsChampTexte = { texteApres: ' $\\text{cm}$' }
          this.canEnonce = 'Compléter.'
          this.canReponseACompleter = `$${texNombre(a)}\\text{ m}$ $=$ $\\dots\\text{ cm}$`
          this.correction = `$${texNombre(a)}\\text{ m}$ $=${miseEnEvidence(texNombre(a * 100))}\\text{ cm}$`
          this.correction += texteEnCouleur(`<br> Mentalement : <br>
          Comme $1\\text{ m}$ $=100\\text{ cm}$,  pour passer des $\\text{m}$ au $\\text{cm}$, on multiplie par $100$.<br>
            Comme : $${texNombre(a)}\\times 100 =${texNombre(a * 100)}$, alors $${texNombre(a)}\\text{ m}=${texNombre(a * 100)}\\text{ cm}$.  `)
        } else {
          a = randint(1, 12) * 10
          resultat = a / 100
          this.question = `$${texNombre(a)}\\text{ cm}$  =`
          if (!this.interactif) {
            this.question += ' $\\ldots\\text{ m}$'
          }

          this.optionsChampTexte = { texteApres: '$\\text{ m}$' }
          this.canEnonce = 'Compléter.'
          this.canReponseACompleter = `$${texNombre(a)}\\text{ cm}$ $= \\dots\\text{ m}$`
          this.correction = `$${texNombre(a)}\\text{ cm}=${miseEnEvidence(texNombre(a / 100))}\\text{ m}$.`
          this.correction += texteEnCouleur(`<br> Mentalement : <br>
          Comme $1\\text{ m}$ $=100\\text{ cm}$, alors $1\\text{ cm}$ $=0,01\\text{ m}$.<br>
          Ainsi pour passer des $\\text{cm}$ au $\\text{m}$, on divise par $100$.<br>
            Comme  $${texNombre(a)}\\div 100 =${texNombre(a / 100)}$, alors $${texNombre(a)}\\text{ cm}=${texNombre(a / 100)}\\text{ m}$.  `)
        }
        break
      case 'c':
        if (choice([true, false])) {
          a = randint(1, 13) / 10
          resultat = a * 10
          this.question = `$${texNombre(a)}\\text{ cL}$  =  `
          if (!this.interactif) {
            this.question += ' $\\ldots\\text{ mL}$'
          }

          this.optionsChampTexte = { texteApres: '$\\text{ mL}$' }
          this.canEnonce = 'Compléter.'
          this.canReponseACompleter = `$${texNombre(a)}\\text{ cL}$ $= \\dots\\text{ mL}$`
          this.correction = `$${texNombre(a)}\\text{ cL}$ $=${miseEnEvidence(texNombre(a * 10))}\\text{ mL}$`
          this.correction += texteEnCouleur(`<br> Mentalement : <br>
          Comme $1\\text{ cL}$$ =10\\text{ mL}$,  pour passer des $\\text{cL}$ au $\\text{mL}$, on multiplie par $10$.<br>
            Comme  $${texNombre(a)}\\times 10 =${texNombre(a * 10)}$, alors $${texNombre(a)}\\text{ cL}$$=${texNombre(a * 10)}\\text{ mL}$.  `)
        } else {
          a = randint(1, 12)
          resultat = a / 10
          this.question = `$${texNombre(a)}\\text{ mL}$  = `
          if (!this.interactif) {
            this.question += ' $\\ldots\\text{ cL}$'
          }

          this.optionsChampTexte = { texteApres: '$\\text{ cL}$' }
          this.canEnonce = 'Compléter.'
          this.canReponseACompleter = `$${texNombre(a)}\\text{ mL}$ $= \\dots\\text{ cL}$`
          this.correction = `$${texNombre(a)}\\text{ mL}$$=${miseEnEvidence(texNombre(a / 10))}\\text{ cL}$`
          this.correction += texteEnCouleur(`<br> Mentalement : <br>
          Comme $1\\text{ cL}$$ =10\\text{ mL}$, alors $1\\text{ mL}$ $=0,1\\text{ cL}$.<br>
          Ainsi pour passer des $\\text{mL}$ au $\\text{cL}$, on divise par $10$.<br>
            Comme  $${texNombre(a)}\\div 10 =${texNombre(a / 10)}$, alors $${texNombre(a)}\\text{ mL}$$=${texNombre(a / 10)}\\text{ cL}$.  `)
        }
        break
      case 'd':
        if (choice([true, false])) {
          a = randint(1, 20) * 10
          resultat = a / 1000
          this.question = `$${texNombre(a)}\\text{ m}$  $=$ `
          if (!this.interactif) {
            this.question += ' $\\ldots\\text{ km}$'
          }

          this.optionsChampTexte = { texteApres: '$\\text{ km}$' }
          this.canEnonce = 'Compléter.'
          this.canReponseACompleter = `$${texNombre(a)}\\text{ m}$ $= \\dots\\text{ km}$`
          this.correction = `$${texNombre(a)}\\text{ m}$ $=${miseEnEvidence(texNombre(a / 1000))}\\text{ km}$`
          this.correction += texteEnCouleur(`<br> Mentalement : <br>
          Comme $1\\text{ km}$ $=${texNombre(1000)}\\text{ m}$, alors $1\\text{ m}$ $=0,001\\text{ km}$.<br>
          Ainsi pour passer des $\\text{m}$ au $\\text{km}$, on divise par $${texNombre(1000)}$.<br>
            Comme  $${texNombre(a)}\\div ${texNombre(1000)} =${texNombre(a / 1000)}$, alors $${texNombre(a)}\\text{ m}=${texNombre(a / 1000)}\\text{ km}$.  `)
        } else {
          a = randint(1, 35) / 100
          resultat = a * 1000
          this.question = `$${texNombre(a)}\\text{ km}$ $=$`
          if (!this.interactif) {
            this.question += ' $\\ldots\\text{ m}$'
          }

          this.optionsChampTexte = { texteApres: '$\\text{ m}$' }
          this.canEnonce = 'Compléter.'
          this.canReponseACompleter = `$${texNombre(a)}\\text{ km}$ $= \\dots\\text{ m}$`
          this.correction = `$${texNombre(a)}\\text{ km}$$=${miseEnEvidence(texNombre(a * 1000))}\\text{ m}$`
          this.correction += texteEnCouleur(`<br> Mentalement : <br>
          Comme $1\\text{ km}$ $=${texNombre(1000)}\\text{ m}$,  pour passer des $\\text{km}$ au $\\text{m}$, on multiplie par $${texNombre(1000)}$.<br>
            Comme  $${texNombre(a)}\\times ${texNombre(1000)} =${texNombre(a * 1000)}$, alors $${texNombre(a)}\\text{ km}$$=${texNombre(a * 1000)}\\text{ m}$.  `)
        }
        break
    }
    this.reponse = resultat
  }
}
