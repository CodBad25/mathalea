import { bleuMathalea } from '../../lib/colors'
import { shuffle } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import ExerciceQcmA from '../ExerciceQcmA'
import {
  construireGraphique,
  expressions,
  type TypeCourbe,
} from './2F22-3'

export const titre =
  'Reconnaître une fonction de référence à partir de sa courbe'
export const dateDePublication = '09/08/2026'
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'

export const uuid = 'f214a'
export const refs = {
  'fr-fr': ['2F22-4'],
  'fr-ch': [],
}

/**
 * @author Stéphane Guyon
 */
export default class ReconnaitreFonctionDepuisCourbe extends ExerciceQcmA {
  private ordreDesCas = shuffle([1, 2, 3])
  private indiceDuCas = 0

  private casDisponibles(): number[] {
    switch (this.sup3) {
      case 1:
        return [1, 2, 3]
      case 2:
        return [2, 3, 4, 5]
      case 3:
      default:
        return [1, 2, 3, 4, 5]
    }
  }

  private appliquerLesValeurs(cas: number): void {
    let fonctionDemandee: TypeCourbe
    switch (cas) {
      case 1:
        fonctionDemandee = 'valeurAbsolue'
        break
      case 2:
        fonctionDemandee = 'carre'
        break
      case 3:
        fonctionDemandee = 'inverse'
        break
      case 4:
        fonctionDemandee = 'cube'
        break
      case 5:
        fonctionDemandee = 'racineCarree'
        break
      default:
        fonctionDemandee = 'valeurAbsolue'
    }

    let distracteursPossibles: TypeCourbe[]
    let commentaire: string
    switch (fonctionDemandee) {
      case 'valeurAbsolue':
        distracteursPossibles = [
          'identite',
          'opposeIdentite',
          'opposeValeurAbsolue',
          'inverse',
          'cube',
        ]
        commentaire =
          'La courbe est formée de deux demi-droites de sommet $O$ et elle est située au-dessus de l’axe des abscisses : il s’agit de la fonction valeur absolue.'
        break
      case 'carre':
        distracteursPossibles = [
          'opposeCarre',
          'valeurAbsolue',
          'inverse',
          'identite',
          'cube',
        ]
        commentaire =
          'La courbe est une parabole de sommet $O$, symétrique par rapport à l’axe des ordonnées et située au-dessus de l’axe des abscisses : il s’agit de la fonction carré.'
        break
      case 'inverse':
        distracteursPossibles = [
          'opposeInverse',
          'carre',
          'valeurAbsolue',
          'identite',
          'opposeIdentite',
          'cube',
        ]
        commentaire =
          'La courbe possède deux branches situées dans les premier et troisième quadrants, et les axes sont ses asymptotes : il s’agit de la fonction inverse.'
        break
      case 'cube':
        distracteursPossibles = [
          'identite',
          'opposeIdentite',
          'carre',
          'valeurAbsolue',
          'inverse',
          'opposeInverse',
        ]
        commentaire =
          'La courbe passe par l’origine, elle est strictement croissante et possède un point d’inflexion en $O$ : il s’agit de la fonction cube.'
        break
      case 'racineCarree':
        distracteursPossibles = [
          'valeurAbsolue',
          'carre',
          'inverse',
          'identite',
          'cube',
        ]
        commentaire =
          'La courbe part de l’origine, n’est tracée que pour $x\\geqslant 0$ et elle est strictement croissante : il s’agit de la fonction racine carrée.'
        break
      default:
        distracteursPossibles = ['carre', 'inverse', 'identite']
        commentaire = ''
    }

    const graphique = construireGraphique(fonctionDemandee)
    const distracteurs = shuffle(distracteursPossibles).slice(0, 3)

    this.enonce = `On donne ci-dessous la courbe représentative d’une fonction $f$.<br>${graphique}<br>
    Quelle expression définit la fonction $f$ ?`
    this.reponses = [fonctionDemandee, ...distracteurs].map(
      (type) => `$f(x)=${expressions[type]}$`,
    )
    this.correction = `${commentaire}<br>
    Ainsi, $${miseEnEvidence(`f(x)=${expressions[fonctionDemandee]}`, bleuMathalea)}$.`
  }

  versionAleatoire: () => void = () => {
    const cas = this.ordreDesCas[this.indiceDuCas % this.ordreDesCas.length]
    this.indiceDuCas++
    this.appliquerLesValeurs(cas)
  }

  nouvelleVersion(): void {
    this.ordreDesCas = shuffle(this.casDisponibles())
    this.indiceDuCas = 0
    super.nouvelleVersion()
  }

  constructor() {
    super()
    this.sup3 = 3
    this.besoinFormulaire3Numerique = [
      'Fonctions proposées',
      3,
      '1 : Nouveau programme 2026\n2 : Années de transition\n3 : Toutes les fonctions de référence',
    ]
    this.besoinFormulaireCaseACocher = false
    this.options = { vertical: false, ordered: false }
    this.ordreDesCas = shuffle(this.casDisponibles())
    this.versionAleatoire()
  }
}
