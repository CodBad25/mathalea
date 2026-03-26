import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

import { PointAbstrait, pointAbstrait } from '../../lib/2d/PointAbstrait'
import { tracePoint } from '../../lib/2d/TracePoint'
import { vecteur } from '../../lib/2d/Vecteur'
import { cercle } from '../../lib/2d/cercle'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { placeLatexSurSegment } from '../../lib/2d/placeLatexSurSegment'
import { polygone } from '../../lib/2d/polygones'
import { cylindre } from '../../lib/2d/projections3d'
import { Segment, segment } from '../../lib/2d/segmentsVecteurs'
import { labelPoint, Latex2d } from '../../lib/2d/textes'
import { similitude, translation } from '../../lib/2d/transformations'
import { longueur } from '../../lib/2d/utilitairesGeometriques'
import { pointAdistance } from '../../lib/2d/utilitairesPoint'
import { deuxColonnesResp } from '../../lib/format/miseEnPage'
import { arrondi } from '../../lib/outils/nombres'
import { sp } from '../../lib/outils/outilString'
import { texNombre } from '../../lib/outils/texNombre'
import { mathalea2d } from '../../modules/mathalea2d'
import type { NestedObjetMathalea2dArray } from '../../types/2d'

export const titre = 'Calculer des longueurs avec un patron de cylindre'

export const dateDePublication = '27/04/2024'

export const uuid = 'bc788'
export const refs = {
  'fr-fr': ['5G52'],
  'fr-ch': ['11ES1-2', '10ES1-2'],
}
/**
 * calculer des longueurs avec un patron de cylindre
 * 'problème en  baseCoteCoucheVuDroite avec r=4'
 * @author Olivier Mimeau
 */
export default class nomExercice extends Exercice {
  constructor() {
    super()
    this.consigne = ''
    this.nbQuestions = 4
    this.besoinFormulaireTexte = [
      'Types de questions',
      'Nombres séparés par des tirets :\n1 : Cylindre vers patron \n2 : Patron vers cylindre \n3 : Mélange',
    ]
    this.besoinFormulaire2Texte = [
      'Position du cylindre',
      'Nombres séparés par des tirets :\n1 : Debout \n2 : La base en face avant \n3 : La base vue de côté \n4 : Mélange',
    ]
    this.besoinFormulaire3Texte = [
      'Base du cylindre donnée par son ...',
      'Nombres séparés par des tirets :\n1 : Rayon \n2 : Diamètre \n3 : Mélange',
    ]
    this.sup = '3'
    this.sup2 = '4'
    this.sup3 = '3'
  }

  nouvelleVersion() {
    // ['CylindreVersPatron', 'PatronVersCylindre'], 'type3'
    const typeQuestionsDisponibles = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: 2,
      melange: 3,
      defaut: 3,
      listeOfCase: ['CylindreVersPatron', 'PatronVersCylindre'],
      shuffle: false,
      nbQuestions: 999,
    })
    const listeTypeQuestions = combinaisonListes(
      typeQuestionsDisponibles,
      this.nbQuestions,
    )

    // ['DeboutVuDessus', 'baseAvantCoucheVuGauche', 'baseCoteCoucheVuDroite']/// ['DeboutVuDessus', 'baseCoteCoucheVuDroite', 'baseAvantCoucheVuGauche']// ['DeboutVuDessus', 'baseAvantCoucheVuDroite', 'baseCoteCoucheVuDroite']// ['DeboutVuDessus', 'DeboutVuDessous', 'baseAvantCoucheVuGauche', 'baseAvantCoucheVuDroite', 'baseCoteCoucheVuGauche', 'baseCoteCoucheVuDroite']
    const orientationCylindre = gestionnaireFormulaireTexte({
      saisie: this.sup2,
      min: 1,
      max: 3,
      melange: 4,
      defaut: 4,
      listeOfCase: [
        'DeboutVuDessus',
        'baseAvantCoucheVuGauche',
        'baseCoteCoucheVuDroite',
      ],
      shuffle: false,
      nbQuestions: 999,
    })
    const listeTypeOrientationCylindre = combinaisonListes(
      orientationCylindre,
      this.nbQuestions,
    )

    const baseCylindre = gestionnaireFormulaireTexte({
      saisie: this.sup3,
      min: 1,
      max: 2,
      melange: 3,
      defaut: 3,
      listeOfCase: ['rayon', 'diametre'],
      shuffle: false,
      nbQuestions: 999,
    })
    const listeTypeBaseCylindre = combinaisonListes(
      baseCylindre,
      this.nbQuestions,
    )

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      let texte = '' // listeTypeQuestions[i] + '<br>' //
      let texteCorr = ''
      const tailleMinFigure = 7
      const scaleDessin = 0.5
      const largeurCol = 50 // en % sert pour sortie PDF et HTML ?
      const largeurHTMCol = `${tailleMinFigure * 20}px`
      const objetsPerspective = []
      const objetsPerspectiveReponse = []
      const objetsPatron = []
      const objetsPatronReponse = []

      const rEx = randint(2, 7) // rayon
      const hEx = randint(3, 10, [rEx]) // hauteur
      const rAff = Math.max(3, Math.min(rEx, 5))
      const hAff = hEx
      const cent1 = pointAbstrait(0, 0, 'A', 'left')

      let cylindreEx = cylindre({
        centre: cent1,
        rx: rAff,
        hauteur: hAff,
        color: 'black',
      })
      let cent2 = pointAbstrait(0, hAff, 'Z', 'left')
      // On initialise les éléments servant aux questions avec n'importe quoi (ce sera remplacé ensuite)
      let ext1RayonDiametre: PointAbstrait = pointAbstrait(0, 0)
      let ext2RayonDiametre: PointAbstrait
      // On initialise les éléments servant aux questions avec n'importe quoi (ce sera remplacé ensuite)
      let ext1Hauteur = pointAbstrait(0, 0)
      let ext2Hauteur = pointAbstrait(0, 1)

      switch (listeTypeOrientationCylindre[i]) {
        case 'DeboutVuDessus':
          cylindreEx = cylindre({
            centre: cent1,
            rx: rAff,
            hauteur: hAff,
            position: 'DeboutVuDessus',
            color: 'black',
          })
          cent2 = pointAbstrait(0, hAff, 'B', 'left')
          ext1RayonDiametre = pointAbstrait(rAff, 0)
          if (listeTypeBaseCylindre[i] === 'rayon') {
            ext2RayonDiametre = cent1
          } else {
            // 'diametre'
            cent1.positionLabel = 'above'
            ext2RayonDiametre = pointAbstrait(-rAff, 0)
          }
          ext1Hauteur = pointAbstrait(rAff, hAff)
          ext2Hauteur = pointAbstrait(rAff, 0)
          break
        case 'baseAvantCoucheVuGauche': {
          // valeurs dans la perspective
          const angDeFuite = 30
          const coefDeFuite = 0.8
          // valeurs dans la perspective
          cylindreEx = cylindre({
            centre: cent1,
            rx: rAff,
            hauteur: hAff,
            position: 'baseAvantCoucheVuGauche',
            color: 'black',
            coefficientDeFuite: coefDeFuite,
          })
          cent2 = pointAdistance(
            cent1,
            hAff * coefDeFuite,
            angDeFuite,
            'G',
            'left',
          )
          const ey = -rAff * Math.cos((angDeFuite * Math.PI) / 180)
          const ex = rAff * Math.sin((angDeFuite * Math.PI) / 180)
          if (listeTypeBaseCylindre[i] === 'rayon') {
            ext1RayonDiametre = pointAbstrait(cent1.x + rAff, cent1.y)
            ext2RayonDiametre = cent1
          } else {
            // 'diametre'
            ext1RayonDiametre = pointAbstrait(cent1.x, cent1.y + rAff)
            ext2RayonDiametre = pointAbstrait(cent1.x, cent1.y - rAff)
          }
          ext1Hauteur = pointAbstrait(cent2.x + ex, cent2.y + ey)
          ext2Hauteur = pointAbstrait(cent1.x + ex, cent1.y + ey)
          break
        }
        case 'baseCoteCoucheVuDroite':
        default:
          // a finir
          cylindreEx = cylindre({
            centre: cent1,
            rx: rAff,
            hauteur: hAff,
            position: 'baseCoteCoucheVuDroite',
            color: 'black',
          })
          cent2 = pointAbstrait(hAff, 0, 'B', 'left')
          if (listeTypeBaseCylindre[i] === 'rayon') {
            ext2RayonDiametre = cent2
            ext1RayonDiametre = pointAbstrait(hAff, rAff)
          } else {
            // 'diametre'
            ext1RayonDiametre = pointAbstrait(hAff, rAff)
            ext2RayonDiametre = pointAbstrait(hAff, -rAff)
          }
          ext1Hauteur = pointAbstrait(0, rAff)
          ext2Hauteur = pointAbstrait(hAff, rAff)
          break
      }
      const tCent1 = tracePoint(cent1)
      const tCent2 = tracePoint(cent2)

      const segRayon = segment(ext1RayonDiametre, ext2RayonDiametre, 'black')
      segRayon.pointilles = 1
      // qRayonCylindre = texteSurSegment('\\text{.......}', ext1RayonDiametre, ext2RayonDiametre)
      segRayon.pointilles = 1
      const qRayonCylindre = placeLatexSurSegment(
        '\\text{.......}',
        ext1RayonDiametre,
        ext2RayonDiametre,
      )
      const rRayonCylindre = placeLatexSurSegment(
        `${texNombre(listeTypeBaseCylindre[i] === 'rayon' ? rEx : 2 * rEx, 1)}\\text{ cm}`,
        ext1RayonDiametre,
        ext2RayonDiametre,
      )
      const qHauteurCylindre = placeLatexSurSegment(
        '\\text{.......}',
        ext1Hauteur,
        ext2Hauteur,
      )
      const rHauteurCylindre = placeLatexSurSegment(
        `${texNombre(hEx, 1)}\\text{ cm}`,
        ext1Hauteur,
        ext2Hauteur,
      )
      if (listeTypeQuestions[i] === 'CylindreVersPatron') {
        objetsPerspective.push(
          cylindreEx,
          tCent1,
          tCent2,
          segRayon,
          rRayonCylindre,
          rHauteurCylindre,
          labelPoint(cent1, cent2),
        )
        objetsPerspectiveReponse.push(
          cylindreEx,
          tCent1,
          tCent2,
          segRayon,
          rRayonCylindre,
          rHauteurCylindre,
          labelPoint(cent1, cent2),
        )
      } else {
        objetsPerspective.push(
          cylindreEx,
          tCent1,
          tCent2,
          segRayon,
          qRayonCylindre,
          qHauteurCylindre,
          labelPoint(cent1, cent2),
        )
        objetsPerspectiveReponse.push(
          cylindreEx,
          tCent1,
          tCent2,
          segRayon,
          rRayonCylindre,
          rHauteurCylindre,
          labelPoint(cent1, cent2),
        )
      }

      const [dimlRect, dimLRect, dimRCercle] = [4, 12, 2] // dimLargeurRectangle
      const A = pointAbstrait(0, 0)
      const B = pointAbstrait(0, dimlRect)
      const C = pointAbstrait(dimLRect, dimlRect)
      const D = pointAbstrait(dimLRect, 0)
      const centreHaut = pointAbstrait(
        randint(dimlRect, dimLRect - dimRCercle),
        dimlRect + dimRCercle,
      )
      const centreBas = pointAbstrait(
        randint(dimlRect, dimLRect - dimRCercle),
        -dimRCercle,
      )
      const rectanglePatron = polygone([A, B, C, D], 'black')
      const cercleHaut = cercle(centreHaut, dimRCercle)
      const cercleBas = cercle(centreBas, dimRCercle)
      objetsPatron.push(rectanglePatron, cercleHaut, cercleBas)
      objetsPatronReponse.push(rectanglePatron, cercleHaut, cercleBas)
      // les quatre éléments suivants : positions à varier ??
      let ALongueurPatron: PointAbstrait
      let BLongueurPatron: PointAbstrait
      // let coteLongueurPatron:Segment
      // let qLongueurPatron:Latex2d
      // let rLongueurPatron:Latex2d
      let coteHauteurPatron: Segment
      let qHauteurPatron: Latex2d
      let rHauteurPatron: Latex2d
      let ptExtremite1Rayon: PointAbstrait
      let ptExtremite2Rayon: PointAbstrait
      let ptExtremite1Diametre: PointAbstrait
      let ptExtremite2Diametre: PointAbstrait
      if (choice([0, 1]) === 0) {
        ALongueurPatron = C
        BLongueurPatron = B
      } else {
        ALongueurPatron = A
        BLongueurPatron = D
      }
      const perimetre = 2 * rEx * Math.PI
      const coteLongueurPatron = afficheCoteSegmentSansTexte(
        segment(ALongueurPatron, BLongueurPatron),
        0.5,
        'black',
      )
      const qLongueurPatron = placeLatexSurSegment(
        '\\text{.......}',
        ALongueurPatron,
        BLongueurPatron,
        { distance: 1 },
      )
      const rLongueurPatron = placeLatexSurSegment(
        `${listeTypeQuestions[i] === 'CylindreVersPatron' ? '\\approx' : ''}\\text{${texNombre(perimetre, 1)} cm}`,
        ALongueurPatron,
        BLongueurPatron,
        { letterSize: 'small', distance: 1 },
      )

      if (choice([0, 1]) === 0) {
        coteHauteurPatron = afficheCoteSegmentSansTexte(
          segment(A, B),
          0.5,
          'black',
        )
        qHauteurPatron = placeLatexSurSegment('\\text{.......}', A, B, {
          distance: 1,
        })
        rHauteurPatron = placeLatexSurSegment(`\\text{${hEx} cm}`, A, B, {
          letterSize: 'small',
          distance: 1,
        })
      } else {
        coteHauteurPatron = afficheCoteSegmentSansTexte(
          segment(C, D),
          0.5,
          'black',
        )
        qHauteurPatron = placeLatexSurSegment('\\text{.......}', C, D, {
          distance: 1,
        })
        rHauteurPatron = placeLatexSurSegment(`\\text{${hEx} cm}`, C, D, {
          letterSize: 'small',
          distance: 1,
        })
      }
      if (choice([0, 1]) === 0) {
        ptExtremite1Rayon = pointAbstrait(centreHaut.x, centreHaut.y)
        ptExtremite2Rayon = pointAbstrait(
          centreHaut.x + dimRCercle,
          centreHaut.y,
        )
        ptExtremite1Diametre = pointAbstrait(
          centreBas.x - dimRCercle,
          centreBas.y,
        )
        ptExtremite2Diametre = pointAbstrait(
          centreBas.x + dimRCercle,
          centreBas.y,
        )
      } else {
        ptExtremite1Rayon = pointAbstrait(centreHaut.x, centreHaut.y)
        ptExtremite2Rayon = pointAbstrait(
          centreHaut.x + dimRCercle,
          centreHaut.y,
        )
        ptExtremite1Diametre = pointAbstrait(
          centreBas.x - dimRCercle,
          centreBas.y,
        )
        ptExtremite2Diametre = pointAbstrait(
          centreBas.x + dimRCercle,
          centreBas.y,
        )
      }
      const coteRayon = afficheCoteSegmentSansTexte(
        segment(ptExtremite1Rayon, ptExtremite2Rayon),
        0,
        'black',
      )
      const coteDiametre = afficheCoteSegmentSansTexte(
        segment(ptExtremite1Diametre, ptExtremite2Diametre),
        0,
        'black',
      )
      let qRayon = placeLatexSurSegment(
        '\\text{.......}',
        ptExtremite1Rayon,
        ptExtremite2Rayon,
      )
      let rRayon = placeLatexSurSegment(
        `\\text{${rEx} cm}`,
        ptExtremite1Rayon,
        ptExtremite2Rayon,
        { letterSize: 'small', distance: 1 },
      )
      let qDiametre = placeLatexSurSegment(
        '\\text{.......}',
        ptExtremite1Diametre,
        ptExtremite2Diametre,
      )
      let rDiametre = placeLatexSurSegment(
        `\\text{${2 * rEx} cm}`,
        ptExtremite1Diametre,
        ptExtremite2Diametre,
        { letterSize: 'small', distance: 1 },
      )
      if (listeTypeQuestions[i] === 'CylindreVersPatron') {
        qRayon = placeLatexSurSegment(
          '\\text{.......}',
          ptExtremite1Rayon,
          ptExtremite2Rayon,
        )
        rRayon = placeLatexSurSegment(
          `\\text{${rEx} cm}`,
          ptExtremite1Rayon,
          ptExtremite2Rayon,
          { letterSize: 'small', distance: 1 },
        )
        qDiametre = placeLatexSurSegment(
          '\\text{.......}',
          ptExtremite1Diametre,
          ptExtremite2Diametre,
        )
        rDiametre = placeLatexSurSegment(
          `\\text{${2 * rEx} cm}`,
          ptExtremite1Diametre,
          ptExtremite2Diametre,
          { letterSize: 'small', distance: 1 },
        )
        objetsPatron.push(
          coteLongueurPatron,
          coteHauteurPatron,
          coteRayon,
          coteDiametre,
          qLongueurPatron,
          qHauteurPatron,
          qRayon,
          qDiametre,
        )
        objetsPatronReponse.push(
          coteLongueurPatron,
          coteHauteurPatron,
          coteRayon,
          coteDiametre,
          rLongueurPatron,
          rHauteurPatron,
          rRayon,
          rDiametre,
        )
      } else {
        objetsPatron.push(
          coteLongueurPatron,
          coteHauteurPatron,
          /* coteRayon, */ rLongueurPatron,
          rHauteurPatron /*, rRayon */,
        )
        objetsPatronReponse.push(
          coteLongueurPatron,
          coteHauteurPatron,
          coteRayon,
          rLongueurPatron,
          rHauteurPatron /*, rRayon */,
        )
      }

      switch (listeTypeQuestions[i]) {
        case 'CylindreVersPatron': {
          const [colonne1, colonne2] = definiColonnes(
            objetsPerspective,
            objetsPatron,
            scaleDessin,
          )
          const [rColonne1, rColonne2] = definiColonnes(
            objetsPerspectiveReponse,
            objetsPatronReponse,
            scaleDessin,
          )
          // texte += `Question ${i + 1} de type CylindreVersPatron<br>${listetypeOrientationCylindre[i]}<br>`
          texte +=
            'On souhaite construire le patron  du cylindre ci-dessous.<br> Complète le schéma du patron en indiquant les longueurs en valeur exacte si possible ou au millimètre près.<br>'
          texte += '<br><br>'
          texte += deuxColonnesResp(colonne1, colonne2, {
            largeur1: largeurCol,
            eleId: '',
            widthmincol1: largeurHTMCol,
            widthmincol2: '0px',
          })
          if (listeTypeBaseCylindre[i] === 'rayon') {
            texteCorr += `Le rayon du cercle de base est $${texNombre(rEx, 1)}${sp()}\\text{cm}$<br>`
            texteCorr += `Le diamètre du cercle de base est $2 \\times ${texNombre(rEx, 1)} = ${texNombre(2 * rEx, 1)}${sp()}\\text{cm}$.<br>`
          } else {
            // 'diametre'
            texteCorr += `Le diamètre du cercle de base est $${texNombre(2 * rEx, 1)}${sp()}\\text{cm}$.<br>`
            texteCorr += `Le rayon du cercle de base est $${texNombre(2 * rEx, 1)} \\div 2 = ${texNombre(rEx, 1)}${sp()}\\text{cm}$.<br>`
          }
          texteCorr += `La largeur du rectangle est égale à la hauteur du cylindre soit $${texNombre(hEx, 1)}${sp()}\\text{cm}$.<br>`
          texteCorr += `La longueur du rectangle est égale à la longueur du cercle de base soit $2 \\times ${texNombre(rEx, 1)}\\times \\pi=${texNombre(
            2 * rEx,
            1,
          )}\\pi\\approx${texNombre(perimetre, 1)}${sp()}\\text{cm}$.<br>`
          texteCorr += '<br><br>'
          texteCorr += deuxColonnesResp(rColonne1, rColonne2, {
            largeur1: largeurCol,
            eleId: '',
            widthmincol1: largeurHTMCol,
            widthmincol2: '0px',
          })
          break
        }
        case 'PatronVersCylindre': {
          const [colonne1, colonne2] = definiColonnes(
            objetsPatron,
            objetsPerspective,
            scaleDessin,
          )
          const [rColonne1, rColonne2] = definiColonnes(
            objetsPatronReponse,
            objetsPerspectiveReponse,
            scaleDessin,
          )
          // texte += `Question ${i + 1} de type PatronVersCylindre`
          texte +=
            'On souhaite connaitre les dimensions du cylindre correspondant au patrons ci-dessous.<br> Complète le schéma du cylindre en indiquant les longueurs en valeur exacte si possible ou au millimètre près.<br>'
          texte += '<br><br>'
          texte += deuxColonnesResp(colonne1, colonne2, {
            largeur1: largeurCol,
            eleId: '',
            widthmincol1: largeurHTMCol,
            widthmincol2: '0px',
          })
          const approxDiametre = arrondi(perimetre / Math.PI, 1)
          texteCorr += `La hauteur du cylindre est égale à la largeur du rectangle soit $${texNombre(hEx, 1)}${sp()}\\text{cm}$.<br>`
          texteCorr += `La longueur du rectangle est égale à la longueur du cercle de base, on a donc l'égalité $diametre \\times \\pi=${texNombre(perimetre, 1)}${sp()}\\text{cm}$.<br>`
          texteCorr += `Donc la longueur du diamètre est égale à  $${texNombre(perimetre, 1)} \\div  \\pi \\approx${texNombre(approxDiametre)}${sp()}\\text{cm}$.<br>`
          if (listeTypeBaseCylindre[i] === 'rayon') {
            texteCorr += `Donc la longueur du rayon est donc approximativement égale à $${texNombre(approxDiametre)} \\div 2 = ${texNombre(approxDiametre / 2, 1)}${sp()}\\text{cm}$.<br>`
          }
          texteCorr += '<br><br>'
          texteCorr += deuxColonnesResp(rColonne1, rColonne2, {
            largeur1: largeurCol,
            eleId: '',
            widthmincol1: largeurHTMCol,
            widthmincol2: '0px',
          })
          break
        }
        case 'type3':
        default:
          texte = `Question ${i + 1} de type 3`
          texteCorr = `Correction ${i + 1} de type 3`
          break
      }
      if (this.questionJamaisPosee(i, rEx, hEx)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}

function afficheCoteSegmentSansTexte(
  s: Segment,
  positionCote = 0.5,
  couleurCote = 'black',
): Segment {
  const A = s.extremite1
  const B = s.extremite2
  const v = similitude(vecteur(A, B), A, 90, positionCote / s.longueur)
  const cote = segment(translation(A, v), translation(B, v), couleurCote)
  if (longueur(A, B) > 1) cote.styleExtremites = '<->'
  else cote.styleExtremites = '>-<'
  return cote
}
function definiColonnes(
  objetsAAfficher1: NestedObjetMathalea2dArray,
  objetsAAfficher2: NestedObjetMathalea2dArray,
  scaleDessin: number,
): [string, string] {
  const bord1 = fixeBordures(objetsAAfficher1, {
    rxmin: -0.1,
    rymin: -0.1,
    rxmax: 0.1,
    rymax: 0.1,
  })
  const bord2 = fixeBordures(objetsAAfficher2, {
    rxmin: -0.1,
    rymin: -0.1,
    rxmax: 0.1,
    rymax: 0.1,
  })
  const colonne1 = mathalea2d(
    Object.assign(
      {
        /* pixelsParCm: 20,  */ scale: scaleDessin,
        optionsTikz: ['baseline=(current bounding box.north)'],
        mainlevee: false,
      },
      bord1,
    ),
    objetsAAfficher1,
  )
  const colonne2 = mathalea2d(
    Object.assign(
      {
        scale: scaleDessin,
        optionsTikz: ['baseline=(current bounding box.north)'],
        mainlevee: false,
      },
      bord2,
    ),
    objetsAAfficher2,
  )
  return [colonne1, colonne2]
}
