import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Écrire un nombre avec une puissance'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDePublication = '26/01/2026'
/**
 * @author  Gilles Mora
 *
 *
 */

export const uuid = '20fcc'

export const refs = {
  'fr-fr': ['can4C21'],
  'fr-ch': [],
}
export default class EcrireAvecPuissances extends ExerciceSimple {
   constructor() {
    super()
    this.nbQuestions = 1
    this.optionsChampTexte = { texteAvant: '<br>' }
      this.optionsDeComparaison = { puissance: true }
    this.typeExercice = 'simple'
    this.spacingCorr = 1.5
  }

  nouvelleVersion() {
    const cas = randint(1, 2)
    
    if (cas === 1) {
      // Cas avec des entiers
      const choixEntiers = [
        { nombre: 4, base: 2, exposant: 2 },
        { nombre: 8, base: 2, exposant: 3 },
        { nombre: 16, base: 2, exposant: 4 },
        { nombre: 32, base: 2, exposant: 5 },
        { nombre: 64, base: 2, exposant: 6 },
        { nombre: 9, base: 3, exposant: 2 },
        { nombre: 27, base: 3, exposant: 3 },
        { nombre: 81, base: 3, exposant: 4 },
        { nombre: 25, base: 5, exposant: 2 },
        { nombre: 125, base: 5, exposant: 3 },
        { nombre: 36, base: 6, exposant: 2 },
        { nombre: 49, base: 7, exposant: 2 },
        { nombre: 64, base: 8, exposant: 2 },
        { nombre: 100, base: 10, exposant: 2 },
        { nombre: 1000, base: 10, exposant: 3 },
        { nombre: 10000, base: 10, exposant: 4 },
      ]
      
      const valeur = choice(choixEntiers)
      
      this.question = `Écrire le nombre $${texNombre(valeur.nombre)}$ sous la forme $a^n$ avec $n$ entier supérieur ou égal à $2$.`
      
      this.correction = `$${valeur.nombre}=${miseEnEvidence(`${valeur.base}^{${valeur.exposant}}`)}$`
      
      this.reponse = `${valeur.base}^${valeur.exposant}`
      
      this.canEnonce = 'Compléter.'
      this.canReponseACompleter = `$${valeur.nombre}=\\ldots$`
      
    } else {
      // Cas avec des décimaux
      const choixDecimaux = [
        { nombre: 0.04,  base: 0.2, texteBase: '0{,}2', exposant: 2 },
        { nombre: 0.008,  base: 0.2, texteBase: '0{,}2', exposant: 3 },
        { nombre: 0.09, base: 0.3, texteBase: '0{,}3', exposant: 2 },
        { nombre: 0.027, base: 0.3, texteBase: '0{,}3', exposant: 3 },
        { nombre: 0.16, base: 0.4, texteBase: '0{,}4', exposant: 2 },
        { nombre: 0.064, base: 0.4, texteBase: '0{,}4', exposant: 3 },
        { nombre: 0.25, base: 0.5, texteBase: '0{,}5', exposant: 2 },
        { nombre: 0.125, base: 0.5, texteBase: '0{,}5', exposant: 3 },
        { nombre: 0.36, base: 0.6, texteBase: '0{,}6', exposant: 2 },
        { nombre: 0.49, base: 0.7, texteBase: '0{,}7', exposant: 2 },
        { nombre: 0.64, base: 0.8, texteBase: '0{,}8', exposant: 2 },
        { nombre: 0.81, base: 0.9, texteBase: '0{,}9', exposant: 2 },
      ]
      
      const valeur = choice(choixDecimaux)
      
      this.question = `Écrire le nombre $${texNombre(valeur.nombre)}$ sous la forme $a^n$ avec $n$ entier  supérieur ou égal à $2$.`
      
      this.correction = `$${valeur.nombre}=${miseEnEvidence(`${valeur.nombre}^{${valeur.exposant}}`)}$`
      
      this.reponse = `${valeur.base}^${valeur.exposant}`
      
      this.canEnonce = 'Compléter.'
      this.canReponseACompleter = `$${valeur.nombre}=\\ldots$`
    }
  }
}
