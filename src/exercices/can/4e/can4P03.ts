import { tableau2x2 } from '../../../lib/2d/tableau'
import { choice } from '../../../lib/outils/arrayOutils'
import { texteEnCouleur } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Calculer une quatrième proportionnelle'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-Claude Lhote
 * Créé pendant l'été 2021

 */
export const uuid = '709b6'

export const refs = {
  'fr-fr': ['can4P03'],
  'fr-ch': [],
}
export default class QuatriemeProportionnelle extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'

    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const a = randint(1, 6)
    const b = randint(4, 8, a) * 2
    const c = choice([2, 3, 4, 5])
    this.reponse = b * c
    switch (randint(0, 3)) {
      case 0:
        this.question = `Compléter le tableau de proportionnalité.<br>
        
        `
        this.question += tableau2x2(
          {
            L0C0: { content: String(b), background: 'lightgray' },
            L1C0: { content: '' },
            L0C1: { content: String(a), background: 'lightgray' },
            L1C1: { content: String(a * c), background: 'lightgray' },
          },
          this.numeroExercice ?? 0,
          0,
          false,
          '',
        )
        this.question += `<br>
        
        `
        this.correction = `La quatrième proportionnelle est donnée par  : $\\dfrac{${a * c}\\times ${b}}{${a}}=\\dfrac{${a * b * c}}{${a}}=${b * c}$`
        this.correction += texteEnCouleur(`<br> Mentalement : <br>
    Pour passer de la première ligne du tableau à la deuxième, on multiplie par
     $${c}$ car $${a}\\times ${c}=${a * c}$.<br>
     Ainsi, le nombre manquant est donné par : $${b}\\times ${c}=${b * c}$.`)
        break
      case 1:
        this.question = `Compléter le tableau de proportionnalité.<br>
        
        `
        this.question += tableau2x2(
          {
            L0C0: { content: String(a), background: 'lightgray' },
            L1C1: { content: '' },
            L1C0: { content: String(b), background: 'lightgray' },
            L0C1: { content: String(a * c), background: 'lightgray' },
          },
          this.numeroExercice ?? 0,
          0,
          false,
          '',
        )
        this.question += `<br>
        
        `
        this.correction = `La quatrième proportionnelle est donnée par : $\\dfrac{${a * c}\\times ${b}}{${a}}=\\dfrac{${a * b * c}}{${a}}=${b * c}$`
        this.correction += texteEnCouleur(`<br> Mentalement : <br>
        Pour passer de la première colonne du tableau à la deuxième, on multiplie par
         $${c}$ car $${a}\\times ${c}=${a * c}$.<br>
         Ainsi, le nombre manquant est donné par : $${b}\\times ${c}=${b * c}$.`)
        break
      case 2:
        this.question = `Compléter le tableau de proportionnalité.<br>
        
        `
        this.question += tableau2x2(
          {
            L1C0: { content: String(b), background: 'lightgray' },
            L0C0: { content: '' },
            L1C1: { content: String(a), background: 'lightgray' },
            L0C1: { content: String(a * c), background: 'lightgray' },
          },
          this.numeroExercice ?? 0,
          0,
          false,
          '',
        )
        this.question += `<br>
        
        `
        this.correction = `La quatrième proportionnelle est donnée par : $\\dfrac{${a * c}\\times ${b}}{${a}}=\\dfrac{${a * b * c}}{${a}}=${b * c}$`
        this.correction += texteEnCouleur(`<br> Mentalement : <br>
        Pour passer de la deuxième ligne du tableau à la première, on multiplie par
         $${c}$ car $${a}\\times ${c}=${a * c}$.<br>
         Ainsi, le nombre manquant est donné par : $${b}\\times ${c}=${b * c}$.`)
        break
      case 3:
        this.question = `Compléter le tableau de proportionnalité.<br>
        
        `
        this.question += tableau2x2(
          {
            L0C0: { content: String(b), background: 'lightgray' },
            L0C1: { content: '' },
            L1C0: { content: String(a), background: 'lightgray' },
            L1C1: { content: String(a * c), background: 'lightgray' },
          },
          this.numeroExercice ?? 0,
          0,
          false,
          '',
        )
        this.question += `<br>
        
        `
        this.correction = `La quatrième proportionnelle est donnée par : $\\dfrac{${a * c}\\times ${b}}{${a}}=\\dfrac{${a * b * c}}{${a}}=${b * c}$`
        this.correction += texteEnCouleur(`<br> Mentalement : <br>
        Pour passer de la première colonne du tableau à la deuxième, on multiplie par
         $${c}$ car $${a}\\times ${c}=${a * c}$.<br>
         Ainsi, le nombre manquant est donné par : $${b}\\times ${c}=${b * c}$.`)
        break
    }
  }
}
