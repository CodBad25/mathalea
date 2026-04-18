import { repere } from '../../lib/2d/reperes'
import { latex2d } from '../../lib/2d/textes'
import { choice } from '../../lib/outils/arrayOutils'
import { texteEnCouleurEtGras } from '../../lib/outils/embellissements'

import { courbe } from '../../lib/2d/Courbe'
import { deuxColonnes } from '../../lib/format/miseEnPage'
import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'
import { bleuMathalea } from '../../lib/colors'
export const dateDePublication = '20/09/2025'
export const uuid = '5586f'
/**
 *
 * @author Gilles Mora
 */
export const refs = {
  'fr-fr': ['1A-F04-4'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre =
  "Déterminer le nombre de solutions de l'équation $f(x)=0$ avec un graphique"
export default class auto1AF4c extends ExerciceQcmA {
  versionOriginale: () => void = () => {
    const o = latex2d('\\text{O}', -0.3, -0.3, { letterSize: 'scriptsize' })

    const fonc = (x: number) => 0.3 * (x ** 3 - 7.8 * x - 3)

    const repere1 = repere({
      xMin: -4.05,
      xMax: 3,
      yMin: -4.05,
      yMax: 3,
      grilleX: true,
      grilleY: true,
      xThickMin: -4,
      yThickMin: -4,
      yThickMax: 4,
      thickHauteur: 0.1,
      xLabelListe: [-3, -2, -1, 1, 2],
      yLabelListe: [-3, -2, -1, 1, 2],
      axesEpaisseur: 1.5,
    })

    const objetsEnonce = [repere1] //, courbe1

    this.enonce = `${deuxColonnes(
      `On donne ci-contre la courbe représentative $\\mathscr{C}$ d'une fonction $f$ définie sur $[-3\\,;\\,2]$.<br>
   On s'intéresse à l'équation $f(x)=0$.<br><br>Une seule de ces propositions est exacte :`,
      mathalea2d(
        Object.assign(
          { pixelsParCm: 30, scale: 0.7, style: 'margin: auto' },
          {
            xmin: -4,
            ymin: -4,
            xmax: 3,
            ymax: 3,
          },
        ),

        objetsEnonce,
        o,
        courbe(fonc, {
          xMin: -3,
          xMax: 2,
          repere: repere1,
          color: bleuMathalea,
          epaisseur: 2,
        }),
      ),
    )}<br>`

    this.correction = `Il y a deux points d'intersection entre la courbe et l'axe des abscisses.<br>
    Les abscisses de ces points sont les solutions de l'équation. Ces abscisses sont négatives. <br>
    Par conséquent,   ${texteEnCouleurEtGras("l'équation $f(x)=0$ admet exactement deux solutions et ces solutions sont négatives.")}.`

    this.reponses = [
      "L'équation $f(x)=0$ admet exactement deux solutions et ces solutions sont négatives.",
      "L'équation $f(x)=0$ admet exactement deux solutions et ces solutions sont de signes contraires.",
      "L'équation $f(x)=0$ admet exactement  une solution.",
      "L'équation $f(x)=0$ n'admet aucune solution.",
    ]
  }

  versionAleatoire = () => {
    const cas = choice([1, 2, 3, 4])

    switch (cas) {
      case 1: // cas 2 solutions négatives
        {
          const o = latex2d('\\text{O}', -0.3, -0.3, {
            letterSize: 'scriptsize',
          })
          const a = randint(-4, 4, [-1, 0, 1]) / 10
          const x1 = randint(-25, -19) / 10
          const x2 = randint(-9, -4) / 10

          const fonc = (x: number) => a * (x - x1) * (x - x2) * (x - 2.5)

          const repere1 = repere({
            xMin: -4.05,
            xMax: 3,
            yMin: -4.05,
            yMax: 5.05,
            grilleX: true,
            grilleY: true,
            xThickMin: -4,
            yThickMin: -4,
            yThickMax: 5,
            thickHauteur: 0.1,
            xLabelListe: [-3, -2, -1, 1, 2],
            yLabelListe: [-3, -2, -1, 1, 2, 3, 4],
          })

          const objetsEnonce = [repere1]

          this.enonce = `${deuxColonnes(
            `On donne ci-contre la courbe représentative $\\mathscr{C}$ d'une fonction $f$ définie sur $[-3\\,;\\,2]$.<br>
         On s'intéresse à l'équation $f(x)=0$.<br><br>Une seule de ces propositions est exacte :`,
            mathalea2d(
              Object.assign(
                { pixelsParCm: 30, scale: 0.7, style: 'margin: auto' },
                {
                  xmin: -4,
                  ymin: -4,
                  xmax: 3,
                  ymax: 5,
                },
              ),

              objetsEnonce,
              o,
              courbe(fonc, {
                xMin: -3,
                xMax: 2,
                repere: repere1,
                color: bleuMathalea,
                epaisseur: 2,
              }),
            ),
          )}<br>`

          this.correction = `Il y a deux points d'intersection entre la courbe et l'axe des abscisses.<br>
    Les abscisses de ces points sont les solutions de l'équation. Ces abscisses sont négatives. <br>
    Par conséquent,   ${texteEnCouleurEtGras("l'équation $f(x)=0$ admet exactement deux solutions et ces solutions sont négatives.")}.`

          this.reponses = [
            "L'équation $f(x)=0$ admet exactement deux solutions et ces solutions sont négatives.",
            "L'équation $f(x)=0$ admet exactement deux solutions et ces solutions sont de signes contraires.",
            "L'équation $f(x)=0$ admet exactement  une solution.",
            "L'équation $f(x)=0$ n'admet aucune solution.",
          ]
        }
        break

      case 2: // cas 2 solutions de signes contraires
        {
          const o = latex2d('\\text{O}', -0.3, -0.3, {
            letterSize: 'scriptsize',
          })
          const a = randint(-3, 3, [-1, 0, 1]) / 10
          const x1 = randint(7, 15) / 10
          const x2 = randint(-15, -6) / 10

          const fonc = (x: number) => a * (x - x1) * (x - x2) * (x + 3.5)

          const repere1 = repere({
            xMin: -4.05,
            xMax: 3,
            yMin: -4.05,
            yMax: 5.05,
            grilleX: true,
            grilleY: true,
            xThickMin: -4,
            yThickMin: -4,
            yThickMax: 5,
            thickHauteur: 0.1,
            xLabelListe: [-3, -2, -1, 1, 2],
            yLabelListe: [-3, -2, -1, 1, 2, 3, 4],
          })

          const objetsEnonce = [repere1]

          this.enonce = `${deuxColonnes(
            `On donne ci-contre la courbe représentative $\\mathscr{C}$ d'une fonction $f$ définie sur $[-3\\,;\\,2]$.<br>
         On s'intéresse à l'équation $f(x)=0$.<br><br>Une seule de ces propositions est exacte :`,
            mathalea2d(
              Object.assign(
                { pixelsParCm: 30, scale: 0.7, style: 'margin: auto' },
                {
                  xmin: -4,
                  ymin: -4,
                  xmax: 3,
                  ymax: 5,
                },
              ),

              objetsEnonce,
              o,
              courbe(fonc, {
                xMin: -3,
                xMax: 2,
                repere: repere1,
                color: bleuMathalea,
                epaisseur: 2,
              }),
            ),
          )}<br>`

          this.correction = `Il y a deux points d'intersection entre la courbe et l'axe des abscisses.<br>
    Les abscisses de ces points sont les solutions de l'équation. Ces abscisses sont de signes contraires. <br>
    Par conséquent,   ${texteEnCouleurEtGras("l'équation $f(x)=0$ admet exactement deux solutions et ces solutions sont de signes contraires")}.`

          this.reponses = [
            "L'équation $f(x)=0$ admet exactement deux solutions et ces solutions sont de signes contraires.",
            "L'équation $f(x)=0$ admet exactement deux solutions et ces solutions sont négatives.",
            "L'équation $f(x)=0$ admet exactement  une solution.",
            "L'équation $f(x)=0$ n'admet aucune solution.",
          ]
        }
        break

      case 3: // cas 1 solution exactement
        {
          const o = latex2d('\\text{O}', -0.3, -0.3, {
            letterSize: 'scriptsize',
          })

          const a = randint(-1, 1, [0]) / 10
          const x1 = randint(7, 15) / 10

          const fonc = (x: number) => a * (x - x1) * (x + 4.6) * (x + 3.8)

          const repere1 = repere({
            xMin: -4.05,
            xMax: 3,
            yMin: -5.05,
            yMax: 5,
            grilleX: true,
            grilleY: true,
            xThickMin: -4,
            yThickMin: -4,
            yThickMax: 5,
            thickHauteur: 0.1,
            xLabelListe: [-3, -2, -1, 1, 2],
            yLabelListe: [-3, -2, -1, 1, 2, 3, 4],
          })

          const objetsEnonce = [repere1]

          this.enonce = `${deuxColonnes(
            `On donne ci-contre la courbe représentative $\\mathscr{C}$ d'une fonction $f$ définie sur $[-3\\,;\\,2]$.<br>
         On s'intéresse à l'équation $f(x)=0$.<br><br>Une seule de ces propositions est exacte :`,
            mathalea2d(
              Object.assign(
                { pixelsParCm: 30, scale: 0.7, style: 'margin: auto' },
                {
                  xmin: -4,
                  ymin: -4,
                  xmax: 3,
                  ymax: 5,
                },
              ),

              objetsEnonce,
              o,
              courbe(fonc, {
                xMin: -3,
                xMax: 2,
                repere: repere1,
                color: bleuMathalea,
                epaisseur: 2,
              }),
            ),
          )}<br>`

          this.correction = `Il y a un point d'intersection entre la courbe et l'axe des abscisses.<br>
    Par conséquent,   ${texteEnCouleurEtGras("l'équation $f(x)=0$ admet exactement une solution.")}.`

          this.reponses = [
            "L'équation $f(x)=0$ admet exactement  une solution.",
            "L'équation $f(x)=0$ admet exactement deux solutions et ces solutions sont de signes contraires.",
            "L'équation $f(x)=0$ admet exactement deux solutions et ces solutions sont négatives.",
            "L'équation $f(x)=0$ n'admet aucune solution.",
          ]
        }
        break

      case 4: // cas aucune solution
      default:
        {
          const o = latex2d('\\text{O}', -0.3, -0.3, {
            letterSize: 'scriptsize',
          })
          const a = randint(-1, 1, [0]) / 10
          const x1 = randint(23, 27) / 10
          const x2 = randint(-33, -38) / 10

          const fonc = (x: number) => a * (x - x1) * (x - x2) * (x + 4)
          const repere1 = repere({
            xMin: -4.05,
            xMax: 3,
            yMin: -4.05,
            yMax: 5.05,
            grilleX: true,
            grilleY: true,
            xThickMin: -4,
            yThickMin: -4,
            yThickMax: 5,
            thickHauteur: 0.1,
            xLabelListe: [-3, -2, -1, 1, 2],
            yLabelListe: [-3, -2, -1, 1, 2, 3, 4],
          })

          const objetsEnonce = [repere1]

          this.enonce = `${deuxColonnes(
            `On donne ci-contre la courbe représentative $\\mathscr{C}$ d'une fonction $f$ définie sur $[-3\\,;\\,2]$.<br>
         On s'intéresse à l'équation $f(x)=0$.<br><br>Une seule de ces propositions est exacte :`,
            mathalea2d(
              Object.assign(
                { pixelsParCm: 30, scale: 0.7, style: 'margin: auto' },
                {
                  xmin: -4,
                  ymin: -4,
                  xmax: 3,
                  ymax: 5,
                },
              ),

              objetsEnonce,
              o,
              courbe(fonc, {
                xMin: -3,
                xMax: 2,
                repere: repere1,
                color: bleuMathalea,
                epaisseur: 2,
              }),
            ),
          )}<br>`

          this.correction = `Il n'y a aucun point d'intersection entre la courbe et l'axe des abscisses.<br>
    Par conséquent,   ${texteEnCouleurEtGras("l'équation $f(x)=0$ n'admet aucune solution")}.`

          this.reponses = [
            "L'équation $f(x)=0$ n'admet aucune solution.",
            "L'équation $f(x)=0$ admet exactement  une solution.",
            "L'équation $f(x)=0$ admet exactement deux solutions et ces solutions sont de signes contraires.",
            "L'équation $f(x)=0$ admet exactement deux solutions et ces solutions sont négatives.",
          ]
        }
        break
    }
  }

  constructor() {
    super()
    this.versionAleatoire()
    this.options = { vertical: true, ordered: false }
  }
}
