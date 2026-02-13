import { choice, shuffle } from '../../lib/outils/arrayOutils'
import { context } from '../../modules/context'
import { randint } from '../../modules/outils'
import { scratchblock } from '../../modules/scratchblock'
import Exercice from '../Exercice'
// Ici ce sont les fonctions de la librairie maison 2d.js qui gèrent tout ce qui est graphique (SVG/tikz) et en particulier ce qui est lié à l'objet lutin

export const interactifReady = true
export const interactifType = 'svgSelection'

export const titre = 'Trouver le bon programme'
export const uuid = 'e9cad'

export const refs = {
  'fr-fr': ['6I1B-6'],
  'fr-2016': [],
  'fr-ch': [],
}

function programmeAvancerType1(nbPas: number, vraiOuFaux: boolean) {
  let codeScratch = `\\begin{scratch}[blocks]\n`
  for (
    let i = 0;
    i < (vraiOuFaux ? nbPas : choice([nbPas - 1, nbPas + 1]));
    i++
  ) {
    codeScratch += '\\blockmove{Avancer de \\ovalNum{10} pas}\n'
  }
  codeScratch += `\\end{scratch}`
  return codeScratch
}

function programmeAvancerType2(nbPas: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]\n
\\blockmove{Avancer de \\ovalnum{10} pas}
\\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? nbPas - 1 : nbPas}} fois}{
\\blockmove{Avancer de \\ovalnum{10} pas}
}
\\end{scratch}\n`
  return codeScratch
}

function programmeAvancerType3(nbPas: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]\n
\\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? nbPas - 1 : nbPas}} fois}{
\\blockmove{Avancer de \\ovalnum{10} pas}
}
\\blockmove{Avancer de \\ovalnum{10} pas}
\\end{scratch}\n`
  return codeScratch
}

function programmeAvancerType4(nbPas: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]\n
\\blockrepeat{répéter \\ovalnum{${Math.floor(nbPas / 2)}} fois}{
\\blockmove{Avancer de \\ovalnum{10} pas}
\\blockmove{Avancer de \\ovalnum{10} pas}
}
${(nbPas % 2 === 1 && vraiOuFaux) || (nbPas % 2 === 0 && !vraiOuFaux) ? '\\blockmove{Avancer de \\ovalnum{10} pas}' : ''}
\\end{scratch}\n`
  return codeScratch
}

function programmeAvancerType5(nbPas: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]\n
\\blockrepeat{répéter \\ovalnum{${(nbPas - 1) * 2}} fois}{
\\blockmove{Avancer de \\ovalnum{5} pas}
}
${vraiOuFaux ? '\\blockmove{Avancer de \\ovalnum{10} pas}' : '\\blockmove{Avancer de \\ovalnum{5} pas}'}
\\end{scratch}\n`
  return codeScratch
}

function getProgrammesAvancer(nbPas: number): string[] {
  const vraiOuFaux = shuffle([true, true, false, false, false])
  const programmesListe = shuffle([
    String(scratchblock(programmeAvancerType1(nbPas, vraiOuFaux[0]))),
    String(scratchblock(programmeAvancerType2(nbPas, vraiOuFaux[1]))),
    String(scratchblock(programmeAvancerType3(nbPas, vraiOuFaux[2]))),
    String(scratchblock(programmeAvancerType4(nbPas, vraiOuFaux[3]))),
    String(scratchblock(programmeAvancerType5(nbPas, vraiOuFaux[4]))),
  ])
  return programmesListe
}

function programmeTournerType1(angle: number, vraiOuFaux: boolean) {
  let codeScratch = `\\begin{scratch}[blocks]\n`
  codeScratch += '\\blockmove{tourner \\turnright{} de \\ovalNum{10} degrés}\n'
  if (angle % 20 === 0) {
    for (let i = 0; i < (vraiOuFaux ? angle / 20 - 1 : angle / 20); i++) {
      codeScratch +=
        '\\blockmove{tourner \\turnright{} de \\ovalNum{20} degrés}\n'
    }
    if (vraiOuFaux)
      codeScratch +=
        '\\blockmove{tourner \\turnright{} de \\ovalNum{10} degrés}\n'
  } else {
    for (let i = 0; i < (vraiOuFaux ? angle / 10 - 3 : angle / 10 - 2); i++) {
      codeScratch +=
        '\\blockmove{tourner \\turnright{} de \\ovalNum{10} degrés}\n'
    }
    codeScratch +=
      '\\blockmove{tourner \\turnright{} de \\ovalNum{20} degrés}\n'
  }

  codeScratch += `\\end{scratch}`
  return codeScratch
}

function programmeTournerType2(angle: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]\n
\\blockmove{tourner \\turnright{} de \\ovalnum{10} degrés}
\\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? angle / 10 + 2 : angle / 10 - 2}} fois}{
\\blockmove{tourner \\turnleft{} de \\ovalnum{10} degrés}
}
\\blockmove{tourner \\turnright{} de \\ovalnum{10} degrés}
\\end{scratch}\n`
  return codeScratch
}

function programmeTournerType3(angle: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]\n
\\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? angle / 10 - 1 : angle / 10}} fois}{
\\blockmove{tourner \\turnright{} de \\ovalnum{10} degrés}
}
\\blockmove{tourner \\turnright{} de \\ovalnum{10} degrés}
\\end{scratch}\n`
  return codeScratch
}

function programmeTournerType4(angle: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]\n
\\blockrepeat{répéter \\ovalnum{${Math.floor(angle / 20)}} fois}{
\\blockrepeat{répéter \\ovalnum{2} fois}{
\\blockmove{tourner \\turnright{} de \\ovalnum{10} degrés}
}
}
${(angle % 20 === 10 && vraiOuFaux) || (angle % 20 === 0 && !vraiOuFaux) ? '\\blockmove{tourner \\turnright{} de \\ovalnum{10} degrés}' : ''}
\\end{scratch}\n`
  return codeScratch
}

function programmeTournerType5(angle: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]\n
\\blockrepeat{répéter \\ovalnum{${(angle / 10 + 1) * 2}} fois}{
\\blockmove{tourner \\turnright{} de \\ovalnum{5} degrés}
}
${vraiOuFaux ? '\\blockmove{tourner \\turnleft{} de \\ovalnum{10} degrés}' : '\\blockmove{tourner \\turnright{} de \\ovalnum{10} degrés}'}
\\end{scratch}\n`
  return codeScratch
}

function getProgrammesTourner(angle: number): string[] {
  const vraiOuFaux = shuffle([true, true, false, false, false])
  const programmesListe = shuffle([
    String(scratchblock(programmeTournerType1(angle, vraiOuFaux[0]))),
    String(scratchblock(programmeTournerType2(angle, vraiOuFaux[1]))),
    String(scratchblock(programmeTournerType3(angle, vraiOuFaux[2]))),
    String(scratchblock(programmeTournerType4(angle, vraiOuFaux[3]))),
    String(scratchblock(programmeTournerType5(angle, vraiOuFaux[4]))),
  ])
  return programmesListe
}

export default class TrouverLeBonProgramme extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
  }

  nouvelleVersion(): void {
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const getProgrammes = [getProgrammesAvancer, getProgrammesTourner][i % 2]
      const nbPas = i % 2 === 0 ? randint(3, 8) : 10 * randint(4, 7)
      const programmes = getProgrammes(nbPas)
      let texte =
        i % 2 === 0
          ? `On souhaite faire avancer le lutin de ${nbPas * 10} pas.<br>
      Donner le numéro du (ou des) programme(s) correct(s)<br>`
          : `On souhaite faire tourner le lutin de ${nbPas} degrés dans le sens des aiguilles d'une montre.<br>
      Donner le numéro du (ou des) programme(s) correct(s)<br>`
      const ligne1 = [
        'Programme 1',
        'Programme 2',
        'Programme 3',
        'Programme 4',
        'Programme 5',
      ]
      const ligne2 = programmes
      if (context.isHtml) {
        texte +=
          '<table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; margin: 20px 0;">'
        texte += '<thead><tr style="background-color: #f0f0f0;">'
        for (const titre of ligne1) {
          texte += `<th style="border: 1px solid #ddd; padding: 10px; text-align: center;">${titre}</th>`
        }
        texte += '</tr></thead>'
        texte += '<tbody><tr>'
        for (const programme of ligne2) {
          texte += `<td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${programme}</td>`
        }
        texte += '</tr></tbody>'
        texte += '</table>'
      } else {
        texte += '\\begin{center}\n'
        texte += '\\begin{tabular}{|c|c|c|c|c|}\n'
        texte += '\\hline\n'
        for (const titre of ligne1) {
          texte += titre
          if (titre !== ligne1[ligne1.length - 1]) texte += ' & '
        }
        texte += ' \\\\\n'
        texte += '\\hline\n'
        for (const programme of ligne2) {
          texte += programme
          if (programme !== ligne2[ligne2.length - 1]) texte += ' & '
        }
        texte += ' \\\\\n'
        texte += '\\hline\n'
        texte += '\\end{tabular}\n'
        texte += '\\end{center}\n'
      }

      if (this.questionJamaisPosee(i, nbPas, i % 2)) {
        this.listeQuestions.push(texte)
        this.listeCorrections.push()
        i++
      }
      cpt++
    }
  }
}
