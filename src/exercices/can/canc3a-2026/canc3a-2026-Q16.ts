import { droiteGraduee } from '../../../lib/2d/DroiteGraduee'
import { fixeBordures } from '../../../lib/2d/fixeBordures'
import { MetaInteractif2d } from '../../../lib/2d/interactif2d'
import { segment } from '../../../lib/2d/segmentsVecteurs'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { ajouteFeedback } from '../../../lib/interactif/questionMathLive'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { context } from '../../../modules/context'
import { mathalea2d } from '../../../modules/mathalea2d'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Compléter sur une droite graduée'
export const interactifReady = true
export const interactifType = 'MetaInteractif2d'
export const uuid = '1c3b0'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Jean-Claude Lhote

*/
export default class Can2026CM2Q16 extends ExerciceCan {
  constructor () {
    super()
    this.formatInteractif = 'MetaInteractif2d'
  }
 
  enonce (min?: number, max?: number, abscisse?: number) {
    if (min == null || max == null || abscisse == null) {
      min = randint(0, 9)
      max = min + 1
      abscisse = min + randint(1, 9) * 0.1
    }
 
    const dg = droiteGraduee({
      Min: min,
      Max: max + 0.05,
      x: 0,
      y: 0,
      thickDistance: 1,
      thickSecDist: 0.1,
      labelsPrincipaux: false,
      thickSec: true,
      thickEpaisseur: 1,
      labelListe: [
        [min, texNombre(min, 0)],
        [max, texNombre(max, 0)]
      ],
      labelCustomDistance: 2.5,
      Unite: 10
    })
    const fleche = segment(
      (abscisse - min) * 10,
      -2,
      (abscisse - min) * 10,
      -0.5
    )
    const flecheMin = segment(0, -2, 0, -0.5)
    const flecheMax = segment((max - min) * 10, -2, (max - min) * 10, -0.5)
    flecheMax.styleExtremites = '->'
    flecheMin.styleExtremites = '->'
    fleche.styleExtremites = '->'
    fleche.tailleExtremites = context.isHtml ? 6 : 1.5
    flecheMax.tailleExtremites = context.isHtml ? 6 : 1.5
    flecheMin.tailleExtremites = context.isHtml ? 6 : 1.5
 
    const input = new MetaInteractif2d(
      [
        {
          x: (abscisse - min) * 10,
          y: -3,
          content: '%{champ1}',
          classe: KeyboardType.clavierDeBase,
          blanc: '\\ldots',
          opacity: 0.8,
          index: 0
        }
      ],
      { exercice: this, question: 0 }
    )
    const objets = [dg, fleche, input, flecheMin, flecheMax]
 
    const figure = mathalea2d(
      Object.assign(
        { scale: 0.38 },
        fixeBordures(objets, { rxmin: -0.7, rxmax: 0.3 })
      ),
      objets
    )
    this.reponse = { field0: { value: texNombre(abscisse, 1) } }
    this.question =
      'Complète.' +
      figure +
      (context.isHtml
        ? `<span id="resultatCheckEx${this.numeroExercice}Q0"></span>` +
          ajouteFeedback(this, 0)
        : '')
 
    this.correction = `Un pas de graduation est égal à $0{,}1$ et il y a $${texNombre((abscisse - min) / 0.1, 0)}$ pas de graduation entre $${texNombre(min, 0)}$ et la flèche.<br>
    Donc l'abscisse de la flèche est $${miseEnEvidence(texNombre(abscisse, 1))}$.`
 
    this.formatChampTexte = KeyboardType.clavierDeBase
    this.canEnonce = 'Complète.' 
     this.canReponseACompleter = figure
  }
 
  nouvelleVersion () {
    this.canOfficielle || this.sup
      ? this.enonce(2, 3, 2.4)
      : this.enonce()
  }
}