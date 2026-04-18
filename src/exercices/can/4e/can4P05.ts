import { droiteParPointEtPente } from '../../../lib/2d/droites'
import { point } from '../../../lib/2d/PointAbstrait'
import { repere } from '../../../lib/2d/reperes'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { texteEnCouleurEtGras } from '../../../lib/outils/embellissements'
import { mathalea2d } from '../../../modules/mathalea2d'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
import { bleuMathalea } from '../../../lib/colors'

export const interactifReady = true
export const interactifType = 'mathLive'
export const titre =
  'Reconnaitre sur un graphique une situation de proportionnalité ou de non proportionnalité'
export const dateDePublication = '23/01/2021' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag
export const dateDeModifImportante = '02/11/2024' // Une date de modification importante au format 'jj/mm/aaaa' pour affichage temporaire d'un tag
/**
 * @author Guillaume Valmont
 */
export const uuid = '8171f'

export const refs = {
  'fr-fr': ['can4P05'],
  'fr-ch': [],
}
export default class ImageSpline extends ExerciceSimple {
  lineaire: boolean
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.spacing = 1.5
    this.spacingCorr = 1.5
    this.nbQuestions = 1

    this.formatChampTexte = KeyboardType.vFON
    this.lineaire = false
  }

  nouvelleVersion() {
    const r = repere({ xMin: -7, xMax: 7, yMin: -6, yMax: 6 })
    let c
    let pente: number
    const type = choice(['lineaire', 'affine'])
    switch (type) {
      case 'lineaire':
        {
          pente = randint(-15, 15, 0) / 5
          const OrdX0 = 0
          c = droiteParPointEtPente(point(0, OrdX0), pente, '', bleuMathalea)
          this.reponse = ['O', 'Oui', 'oui', 'o', 'OUI']
          this.correction = `C'est une droite qui passe par l'origine.<br>Ce graphique représente donc une situation de proportionnalité.<br>
         Réponse : OUI (${texteEnCouleurEtGras('O')}) `
        }
        break
      case 'affine':
      default:
        {
          pente = randint(-15, 15, 0) / 5
          this.lineaire = false
          const OrdX0 = randint(Math.round(-1 + pente), Math.round(1 + pente), [
            pente,
            0,
          ])
          c = droiteParPointEtPente(point(0, OrdX0), pente, '', bleuMathalea)
          this.reponse = ['N', 'Non', 'NON', 'non']
          this.correction = `C'est bien une droite mais elle ne passe pas par l'origine.<br>Ce graphique ne représente donc pas une situation de proportionnalité.<br>
        Réponse : NON (${texteEnCouleurEtGras('N')}) `
        }
        break
    }

    this.correction += `<!-- Coefficient directeur de la droite : ${pente}-->` // Question jamais posée se base sur la correction, j'ajoute donc ce commentaire pour avoir plus de deux questions possibles
    this.question = `Ce graphique représente-t-il une situation de proportionnalité ?<br>
    
    ${mathalea2d({ xmin: -7, xmax: 7, ymin: -6, ymax: 6, pixelsParCm: 17, style: 'margin: auto', scale: 0.6 }, r, c)}`
    if (this.interactif) {
      this.question += '<br> Répondre par OUI (saisir O) ou NON (saisir N).<br>'
    }
  }
}
