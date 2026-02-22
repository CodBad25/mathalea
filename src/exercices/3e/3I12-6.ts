import { setCliqueFigure } from '../../lib/interactif/gestionInteractif'
import { choice, shuffle } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { rangeMinMax } from '../../lib/outils/nombres'
import { createScratchSimulatorElement } from '../../lib/scratchSimulator'
import { context } from '../../modules/context'
import { gestionnaireFormulaireTexte, randint } from '../../modules/outils'
import { scratchblock } from '../../modules/scratchblock'
import Exercice from '../Exercice'
// Ici ce sont les fonctions de la librairie maison 2d.js qui gèrent tout ce qui est graphique (SVG/tikz) et en particulier ce qui est lié à l'objet lutin

export const interactifReady = true
export const interactifType = 'cliqueFigure'
export const dateDePublication = '20/02/2026'

export const titre = 'Trouver le bon programme Scratch'
export const uuid = 'e9caf'

export const refs = {
  'fr-fr': [],
  'fr-2016': [],
  'fr-ch': [],
}
/**
 * @author Jean-Claude Lhote
 * Cet exercice utilise le simulateur Scratch (ScratchSimulator) couplé à l'interpréteur Scratch (ScratchInterpreter) de la librairie maison.
 *  L'exercice génère aléatoirement les programmes et les résultats attendus, ainsi que des programmes faux qui sont proches du programme correct pour rendre l'exercice plus difficile.
 *  L'élève peut exécuter les programmes dans le simulateur pour vérifier leur fonctionnement.
 */

const syracuseNumbers = rangeMinMax(2, 100)
  .map((n) => [n, syracuse(n)])
  .filter(([n, steps]) => steps <= 10)
const choixSyracuse: Record<number, number[]> = {}
for (let i = 0; i < syracuseNumbers.length; i++) {
  const [n, steps] = syracuseNumbers[i]
  if (!choixSyracuse[steps]) {
    choixSyracuse[steps] = []
  }
  choixSyracuse[steps].push(n)
}

export default class TrouverLeBonProgrammeConditionnelles extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.besoinFormulaireTexte = [
      'Types de questions',
      "Nombres séparés par des tirets\n1 : Arriver sur une position donnée\n2 : Arriver à 1 en un nombre d'étapes donné (problème de Syracuse)",
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
    this.figures = [[]]
    const ligne1 = [
      'Programme 1',
      'Programme 2',
      'Programme 3',
      'Programme 4',
      'Programme 5',
    ]
    for (let q = 0, cpt = 0; q < this.nbQuestions && cpt < 10; q++) {
      let vraisOuFaux: boolean[] = []
      const directionX = choice([-1, 1])
      const cible = {
        x: randint(3, 5) * 15 * directionX,
        y: randint(3, 5) * 15,
      }
      const listeProgrammes = []
      const simulateurs = []
      let texte
      this.autoCorrection[q] = {}
      setCliqueFigure(this.autoCorrection[q])
      switch (listeTypeDeQuestions[q]) {
        case 1:
          {
            const nbTrue = randint(1, 3)
            vraisOuFaux = shuffle(
              Array(nbTrue)
                .fill(true)
                .concat(Array(5 - nbTrue).fill(false)),
            )
            texte = `Trouver le bon programme Scratch qui permet de déplacer le lutin à la position ${cible.x}, ${cible.y}.`
            if (context.isHtml) {
              texte +=
                '<div style="margin: 20px 0; display: flex; flex-wrap: wrap; gap: 12px; width: 100%; align-items: flex-start;">'
            }
            this.autoCorrection[q].enonce = texte
            for (let i = 0; i < 5; i++) {
              const startX1 = randint(-3, 3, 0) * 15
              const startY1 = randint(-3, 3, 0) * 15
              const distances = {
                x: (cible.x - startX1) * directionX,
                y: cible.y - startY1,
              }
              const nbRepetitionsX = Math.round(distances.x / 15)
              const nbRepetitionsY = Math.round(distances.y / 15)
              const codeScratch1 = programmeConditionnelle1(
                nbRepetitionsX,
                nbRepetitionsY,
                { x: startX1, y: startY1 },
                vraisOuFaux[i],
                directionX,
              )
              if (context.isHtml) {
                listeProgrammes.push(String(scratchblock(codeScratch1)))
                simulateurs.push(
                  createScratchSimulatorElement(
                    codeScratch1.replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
                    1000,
                  ),
                )
              } else {
                listeProgrammes.push(codeScratch1)
              }
              this.autoCorrection[q].propositions = [
                {
                  texte: listeProgrammes[i],
                  statut: vraisOuFaux[i],
                },
              ]
              this.figures[q].push({
                solution: vraisOuFaux[i],
                id: `cliqueFigure${i}Ex${this.numeroExercice}Q${q}`,
              })
              this.listeCorrections[q] =
                `Le programme correct est celui qui permet de déplacer le lutin à la position ${cible.x}, ${cible.y}.<br>
    ${vraisOuFaux
      .map((vrai, index) => {
        return `Le programme $${vrai ? `${miseEnEvidence(`${index + 1}`)}` : `${index + 1}`}$ ${vrai ? 'fait arriver le lutin au bon endroit' : 'ne fait pas arriver le lutin au bon endroit'}.`
      })
      .join('<br>')}<br>
    ${simulateurs.join('<br>')}<br>`
            }
          }
          break
        case 2:
        default:
          {
            const nbBoucles = choice(Object.keys(choixSyracuse).map(Number))
            texte = `Trouver le bon programme Scratch qui se termine avec $${nbBoucles}$ dans la variable compteur.`
            if (context.isHtml) {
              texte +=
                '<div style="margin: 20px 0; display: flex; flex-wrap: wrap; gap: 12px; width: 100%; align-items: flex-start;">'
            }

            const listeNombres = shuffle(choixSyracuse[nbBoucles])
            const nbTrue = randint(1, Math.min(listeNombres.length, 3))
            const nombresChoisis: number[] = []
            vraisOuFaux = shuffle(
              Array(nbTrue)
                .fill(true)
                .concat(Array(5 - nbTrue).fill(false)),
            )
            for (let i = 0; i < 5; i++) {
              if (vraisOuFaux[i]) {
                nombresChoisis.push(Number(listeNombres.pop()))
              } else {
                nombresChoisis.push(randint(2, 50, listeNombres))
              }
            }
            for (let i = 0; i < 5; i++) {
              const codeScratch2 = programmeSiracuse(nombresChoisis[i])
              if (context.isHtml) {
                listeProgrammes.push(String(scratchblock(codeScratch2)))
                simulateurs.push(
                  createScratchSimulatorElement(
                    codeScratch2.replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
                    1000,
                  ),
                )
              } else {
                listeProgrammes.push(codeScratch2)
              }
            }
            this.listeCorrections[q] =
              `Le programme correct est celui qui se termine avec ${nbBoucles} dans la variable compteur.<br>
    ${vraisOuFaux
      .map((vrai, index) => {
        return `Le programme $${vraisOuFaux[index] ? `${miseEnEvidence(`${index + 1}`)}` : `${index + 1}`}$ se termine avec $${vraisOuFaux[index] ? miseEnEvidence(String(syracuse(nombresChoisis[index]))) : `${syracuse(nombresChoisis[index])}`}$ dans la variable compteur.`
      })
      .join('<br>')}<br>
    ${simulateurs.join('<br>')}<br>`
          }
          break
      }
      for (let j = 0; j < 5; j++) {
        const titre = `programme ${j + 1}`
        if (context.isHtml) {
          texte += `<div id="cliqueFigure${j}Ex${this.numeroExercice}Q${q}" style="border: 1px solid #ddd; padding: 10px; flex: 1 1 260px; min-width: 260px;">`
          texte += `<div style="font-weight: 600; margin-bottom: 8px;">${titre}</div>`
          texte += listeProgrammes[j]
          texte += '</div>'
        } else {
          texte += '\\begin{center}\n'
          texte += '\\begin{tabular}{|c|c|c|}\n'
          texte += '\\hline\n'
          for (const titre of ligne1.slice(0, 3)) {
            texte += titre
            if (titre !== ligne1[2]) texte += ' & '
          }
          texte += ' \\\\\n'
          texte += '\\hline\n'
          for (const programme of listeProgrammes.slice(0, 3)) {
            texte += programme.replace(
              'scale=0.6',
              this.sup3 ? 'scale=0.6, print' : 'scale=0.6',
            )
            if (programme !== listeProgrammes[2]) texte += ' & '
          }
          texte += ' \\\\\n'
          texte += '\\hline\n'
          texte += '\\end{tabular}\n'
          texte += '\\end{center}\n'
          texte += '\\begin{center}\n'
          texte += '\\begin{tabular}{|c|c|}\n'
          texte += '\\hline\n'
          for (const titre of ligne1.slice(3, 5)) {
            texte += titre
            if (titre !== ligne1[4]) texte += ' & '
          }
          texte += ' \\\\\n'
          texte += '\\hline\n'
          for (const programme of listeProgrammes.slice(3, 5)) {
            texte += programme.replace(
              'scale=0.6',
              this.sup3 ? 'scale=0.6, print' : 'scale=0.6',
            )
            if (programme !== listeProgrammes[4]) texte += ' & '
          }
          texte += ' \\\\\n'
          texte += '\\hline\n'
          texte += '\\end{tabular}\n'
          texte += '\\end{center}\n'
        }
      }
      if (context.isHtml) {
        texte += '</div>'
        texte += `<span id="resultatCheckEx${this.numeroExercice}Q${q}"></span>`
      }
      if (this.questionJamaisPosee(q, listeTypeDeQuestions[q])) {
        this.listeQuestions[q] = texte
        this.figures[q] = [
          {
            solution: vraisOuFaux[0],
            id: `cliqueFigure0Ex${this.numeroExercice}Q${q}`,
          },
          {
            solution: vraisOuFaux[1],
            id: `cliqueFigure1Ex${this.numeroExercice}Q${q}`,
          },
          {
            solution: vraisOuFaux[2],
            id: `cliqueFigure2Ex${this.numeroExercice}Q${q}`,
          },
          {
            solution: vraisOuFaux[3],
            id: `cliqueFigure3Ex${this.numeroExercice}Q${q}`,
          },
          {
            solution: vraisOuFaux[4],
            id: `cliqueFigure4Ex${this.numeroExercice}Q${q}`,
          },
        ]

        q++
      }
      cpt++
    }
  }
}

function programmeConditionnelle1(
  nbRepetitionsX: number,
  nbRepetitionsY: number,
  start: { x: number; y: number },
  vraiOuFaux: boolean,
  directionX: number,
): string {
  const operateur = directionX === 1 ? '>' : '<'
  const cibleX = start.x + 15 * nbRepetitionsX * directionX
  let décalementX = 0
  if (!vraiOuFaux) {
    décalementX = randint(1, 2) * 5 * directionX
  }
  const codeScratch = `\\begin{scratch}[blocks, scale=0.6]
\\blockmove{aller à x: \\ovalnum{${start.x}} y: \\ovalnum{${start.y}}}
\\blockmove{s'orienter à \\ovalnum{${directionX === 1 ? 90 : -90}}}
\\blockpen{stylo en position d'écriture}
\\blockrepeat{répéter \\ovalnum{${nbRepetitionsX + nbRepetitionsY}} fois}{
    \\blockifelse{si \\booloperator{\\ovalmove{abscisse x} ${operateur} \\ovalnum{${cibleX + décalementX - directionX}}} alors}{
        \\blockmove{ajouter \\ovalnum{15} à y}
    }
    {
        \\blockmove{ajouter \\ovalnum{${15 * directionX}} à x}
    }
}
\\blocklook{dire \\ovaloperator{regrouper \\ovalnum{x : } et \\ovalmove{abscisse x}}}
\\blocklook{dire \\ovaloperator{regrouper \\ovalnum{y : } et \\ovalmove{ordonnée y}}}
\\end{scratch}`
  return codeScratch
}
function syracuse(n: number): number {
  let stepCounter = 1
  while (n !== 1 && stepCounter < 20) {
    n = syracuseStep(n)
    stepCounter++
  }
  return stepCounter
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
        \\blocklook{dire \\ovalvariable{n} pendant \\ovalnum{0.5} secondes}
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
