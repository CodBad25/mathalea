import { afficheMesureAngle } from '../../lib/2d/AfficheMesureAngle'
import { cercle } from '../../lib/2d/cercle'
import { codageAngleDroit } from '../../lib/2d/CodageAngleDroit'
import { Droite, droite } from '../../lib/2d/droites'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { mediatrice } from '../../lib/2d/Mediatrice'
import { placeLatexSurSegment } from '../../lib/2d/placeLatexSurSegment'
import { PointAbstrait, pointAbstrait } from '../../lib/2d/PointAbstrait'
import { polygoneAvecNom } from '../../lib/2d/polygones'
import { rotation, similitude } from '../../lib/2d/transformations'
import {
  pointAdistance,
  pointIntersectionCC,
  pointIntersectionDD,
  pointIntersectionLC,
} from '../../lib/2d/utilitairesPoint'
import { lampeMessage } from '../../lib/format/message'
import { combinaisonListes } from '../../lib/outils/arrayOutils'
import { texteEnCouleurEtGras } from '../../lib/outils/embellissements'
import { range } from '../../lib/outils/nombres'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import {
  listeQuestionsToContenu,
  randint,
  texEnumerateSansNumero,
} from '../../modules/outils'
import { Triangle } from '../../modules/Triangle'
import type { NestedObjetMathalea2dArray } from '../../types/2d'
import Exercice from '../Exercice'
export const dateDeModifImportante = '25/07/2023'
export const titre = 'Utiliser le vocabulaire des triangles'

/**
 * Vocabulaire des triangles
 * @author Sébastien Lozano -
 */
export const uuid = 'c3781'

export const refs = {
  'fr-fr': ['5G20-1'],
  'fr-ch': ['9ES2-7'],
}
export default class VocabulaireDesTriangles extends Exercice {
  classe: number
  constructor() {
    super()
    this.besoinFormulaireCaseACocher = ['Avec une figure à main levée', false]
    this.besoinFormulaire2CaseACocher = ['Avec des décimaux', false]
    this.consigne = 'Donner la nature des triangles en justifiant.'
    this.sup = false
    this.sup2 = false
    this.classe = 5
    this.nbQuestions = 5
  }

  private formatLongueurValeur(val: number, unit: 'cm' | 'mm' | 'dm' = 'cm') {
    switch (unit) {
      case 'mm':
        return texNombre(val) // caller should pass converted value when needed
      case 'dm':
        return texNombre(val)
      default:
        return texNombre(val)
    }
  }

  private makeTexAndCorrForType(
    type: number,
    longueurMin: number,
    longueurMax: number,
    angleMin: number,
    angleMax: number,
    partieDecimales: [number, number, number],
  ): {
    texte: string
    texteCorr: string
    figureMainLevee: NestedObjetMathalea2dArray
  } {
    // prepare triangles used by cases
    const tQuel = new Triangle(0, 0, 0, 0, 0, 0)
    const tIso = new Triangle()
    const tEqui = new Triangle()
    const tRect = new Triangle()
    const tIsoRect = new Triangle()

    let l1: number = 0
    let l2: number = 0
    let l3: number = 0
    let a1: number = 0
    let a2: number = 0
    let a3: number = 0
    let texte = ''
    let texteCorr = ''
    const A = pointAbstrait(0, 0)
    let B: PointAbstrait, C: PointAbstrait
    const figureMainLevee: NestedObjetMathalea2dArray = []
    let nomTriangle = ''

    const [pd1, pd2, pd3] = partieDecimales

    const setLongs = (t: Triangle, a: number, b?: number, c?: number) => {
      t.l1 = a
      if (b !== undefined) t.l2 = b
      if (c !== undefined) t.l3 = c
    }

    switch (type) {
      case 1:
        {
          // quelconque par longueurs
          while (!tQuel.isTrueTriangleLongueurs()) {
            l1 = randint(longueurMin, longueurMax)
            l2 = randint(longueurMin, longueurMax, l1)
            l3 = randint(longueurMin, longueurMax, [l1, l2])
            setLongs(tQuel, l1 + pd1, l2 + pd2, l3 + pd3)
          }
          B = pointAdistance(
            A,
            tQuel.l1,
            l1 < l2 || l1 < l3 ? randint(-70, -89) : randint(-20, 20),
          )
          let inter: PointAbstrait | false
          do {
            const c1 = cercle(A, (tQuel.l2 * randint(10, 12)) / 10)
            const c2 = cercle(B, (tQuel.l3 * randint(10, 12)) / 10)
            inter = pointIntersectionCC(c1, c2, '', 1)
          } while (!inter)
          nomTriangle = tQuel.getNom()
          A.nom = nomTriangle[1]
          B.nom = nomTriangle[2]
          inter.nom = nomTriangle[3]
          C = inter
          figureMainLevee.push(
            ...polygoneAvecNom(A, B, inter),
            placeLatexSurSegment(`${texNombre(tQuel.l1)}\\text{ cm}`, B, A, {
              letterSize: 'normalsize',
            }),
            placeLatexSurSegment(`${texNombre(l2)}\\text{ cm}`, A, C, {
              letterSize: 'normalsize',
            }),
            placeLatexSurSegment(`${texNombre(tQuel.l3)}\\text{ cm}`, C, B, {
              letterSize: 'normalsize',
            }),
          )

          texte = `${nomTriangle} est un triangle tel que ${tQuel.getLongueurs()[0]} $= ${texNombre(tQuel.l1)}\\text{ cm}$ ; `
          texte += `${tQuel.getLongueurs()[2]} $= ${texNombre(tQuel.l2)}\\text{ cm}$ et ${tQuel.getLongueurs()[1]} $= ${texNombre(tQuel.l3)}\\text{ cm}$.`
          texteCorr = `Les 3 côtés du triangle ${nomTriangle} sont différents et nous n'avons aucune information sur les angles donc ${tQuel.getNom()} est un triangle ${texteEnCouleurEtGras('quelconque')}.`
        }
        break

      case 2:
        {
          // quelconque par angles
          while (!tQuel.isTrueTriangleAngles()) {
            a1 = randint(angleMin, angleMax)
            a2 = randint(angleMin, angleMax, a1)
            a3 = randint(angleMin, angleMax, [a1, a2])
            tQuel.a1 = a1
            tQuel.a2 = a2
            tQuel.a3 = a3
          }
          nomTriangle = tQuel.getNom()
          A.nom = nomTriangle[1]
          B = pointAdistance(A, 10, randint(0, 360), nomTriangle[2])
          const d1 = rotation(
            droite(A, B),
            A,
            (tQuel.a1 * randint(90, 110)) / 100,
          )
          const d2 = rotation(
            droite(B, A),
            B,
            (-tQuel.a2 * randint(90, 110)) / 100,
          )
          C = pointIntersectionDD(d1, d2)
          C.nom = nomTriangle[3]
          figureMainLevee.push(
            ...polygoneAvecNom(A, B, C),
            afficheMesureAngle(
              C,
              A,
              B,
              'black',
              1,
              texNombre(tQuel.a1, 0) + '^\\circ',
            ),
            afficheMesureAngle(
              A,
              B,
              C,
              'black',
              1,
              texNombre(tQuel.a2, 0) + '^\\circ',
            ),
            afficheMesureAngle(
              B,
              C,
              A,
              'black',
              1,
              texNombre(tQuel.a3, 0) + '^\\circ',
            ),
          )

          texte = `${tQuel.getNom()} est un triangle tel que ${tQuel.getAngles()[0]} $= ${tQuel.a1}^\\circ$ ; `
          texte += ` ${tQuel.getAngles()[1]} $= ${tQuel.a2}^\\circ$ et  ${tQuel.getAngles()[2]} $= ${tQuel.a3}^\\circ$ .`
          texteCorr = `Les 3 angles du triangle ${tQuel.getNom()} sont différents donc ${tQuel.getNom()} est un triangle ${texteEnCouleurEtGras('quelconque')}.`
        }
        break

      case 3:
        {
          // isocèle sans conversion (par longueurs)
          while (!tIso.isTrueTriangleLongueurs()) {
            l1 = randint(longueurMin, longueurMax)
            l2 = randint(longueurMin, longueurMax, l1)
            setLongs(tIso, l1 + pd1, l2 + pd2, l1 + pd1)
          }
          nomTriangle = tIso.getNom()
          A.nom = nomTriangle[1]
          C = pointAdistance(
            A,
            l2,
            l1 > l2 ? randint(0, 20) : randint(45, 70),
            nomTriangle[3],
          )
          const d = mediatrice(A, C) as Droite
          const c = cercle(A, l1)
          B = pointIntersectionLC(d, c, '', 1)
          B.nom = nomTriangle[2]
          figureMainLevee.push(
            ...polygoneAvecNom(A, B, C),
            placeLatexSurSegment(`${texNombre(l1)}\\text{ cm}`, A, B, {
              letterSize: 'normalsize',
            }),
            placeLatexSurSegment(`${texNombre(l2)}\\text{ cm}`, C, A, {
              letterSize: 'normalsize',
            }),
            placeLatexSurSegment(`${texNombre(l1)}\\text{ cm}`, B, C, {
              letterSize: 'normalsize',
            }),
          )

          texte = `${tIso.getNom()} est un triangle tel que ${tIso.getLongueurs()[0]} $= ${texNombre(tIso.l1)}\\text{ cm}$ ; `
          texte += `${tIso.getLongueurs()[1]} $= ${texNombre(tIso.l2)}\\text{ cm}$ et ${tIso.getLongueurs()[2]} $= ${texNombre(tIso.l3)}\\text{ cm}$.`
          texteCorr = `Les longueurs des côtés ${tIso.getCotes()[0]} et ${tIso.getCotes()[1]} du triangle ${tIso.getNom()} valent toutes les deux $${texNombre(tIso.l1)}\\text{ cm}$ donc ${tIso.getNom()} est un triangle ${texteEnCouleurEtGras('isocèle')} en ${tIso.getSommets()[1]}.`
        }
        break

      case 4:
        {
          // isocèle avec conversion
          while (!tIso.isTrueTriangleLongueurs()) {
            l1 = randint(longueurMin, longueurMax)
            l2 = randint(longueurMin, longueurMax, l1)
            setLongs(tIso, l1 + pd1, l1 + pd1, l2 + pd2)
          }
          nomTriangle = tIso.getNom()
          A.nom = nomTriangle[1]
          C = pointAdistance(
            A,
            l2,
            l1 > l2 ? randint(0, 20) : randint(45, 70),
            nomTriangle[3],
          )
          const dIso = mediatrice(A, C) as Droite
          const cIso = cercle(A, l1)
          B = pointIntersectionLC(dIso, cIso, '', 1)
          B.nom = nomTriangle[2]
          figureMainLevee.push(
            ...polygoneAvecNom(A, B, C),
            placeLatexSurSegment(
              `${texNombre(tIso.l1 * 10)}\\text{ mm}`,
              A,
              B,
              {
                letterSize: 'normalsize',
              },
            ),
            placeLatexSurSegment(`${texNombre(tIso.l3)}\\text{ cm}`, C, A, {
              letterSize: 'normalsize',
            }),
            placeLatexSurSegment(`${texNombre(tIso.l2)}\\text{ cm}`, B, C, {
              letterSize: 'normalsize',
            }),
          )
          texte = `${tIso.getNom()} est un triangle tel que ${tIso.getLongueurs()[0]} $= ${tIso.l1 * 10}\\text{ mm}$ ; `
          texte += `${tIso.getLongueurs()[1]} $= ${texNombre(tIso.l2)}\\text{ cm}$ et ${tIso.getLongueurs()[2]} $= ${texNombre(tIso.l3)}\\text{ cm}$.`
          texteCorr = `${tIso.getLongueurs()[0]} $= ${texNombre(tIso.l1 * 10)}\\text{ mm}$ $= ${texNombre(tIso.l1)}\\text{ cm}$ = ${tIso.getLongueurs()[1]}, ${tIso.getNom()} a donc deux côtés égaux, c'est un triangle ${texteEnCouleurEtGras('isocèle')} en ${tIso.getSommets()[1]}.`
        }
        break

      case 5:
        {
          // équilatéral sans conversion
          while (!tEqui.isTrueTriangleLongueurs()) {
            l1 = randint(longueurMin, longueurMax)
            setLongs(tEqui, l1 + pd1, l1 + pd1, l1 + pd1)
          }
          nomTriangle = tEqui.getNom()
          A.nom = nomTriangle[1]
          B = pointAdistance(A, tEqui.l1, randint(0, 360), nomTriangle[2])
          const dEqui = mediatrice(A, B) as Droite
          const cEqui = cercle(A, tEqui.l1)
          C = pointIntersectionLC(dEqui, cEqui, '', 1)
          C.nom = nomTriangle[3]
          figureMainLevee.push(
            ...polygoneAvecNom(A, B, C),
            placeLatexSurSegment(`${texNombre(tEqui.l1)}\\text{ cm}`, A, B, {
              letterSize: 'normalsize',
            }),
            placeLatexSurSegment(`${texNombre(tEqui.l2)}\\text{ cm}`, C, A, {
              letterSize: 'normalsize',
            }),
            placeLatexSurSegment(`${texNombre(tEqui.l3)}\\text{ cm}`, B, C, {
              letterSize: 'normalsize',
            }),
          )
          texte = `${tEqui.getNom()} est un triangle tel que ${tEqui.getLongueurs()[0]} $= ${texNombre(tEqui.l1)}\\text{ cm}$ ; `
          texte += `${tEqui.getLongueurs()[1]} $= ${texNombre(tEqui.l2)}\\text{ cm}$ et ${tEqui.getLongueurs()[2]} $= ${texNombre(tEqui.l3)}\\text{ cm}$.`
          texteCorr = `Les longueurs des trois côtés du triangle ${tEqui.getNom()} sont égales donc c'est un triangle ${texteEnCouleurEtGras('équilatéral')}.`
        }
        break

      case 6:
        {
          // équilatéral avec conversions
          while (!tEqui.isTrueTriangleLongueurs()) {
            l1 = randint(longueurMin, longueurMax)
            setLongs(tEqui, l1 + pd1, l1 + pd1, l1 + pd1)
          }
          nomTriangle = tEqui.getNom()
          A.nom = nomTriangle[1]
          B = pointAdistance(A, tEqui.l1, randint(0, 360), nomTriangle[2])
          const dEqui = mediatrice(A, B) as Droite
          const cEqui = cercle(A, tEqui.l1)
          C = pointIntersectionLC(dEqui, cEqui, '', 1)
          C.nom = nomTriangle[3]
          figureMainLevee.push(
            ...polygoneAvecNom(A, B, C),
            placeLatexSurSegment(
              `${texNombre(tEqui.l1 * 10)}\\text{ mm}`,
              B,
              C,
              {
                letterSize: 'normalsize',
              },
            ),
            placeLatexSurSegment(`${texNombre(tEqui.l2)}\\text{ cm}`, A, B, {
              letterSize: 'normalsize',
            }),
            placeLatexSurSegment(
              `${texNombre(tEqui.l3 / 10)}\\text{ dm}`,

              C,
              A,
              {
                letterSize: 'normalsize',
              },
            ),
          )

          texte = `${nomTriangle} est un triangle tel que ${tEqui.getLongueurs()[0]} $= ${texNombre(tEqui.l1)}\\text{ cm}$ ; `
          texte += `${tEqui.getLongueurs()[1]} $= ${texNombre(tEqui.l2 * 10)}\\text{ mm}$ et ${tEqui.getLongueurs()[2]} $= ${texNombre(tEqui.l3 / 10)}\\text{ dm}$.`
          texteCorr = `${tEqui.getLongueurs()[1]} $= ${texNombre(tEqui.l2 * 10)}\\text{ mm}$ $= ${tEqui.l2}\\text{ cm}$.`
          texteCorr += `<br> ${tEqui.getLongueurs()[2]} $= ${texNombre(tEqui.l3 / 10)}\\text{ dm}= ${texNombre(tEqui.l3)}\\text{ cm}$.`
          texteCorr += `<br> ${tEqui.getLongueurs()[0]} $= ${texNombre(tEqui.l1)}\\text{ cm}$.`
          texteCorr += `<br> Les longueurs des trois côtés du triangle ${nomTriangle} sont égales donc c'est un triangle ${texteEnCouleurEtGras('équilatéral')}.`
        }
        break

      case 7:
        // rectangle (sans conversion)
        l1 = randint(longueurMin, longueurMax)
        tRect.l1 = l1 + pd1
        tRect.l2 = randint(longueurMin, longueurMax, l1) + pd2
        tRect.a1 = 90
        nomTriangle = tRect.getNom()
        A.nom = nomTriangle[1]
        B = pointAdistance(A, tRect.l1, randint(0, 10), nomTriangle[2])
        C = similitude(A, B, 90, tRect.l2 / tRect.l1, nomTriangle[3])
        figureMainLevee.push(
          ...polygoneAvecNom(A, B, C),
          placeLatexSurSegment(`${texNombre(tRect.l1)}\\text{ cm}`, A, B, {
            letterSize: 'normalsize',
          }),
          placeLatexSurSegment(`${texNombre(tRect.l2)}\\text{ cm}`, B, C, {
            letterSize: 'normalsize',
          }),
          codageAngleDroit(A, B, C, 'black', 2),
        )

        texte = `${nomTriangle} est un triangle tel que ${tRect.getLongueurs()[0]} $= ${texNombre(tRect.l1)}\\text{ cm}$ ; `
        texte += `${tRect.getLongueurs()[1]} $= ${texNombre(tRect.l2)}\\text{ cm}$ `
        texte += 'et '
        if (this.classe === 6) {
          texte += ` qui a un angle droit en ${tRect.getSommets()[1]}.`
          texteCorr = `Le triangle ${nomTriangle} a un angle droit en ${tRect.getSommets()[1]} donc ${nomTriangle} est ${texteEnCouleurEtGras('rectangle')} en ${tRect.getSommets()[1]}.`
        } else {
          texte += `${tRect.getAngles()[0]} $= ${tRect.a1}^\\circ$.`
          texteCorr = `L'angle ${tRect.getAngles()[0]} du triangle ${nomTriangle} est un angle droit donc ${nomTriangle} est ${texteEnCouleurEtGras('rectangle')} en ${tRect.getSommets()[1]}.`
        }
        break

      case 8:
        // isocèle rectangle (sans conversion)
        l1 = randint(longueurMin, longueurMax)
        tIsoRect.l1 = l1 + pd1
        tIsoRect.l2 = tIsoRect.l1
        tIsoRect.a1 = 90
        nomTriangle = tIsoRect.getNom()
        A.nom = nomTriangle[1]
        B = pointAdistance(A, tIsoRect.l1, randint(0, 10), nomTriangle[2])
        C = rotation(A, B, 90, nomTriangle[3])
        figureMainLevee.push(
          ...polygoneAvecNom(A, B, C),
          placeLatexSurSegment(`${texNombre(tIsoRect.l1)}\\text{ cm}`, A, B, {
            letterSize: 'normalsize',
          }),
          placeLatexSurSegment(`${texNombre(tIsoRect.l2)}\\text{ cm}`, B, C, {
            letterSize: 'normalsize',
          }),
          codageAngleDroit(A, B, C, 'black', 2),
        )

        texte = `${nomTriangle} est un triangle tel que ${tIsoRect.getLongueurs()[0]}$= ${texNombre(tIsoRect.l1)}\\text{ cm}$ ; `
        texte += `${tIsoRect.getLongueurs()[1]} $= ${texNombre(tIsoRect.l2)}\\text{ cm}$ `
        texte += 'et '
        if (this.classe === 6) {
          texte += `qui a un angle droit en ${tIsoRect.getSommets()[1]}.`
          texteCorr = `Le triangle ${nomTriangle} a un angle droit en ${tIsoRect.getSommets()[1]} donc ${nomTriangle} est rectangle en ${tIsoRect.getSommets()[1]}.`
          texteCorr += `<br> ${tIsoRect.getLongueurs()[0]} $=$ ${tIsoRect.getLongueurs()[1]} $= ${texNombre(tIsoRect.l1)}\\text{ cm}$ donc ${nomTriangle} est isocèle en ${tIsoRect.getSommets()[1]}.`
          texteCorr += `<br> Le triangle ${nomTriangle} est donc ${texteEnCouleurEtGras('isocèle')} et ${texteEnCouleurEtGras('rectangle')} en ${tIsoRect.getSommets()[1]}.`
        } else {
          texte += `${tIsoRect.getAngles()[0]} $= ${tIsoRect.a1}^\\circ$.`
          texteCorr = `L'angle ${tIsoRect.getAngles()[0]} du triangle ${nomTriangle} est un angle droit donc ${nomTriangle} est rectangle en ${tIsoRect.getSommets()[1]}.`
          texteCorr += `<br> ${tIsoRect.getLongueurs()[0]} $=$ ${tIsoRect.getLongueurs()[1]} $= ${tIsoRect.l1}\\text{ cm}$ donc ${nomTriangle} est isocèle en ${tIsoRect.getSommets()[1]}.`
          texteCorr += `<br> Le triangle ${nomTriangle} est donc ${texteEnCouleurEtGras('isocèle')} et ${texteEnCouleurEtGras('rectangle')} en ${tIsoRect.getSommets()[1]}.`
        }
        break

      case 9: // isocèle rectangle avec conversion
        l1 = randint(longueurMin, longueurMax) + pd1
        tIsoRect.l1 = l1
        tIsoRect.l2 = tIsoRect.l1
        tIsoRect.a1 = 90
        nomTriangle = tIsoRect.getNom()
        A.nom = nomTriangle[1]
        B = pointAdistance(A, tIsoRect.l1, randint(0, 10), nomTriangle[2])
        C = rotation(A, B, 90, nomTriangle[3])
        figureMainLevee.push(
          ...polygoneAvecNom(A, B, C),
          placeLatexSurSegment(
            `${texNombre(tIsoRect.l1 * 10)}\\text{ mm}`,
            A,
            B,
            {
              letterSize: 'normalsize',
            },
          ),
          placeLatexSurSegment(`${texNombre(tIsoRect.l2)}\\text{ cm}`, B, C, {
            letterSize: 'normalsize',
          }),
          codageAngleDroit(A, B, C, 'black', 2),
        )
        texte = `${nomTriangle} est un triangle tel que ${tIsoRect.getLongueurs()[0]} $= ${texNombre(tIsoRect.l1 * 10)}\\text{ mm}$ ; `
        texte += `${tIsoRect.getLongueurs()[1]} $= ${texNombre(tIsoRect.l2)}\\text{ cm}$`
        texte += ' et '
        if (this.classe === 6) {
          texte += `qui a un angle droit en ${tIsoRect.getSommets()[1]}.`
          texteCorr = `Le triangle ${nomTriangle} a un angle droit en ${tIsoRect.getSommets()[1]} donc ${nomTriangle} est rectangle en ${tIsoRect.getSommets()[1]}.`
          texteCorr += `<br> ${tIsoRect.getLongueurs()[0]} $= ${tIsoRect.l1 * 10}\\text{ mm}$ $= ${texNombre(tIsoRect.l1)}\\text{ cm}$ =${tIsoRect.getLongueurs()[1]} donc ${nomTriangle} est isocèle en ${tIsoRect.getSommets()[1]}.`
          texteCorr += `<br> Le triangle ${nomTriangle} est donc ${texteEnCouleurEtGras('isocèle')} et ${texteEnCouleurEtGras('rectangle')} en ${tIsoRect.getSommets()[1]}.`
        } else {
          texte += `${tIsoRect.getAngles()[0]} $= ${tIsoRect.a1}^\\circ$.`
          texteCorr = `L'angle ${tIsoRect.getAngles()[0]} du triangle ${nomTriangle} est un angle droit donc ${nomTriangle} est rectangle en ${tIsoRect.getSommets()[1]}.`
          texteCorr += `<br> ${tIsoRect.getLongueurs()[0]} $= ${texNombre(tIsoRect.l1 * 10)}\\text{ mm}$ $= ${texNombre(tIsoRect.l1)}\\text{ cm}$ =${tIsoRect.getLongueurs()[1]} donc ${nomTriangle} est isocèle en ${tIsoRect.getSommets()[1]}.`
          texteCorr += `<br> Le triangle ${nomTriangle} est donc ${texteEnCouleurEtGras('isocèle')} et ${texteEnCouleurEtGras('rectangle')} en ${tIsoRect.getSommets()[1]}.`
        }
        break

      case 10:
        {
          // isocèle par les angles
          a3 = -1
          while (a3 < 0) {
            tIso.a1 = randint(angleMin, 65, 60)
            tIso.a2 = tIso.a1
            a3 = 180 - 2 * tIso.a1
            tIso.a3 = a3
          }
          nomTriangle = tIso.getNom()
          A.nom = nomTriangle[1]
          B = pointAdistance(A, 10, randint(-30, 30), nomTriangle[2])
          const dIso = rotation(droite(A, B), A, tIso.a3)
          const dIso2 = rotation(droite(A, B), B, -tIso.a1)
          C = pointIntersectionDD(dIso, dIso2)
          C.nom = nomTriangle[3]
          figureMainLevee.push(
            ...polygoneAvecNom(A, B, C),
            afficheMesureAngle(
              C,
              A,
              B,
              'black',
              1,
              texNombre(tIso.a3, 0) + '^\\circ',
            ),
            afficheMesureAngle(
              A,
              B,
              C,
              'black',
              1,
              texNombre(tIso.a2, 0) + '^\\circ',
            ),
            afficheMesureAngle(
              B,
              C,
              A,
              'black',
              1,
              texNombre(tIso.a1, 0) + '^\\circ',
            ),
          )
          texte = `${tIso.getNom()} est un triangle tel que ${tIso.getAngles()[0]} $= ${tIso.a1}^\\circ$ ; `
          texte += ` ${tIso.getAngles()[1]} $= ${tIso.a2}^\\circ$ et  ${tIso.getAngles()[2]} $= ${tIso.a3}^\\circ$ .`
          texteCorr = `Le triangle ${tIso.getNom()} a deux angles égaux, ${tIso.getAngles()[0]} = ${tIso.getAngles()[1]} $= ${tIso.a1}^\\circ$ donc ${tIso.getNom()} est un triangle ${texteEnCouleurEtGras('isocèle')} en ${tIso.getSommets()[0]}.`
        }
        break

      case 11: // équilatéral par les angles
      default:
        {
          tEqui.a1 = 60
          tEqui.a2 = 60
          tEqui.a3 = 60
          nomTriangle = tEqui.getNom()
          A.nom = nomTriangle[1]
          B = pointAdistance(A, 10, randint(0, 360), nomTriangle[2])
          const dEqui = rotation(droite(A, B), A, 60 + randint(-3, 3, 0))
          const dEqui2 = rotation(droite(A, B), B, -60 + randint(-3, 3, 0))
          C = pointIntersectionDD(dEqui, dEqui2)
          C.nom = nomTriangle[3]
          figureMainLevee.push(
            ...polygoneAvecNom(A, B, C),
            afficheMesureAngle(
              C,
              A,
              B,
              'black',
              1,
              texNombre(tEqui.a3, 0) + '^\\circ',
            ),
            afficheMesureAngle(
              A,
              B,
              C,
              'black',
              1,
              texNombre(tEqui.a2, 0) + '^\\circ',
            ),
            afficheMesureAngle(
              B,
              C,
              A,
              'black',
              1,
              texNombre(tEqui.a1, 0) + '^\\circ',
            ),
          )
          texte = `${nomTriangle} est un triangle tel que ${tEqui.getAngles()[0]} $= ${tEqui.a1}^\\circ$ ; `
          texte += ` ${tEqui.getAngles()[1]} $= ${tEqui.a2}^\\circ$ et  ${tEqui.getAngles()[2]} $= ${tEqui.a3}^\\circ$.`
          texteCorr = `Le triangle ${nomTriangle} a trois angles égaux, ${tEqui.getAngles()[0]} = ${tEqui.getAngles()[1]} = ${tEqui.getAngles()[2]} $= ${tEqui.a1}^\\circ$ donc ${tEqui.getNom()} est un triangle ${texteEnCouleurEtGras('équilatéral')}.`
        }
        break
    }

    return { texte, texteCorr, figureMainLevee }
  }

  nouvelleVersion() {
    let texteIntro = ''
    if (this.classe === 6) {
      this.besoinFormulaireNumerique = [
        'Niveau de difficulté',
        2,
        '1 : Sans conversion de longueurs\n2 : Avec conversions de longueurs',
      ]
    }

    if (context.isHtml) {
      if (this.classe === 6) {
        texteIntro +=
          '- Un <b>triangle quelconque</b> est un triangle qui ne présente aucune relation particulière entre ses angles ou ses côtés.'
        texteIntro += '<br>'
        texteIntro +=
          '- Un <b>triangle isocèle</b> est un triangle qui a deux côtés de même longueur.'
        texteIntro += '<br>'
        texteIntro +=
          '- Un <b>triangle équilatéral</b> est un triangle qui a trois côtés de même longueur.'
        texteIntro += '<br>'
        texteIntro +=
          '- Un <b>triangle rectangle</b> est un triangle qui a un angle droit.'
      } else if (this.classe === 5) {
        texteIntro +=
          '- Un <b>triangle quelconque</b> est un triangle qui ne présente aucune relation particulière entre ses angles ou ses côtés.'
        texteIntro += '<br>'
        texteIntro +=
          '- Un <b>triangle isocèle</b> est un triangle qui a deux côtés ou deux angles de même mesure.'
        texteIntro += '<br>'
        texteIntro +=
          '- Un <b>triangle équilatéral</b> est un triangle qui a trois côtés ou trois angles de même mesure.'
        texteIntro += '<br>'
        texteIntro +=
          '- Un <b>triangle rectangle</b> est un triangle qui a un angle droit.'
      }
    } else {
      if (this.classe === 6) {
        texteIntro = texEnumerateSansNumero(
          [
            '- Un \\textbf{triangle quelconque} est un triangle qui ne présente aucune relation particulière entre ses angles ou ses côtés.',
            '- Un \\textbf{triangle isocèle} est un triangle qui a deux côtés de même longueur.',
            '- Un \\textbf{triangle équilatéral} est un triangle qui a trois côtés de même longueur.',
            '- Un \\textbf{triangle rectangle} est un triangle qui a un angle droit.',
          ],
          1,
        )
      } else if (this.classe === 5) {
        texteIntro = texEnumerateSansNumero(
          [
            '- Un \\textbf{triangle quelconque} est un triangle qui ne présente aucune relation particulière entre ses angles ou ses côtés.',
            '- Un \\textbf{triangle isocèle} est un triangle qui a deux côtés ou deux angles de même mesure.',
            '- Un \\textbf{triangle équilatéral} est un triangle qui a trois côtés ou trois angles de même mesure.',
            '- Un \\textbf{triangle rectangle} est un triangle qui a un angle droit.',
          ],
          1,
        )
      }

      this.introduction = lampeMessage({
        titre: 'Quelques définitions',
        texte: texteIntro,
        couleur: 'nombres',
      })
    }

    const listeTypeDeQuestions = combinaisonListes(
      range(10).map((x) => x + 1),
      this.nbQuestions,
    )

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const longueurMin = 6
      const longueurMax = 15
      const angleMin = 30
      const angleMax = 100

      // décimales éventuelles
      let partieDecimale1 = 0
      let partieDecimale2 = 0
      let partieDecimale3 = 0
      if (this.sup2) {
        partieDecimale1 = (randint(1, 9) / 10) * randint(0, 1)
        partieDecimale2 = (randint(1, 9) / 10) * randint(0, 1)
        partieDecimale3 = (randint(1, 9) / 10) * randint(0, 1)
      }

      const {
        texte: t,
        texteCorr: c,
        figureMainLevee: fig,
      } = this.makeTexAndCorrForType(
        listeTypeDeQuestions[i],
        longueurMin,
        longueurMax,
        angleMin,
        angleMax,
        [partieDecimale1, partieDecimale2, partieDecimale3],
      )

      if (this.questionJamaisPosee(i, c)) {
        this.listeQuestions[i] = this.sup
          ? mathalea2d(
              Object.assign(
                { mainlevee: true, amplitude: 1 },
                fixeBordures(fig),
              ),
              fig,
            )
          : t

        this.listeCorrections[i] = c
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
