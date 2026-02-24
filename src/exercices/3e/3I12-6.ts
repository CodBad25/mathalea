import { ajouteQuestionMathlive } from '../../lib/interactif/questionMathLive'
import { choice } from '../../lib/outils/arrayOutils'
import { rangeMinMax } from '../../lib/outils/nombres'
import { createScratchSimulatorElement } from '../../lib/ScratchSimulator'
import { context } from '../../modules/context'
import { gestionnaireFormulaireTexte } from '../../modules/outils'
import { scratchblock } from '../../modules/scratchblock'
import Exercice from '../Exercice'
// Ici ce sont les fonctions de la librairie maison 2d.js qui gèrent tout ce qui est graphique (SVG/tikz) et en particulier ce qui est lié à l'objet lutin

export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDePublication = '25/02/2026'

export const titre = 'Comprendre un programme avec conditionnelle'
export const uuid = 'eacaf'

export const refs = {
  'fr-fr': [],
  'fr-2016': [],
  'fr-ch': [],
}
/**
 * @author Jean-Claude Lhote
 * Cet exercice utilise le simulateur Scratch (ScratchSimulator) couplé à l'interpréteur Scratch (ScratchInterpreter) de la librairie maison.
 *  L'exercice génère aléatoirement les programmes et les résultats attendus.
 *  L'élève peut exécuter les programmes dans le simulateur pour vérifier leur fonctionnement.
 */

const syracuseNumbers = rangeMinMax(2, 100)
  .map((n) => Object.assign({ n }, syracuse(n)))
  .filter((obj) => obj.stepCounter <= 10)
const choixSyracuse: Record<number, { n: number; listeNombres: number[] }[]> =
  {}
for (let i = 0; i < syracuseNumbers.length; i++) {
  const { n, stepCounter, listeNombres } = syracuseNumbers[i]
  if (!choixSyracuse[stepCounter]) {
    choixSyracuse[stepCounter] = []
  }
  choixSyracuse[stepCounter].push({ n, listeNombres })
}

export default class TrouverLeBonProgrammeConditionnelles extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.besoinFormulaireTexte = [
      'Types de questions',
      'Nombres séparés par des tirets\n1 : Réciproque du théorème de Pythagore\n2 : Nombre de boucles dans la conjecture de Syracuse',
    ]
    this.sup = '1'
  }

  nouvelleVersion(): void {
    const listeTypeDeQuestions = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: 2,
      melange: 0,
      defaut: 1,
      nbQuestions: this.nbQuestions,
    }).map(Number)

    for (let q = 0, cpt = 0; q < this.nbQuestions && cpt < 10; q++) {
      let texte = ''
      switch (listeTypeDeQuestions[q]) {
        case 1:
          {
            const triplet = choice([
              [5, 12, 13],
              [6, 8, 10],
              [8, 15, 17],
              [9, 12, 15],
              [12, 16, 20],
              [15, 20, 25],
            ])
            const swap = choice([true, false])
            if (swap) {
              const temp = triplet[0]
              triplet[0] = triplet[1]
              triplet[1] = temp
            }
            texte =
              `On veut que le lutin dise que le triangle est rectangle. Quelle valeur doit-on saisir pour la longueur $AB$ ? ` +
              ajouteQuestionMathlive({
                exercice: this,
                question: q,
                objetReponse: { reponse: { value: triplet[0] } },
                typeInteractivite: 'mathlive',
              }) +
              '<br>'
            const codeScratch = programmeReciproquePythagore(triplet)
            if (context.isHtml) {
              texte += scratchblock(codeScratch)
            } else {
              texte += codeScratch
                .replaceAll('AB', '$AB$')
                .replaceAll('BC', '$BC$')
                .replaceAll('CA', '$CA$')
                .replaceAll('$AB$²', '$AB^2$')
                .replaceAll('$BC$²', '$BC^2$')
                .replaceAll('$CA$²', '$CA^2$')
            }

            this.listeCorrections[q] = `${
              context.isHtml
                ? createScratchSimulatorElement(
                    codeScratch.replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
                    500,
                  ) + '<br>'
                : ''
            }
              Pour que le programme dise que le triangle est rectangle, il faut saisir la valeur $${triplet[0]}$ pour la longueur $AB$.<br>
                En effet, le programme vérifie si $AB^2 + BC^2 = CA^2$.<br>
                Or $${triplet[0]}^2 + ${triplet[1]}^2 = ${triplet[0] ** 2 + triplet[1] ** 2}$ et $${triplet[2]}^2 = ${triplet[2] ** 2}$.`
          }
          break
        case 2:
        default:
          {
            const liste = choice(Object.entries(choixSyracuse))
            const nbBoucles = Number(liste[0])

            const nombreDeDepart = choice(liste[1])

            texte =
              `Quelle sera la valeur de la variable compteur dans le programme Scratch qui commence avec le nombre $${nombreDeDepart.n}$ ?` +
              ajouteQuestionMathlive({
                exercice: this,
                question: q,
                objetReponse: { reponse: { value: nbBoucles } },
                typeInteractivite: 'mathlive',
              }) +
              '<br>'
            const codeScratch = programmeSiracuse(nombreDeDepart.n)
            if (context.isHtml) {
              texte += scratchblock(codeScratch)
            } else {
              texte += codeScratch
            }
            const suiteSyracuse = nombreDeDepart.listeNombres
            this.listeCorrections[q] = `${
              context.isHtml
                ? createScratchSimulatorElement(
                    codeScratch.replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
                    2000,
                  ) + '<br>'
                : ''
            }
              La variable compteur finira avec la valeur $${nbBoucles}$, car le programme va afficher successivement les nombres :<br>
              ${suiteSyracuse
                .map((n, i) => {
                  if (i === suiteSyracuse.length - 1) {
                    return `$${n}$.`
                  } else {
                    return `$${n} \\rarr ${n % 2 === 0 ? `${n}\\div 2 = ${n / 2}$` : `3 \\times ${n} + 1 = ${3 * n + 1}$`}`
                  }
                })
                .join('<br>')}`
          }
          break
      }

      if (this.questionJamaisPosee(q, listeTypeDeQuestions[q])) {
        this.listeQuestions[q] = texte
        q++
      }
      cpt++
    }
  }
}

function programmeReciproquePythagore(triplet: number[]): string {
  const codeScratch = `\\begin{scratch}[blocks, scale=0.6]
  \\blocksensing{demander \\ovalnum{longueur AB} et attendre}
\\blockvariable{mettre \\selectmenu{AB} à \\ovalsensing{réponse}}
\\blockvariable{mettre \\selectmenu{BC} à \\ovalnum{${triplet[1]}}}
\\blockvariable{mettre \\selectmenu{CA} à \\ovalnum{${triplet[2]}}}
\\blockvariable{mettre \\selectmenu{AB²} à \\ovaloperator{\\ovalvariable{AB} * \\ovalvariable{AB}}}
\\blockvariable{mettre \\selectmenu{BC²} à \\ovaloperator{\\ovalvariable{BC} * \\ovalvariable{BC}}}
\\blockvariable{mettre \\selectmenu{CA²} à \\ovaloperator{\\ovalvariable{CA} * \\ovalvariable{CA}}}
\\blockifelse{si \\booloperator{\\ovaloperator{\\ovalvariable{AB²} + \\ovalvariable{BC²}} = \\ovalvariable{CA²}} alors}{
    \\blocklook{dire \\ovalnum{Le triangle est rectangle}}
}{
    \\blocklook{dire \\ovalnum{Le triangle n'est pas rectangle}}
}
\\end{scratch}`
  return codeScratch
}

function syracuse(n: number): { stepCounter: number; listeNombres: number[] } {
  let stepCounter = 1
  const listeNombres = [n]
  while (n !== 1 && stepCounter < 20) {
    n = syracuseStep(n)
    listeNombres.push(n)
    stepCounter++
  }
  return { stepCounter, listeNombres }
}
function syracuseStep(n: number): number {
  if (n % 2 === 0) {
    return n / 2
  } else {
    return 3 * n + 1
  }
}

function programmeSiracuse(n: number): string {
  const codeScratch = `\\begin{scratch}[blocks, scale=0.6]
    \\blockvariable{mettre \\selectmenu{n} à \\ovalnum{${n}}}
    \\blockvariable{mettre \\selectmenu{compteur} à \\ovalnim{0}}
    \\blockrepeat{répéter \\ovalnum{20} fois}{
        \\blockvariable{ajouter \\ovalnum{1} à \\selectmenu{compteur}}
        \\blocklook{dire \\ovalvariable{n}}
        \\blockif{si \\booloperator{\\ovalmove{n} = \\ovalnum{1}} alors}{
            \\blocklook{dire \\ovalvariable{compteur}}
            \\blockcontrol{stop \\selectmenu{tout}}
        }
        \\blockifelse{si \\booloperator{\\ovalmove{n} modulo \\ovalnum{2} = 0} alors}{
            \\blockvariable{mettre \\selectmenu{n} à \\ovaloperator{\\ovalmove{n} / \\ovalnum{2}}}
        }
        {
            \\blockvariable{mettre \\selectmenu{n} à \\ovaloperator{\\ovalnum{3} * \\ovalvariable{n}}}
            \\blockvariable{ajouter \\ovalnum{1} à \\selectmenu{n}}
        }
    }
         \\blocklook{dire \\ovalvariable{compteur}}
\\end{scratch}`
  return codeScratch
}
