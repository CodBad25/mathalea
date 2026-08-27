import { courbe } from '../../lib/2d/Courbe'
import { repere } from '../../lib/2d/reperes'
import { latex2d } from '../../lib/2d/textes'
import { bleuMathalea } from '../../lib/colors'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { tableauDeVariation } from '../../lib/mathFonctions/etudeFonction'
import { choice, shuffle } from '../../lib/outils/arrayOutils'
import {
  miseEnEvidence,
  texteEnCouleurEtGras,
} from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  "Reconnaître la courbe d'une fonction à partir de celle de sa dérivée"
export const dateDePublication = '26/08/2026'
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

export const uuid = 'faf4b'
export const refs = {
  'fr-fr': ['TSA3-46'],
  'fr-ch': [],
}

type FonctionNumerique = (x: number) => number

function graphique(
  fonction: FonctionNumerique,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  scale: number,
  nomCourbe?: string,
): string {
  const yUnite = 0.25
  const r = repere({
    xMin,
    xMax,
    yMin,
    yMax,
    yUnite,
    xLabelMin: xMin,
    xLabelMax: xMax,
    yLabelMin: yMin,
    yLabelMax: yMax,
    xThickDistance: 1,
    yThickDistance: 5,
    axeXStyle: '->',
    axeYStyle: '->',
    grilleSecondaire: true,
    grilleSecondaireXDistance: 1,
    grilleSecondaireYDistance: 5,
    grilleSecondaireXMin: xMin,
    grilleSecondaireXMax: xMax,
    grilleSecondaireYMin: yMin,
    grilleSecondaireYMax: yMax,
  })

  const abscisseLabel = xMax - 0.55
  const ordonneeLabel = Math.max(
    yMin + 3,
    Math.min(yMax - 3, fonction(abscisseLabel)),
  )

  return mathalea2d(
    {
      xmin: xMin - 0.4,
      xmax: xMax + 0.4,
      ymin: yMin * yUnite - 0.2,
      ymax: yMax * yUnite + 0.3,
      pixelsParCm: 20,
      scale,
      center: !context.isHtml,
      centerLatex: true,
    },
    r,
    courbe(fonction, {
      repere: r,
      xMin,
      xMax,
      yMin,
      yMax,
      color: bleuMathalea,
      epaisseur: 2.5,
      step: 0.04,
    }),
    ...(nomCourbe === undefined
      ? []
      : [
          latex2d(
            nomCourbe,
            abscisseLabel - 0.45,
            ordonneeLabel * yUnite + 0.45,
            {
              color: bleuMathalea,
              letterSize: 'small',
            },
          ),
        ]),
  )
}

/**
 * Reconnaître la courbe d'une primitive à partir de celle de sa dérivée.
 * @author Stéphane Guyon
 */
export default class CourbeFonctionDepuisDerivee extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion(): void {
    this.autoCorrection = []
    const centre = randint(-1, 1)
    const demiEcartRacines = randint(1, 2)
    const coefficient = choice([-3, 3])
    const xMin = centre - 3
    const xMax = centre + 3
    const yMin = -25
    const yMax = 25

    const fPrime = (x: number) =>
      coefficient * ((x - centre) ** 2 - demiEcartRacines ** 2)
    const f = (x: number) =>
      (coefficient / 3) * (x - centre) ** 3 -
      coefficient * demiEcartRacines ** 2 * (x - centre)
    const fSeconde = (x: number) => 2 * coefficient * (x - centre)
    const primitiveDeMoinsFPrime = (x: number) => -f(x)

    const graphiqueDerivee = graphique(
      fPrime,
      xMin,
      xMax,
      yMin,
      yMax,
      0.4,
      "\\mathcal C_{f'}",
    )
    const definitionsPropositions = shuffle([
      {
        fonction: f,
        statut: true,
        nature: 'fonction' as const,
      },
      {
        fonction: fSeconde,
        statut: false,
        nature: 'deriveeSeconde' as const,
      },
      {
        fonction: fPrime,
        statut: false,
        nature: 'derivee' as const,
      },
      {
        fonction: primitiveDeMoinsFPrime,
        statut: false,
        nature: 'variationsOpposees' as const,
      },
    ])
    const propositions = definitionsPropositions.map((proposition, index) => ({
      texte: graphique(
        proposition.fonction,
        xMin,
        xMax,
        yMin,
        yMax,
        0.4,
        `\\mathcal C_${index + 1}`,
      ),
      statut: proposition.statut,
    }))

    const enonce = `On donne ci-dessous la courbe représentative $\\mathcal C_{f'}$ de la fonction dérivée $f'$ d'une fonction $f$ définie et dérivable sur $\\mathbb R$.<br>
    ${graphiqueDerivee}<br>
    Parmi les quatre courbes suivantes, laquelle peut représenter la fonction $f$ ?`

    this.autoCorrection[0] = {
      enonce,
      options: { ordered: true, radio: true, vertical: false },
      propositions,
    }
    const qcm = propositionsQcm(this, 0)

    const racineGauche = centre - demiEcartRacines
    const racineDroite = centre + demiEcartRacines
    const positifExterieur = coefficient > 0
    const signeExterieur = positifExterieur ? '+' : '-'
    const signeInterieur = positifExterieur ? '-' : '+'
    const tableauSignes = tableauDeVariation({
      tabInit: [
        [
          ['$x$', 2, 20],
          ["$f'(x)$", 2, 35],
        ],
        [
          '$-\\infty$',
          25,
          `$${texNombre(racineGauche)}$`,
          25,
          `$${texNombre(racineDroite)}$`,
          25,
          '$+\\infty$',
          25,
        ],
      ],
      tabLines: [
        [
          'Line',
          20,
          '',
          10,
          signeExterieur,
          20,
          'z',
          20,
          signeInterieur,
          20,
          'z',
          20,
          signeExterieur,
          10,
        ],
      ],
      espcl: 4.5,
      deltacl: 0.8,
      lgt: 3,
      scale: 0.9,
      hauteurLignes: [18, 18],
    })
    const variations = positifExterieur
      ? `croissante sur $]-\\infty\\,;\\,${texNombre(racineGauche)}]$, décroissante sur $[${texNombre(racineGauche)}\\,;\\,${texNombre(racineDroite)}]$, puis croissante sur $[${texNombre(racineDroite)}\\,;\\,+\\infty[$`
      : `décroissante sur $]-\\infty\\,;\\,${texNombre(racineGauche)}]$, croissante sur $[${texNombre(racineGauche)}\\,;\\,${texNombre(racineDroite)}]$, puis décroissante sur $[${texNombre(racineDroite)}\\,;\\,+\\infty[$`
    const deductionVariations = positifExterieur
      ? `Sur $]-\\infty\\,;\\,${texNombre(racineGauche)}[$, $f'>0$, donc $f$ est croissante. Sur $]${texNombre(racineGauche)}\\,;\\,${texNombre(racineDroite)}[$, $f'<0$, donc $f$ est décroissante. Enfin, sur $]${texNombre(racineDroite)}\\,;\\,+\\infty[$, $f'>0$, donc $f$ est croissante.`
      : `Sur $]-\\infty\\,;\\,${texNombre(racineGauche)}[$, $f'<0$, donc $f$ est décroissante. Sur $]${texNombre(racineGauche)}\\,;\\,${texNombre(racineDroite)}[$, $f'>0$, donc $f$ est croissante. Enfin, sur $]${texNombre(racineDroite)}\\,;\\,+\\infty[$, $f'<0$, donc $f$ est décroissante.`
    const variationsOpposees = positifExterieur
      ? `décroissante sur $]-\\infty\\,;\\,${texNombre(racineGauche)}]$, croissante sur $[${texNombre(racineGauche)}\\,;\\,${texNombre(racineDroite)}]$, puis décroissante sur $[${texNombre(racineDroite)}\\,;\\,+\\infty[$`
      : `croissante sur $]-\\infty\\,;\\,${texNombre(racineGauche)}]$, décroissante sur $[${texNombre(racineGauche)}\\,;\\,${texNombre(racineDroite)}]$, puis croissante sur $[${texNombre(racineDroite)}\\,;\\,+\\infty[$`
    const variationsDeFPrime = positifExterieur
      ? `décroissante sur $]-\\infty\\,;\\,${texNombre(centre)}]$, puis croissante sur $[${texNombre(centre)}\\,;\\,+\\infty[$`
      : `croissante sur $]-\\infty\\,;\\,${texNombre(centre)}]$, puis décroissante sur $[${texNombre(centre)}\\,;\\,+\\infty[$`
    const tableauVariations = tableauDeVariation({
      tabInit: [
        [
          ['$x$', 2, 20],
          ['$f(x)$', 3, 50],
        ],
        [
          '$-\\infty$',
          25,
          `$${texNombre(racineGauche)}$`,
          25,
          `$${texNombre(racineDroite)}$`,
          25,
          '$+\\infty$',
          25,
        ],
      ],
      tabLines: [
        positifExterieur
          ? ['Var', 10, '-/', 20, '+/', 20, '-/', 20, '+/', 10]
          : ['Var', 10, '+/', 20, '-/', 20, '+/', 20, '-/', 10],
      ],
      espcl: 4.5,
      deltacl: 0.8,
      lgt: 3,
      scale: 0.7,
      hauteurLignes: [18, 28],
    })

    const analysesCourbes = definitionsPropositions
      .map((proposition, index) => {
        const nom = `$\\mathcal C_${index + 1}$`
        switch (proposition.nature) {
          case 'fonction':
            return `${texteEnCouleurEtGras(`Courbe ${nom} :`, 'black')} la fonction représentée est ${variations}. Ses variations sont exactement celles attendues : cette courbe convient.`
          case 'deriveeSeconde':
            return `${texteEnCouleurEtGras(`Courbe ${nom} :`, 'black')} elle représente une fonction affine, ${coefficient > 0 ? 'croissante' : 'décroissante'} sur tout $\\mathbb R$. Elle ne présente pas les mêmes variations que $f$. On l'élimine. Il s'agit en fait de la courbe de $f''$.`
          case 'derivee':
            return `${texteEnCouleurEtGras(`Courbe ${nom} :`, 'black')} la fonction représentée est ${variationsDeFPrime}. Elle ne change de sens qu'en $x=${texNombre(centre)}$, alors que $f$ doit changer de sens en $${texNombre(racineGauche)}$ et $${texNombre(racineDroite)}$. On l'élimine. Il s'agit de la courbe de $f'$ donnée dans l'énoncé.`
          case 'variationsOpposees':
            return `${texteEnCouleurEtGras(`Courbe ${nom} :`, 'black')} la fonction représentée est ${variationsOpposees}. Elle change de sens aux bonnes abscisses, mais elle est décroissante lorsque $f'>0$ et croissante lorsque $f'<0$. Ses variations sont exactement opposées à celles attendues. On l'élimine.`
        }
      })
      .join('<br><br>')
    const numeroBonneCourbe =
      definitionsPropositions.findIndex((proposition) => proposition.statut) + 1

    const styleQcm = context.isHtml
      ? `<style>
          #exercice${this.numeroExercice} .my-3 {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
            align-items: center;
            justify-items: center;
          }
        </style>`
      : ''
    this.listeQuestions[0] = `${enonce}${styleQcm}${qcm.texte}`

    this.listeCorrections[0] = `${texteEnCouleurEtGras("1. Tableau de signes de $f'$", 'black')}<br>
    La courbe $\\mathcal C_{f'}$ coupe l'axe des abscisses en $${texNombre(racineGauche)}$ et $${texNombre(racineDroite)}$. Elle permet de lire le tableau de signes suivant :<br><br>
    ${tableauSignes}<br>
    ${texteEnCouleurEtGras('2. Variations attendues de $f$', 'black')}<br>
    ${deductionVariations}<br>
    Ainsi, $f$ est ${variations}. On obtient le tableau de variations suivant :<br><br>
    ${tableauVariations}<br>
    Sa courbe doit avoir des tangentes horizontales aux abscisses $${texNombre(racineGauche)}$ et $${texNombre(racineDroite)}$ et respecter ces variations.<br><br>
    ${texteEnCouleurEtGras('3. Examen des courbes proposées', 'black')}<br>
    ${analysesCourbes}<br><br>
    La seule courbe compatible est donc $${miseEnEvidence(`\\mathcal C_${numeroBonneCourbe}`)}$.<br>
    ${qcm.texteCorr}`

    listeQuestionsToContenu(this)
  }
}
