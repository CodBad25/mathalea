import {
  tableauSignesFacteurs,
  tableauSignesFonction,
} from '../../lib/mathFonctions/etudeFonction'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'
import { ecritureAlgebrique, rienSi1 } from '../../lib/outils/ecritures'
import { propositionsQcm } from '../../lib/interactif/qcm'

export const interactifReady = true
export const interactifType = 'qcm'
export const titre = "Déterminer le tableau de signes d'un polynôme de degré 3"
export const dateDePublication = '12/04/2026'

/**
 *
 * @author Arnaud Meistermann

*/
export const uuid = '49fca'
export const refs = {
  'fr-fr': ['1Tec-F31'],
  'fr-ch': [],
}

export default class TableauSignePolyDegre3 extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.besoinFormulaireTexte = [
      'Choix des questions',
      '1 : $ax^3+bx^2+cx+d$  avec $a>0$ \n2 : $ax^3+bx^2+cx+d$ avec $a<0$ \n3 : Mélange des cas précédents',
    ]
    this.sup = '3'

    this.nbCols = 2
    this.spacing = 1.5 // Interligne des questions
    this.spacingCorr = 1.5 // Interligne des réponses
  }

  nouvelleVersion() {
    this.autoCorrection = []
    const listeDeQuestions = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: 2,
      melange: 3,
      defaut: 3,
      nbQuestions: this.nbQuestions,
    })
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      let texte = ''
      let texteCorr = ''
      const a = listeDeQuestions[i] === 1 ? randint(1, 10) : randint(-10, -1)
      const x1 = randint(-10, 10, 0)
      const x2 = randint(-10, 10, [0, x1])
      const x3 = randint(-10, 10, [0, x1, x2])
      const xMin = -99
      const xMax = 99

      const facteurs = [
        ...(a !== 1
          ? [
              {
                nom: `${a}`,
                fonction: () => a,
              },
            ]
          : []),
        {
          nom: `x${ecritureAlgebrique(-x1)}`,
          fonction: (x: number) => x - x1,
          zero: x1,
        },
        {
          nom: `x${ecritureAlgebrique(-x2)}`,
          fonction: (x: number) => x - x2,
          zero: x2,
        },
        {
          nom: `x${ecritureAlgebrique(-x3)}`,
          fonction: (x: number) => x - x3,
          zero: x3,
        },
      ]

      const tableau = tableauSignesFacteurs(facteurs, xMin, xMax, {
        fractionTex: true,
        nomVariable: 'x',
        nomFonction: 'f(x)',
        borneInf: '-\\infty',
        borneSup: '+\\infty',
      })

      // Fonction correcte
      const fCorrecte = (x: number) => a * (x - x1) * (x - x2) * (x - x3)

      const tabCor = tableauSignesFonction(fCorrecte, xMin, xMax, {
        step: 1,
        tolerance: 0.1,
        substituts: [
          { antVal: xMin, antTex: '-\\infty' },
          { antVal: xMax, antTex: '+\\infty' },
        ],
      })

      // Distracteurs
      const fDis1 = (x: number) => -a * (x - x1) * (x - x2) * (x - x3)

      const fDis2 = (x: number) => a * (x + x1) * (x + x2) * (x + x3)

      const fDis3 = (x: number) => -a * (x + x1) * (x + x2) * (x + x3)

      const tabDis1 = tableauSignesFonction(fDis1, xMin, xMax, {
        step: 1,
        tolerance: 0.1,
        substituts: [
          { antVal: xMin, antTex: '-\\infty' },
          { antVal: xMax, antTex: '+\\infty' },
        ],
      })

      const tabDis2 = tableauSignesFonction(fDis2, xMin, xMax, {
        step: 1,
        tolerance: 0.1,
        substituts: [
          { antVal: xMin, antTex: '-\\infty' },
          { antVal: xMax, antTex: '+\\infty' },
        ],
      })

      const tabDis3 = tableauSignesFonction(fDis3, xMin, xMax, {
        step: 1,
        tolerance: 0.1,
        substituts: [
          { antVal: xMin, antTex: '-\\infty' },
          { antVal: xMax, antTex: '+\\infty' },
        ],
      })

      // QCM
      this.autoCorrection[i] = {
        options: { ordered: false, radio: true, vertical: true },
        enonce: 'Choisir le bon tableau de signes :',
        propositions: [
          { texte: tabCor, statut: true },
          { texte: tabDis1, statut: false },
          { texte: tabDis2, statut: false },
          { texte: tabDis3, statut: false },
        ],
      }

      const monQCM = propositionsQcm(this, i)

      // ÉNONCÉ
      texte = `On considère la fonction $f$ définie sur $\\mathbb{R}$ par
      $f(x)=${rienSi1(a)}(x${ecritureAlgebrique(-x1)})(x${ecritureAlgebrique(-x2)})(x${ecritureAlgebrique(-x3)})$.<br>`

      if (this.interactif) {
        texte += 'Quel est le tableau de signes de $f$ ?<br>'
        texte += `<style>
          #exercice${this.numeroExercice} .my-3 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            font-size: 1.1em;
            align-items: center;
            justify-items: center;
          }
        </style>`
        texte += monQCM.texte
      } else {
        texte += 'Déterminer le tableau de signes de $f$ sur $\\mathbb{R}$.'
      }

      // CORRECTION
      texteCorr =
        `Pour étudier le signe de $f$, on va étudier le signe de ses facteurs.<br>
        $x${ecritureAlgebrique(-x1)}>0 \\Leftrightarrow x > ${x1}$  <br>
        $x${ecritureAlgebrique(-x2)}>0 \\Leftrightarrow x > ${x2}$<br>
        $x${ecritureAlgebrique(-x3)}>0 \\Leftrightarrow x > ${x3}$<br>
      On obtient donc le tableau de signes : <br>
      ` + tableau

      if (this.questionJamaisPosee(i, texte)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
