import { propositionsQcm } from '../../lib/interactif/qcm'
import { choice, shuffle, shuffle3tableaux } from '../../lib/outils/arrayOutils'
import { createScratchSimulatorElement } from '../../lib/scratchSimulator'
import { context } from '../../modules/context'
import { gestionnaireFormulaireTexte, randint } from '../../modules/outils'
import { scratchblock } from '../../modules/scratchblock'
import Exercice from '../Exercice'
// Ici ce sont les fonctions de la librairie maison 2d.js qui gèrent tout ce qui est graphique (SVG/tikz) et en particulier ce qui est lié à l'objet lutin

export const interactifReady = true
export const interactifType = 'qcm'

export const titre = 'Trouver le bon programme'
export const uuid = 'e9cad'

export const refs = {
  'fr-fr': ['6I1B-6'],
  'fr-2016': [],
  'fr-ch': [],
}
/**
 * @author Jean-Claude Lhote
 */
export default class TrouverLeBonProgramme extends Exercice {
  constructor() {
    super()
    this.comment = `En correction, on peut exécuter les programmes avec tracés.<br>
    On peut ajuster le délai entre chaque étape du programme pour que ce soit plus facile à suivre ou pour accélérer.<br>
    La simulation n'est pas disponibles sur les programmes sans tracé.`
    this.nbQuestions = 7

    this.sup = '0'
    this.besoinFormulaireTexte = [
      'Types de programmes',
      'Nombres séparés par des tirets\n1 : Avancer *\n2 : Tourner *\n3 : Ajouter\n4 : Polygone *\n5 : Carré *\n6 : Rebours\n7 : Escalier *\n0 : Mélange',
    ]
    this.besoinFormulaire2Numerique = [
      'Pause entre chaque étape du programme pour le simulateur',
      4,
      '1 : Pas de pause\n2 : 1 seconde\n3 : 2 secondes\n4 : 4 secondes',
    ]
    this.sup2 = 3
  }

  nouvelleVersion(): void {
    const listeTypeDeProgrammes = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: 7,
      melange: 0,
      defaut: 0,
      nbQuestions: this.nbQuestions,
    }).map(Number)
    const delai =
      this.sup2 === 1
        ? 0
        : this.sup2 === 2
          ? 1000
          : this.sup2 === 3
            ? 2000
            : 4000
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const listeDeProgrammes = [
        getProgrammesAvancer,
        getProgrammesTourner,
        getProgrammesAjouter,
        getProgrammesPolygone,
        getProgrammesCarre,
        getProgrammesRebours,
        getProgrammesEscalier,
      ]
      const cas = listeTypeDeProgrammes[i] - 1
      const getProgrammes = listeDeProgrammes[cas]
      let nbPas: number
      switch (cas) {
        case 0: // avancer
          nbPas = randint(3, 8)
          break
        case 1: // tourner
          nbPas = 10 * randint(4, 7)
          break
        case 2: // ajouter
          nbPas = randint(4, 7)
          break
        case 3: // polygone
          nbPas = choice([3, 4, 6])
          break
        case 4: // carré
          nbPas = 40 * randint(3, 8)
          break
        case 5: // rebours
          nbPas = randint(5, 10)
          break
        case 6: // escalier
          nbPas = randint(4, 8)
          break
        default: // par défaut, on fait avancer
          nbPas = randint(3, 8)
      }
      const nbFalse = randint(2, 4)
      const nbTrue = 5 - nbFalse
      const vraisOuFaux = shuffle([
        ...Array(nbTrue).fill(true),
        ...Array(nbFalse).fill(false),
      ])

      const programmes = getProgrammes(nbPas, vraisOuFaux)
      let texte = programmes.enonce
      const ligne1 = [
        'Programme 1',
        'Programme 2',
        'Programme 3',
        'Programme 4',
        'Programme 5',
      ]
      shuffle3tableaux(
        vraisOuFaux,
        programmes.programmesCodeBrut,
        programmes.programmesListe,
      )
      const ligne2 = programmes.programmesListe
      const ligne2Brut =
        programmes.programmesCodeBrut || programmes.programmesListe
      const simulateurs = ligne2Brut.map((code) =>
        createScratchSimulatorElement(
          code.replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
          delai,
        ),
      )
      if (context.isHtml) {
        texte +=
          '<div style="margin: 20px 0; display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); width: 100%; align-self: stretch;">'
        for (let j = 0; j < ligne2.length; j++) {
          const programme = ligne2[j]
          const titre = ligne1[j]
          texte += '<div style="border: 1px solid #ddd; padding: 10px;">'
          texte += `<div style="font-weight: 600; margin-bottom: 8px;">${titre}</div>`
          texte += programme // createScratchSimulatorElement(simulatorCode, delai)
          texte += '</div>'
        }
        texte += '</div>'
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
        for (const programme of ligne2Brut) {
          texte += programme
          if (programme !== ligne2Brut[ligne2Brut.length - 1]) texte += ' & '
        }
        texte += ' \\\\\n'
        texte += '\\hline\n'
        texte += '\\end{tabular}\n'
        texte += '\\end{center}\n'
      }

      if (this.questionJamaisPosee(i, nbPas, i % 2)) {
        this.autoCorrection[i] = {
          enonce: texte,
          options: { ordered: true },
          propositions: [],
        }
        for (let j = 0; j < 5; j++) {
          const props = this.autoCorrection[i].propositions
          if (props) {
            props.push({
              texte: `Programme ${j + 1}`,
              statut: vraisOuFaux[j],
            })
          }
        }
        const monQcm = propositionsQcm(this, i)

        this.listeQuestions.push(texte + monQcm.texte)
        this.listeCorrections.push(
          `Les programmes qui conviennent sont les programmes ${vraisOuFaux
            .map((v, i) => (v ? i + 1 : ''))
            .filter((n) => n !== '')
            .join(' et ')}.<br>
            ${
              context.isHtml && cas !== 2 && cas !== 5
                ? `<div style="margin: 20px 0; display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); width: 100%; align-self: stretch;">
     ${simulateurs.map((s, i) => `<div style="border: 1px solid #ddd; padding: 10px;"><div style="font-weight: 600; margin-bottom: 8px;">Programme ${i + 1}</div>${s}</div>`).join('')}</div>`
                : ''
            }`,
        )
        i++
      }
      cpt++
    }
  }
}
function programmeAvancerType1(nbPas: number, vraiOuFaux: boolean) {
  let codeScratch = `\\begin{scratch}[blocks]
  \\blockpen{stylo en position d'écriture}
  `
  for (
    let i = 0;
    i < (vraiOuFaux ? nbPas : choice([nbPas - 1, nbPas + 1]));
    i++
  ) {
    codeScratch += '\\blockmove{avancer de \\ovalnum{30} pas}\n'
  }
  codeScratch += `\\end{scratch}`
  return codeScratch
}

function programmeAvancerType2(nbPas: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockpen{stylo en position d'écriture}
\\blockmove{avancer de \\ovalnum{30} pas}
\\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? nbPas - 1 : nbPas}} fois}{
\\blockmove{avancer de \\ovalnum{30} pas}
}
\\end{scratch}\n`
  return codeScratch
}

function programmeAvancerType3(nbPas: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockpen{stylo en position d'écriture}
\\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? nbPas - 1 : nbPas}} fois}{
\\blockmove{avancer de \\ovalnum{30} pas}
}
\\blockmove{avancer de \\ovalnum{30} pas}
\\end{scratch}\n`
  return codeScratch
}

function programmeAvancerType4(nbPas: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockpen{stylo en position d'écriture}
\\blockrepeat{répéter \\ovalnum{${Math.floor(nbPas / 2)}} fois}{
\\blockmove{avancer de \\ovalnum{30} pas}
\\blockmove{avancer de \\ovalnum{30} pas}
}
${(nbPas % 2 === 1 && vraiOuFaux) || (nbPas % 2 === 0 && !vraiOuFaux) ? '\\blockmove{avancer de \\ovalnum{30} pas}' : ''}
\\end{scratch}\n`
  return codeScratch
}

function programmeAvancerType5(nbPas: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockpen{stylo en position d'écriture}
\\blockrepeat{répéter \\ovalnum{${(nbPas - 1) * 2}} fois}{
\\blockmove{avancer de \\ovalnum{15} pas}
}
${vraiOuFaux ? '\\blockmove{avancer de \\ovalnum{30} pas}' : '\\blockmove{avancer de \\ovalnum{15} pas}'}
\\end{scratch}\n`
  return codeScratch
}

function getProgrammesAvancer(
  nbPas: number,
  vraisOuFaux: boolean[],
): { programmesListe: string[]; programmesCodeBrut: string[]; enonce: string } {
  const programmesCodeBrut = [
    programmeAvancerType1(nbPas, vraisOuFaux[0]),
    programmeAvancerType2(nbPas, vraisOuFaux[1]),
    programmeAvancerType3(nbPas, vraisOuFaux[2]),
    programmeAvancerType4(nbPas, vraisOuFaux[3]),
    programmeAvancerType5(nbPas, vraisOuFaux[4]),
  ]
  const programmesListe = programmesCodeBrut.map((code) =>
    String(scratchblock(code)),
  )
  return {
    programmesListe,
    programmesCodeBrut,
    enonce: `On souhaite faire avancer le lutin de ${nbPas * 30} pas.<br>Donner le numéro du (ou des) programme(s) correct(s)<br>`,
  }
}

function programmeTournerType1(angle: number, vraiOuFaux: boolean) {
  let codeScratch = `\\begin{scratch}[blocks]\n`
  codeScratch += '\\blockmove{tourner \\turnright{} de \\ovalnum{10} degrés}\n'
  if (angle % 20 === 0) {
    for (let i = 0; i < (vraiOuFaux ? angle / 20 - 1 : angle / 20); i++) {
      codeScratch +=
        '\\blockmove{tourner \\turnright{} de \\ovalnum{20} degrés}\n'
    }
    if (vraiOuFaux)
      codeScratch +=
        '\\blockmove{tourner \\turnright{} de \\ovalnum{10} degrés}\n'
  } else {
    for (let i = 0; i < (vraiOuFaux ? angle / 10 - 3 : angle / 10 - 2); i++) {
      codeScratch +=
        '\\blockmove{tourner \\turnright{} de \\ovalnum{10} degrés}\n'
    }
    codeScratch +=
      '\\blockmove{tourner \\turnright{} de \\ovalnum{20} degrés}\n'
  }

  codeScratch += `\\end{scratch}`
  return codeScratch
}

function programmeTournerType2(angle: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]\n
\\blockmove{tourner \\turnleft{} de \\ovalnum{10} degrés}
\\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? angle / 10 + 2 : angle / 10 - 2}} fois}{
\\blockmove{tourner \\turnright{} de \\ovalnum{10} degrés}
}
\\blockmove{tourner \\turnleft{} de \\ovalnum{10} degrés}
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

function getProgrammesTourner(
  angle: number,
  vraisOuFaux: boolean[],
): { programmesListe: string[]; programmesCodeBrut: string[]; enonce: string } {
  const programmesCodeBrut = [
    programmeTournerType1(angle, vraisOuFaux[0]),
    programmeTournerType2(angle, vraisOuFaux[1]),
    programmeTournerType3(angle, vraisOuFaux[2]),
    programmeTournerType4(angle, vraisOuFaux[3]),
    programmeTournerType5(angle, vraisOuFaux[4]),
  ]
  const programmesListe = programmesCodeBrut.map((code) =>
    String(scratchblock(code)),
  )
  return {
    programmesListe,
    programmesCodeBrut,
    enonce: `On souhaite faire tourner le lutin de ${angle} degrés dans le sens des aiguilles d'une montre.<br>Donner le numéro du (ou des) programme(s) correct(s)<br>`,
  }
}

function programmeAjouterType1(nb: number, vraiOuFaux: boolean) {
  let codeScratch = `\\begin{scratch}[blocks]\n
  \\blockvariable{mettre  \\selectmenu{compteur} à \\ovalnum{0}}\n`
  for (let i = 0; i < (vraiOuFaux ? nb : nb - 1); i++) {
    codeScratch +=
      '\\blockchange{Ajouter \\ovalnum{1} à \\ovalvariable{compteur}}\n'
  }
  codeScratch += '\\blocklook{Dire \\ovalvariable{compteur}}\n'
  codeScratch += `\\end{scratch}`
  return codeScratch
}

function programmeAjouterType2(nb: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]\n
  \\blockvariable{mettre  \\selectmenu{compteur} à \\ovalnum{0}}
  \\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? nb : nb - 1}} fois}{
    \\blockchange{Ajouter \\ovalnum{1} à \\ovalvariable{compteur}}
  }
  \\blocklook{Dire \\ovalvariable{compteur}}
\\end{scratch}`
  return codeScratch
}

function programmeAjouterType3(nb: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]\n
  \\blockvariable{mettre  \\selectmenu{compteur} à \\ovalnum{0}}
  \\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? nb - 1 : nb}} fois}{
    \\blockchange{Ajouter \\ovalnum{1} à \\ovalvariable{compteur}}
  }
  \\blockchange{Ajouter \\ovalnum{1} à \\ovalvariable{compteur}}
  \\blocklook{Dire \\ovalvariable{compteur}}
\\end{scratch}`
  return codeScratch
}

function programmeAjouterType4(nb: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]\n
  \\blockvariable{mettre  \\selectmenu{compteur} à \\ovalnum{0}}
  \\blockrepeat{répéter \\ovalnum{${Math.floor(nb / 2)}} fois}{
    \\blockchange{Ajouter \\ovalnum{1} à \\ovalvariable{compteur}}
    \\blockchange{Ajouter \\ovalnum{1} à \\ovalvariable{compteur}}
  }${(nb % 2 === 1 && vraiOuFaux) || (nb % 2 === 0 && !vraiOuFaux) ? '\n\\blockchange{Ajouter \\ovalnum{1} à \\ovalvariable{compteur}}' : ''}
  \\blocklook{Dire \\ovalvariable{compteur}}
\\end{scratch}`
  return codeScratch
}

function programmeAjouterType5(nb: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]\n
  \\blockvariable{mettre  \\selectmenu{compteur} à \\ovalnum{0}}
  \\blockrepeat{répéter \\ovalnum{${(nb - 1) * 2}} fois}{
    \\blockchange{Ajouter \\ovalnum{0.5} à \\ovalvariable{compteur}}
  }
  ${vraiOuFaux ? '\\blockchange{Ajouter \\ovalnum{1} à \\ovalvariable{compteur}}' : '\\blockchange{Ajouter \\ovalnum{0.5} à \\ovalvariable{compteur}}'}
  \\blocklook{Dire \\ovalvariable{compteur}}
\\end{scratch}`
  return codeScratch
}

function getProgrammesAjouter(
  nb: number,
  vraisOuFaux: boolean[],
): { programmesListe: string[]; programmesCodeBrut: string[]; enonce: string } {
  const programmesCodeBrut = [
    programmeAjouterType1(nb, vraisOuFaux[0]),
    programmeAjouterType2(nb, vraisOuFaux[1]),
    programmeAjouterType3(nb, vraisOuFaux[2]),
    programmeAjouterType4(nb, vraisOuFaux[3]),
    programmeAjouterType5(nb, vraisOuFaux[4]),
  ]
  const programmesListe = programmesCodeBrut.map((code) =>
    String(scratchblock(code)),
  )
  return {
    programmesListe,
    programmesCodeBrut,
    enonce: `On souhaite faire afficher le nombre ${nb}.<br>Donner le numéro du (ou des) programme(s) correct(s)<br>`,
  }
}

function programmePolygoneType1(nbCotes: number, vraiOuFaux: boolean) {
  let codeScratch = `\\begin{scratch}[blocks]
  \\blockmove{aller à x:\\ovalnum{0} y:\\ovalnum{0}}
  \\blockpen{stylo en position d'écriture}
  `
  for (let i = 0; i < (vraiOuFaux ? nbCotes : nbCotes - 1); i++) {
    codeScratch += `\\blockmove{avancer de \\ovalnum{30} pas}
    \\blockmove{tourner \\turnright{} de \\ovalnum{${Math.round(360 / nbCotes)}} degrés}
    `
  }
  codeScratch += `\\end{scratch}`
  return codeScratch
}

function programmePolygoneType2(nbCotes: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockmove{aller à x:\\ovalnum{0} y:\\ovalnum{0}}
  \\blockpen{stylo en position d'écriture}
  \\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? nbCotes : nbCotes - 1}} fois}{
  \\blockmove{avancer de \\ovalnum{30} pas}
    \\blockmove{tourner \\turnright{} de \\ovalnum{${Math.round(360 / nbCotes)}} degrés}
  }
\\end{scratch}`
  return codeScratch
}

function programmePolygoneType3(nbCotes: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockmove{aller à x:\\ovalnum{0} y:\\ovalnum{0}}
  \\blockpen{stylo en position d'écriture}
  \\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? nbCotes - 1 : nbCotes - 2}} fois}{
    \\blockmove{avancer de \\ovalnum{30} pas}
    \\blockmove{tourner \\turnright{} de \\ovalnum{${Math.round(360 / nbCotes)}} degrés}
  }
  \\blockmove{avancer de \\ovalnum{30} pas}
  \\blockmove{tourner \\turnright{} de \\ovalnum{${Math.round(360 / nbCotes)}} degrés}
\\end{scratch}`
  return codeScratch
}

function programmePolygoneType4(nbCotes: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockmove{aller à x:\\ovalnum{0} y:\\ovalnum{0}}
  \\blockpen{stylo en position d'écriture}
  \\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? nbCotes / 2 : nbCotes}} fois}{
  \\blockmove{avancer de \\ovalnum{30} pas}
  \\blockmove{tourner \\turnright{} de \\ovalnum{${Math.round(360 / nbCotes)}} degrés}
  \\blockmove{avancer de \\ovalnum{30} pas}
  ${vraiOuFaux ? `\\blockmove{tourner \\turnright{} de \\ovalnum{${Math.round(360 / nbCotes)}} degrés}\n` : ''}
}
\\end{scratch}`
  return codeScratch
}

// à refaire, on ne peut pas faire un polygone à 2n côtés.
function programmePolygoneType5(nbCotes: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockmove{aller à x:\\ovalnum{0} y:\\ovalnum{0}}
  \\blockpen{stylo en position d'écriture}
  \\blockrepeat{répéter \\ovalnum{${nbCotes - 1}} fois}{
    \\blockmove{tourner \\turnright{} de \\ovalnum{${vraiOuFaux ? Math.round(360 / nbCotes) : choice([120, 90, 60], Math.round(360 / nbCotes))}} degrés}
    \\blockmove{avancer de \\ovalnum{30} pas}
  }
  ${vraiOuFaux ? `\\blockmove{tourner \\turnright{} de \\ovalnum{${Math.round(360 / nbCotes)}} degrés}\n\\blockmove{avancer de \\ovalnum{30} pas}\n` : `\\blockmove{avancer de \\ovalnum{30} pas}\n\\blockmove{tourner \\turnright{} de \\ovalnum{${Math.round(360 / nbCotes)}} degrés}\n`}
\\end{scratch}`
  return codeScratch
}

function getProgrammesPolygone(
  nbCotes: number,
  vraisOuFaux: boolean[],
): { programmesListe: string[]; programmesCodeBrut: string[]; enonce: string } {
  const programmesCodeBrut = [
    programmePolygoneType1(nbCotes, vraisOuFaux[0]),
    programmePolygoneType2(nbCotes, vraisOuFaux[1]),
    programmePolygoneType3(nbCotes, vraisOuFaux[2]),
    programmePolygoneType4(nbCotes, vraisOuFaux[3]),
    programmePolygoneType5(nbCotes, vraisOuFaux[4]),
  ]
  const programmesListe = programmesCodeBrut.map((code) =>
    String(scratchblock(code)),
  )
  return {
    programmesListe,
    programmesCodeBrut,
    enonce: `On souhaite faire dessiner un polygone régulier à ${nbCotes} côtés.<br>Donner le numéro du (ou des) programme(s) correct(s)<br>`,
  }
}

function programmeCarreType1(perimetre: number, vraiOuFaux: boolean) {
  const cote = perimetre / 4
  let codeScratch = `\\begin{scratch}[blocks]
  \\blockmove{aller à x:\\ovalnum{0} y:\\ovalnum{0}}
  \\blockpen{stylo en position d'écriture}
  `
  for (let i = 0; i < (vraiOuFaux ? 4 : 3); i++) {
    codeScratch += `\\blockmove{avancer de \\ovalnum{${cote}} pas}
    \\blockmove{tourner \\turnright{} de \\ovalnum{90} degrés}
    `
  }
  codeScratch += `\\end{scratch}`
  return codeScratch
}

function programmeCarreType2(perimetre: number, vraiOuFaux: boolean) {
  const cote = perimetre / 4
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockmove{aller à x:\\ovalnum{0} y:\\ovalnum{0}}
  \\blockpen{stylo en position d'écriture}
  \\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? 4 : choice([3, 5])}} fois}{
  \\blockmove{avancer de \\ovalnum{${cote}} pas}
    \\blockmove{tourner \\turnright{} de \\ovalnum{90} degrés}
  }
\\end{scratch}`
  return codeScratch
}

function programmeCarreType3(perimetre: number, vraiOuFaux: boolean) {
  const cote = perimetre / 4
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockmove{aller à x:\\ovalnum{0} y:\\ovalnum{0}}
  \\blockpen{stylo en position d'écriture}
  \\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? 3 : 2}} fois}{
    \\blockmove{avancer de \\ovalnum{${cote}} pas}
    \\blockmove{tourner \\turnright{} de \\ovalnum{90} degrés}
  }
  \\blockmove{avancer de \\ovalnum{${cote}} pas}
  \\blockmove{tourner \\turnright{} de \\ovalnum{90} degrés}
\\end{scratch}`
  return codeScratch
}

function programmeCarreType4(perimetre: number, vraiOuFaux: boolean) {
  const cote = perimetre / 4
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockmove{aller à x:\\ovalnum{0} y:\\ovalnum{0}}
  \\blockpen{stylo en position d'écriture}
  \\blockrepeat{répéter \\ovalnum{2} fois}{
  \\blockmove{avancer de \\ovalnum{${cote}} pas}
  \\blockmove{tourner \\turnright{} de \\ovalnum{90} degrés}
  \\blockmove{avancer de \\ovalnum{${cote}} pas}
  \\blockmove{tourner \\turnright{} de \\ovalnum{90} degrés}
}
${!vraiOuFaux ? '\\blockmove{avancer de \\ovalnum{' + cote + '} pas}\n\\blockmove{tourner \\turnright{} de \\ovalnum{90} degrés}\n' : ''}
\\end{scratch}`
  return codeScratch
}

function programmeCarreType5(perimetre: number, vraiOuFaux: boolean) {
  const cote = perimetre / 4
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockmove{aller à x:\\ovalnum{0} y:\\ovalnum{0}}
  \\blockpen{stylo en position d'écriture}
  \\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? 4 : 3}} fois}{
    \\blockmove{avancer de \\ovalnum{${cote / 2}} pas}
    \\blockmove{tourner \\turnright{} de \\ovalnum{90} degrés}
    \\blockmove{avancer de \\ovalnum{${cote / 2}} pas}
  }
\\end{scratch}`
  return codeScratch
}

function getProgrammesCarre(
  perimetre: number,
  vraisOuFaux: boolean[],
): { programmesListe: string[]; programmesCodeBrut: string[]; enonce: string } {
  const programmesCodeBrut = [
    programmeCarreType1(perimetre, vraisOuFaux[0]),
    programmeCarreType2(perimetre, vraisOuFaux[1]),
    programmeCarreType3(perimetre, vraisOuFaux[2]),
    programmeCarreType4(perimetre, vraisOuFaux[3]),
    programmeCarreType5(perimetre, vraisOuFaux[4]),
  ]
  const programmesListe = programmesCodeBrut.map((code) =>
    String(scratchblock(code)),
  )
  return {
    programmesListe,
    programmesCodeBrut,
    enonce: `On souhaite faire dessiner un carré de périmètre ${perimetre} pas.<br>Donner le numéro du (ou des) programme(s) correct(s)<br>`,
  }
}

function programmeReboursType1(nbDepart: number, vraiOuFaux: boolean) {
  let codeScratch = `\\begin{scratch}[blocks]
  \\blockvariable{mettre  \\selectmenu{compteur} à \\ovalnum{${nbDepart}}}
`
  for (let i = 0; i < (vraiOuFaux ? nbDepart : nbDepart - 1); i++) {
    codeScratch +=
      '  \\blockchange{Ajouter \\ovalnum{-1} à \\ovalvariable{compteur}}\n'
  }
  codeScratch += '  \\blocklook{Dire \\ovalvariable{compteur}}\n'
  codeScratch += `\\end{scratch}`
  return codeScratch
}

function programmeReboursType2(nbDepart: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockvariable{mettre  \\selectmenu{compteur} à \\ovalnum{${nbDepart}}}
  \\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? nbDepart : nbDepart - 1}} fois}{
    \\blockchange{Ajouter \\ovalnum{-1} à \\ovalvariable{compteur}}
  }
  \\blocklook{Dire \\ovalvariable{compteur}}
\\end{scratch}`
  return codeScratch
}

function programmeReboursType3(nbDepart: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockvariable{mettre  \\selectmenu{compteur} à \\ovalnum{${nbDepart}}}
  \\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? nbDepart - 1 : nbDepart - 2}} fois}{
    \\blockchange{Ajouter \\ovalnum{-1} à \\ovalvariable{compteur}}
  }
  \\blockchange{Ajouter \\ovalnum{-1} à \\ovalvariable{compteur}}
  \\blocklook{Dire \\ovalvariable{compteur}}
\\end{scratch}`
  return codeScratch
}

function programmeReboursType4(nbDepart: number, vraiOuFaux: boolean) {
  const moitie = Math.floor(nbDepart / 2)
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockvariable{mettre  \\selectmenu{compteur} à \\ovalnum{${nbDepart}}}
  \\blockrepeat{répéter \\ovalnum{${moitie}} fois}{
    \\blockchange{Ajouter \\ovalnum{-1} à \\ovalvariable{compteur}}
    \\blockchange{Ajouter \\ovalnum{-1} à \\ovalvariable{compteur}}
  }${(nbDepart % 2 === 1 && vraiOuFaux) || (nbDepart % 2 === 0 && !vraiOuFaux) ? '\n  \\blockchange{Ajouter \\ovalnum{-1} à \\ovalvariable{compteur}}' : ''}
  \\blocklook{Dire \\ovalvariable{compteur}}
\\end{scratch}`
  return codeScratch
}

function programmeReboursType5(nbDepart: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockvariable{mettre  \\selectmenu{compteur} à \\ovalnum{${nbDepart}}}
  \\blockrepeat{répéter \\ovalnum{${nbDepart}} fois}{
    \\blockvariable{mettre \\selectmenu{compteur} à \\ovaloperator{${vraiOuFaux ? '\\ovalvariable{compteur} - \\ovalnum{1}' : '\\ovalnum{1} - \\ovalvariable{compteur}'}}}
  }
  \\blocklook{Dire \\ovalvariable{compteur}}
\\end{scratch}`
  return codeScratch
}

function getProgrammesRebours(
  nbDepart: number,
  vraisOuFaux: boolean[],
): { programmesListe: string[]; programmesCodeBrut: string[]; enonce: string } {
  const programmesCodeBrut = [
    programmeReboursType1(nbDepart, vraisOuFaux[0]),
    programmeReboursType2(nbDepart, vraisOuFaux[1]),
    programmeReboursType3(nbDepart, vraisOuFaux[2]),
    programmeReboursType4(nbDepart, vraisOuFaux[3]),
    programmeReboursType5(nbDepart, vraisOuFaux[4]),
  ]
  const programmesListe = programmesCodeBrut.map((code) =>
    String(scratchblock(code)),
  )
  return {
    programmesListe,
    programmesCodeBrut,
    enonce: `On souhaite faire afficher le nombre 0 en partant de ${nbDepart} et en faisant un compte à rebours.<br>Donner le numéro du (ou des) programme(s) correct(s)<br>`,
  }
}

function programmeEscalierType1(nbMarches: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]
 \\initmoreblocks{définir \\namemoreblocks{escalier}}
  \\blockmove{avancer de \\ovalnum{20} pas}
    \\blockmove{tourner \\turnright{} de \\ovalnum{90} degrés}
    \\blockmove{avancer de \\ovalnum{20} pas}
    \\blockmove{tourner ${vraiOuFaux ? '\\turnleft{}' : '\\turnright{}'} de \\ovalnum{90} degrés}

  \\blockmove{aller à x:\\ovalnum{0} y:\\ovalnum{0}}
  \\blockpen{stylo en position d'écriture}
  \\blockrepeat{répéter \\ovalnum{${nbMarches}} fois}{
    \\blockmoreblocks{escalier}
}
\\end{scratch}`
  return codeScratch
}

function programmeEscalierType2(nbMarches: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockmove{aller à x:\\ovalnum{0} y:\\ovalnum{0}}
  \\blockpen{stylo en position d'écriture}
  \\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? nbMarches : choice([nbMarches - 1, nbMarches + 1])}} fois}{
  \\blockmove{avancer de \\ovalnum{20} pas}
    \\blockmove{tourner \\turnright{} de \\ovalnum{90} degrés}
    \\blockmove{avancer de \\ovalnum{20} pas}
    \\blockmove{tourner \\turnleft{} de \\ovalnum{90} degrés}
  }
\\end{scratch}`
  return codeScratch
}

function programmeEscalierType3(nbMarches: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockmove{aller à x:\\ovalnum{0} y:\\ovalnum{0}}
  \\blockpen{stylo en position d'écriture}
  \\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? nbMarches - 1 : nbMarches - 2}} fois}{
    \\blockmove{avancer de \\ovalnum{20} pas}
    \\blockmove{tourner \\turnright{} de \\ovalnum{90} degrés}
    \\blockmove{avancer de \\ovalnum{20} pas}
    \\blockmove{tourner \\turnleft{} de \\ovalnum{90} degrés}
  }
  \\blockmove{avancer de \\ovalnum{20} pas}
  \\blockmove{tourner \\turnright{} de \\ovalnum{90} degrés}
  \\blockmove{avancer de \\ovalnum{20} pas}
  \\blockmove{tourner \\turnleft{} de \\ovalnum{90} degrés}
\\end{scratch}`
  return codeScratch
}

function programmeEscalierType4(nbMarches: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockmove{aller à x:\\ovalnum{0} y:\\ovalnum{0}}
  \\blockpen{stylo en position d'écriture}
  \\blockmove{avancer de \\ovalnum{20} pas}
  \\blockmove{tourner \\turnright{} de \\ovalnum{90} degrés}
  \\blockmove{avancer de \\ovalnum{20} pas}
  \\blockmove{tourner \\turnleft{} de \\ovalnum{90} degrés}
  \\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? nbMarches - 1 : nbMarches}} fois}{
    \\blockmove{avancer de \\ovalnum{20} pas}
    \\blockmove{tourner \\turnright{} de \\ovalnum{90} degrés}
    \\blockmove{avancer de \\ovalnum{20} pas}
    \\blockmove{tourner \\turnleft{} de \\ovalnum{90} degrés}
  }
\\end{scratch}`
  return codeScratch
}

function programmeEscalierType5(nbMarches: number, vraiOuFaux: boolean) {
  const codeScratch = `\\begin{scratch}[blocks]
  \\blockmove{aller à x:\\ovalnum{0} y:\\ovalnum{0}}
  \\blockpen{stylo en position d'écriture}
  \\blockrepeat{répéter \\ovalnum{${vraiOuFaux ? nbMarches : nbMarches + 1}} fois}{
    \\blockmove{tourner \\turnright{} de \\ovalnum{90} degrés}
    \\blockmove{avancer de \\ovalnum{20} pas}
    \\blockmove{tourner \\turnleft{} de \\ovalnum{90} degrés}
    \\blockmove{avancer de \\ovalnum{20} pas}
  }
\\end{scratch}`
  return codeScratch
}

function getProgrammesEscalier(
  nbMarches: number,
  vraisOuFaux: boolean[],
): { programmesListe: string[]; programmesCodeBrut: string[]; enonce: string } {
  const programmesCodeBrut = [
    programmeEscalierType1(nbMarches, vraisOuFaux[0]),
    programmeEscalierType2(nbMarches, vraisOuFaux[1]),
    programmeEscalierType3(nbMarches, vraisOuFaux[2]),
    programmeEscalierType4(nbMarches, vraisOuFaux[3]),
    programmeEscalierType5(nbMarches, vraisOuFaux[4]),
  ]
  const programmesListe = programmesCodeBrut.map((code) =>
    String(scratchblock(code)),
  )
  return {
    programmesListe,
    programmesCodeBrut,
    enonce: `On souhaite faire dessiner un escalier de ${nbMarches} marche(s).<br>Donner le numéro du (ou des) programme(s) correct(s)<br>`,
  }
}
