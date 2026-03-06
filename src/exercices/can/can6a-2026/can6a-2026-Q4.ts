import { fixeBordures } from '../../../lib/2d/fixeBordures'
import { grille } from '../../../lib/2d/Grille'
import { pointAbstrait } from '../../../lib/2d/PointAbstrait'
import { segment } from '../../../lib/2d/segmentsVecteurs'
import { latex2d } from '../../../lib/2d/textes'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { context } from '../../../modules/context'
import { mathalea2d } from '../../../modules/mathalea2d'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'

export const titre = 'Calculer une valeur dans un partage'
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'dodgm'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}

/**
 * @author Gilles Mora

*/
export default class Can20266Q4 extends ExerciceCan {
 enonce(nbCarreaux?: number, l1?: number) {
    if (nbCarreaux == null || l1 == null) {
      nbCarreaux = choice([5, 6])
      l1 = randint(2, 12) * nbCarreaux
    }
    const l2 = l1 / nbCarreaux

    // Grille : nbCarreaux de large, 1 carreau de haut
    const grillage = grille(0, 0, nbCarreaux, 1, 'gray', 1, 1)

    // Flèche du haut indiquant la longueur totale
    const flecheHaut = segment(pointAbstrait(0, 1.5), pointAbstrait(nbCarreaux, 1.5))
    flecheHaut.styleExtremites = '<->'
    flecheHaut.epaisseur =  context.isHtml ? 1.5 : 1
    const long = latex2d(`${texNombre(l1, 0)}`, nbCarreaux / 2, 2, {
      letterSize: 'normalsize',
    })

    // Flèche du bas indiquant la longueur d'un carreau (à trouver)
    const flecheBas = segment(pointAbstrait(0, -0.5), pointAbstrait(1, -0.5))
    flecheBas.styleExtremites = '<->'
    flecheBas.epaisseur = context.isHtml ? 1.5 : 1
    const longCherche = latex2d(this.interactif ? '?':'\\ldots', 0.5, -1, {
      letterSize: 'normalsize',
    })

    const objets = [grillage, flecheHaut, long, flecheBas, longCherche]

    const graphique = mathalea2d(
      Object.assign({  pixelsParCm: 30, scale: 0.7 }, fixeBordures(objets)),
      objets,
    )
if (this.interactif) {
    this.question = graphique
      this.optionsChampTexte = { texteAvant: 'La longueur d\'un carreau est  ', texteApres: ' .' }
    } else {this.question = 'Complète.'
    this.question += graphique
    }
    this.formatChampTexte = KeyboardType.clavierDeBase
    this.reponse = texNombre(l2, 0)
    
    this.canEnonce = 'Complète.'
    this.canReponseACompleter = graphique
    this.correction = `La bande mesure $${texNombre(l1, 0)}$ et fait $${nbCarreaux}$ carreaux de long, ainsi la longueur d'un carreau est $${texNombre(l1, 0)}\\div ${nbCarreaux} = ${miseEnEvidence(texNombre(l2, 0))}$.`
  }

  nouvelleVersion() {
    this.canOfficielle ? this.enonce(5, 55) : this.enonce()
  }
}
