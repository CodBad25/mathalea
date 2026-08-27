import { choice } from '../../../lib/outils/arrayOutils'
import {
  miseEnEvidence,
  texteEnCouleur,
} from '../../../lib/outils/embellissements'
import { sp } from '../../../lib/outils/outilString'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Convertir en tous sens'
export const interactifReady = true

export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-claude Lhote & Gilles Mora
 * Créé pendant l'été 2021

 */
export const uuid = 'c0bf1'

export const refs = {
  'fr-fr': ['can6M04', 'auto6M1C-flash3'],
  'fr-ch': ['NR'],
}

/**
 * Calcule les 3 distracteurs d'une conversion par puissance de 10.
 * Pour le facteur correct, on inverse l'opération (mult <-> div).
 * Pour les 2 autres facteurs usuels (10, 100, 1000), on garde la même opération.
 */
function distracteursConversion(
  valeur: number,
  facteur: number,
  estMultiplication: boolean,
): number[] {
  const resultat = estMultiplication ? valeur * facteur : valeur / facteur
  const erreurDeSens = estMultiplication ? valeur / facteur : resultat * 100
  return [resultat / 10, resultat * 10, erreurDeSens]
}

export default class ConversionEnTousSens extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.versionQcmDisponible = true
  }

  nouvelleVersion() {
    let a, resultat
    switch (
      this.quotaChoice('typeConversion', ['a', 'b', 'c', 'd']) //
    ) {
      case 'a':
        if (choice([true, false])) {
          a = randint(1, 13) * 50
          resultat = a / 1000
          this.question = this.versionQcm
            ? `$${texNombre(a)}\\text{ g}$ est égal à :`
            : `$${texNombre(a)}\\text{ g}$  =`
          if (!this.interactif && !this.versionQcm) {
            this.question += ' $\\ldots\\text{ kg}$'
          }

          this.optionsChampTexte = { texteApres: '$\\text{ kg}$' }
          this.canEnonce = 'Compléter.'
          this.canReponseACompleter = `$${texNombre(a)}\\text{ g}$  $=\\dots\\text{ kg}$`
          this.correction = `$${texNombre(a)}\\text{ g}$$=${miseEnEvidence(texNombre(a / 1000))}\\text{ kg}$`
          {
            const explication = `Comme $1\\text{ kg}$ $=${texNombre(1000)}\\text{ g}$, alors $1\\text{ g}$ $${sp()}=${sp()}${texNombre(0.001)}\\text{ kg}$.<br>
  Ainsi pour passer des $\\text{g}$ au $\\text{kg}$, on divise par $${texNombre(1000)}$.<br>
    Comme $${texNombre(a)}\\div ${texNombre(1000)} =${texNombre(a / 1000)}$, alors $${texNombre(a)}\\text{ g}$$${sp()}=${texNombre(a / 1000)}\\text{ kg}$.  `
            this.correction += this.versionQcm
              ? `<br>${explication}`
              : texteEnCouleur(`<br> Mentalement : <br>${explication}`)
          }

          this.reponse = this.versionQcm
            ? `$${texNombre(resultat)}\\text{ kg}$`
            : resultat

          this.distracteurs = distracteursConversion(a, 1000, false).map(
            (v) => `$${texNombre(v)}\\text{ kg}$`,
          )
        } else {
          a = randint(1, 5) / 10
          resultat = a * 1000
          this.question = this.versionQcm
            ? `$${texNombre(a)}\\text{ kg}$ est égal à :`
            : `$${texNombre(a)}\\text{ kg}$  = `
          if (!this.interactif && !this.versionQcm) {
            this.question += ' $\\ldots\\text{ g}$'
          }

          this.optionsChampTexte = {
            texteApres: '$\\text{ g }$',
          }
          this.canEnonce = 'Compléter.'
          this.canReponseACompleter = `$${texNombre(a)}\\text{ kg}$ $= \\dots\\text{ g}$`
          this.correction = `$${texNombre(a)}\\text{ kg}$ $=${miseEnEvidence(texNombre(a * 1000))}\\text{ g}$`
          {
            const explication = `Comme $1\\text{ kg}$ $=${texNombre(1000)}\\text{ g}$, alors pour passer des $\\text{kg}$ au $\\text{g}$, on multiplie par $${texNombre(1000)}$.<br>
            Comme $${texNombre(a)}\\times ${texNombre(1000)} =${texNombre(a * 1000)}$, alors $${texNombre(a)}\\text{ kg}$$${sp()}=${resultat}\\text{ g}$.  `
            this.correction += this.versionQcm
              ? `<br>${explication}`
              : texteEnCouleur(`<br> Mentalement : <br>${explication}`)
          }

          this.reponse = this.versionQcm
            ? `$${texNombre(resultat)}\\text{ g}$`
            : resultat

          this.distracteurs = distracteursConversion(a, 1000, true).map(
            (v) => `$${texNombre(v)}\\text{ g}$`,
          )
        }
        break
      case 'b':
        if (choice([true, false])) {
          a = randint(1, 13) * 5
          resultat = a * 100
          this.question = this.versionQcm
            ? `$${texNombre(a)}\\text{ m}$ est égal à :`
            : `$${texNombre(a)}\\text{ m}$  =`
          if (!this.interactif && !this.versionQcm) {
            this.question += ' $\\ldots\\text{ cm}$'
          }

          this.optionsChampTexte = { texteApres: ' $\\text{cm}$' }
          this.canEnonce = 'Compléter.'
          this.canReponseACompleter = `$${texNombre(a)}\\text{ m}$ $=$ $\\dots\\text{ cm}$`
          this.correction = `$${texNombre(a)}\\text{ m}$ $=${miseEnEvidence(texNombre(a * 100))}\\text{ cm}$`
          {
            const explication = `Comme $1\\text{ m}$ $=100\\text{ cm}$,  pour passer des $\\text{m}$ au $\\text{cm}$, on multiplie par $100$.<br>
            Comme : $${texNombre(a)}\\times 100 =${texNombre(a * 100)}$, alors $${texNombre(a)}\\text{ m}=${texNombre(a * 100)}\\text{ cm}$.  `
            this.correction += this.versionQcm
              ? `<br>${explication}`
              : texteEnCouleur(`<br> Mentalement : <br>${explication}`)
          }

          this.reponse = this.versionQcm
            ? `$${texNombre(resultat)}\\text{ cm}$`
            : resultat

          this.distracteurs = distracteursConversion(a, 100, true).map(
            (v) => `$${texNombre(v)}\\text{ cm}$`,
          )
        } else {
          a = randint(1, 12) * 10
          resultat = a / 100
          this.question = this.versionQcm
            ? `$${texNombre(a)}\\text{ cm}$ est égal à :`
            : `$${texNombre(a)}\\text{ cm}$  =`
          if (!this.interactif && !this.versionQcm) {
            this.question += ' $\\ldots\\text{ m}$'
          }

          this.optionsChampTexte = { texteApres: '$\\text{ m}$' }
          this.canEnonce = 'Compléter.'
          this.canReponseACompleter = `$${texNombre(a)}\\text{ cm}$ $= \\dots\\text{ m}$`
          this.correction = `$${texNombre(a)}\\text{ cm}=${miseEnEvidence(texNombre(a / 100))}\\text{ m}$.`
          {
            const explication = `Comme $1\\text{ m}$ $=100\\text{ cm}$, alors $1\\text{ cm}$ $=0,01\\text{ m}$.<br>
          Ainsi pour passer des $\\text{cm}$ au $\\text{m}$, on divise par $100$.<br>
            Comme  $${texNombre(a)}\\div 100 =${texNombre(a / 100)}$, alors $${texNombre(a)}\\text{ cm}=${texNombre(a / 100)}\\text{ m}$.  `
            this.correction += this.versionQcm
              ? `<br>${explication}`
              : texteEnCouleur(`<br> Mentalement : <br>${explication}`)
          }

          this.reponse = this.versionQcm
            ? `$${texNombre(resultat)}\\text{ m}$`
            : resultat

          this.distracteurs = distracteursConversion(a, 100, false).map(
            (v) => `$${texNombre(v)}\\text{ m}$`,
          )
        }
        break
      case 'c':
        if (choice([true, false])) {
          a = randint(1, 13) / 10
          resultat = a * 10
          this.question = this.versionQcm
            ? `$${texNombre(a)}\\text{ cL}$ est égal à :`
            : `$${texNombre(a)}\\text{ cL}$  =  `
          if (!this.interactif && !this.versionQcm) {
            this.question += ' $\\ldots\\text{ mL}$'
          }

          this.optionsChampTexte = { texteApres: '$\\text{ mL}$' }
          this.canEnonce = 'Compléter.'
          this.canReponseACompleter = `$${texNombre(a)}\\text{ cL}$ $= \\dots\\text{ mL}$`
          this.correction = `$${texNombre(a)}\\text{ cL}$ $=${miseEnEvidence(texNombre(a * 10))}\\text{ mL}$`
          {
            const explication = `Comme $1\\text{ cL}$$ =10\\text{ mL}$,  pour passer des $\\text{cL}$ au $\\text{mL}$, on multiplie par $10$.<br>
            Comme  $${texNombre(a)}\\times 10 =${texNombre(a * 10)}$, alors $${texNombre(a)}\\text{ cL}$$=${texNombre(a * 10)}\\text{ mL}$.  `
            this.correction += this.versionQcm
              ? `<br>${explication}`
              : texteEnCouleur(`<br> Mentalement : <br>${explication}`)
          }

          this.reponse = this.versionQcm
            ? `$${texNombre(resultat)}\\text{ mL}$`
            : resultat

          this.distracteurs = distracteursConversion(a, 10, true).map(
            (v) => `$${texNombre(v)}\\text{ mL}$`,
          )
        } else {
          a = randint(1, 12)
          resultat = a / 10
          this.question = this.versionQcm
            ? `$${texNombre(a)}\\text{ mL}$ est égal à :`
            : `$${texNombre(a)}\\text{ mL}$  = `
          if (!this.interactif && !this.versionQcm) {
            this.question += ' $\\ldots\\text{ cL}$'
          }

          this.optionsChampTexte = { texteApres: '$\\text{ cL}$' }
          this.canEnonce = 'Compléter.'
          this.canReponseACompleter = `$${texNombre(a)}\\text{ mL}$ $= \\dots\\text{ cL}$`
          this.correction = `$${texNombre(a)}\\text{ mL}$$=${miseEnEvidence(texNombre(a / 10))}\\text{ cL}$`
          {
            const explication = `Comme $1\\text{ cL}$$ =10\\text{ mL}$, alors $1\\text{ mL}$ $=0,1\\text{ cL}$.<br>
          Ainsi pour passer des $\\text{mL}$ au $\\text{cL}$, on divise par $10$.<br>
            Comme  $${texNombre(a)}\\div 10 =${texNombre(a / 10)}$, alors $${texNombre(a)}\\text{ mL}$$=${texNombre(a / 10)}\\text{ cL}$.  `
            this.correction += this.versionQcm
              ? `<br>${explication}`
              : texteEnCouleur(`<br> Mentalement : <br>${explication}`)
          }

          this.reponse = this.versionQcm
            ? `$${texNombre(resultat)}\\text{ cL}$`
            : resultat

          this.distracteurs = distracteursConversion(a, 10, false).map(
            (v) => `$${texNombre(v)}\\text{ cL}$`,
          )
        }
        break
      case 'd':
        if (choice([true, false])) {
          a = randint(1, 20) * 10
          resultat = a / 1000
          this.question = this.versionQcm
            ? `$${texNombre(a)}\\text{ m}$ est égal à :`
            : `$${texNombre(a)}\\text{ m}$  $=$ `
          if (!this.interactif && !this.versionQcm) {
            this.question += ' $\\ldots\\text{ km}$'
          }

          this.optionsChampTexte = { texteApres: '$\\text{ km}$' }
          this.canEnonce = 'Compléter.'
          this.canReponseACompleter = `$${texNombre(a)}\\text{ m}$ $= \\dots\\text{ km}$`
          this.correction = `$${texNombre(a)}\\text{ m}$ $=${miseEnEvidence(texNombre(a / 1000))}\\text{ km}$`
          {
            const explication = `Comme $1\\text{ km}$ $=${texNombre(1000)}\\text{ m}$, alors $1\\text{ m}$ $=0,001\\text{ km}$.<br>
          Ainsi pour passer des $\\text{m}$ au $\\text{km}$, on divise par $${texNombre(1000)}$.<br>
            Comme  $${texNombre(a)}\\div ${texNombre(1000)} =${texNombre(a / 1000)}$, alors $${texNombre(a)}\\text{ m}=${texNombre(a / 1000)}\\text{ km}$.  `
            this.correction += this.versionQcm
              ? `<br>${explication}`
              : texteEnCouleur(`<br> Mentalement : <br>${explication}`)
          }

          this.reponse = this.versionQcm
            ? `$${texNombre(resultat)}\\text{ km}$`
            : resultat

          this.distracteurs = distracteursConversion(a, 1000, false).map(
            (v) => `$${texNombre(v)}\\text{ km}$`,
          )
        } else {
          a = randint(1, 35) / 100
          resultat = a * 1000
          this.question = this.versionQcm
            ? `$${texNombre(a)}\\text{ km}$ est égal à :`
            : `$${texNombre(a)}\\text{ km}$ $=$`
          if (!this.interactif && !this.versionQcm) {
            this.question += ' $\\ldots\\text{ m}$'
          }

          this.optionsChampTexte = { texteApres: '$\\text{ m}$' }
          this.canEnonce = 'Compléter.'
          this.canReponseACompleter = `$${texNombre(a)}\\text{ km}$ $= \\dots\\text{ m}$`
          this.correction = `$${texNombre(a)}\\text{ km}$$=${miseEnEvidence(texNombre(a * 1000))}\\text{ m}$`
          {
            const explication = `Comme $1\\text{ km}$ $=${texNombre(1000)}\\text{ m}$,  pour passer des $\\text{km}$ au $\\text{m}$, on multiplie par $${texNombre(1000)}$.<br>
            Comme  $${texNombre(a)}\\times ${texNombre(1000)} =${texNombre(a * 1000)}$, alors $${texNombre(a)}\\text{ km}$$=${texNombre(a * 1000)}\\text{ m}$.  `
            this.correction += this.versionQcm
              ? `<br>${explication}`
              : texteEnCouleur(`<br> Mentalement : <br>${explication}`)
          }

          this.reponse = this.versionQcm
            ? `$${texNombre(resultat)}\\text{ m}$`
            : resultat

          this.distracteurs = distracteursConversion(a, 1000, true).map(
            (v) => `$${texNombre(v)}\\text{ m}$`,
          )
        }
        break
    }
  }
}
