import { context } from '../../modules/context'
import { courbe } from '../../lib/2d/Courbe'
import { repere } from '../../lib/2d/reperes'
import { segment } from '../../lib/2d/segmentsVecteurs'
import { latex2d } from '../../lib/2d/textes'
import { bleuMathalea } from '../../lib/colors'
import { choixDeroulant } from '../../lib/customElements/ListeDeroulanteElement'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { choice } from '../../lib/outils/arrayOutils'
import { texteEnCouleurEtGras } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { mathalea2d } from '../../modules/mathalea2d'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = "Déterminer graphiquement les signes de $f$, $f'$ et $f''$"
export const dateDePublication = '16/08/2026'
export const interactifReady = true
export const interactifType = 'liste-deroulante'
export const uuid = 'dc696'

export const refs = {
  'fr-fr': ['TSA3-43'],
  'fr-ch': [],
}

type Signe = 'positif' | 'négatif' | 'nul'

type ScenarioRelatif = {
  decalageF: number
  decalageFPrime: number
  decalageFSeconde: number
}

const scenariosRelatifs: ScenarioRelatif[] = [
  {
    decalageF: 0,
    decalageFPrime: -10,
    decalageFSeconde: -5,
  },
  {
    decalageF: -5,
    decalageFPrime: 10,
    decalageFSeconde: 0,
  },
  {
    decalageF: 5,
    decalageFPrime: 0,
    decalageFSeconde: 0,
  },
  {
    decalageF: -10,
    decalageFPrime: 0,
    decalageFSeconde: 5,
  },
  {
    decalageF: 0,
    decalageFPrime: 5,
    decalageFSeconde: 10,
  },
  {
    decalageF: 10,
    decalageFPrime: -10,
    decalageFSeconde: -5,
  },
]

const centres = [-10, -5, 5, 10]
const orientations: Array<1 | -1> = [1, -1]

const choixSignes = [
  { label: 'Choisir un signe', value: '' },
  { label: 'positif', value: 'positif' },
  { label: 'négatif', value: 'négatif' },
  { label: 'nul', value: 'nul' },
]

function signe(valeur: number): Signe {
  if (Math.abs(valeur) < 1e-9) return 'nul'
  return valeur > 0 ? 'positif' : 'négatif'
}

function graphique(
  fonction: (x: number) => number,
  derivee: (x: number) => number,
  abscisseTangente: number,
  orientation: 1 | -1,
  xMin: number,
  xMax: number,
): string {
  const xUnite = 20 / (xMax - xMin)
  const yMin = -18
  const yMax = 18
  const yUnite = 12 / (yMax - yMin)
  const xGraduations = Array.from(
    { length: (xMax - xMin) / 5 + 1 },
    (_, index) => xMin + 5 * index,
  )
  const yGraduations = [-15, -10, -5, 0, 5, 10, 15]
  const r = repere({
    xMin,
    xMax,
    xUnite,
    yMin,
    yMax,
    yUnite,
    xLabelMin: xMin,
    xLabelMax: xMax,
    yLabelMin: -15,
    yLabelMax: 15,
    xThickDistance: 5,
    xLabelDistance: 5,
    yThickDistance: 5,
    yLabelDistance: 5,
    grilleX: true,
    grilleXListe: xGraduations,
    grilleY: true,
    grilleYListe: yGraduations,
    grilleOpacite: 0.25,
    grilleSecondaire: false,
  })
  const cadre = [
    segment(xMin * xUnite, yMin * yUnite, xMax * xUnite, yMin * yUnite),
    segment(xMax * xUnite, yMin * yUnite, xMax * xUnite, yMax * yUnite),
    segment(xMax * xUnite, yMax * yUnite, xMin * xUnite, yMax * yUnite),
    segment(xMin * xUnite, yMax * yUnite, xMin * xUnite, yMin * yUnite),
  ]
  const xCourbeLabel = xMax - 2.5
  const yCourbeLabel = fonction(xCourbeLabel) * yUnite
  const label = latex2d(
    '\\mathcal C_f',
    xCourbeLabel * xUnite + 0.4,
    yCourbeLabel + orientation * 0.55,
    { color: bleuMathalea, letterSize: 'small' },
  )
  const xTangenteMin = Math.max(xMin, abscisseTangente - 5)
  const xTangenteMax = Math.min(xMax, abscisseTangente + 5)
  const ordonneeTangente = fonction(abscisseTangente)
  const penteTangente = derivee(abscisseTangente)
  const penteTangenteTracee = penteTangente
  const tangente = segment(
    xTangenteMin * xUnite,
    (ordonneeTangente +
      penteTangenteTracee * (xTangenteMin - abscisseTangente)) *
      yUnite,
    xTangenteMax * xUnite,
    (ordonneeTangente +
      penteTangenteTracee * (xTangenteMax - abscisseTangente)) *
      yUnite,
    'red',
  )
  tangente.epaisseur = 1.5
  tangente.pointilles = 4
  const ordonneeLabelTangente =
    ordonneeTangente + penteTangenteTracee * (xTangenteMin - abscisseTangente)
  const yLabelTangente = Math.max(
    (yMin + 1) * yUnite,
    Math.min((yMax - 1) * yUnite, ordonneeLabelTangente * yUnite + 0.2),
  )
  const labelTangente = latex2d(
    '(T)',
    xTangenteMin * xUnite + 0.4,
    yLabelTangente,
    { color: 'red', letterSize: 'small' },
  )

  return mathalea2d(
    {
      xmin: xMin * xUnite - 0.7,
      xmax: xMax * xUnite + 0.7,
      ymin: yMin * yUnite - 0.35,
      ymax: yMax * yUnite + 0.35,
      pixelsParCm: 25,
      scale: 1,
      center: !context.isHtml,
    },
    r,
    ...cadre,
    courbe(fonction, {
      repere: r,
      color: bleuMathalea,
      epaisseur: 2.5,
      xMin,
      xMax,
      yMin,
      yMax,
      step: 0.02,
    }),
    tangente,
    labelTangente,
    label,
  )
}

/**
 * @author Stéphane Guyon
 */
export default class SignesFonctionEtDerivees extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion(): void {
    const centre = choice(centres)
    const orientation = choice(orientations)
    const scenarioRelatif = choice(scenariosRelatifs)
    const scenario = {
      abscisseF: centre + scenarioRelatif.decalageF,
      abscisseFPrime: centre + scenarioRelatif.decalageFPrime,
      abscisseFSeconde: centre + scenarioRelatif.decalageFSeconde,
    }
    const f = (x: number) => {
      const u = (Math.PI * (x - centre)) / 20
      return orientation * (-17 * Math.sin(u) - Math.sin(3 * u))
    }
    const fPrime = (x: number) => {
      const u = (Math.PI * (x - centre)) / 20
      return (
        (orientation * Math.PI * (-17 * Math.cos(u) - 3 * Math.cos(3 * u))) / 20
      )
    }
    const fSeconde = (x: number) => {
      const u = (Math.PI * (x - centre)) / 20
      return (
        (orientation *
          Math.PI ** 2 *
          (17 * Math.sin(u) + 9 * Math.sin(3 * u))) /
        400
      )
    }
    const reponses: Signe[] = [
      signe(f(scenario.abscisseF)),
      signe(fPrime(scenario.abscisseFPrime)),
      signe(fSeconde(scenario.abscisseFSeconde)),
    ]
    const ligneReponse = (expression: string, index: number): string =>
      `• $${expression}$${this.interactif ? ` : ${choixDeroulant(this, index, { choices: choixSignes, choix0: false })}` : ''}`

    const abscissesUtiles = [
      scenario.abscisseF,
      scenario.abscisseFPrime,
      scenario.abscisseFSeconde,
    ]
    const xMinGraphique = Math.min(-5, Math.min(...abscissesUtiles) - 5)
    const xMaxGraphique = Math.max(...abscissesUtiles) + 5
    const figure = graphique(
      f,
      fPrime,
      scenario.abscisseFSeconde,
      orientation,
      xMinGraphique,
      xMaxGraphique,
    )
    const question = this.interactif
      ? "Compléter avec l'aide du graphique :"
      : 'Déterminer graphiquement le signe de :'
    const texte = `On considère une fonction $f$ définie et deux fois dérivable sur $[${xMinGraphique}\\,;\\,${xMaxGraphique}]$. Sa courbe représentative $\\mathcal C_f$ est donnée ci-dessous dans un repère orthogonal. On a représenté en rouge la tangente $(T)$ à $\\mathcal C_f$ au point d'abscisse $${texNombre(scenario.abscisseFSeconde)}$.<br>${figure}<br>
    ${question}<br><br>
    ${ligneReponse(`f(${texNombre(scenario.abscisseF)})`, 0)} ;<br><br>
    ${ligneReponse(`f'(${texNombre(scenario.abscisseFPrime)})`, 1)} ;<br><br>
    ${ligneReponse(`f''(${texNombre(scenario.abscisseFSeconde)})`, 2)}.`

    const variation =
      reponses[1] === 'nul'
        ? `la tangente à $\\mathcal C_f$ au point d'abscisse $${texNombre(scenario.abscisseFPrime)}$ est horizontale`
        : `la fonction est ${reponses[1] === 'positif' ? 'croissante' : 'décroissante'}`
    const analyseConvexite =
      reponses[2] === 'nul'
        ? `En $${texNombre(scenario.abscisseFSeconde)}$, la courbe traverse sa tangente. Elle admet donc un point d'inflexion et la fonction change de convexité au point d'abscisse $${texNombre(scenario.abscisseFSeconde)}$. Donc $f''(${texNombre(scenario.abscisseFSeconde)})$ est ${texteEnCouleurEtGras('nul')}.`
        : `Au voisinage de $${texNombre(scenario.abscisseFSeconde)}$, la courbe est localement ${reponses[2] === 'positif' ? 'au-dessus' : 'en dessous'} de sa tangente : la fonction est ${reponses[2] === 'positif' ? 'convexe' : 'concave'}. Donc $f''(${texNombre(scenario.abscisseFSeconde)})$ est ${texteEnCouleurEtGras(reponses[2])}.`
    const texteCorr = `On lit successivement la position de la courbe par rapport à l'axe des abscisses, puis les variations et la convexité de la fonction $f$.<br>
    • À l'abscisse $${texNombre(scenario.abscisseF)}$, la courbe est ${reponses[0] === 'nul' ? "sur l'axe des abscisses" : reponses[0] === 'positif' ? "au-dessus de l'axe des abscisses" : "en dessous de l'axe des abscisses"}. Donc $f(${texNombre(scenario.abscisseF)})$ est ${texteEnCouleurEtGras(reponses[0])}.<br>
    • Au voisinage de $${texNombre(scenario.abscisseFPrime)}$, ${variation}. Donc $f'(${texNombre(scenario.abscisseFPrime)})$ est ${texteEnCouleurEtGras(reponses[1])}.<br>
    • ${analyseConvexite}`

    reponses.forEach((reponse, index) => {
      handleAnswers(
        this,
        index,
        {
          reponse: {
            value: reponse,
            options: { texteSansCasse: true },
          },
        },
        { formatInteractif: 'liste-deroulante' },
      )
    })

    this.listeQuestions[0] = texte
    this.listeCorrections[0] = texteCorr
    listeQuestionsToContenu(this)
  }
}
