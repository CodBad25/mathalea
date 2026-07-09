import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { texNombre } from '../../lib/outils/texNombre'
import { randint } from '../../modules/outils'

// import ExerciceQcmA from '../../ExerciceQcmA'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '12ba0'
export const refs = {
  'fr-fr': ['1A-S02-2', '2A-S2-2'],
  'fr-ch': ['4mProbStat-21'],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = "Déterminer un quartile d'une série à faible effectif"
export const dateDePublication = '01/08/2025'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Stéphane Guyon
 *
 */

export default class QuartileQCM extends ExerciceQcmA {
  // Ceci est la fonction qui s'occupe d'écrire l'énoncé, la correction et les réponses
  // Elle factorise le code qui serait dupliqué dans versionAleatoire et versionOriginale
  private appliquerLesValeurs(
    valeurs: number[],
    effectif: number,
    quartile: number,
  ): void {
    const serieClassee = [...valeurs].sort((a, b) => a - b)
    let rangQ1: number
    let rangQ3: number
    if (effectif % 4 === 0) {
      rangQ1 = 0.25 * effectif
      rangQ3 = 0.75 * effectif
    } else {
      rangQ1 = Math.floor(0.25 * effectif) + 1
      rangQ3 = Math.floor(0.75 * effectif) + 1
    }
    const Q1 = serieClassee[rangQ1 - 1]
    const Q3 = serieClassee[rangQ3 - 1]

    let distracteur1Q1: number
    if (rangQ1 - 2 >= 0) {
      distracteur1Q1 = serieClassee[rangQ1 - 2]
    } else {
      distracteur1Q1 = Q1 - 2
    }
    const distracteur2Q1 = Q3

    let distracteur3Q1: number
    do {
      distracteur3Q1 = Q1 + choice([-2, -1, 1, 2])
    } while (
      distracteur3Q1 === Q1 ||
      distracteur3Q1 === distracteur1Q1 ||
      distracteur3Q1 === distracteur2Q1
    )

    const distracteur4Q1 = serieClassee[rangQ1]
    // distracteurs pour Q3 :
    let distracteur1Q3: number
    if (rangQ1 - 2 >= 0) {
      distracteur1Q3 = serieClassee[rangQ3 - 2]
    } else {
      distracteur1Q3 = Q3 - 2
    }
    const distracteur2Q3 = Q1
    let distracteur3Q3: number
    do {
      distracteur3Q3 = Q3 + choice([-2, -1, 1, 2])
    } while (
      distracteur3Q3 === Q1 ||
      distracteur3Q3 === distracteur1Q3 ||
      distracteur3Q3 === distracteur2Q3
    )

    const distracteur4Q3 = serieClassee[rangQ3]
    // réponses pour Q1 :
    if (quartile === 1) {
      this.reponses = [
        `$${Q1}$`,
        `$${distracteur1Q1}$`,
        `$${distracteur2Q1}$`,
        `$${distracteur3Q1}$`,
        `$${distracteur4Q1}$`,
      ]

      this.enonce = `On donne la série statistique suivante : 
      $${valeurs.join('  ;  ')}$.<br>
      Le premier quartile de la série est :`
      this.correction = `La série triée par ordre croissant est : $${serieClassee.join('$  ;  $')}$.`
      this.correction += `<br>La série contient $${effectif}$ valeurs.<br>
      Pour trouver le rang de $Q_1$, on calcule le quart de ${texNombre(effectif)} qui vaut
       $\\dfrac{${effectif}}{4}=${texNombre(effectif / 4)}$`
      if (effectif % 4 !== 0) {
        this.correction += `<br>On arrondit à l'entier supérieur qui vaut $${rangQ1}$.`
      }
      this.correction += `<br> Le premier quartile est donc la valeur de rang $${rangQ1}$ de la série classée : $Q_1=${Q1}$.`
      this.reponse = `$${Q1}$`
    } else {
      this.reponses = [
        `$${Q3}$`,
        `$${distracteur1Q3}$`,
        `$${distracteur2Q3}$`,
        `$${distracteur3Q3}$`,
        `$${distracteur4Q3}$`,
      ]
      this.enonce = `On donne la série statistique suivante :
      $${valeurs.join('  ;  ')}$.<br>
      Le troisième quartile de la série est :`
      this.correction = `La série triée par ordre croissant est : $${serieClassee.join('  ;  ')}$.`

      this.correction += `<br>La série contient $${effectif}$ valeurs.<br>
      Pour trouver le rang de $Q_3$, on calcule les trois quarts de $${effectif}$ qui vaut
       $\\dfrac{3\\times${effectif}}{4}=${texNombre(0.75 * effectif)}$.`
      if ((3 * effectif) % 4 !== 0) {
        this.correction += `<br>On arrondit à l'entier supérieur qui vaut $${rangQ3}$ .`
      }
      this.correction += `<br> Le troisième quartile est donc la valeur de rang $${rangQ3}$ de la série classée : $Q_3=${Q3}$.`
      this.reponse = `$${Q3}$`
    }
  }

  // S'occupe de passser les données originales à la fonction appliquerLesValeurs
  versionOriginale: () => void = () => {
    this.appliquerLesValeurs([8, 10, 12, 14, 16, 18, 20, 22], 8, 1) // valeurs originales
    this.reponses = ['$10$', '$8$', '$15$', '$9$']
  }

  // s'occupe d'aléatoiriser les valeurs à passer à la fonction appliquerLesValeurs en vérifiant qu'on a bien 3 réponses différentes
  // Pour un qcm à n réponses, il faudrait vérifier que nombreElementsDifferents(this.reponses) < n

  versionAleatoire: () => void = () => {
    let compteur = 0
    do {
      const quartile = choice([1, 3]) // choix de Q1 ou Q3

      const effectif = randint(5, 10) // nombre de valeurs dans la série

      const valeurs: number[] = []
      while (valeurs.length < effectif) {
        const val = randint(2, 30)
        if (!valeurs.includes(val)) {
          valeurs.push(val)
        }
      }

      this.appliquerLesValeurs(valeurs, effectif, quartile)
      compteur++
    } while (
      compteur < 100 &&
      !aLeBonNombreDePropsDifferentes(this, this.reponses.length, true)
    ) // On s'assure d'avoir 5 réponses différentes, sinon on régénère
  }

  // Ici il n'y a rien à faire, on appelle juste la version aleatoire (pour un qcm aleatoirisé, c'est le fonctionnement par défaut)
  constructor() {
    super()
    this.options = { vertical: false, ordered: false }
    this.versionAleatoire()
  }
}
