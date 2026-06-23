import { droiteGraduee } from '../../../lib/2d/DroiteGraduee'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { texteEnCouleur } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { mathalea2d } from '../../../modules/mathalea2d'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
import { bleuMathalea } from '../../../lib/colors'
export const titre = 'Trouver un nombre sur une droite graduée'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Jean-claude Lhote
 * Date de publication septembre 2021

 */
export const uuid = 'fc190'

export const refs = {
  'fr-fr': ['canc3N02'],
  'fr-ch': [],
}
export default class SuiteSurDroiteGraduee extends ExerciceSimple {
  constructor() {
    super()

    this.typeExercice = 'simple'

    this.formatChampTexte = KeyboardType.clavierDeBase
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const a = randint(1, 6) // choix de la table = écart entre deux graduations
    const c = Math.floor(randint(10, 40) / a) * a // premier nombre.
    const maListe: [number, string][] = []
    for (let i = 0; i < 3; i++) {
      maListe.push([c + a * i, texNombre(c + a * i)])
    }
    const d = droiteGraduee({
      Unite: 3 / a,
      Min: c - a,
      Max: c + 3 * a,
      x: 0,
      y: 0,
      thickDistance: a,
      thickSec: false,
      thickOffset: 0,
      axeStyle: '->',
      pointListe: [[c + a * 3, '']],
      labelListe: maListe,
      pointCouleur: bleuMathalea,
      pointStyle: 'x',
      labelsPrincipaux: false,
    })
    this.reponse = c + 3 * a
    this.question = `Quel est le nombre repéré par la croix ?<br>
    
    `

    this.question += mathalea2d(
      {
        xmin: -1,
        ymin: -1.5,
        xmax: 15,
        ymax: 1.5,
        scale: 0.6,
        center: true,
      },
      d,
    )
    this.correction = `${texteEnCouleur('Comme les graduations vont de ' + a)} ${texteEnCouleur('en ' + a)} ${texteEnCouleur(', le nombre repéré par la croix correspond à ')} ${texteEnCouleur(String(c + 2 * a))} ${texteEnCouleur(' + ' + a)} ${texteEnCouleur("donc c'est " + texNombre(c + 3 * a) + '.')}`
  }
}
