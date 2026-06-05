import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { combinaisonListes } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { addSheet, createTableurLatex } from '../../lib/tableur/outilsTableur'
import type { GoodAnswersFormulas } from '../../lib/types'
import { context } from '../../modules/context'

import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Saisir une formule simple sur tableur'
export const dateDePublication = '07/02/2026'
export const dateDeModifImportante = '23/05/2026'
export const interactifReady = true
export const interactifType = 'tableur'

/**
 * Programmer des calculs sur tableur : New programme de 6eme 2025
 *  @author Olivier Mimeau
 * revisiter le vocabulaire moitié double .... cf 5C12-7
 * tableur d'après exercice 6I1B-4
 * Amélioration correction et paramètres par Eric Elter le 23/05/2026
 */

export const uuid = 'e0f6a'

export const refs = {
  'fr-fr': ['6I1B-5'],
  'fr-ch': [],
}

export default class ExerciceTableurVocabulaire extends Exercice {
  destroyers: (() => void)[] = []
  niveau: number
  constructor() {
    super()
    this.nbQuestions = 1

    /* Inadapté pour les 6èmes à cause du carré, du cube, de l'opposé et de l'inverse
    this.besoinFormulaireTexte = [
      'Types de formules',
      [
        'Nombres séparés par des tirets :',
        ' 0 : Mélange',
        ' 1 : Double',
        ' 2 : Triple',
        ' 3 : Moitié',
        ' 4 : Quart',
        ' 5 : Dixième',
        ' 6 : Carré',
        ' 7 : Cube',
        ' 8 : Opposé',
        ' 9 : Inverse',
        '10 : Somme de deux nombres',
        '11 : Différence entre deux nombres',
        '12 : Produit de deux nombres',
        '13 : Quotient de deux nombres',
      ].join('\n'),
    ]
      */
    this.besoinFormulaireTexte = [
      'Types de formules',
      [
        'Nombres séparés par des tirets :',
        ' 0 : Mélange',
        ' 1 : Double',
        ' 2 : Triple',
        ' 3 : Moitié',
        ' 4 : Quart',
        ' 5 : Dixième',
        ' 6 : Somme de deux nombres',
        ' 7 : Différence entre deux nombres',
        ' 8 : Produit de deux nombres',
        ' 9 : Quotient de deux nombres',
      ].join('\n'),
    ]

    this.besoinFormulaire2Numerique = ['Nombre de lignes', 1, '1\n2\n3\n4\n5']
    this.sup = 0
    this.sup2 = 3
    this.niveau = 6
  }

  destroy() {
    // MGu quand l'exercice est supprimé par svelte : bouton supprimé
    this.destroyers.forEach((destroy) => destroy())
    this.destroyers.length = 0
  }

  static readonly colors = {
    orange: '#e6b457',
    vert: '#7adb7a',
    jaune: '#e6e66a',
    bleu: '#8181e6',
    violet: '#f8a3f8',
    rouge: '#eca2a2',
  }

  static readonly styles = {
    style_id_rouge: {
      fs: 12,
      bg: ExerciceTableurVocabulaire.colors.rouge,
    },
    style_id_bleu: {
      fs: 12,
      bg: ExerciceTableurVocabulaire.colors.bleu,
    },
    style_id_orange: {
      fs: 12,
      bg: ExerciceTableurVocabulaire.colors.orange,
    },
    style_id_violet: {
      fs: 12,
      bg: ExerciceTableurVocabulaire.colors.violet,
    },
    style_id_vert: {
      fs: 12,
      bg: ExerciceTableurVocabulaire.colors.vert,
    },
    style_id_jaune: {
      fs: 12,
      bg: ExerciceTableurVocabulaire.colors.jaune,
    },
  }

  nouvelleVersion(): void {
    // MGu quand l'exercice est modifié, on détruit les anciens listeners
    this.destroyers.forEach((destroy) => destroy())
    this.destroyers.length = 0

    const nbLignes = this.sup2
    const nbElements = this.nbQuestions * this.sup2

    let choixThisSup = this.sup
    if (this.niveau === 6) {
      const map: Record<string, string> = {
        '6': '10',
        '7': '11',
        '8': '12',
        '9': '13',
      }

      choixThisSup = String(choixThisSup).replace(
        /[6-9]/g,
        (c: string) => map[c],
      )

      if (choixThisSup === '0') {
        choixThisSup = '1-2-3-4-5-10-11-12-13'
      }
    } else if (this.niveau === 5) {
      const map: Record<string, string> = {
        '6': '8',
        '7': '10',
        '8': '11',
        '9': '12',
        '10': '13',
      }

      choixThisSup = String(choixThisSup).replace(/10|[6-9]/g, (c) => map[c])

      if (choixThisSup === '0') {
        choixThisSup = '1-2-3-4-5-8-10-11-12-13'
      }
    } else if (this.niveau === 4) {
      if (choixThisSup === '0') {
        choixThisSup = '1-2-3-4-5-6-7-8-9-10-11-12-13'
      }
    }
    const listeTypeQuestionsBase = gestionnaireFormulaireTexte({
      saisie: choixThisSup,
      min: 1,
      max: 13,
      defaut: 1,
      melange: 0,
      // shuffle: false, //true bien pour les tests
      nbQuestions: Math.min(nbElements, 50),
    })

    const listeTypeQuestions = combinaisonListes(
      listeTypeQuestionsBase,
      nbElements,
    )

    type MotVocabulaire = {
      num: number
      txtCellule: string
      txtEnonce: string
      txtCorrection: string
      txtFormule: string
      plainFormule: string
    }
    const listeMots: MotVocabulaire[] = [
      {
        num: 1,
        txtCellule: 'Son double',
        txtEnonce: 'le double du nombre de départ',
        txtCorrection: 'le double de ',
        txtFormule: `$${miseEnEvidence(`\\text{=B1*2}`)}$`,
        plainFormule: '=B1*2',
      },
      {
        num: 2,
        txtCellule: 'Son triple',
        txtEnonce: 'le triple du nombre de départ',
        txtCorrection: 'le triple de ',
        txtFormule: `$${miseEnEvidence(`\\text{=B1*3}`)}$`,
        plainFormule: '=B1*3',
      },
      {
        num: 3,
        txtCellule: 'Sa moitié',
        txtEnonce: 'la moitié du nombre de départ',
        txtCorrection: 'la moitié de ',
        txtFormule: `$${miseEnEvidence(`\\text{=B1/2}`)}$`,
        plainFormule: '=B1/2',
      },
      {
        num: 4,
        txtCellule: 'Son quart',
        txtEnonce: 'le quart du nombre de départ',
        txtCorrection: 'le quart de ',
        txtFormule: `$${miseEnEvidence(`\\text{=B1/4}`)}$`,
        plainFormule: '=B1/4',
      },
      {
        num: 5,
        txtCellule: 'Son dixième',
        txtEnonce: 'le dixième du nombre de départ',
        txtCorrection: 'le dixième de ',
        txtFormule: `$${miseEnEvidence(`\\text{=B1/10}`)}$`,
        plainFormule: '=B1/10',
      },
      {
        num: 6,
        txtCellule: 'Son carré',
        txtEnonce: 'le carré du nombre de départ',
        txtCorrection: 'le carré de ',
        txtFormule: `$${miseEnEvidence(`\\text{=B1\\textasciicircum 2}`)}$`,
        plainFormule: '=B1^2',
      },
      {
        num: 7,
        txtCellule: 'Son cube',
        txtEnonce: 'le cube du nombre de départ',
        txtCorrection: 'le cube de ',
        txtFormule: `$${miseEnEvidence(`\\text{=B1\\textasciicircum 3}`)}$`,
        plainFormule: '=B1^3',
      },
      {
        num: 8,
        txtCellule: 'Son opposé',
        txtEnonce: "l'opposé du nombre de départ",
        txtCorrection: `l'opposé de `,
        txtFormule: `$${miseEnEvidence(`\\text{=-B1}`)}$`,
        plainFormule: '=-B1',
      },
      {
        num: 9,
        txtCellule: 'Son inverse',
        txtEnonce: "l'inverse du nombre de départ",
        txtCorrection: `l'inverse de `,
        txtFormule: `$${miseEnEvidence(`\\text{=1/B1}`)}$`,
        plainFormule: '=1/B1',
      },
      {
        num: 10,
        txtCellule: 'La somme de number1 et number2',
        txtEnonce: '',
        txtCorrection: 'la somme de ',
        txtFormule: `$${miseEnEvidence(`\\text{=B1+B2}`)}$`,
        plainFormule: '=B1+B2',
      },
      {
        num: 11,
        txtCellule: 'La différence entre number1 et number2',
        txtEnonce: '',
        txtCorrection: 'la différence entre ',
        txtFormule: `$${miseEnEvidence(`\\text{=B1-B2}`)}$`,
        plainFormule: '=B1-B2',
      },
      {
        num: 12,
        txtCellule: 'Le produit de number1 et number2',
        txtEnonce: '',
        txtCorrection: 'le produit de ',
        txtFormule: `$${miseEnEvidence(`\\text{=B1*B2}`)}$`,
        plainFormule: '=B1*B2',
      },
      {
        num: 13,
        txtCellule: 'Le quotient de number1 par number2',
        txtEnonce: '',
        txtCorrection: 'le quotient de ',
        txtFormule: `$${miseEnEvidence(`\\text{=B1/B2}`)}$`,
        plainFormule: '=B1/B2',
      },
    ]

    for (let q = 0, cpt = 0; q < this.nbQuestions && cpt < 50; cpt++) {
      // const q = 0
      let texte = ''
      let texteCorr = ''
      const listeMotsCellule: string[] = []
      const listeMotsEnonce: string[] = []
      const nbColTableur = 2
      const nbDepart = randint(15, 40)
      type CellType = 1 | 2 | 3

      interface CellData {
        v: string | number
        s: string
        t: CellType
        formule?: string
      }
      const cellDatas: CellData[][] = [[]]
      const cellDatasCorr: CellData[][] = [[]]
      const lesBonnesFormules: GoodAnswersFormulas = []
      cellDatas[0][0] = {
        v: 'Nombre de départ',
        s: '', // 'style_id_orange', // couleur uniquement apriori ?
        t: 1, //  1:text, 2:number, 3:boolean
      }
      cellDatas[0][1] = {
        v: `${nbDepart}`,
        s: '', // 'style_id_orange', // couleur uniquement apriori ?
        t: 2, //  1:text, 2:number, 3:boolean
      }
      cellDatasCorr[0][0] = {
        v: 'Nombre de départ',
        s: '', // 'style_id_orange', // couleur uniquement apriori ?
        t: 1, //  1:text, 2:number, 3:boolean
      }
      cellDatasCorr[0][1] = {
        v: `${nbDepart}`,
        s: '', // 'style_id_orange', // couleur uniquement apriori ?
        t: 2, //  1:text, 2:number, 3:boolean
      }
      let motCellule: string = ''
      let motEnonce: string = ''
      let formule: string = ''
      let plainFormule: string = ''

      for (let i = q * nbLignes; i < (q + 1) * nbLignes; i++) {
        const lOperation = Number(listeTypeQuestions[i])
        motCellule = listeMots[lOperation - 1].txtCellule
        formule = listeMots[lOperation - 1].txtFormule
        plainFormule = listeMots[lOperation - 1].plainFormule
        const nb2 = randint(15, 40, [nbDepart])
        switch (lOperation) {
          case 10: // somme
            motCellule = motCellule
              .replace('de number1', 'du nombre de départ')
              .replace('number2', `de ${nb2}`)
            formule = formule.replace('B2', `${nb2}`)
            plainFormule = plainFormule.replace('B2', `${nb2}`)
            break
          case 11: // différence
            if (nb2 < nbDepart) {
              motCellule = motCellule.replace(
                'entre number1 et number2',
                `entre le nombre de départ et ${nb2}`,
              )
              formule = formule.replace('B2', `${nb2}`)
              plainFormule = plainFormule.replace('B2', `${nb2}`)
            } else {
              motCellule = motCellule.replace(
                'entre number1 et number2',
                `entre ${nb2} et le nombre de départ`,
              )
              formule = formule.replace('B1-B2', `${nb2}-B1`)
              plainFormule = plainFormule.replace('B1-B2', `${nb2}-B1`)
            }
            break
          case 12: // produit
            motCellule = motCellule
              .replace('de number1', 'du nombre de départ')
              .replace('number2', `${nb2}`)
            formule = formule.replace('B2', `${nb2}`)
            plainFormule = plainFormule.replace('B2', `${nb2}`)
            break
          case 13: // quotient
            if (nb2 < nbDepart) {
              motCellule = motCellule.replace(
                'de number1 par number2',
                `du nombre de départ par ${nb2}`,
              )
              formule = formule.replace('B2', `${nb2}`)
              plainFormule = plainFormule.replace('B2', `${nb2}`)
            } else {
              motCellule = motCellule.replace(
                'de number1 par number2',
                `de ${nb2} par le nombre de départ`,
              )
              formule = formule.replace('B1/B2', `${nb2}/B1`)
              plainFormule = plainFormule.replace('B1/B2', `${nb2}/B1`)
            }
            break
        }

        if (lOperation > 9)
          motEnonce = motCellule.charAt(0).toLowerCase() + motCellule.slice(1)
        else motEnonce = listeMots[lOperation - 1].txtEnonce
        listeMotsCellule.push(motCellule)
        listeMotsEnonce.push(motEnonce)
        lesBonnesFormules.push({
          ref: `B${i - q * nbLignes + 2}`,
          formula: plainFormule,
        })
      }

      // GoodAnswersFormulas
      for (let i = 0; i < nbLignes; i++) {
        cellDatas.push([]) // creer une ligne par question
        cellDatas[i + 1][0] = {
          v: `${listeMotsCellule[i]}`,
          formule: `${lesBonnesFormules[i].formula}`,
          s: '',
          t: 1,
        }
        cellDatasCorr.push([]) // creer une ligne par question
        cellDatasCorr[i + 1][0] = {
          v: `${listeMotsCellule[i]}`,
          formule: `${lesBonnesFormules[i].formula}`,
          s: '',
          t: 1,
        }
        cellDatasCorr[i + 1][1] = {
          v: `${lesBonnesFormules[i].formula}`,
          formule: `${lesBonnesFormules[i].formula}`,
          s: '',
          t: 1,
        }
      }

      // data et style pour le tableur interactif
      const data: (number | string)[][] = [[]]
      data[0][0] = cellDatas[0][0].v
      data[0][1] = cellDatas[0][1].v

      const dataCorr: (number | string)[][] = [[]]
      dataCorr[0][0] = cellDatas[0][0].v
      dataCorr[0][1] = cellDatas[0][1].v

      for (let i = 0; i < nbLignes; i++) {
        data.push([]) // creer une ligne par question
        data[i + 1][0] = cellDatas[i + 1][0].v
        dataCorr.push([]) // creer une ligne par question
        dataCorr[i + 1][0] = cellDatasCorr[i + 1][0].v
        dataCorr[i + 1][1] = cellDatasCorr[i + 1][1].v
      }

      data.push([]) // ligne vide en plus
      dataCorr.push([]) // ligne vide en plus
      const style: Record<string, string> = {}
      for (let i = 0; i < nbLignes + 2; i++) {
        const key = `A${i}`
        style[key] = 'text-align: left ; color:black' // 'background: #eca2a2'
      }
      style['B1'] = 'text-align: left ; color:black' // 'background: #eca2a2'

      texte += `On choisit un nombre de départ (ici, ${nbDepart}). <br>`
      const mot = []
      for (let j = 0; j < listeMotsEnonce.length; j++) {
        mot.push(
          listeMotsEnonce[j].charAt(0).toLowerCase() +
            listeMotsEnonce[j].slice(1),
        )
        texte += `Saisir, dans la cellule B${j + 2}, la formule pour calculer ${mot[j]}.<br>`
      }

      texte += '<br>'
      texte += 'Attention, '
      texte += nbLignes === 1 ? 'la formule doit' : 'les formules doivent'
      texte +=
        ' fonctionner même si le nombre de départ change (dans la cellule B1).<br><br>'

      if (context.isHtml) {
        texte += addSheet({
          numeroExercice: this.numeroExercice ?? 0,
          question: q,
          data,
          minDimensions: [nbColTableur, 2], // listeMotsEnonce.length + 1],
          style,
          columns: [
            { width: 320 }, // Suffisamment large pour que toutes les textes rentrent
            { width: 90 },
            { width: 90 },
            { width: 90 },
          ],
          interactif: this.interactif,
          showVerifyButton: false,
          readOnlyCells: [`A1:A${nbLignes + 1}`, `C1:D${nbLignes + 1}`],
        })

        texteCorr += addSheet({
          numeroExercice: this.numeroExercice ?? 0,
          question: q,
          data: dataCorr,
          minDimensions: [nbColTableur, 2], // listeMotsEnonce.length + 1],
          style,
          columns: [
            { width: 320 }, // Suffisamment large pour que toutes les textes rentrent
            { width: 90 },
            { width: 90 },
            { width: 90 },
          ],
          interactif: false,
          showVerifyButton: false,
          readOnlyCells: [`A1:D${nbLignes + 1}`],
        })
        handleAnswers(
          this,
          q,
          {
            sheetAnswer: {
              goodAnswerFormulas: lesBonnesFormules,
              sheetTestDatas: [
                {
                  ref: `B1`,
                  rangeValues: [1, 10],
                },
              ],
            },
          },
          { formatInteractif: 'tableur' },
        )
      } else {
        const options: {
          formule?: boolean
          formuleTexte?: string
          formuleCellule?: string
          firstColHeaderWidth?: string
        } = {}
        options.formule = true
        options.formuleTexte = '=?'
        options.formuleCellule = 'B1'

        texte += createTableurLatex(
          nbLignes + 1,
          4,
          cellDatas,
          ExerciceTableurVocabulaire.styles,
          options,
        )
        texteCorr += createTableurLatex(
          nbLignes + 1,
          4,
          cellDatasCorr,
          ExerciceTableurVocabulaire.styles,
          options,
        )
      }

      /*
      texteCorr += 'Voici les formules à saisir dans le tableur :<br>'
      for (let i = 0; i < nbLignes; i++) {
        const index = i + q * nbLignes
        const lOperation = Number(listeTypeQuestions[index])
        let formule = lesBonnesFormules[i].formula
        if (typeof formule === 'string')
          if (!context.isHtml && formule.includes('^')) {
            formule = formule.replace(/\^/g, `\\^{}`)
          }
        texteCorr += `Pour calculer ${listeMots[lOperation - 1].txtCorrection}${nbDepart}, la formule  à saisir dans la cellule ${lesBonnesFormules[i].ref} est : ${formule}.<br>`
      }
      */

      if (this.questionJamaisPosee(q, nbDepart, listeMotsEnonce[0])) {
        this.listeQuestions[q] = texte
        this.listeCorrections[q] = texteCorr
        q++
      }
      listeQuestionsToContenu(this)
    }
  }
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] // A1..F1 max

/**
 * Construit l'objet `style` de type { 'A1': '#color', ... } à partir de `colos`
 * Nombre de cellules = listeSteps + 1, borné à A1..F1.
 *
 * Règles:
 * - Si colos est plus court que le nombre de cellules, on répète la dernière couleur.
 * - Si listeSteps + 1 > 6, on tronque à F1.
 */
export function buildStyleFromColos(
  colos: string[],
  listeSteps: number,
): Record<string, string> {
  const nbCells = Math.max(1, Math.min(listeSteps + 1, LETTERS.length))
  const style: Record<string, string> = {}
  for (let i = 0; i < nbCells; i++) {
    const key = `${LETTERS[i]}1`
    const color = colos[i] ? `background: ${colos[i]}` : 'background:  #ffffff'
    style[key] = color
  }
  return style
}
