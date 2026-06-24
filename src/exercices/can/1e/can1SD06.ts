import { courbe } from '../../../lib/2d/Courbe'
import { Repere } from '../../../lib/2d/reperes'
import { latex2d, Latex2d, TexteParPoint } from '../../../lib/2d/textes'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { ecritureAlgebrique, rienSi1 } from '../../../lib/outils/ecritures'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { texNombre } from '../../../lib/outils/texNombre'
import { mathalea2d } from '../../../modules/mathalea2d'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
import { bleuMathalea } from '../../../lib/colors'
export const titre = 'Lire graphiquement la valeur de $a$ dans $ax^2+b$'
export const interactifReady = true
export const interactifType = 'mathLive'

// Les exports suivants sont optionnels mais au moins la date de publication semble essentielle
export const dateDePublication = '17/06/2022' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag
export const dateDeModifImportante = '01/08/2025'
/**
 *
 * @author Gilles Mora

 */
export const uuid = '2ccca'
export const refs = {
  'fr-fr': ['can1SD06'],
  'fr-ch': ['1mF3-20'],
}
export default class LectureGraphiqueParaboleA extends ExerciceSimple {
  constructor() {
    super()
    this.versionQcmDisponible = true
    this.nbQuestions = 1
    this.optionsChampTexte = { texteAvant: '$a=$' }
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecFraction
  }

  nouvelleVersion() {
    let a: number
    let b: number
    let o: TexteParPoint | Latex2d
    let f: (x: number) => number
    let r: Repere

    switch (choice([1, 2])) {
      case 1: // cas parabole a>0
        a = randint(1, 8) / 2
        b = randint(-6, 6, 0) / 2
        o = latex2d('\\text{O}', -0.3, -0.3, { letterSize: 'scriptsize' })

        f = function (x) {
          return a * x ** 2 + b
        }
        if (b > 0) {
          r = new Repere({
            yUnite: 2,
            xUnite: 2,
            xMin: -3,
            yMin: -1,
            yMax: 6,
            xMax: 3,
            thickHauteur: 0.2,
            xThickMin: -4,
            xLabelMin: -2,
            xLabelMax: 2,
            yLabelMax: 5,
            yLabelMin: -2,
            grilleSecondaire: true,
            grilleSecondaireOpacite: 1,
            grilleSecondaireYDistance: 1,
            grilleSecondaireXDistance: 1,
            grilleSecondaireCouleur: 'black',
            axesEpaisseur: 1.5,
            grilleSecondaireYMin: -2.1,
            grilleSecondaireYMax: 12.1,
            grilleSecondaireXMin: -3.1,
            grilleSecondaireXMax: 3.1,
            xLabelEcart: 0.8,
            yLabelEcart: 0.8,
          })
          f = (x) => a * x ** 2 + b

          this.question = `Voici la représentation graphique d'une fonction $f$  définie sur $\\mathbb{R}$ par ${this.versionQcm ? '$f(x)=ax^2+b$' : `$f(x)=ax^2${ecritureAlgebrique(b)}$`}.<br>`
          this.question +=
            mathalea2d(
              {
                xmin: -6,
                xmax: 6,
                ymin: -2,
                ymax: 12,
                pixelsParCm: 20,
                scale: 0.5,
                center: true,
              },
              r,
              o,
              courbe(f, { repere: r, color: bleuMathalea, epaisseur: 2 }),
            ) + '<br>'
          this.question += `${this.versionQcm ? 'À partir de cette représentation graphique, on a : ' : 'À partir de cette représentation graphique, déterminer la valeur de $a$.<br>'}`
        } else {
          r = new Repere({
            yUnite: 2,
            xUnite: 2,
            xMin: -3,
            yMin: -3,
            yMax: 3,
            xMax: 3,
            thickHauteur: 0.2,
            xThickMin: -6,
            yThickMin: -6,
            xLabelMin: -2,
            xLabelMax: 2,
            yLabelMax: 2,
            yLabelMin: -2,
            grilleSecondaireOpacite: 1,
            axesEpaisseur: 1.5,
            grilleOpacite: 1,
            grilleSecondaire: true,
            grilleSecondaireYDistance: 1,
            grilleSecondaireXDistance: 1,
            grilleSecondaireYMin: -3.1,
            grilleSecondaireYMax: 3.1,
            grilleSecondaireXMin: -3.1,
            grilleSecondaireXMax: 3.1,
            xLabelEcart: 0.8,
            yLabelEcart: 0.8,
          })

          f = (x) => a * x ** 2 + b

          this.question = `Voici la représentation graphique d'une fonction $f$  définie sur $\\mathbb{R}$ par ${this.versionQcm ? '$f(x)=ax^2+b$' : `$f(x)=ax^2${ecritureAlgebrique(b)}$`}.<br> `
          this.question +=
            mathalea2d(
              {
                xmin: -6,
                xmax: 6,
                ymin: -6,
                ymax: 6,
                pixelsParCm: 20,
                scale: 0.5,
                center: true,
              },
              r,
              o,
              courbe(f, { repere: r, color: bleuMathalea, epaisseur: 2 }),
            ) + '<br>'
          this.question += `${this.versionQcm ? 'À partir de cette représentation graphique, on a : ' : 'À partir de cette représentation graphique, déterminer la valeur de $a$.<br>'}`
        }

        break

      case 2: // cas parabole a<0
      default:
        a = randint(-4, -1) / 2
        b = randint(-6, 6, 0) / 2
        o = latex2d('\\text{O}', -0.3, -0.3, { letterSize: 'scriptsize' })

        f = function (x) {
          return a * x ** 2 + b
        }
        if (b > 0) {
          r = new Repere({
            yUnite: 2,
            xUnite: 2,
            xMin: -3,
            yMin: -2,
            yMax: 4,
            xMax: 3,
            thickHauteur: 0.2,
            xThickMin: -6,
            yThickMin: -4,
            xLabelMin: -2,
            xLabelMax: 2,
            yLabelMax: 3,
            yLabelMin: -1,
            grilleSecondaireOpacite: 1,
            axesEpaisseur: 1.5,
            grilleOpacite: 1,
            grilleSecondaire: true,
            grilleSecondaireYDistance: 1,
            grilleSecondaireXDistance: 1,
            grilleSecondaireYMin: -4.1,
            grilleSecondaireYMax: 4.1,
            grilleSecondaireXMin: -3.1,
            grilleSecondaireXMax: 3.1,
            xLabelEcart: 0.8,
            yLabelEcart: 0.8,
          })

          f = (x) => a * x ** 2 + b

          this.question =
            `Voici la représentation graphique d'une fonction $f$  définie sur $\\mathbb{R}$ par ${this.versionQcm ? '$f(x)=ax^2+b$' : `$f(x)=ax^2${ecritureAlgebrique(b)}$`}.<br> ` +
            mathalea2d(
              {
                xmin: -6,
                xmax: 6,
                ymin: -4.1,
                ymax: 8.1,
                pixelsParCm: 20,
                scale: 0.5,
                center: true,
              },
              r,
              o,
              courbe(f, { repere: r, color: bleuMathalea, epaisseur: 2 }),
            ) +
            '<br>'
          this.question += `${this.versionQcm ? 'À partir de cette représentation graphique, on a : ' : 'À partir de cette représentation graphique, déterminer la valeur de $a$.<br>'}`
        } else {
          r = new Repere({
            yUnite: 2,
            xUnite: 2,
            xMin: -3,
            yMin: -5,
            yMax: 1,
            xMax: 3,
            thickHauteur: 0.2,
            xThickMin: -6,
            yThickMin: -10,
            xLabelMin: -2,
            xLabelMax: 2,
            yLabelMax: 0,
            yLabelMin: -4,
            grilleSecondaireOpacite: 1,
            axesEpaisseur: 1.5,
            grilleOpacite: 1,
            grilleSecondaire: true,
            grilleSecondaireYDistance: 1,
            grilleSecondaireXDistance: 1,
            grilleSecondaireYMin: -5.1,
            grilleSecondaireYMax: 1.1,
            grilleSecondaireXMin: -3.1,
            grilleSecondaireXMax: 3.1,
            xLabelEcart: 0.8,
            yLabelEcart: 0.8,
          })

          f = (x) => a * x ** 2 + b

          this.question =
            `Voici la représentation graphique d'une fonction $f$  définie sur $\\mathbb{R}$ par ${this.versionQcm ? '$f(x)=ax^2+b$' : `$f(x)=ax^2${ecritureAlgebrique(b)}$`}.<br> ` +
            mathalea2d(
              {
                xmin: -6,
                xmax: 6,
                ymin: -10.1,
                ymax: 2.1,
                pixelsParCm: 20,
                scale: 0.5,
                center: true,
              },
              r,
              o,
              courbe(f, { repere: r, color: bleuMathalea, epaisseur: 2 }),
            ) +
            '<br>'
          this.question += `${this.versionQcm ? 'À partir de cette représentation graphique, on a : ' : 'À partir de cette représentation graphique, déterminer la valeur de $a$.<br>'}`
        }

        break
    }
    this.correction = `${this.versionQcm ? `La valeur de $b$ est donnée par l'image de $0$ par $f$ (ordonnée du point d'intersection entre la courbe et l'axe des ordonnées).<br> Ainsi, $b=${miseEnEvidence(texNombre(b, 1))}$.<br>` : ''}La valeur de $a$ s'obtient (par exemple) grâce à l'image de $1$ par la fonction $f$.<br>
          On lit $f(1)=${texNombre(f(1), 1)}$. D'où, $a\\times 1^2${ecritureAlgebrique(b)}=${texNombre(f(1), 1)}$, soit $a=${miseEnEvidence(texNombre(a, 1))}$.<br>
          Ainsi, $f(x)=${rienSi1(a)}x^2${ecritureAlgebrique(b)}$.`
    this.reponse = this.versionQcm
      ? `$a=${texNombre(a, 1)}$ et $b=${texNombre(b, 1)}$`
      : a
    this.distracteurs = [
      `$a=${texNombre(b, 1)}$ et $b=${texNombre(b, 1)}$`,
      `$a=${texNombre(a + 0.5, 1)}$ et $b=${texNombre(b, 1)}$`,
      `$a=${texNombre(-a, 1)}$ et $b=${texNombre(b, 1)}$`,
      `$a=${texNombre(a, 1)}$ et $b=${texNombre(-b, 1)}$`,
    ]
    this.listeCanEnonces.push(this.question)
    this.listeCanReponsesACompleter.push('$a=\\ldots$')
  }
}
