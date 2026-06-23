import { afficheLongueurSegment } from '../../../lib/2d/afficheLongueurSegment'
import { codageAngle } from '../../../lib/2d/angles'
import { pointAbstrait } from '../../../lib/2d/PointAbstrait'
import { polygoneAvecNom } from '../../../lib/2d/polygones'
import { pointAdistance } from '../../../lib/2d/utilitairesPoint'
import { choice } from '../../../lib/outils/arrayOutils'
import { texteEnCouleur } from '../../../lib/outils/embellissements'
import { creerNomDePolygone } from '../../../lib/outils/outilString'
import { texNombre } from '../../../lib/outils/texNombre'
import { mathalea2d } from '../../../modules/mathalea2d'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Déterminer une longueur avec des triangles semblables'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Jean-claude Lhote
 * Créé pendant l'été 2021

*/
export const uuid = 'f0b9b'

export const refs = {
  'fr-fr': ['can4G01'],
  'fr-ch': [],
}
export default class LongueurPythagore extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1

    this.optionsChampTexte = { texteApres: ' $\\text{cm}$' }
  }

  nouvelleVersion() {
    const triplet = choice([
      [6, 8, 10],
      [9, 12, 15],
      [12, 16, 20],
      [15, 20, 25],
      [18, 24, 30],
      [21, 28, 35],
      [24, 32, 40],
      [27, 36, 45],
      [30, 40, 50],
    ])
    const nom = creerNomDePolygone(3, ['QD'])
    const [a, b, c] = triplet
    const A = pointAbstrait(0, 0, nom[0])
    const B = pointAdistance(A, b, 0, nom[1]) // triplet[1] sera la longueur c
    const C = pointAdistance(B, a, 90, nom[2]) // triplet[0] sera la longueur a
    const pol = polygoneAvecNom(A, B, C) // donc triplet[2] sera la longueur b
    const lc = afficheLongueurSegment(B, A)
    const la = afficheLongueurSegment(C, B)
    const lb = afficheLongueurSegment(A, C)

    const objets = []
    switch (randint(0, 2)) {
      case 0: // calcul du côté horizontal de l'angle droit
        objets.push(pol[0], pol[1], la, lb, codageAngle(A, B, C))
        this.question = `Un triangle dont les côtés ont pour longueurs $3$, $4$ et $5$ est un triangle rectangle.<br>

      Calculer la longueur $${nom[0]}${nom[1]}$.<br>
      
      `
        this.question +=
          mathalea2d(
            {
              xmin: -b / 10 - 1,
              xmax: b + b / 10 + 1,
              ymin: -b / 10 - 1,
              ymax: C.y + b / 10 + 1,
              pixelsParCm: 140 / b,
              scale: 4 / b,
              center: true,
            },
            objets,
          ) + '<br>'
        this.correction = ` $${nom[0]}${nom[1]}=${b}\\text{ cm}$.`
        this.reponse = b

        this.canReponseACompleter = ` $${nom[0]}${nom[1]}=\\ldots\\text{ cm}$.`
        break
      case 1: // calcul du côté vertical de l'angle droit
        objets.push(pol[0], pol[1], lc, lb, codageAngle(A, B, C))
        this.question = `Un triangle dont les côtés ont pour longueurs $3$, $4$ et $5$ est un triangle rectangle.<br>
        Calculer la longueur $${nom[1]}${nom[2]}$.<br>
        
        `
        this.question +=
          mathalea2d(
            {
              xmin: -b / 10 - 1,
              xmax: b + b / 10 + 1,
              ymin: -b / 10 - 1,
              ymax: C.y + b / 10 + 1,
              pixelsParCm: 140 / b,
              scale: 4 / b,
              center: true,
            },
            objets,
          ) + '<br>'
        this.correction = ` $${nom[1]}${nom[2]}=${a}\\text{ cm}$.`
        this.reponse = a

        this.canReponseACompleter = ` $${nom[1]}${nom[2]}=\\ldots\\text{ cm}$.`
        break
      case 2: // calcul de l'hypoténuse.
        objets.push(pol[0], pol[1], la, lc, codageAngle(A, B, C))
        this.question = `Un triangle dont les côtés ont pour longueurs $3$, $4$ et $5$ est un triangle rectangle.<br>
       Calculer la longueur $${nom[0]}${nom[2]}$.<br>
       
       `
        this.question +=
          mathalea2d(
            {
              xmin: -b / 10 - 1,
              xmax: b + b / 10 + 1,
              ymin: -b / 10 - 1,
              ymax: C.y + b / 10 + 1,
              pixelsParCm: 140 / b,
              scale: 4 / b,
              center: true,
            },
            objets,
          ) + '<br>'

        this.correction = ` $${nom[0]}${nom[2]}=${c}\\text{ cm}$.`
        this.reponse = c

        this.canReponseACompleter = ` $${nom[0]}${nom[2]}=\\ldots\\text{ cm}$.`
        break
    }
    this.correction += texteEnCouleur(`<br> Mentalement : <br>
    Les deux valeurs sur le graphique montrent que ce triangle est semblable au triangle rectangle $3$, $4$, $5$ (qui correspond à un triplet pythagoricien bien connu). <br>
    Pour obtenir ses longueurs, il suffit de multiplier les nombres $3$, $4$, $5$ par $${texNombre(triplet[0] / 3)}$.<br>
    On obtient ainsi les longueurs : <br>
    $\\bullet$  $${texNombre(triplet[0] / 3)}\\times 3= ${texNombre(triplet[0])}\\text{ cm}$ ;<br>
    $\\bullet$  $${texNombre(triplet[0] / 3)}\\times 4= ${texNombre(triplet[1])}\\text{ cm}$ ;<br>
    $\\bullet$  $${texNombre(triplet[0] / 3)}\\times 5= ${texNombre(triplet[2])}\\text{ cm}$ ;<br>
    On obtient la longueur manquante par déduction.`)
  }
}
