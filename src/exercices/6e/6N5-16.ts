import {
  addEchiquierProbleme,
  type EchiquierProblemeOptions,
} from '../../lib/customElements/EchiquierProblemeElement'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { prenomF, prenomM } from '../../lib/outils/Personne'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = "Compléter l'échiquier avec des résultats intermédiaires"
export const interactifReady = true
export const interactifType = 'echiquier-probleme'
export const dateDePublication = '15/08/2026'

/**
 * Construire un échiquier de problème avec cellules calculées.
 * @author Jean-claude Lhote
 */
export const uuid = 'f82a6'

export const refs = {
  'fr-fr': ['6N5-16'],
  'fr-2016': ['6C12-16'],
  'fr-ch': [],
}

type ProblemeEchiquier = EchiquierProblemeOptions & {
  enonce: string
  correction: string
}

function valeursAvecDistracteurs(valeurs: (number | string)[]): string[] {
  const numeriques = valeurs.filter(
    (valeur): valeur is number => typeof valeur === 'number',
  )
  const distracteurs = numeriques.flatMap((valeur) => [
    Math.max(1, valeur - 1),
    valeur + 1,
  ])
  return [
    ...new Set([...valeurs, ...distracteurs].map((valeur) => `${valeur}`)),
  ]
}

const creerProblemes: (() => ProblemeEchiquier)[] = [
  () => {
    const fruit1 = choice(['pommes', 'poires', 'oranges', 'bananes'])
    const fruit2 = choice(['pommes', 'poires', 'oranges', 'bananes'], fruit1)
    const masse1 = randint(2, 6)
    const masse2 = randint(2, 6)
    const prixUnitaire1 = randint(2, 5)
    const prixUnitaire2 = randint(2, 5)
    const prixFruit1 = masse1 * prixUnitaire1
    const prixFruit2 = masse2 * prixUnitaire2
    const prixCourses = prixFruit1 + prixFruit2
    return {
      enonce: `Au marché, ${prenomF(1)} achète ${masse1} kg de ${fruit1} à ${prixUnitaire1} € le kg et ${masse2} kg de ${fruit2} à ${prixUnitaire2} € le kg. Quel est le prix total de ses courses ?`,
      expectedRows: ['prix unitaire', 'masse totale', 'prix total'],
      expectedColumns: [fruit1, fruit2, 'courses'],
      cells: [
        {
          row: 'prix unitaire',
          column: fruit1,
          value: `${prixUnitaire1} €/kg`,
          kind: 'given',
        },
        {
          row: 'masse totale',
          column: fruit1,
          value: `${masse1} kg`,
          kind: 'given',
        },
        {
          row: 'prix total',
          column: fruit1,
          value: `${prixFruit1} €`,
          kind: 'computed',
        },
        {
          row: 'prix unitaire',
          column: fruit2,
          value: `${prixUnitaire2} €/kg`,
          kind: 'given',
        },
        {
          row: 'masse totale',
          column: fruit2,
          value: `${masse2} kg`,
          kind: 'given',
        },
        {
          row: 'prix total',
          column: fruit2,
          value: `${prixFruit2} €`,
          kind: 'computed',
        },
        {
          row: 'prix total',
          column: 'courses',
          value: `${prixCourses} €`,
          kind: 'computed',
        },
      ],
      rowChoices: [
        'prix unitaire',
        'masse totale',
        'prix total',
        'nombre de fruits',
        'durée',
      ],
      columnChoices: [fruit1, fruit2, 'courses', 'cartable'],
      cellChoices: [
        `${prixUnitaire1} €/kg`,
        `${masse1} kg`,
        `${prixFruit1} €`,
        `${prixUnitaire2} €/kg`,
        `${masse2} kg`,
        `${prixFruit2} €`,
        `${prixCourses} €`,
        ...valeursAvecDistracteurs([prixFruit1, prixFruit2, prixCourses]).map(
          (valeur) => `${valeur} €`,
        ),
      ],
      expectedStructure: 'ligne',
      expectedOperation: 'addition',
      correction: `Il faut d'abord calculer le prix des ${fruit1} et le prix des ${fruit2}, puis additionner ces deux prix pour obtenir le prix des courses.`,
    }
  },
  () => {
    const objet1 = choice(['livre', 'cahier', 'classeur'])
    const objet2 = choice(['trousse', 'gourde', 'calculatrice'])
    const nombre1 = randint(2, 5)
    const nombre2 = randint(2, 5)
    const masseUnitaire1 = randint(100, 300)
    const masseUnitaire2 = randint(50, 200)
    const masseTotale1 = nombre1 * masseUnitaire1
    const masseTotale2 = nombre2 * masseUnitaire2
    const masseCartable = masseTotale1 + masseTotale2
    return {
      enonce: `Dans son cartable, ${prenomM(1)} met ${nombre1} ${objet1}s de ${masseUnitaire1} g chacun et ${nombre2} ${objet2}s de ${masseUnitaire2} g chacune. Quelle est la masse totale de ces objets ?`,
      expectedRows: ['nombre', 'masse unitaire', 'masse totale'],
      expectedColumns: [objet1, objet2, 'objets du cartable'],
      cells: [
        { row: 'nombre', column: objet1, value: `${nombre1}`, kind: 'given' },
        {
          row: 'masse unitaire',
          column: objet1,
          value: `${masseUnitaire1} g`,
          kind: 'given',
        },
        {
          row: 'masse totale',
          column: objet1,
          value: `${masseTotale1} g`,
          kind: 'computed',
        },
        { row: 'nombre', column: objet2, value: `${nombre2}`, kind: 'given' },
        {
          row: 'masse unitaire',
          column: objet2,
          value: `${masseUnitaire2} g`,
          kind: 'given',
        },
        {
          row: 'masse totale',
          column: objet2,
          value: `${masseTotale2} g`,
          kind: 'computed',
        },
        {
          row: 'masse totale',
          column: 'objets du cartable',
          value: `${masseCartable} g`,
          kind: 'computed',
        },
      ],
      rowChoices: [
        'nombre',
        'masse unitaire',
        'masse totale',
        'prix total',
        'durée',
      ],
      columnChoices: [objet1, objet2, 'objets du cartable', 'sac vide'],
      cellChoices: [
        `${nombre1}`,
        `${nombre2}`,
        `${masseUnitaire1} g`,
        `${masseUnitaire2} g`,
        `${masseTotale1} g`,
        `${masseTotale2} g`,
        `${masseCartable} g`,
        ...valeursAvecDistracteurs([
          masseTotale1,
          masseTotale2,
          masseCartable,
        ]).map((valeur) => `${valeur} g`),
      ],
      expectedStructure: 'ligne',
      expectedOperation: 'addition',
      correction:
        'Il faut calculer les masses totales de chaque type d’objet, puis additionner ces résultats intermédiaires.',
    }
  },
  () => {
    const objet1 = choice(['livres', 'cahiers', 'classeurs'])
    const objet2 = choice(['stylos', 'feutres', 'crayons'])
    const nombre1 = randint(2, 5)
    const nombre2 = randint(3, 8)
    const prixUnitaire1 = randint(4, 9)
    const prixUnitaire2 = randint(1, 4)
    const prixObjet1 = nombre1 * prixUnitaire1
    const prixObjet2 = nombre2 * prixUnitaire2
    const budgetDepart = prixObjet1 + prixObjet2 + randint(5, 20)
    const argentRestant = budgetDepart - prixObjet1 - prixObjet2
    return {
      enonce: `${prenomF(1)} a ${budgetDepart} €. Elle achète ${nombre1} ${objet1} à ${prixUnitaire1} € chacun et ${nombre2} ${objet2} à ${prixUnitaire2} € chacun. Combien d'argent lui reste-t-il ?`,
      expectedRows: ['nombre', 'prix unitaire', 'prix total', 'argent'],
      expectedColumns: [objet1, objet2, 'achats', 'budget de départ', 'reste'],
      cells: [
        { row: 'nombre', column: objet1, value: `${nombre1}`, kind: 'given' },
        {
          row: 'prix unitaire',
          column: objet1,
          value: `${prixUnitaire1} €/${objet1}`,
          kind: 'given',
        },
        {
          row: 'prix total',
          column: objet1,
          value: `${prixObjet1} €`,
          kind: 'computed',
        },
        { row: 'nombre', column: objet2, value: `${nombre2}`, kind: 'given' },
        {
          row: 'prix unitaire',
          column: objet2,
          value: `${prixUnitaire2} €/${objet2}`,
          kind: 'given',
        },
        {
          row: 'prix total',
          column: objet2,
          value: `${prixObjet2} €`,
          kind: 'computed',
        },
        {
          row: 'prix total',
          column: 'achats',
          value: `${prixObjet1 + prixObjet2} €`,
          kind: 'computed',
        },
        {
          row: 'argent',
          column: 'budget de départ',
          value: `${budgetDepart} €`,
          kind: 'given',
        },
        {
          row: 'argent',
          column: 'reste',
          value: `${argentRestant} €`,
          kind: 'computed',
        },
      ],
      rowChoices: [
        'nombre',
        'prix unitaire',
        'prix total',
        'argent',
        'masse totale',
      ],
      columnChoices: [
        objet1,
        objet2,
        'achats',
        'budget de départ',
        'reste',
        'cartable',
      ],
      cellChoices: [
        `${nombre1}`,
        `${nombre2}`,
        `${prixUnitaire1} €/${objet1}`,
        `${prixUnitaire2} €/${objet2}`,
        `${prixObjet1} €`,
        `${prixObjet2} €`,
        `${prixObjet1 + prixObjet2} €`,
        `${argentRestant} €`,
        `${budgetDepart} €`,
        ...valeursAvecDistracteurs([
          prixObjet1,
          prixObjet2,
          prixObjet1 + prixObjet2,
          argentRestant,
        ]).map((valeur) => `${valeur} €`),
      ],
      expectedStructure: 'ligne',
      expectedOperation: 'soustraction',
      correction:
        'Il faut calculer le prix de chaque achat, additionner ces achats, puis soustraire cette dépense au budget de départ.',
    }
  },
  () => {
    const produit = choice(['gâteaux', 'carnets', 'paquets de cartes'])
    const nombreLots = randint(2, 6)
    const objetsParLot = randint(3, 8)
    const prixLot = randint(4, 12)
    const nombreObjets = nombreLots * objetsParLot
    const prixTotal = nombreLots * prixLot
    return {
      enonce: `Une association achète ${nombreLots} lots de ${produit}. Chaque lot contient ${objetsParLot} ${produit} et coûte ${prixLot} €. Combien de ${produit} l'association achète-t-elle et combien paie-t-elle au total ?`,
      expectedRows: ['nombre de lots', `nombre de ${produit}`, 'prix'],
      expectedColumns: ['un lot', 'achat total'],
      cells: [
        {
          row: 'nombre de lots',
          column: 'achat total',
          value: `${nombreLots}`,
          kind: 'given',
        },
        {
          row: `nombre de ${produit}`,
          column: 'un lot',
          value: `${objetsParLot}`,
          kind: 'given',
        },
        {
          row: `nombre de ${produit}`,
          column: 'achat total',
          value: `${nombreObjets}`,
          kind: 'computed',
        },
        { row: 'prix', column: 'un lot', value: `${prixLot} €`, kind: 'given' },
        {
          row: 'prix',
          column: 'achat total',
          value: `${prixTotal} €`,
          kind: 'computed',
        },
      ],
      rowChoices: [
        'nombre de lots',
        `nombre de ${produit}`,
        'prix',
        'masse totale',
        'durée',
      ],
      columnChoices: ['un lot', 'achat total', 'carton vide', 'reste'],
      cellChoices: [
        `${nombreLots}`,
        `${objetsParLot}`,
        `${nombreObjets}`,
        `${prixLot} €`,
        `${prixTotal} €`,
        ...valeursAvecDistracteurs([nombreObjets, prixTotal]),
        ...valeursAvecDistracteurs([prixTotal]).map((valeur) => `${valeur} €`),
      ],
      expectedStructure: 'colonne',
      expectedOperation: 'multiplication',
      correction:
        "Il faut calculer le nombre total d'objets achetés et le prix total à partir du nombre de lots.",
    }
  },
]

export default class CompleterEchiquierResultatsIntermediaires extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 4
    this.consigne =
      "Construire l'échiquier complet du problème et compléter les cellules, y compris les résultats intermédiaires nécessaires."
    this.spacing = 2
    this.spacingCorr = 2
  }

  nouvelleVersion() {
    const listeProblemes = combinaisonListes(
      creerProblemes,
      this.nbQuestions,
    ).map((creerProbleme) => creerProbleme())
    for (let i = 0; i < this.nbQuestions; i++) {
      const probleme = listeProblemes[i]
      const echiquier = addEchiquierProbleme(this, i, {
        ...probleme,
        cellFillMode: 'student',
      })
      this.listeQuestions[i] = `${probleme.enonce}<br>${echiquier}`
      this.listeCorrections[i] = probleme.correction
    }
    listeQuestionsToContenu(this)
  }
}
