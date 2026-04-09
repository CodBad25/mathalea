import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Manipuler les conversions de longueurs'
export const dateDePublication = '27/07/2025'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true

/**
 * @author Éric Elter (d'après can6M13 de Gilles Mora)

 */
export const uuid = '9d3f3'

export const refs = {
  'fr-fr': ['can6M19', 'auto6M1A-flash1'],
  'fr-ch': [],
}
export default class CombienDeFoisMetres extends ExerciceSimple {
  constructor() {
    super()
    this.nbQuestions = 1

    this.typeExercice = 'simple'
  }

  nouvelleVersion() {
    const unite = 'm'
    const choix = choice([true, false])
    this.optionsChampTexte = { texteApres: 'fois.' }
    this.canReponseACompleter =
      'La réponse correcte à cette question est : <br>$\\ldots$'
    let Choixprefixes: [number, string][]
    let prefixes: [number, string] = [10, 'h']
    switch (choice([0, 1, 1, 2, 2, 3, 3, 4])) {
      case 0:
        Choixprefixes = [
          [10, 'h'],
          [100, 'da'],
          [1000, ''],
          [10000, 'd'],
        ]
        prefixes = choice(Choixprefixes)

        this.question = `Le professeur demande à un élève : <br>
      ${choix ? `« $1\\text{ k${unite}}$, c'est combien de fois plus grand que $1\\text{ ${prefixes[1]}${unite}}$ ? »` : `« $1\\text{ ${prefixes[1]}${unite}}$, c'est combien de fois plus petit que $1\\text{ k${unite}}$ ? »`}<br>
        La réponse correcte à cette question est : ${this.interactif ? '' : '$\\ldots$'}`

        this.correction = ` $1\\text{ k${unite}}$  $= ${miseEnEvidence(texNombre(prefixes[0]))}\\text{ ${prefixes[1]}${unite}}$`
        this.canEnonce = `Le professeur demande à un élève :<br> 
        « $1\\text{ k${unite}}$, c'est combien de fois plus grand que $1\\text{ ${prefixes[1]}${unite}}$ ? » `
        break

      case 1:
        Choixprefixes = [
          [10, 'da'],
          [100, ''],
          [1000, 'd'],
          [10000, 'c'],
        ]
        prefixes = choice(Choixprefixes)

        this.question = `Le professeur demande à un élève : <br>
          ${choix ? `« $1\\text{ h${unite}}$, c'est combien de fois plus grand que $1\\text{ ${prefixes[1]}${unite}}$ ? »` : `« $1\\text{ ${prefixes[1]}${unite}}$, c'est combien de fois plus petit que $1\\text{ h${unite}}$ ? »`}<br>
            La réponse correcte à cette question est : ${this.interactif ? '' : '$\\ldots$'}`

        this.correction = ` $1\\text{ h${unite}}$  $= ${miseEnEvidence(texNombre(prefixes[0]))}\\text{ ${prefixes[1]}${unite}}$`
        this.canEnonce = `Le professeur demande à un élève :<br> 
            « $1\\text{ h${unite}}$, c'est combien de fois plus grand que $1\\text{ ${prefixes[1]}${unite}}$ ? » `

        break
      case 2:
        Choixprefixes = [
          [10, ''],
          [100, 'd'],
          [1000, 'c'],
          [10000, 'm'],
        ]
        prefixes = choice(Choixprefixes)

        this.question = `Le professeur demande à un élève : <br>
              ${choix ? `« $1\\text{ da${unite}}$, c'est combien de fois plus grand que $1\\text{ ${prefixes[1]}${unite}}$ ? »` : `« $1\\text{ ${prefixes[1]}${unite}}$, c'est combien de fois plus petit que $1\\text{ da${unite}}$ ? »`}<br>
                La réponse correcte à cette question est : ${this.interactif ? '' : '$\\ldots$'}`

        this.correction = ` $1\\text{ da${unite}}$  $= ${miseEnEvidence(texNombre(prefixes[0]))}\\text{ ${prefixes[1]}${unite}}$`
        this.canEnonce = `Le professeur demande à un élève : <br>
                « $1\\text{ da${unite}}$, c'est combien de fois plus grand que $1\\text{ ${prefixes[1]}${unite}}$ ? » `

        break

      case 3:
        Choixprefixes = [
          [10, 'd'],
          [100, 'c'],
          [1000, 'm'],
        ]
        prefixes = choice(Choixprefixes)

        this.question = `Le professeur demande à un élève : <br>
                  ${choix ? `« $1\\text{ ${unite}}$, c'est combien de fois plus grand que $1\\text{ ${prefixes[1]}${unite}}$ ? »` : `« $1\\text{ ${prefixes[1]}${unite}}$, c'est combien de fois plus petit que $1\\text{ ${unite}}$ ? »`}<br>
                    La réponse correcte à cette question est : ${this.interactif ? '' : '$\\ldots$'}`

        this.correction = ` $1\\text{ ${unite}}$  $= ${miseEnEvidence(texNombre(prefixes[0]))}\\text{ ${prefixes[1]}${unite}}$`
        this.canEnonce = `Le professeur demande à un élève : <br>
                    « $1\\text{ ${unite}}$, c'est combien de fois plus grand que $1\\text{ ${prefixes[1]}${unite}}$ ? » `

        break

      case 4:
        Choixprefixes = [
          [10, 'c'],
          [100, 'm'],
        ]
        prefixes = choice(Choixprefixes)

        this.question = `Le professeur demande à un élève :<br> 
                      ${choix ? `« $1\\text{ d${unite}}$, c'est combien de fois plus grand que $1\\text{ ${prefixes[1]}${unite}}$ ? »` : `« $1\\text{ ${prefixes[1]}${unite}}$, c'est combien de fois plus petit que $1\\text{ d${unite}}$ ? »`}<br>
                        La réponse correcte à cette question est : ${this.interactif ? '' : '$\\ldots$'}`

        this.correction = ` $1\\text{ d${unite}}$  $= ${miseEnEvidence(texNombre(prefixes[0]))}\\text{ ${prefixes[1]}${unite}}$`
        this.canEnonce = `Le professeur demande à un élève : <br>
                        « $1\\text{ d${unite}}$, c'est combien de fois plus grand que $1\\text{ ${prefixes[1]}${unite}}$ ? » `

        break
    }
    this.reponse = prefixes[0]
  }
}
