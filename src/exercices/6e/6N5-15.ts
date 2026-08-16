import {
  addEchiquierProbleme,
  type EchiquierProblemeOptions,
} from '../../lib/customElements/EchiquierProblemeElement'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { prenomF, prenomM } from '../../lib/outils/Personne'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = "Simplifier l'échiquier d'un problème"
export const interactifReady = true
export const interactifType = 'echiquier-probleme'
export const dateDePublication = '15/08/2026'

/**
 * Construire l'échiquier complet puis griser les données inutiles.
 * @author Jean-claude Lhote
 */
export const uuid = 'd91fc'

export const refs = {
  'fr-fr': ['6N5-15'],
  'fr-2016': ['6C12-15'],
  'fr-ch': [],
}

type ProblemeEchiquier = EchiquierProblemeOptions & {
  enonce: string
  correction: string
}

const creerProblemes: (() => ProblemeEchiquier)[] = [
  () => {
    const fruitUtile = choice(['bananes', 'pommes', 'poires', 'oranges'])
    const fruitInutile = choice(
      ['bananes', 'pommes', 'poires', 'oranges'],
      fruitUtile,
    )
    const masseUtile = randint(2, 8)
    const prixUnitaireUtile = randint(2, 6)
    const masseInutile = randint(2, 8)
    const prixUnitaireInutile = randint(2, 6)
    return {
      enonce: `Au marché, ${prenomF(1)} achète ${masseUtile} kg de ${fruitUtile} à ${prixUnitaireUtile} € le kg et ${masseInutile} kg de ${fruitInutile} à ${prixUnitaireInutile} € le kg. Quel est le prix des ${fruitUtile} ?`,
      expectedRows: ['prix unitaire', 'masse totale', 'prix total'],
      expectedColumns: [fruitUtile, fruitInutile],
      cells: [
        {
          row: 'prix unitaire',
          column: fruitUtile,
          value: `${prixUnitaireUtile} €/kg`,
        },
        {
          row: 'masse totale',
          column: fruitUtile,
          value: `${masseUtile} kg`,
        },
        { row: 'prix total', column: fruitUtile, value: '?' },
        {
          row: 'prix unitaire',
          column: fruitInutile,
          value: `${prixUnitaireInutile} €/kg`,
        },
        {
          row: 'masse totale',
          column: fruitInutile,
          value: `${masseInutile} kg`,
        },
        { row: 'prix total', column: fruitInutile, value: '?' },
      ],
      rowChoices: [
        'prix unitaire',
        'masse totale',
        'prix total',
        'nombre de fruits',
        'durée',
      ],
      columnChoices: [
        fruitUtile,
        fruitInutile,
        'courses',
        choice(
          ['bananes', 'pommes', 'poires', 'oranges'],
          [fruitUtile, fruitInutile],
        ),
      ],
      expectedGreyedRows: [],
      expectedGreyedColumns: [fruitInutile],
      expectedStructure: 'colonne',
      expectedOperation: 'multiplication',
      correction: `L'échiquier complet contient les ${fruitUtile} et les ${fruitInutile}. La question ne porte que sur les ${fruitUtile} : on grise donc la colonne des ${fruitInutile}. L'échiquier simplifié restant est en colonne.`,
    }
  },
  () => {
    const objetUtile = choice(['cahiers', 'stylos', 'livres', 'classeurs'])
    const objetInutile = choice(
      ['cahiers', 'stylos', 'livres', 'classeurs'],
      objetUtile,
    )
    const prixUnitaireUtile = randint(2, 6)
    const nombreUtile = randint(3, 9)
    const prixTotalUtile = prixUnitaireUtile * nombreUtile
    const prixUnitaireInutile = randint(2, 6)
    const nombreInutile = randint(2, 8)
    const prixTotalInutile = prixUnitaireInutile * nombreInutile
    return {
      enonce: `${prenomM(1)} paie ${prixTotalUtile} € pour des ${objetUtile} coûtant ${prixUnitaireUtile} € chacun. Il achète aussi des ${objetInutile} coûtant ${prixUnitaireInutile} € chacun pour un total de ${prixTotalInutile} €. Combien de ${objetUtile} a-t-il achetés ?`,
      expectedRows: [
        'prix unitaire',
        'prix total',
        `nombre de ${objetUtile}`,
        `nombre de ${objetInutile}`,
      ],
      expectedColumns: [objetUtile, objetInutile],
      cells: [
        {
          row: 'prix unitaire',
          column: objetUtile,
          value: `${prixUnitaireUtile} €/${objetUtile}`,
        },
        { row: 'prix total', column: objetUtile, value: `${prixTotalUtile} €` },
        { row: `nombre de ${objetUtile}`, column: objetUtile, value: '?' },
        {
          row: 'prix unitaire',
          column: objetInutile,
          value: `${prixUnitaireInutile} €/${objetInutile}`,
        },
        {
          row: 'prix total',
          column: objetInutile,
          value: `${prixTotalInutile} €`,
        },
        { row: `nombre de ${objetInutile}`, column: objetInutile, value: '?' },
      ],
      rowChoices: [
        'prix unitaire',
        'prix total',
        `nombre de ${objetUtile}`,
        `nombre de ${objetInutile}`,
        'masse totale',
        'distance',
      ],
      columnChoices: [objetUtile, objetInutile, 'cartable', 'courses'],
      expectedGreyedRows: [`nombre de ${objetInutile}`],
      expectedGreyedColumns: [objetInutile],
      expectedStructure: 'colonne',
      expectedOperation: 'division',
      correction: `L'échiquier complet contient les ${objetUtile} et les ${objetInutile}. Pour répondre, on ne garde que la colonne des ${objetUtile} et on grise aussi la ligne propre au nombre de ${objetInutile}.`,
    }
  },
  () => {
    const objet1 = choice(['livre', 'cahier', 'classeur'])
    const objet2 = choice(['trousse', 'gourde', 'boîte', 'calculatrice'])
    const objetInutile = choice(['ballon', 'manteau', 'sac'])
    const masse1 = randint(250, 650)
    const masse2 = randint(100, 350)
    const masseInutile = randint(150, 700)
    return {
      enonce: `Dans son cartable, ${prenomF(1)} a un ${objet1} de ${masse1} g, une ${objet2} de ${masse2} g et un ${objetInutile} de ${masseInutile} g. Quelle est la masse totale du ${objet1} et de la ${objet2} ?`,
      expectedRows: ['masse'],
      expectedColumns: [objet1, objet2, objetInutile, 'total'],
      cells: [
        { row: 'masse', column: objet1, value: `${masse1} g` },
        { row: 'masse', column: objet2, value: `${masse2} g` },
        { row: 'masse', column: objetInutile, value: `${masseInutile} g` },
        { row: 'masse', column: 'total', value: '?' },
      ],
      rowChoices: ['masse', 'prix', 'durée', 'distance'],
      columnChoices: [objet1, objet2, objetInutile, 'total', 'cartable vide'],
      expectedGreyedRows: [],
      expectedGreyedColumns: [objetInutile],
      expectedStructure: 'ligne',
      expectedOperation: 'addition',
      correction: `L'échiquier complet contient trois objets, mais la question ne demande que la masse totale du ${objet1} et de la ${objet2}. On grise la colonne du ${objetInutile}.`,
    }
  },
  () => {
    const objet = choice(['bande dessinée', 'livre', 'cahier', 'stylo'])
    const sommeAvant = randint(20, 60)
    const sommeApres = randint(5, sommeAvant - 5)
    const masseSac = randint(2, 8)
    return {
      enonce: `${prenomM(1)} avait ${sommeAvant} € dans sa tirelire. Après avoir acheté ${objet === 'bande dessinée' ? 'une' : 'un'} ${objet}, il lui reste ${sommeApres} €. Son sac pèse aussi ${masseSac} kg. Quel est le prix ${objet === 'bande dessinée' ? 'de la' : 'du'} ${objet} ?`,
      expectedRows: ['argent', 'masse'],
      expectedColumns: ['somme avant achat', 'somme après achat', objet, 'sac'],
      cells: [
        {
          row: 'argent',
          column: 'somme avant achat',
          value: `${sommeAvant} €`,
        },
        {
          row: 'argent',
          column: 'somme après achat',
          value: `${sommeApres} €`,
        },
        { row: 'argent', column: objet, value: '?' },
        { row: 'masse', column: 'sac', value: `${masseSac} kg` },
      ],
      rowChoices: ['argent', 'masse', 'prix unitaire', 'durée'],
      columnChoices: [
        'somme avant achat',
        'somme après achat',
        objet,
        'sac',
        'économies du frère',
      ],
      expectedGreyedRows: ['masse'],
      expectedGreyedColumns: ['sac'],
      expectedStructure: 'ligne',
      expectedOperation: 'soustraction',
      correction:
        "L'échiquier complet contient une donnée de masse, mais la question porte seulement sur l'argent. On grise donc la ligne de masse et la colonne du sac.",
    }
  },
]

export default class SimplifierEchiquierProbleme extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 4
    this.consigne =
      "Construire l'échiquier complet du problème, puis griser les lignes ou les colonnes inutiles pour obtenir l'échiquier simplifié."
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
        simplificationMode: 'grey',
      })
      this.listeQuestions[i] = `${probleme.enonce}<br>${echiquier}`
      this.listeCorrections[i] = probleme.correction
    }
    listeQuestionsToContenu(this)
  }
}
