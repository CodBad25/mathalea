import { tableauColonneLigne } from '../../lib/2d/tableau'
import { choice } from '../../lib/outils/arrayOutils'
import { texteEnCouleurEtGras } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'bcd5e'
export const refs = {
  'fr-fr': ['1A-S01-5'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Choisir une représentation graphique adaptée'
export const dateDePublication = '06/08/2026'

type Scenario = {
  introduction: string
  tableau: string
  bonneReponse: number
  justification: string
}

/**
 * @author Stéphane Guyon
 */
export default class ChoisirRepresentationGraphique extends ExerciceQcmA {
  private scenarioDiagrammeBatons(): Scenario {
    const activites = ['Football', 'Basket-ball', 'Théâtre', 'Musique', 'Échecs']
    const effectifs = activites.map(() => randint(12, 45))
    const tableau = tableauColonneLigne(
      ['\\text{Activité choisie}', '\\text{Effectif}'],
      activites.map((activite) => `\\text{${activite}}`),
      effectifs,
    )
    return {
      introduction: `On a relevé l'activité extrascolaire principale choisie par des élèves. On souhaite comparer facilement les effectifs des différentes activités.`,
      tableau,
      bonneReponse: 0,
      justification: `Le caractère étudié est qualitatif et l'objectif est de comparer les effectifs de plusieurs catégories. La représentation la plus adaptée est donc ${texteEnCouleurEtGras('un diagramme en bâtons')}.`,
    }
  }

  private scenarioDiagrammeCirculaire(): Scenario {
    const postes = ['Logement', 'Alimentation', 'Transport', 'Loisirs', 'Autres']
    const frequences = choice([
      [35, 25, 18, 12, 10],
      [40, 22, 16, 14, 8],
      [32, 28, 20, 12, 8],
      [38, 24, 18, 11, 9],
    ])
    const tableau = tableauColonneLigne(
      ['\\text{Poste de dépense}', '\\text{Part du budget (en \\%)}'],
      postes.map((poste) => `\\text{${poste}}`),
      frequences,
    )
    return {
      introduction: `Le tableau donne la répartition du budget mensuel d'un foyer. On souhaite visualiser la part occupée par chaque poste dans le budget total.`,
      tableau,
      bonneReponse: 1,
      justification: `Les fréquences décrivent les parts d'un même total et leur somme vaut $100\\,\\%$. Pour visualiser la répartition de ce total, la représentation la plus adaptée est donc ${texteEnCouleurEtGras('un diagramme circulaire')}.`,
    }
  }

  private scenarioHistogramme(): Scenario {
    const debut = 10 * randint(0, 2)
    const amplitude = choice([5, 10])
    const classes = Array.from(
      { length: 5 },
      (_, index) =>
        `[${debut + amplitude * index};${debut + amplitude * (index + 1)}[`,
    )
    const effectifs = Array.from({ length: 5 }, () => randint(5, 30))
    const tableau = tableauColonneLigne(
      ['\\text{Durée (en min)}', '\\text{Effectif}'],
      classes,
      effectifs,
    )
    return {
      introduction: `On a mesuré la durée d'un trajet pour plusieurs personnes. Les durées, qui constituent des données continues, ont été regroupées en intervalles.`,
      tableau,
      bonneReponse: 2,
      justification: `La durée est un caractère quantitatif continu et ses valeurs sont regroupées en classes. La représentation la plus adaptée est donc ${texteEnCouleurEtGras('un histogramme')}.`,
    }
  }

  private scenarioDiagrammeCartesien(): Scenario {
    const pasDistance = choice([20, 25])
    const distances = [1, 2, 3, 4, 5, 6].map(
      (valeur) => valeur * pasDistance,
    )
    const consommations = distances.map(
      (distance) => Math.round(distance * choice([0.06, 0.07, 0.08]) + randint(0, 2)),
    )
    const tableau = tableauColonneLigne(
      [
        '\\text{Trajet}',
        '\\text{A}',
        '\\text{B}',
        '\\text{C}',
        '\\text{D}',
        '\\text{E}',
        '\\text{F}',
      ],
      ['\\text{Distance (en km)}', '\\text{Carburant consommé (en L)}'],
      [...distances, ...consommations],
    )
    return {
      introduction: `Pour six trajets, on a relevé simultanément la distance parcourue et la quantité de carburant consommée. On souhaite étudier graphiquement le lien entre ces deux grandeurs.`,
      tableau,
      bonneReponse: 3,
      justification: `Chaque trajet fournit un couple de valeurs quantitatives : une distance et une consommation. Pour étudier la relation entre deux grandeurs, la représentation la plus adaptée est donc ${texteEnCouleurEtGras('un diagramme cartésien')}.`,
    }
  }

  private appliquerLesValeurs(numeroScenario: number): void {
    const scenarios = [
      this.scenarioDiagrammeBatons(),
      this.scenarioDiagrammeCirculaire(),
      this.scenarioHistogramme(),
      this.scenarioDiagrammeCartesien(),
    ]
    const scenario = scenarios[numeroScenario]
    const propositions = [
      'Un diagramme en bâtons',
      'Un diagramme circulaire',
      'Un histogramme',
      'Un diagramme cartésien',
    ]
    this.reponses = [
      propositions[scenario.bonneReponse],
      ...propositions.filter((_, index) => index !== scenario.bonneReponse),
    ]
    this.bonnesReponses = undefined

    const propositionsTypst = context.isTypst
      ? `<br><br>${this.reponses
          .map(
            (proposition, index) =>
              `${String.fromCharCode(65 + index)}. ${proposition}`,
          )
          .join('<br>')}`
      : ''
    this.enonce = `${scenario.introduction}<br><br>
      ${scenario.tableau}<br><br>
      Quel diagramme semble être le plus adapté pour représenter ces données ?${propositionsTypst}`
    this.correction = scenario.justification
  }

  versionAleatoire: () => void = () => {
    this.appliquerLesValeurs(randint(0, 3))
  }

  constructor() {
    super()
    this.besoinFormulaireCaseACocher = false
    this.options = { vertical: true, ordered: context.isTypst }
    this.versionAleatoire()
  }
}
