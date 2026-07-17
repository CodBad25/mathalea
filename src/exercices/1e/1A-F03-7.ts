import { courbe } from '../../lib/2d/Courbe'
import { repere } from '../../lib/2d/reperes'
import { latex2d } from '../../lib/2d/textes'
import { choice } from '../../lib/outils/arrayOutils'
import { ecritureAlgebrique, rienSi1 } from '../../lib/outils/ecritures'
import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'
import { segment } from '../../lib/2d/segmentsVecteurs'
import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'

export const uuid = '6e14c'
export const refs = {
  'fr-fr': ['1A-F03-7'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = "Connaître la représentation graphique d'une fonction affine"
export const dateDePublication = '17/07/2026'
//
/**
 *
 * @author Gilles Mora 
 *
 */
// Une courbe à tracer : f la fonction, [xmin ; xmax] le domaine tracé, label son expression.
// repXMin / repXMax : bornes de la fenêtre en abscisse (par défaut -4 ; 4)
type Fonction = { f: (x: number) => number, xmin: number, xmax: number, label: string, repXMin?: number, repXMax?: number }

// --- Générateurs de fonctions ---
const affineNonLin = (): Fonction => { const a = choice([-2, -1, 1, 2]); const b = choice([-3, -2, -1, 1, 2, 3]); return { f: x => a * x + b, xmin: -4, xmax: 4, label: `${rienSi1(a)}x${ecritureAlgebrique(b)}` } } // ax + b (a≠0, b≠0)
const lineaire = (): Fonction => { const a = choice([-2, -1, 1, 2]); return { f: x => a * x, xmin: -4, xmax: 4, label: `${rienSi1(a)}x` } } // ax (a≠0)
const constante = (): Fonction => { const b = choice([-2, -1, 1, 2, 3]); return { f: () => b, xmin: -4, xmax: 4, label: `${b}` } } // b (b≠0)
const parabole = (): Fonction => { const a = randint(-1, 1); return { f: x => x * x + a, xmin: -4, xmax: 4, label: `x^2${a !== 0 ? ecritureAlgebrique(a) : ''}` } } // x² + a
const cube = (): Fonction => { const a = randint(-2, 2, 0); const b = randint(-1, 1); return { f: x => a * x ** 3 + b, xmin: -4, xmax: 4, label: `${rienSi1(a)}x^3${b !== 0 ? ecritureAlgebrique(b) : ''}` } } // ax³ + b
const racine = (): Fonction => { const a = randint(-2, 2, 0); return { f: x => a * Math.sqrt(x), xmin: 0, xmax: 5, label: `${rienSi1(a)}\\sqrt{x}`, repXMin: -1, repXMax: 5 } } // a√x (fenêtre -1 ; 5)
const carre = (): Fonction => { const a = randint(-2, 2, 0); return { f: x => a * x * x, xmin: -4, xmax: 4, label: `${rienSi1(a)}x^2` } } // ax²

// Trace une courbe : axes fléchés uniquement (ni grille, ni graduations, ni O/i/j)
function genererGraphique (obj: Fonction): string {
  const xmin = obj.repXMin ?? -4
  const xmax = obj.repXMax ?? 4
  const ymin = -4
  const ymax = 4

  // Repère servant uniquement au calcul de la courbe (il n'est pas dessiné)
  const r = repere({ xMin: xmin, xMax: xmax, yMin: ymin, yMax: ymax })
  const c = courbe(obj.f, { repere: r, color: 'blue', epaisseur: 2, xMin: obj.xmin, xMax: obj.xmax, step: 0.1 })
  const o = latex2d('\\text{O}', -0.3, -0.3, { letterSize: 'scriptsize' })
  const axeX = segment(xmin, 0, xmax, 0, 'black', '->')
  axeX.epaisseur = 1
  const axeY = segment(0, ymin, 0, ymax, 'black', '->')
  axeY.epaisseur = 1

  const fenetre = {
    xmin: xmin - 0.3,
    xmax: xmax + 0.3,
    ymin: ymin - 0.3,
    ymax: ymax + 0.3,
    pixelsParCm: 15,
    scale: 0.4,
    display: 'inline-block' as const,
    center: true,
  }

  return mathalea2d(fenetre, c, axeX, axeY, o)
}

export default class ReconnaitreCourbeAffine extends ExerciceQcmA {
  versionOriginale: () => void = () => {
    // Demande d'une fonction affine, valeurs fixes
    const bonne: Fonction = { f: x => 2 * x + 1, xmin: -4, xmax: 4, label: '2x+1' }
    const distracteurs: Fonction[] = [
      { f: x => x * x - 1, xmin: -4, xmax: 4, label: 'x^2-1' }, // parabole
      { f: x => x ** 3, xmin: -4, xmax: 4, label: 'x^3' }, // cube
      { f: x => Math.sqrt(x), xmin: 0, xmax: 5, label: '\\sqrt{x}', repXMin: -1, repXMax: 5 }, // racine
    ]

    this.enonce = `Une seule des courbes suivantes représente une fonction affine. Laquelle ?`

    this.correction = `La représentation graphique d'une fonction affine est une droite.<br>
Seul le graphique ci-dessous est une droite, c'est donc lui qui représente une fonction affine :<br>${genererGraphique(bonne)}`

    this.reponses = [
      genererGraphique(bonne),
      genererGraphique(distracteurs[0]),
      genererGraphique(distracteurs[1]),
      genererGraphique(distracteurs[2]),
    ]
  }

  versionAleatoire: () => void = () => {
    const type = choice(['affine', 'lineaire', 'constante'])
    let compteur = 0
    do {
      let bonne: Fonction
      let distracteurs: Fonction[]
      let motType: string
      let defPhrase: string
      let critere: string

      if (type === 'affine') {
        motType = 'affine'
        defPhrase = 'La représentation graphique d\'une fonction affine est une droite.'
        critere = 'une droite'
        bonne = affineNonLin()
        distracteurs = [parabole(), cube(), racine()]
      } else if (type === 'lineaire') {
        motType = 'linéaire'
        defPhrase = 'La représentation graphique d\'une fonction linéaire est une droite passant par l\'origine.'
        critere = 'une droite passant par l\'origine'
        bonne = lineaire()
        distracteurs = [affineNonLin(), carre(), racine()]
      } else {
        motType = 'constante'
        defPhrase = 'La représentation graphique d\'une fonction constante est une droite horizontale.'
        critere = 'une droite horizontale'
        bonne = constante()
        distracteurs = [affineNonLin(), lineaire(), carre()]
      }

      this.enonce = `Une seule des courbes suivantes représente une fonction ${motType}. Laquelle ?`

      this.correction = `${defPhrase}<br>
Seul le graphique ci-dessous est ${critere}, c'est donc lui qui représente une fonction ${motType} :<br>${genererGraphique(bonne)}`

      this.reponses = [
        genererGraphique(bonne),
        genererGraphique(distracteurs[0]),
        genererGraphique(distracteurs[1]),
        genererGraphique(distracteurs[2]),
      ]
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor () {
    super()
    this.versionAleatoire()
  }
}
