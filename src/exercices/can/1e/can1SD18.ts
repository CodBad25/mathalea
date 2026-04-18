import { propositionsQcm } from '../../../lib/interactif/qcm'
import { choice } from '../../../lib/outils/arrayOutils'
import {
  ecritureAlgebrique,
  ecritureParentheseSiNegatif,
  rienSi1,
} from '../../../lib/outils/ecritures'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { listeQuestionsToContenu, randint } from '../../../modules/outils'
import Exercice from '../../Exercice'
import { bleuMathalea } from '../../../lib/colors'

export const titre =
  'Résoudre une inéquation du second degré (avec une forme factorisée)'
export const interactifReady = true
export const interactifType = 'qcm'

// Les exports suivants sont optionnels mais au moins la date de publication semble essentielle
export const dateDePublication = '07/10/2023' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

 */
export const uuid = '7c76a'

export const refs = {
  'fr-fr': ['can1SD18'],
  'fr-ch': [],
}
export default class TableauSignesSecondDegre extends Exercice {
  constructor() {
    super()

    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const coul0 = bleuMathalea
    let texte,
      texteCorr,
      a,
      b,
      c,
      solution1,
      solution2,
      solution3,
      solution4,
      inegalite,
      props
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      a = randint(1, 9) * choice([-1, 1]) // coefficient a
      b = randint(1, 9) * choice([-1, 1]) // racine1
      c = randint(1, 9, [b, -b]) * choice([-1, 1]) // racine2
      texteCorr = `$${rienSi1(a)}(x${ecritureAlgebrique(-b)})(x${ecritureAlgebrique(-c)})
        =\\mathbf{\\color{${coul0}}{${rienSi1(a)}}}\\color{black}(x-\\mathbf{\\color{${coul0}}{${ecritureParentheseSiNegatif(b)}}}\\color{black})(x-\\mathbf{\\color{${coul0}}{${ecritureParentheseSiNegatif(c)}}}\\color{black})$ 
        est de la forme $${miseEnEvidence('a(x-x_1)(x-x_2)', bleuMathalea)}$
        avec $a=\\mathbf{\\color{${coul0}}{${a}}}$, $x_1=\\mathbf{\\color{${coul0}}{${b}}}$ et $x_2=\\mathbf{\\color{${coul0}}{${c}}}$.<br>
        Cette forme est une expression factorisée d'un polynôme du second degré. <br>
        Cette expression est du signe de $a$ sauf entre ses racines.<br>
       `
      switch (choice([1, 2])) {
        case 1: // cas a(x-x1)(x-x2)>0
          inegalite = choice(['>', '\\geqslant'])
          if (inegalite === '>') {
            solution1 = `${
              a > 0
                ? `$]-\\infty\\,;\\,${b > c ? `${c}` : `${b}`}[\\cup]${b > c ? `${b}` : `${c}`}\\,;\\,+\\infty[$`
                : `$]${b > c ? `${c}` : `${b}`}\\,;\\,${b > c ? `${b}` : `${c}`}[$`
            }`
            solution2 = `${
              a < 0
                ? `$]-\\infty\\,;\\,${b > c ? `${c}` : `${b}`}[\\cup]${b > c ? `${b}` : `${c}`}\\,;\\,+\\infty[$`
                : `$]${b > c ? `${c}` : `${b}`}\\,;\\,${b > c ? `${b}` : `${c}`}[$`
            }`
            solution3 = `$[${b > c ? `${-b}` : `${-c}`}\\,;\\,${b > c ? `${-c}` : `${-b}`}]$`
            solution4 = `$]-\\infty\\,;\\,${b > c ? `${c}` : `${b}`}]\\cup[${b > c ? `${b}` : `${c}`}\\,;\\,+\\infty[$`
          } else {
            solution1 = `${
              a > 0
                ? `$]-\\infty\\,;\\,${b > c ? `${c}` : `${b}`}]\\cup[${b > c ? `${b}` : `${c}`}\\,;\\,+\\infty[$`
                : `$[${b > c ? `${c}` : `${b}`}\\,;\\,${b > c ? `${b}` : `${c}`}]$`
            }`
            solution2 = `${
              a < 0
                ? `$]-\\infty\\,;\\,${b > c ? `${c}` : `${b}`}]\\cup[${b > c ? `${b}` : `${c}`}\\,;\\,+\\infty[$`
                : `$[${b > c ? `${c}` : `${b}`}\\,;\\,${b > c ? `${b}` : `${c}`}]$`
            }`
            solution3 = `$]${b > c ? `${c}` : `${b}`}\\,;\\,${b > c ? `${b}` : `${c}`}[$`
            solution4 = `$]-\\infty\\,;\\,${b > c ? `${-b}` : `${-c}`}]\\cup[${b > c ? `${-c}` : `${-b}`}\\,;\\,+\\infty[$`
          }
          texte = `L'ensemble des solutions dans $\\mathbb R$ de l'inéquation
        $${rienSi1(a)}(x${ecritureAlgebrique(-b)})(x${ecritureAlgebrique(-c)}) ${inegalite} 0$ est :  `

          this.autoCorrection[i] = {
            enonce: texte,
            propositions: [
              {
                texte: solution1,
                statut: true,
              },
              {
                texte: solution2,
                statut: false,
              },
              {
                texte: solution3,
                statut: false,
              },
              {
                texte: solution4,
                statut: false,
              },
            ],
          }
          props = propositionsQcm(this, i)
          if (this.interactif) texte += props.texte
          else {
            texte = `Donner l'ensemble des solutions dans $\\mathbb R$ de l'inéquation
        $${rienSi1(a)}(x${ecritureAlgebrique(-b)})(x${ecritureAlgebrique(-c)}) ${inegalite} 0$ ?  `
          }

          if (a < 0) {
            texteCorr += `Ici, $a$ est négatif, donc $${rienSi1(a)}(x${ecritureAlgebrique(-b)})(x${ecritureAlgebrique(-c)})$ est négatif sauf entre ses racines 
            $${b > c ? `\\mathbf{\\color{${coul0}}{${c}}}` : `\\mathbf{\\color{${coul0}}{${b}}}`}$ et  $${b > c ? `\\mathbf{\\color{${coul0}}{${b}}}` : `\\mathbf{\\color{${coul0}}{${c}}}`}$. <br>
            
            
Il est donc positif entre ses racines. On en déduit que l'ensemble des solutions est `
            if (inegalite === '>') {
              texteCorr += `$${miseEnEvidence(']')}${b > c ? `${miseEnEvidence(c)}` : `${miseEnEvidence(b)}`}\\,${miseEnEvidence(';')}\\,${b > c ? `${miseEnEvidence(b)}` : `${miseEnEvidence(c)}`}${miseEnEvidence('[')}$. `
            } else {
              texteCorr += `$${miseEnEvidence('[')}${b > c ? `${miseEnEvidence(c)}` : `${miseEnEvidence(b)}`}\\,${miseEnEvidence(';')}\\,${b > c ? `${miseEnEvidence(b)}` : `${miseEnEvidence(c)}`}${miseEnEvidence(']')}$. `
            }
          } else {
            texteCorr += `Ici, $a$ est positif, donc $${rienSi1(a)}(x${ecritureAlgebrique(-b)})(x${ecritureAlgebrique(-c)})$ est positif sauf entre ses racines  $${b > c ? `\\mathbf{\\color{${coul0}}{${c}}}` : `\\mathbf{\\color{${coul0}}{${b}}}`}$ et  $${b > c ? `\\mathbf{\\color{${coul0}}{${b}}}` : `\\mathbf{\\color{${coul0}}{${c}}}`}$.<br>
On en déduit que l'ensemble des solutions est `
            if (inegalite === '>') {
              texteCorr += `$${miseEnEvidence(']-\\infty \\,;')}\\,${c < b ? `${miseEnEvidence(c)}` : `${miseEnEvidence(b)}`}${miseEnEvidence('[\\cup ]')}${b > c ? `${miseEnEvidence(b)}` : `${miseEnEvidence(c)}`}\\,${miseEnEvidence(';\\, +\\infty[')}$.`
            } else {
              texteCorr += `$${miseEnEvidence(']-\\infty \\,;')}\\,${c < b ? `${miseEnEvidence(c)}` : `${miseEnEvidence(b)}`}${miseEnEvidence(']\\cup [')}${b > c ? `${miseEnEvidence(b)}` : `${miseEnEvidence(c)}`}\\,${miseEnEvidence(';\\, +\\infty[')}$.`
            }
          }

          break

        case 2: // cas a(x-x1)(x-x2)<0
        default:
          inegalite = choice(['<', '\\leqslant'])
          if (inegalite === '<') {
            solution1 = `${
              a < 0
                ? `$]-\\infty\\,;\\,${b > c ? `${c}` : `${b}`}[\\cup]${b > c ? `${b}` : `${c}`}\\,;\\,+\\infty[$`
                : `$]${b > c ? `${c}` : `${b}`}\\,;\\,${b > c ? `${b}` : `${c}`}[$`
            }`
            solution2 = `${
              a > 0
                ? `$]-\\infty\\,;\\,${b > c ? `${c}` : `${b}`}[\\cup]${b > c ? `${b}` : `${c}`}\\,;\\,+\\infty[$`
                : `$]${b > c ? `${c}` : `${b}`}\\,;\\,${b > c ? `${b}` : `${c}`}[$`
            }`
            solution3 = `$[${b > c ? `${-b}` : `${-c}`}\\,;\\,${b > c ? `${-c}` : `${-b}`}]$`
            solution4 = `$]-\\infty\\,;\\,${b > c ? `${c}` : `${b}`}]\\cup[${b > c ? `${b}` : `${c}`}\\,;\\,+\\infty[$`
          } else {
            solution1 = `${
              a < 0
                ? `$]-\\infty\\,;\\,${b > c ? `${c}` : `${b}`}]\\cup[${b > c ? `${b}` : `${c}`}\\,;\\,+\\infty[$`
                : `$[${b > c ? `${c}` : `${b}`}\\,;\\,${b > c ? `${b}` : `${c}`}]$`
            }`
            solution2 = `${
              a > 0
                ? `$]-\\infty\\,;\\,${b > c ? `${c}` : `${b}`}]\\cup[${b > c ? `${b}` : `${c}`}\\,;\\,+\\infty[$`
                : `$[${b > c ? `${c}` : `${b}`}\\,;\\,${b > c ? `${b}` : `${c}`}]$`
            }`
            solution3 = `$]${b > c ? `${c}` : `${b}`}\\,;\\,${b > c ? `${b}` : `${c}`}[$`
            solution4 = `$]-\\infty\\,;\\,${b > c ? `${-b}` : `${-c}`}]\\cup[${b > c ? `${-c}` : `${-b}`}\\,;\\,+\\infty[$`
          }
          texte = `L'ensemble des solutions dans $\\mathbb R$ de l'inéquation
        $${rienSi1(a)}(x${ecritureAlgebrique(-b)})(x${ecritureAlgebrique(-c)}) ${inegalite} 0$ est :  `

          this.autoCorrection[i] = {
            enonce: texte,
            propositions: [
              {
                texte: solution1,
                statut: true,
              },
              {
                texte: solution2,
                statut: false,
              },
              {
                texte: solution3,
                statut: false,
              },
              {
                texte: solution4,
                statut: false,
              },
            ],
          }
          props = propositionsQcm(this, i)
          if (this.interactif) texte += props.texte
          else {
            texte = `Donner l'ensemble des solutions dans $\\mathbb R$ de l'inéquation
        $${rienSi1(a)}(x${ecritureAlgebrique(-b)})(x${ecritureAlgebrique(-c)}) ${inegalite} 0$ ?  `
          }

          if (a < 0) {
            texteCorr += `Ici, $a$ est négatif, donc $${rienSi1(a)}(x${ecritureAlgebrique(-b)})(x${ecritureAlgebrique(-c)})$ est négatif sauf entre ses racines 
            $${b > c ? `\\mathbf{\\color{${coul0}}{${c}}}` : `\\mathbf{\\color{${coul0}}{${b}}}`}$ et  $${b > c ? `\\mathbf{\\color{${coul0}}{${b}}}` : `\\mathbf{\\color{${coul0}}{${c}}}`}$. <br>
            
            
 On en déduit que l'ensemble des solutions est `
            if (inegalite === '<') {
              texteCorr += `$${miseEnEvidence(']-\\infty \\,;')}\\,${c < b ? `${miseEnEvidence(c)}` : `${miseEnEvidence(b)}`}${miseEnEvidence('[\\cup ]')}${b > c ? `${miseEnEvidence(b)}` : `${miseEnEvidence(c)}`}\\,${miseEnEvidence(';\\, +\\infty[')}$.`
            } else {
              texteCorr += `$${miseEnEvidence(']-\\infty \\,;')}\\,${c < b ? `${miseEnEvidence(c)}` : `${miseEnEvidence(b)}`}${miseEnEvidence(']\\cup [')}${b > c ? `${miseEnEvidence(b)}` : `${miseEnEvidence(c)}`}\\,${miseEnEvidence(';\\, +\\infty[')}$.`
            }
          } else {
            texteCorr += `Ici, $a$ est positif, donc $${rienSi1(a)}(x${ecritureAlgebrique(-b)})(x${ecritureAlgebrique(-c)})$ est positif sauf entre ses racines  $${b > c ? `\\mathbf{\\color{${coul0}}{${c}}}` : `\\mathbf{\\color{${coul0}}{${b}}}`}$ et  $${b > c ? `\\mathbf{\\color{${coul0}}{${b}}}` : `\\mathbf{\\color{${coul0}}{${c}}}`}$.<br>
Il est donc négatif entre ses racines. On en déduit que l'ensemble des solutions est `
            if (inegalite === '<') {
              texteCorr += `$${miseEnEvidence(']')}${b > c ? `${miseEnEvidence(c)}` : `${miseEnEvidence(b)}`}\\,${miseEnEvidence(';')}\\,${b > c ? `${miseEnEvidence(b)}` : `${miseEnEvidence(c)}`}${miseEnEvidence('[')}$. `
            } else {
              texteCorr += `$${miseEnEvidence('[')}${b > c ? `${miseEnEvidence(c)}` : `${miseEnEvidence(b)}`}\\,${miseEnEvidence(';')}\\,${b > c ? `${miseEnEvidence(b)}` : `${miseEnEvidence(c)}`}${miseEnEvidence(']')}$. `
            }
          }

          break
      }
      if (this.questionJamaisPosee(i, a)) {
        // Si la question n'a jamais été posée, on la stocke dans la liste des questions
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr

        this.canEnonce = texte

        this.listeCanEnonces.push(this.canEnonce)
        this.listeCanReponsesACompleter.push(this.canReponseACompleter)
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
