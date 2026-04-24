import { arc } from '../../lib/2d/Arc'
import { cercleCentrePoint } from '../../lib/2d/cercle'
import { colorToLatexOrHTML } from '../../lib/2d/colorToLatexOrHtml'
import { traceBarre, traceGraphiqueCartesien } from '../../lib/2d/diagrammes'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { motifs } from '../../lib/2d/pattern'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { carre } from '../../lib/2d/polygonesParticuliers'
import { repere } from '../../lib/2d/reperes'
import { segment } from '../../lib/2d/segmentsVecteurs'
import { texteParPosition } from '../../lib/2d/textes'
import { tracePoint } from '../../lib/2d/TracePoint'
import { rotation, translation } from '../../lib/2d/transformations'
import { vecteur } from '../../lib/2d/Vecteur'
import { texcolors } from '../../lib/format/style'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { numAlpha } from '../../lib/outils/outilString'
import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Lire des données représentées dans un diagramme'
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'AMCHybride'

/**
 * Lecture de diagrammes
 * @author Jean-Claude Lhote
 */
export const uuid = 'adac4'

export const refs = {
  'fr-fr': ['auto6P1A-1', '3AutoP05-1'],
  'fr-2016': ['6S10-1'],
  'fr-ch': ['9FA1-2'],
}
export default class LireUnDiagramme extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireNumerique = [
      "Nombre d'espèces différentes",
      3,
      '1 : Deux espèces\n2 : Trois espèces\n3 : Quatre espèces',
    ]
    this.besoinFormulaire2Numerique = [
      'Type de diagramme',
      5,
      '1 : Diagramme circulaire\n2 : Diagramme semi-circulaire\n3 : Diagramme en barres\n4 : Diagramme cartésien\n5 : Au hasard',
    ]

    this.nbQuestions = 2
    this.sup = 3
    this.sup2 = 5
  }

  nouvelleVersion() {
    let typesDeQuestionsDisponibles
    if (this.sup2 < 5) {
      typesDeQuestionsDisponibles = [this.sup2]
    } else {
      typesDeQuestionsDisponibles = [1, 2, 3, 4]
    }
    const listeHachuresDisponibles = [0, 1, 3, 4, 5, 6, 7, 8, 9, 10]
    const listeMotifs = combinaisonListes(listeHachuresDisponibles, 4)
    const listeTypeDeQuestions = combinaisonListes(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    )
    let N = 0
    let nom
    let nbAnimaux = 4 // nombre d'animaux différents dans l'énoncé
    let lstAnimauxExo: string[] // liste des animaux uniquement cités dans l'exercice
    let lstNombresAnimaux // liste des effectifs de chaque animal
    let lstVal: number[] = [] // liste des valeurs à éviter pour les effectifs

    let paramsEnonce, coef, r, lstElementGraph, g
    let reponse1, reponse2, nbMin, nbMax, monQcm1, monQcm2, monQcm3
    let objets
    const lstAnimaux = [
      'Girafes',
      'Zèbres',
      'Gnous',
      'Buffles',
      'Gazelles',
      'Crocodiles',
      'Rhinocéros',
      'Léopards',
      'Guépards',
      'Hyènes',
      'Lycaons',
      'Servals',
      'Phacochères',
    ]
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
    let A, B, T, angle, a, legende, textelegende, hachures, a0, t, alpha
    for (let q = 0, texte, texteCorr, texteAMC; q < this.nbQuestions; ) {
      objets = []
      lstVal = []
      lstAnimauxExo = []
      lstNombresAnimaux = []
      if (!context.isAmc) {
        this.autoCorrection[q * 3] = {}
        this.autoCorrection[q * 3 + 1] = {}
        this.autoCorrection[q * 3 + 2] = {}
      } else {
        this.autoCorrection[q] = {}
      }

      texteAMC =
        'Dans le parc naturel de ' +
        choice(lstNomParc) +
        ", il y a beaucoup d'animaux.<br> Voici un diagramme qui représente les effectifs de quelques espèces.<br><br>"
      texteCorr = ''
      switch (this.sup) {
        case 1:
          nbAnimaux = 2
          break
        case 2:
          nbAnimaux = 3
          break
        case 3:
          nbAnimaux = 4
          break
        default:
          nbAnimaux = 4
      }
      for (let i = 0; i < nbAnimaux - 1; i++) {
        N = randint(5, 40, lstVal) // choisit un nombre entre 5 et 40 sauf dans les valeurs à éviter
        lstNombresAnimaux.push(N)
        lstVal = lstVal.concat([N - 2, N - 1, N, N + 1, N + 2]) // valeurs à supprimer pour éviter des valeurs proches
      }

      let effectiftotal
      // Le test ci-dessous permet de proposer (avec une fréquence de 1/3) des effectifs les nombreux > 50 %
      const choixMajoritaire = randint(0, 2)
      if (choixMajoritaire > 0) {
        N = randint(5, 40, lstVal) // choisit un nombre entre 5 et 40 sauf dans les valeurs à éviter
        lstNombresAnimaux.push(N)
      } else {
        effectiftotal = 0
        for (let i = 0; i < nbAnimaux - 1; i++) {
          effectiftotal += lstNombresAnimaux[i]
        }
        lstNombresAnimaux.push(Math.round(effectiftotal * 1.25))
      }

      effectiftotal = 0
      for (let i = 0; i < nbAnimaux; i++) {
        effectiftotal += lstNombresAnimaux[i]
      }
      for (let i = 0; i < nbAnimaux; i++) {
        nom = choice(lstAnimaux, lstAnimauxExo) // choisit un animal au hasard sauf parmi ceux déjà utilisés
        lstAnimauxExo.push(nom)
      }

      nbMin = Math.min(...lstNombresAnimaux)
      nbMax = Math.max(...lstNombresAnimaux)

      switch (listeTypeDeQuestions[q]) {
        case 1:
          A = pointAbstrait(0, 0)
          B = pointAbstrait(6, 0)
          T = pointAbstrait(7, 0)
          a0 = cercleCentrePoint(A, B, 'black')
          objets.push(a0)
          alpha = 90

          t = tracePoint(A)
          t.style = '+'
          objets.push(t)

          for (let i = 0; i < nbAnimaux; i++) {
            angle = (360 * lstNombresAnimaux[i]) / effectiftotal
            a = arc(
              rotation(B, A, alpha),
              A,
              angle,
              true,
              texcolors(i + 1),
              'black',
              0.7,
            )
            hachures = motifs(listeMotifs[i])
            a.hachures = hachures
            a.couleurDeRemplissage = colorToLatexOrHTML(texcolors(i + 1))
            a.couleurDesHachures = a.couleurDeRemplissage
            objets.push(a)
            alpha += angle
            legende = carre(
              translation(T, vecteur(0, 1.5 * i)),
              translation(T, vecteur(1, 1.5 * i)),
              'black',
            )
            legende.couleurDeRemplissage = a.couleurDeRemplissage
            legende.couleurDesHachures = a.couleurDesHachures
            legende.hachures = hachures
            legende.opaciteDeRemplissage = 0.7
            textelegende = texteParPosition(
              lstAnimauxExo[i],
              8.5,
              i * 1.5 + 0.5,
              0,
              'black',
              1.5,
              'gauche',
              false,
            )
            objets.push(legende, textelegende)
            paramsEnonce = Object.assign(
              { pixelsParCm: 20, scale: 0.5, mainlevee: false },
              fixeBordures(objets),
            )
          }
          break
        case 2:
          A = pointAbstrait(0, 0)
          B = pointAbstrait(6, 0)
          T = pointAbstrait(7, 0)
          a0 = arc(B, A, 180, true, 'white', 'black')
          objets.push(a0)
          alpha = 0
          t = tracePoint(A)
          t.style = '+'
          objets.push(t)

          for (let i = 0; i < nbAnimaux; i++) {
            angle = (180 * lstNombresAnimaux[i]) / effectiftotal
            a = arc(
              rotation(B, A, alpha),
              A,
              angle,
              true,
              texcolors(i + 1),
              'black',
              0.7,
            )
            hachures = motifs(listeMotifs[i])
            a.hachures = hachures
            a.couleurDeRemplissage = colorToLatexOrHTML(texcolors(i + 1))
            a.couleurDesHachures = a.couleurDeRemplissage
            objets.push(a)
            alpha += angle
            legende = carre(
              translation(T, vecteur(0, 1.5 * i)),
              translation(T, vecteur(1, 1.5 * i)),
              'black',
            )
            legende.couleurDeRemplissage = a.couleurDeRemplissage
            legende.couleurDesHachures = a.couleurDesHachures
            legende.hachures = hachures
            legende.opaciteDeRemplissage = 0.7
            textelegende = texteParPosition(
              lstAnimauxExo[i],
              8.5,
              i * 1.5 + 0.5,
              0,
              'black',
              1,
              'gauche',
              false,
            )
            objets.push(legende, textelegende)
            paramsEnonce = Object.assign(
              { pixelsParCm: 20, scale: 0.5, mainlevee: false },
              fixeBordures(objets),
            )
          }
          break
        case 3:
          coef = 1
          switch (this.sup2) {
            case 1:
              coef = 1
              break
            case 2:
              coef = 10
              break
          }
          r = repere({
            grilleX: false,
            grilleY: 'pointilles',
            xThickListe: false,
            xLabelListe: false,
            yUnite: 0.1 / coef,
            yThickDistance: 10 * coef,
            yMax: (Math.round(nbMax / 10) + 1) * 10 * coef,
            yLabelEcart: 0.75,
            xMin: 0,
            xMax: 10,
            yMin: 0,
            axeXStyle: '',
            yLegende: "Nombre d'individus",
          })

          lstElementGraph = []
          for (let i = 0; i < nbAnimaux; i++) {
            objets.push(
              traceBarre(
                ((r.xMax - r.xMin) / (nbAnimaux + 1)) * (i + 1),
                lstNombresAnimaux[i],
                lstAnimauxExo[i],
                {
                  unite: 0.1 / coef,
                  couleurDeRemplissage: texcolors(i + 1),
                  hachures: 'north east lines',
                },
              ),
            )
          }
          if (r.objets != null) objets.push(r.objets)
          paramsEnonce = Object.assign(
            { pixelsParCm: 20, scale: 0.5, mainlevee: false },
            fixeBordures(objets),
          )

          break

        case 4:
          coef = 1
          switch (this.sup2) {
            case 1:
              coef = 1
              break
            case 2:
              coef = 10
              break
          }
          r = repere({
            grilleX: false,
            grilleY: 'pointilles',
            xThickListe: false,
            xLabelListe: false,
            yUnite: 0.1 / coef,
            yThickDistance: 10 * coef,
            yMax: (Math.round(nbMax / 10) + 1) * 10 * coef,
            yLabelEcart: 0.75,
            xMin: 0,
            xMax: 10,
            yMin: 0,
            axeXStyle: '',
            yLegende: "Nombre d'individus",
          })

          lstElementGraph = []
          for (let i = 0; i < nbAnimaux; i++) {
            lstElementGraph.push([(i + 1) * 2, lstNombresAnimaux[i]])
            objets.push(
              texteParPosition(
                lstAnimauxExo[i],
                (i + 1) * 2,
                -0.2,
                66,
                'black',
                1,
                'gauche',
              ),
            )
            objets.push(segment((i + 1) * 2, -0.1, (i + 1) * 2, 0.1))
          }
          g = traceGraphiqueCartesien(lstElementGraph, r, {
            couleurDesPoints: 'red',
            couleurDuTrait: 'lightgray',
            styleDuTrait: '', // plein par défaut
            epaisseurDuTrait: 1,
            styleDesPoints: 'o', // croix par défaut
            tailleDesPoints: 3,
          })

          if (r.objets != null) objets.push(r.objets)
          objets.push(g)

          paramsEnonce = Object.assign(
            { pixelsParCm: 20, scale: 0.5, mainlevee: false },
            fixeBordures(objets),
          )

          break
      }
      reponse1 = lstAnimauxExo[lstNombresAnimaux.indexOf(nbMin)]
      reponse2 = lstAnimauxExo[lstNombresAnimaux.indexOf(nbMax)]
      texteAMC += mathalea2d(paramsEnonce, objets)
      texte = texteAMC // Le texteAMC commun avec le texte (en non AMC) s'arrête ici !

      // Construction des QCM valables en interactif ET en AMC
      const propositionsQcm1 = []
      for (let i = 0; i < nbAnimaux; i++) {
        propositionsQcm1.push({
          texte: `${lstAnimauxExo[i]}`,
          statut: reponse1 === lstAnimauxExo[i],
        })
      }

      const propositionsQcm2 = []
      for (let i = 0; i < nbAnimaux; i++) {
        propositionsQcm2.push({
          texte: `${lstAnimauxExo[i]}`,
          statut: reponse2 === lstAnimauxExo[i],
        })
      }

      const propositionsQcm3 = []
      propositionsQcm3.push(
        {
          texte: 'Plus de la moitié des animaux',
          statut: nbMax > effectiftotal / 2,
        },
        {
          texte: 'Moins de la moitié des animaux',
          statut: nbMax < effectiftotal / 2,
        },
        {
          texte: 'La moitié des animaux',
          statut: nbMax === effectiftotal / 2,
        },
      )

      // La variation entre QCM Interactif et AMC commence ici
      if (!context.isAmc) {
        this.autoCorrection[q * 3].propositions = propositionsQcm1
        this.autoCorrection[q * 3 + 1].propositions = propositionsQcm2
        this.autoCorrection[q * 3 + 2].propositions = propositionsQcm3
        this.autoCorrection[q * 3].options = {}
        this.autoCorrection[q * 3 + 1].options = {}
        this.autoCorrection[q * 3 + 2].options = {}
        monQcm1 = propositionsQcm(this, q * 3)
        monQcm2 = propositionsQcm(this, q * 3 + 1)
        monQcm3 = propositionsQcm(this, q * 3 + 2)
        texte +=
          `${numAlpha(0)} Quelle est l'espèce la moins nombreuse ?` +
          monQcm1.texte
        texte +=
          `<br>${!context.isHtml ? '<br>' : ''}${numAlpha(1)} Quelle est l'espèce la plus nombreuse ?` +
          monQcm2.texte
        texte +=
          `<br>${!context.isHtml ? '<br>' : ''}${numAlpha(2)} L'espèce la plus nombreuse représente ...` +
          monQcm3.texte
        texteCorr =
          `${numAlpha(0)} L'animal le moins nombreux parmi ces espèces est : ` +
          monQcm1.texteCorr
        texteCorr +=
          `<br>${!context.isHtml ? '<br>' : ''}${numAlpha(1)} L'animal le plus nombreux parmi ces espèces est : ` +
          monQcm2.texteCorr
        texteCorr +=
          `<br>${!context.isHtml ? '<br>' : ''}${numAlpha(2)} L'animal le plus nombreux parmi ces espèces représente : ` +
          monQcm3.texteCorr
      } else {
        // en AMC
        this.autoCorrection[q].enonce = ''
        this.autoCorrection[q].propositions = [
          {
            type: 'qcmMono',
            propositions: propositionsQcm1,
            enonce:
              texteAMC +
              `${numAlpha(0)} Quelle est l'espèce la moins nombreuse ?`,
          },
          {
            type: 'qcmMono',
            propositions: propositionsQcm2,
            enonce: `${numAlpha(1)} Quelle est l'espèce la plus nombreuse ?`,
          },
          {
            type: 'qcmMono',
            propositions: propositionsQcm3,
            enonce: `${numAlpha(2)} L'espèce la plus nombreuse représente ?`,
            options: { lastChoice: 2 },
          },
        ]
      }

      if (this.questionJamaisPosee(q, effectiftotal)) {
        this.listeQuestions[q] = texte
        this.listeCorrections[q] = texteCorr

        q++
      }
    }
    listeQuestionsToContenu(this) // On envoie l'exercice à la fonction de mise en page
  }
}
