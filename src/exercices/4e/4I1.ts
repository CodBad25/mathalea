import { createScratchSimulatorElement } from '@scratch2latex/scratch-core/ScratchSimulator'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { bleuMathalea, orangeMathalea } from '../../lib/colors'
import { setCliqueFigure } from '../../lib/interactif/gestionInteractif'
import { combinaisonListes, shuffle } from '../../lib/outils/arrayOutils'
import { texteEnCouleurEtGras } from '../../lib/outils/embellissements'
import { range } from '../../lib/outils/nombres'
import {
  avance,
  baisseCrayon,
  creerLutin,
  tournerD,
} from '../../modules/2dLutin'
import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import { listeQuestionsToContenu } from '../../modules/outils'
import { scratchblock } from '../../modules/scratchblock'
import Exercice from '../Exercice'

export const titre = 'Dessiner avec scratch'
export const dateDeModifImportante = '10/06/2025'
export const interactifReady = true
export const interactifType = 'cliqueFigure'

/**
 * Dessiner selon un programme scratch
 * @author Sébastien Lozano
 * implémentation fonction scratchblock par Jean-claude Lhote
 * Interactivité, grosse refactorisation par Éric Elter le 10/06/2025
 */

export const uuid = '33c9a'

export const refs = {
  'fr-fr': ['4I1', '3AutoI01-1'],
  'fr-ch': ['autres-16'],
}
export default class TracerAvecScratch extends Exercice {
  constructor() {
    super()
    this.consigne =
      'Laquelle des 4 figures ci-dessous va être tracée avec le script fourni ?'
    this.typeExercice = 'Scratch'
    this.nbQuestions = 3
  }

  nouvelleVersion() {
    const typesDeQuestionsDisponibles = [1, 2, 3, 4, 5]

    const listeTypeDeQuestions = combinaisonListes(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    ) // Tous les types de questions sont posées mais l'ordre diffère à chaque "cycle"

    this.cliqueFiguresArray = [[], [], [], []]

    for (
      let i = 0, texte, texteCorr, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      // une fonction pour gérer la sortie HTML/LaTeX
      // code est un string contenant le code svg ou tikz

      // une fonction pour dire le nom du polygone
      const myPolyName = (n: number) => {
        const sortie = {
          name: '',
          nameParSommets: '',
          nbPas: 0,
        }
        switch (n) {
          case 2:
            sortie.name = 'segment'
            sortie.nbPas = 40
            break
          case 3:
            sortie.name = 'triangle équilatéral'
            sortie.nbPas = 40
            break
          case 4:
            sortie.name = 'carré'
            sortie.nbPas = 40
            break
          case 5:
            sortie.name = 'pentagone régulier'
            sortie.nbPas = 30
            break
          case 6:
            sortie.name = 'hexagone régulier'
            sortie.nbPas = 25
            break
          case 7:
            sortie.name = 'heptagone régulier'
            sortie.nbPas = 20
            break
          case 8:
            sortie.name = 'octogone régulier'
            sortie.nbPas = 20
            break
          case 9:
            sortie.name = 'ennéagone régulier'
            sortie.nbPas = 20
            break
        }
        return sortie
      }

      // une fonction pour renvoyer une situation
      // n définit le nombre de côtés du polygone régulier
      const mySituation = (n: number) => {
        const situations = [
          {
            // polygones réguliers
            nbCotes: n,
            nom: myPolyName(n).name,
            codeScratch: `\\begin{scratch}
\\blockinit{quand \\greenflag est cliqué}
\\blockpen{stylo en position d'écriture}
\\blockrepeat{répéter \\ovalnum{${n}} fois}
{
\\blockmove{avancer de \\ovalnum{${myPolyName(n).nbPas}} pas}
\\blockmove{tourner \\turnright{} de \\ovaloperator{\\ovalnum{360}/\\ovalnum{${n}}} degrés}
}
\\end{scratch}`,
            fig: '',
            fig_corr: '',
          },
        ]

        const lutinEnonce = []
        const figLutinEnonce = []

        // le lutinEnonce[indiceLutin] fait la bonne figure
        const tabNbCote = [n, n + 1, n - 1, n]
        for (let indiceLutin = 0; indiceLutin < 4; indiceLutin++) {
          lutinEnonce[indiceLutin] = creerLutin()
          lutinEnonce[indiceLutin].stringColor = bleuMathalea
          baisseCrayon(lutinEnonce[indiceLutin])
          for (let k = 1; k < tabNbCote[indiceLutin] + 1; k++) {
            avance(
              myPolyName(tabNbCote[indiceLutin]).nbPas * 3,
              lutinEnonce[indiceLutin],
            )
            tournerD(
              360 / tabNbCote[indiceLutin] - (indiceLutin === 3 ? 10 : 0),
              lutinEnonce[indiceLutin],
            )
          }
          lutinEnonce[indiceLutin].updateBordures()
          figLutinEnonce[indiceLutin] = mathalea2d(
            Object.assign(
              {
                style: 'display: inline-block',
                xmin: -4,
                ymin: -13.5,
                xmax: 10,
                ymax: 0.5,
                pixelsParCm: 20,
                scale: 0.4,
                id: `cliquefigure${indiceLutin}Ex${this.numeroExercice}Q${i}`,
              },
              fixeBordures([lutinEnonce[indiceLutin]]),
            ),
            lutinEnonce[indiceLutin],
          )
        }
        const ordre = shuffle(range(3))
        situations[0].fig =
          figLutinEnonce[ordre[0]] +
          figLutinEnonce[ordre[1]] +
          figLutinEnonce[ordre[2]] +
          figLutinEnonce[ordre[3]]

        const lutinCorr = creerLutin()
        lutinCorr.stringColor = orangeMathalea
        baisseCrayon(lutinCorr)
        for (let k = 1; k < n + 1; k++) {
          avance(myPolyName(n).nbPas / 6, lutinCorr)
          tournerD(360 / n, lutinCorr)
        }
        lutinCorr.updateBordures()

        const figLutinCorr = mathalea2d(
          Object.assign(
            {
              style: 'display: inline-block',
              xmin: -4,
              ymin: -13.5,
              xmax: 10,
              ymax: 0.5,
              pixelsParCm: 20,
              scale: 0.4,
            },
            fixeBordures([lutinCorr]),
          ),
          lutinCorr,
        )

        situations[0].fig_corr = figLutinCorr

        const enonces = []
        enonces.push({
          enonce: `
          ${scratchblock(situations[0].codeScratch)}<br>
          ${situations[0].fig}`,
          question: '',
          correction: `
          La figure tracée par le programme a ${situations[0].nbCotes} côtés de même longueur et ${situations[0].nbCotes} angles de même mesure, c'est un ${texteEnCouleurEtGras(situations[0].nom, bleuMathalea)}.<br><br>
          ${situations[0].fig_corr}`,
          scratchCorrection: situations[0].codeScratch,
        })

        return enonces
      }
      this.cliqueFiguresArray[i] = [
        { id: `cliquefigure0Ex${this.numeroExercice}Q${i}`, solution: true },
        { id: `cliquefigure1Ex${this.numeroExercice}Q${i}`, solution: false },
        { id: `cliquefigure2Ex${this.numeroExercice}Q${i}`, solution: false },
        { id: `cliquefigure3Ex${this.numeroExercice}Q${i}`, solution: false },
      ]

      const enonces = []
      enonces.push(mySituation(3)[0])
      enonces.push(mySituation(4)[0])
      enonces.push(mySituation(5)[0])
      enonces.push(mySituation(6)[0])
      enonces.push(mySituation(8)[0])
      texte = `${enonces[listeTypeDeQuestions[i] - 1].enonce}`
      texteCorr = `${enonces[listeTypeDeQuestions[i] - 1].correction}`
      if (this.interactif) {
        this.autoCorrection[i] = {}
        setCliqueFigure(this.autoCorrection[i])

        texte += `<span id="resultatCheckEx${this.numeroExercice}Q${i}"></span>`
      }

      if (this.questionJamaisPosee(i, texte)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] =
          texteCorr + context.isHtml
            ? createScratchSimulatorElement(
                enonces[listeTypeDeQuestions[i] - 1].scratchCorrection,
                500,
              )
            : ''
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
