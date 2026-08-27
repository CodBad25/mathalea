import type { DataOptionsMultiMathfield } from '../../lib/customElements/MultiMathfield'
import { addMultiMathfield } from '../../lib/customElements/MultiMathfield'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { toutAUnPoint } from '../../lib/interactif/fonctionsBaremes'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { choice, shuffle } from '../../lib/outils/arrayOutils'
import {
  miseEnEvidence,
  texteEnCouleurEtGras,
} from '../../lib/outils/embellissements'
import { lettreDepuisChiffre } from '../../lib/outils/outilString'
import { context } from '../../modules/context'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Lire des informations dans un tableau'
export const interactifReady = true

export const dateDePublication = '23/08/2026'
export const uuid = 'a3e96'

export const refs = {
  'fr-fr': ['auto6P1A-2', '6AutoS1-3'],
  'fr-2016': ['6S13'],
  'fr-ch': [],
}

export type CelluleTableau = string | number

export type SimpleTable = {
  type: 'simple'
  titre: string
  introduction: string
  entete: string
  ligne: string
  colonnes: string[]
  valeurs: number[]
  unite: string
  questions: QuestionTableau[]
}

export type DoubleEntryTable = {
  type: 'double'
  titre: string
  introduction: string
  enteteLigne: string
  enteteColonne: string
  lignes: string[]
  colonnes: string[]
  valeurs: CelluleTableau[][]
  unite: string
  questions: QuestionTableau[]
}

export type TableData = SimpleTable | DoubleEntryTable

export type QuestionTableau = {
  texte: string
  reponse: string | number
  correction: string
  choix?: string[]
}

const jours = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.']
const joursLongs = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']

export function metS(unite: string, valeur: number) {
  if (unite === '') return ''
  return `${unite}${valeur > 1 ? 's' : ''}`
}

function valeursDistinctes(nombre: number, min: number, max: number) {
  const valeurs: number[] = []
  for (let i = 0; i < nombre; i++) {
    valeurs.push(randint(min, max, valeurs))
  }
  return valeurs
}

function htmlTable(headers: string[], rows: CelluleTableau[][]) {
  const style =
    'border:1px solid #555;padding:6px 10px;text-align:center;vertical-align:middle'
  return `<table style="border-collapse:collapse;margin:1em auto"><thead><tr>${headers
    .map((header) => `<th style="${style};font-weight:bold">${header}</th>`)
    .join('')}</tr></thead><tbody>${rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td style="${style}">${cell}</td>`).join('')}</tr>`,
    )
    .join('')}</tbody></table>`
}

function latexTable(headers: string[], rows: CelluleTableau[][]) {
  const columnSpec = `|${'l|'.repeat(headers.length)}`
  const rowToLatex = (row: CelluleTableau[]) =>
    `${row.map(latexCell).join(' & ')} \\\\ \\hline`
  return [
    `\\begin{tabular}{${columnSpec}}`,
    '\\hline',
    rowToLatex(headers),
    ...rows.map(rowToLatex),
    '\\end{tabular}',
  ].join('\n')
}

function latexCell(cell: CelluleTableau) {
  return String(cell)
    .replaceAll('\\', '\\textbackslash{}')
    .replaceAll('&', '\\&')
    .replaceAll('%', '\\%')
    .replaceAll('#', '\\#')
    .replaceAll('_', '\\_')
}

export function tableToMarkup(table: TableData) {
  if (table.type === 'simple') {
    const headers = [table.entete, ...table.colonnes]
    const rows = [[table.ligne, ...table.valeurs]]
    return context.isHtml ? htmlTable(headers, rows) : latexTable(headers, rows)
  }
  const headers = [table.enteteLigne, ...table.colonnes]
  const rows = table.lignes.map((ligne, index) => [
    ligne,
    ...table.valeurs[index],
  ])
  return context.isHtml ? htmlTable(headers, rows) : latexTable(headers, rows)
}

function correctionAvecReponseEnEvidence(question: QuestionTableau) {
  const reponse = String(question.reponse)
  if (typeof question.reponse !== 'number') {
    return question.correction.replace(reponse, texteEnCouleurEtGras(reponse))
  }
  const reponseEnEvidence = miseEnEvidence(reponse.toString())
  return question.correction
    .replace(`$${reponse}$`, `$${reponseEnEvidence}$`)
    .replace(`=${reponse}$`, `=${reponseEnEvidence}$`)
}

export function buildSimpleTable(): SimpleTable {
  const theme = choice(['temperatures', 'dechets', 'effectifs'])
  let table: SimpleTable
  if (theme === 'temperatures') {
    const villes = ['Caen', 'Rennes', 'Lille', 'Nantes', 'Dijon']
    const mois = ['mars', 'avril', 'octobre', 'novembre']
    const valeurs = valeursDistinctes(jours.length, 4, 18)
    table = {
      type: 'simple',
      titre: 'Les températures de la semaine',
      introduction: `Ce tableau donne la température maximale relevée à ${choice(villes)} pendant une semaine de ${choice(mois)}.`,
      entete: 'Jour',
      ligne: 'Température (°C)',
      colonnes: jours,
      valeurs,
      unite: '°C',
      questions: [],
    }
  } else if (theme === 'dechets') {
    const colonnes = shuffle([
      'Papier',
      'Plastique',
      'Verre',
      'Carton',
      'Métal',
      'Compost',
      'Textile',
    ]).slice(0, 4)
    const valeurs = valeursDistinctes(colonnes.length, 5, 40)
    table = {
      type: 'simple',
      titre: 'Le tri des déchets au collège',
      introduction:
        'Le collège pèse les déchets triés par les élèves pendant une semaine.',
      entete: 'Type de déchet',
      ligne: 'Masse collectée (kg)',
      colonnes: [...colonnes, 'Total'],
      valeurs: [
        ...valeurs,
        valeurs.reduce((somme, valeur) => somme + valeur, 0),
      ],
      unite: 'kg',
      questions: [],
    }
  } else {
    table = {
      type: 'simple',
      titre: 'Les effectifs du collège',
      introduction: `Ce tableau donne le nombre d'élèves par niveau au collège ${choice(['Jean Moulin', 'Victor Hugo', 'Marie Curie', 'Simone Veil'])} à la rentrée.`,
      entete: 'Niveau',
      ligne: "Nombre d'élèves",
      colonnes: ['6e', '5e', '4e', '3e'],
      valeurs: valeursDistinctes(4, 85, 135),
      unite: 'élève',
      questions: [],
    }
  }
  const maxValue = Math.max(...table.valeurs)
  const minValue = Math.min(...table.valeurs)
  const maxIndex = table.valeurs.indexOf(maxValue)
  const minIndex = table.valeurs.indexOf(minValue)
  table.questions = [
    {
      texte: `Quelle valeur lit-on pour ${table.colonnes[2]} ?`,
      reponse: table.valeurs[2],
      correction: `Pour ${table.colonnes[2]}, on lit $${table.valeurs[2]}$ ${metS(table.unite, table.valeurs[2])}.`,
    },
    {
      texte: `Quelle colonne correspond à la plus grande valeur ?`,
      reponse: table.colonnes[maxIndex],
      choix: table.colonnes,
      correction: `La plus grande valeur est $${maxValue}$ : elle correspond à ${table.colonnes[maxIndex]}.`,
    },
    {
      texte: `Quelle colonne correspond à la plus petite valeur ?`,
      reponse: table.colonnes[minIndex],
      choix: table.colonnes,
      correction: `La plus petite valeur est $${minValue}$ : elle correspond à ${table.colonnes[minIndex]}.`,
    },
    {
      texte: `Quelle valeur lit-on pour ${table.colonnes[0]} ?`,
      reponse: table.valeurs[0],
      correction: `Pour ${table.colonnes[0]}, on lit $${table.valeurs[0]}$ ${metS(table.unite, table.valeurs[0])}.`,
    },
  ]
  return table
}

export function buildDoubleEntryTable(): DoubleEntryTable {
  const theme = choice(['emploi', 'tournoi'])
  if (theme === 'emploi') {
    const prenom = choice(['Emma', 'Lina', 'Noah', 'Inès', 'Adam'])
    const matieres = [
      'Mathématiques',
      'Français',
      'Anglais',
      'SVT',
      'Histoire-Géo',
      'EPS',
      'Technologie',
      'Arts plastiques',
      'Musique',
    ]
    const lignes = ['8h - 9h', '9h - 10h', '10h15 - 11h15', '11h15 - 12h15']
    const matieresUniques = ['Arts plastiques', 'Musique']
    const matieresRecurrentes = matieres.filter(
      (matiere) => !matieresUniques.includes(matiere),
    )
    const baseMatieres = shuffle(matieresRecurrentes)
    const valeursParJour = joursLongs.map((_jour, jourIndex) =>
      lignes.map(
        (_ligne, ligneIndex) =>
          baseMatieres[(jourIndex + ligneIndex) % baseMatieres.length],
      ),
    )
    const emplacementsUniques = shuffle(
      joursLongs.flatMap((_jour, jourIndex) =>
        lignes.map((_ligne, ligneIndex) => ({ jourIndex, ligneIndex })),
      ),
    ).slice(0, matieresUniques.length)
    matieresUniques.forEach((matiere, index) => {
      const { jourIndex, ligneIndex } = emplacementsUniques[index]
      valeursParJour[jourIndex][ligneIndex] = matiere
    })
    const emplacementArts =
      emplacementsUniques[matieresUniques.indexOf('Arts plastiques')]
    const jourArtsIndex = emplacementArts.jourIndex
    const ligneArtsIndex = emplacementArts.ligneIndex
    const valeurs = lignes.map((_horaire, ligneIndex) =>
      joursLongs.map(
        (_jour, jourIndex) => valeursParJour[jourIndex][ligneIndex],
      ),
    )
    const jourIndex = randint(0, joursLongs.length - 1)
    const ligneIndex = randint(0, lignes.length - 1)
    const matiere = valeurs[ligneIndex][jourIndex]
    const matiereACompter = choice(matieres)
    const nbCreneaux = valeurs
      .flat()
      .filter((valeur) => valeur === matiereACompter).length
    const table: DoubleEntryTable = {
      type: 'double',
      titre: `L'emploi du temps de ${prenom}`,
      introduction: `Ce tableau donne une partie de l'emploi du temps de ${prenom}.`,
      enteteLigne: 'Horaire',
      enteteColonne: 'Jour',
      lignes,
      colonnes: joursLongs,
      valeurs,
      unite: '',
      questions: [],
    }
    table.questions = [
      {
        texte: `Quelle matière ${prenom} a-t-${prenom === 'Emma' || prenom === 'Inès' ? 'elle' : 'il'} le ${joursLongs[jourIndex].toLowerCase()} de ${lignes[ligneIndex]} ?`,
        reponse: matiere,
        choix: shuffle([
          matiere,
          ...shuffle(matieres.filter((item) => item !== matiere)).slice(0, 3),
        ]),
        correction: `À la ligne ${lignes[ligneIndex]} et dans la colonne ${joursLongs[jourIndex]}, on lit ${matiere}.`,
      },
      {
        texte: `Quel jour ${prenom} a-t-${prenom === 'Emma' || prenom === 'Inès' ? 'elle' : 'il'} Arts plastiques ?`,
        reponse: joursLongs[jourArtsIndex],
        choix: joursLongs,
        correction: `Arts plastiques se trouve dans la colonne ${joursLongs[jourArtsIndex]}, à la ligne ${lignes[ligneArtsIndex]}.`,
      },
      {
        texte: `Combien de créneaux de ${matiereACompter} voit-on dans le tableau ?`,
        reponse: nbCreneaux,
        correction: `On compte ${matiereACompter} $${nbCreneaux}$ fois dans le tableau.`,
      },
      {
        texte: `À quelle heure ${prenom} a-t-${prenom === 'Emma' || prenom === 'Inès' ? 'elle' : 'il'} ${matiere} le ${joursLongs[jourIndex].toLowerCase()} ?`,
        reponse: lignes[ligneIndex],
        choix: lignes,
        correction: `${matiere} se trouve dans la colonne ${joursLongs[jourIndex]}, à la ligne ${lignes[ligneIndex]}.`,
      },
    ]
    return table
  } else {
    const sport = choice([
      {
        nom: 'handball',
        unite: 'but',
        min: 1,
        max: 12,
        equipes: [
          'Les aigles',
          'Les loups',
          'Les renards',
          'Les lynx',
          'Les faucons',
        ],
      },
      {
        nom: 'basketball',
        unite: 'point',
        min: 10,
        max: 35,
        equipes: [
          'Les panthères',
          'Les dauphins',
          'Les tigres',
          'Les jaguars',
          'Les cobras',
        ],
      },
      {
        nom: 'football',
        unite: 'but',
        min: 0,
        max: 6,
        equipes: [
          'Les étoiles',
          'Les comètes',
          'Les faucons',
          'Les éclairs',
          'Les dragons',
        ],
      },
    ])
    const lignes = shuffle(sport.equipes).slice(0, 4)
    const valeursParMatch = [0, 1, 2].map(() =>
      valeursDistinctes(lignes.length, sport.min, sport.max),
    )
    const valeurs = lignes.map((_ligne, index) =>
      valeursParMatch.map((colonne) => colonne[index]),
    )
    const equipeIndex = randint(0, lignes.length - 1)
    const matchIndex = choice([0, 2])
    const equipeTotalIndex = randint(0, lignes.length - 1)
    const equipeMemeScoreIndex = randint(0, lignes.length - 1)
    for (let i = 0; i < lignes.length; i++) {
      if (i !== equipeMemeScoreIndex && valeurs[i][1] === valeurs[i][0]) {
        valeurs[i][1] = randint(sport.min, sport.max, [
          valeurs[i][0],
          ...valeurs.map((ligne) => ligne[1]),
        ])
      }
    }
    valeurs[equipeMemeScoreIndex][1] = valeurs[equipeMemeScoreIndex][0]
    const total = valeurs[equipeTotalIndex].reduce(
      (somme, valeur) => somme + valeur,
      0,
    )
    const table: DoubleEntryTable = {
      type: 'double',
      titre: `Le tournoi de ${sport.nom}`,
      introduction: `Ce tableau présente le nombre de ${metS(sport.unite, 2)} marqués par quatre équipes lors des trois tours du tournoi.`,
      enteteLigne: 'Équipe',
      enteteColonne: 'Tour',
      lignes,
      colonnes: ['Tour A', 'Tour B', 'Tour C'],
      valeurs,
      unite: sport.unite,
      questions: [],
    }
    table.questions = [
      {
        texte: `Combien de ${metS(sport.unite, valeurs[equipeIndex][matchIndex])} ${lignes[equipeIndex]} ont-ils marqué au Tour ${lettreDepuisChiffre(matchIndex + 1)} ?`,
        reponse: valeurs[equipeIndex][matchIndex],
        correction: `À la ligne ${lignes[equipeIndex]} et dans la colonne Tour ${lettreDepuisChiffre(matchIndex + 1)}, on lit $${valeurs[equipeIndex][matchIndex]}$ ${metS(sport.unite, valeurs[equipeIndex][matchIndex])}.`,
      },
      {
        texte: `Quelle équipe a marqué $${valeurs[equipeIndex][matchIndex]}$ ${metS(sport.unite, valeurs[equipeIndex][matchIndex])} au Tour ${lettreDepuisChiffre(matchIndex + 1)} ?`,
        reponse: lignes[equipeIndex],
        choix: lignes,
        correction: `Dans la colonne Tour ${lettreDepuisChiffre(matchIndex + 1)}, la valeur $${valeurs[equipeIndex][matchIndex]}$ est sur la ligne ${lignes[equipeIndex]}.`,
      },
      {
        texte: `Combien de ${metS(sport.unite, total)} ${lignes[equipeTotalIndex]} ont-ils marqué sur les trois tours ?`,
        reponse: total,
        correction: `${lignes[equipeTotalIndex]} ont marqué $${valeurs[equipeTotalIndex].join('+')}=${total}$ ${metS(sport.unite, total)} sur les trois tours.`,
      },
      {
        texte: `Quelle équipe a marqué le même nombre de ${metS(sport.unite, 2)} au Tour ${lettreDepuisChiffre(1)} et au Tour ${lettreDepuisChiffre(2)} ?`,
        reponse: lignes[equipeMemeScoreIndex],
        choix: lignes,
        correction: `${lignes[equipeMemeScoreIndex]} ont marqué $${valeurs[equipeMemeScoreIndex][0]}$ ${metS(sport.unite, valeurs[equipeMemeScoreIndex][0])} au Tour ${lettreDepuisChiffre(1)} et $${valeurs[equipeMemeScoreIndex][1]}$ ${metS(sport.unite, valeurs[equipeMemeScoreIndex][1])} au Tour ${lettreDepuisChiffre(2)}.`,
      },
    ]
    return table
  }
}

export default class LireInformationsTableau extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireNumerique = [
      'Niveau de difficulté',
      3,
      '1 : Tableau simple\n2 : Tableau à double entrée\n3 : Mélange',
    ]
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false
    this.sup = 3
    this.spacing = 2
    this.spacingCorr = 2
  }

  nouvelleVersion() {
    const niveau = this.sup === 3 ? choice([1, 2]) : Number(this.sup)
    const table = niveau === 1 ? buildSimpleTable() : buildDoubleEntryTable()
    this.consigne = 'Lire le tableau, puis répondre aux questions.'
    const dataTemplate = table.questions
      .map(
        (question, index) =>
          `${String.fromCharCode(97 + index)}) ${question.texte} %{champ${index + 1}}`,
      )
      .join('\n')
    const dataOptions: DataOptionsMultiMathfield = Object.fromEntries(
      table.questions.map((question, index) => [
        `champ${index + 1}`,
        question.choix == null
          ? { keyboard: KeyboardType.clavierNumbers, ldots: true, minWidth: 60 }
          : {
              qcm: question.choix.map((item) => ({
                label: item,
                value: item,
              })),
              vertical: true,
            },
      ]),
    )
    const reponses = Object.fromEntries(
      table.questions.map((question, index) => [
        `champ${index + 1}`,
        { value: String(question.reponse) },
      ]),
    )
    const texte = [
      `<strong>${table.titre}</strong><br>`,
      `${table.introduction}<br>`,
      tableToMarkup(table),
      addMultiMathfield(this, 0, {
        dataTemplate,
        dataOptions,
      }),
    ].join('')
    const texteCorr = [
      tableToMarkup(table),
      ...table.questions.map(
        (question, index) =>
          `${String.fromCharCode(97 + index)}) ${correctionAvecReponseEnEvidence(question)}`,
      ),
    ].join('<br>')

    handleAnswers(
      this,
      0,
      { bareme: toutAUnPoint, ...reponses },
      { formatInteractif: 'multi-mathfield' },
    )

    this.listeQuestions[0] = texte
    this.listeCorrections[0] = texteCorr
    listeQuestionsToContenu(this)
  }
}
