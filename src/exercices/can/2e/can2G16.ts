import { droiteGraduee } from '../../../lib/2d/DroiteGraduee'
import { texteParPosition } from '../../../lib/2d/textes'
import { choisitLettresDifferentes } from '../../../lib/outils/aleatoires'
import { choice } from '../../../lib/outils/arrayOutils'
import FractionEtendue from '../../../modules/FractionEtendue'
import { mathalea2d } from '../../../modules/mathalea2d'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
import { orangeMathalea, bleuMathalea } from '../../../lib/colors'
export const titre = 'Trouver un coefficient de colinéarité (graphique)'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'

/**
 * @author Gilles Mora
 */
export const dateDePublication = '22/06/2022'
export const uuid = 'c0d5f'

export const refs = {
  'fr-fr': ['can2G16'],
  'fr-ch': ['3G90-13'],
}
export default class VecteursCol extends ExerciceSimple {
  constructor() {
    super()

    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const a = randint(3, 10) // abscisse de C
    const b = randint(1, a - 1) // abscisse de B l'abscisse de A est 0
    const noms = choisitLettresDifferentes(3, 'O', true)

    const f1 = new FractionEtendue(b, a)
    const f2 = new FractionEtendue(a, b)
    const f3 = new FractionEtendue(b, a).multiplieEntier(-1)
    const f4 = new FractionEtendue(a, b).multiplieEntier(-1)
    switch (
      choice([1, 2, 3, 4]) //
    ) {
      case 1:
        // ${texteCentre(`$\\overrightarrow{${noms[0]}${noms[1]}}= ....\\overrightarrow{${noms[0]}${noms[2]}}$`)}

        this.reponse = f1
        this.question = `Donner le coefficient de colinéarité $k$ de l’égalité vectorielle : $\\overrightarrow{${noms[0]}${noms[1]}}= k\\,\\overrightarrow{${noms[0]}${noms[2]}}$<br><br>`
        this.question += mathalea2d(
          {
            xmin: -1,
            ymin: -1,
            xmax: 15.5,
            ymax: 1.5,
            scale: 0.5,
            style: 'margin: auto',
          },
          droiteGraduee({
            Unite: 1.5,
            Min: 0,
            Max: a,
            x: 0,
            y: 0,
            thickOffset: 0,
            axeStyle: '|-',
            pointListe: [
              [0, ''],
              [b, ''],
              [a, ''],
            ],
            pointCouleur: bleuMathalea,
            labelsPrincipaux: false,
          }),
          texteParPosition(`${noms[0]}`, 0, 0.9, 0, bleuMathalea, 2),
          texteParPosition(`${noms[1]}`, b * 1.5, 0.9, 0, bleuMathalea, 2),
          texteParPosition(`${noms[2]}`, a * 1.5, 0.9, 0, bleuMathalea, 2),
        )
        this.optionsChampTexte = { texteAvant: '$k$ a pour valeur :' }
        this.correction = `Les vecteurs $\\overrightarrow{${noms[0]}${noms[1]}}$ et $\\overrightarrow{${noms[0]}${noms[2]}}$
       sont colinéaires de même sens. Le nombre cherché est donc positif.<br>
       Les graduations indiquent $${noms[0]}${noms[2]}=${a}$ et $${noms[0]}${noms[1]}=${b}$. <br>
       La valeur de $k$ est donc : $${f1.texFraction} ${f1.texSimplificationAvecEtapes(true, orangeMathalea)}$.<br>
       Ainsi, $\\overrightarrow{${noms[0]}${noms[1]}}= ${f1.texFractionSimplifiee}\\overrightarrow{${noms[0]}${noms[2]}}$
      `
        this.canEnonce =
          `Compléter l’égalité vectorielle.<br>
      
        ` +
          mathalea2d(
            {
              xmin: -1,
              ymin: -1,
              xmax: 15.5,
              ymax: 1.5,
              scale: 0.5,
              style: 'margin: auto',
            },
            droiteGraduee({
              Unite: 1.5,
              Min: 0,
              Max: a,
              x: 0,
              y: 0,
              thickOffset: 0,
              axeStyle: '|-',
              pointListe: [
                [0, `${noms[0]}`],
                [b, `${noms[1]}`],
                [a, `${noms[2]}`],
              ],
              pointCouleur: bleuMathalea,
              labelsPrincipaux: false,
            }),
          )

        this.canReponseACompleter = `$\\overrightarrow{${noms[0]}${noms[1]}}= \\ldots\\overrightarrow{${noms[0]}${noms[2]}}$`
        break

      case 2:
        // ${texteCentre(`$\\overrightarrow{${noms[0]}${noms[2]}}= ....\\overrightarrow{${noms[0]}${noms[1]}}$`)}

        this.reponse = f2
        this.question = `Donner le coefficient de colinéarité $k$ de l’égalité vectorielle : $\\overrightarrow{${noms[0]}${noms[2]}}= k\\,\\overrightarrow{${noms[0]}${noms[1]}}$<br><br>`
        this.question += mathalea2d(
          {
            xmin: -1,
            ymin: -1,
            xmax: 15.5,
            ymax: 1.5,
            scale: 0.5,
            style: 'margin: auto',
          },
          droiteGraduee({
            Unite: 1.5,
            Min: 0,
            Max: a,
            x: 0,
            y: 0,
            thickOffset: 0,
            axeStyle: '|-',
            pointListe: [
              [0, ''],
              [b, ''],
              [a, ''],
            ],
            pointCouleur: bleuMathalea,
            labelsPrincipaux: false,
          }),
          texteParPosition(`${noms[0]}`, 0, 0.9, 0, bleuMathalea, 2),
          texteParPosition(`${noms[1]}`, b * 1.5, 0.9, 0, bleuMathalea, 2),
          texteParPosition(`${noms[2]}`, a * 1.5, 0.9, 0, bleuMathalea, 2),
        )
        this.optionsChampTexte = { texteAvant: '$k$ a pour valeur :' }
        this.correction = `Les vecteurs $\\overrightarrow{${noms[0]}${noms[1]}}$ et $\\overrightarrow{${noms[0]}${noms[2]}}$
       sont colinéaires de même sens. Le nombre cherché est donc positif.<br>
       Les graduations indiquent $${noms[0]}${noms[1]}=${b}$ et $${noms[0]}${noms[2]}=${a}$. <br>
       La valeur de $k$ est donc : $${f2.texFraction} ${f2.texSimplificationAvecEtapes(true, orangeMathalea)}$.<br>
       Ainsi, $\\overrightarrow{${noms[0]}${noms[2]}}= ${f2.texFractionSimplifiee}\\overrightarrow{${noms[0]}${noms[1]}}$
      `
        this.canEnonce =
          `Compléter l’égalité vectorielle.<br>
      
      ` +
          mathalea2d(
            {
              xmin: -1,
              ymin: -1,
              xmax: 15.5,
              ymax: 1.5,
              scale: 0.5,
              style: 'margin: auto',
            },
            droiteGraduee({
              Unite: 1.5,
              Min: 0,
              Max: a,
              x: 0,
              y: 0,
              thickOffset: 0,
              axeStyle: '|-',
              pointListe: [
                [0, `${noms[0]}`],
                [b, `${noms[1]}`],
                [a, `${noms[2]}`],
              ],
              pointCouleur: bleuMathalea,
              labelsPrincipaux: false,
            }),
          )

        this.canReponseACompleter = `$\\overrightarrow{${noms[0]}${noms[2]}}= ....\\overrightarrow{${noms[0]}${noms[1]}}$`

        break

      case 3:
        // ${texteCentre(`$\\overrightarrow{${noms[0]}${noms[1]}}= ....\\overrightarrow{${noms[2]}${noms[0]}}$`)}

        this.reponse = f3
        this.question = `Donner le coefficient de colinéarité $k$ de l’égalité vectorielle : $\\overrightarrow{${noms[0]}${noms[1]}}= k\\,\\overrightarrow{${noms[2]}${noms[0]}}$<br><br>`
        this.question += mathalea2d(
          {
            xmin: -1,
            ymin: -1,
            xmax: 15.5,
            ymax: 1.5,
            scale: 0.5,
            style: 'margin: auto',
          },
          droiteGraduee({
            Unite: 1.5,
            Min: 0,
            Max: a,
            x: 0,
            y: 0,
            thickOffset: 0,
            axeStyle: '|-',
            pointListe: [
              [0, ''],
              [b, ''],
              [a, ''],
            ],
            pointCouleur: bleuMathalea,
            labelsPrincipaux: false,
          }),
          texteParPosition(`${noms[0]}`, 0, 0.9, 0, bleuMathalea, 2),
          texteParPosition(`${noms[1]}`, b * 1.5, 0.9, 0, bleuMathalea, 2),
          texteParPosition(`${noms[2]}`, a * 1.5, 0.9, 0, bleuMathalea, 2),
        )
        this.optionsChampTexte = { texteAvant: '$k$ a pour valeur :' }
        this.correction = `Les vecteurs $\\overrightarrow{${noms[0]}${noms[1]}}$ et $\\overrightarrow{${noms[2]}${noms[0]}}$
         sont colinéaires de sens contraires. Le nombre cherché est donc négatif.<br>
         Les graduations indiquent $${noms[0]}${noms[2]}=${a}$ et $${noms[0]}${noms[1]}=${b}$. <br>
         La valeur de $k$ est donc : $${f3.texFraction} ${f3.texSimplificationAvecEtapes(true, orangeMathalea)}$.<br>
         Ainsi, $\\overrightarrow{${noms[0]}${noms[1]}}= ${f3.texFractionSimplifiee}\\overrightarrow{${noms[2]}${noms[0]}}$
        `
        this.canEnonce =
          `Compléter l’égalité vectorielle.<br>
      
        ` +
          mathalea2d(
            {
              xmin: -1,
              ymin: -1,
              xmax: 15.5,
              ymax: 1.5,
              scale: 0.5,
              style: 'margin: auto',
            },
            droiteGraduee({
              Unite: 1.5,
              Min: 0,
              Max: a,
              x: 0,
              y: 0,
              thickOffset: 0,
              axeStyle: '|-',
              pointListe: [
                [0, `${noms[0]}`],
                [b, `${noms[1]}`],
                [a, `${noms[2]}`],
              ],
              pointCouleur: bleuMathalea,
              labelsPrincipaux: false,
            }),
          )

        this.canReponseACompleter = `$\\overrightarrow{${noms[0]}${noms[1]}}= ....\\overrightarrow{${noms[2]}${noms[0]}}$`

        break

      case 4:
        // ${texteCentre(`$\\overrightarrow{${noms[0]}${noms[2]}}= ....\\overrightarrow{${noms[1]}${noms[0]}}$`)}

        this.reponse = f4
        this.question = `Donner le coefficient de colinéarité $k$ de l’égalité vectorielle : $\\overrightarrow{${noms[0]}${noms[2]}}= k\\,\\overrightarrow{${noms[1]}${noms[0]}}$<br><br>`
        this.question += mathalea2d(
          {
            xmin: -1,
            ymin: -1,
            xmax: 15.5,
            ymax: 1.5,
            scale: 0.5,
            style: 'margin: auto',
          },
          droiteGraduee({
            Unite: 1.5,
            Min: 0,
            Max: a,
            x: 0,
            y: 0,
            thickOffset: 0,
            axeStyle: '|-',
            pointListe: [
              [0, ''],
              [b, ''],
              [a, ''],
            ],
            pointCouleur: bleuMathalea,
            labelsPrincipaux: false,
          }),
          texteParPosition(`${noms[0]}`, 0, 0.9, 0, bleuMathalea, 2),
          texteParPosition(`${noms[1]}`, b * 1.5, 0.9, 0, bleuMathalea, 2),
          texteParPosition(`${noms[2]}`, a * 1.5, 0.9, 0, bleuMathalea, 2),
        )
        this.optionsChampTexte = { texteAvant: '$k$ a pour valeur :' }
        this.correction = `Les vecteurs $\\overrightarrow{${noms[1]}${noms[0]}}$ et $\\overrightarrow{${noms[0]}${noms[2]}}$
           sont colinéaires de sens contraires. Le nombre cherché est donc négatif.<br>
           Les graduations indiquent $${noms[1]}${noms[0]}=${b}$ et $${noms[0]}${noms[2]}=${a}$. <br>
           La valeur de $k$ est donc : $${f4.texFraction} ${f4.texSimplificationAvecEtapes(true, orangeMathalea)}$.<br>
           Ainsi, $\\overrightarrow{${noms[0]}${noms[2]}}= ${f4.texFractionSimplifiee}\\overrightarrow{${noms[1]}${noms[0]}}$
          `
        this.canEnonce =
          `Compléter l’égalité vectorielle.<br>
      
          ` +
          mathalea2d(
            {
              xmin: -1,
              ymin: -1,
              xmax: 15.5,
              ymax: 1.5,
              scale: 0.5,
              style: 'margin: auto',
            },
            droiteGraduee({
              Unite: 1.5,
              Min: 0,
              Max: a,
              x: 0,
              y: 0,
              thickOffset: 0,
              axeStyle: '|-',
              pointListe: [
                [0, `${noms[0]}`],
                [b, `${noms[1]}`],
                [a, `${noms[2]}`],
              ],
              pointCouleur: bleuMathalea,
              labelsPrincipaux: false,
            }),
          )

        this.canReponseACompleter = `$\\overrightarrow{${noms[0]}${noms[2]}}= ....\\overrightarrow{${noms[1]}${noms[0]}}$`

        break
    }
  }
}
