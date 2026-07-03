import { traceBarre } from '../../lib/2d/diagrammes'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { repere } from '../../lib/2d/reperes'
import { amcConvert } from '../../lib/amc/amcBuilders'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import {
  numAlpha,
  premiereLettreEnMajuscule,
} from '../../lib/outils/outilString'
import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Lire un diagramme en bâtons'
export const amcReady = true
export const amcType = 'AMCHybride'
export const interactifReady = true
export const interactifType = 'qcm'

/**
 * Lire un diagramme en bâtons
 * @author Erwan Duplessy
 * Conversion Amc et interactif par Jean-claude Lhote
 */

export const uuid = '17bce'

export const refs = {
  'fr-fr': ['auto6P1A'],
  'fr-2016': ['6S10'],
  'fr-ch': ['9FA1-1'],
}
export default class LectureDiagrammeBaton extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireNumerique = [
      "Nombre d'espèces différentes",
      3,
      '1 : 4 espèces\n2 : 5 espèces\n3 : 6 espèces',
    ]
    this.besoinFormulaire2Numerique = [
      'Valeurs numériques',
      2,
      '1 : Entre 1 et 100\n2 : Entre 100 et 1 000',
    ]

    // this.consigne = "Répondre aux questions à l'aide du graphique."
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false

    this.sup = 1
    this.sup2 = 1
    this.spacing = 2
    this.spacingCorr = 2
  }

  nouvelleVersion() {
    const bornesinf = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]
    const lstAnimaux = [
      'girafes',
      'zèbres',
      'gnous',
      'buffles',
      'gazelles',
      'crocodiles',
      'rhinocéros',
      'léopards',
      'guépards',
      'hyènes',
      'lycaons',
      'servals',
      'phacochères',
    ]
    let nbAnimaux = 4 // nombre d'animaux différents dans l'énoncé

    // coefficient pour gérer les deux types d'exercices (entre 1 et 100) ou (entre 10 et 1000)
    let coef = 1
    switch (this.sup2) {
      case 1:
        coef = 1
        break
      case 2:
        coef = 10
        break
    }
    const r = repere({
      grilleX: false,
      grilleY: true,
      xThickListe: false,
      xLabelListe: false,
      yUnite: 0.1 / coef,
      yThickDistance: 10 * coef,
      yMax: 100 * coef,
      xMin: 0,
      xMax: 10,
      yMin: 0,
      axeXStyle: '',
      yLegende: "Nombre d'individus",
      yLegendePosition: [2, 10.5],
    })

    switch (this.sup) {
      case 1:
        nbAnimaux = 4
        break
      case 2:
        nbAnimaux = 5
        break
      case 3:
        nbAnimaux = 6
        break
      default:
        nbAnimaux = 4
    }
    const propa = []
    const propb = []
    const propc = []
    const lstAnimauxExo: string[] = [] // liste des animaux uniquement cités dans l'exercice
    const lstNombresAnimaux: number[] = [] // liste des effectifs de chaque animal
    let lstVal = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100] // liste des valeurs à éviter pour les effectifs
    let N = 0
    let nom

    for (let i = 0; i < nbAnimaux; i++) {
      N = randint(2, 100, lstVal) // choisit un nombre entre 2 et 100 sauf dans les valeurs à éviter
      lstNombresAnimaux.push(N * coef)
      lstVal = lstVal.concat([N - 1, N, N + 1]) // valeurs à supprimer pour éviter des valeurs proches
    }

    for (let i = 0; i < nbAnimaux; i++) {
      nom = choice(lstAnimaux, lstAnimauxExo) // choisit un animal au hasard sauf parmi ceux déjà utilisés
      lstAnimauxExo.push(nom)
    }
    const nMin = Math.min(...lstNombresAnimaux)
    const nMax = Math.max(...lstNombresAnimaux)

    const lstNomParc = [
      'Dramve',
      'Fatenmin',
      'Batderfa',
      'Vihi',
      'Genser',
      'Barbetdou',
      'Dramrendu',
      'Secai',
      'Cipeudram',
      'Cigel',
      'Lisino',
      'Fohenlan',
      'Farnfoss',
      'Kinecardine',
      'Zeffari',
      'Barmwich',
      'Swadlincote',
      'Swordbreak',
      'Loshull',
      'Ruyron',
      'Fluasall',
      'Blueross',
      'Vlane',
    ]
    //this.introduction =
    this.consigne =
      'Dans le parc naturel de ' +
      choice(lstNomParc) +
      ", il y a beaucoup d'animaux.<br><br>Voici un diagramme en bâtons qui donne le nombre d'individus pour chaque espèce.<br>"
    this.listeQuestions[0] = 'Quels sont les animaux les plus nombreux ?'
    this.listeQuestions[1] = 'Quels sont les animaux les moins nombreux ?'
    const numAnimal = randint(0, nbAnimaux - 1)
    this.listeQuestions[2] =
      this.sup2 === 1
        ? 'Donner un encadrement, à la dizaine, du nombre de ' +
          lstAnimauxExo[numAnimal] +
          ' ?'
        : 'Donner un encadrement, à la centaine, du nombre de ' +
          lstAnimauxExo[numAnimal] +
          ' ?'
    const lstElementGraph = []
    const bornesAEviter = [
      10 *
        coef *
        Math.floor(
          lstNombresAnimaux[lstAnimauxExo.indexOf(lstAnimauxExo[numAnimal])] /
            (10 * coef),
        ),
    ]
    for (let i = 0, borne, reponsea, reponseb, reponsec; i < nbAnimaux; i++) {
      lstElementGraph.push(
        traceBarre(
          ((r.xMax - r.xMin) / (nbAnimaux + 1)) * (i + 1),
          lstNombresAnimaux[i],
          premiereLettreEnMajuscule(lstAnimauxExo[i]),
          { unite: 0.1 / coef },
        ),
      )
      reponsea = i === 0 ? { texte: '1) Animaux les plus nombreux :' } : {}
      propa.push({
        texte: premiereLettreEnMajuscule(lstAnimauxExo[i]),
        statut: i === lstNombresAnimaux.indexOf(nMax),
        reponse: reponsea,
      })
      reponseb = i === 0 ? { texte: '2) Animaux les moins nombreux :' } : {}
      propb.push({
        texte: premiereLettreEnMajuscule(lstAnimauxExo[i]),
        statut: i === lstNombresAnimaux.indexOf(nMin),
        reponse: reponseb,
      })
      reponsec =
        i === 0
          ? {
              texte: `3) encadrement du nombre de ${lstAnimauxExo[numAnimal]} :`,
            }
          : {}
      if (i === numAnimal) {
        propc.push({
          texte: `entre ${bornesAEviter[0]} et ${bornesAEviter[0] + 10 * coef}`,
          statut: true,
          reponse: reponsec,
        })
      } else {
        borne = choice(bornesinf, bornesAEviter)
        bornesAEviter.push(borne)
        propc.push({
          texte: `entre ${coef * borne} et ${(borne + 10) * coef}`,
          statut: false,
          reponse: reponsec,
        })
      }
    }

    this.introduction += mathalea2d(
      Object.assign(
        { zoom: 1, scale: 0.5 },
        fixeBordures([r, ...lstElementGraph]),
      ),
      r,
      lstElementGraph,
    )

    // debut de la correction
    // question 1
    this.listeCorrections[0] =
      'Les animaux les plus nombreux sont les ' +
      lstAnimauxExo[lstNombresAnimaux.indexOf(nMax)] +
      '.<br>'
    // question 2
    this.listeCorrections[1] =
      'Les animaux les moins nombreux sont les ' +
      lstAnimauxExo[lstNombresAnimaux.indexOf(nMin)] +
      '.<br>'

    // question 3
    const reponse =
      lstNombresAnimaux[lstAnimauxExo.indexOf(lstAnimauxExo[numAnimal])]
    const reponseinf = 10 * coef * Math.floor(reponse / (10 * coef))
    const reponsesup = reponseinf + 10 * coef
    this.listeCorrections[2] =
      'Il y a entre ' +
      reponseinf +
      ' et ' +
      reponsesup +
      ' ' +
      lstAnimauxExo[numAnimal] +
      '.<br>'
    if (context.isAmc) {
      this.autoCorrectionAMC[0] = {
        enonce: '',
        propositions: [
          {
            type: 'qcmMono',
            propositions: propa,
            options: {
              ordered: false,
            },
            enonce: this.introduction + numAlpha(0) + this.listeQuestions[0],
          },
          {
            type: 'qcmMono',
            options: { ordered: false },
            enonce: numAlpha(1) + this.listeQuestions[1],
            propositions: propb,
          },
          {
            type: 'qcmMono',
            options: { ordered: false },
            enonce: numAlpha(2) + this.listeQuestions[2],
            propositions: propc,
          },
        ],
      }
      this.questionsAMC[0] = amcConvert(this.autoCorrectionAMC[0])
    } else {
      this.autoCorrection[0] = {
        propositions: propa,
        options: { ordered: false, vertical: nbAnimaux > 5 },
      }
      this.autoCorrection[1] = {
        propositions: propb,
        options: { ordered: false, vertical: nbAnimaux > 5 },
      }
      this.autoCorrection[2] = {
        propositions: propc,
        options: { ordered: false, vertical: true },
      }
    }
    if (!context.isAmc) {
      const qcm0 = propositionsQcm(this, 0)
      const qcm1 = propositionsQcm(this, 1)
      const qcm2 = propositionsQcm(this, 2)
      this.listeQuestions[0] += `<br>${qcm0.texte}`
      this.listeQuestions[1] += `<br>${qcm1.texte}`
      this.listeQuestions[2] += `<br>${qcm2.texte}`
    }
    listeQuestionsToContenu(this)
  }
}
