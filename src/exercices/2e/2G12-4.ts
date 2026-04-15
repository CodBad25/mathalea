import { point } from '../../lib/2d/PointAbstrait'
import {
  NommePolygone,
  Polygone,
  polygoneAvecNom,
} from '../../lib/2d/polygones'
import { repere } from '../../lib/2d/reperes'
import { Segment, segment } from '../../lib/2d/segmentsVecteurs'
import { texteParPosition } from '../../lib/2d/textes'
import type { TracePoint } from '../../lib/2d/TracePoint'
import { tracePoint } from '../../lib/2d/TracePoint'
import { texteGras } from '../../lib/format/style'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { extraireRacineCarree } from '../../lib/outils/calculs'
import { ecritureParentheseSiNegatif } from '../../lib/outils/ecritures'
import { creerNomDePolygone } from '../../lib/outils/outilString'
import { texNombre, texRacineCarree } from '../../lib/outils/texNombre'
import { mathalea2d } from '../../modules/mathalea2d'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import type { NestedObjetMathalea2dArray } from '../../types/2d'
import Exercice from '../Exercice'
import { bleuMathalea } from '../../lib/colors'
export const titre = "Déterminer la nature d'un polygone avec les coordonnées"
export const dateDeModifImportante = '30/11/2023'
/**
 * 2G12
 * @author Stéphane Guyon + Gilles Mora
 */
export const uuid = 'd633a'

export const refs = {
  'fr-fr': ['2G12-4'],
  'fr-ch': ['11GM1-7'],
}
export default class NaturePolygone extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireNumerique = [
      'Situations',
      3,
      '1 : Triangles \n2 : Quadrilatères\n3 : Mélange ',
    ]

    this.nbQuestions = 1

    this.sup = 3
  }

  nouvelleVersion() {
    let XMIN, XMAX, YMIN, YMAX

    let typesDeQuestionsDisponibles = [1, 2, 3, 4, 5]
    if (this.sup === 1) {
      typesDeQuestionsDisponibles = [1, 2]
    } else if (this.sup === 2) {
      typesDeQuestionsDisponibles = [3, 4, 5]
    } else {
      typesDeQuestionsDisponibles = [1, 2, 3, 4, 5]
    }

    const listeTypeDeQuestions = combinaisonListes(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    )
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const objets: NestedObjetMathalea2dArray = []
      const typesDeQuestions = listeTypeDeQuestions[i]
      let xA: number,
        yA: number,
        ux: number,
        uy: number,
        xB: number,
        yB: number,
        xC: number,
        yC: number,
        xD: number,
        yD: number,
        nom: string
      switch (typesDeQuestions) {
        case 1: // Triangle
          xA = randint(0, 6) * choice([-1, 1])
          yA = randint(0, 6) * choice([-1, 1])
          ux = randint(1, 5) * choice([-1, 1])
          uy = randint(1, 5) * choice([-1, 1])
          while (ux === uy || ux === -uy) {
            // ajout d'une condition pour éviter des points alignés (Jean-claude Lhote)
            uy = randint(1, 5) * choice([-1, 1])
          } // empêcher ux=uy pour éviter B=C
          xB = xA + ux
          yB = yA + uy
          xC = xA + uy
          yC = yA + ux
          xD = 0 // pour ne pas bloquer le recadrage du repère
          yD = 0
          nom = creerNomDePolygone(3, ['OIJ'])
          break
        case 2:
          xA = randint(0, 5) * choice([-1, 1])
          yA = randint(0, 5) * choice([-1, 1])
          ux = randint(1, 5) * choice([-1, 1])
          uy = randint(1, 5) * choice([-1, 1])
          xB = xA + ux
          yB = yA + uy
          xC = xA - uy
          yC = yA + ux
          xD = 0 // pour ne pas bloquer le recadrage du repère
          yD = 0
          nom = creerNomDePolygone(3, ['OIJ'])
          break
        case 3:
          xA = randint(0, 5) * choice([-1, 1])
          yA = randint(0, 5) * choice([-1, 1])
          ux = randint(1, 5)
          uy = randint(1, 5, ux) * choice([-1, 1])
          ux *= choice([-1, 1])
          xB = xA + ux
          yB = yA + uy
          xC = xB - uy
          yC = yB - ux
          xD = xC - ux
          yD = yC - uy
          nom = creerNomDePolygone(4, ['OIJMK'])
          break
        case 4:
          xA = randint(0, 5) * choice([-1, 1])
          yA = randint(0, 5) * choice([-1, 1])
          ux = randint(1, 5) * choice([-1, 1])
          uy = randint(1, 5) * choice([-1, 1])
          xB = xA + ux * 2
          yB = yA + uy * 2
          xC = xA - uy
          yC = yA + ux
          xD = xC + ux * 2
          yD = yC + uy * 2
          nom = creerNomDePolygone(4, ['OIJMK'])
          break
        case 5:
        default:
          xA = randint(0, 5) * choice([-1, 1])
          yA = randint(0, 5) * choice([-1, 1])
          ux = randint(1, 5) * choice([-1, 1])
          uy = randint(1, 5) * choice([-1, 1])
          xB = xA + ux
          yB = yA + uy
          xC = xA - uy
          yC = yA + ux
          xD = xC + ux
          yD = yC + uy
          nom = creerNomDePolygone(4, ['OIJMK'])
          break
      }
      const xAbCarre = (xB - xA) * (xB - xA)
      const yAbCarre = (yB - yA) * (yB - yA)
      const abCarre = xAbCarre + yAbCarre
      const xAcCarre = (xC - xA) * (xC - xA)
      const yAcCarre = (yC - yA) * (yC - yA)
      const xBcCarre = (xC - xB) * (xC - xB)
      const yBcCarre = (yC - yB) * (yC - yB)
      const xAdCarre = (xD - xA) * (xD - xA)
      const yAdCarre = (yD - yA) * (yD - yA)
      const acCarre = xAcCarre + yAcCarre
      const bcCarre = xBcCarre + yBcCarre
      const A = point(xA, yA, 'A')
      const B = point(xB, yB, 'B')
      const C = point(xC, yC, 'C')
      const D = point(xD, yD, 'D')
      A.nom = nom[0]
      B.nom = nom[1]
      C.nom = nom[2]
      D.nom = nom[3]
      XMIN = Math.min(xA, xB, xC, xD, -1) - 1
      YMIN = Math.min(yA, yB, yC, yD, -1) - 1
      XMAX = Math.max(xA, xB, xC, xD, 1) + 1
      YMAX = Math.max(yA, yB, yC, yD, 1) + 1
      const I = texteParPosition('I', 1, -0.5, 0, 'black', 1)
      const J = texteParPosition('J', -0.5, 1, 0, 'black', 1)
      const o = texteParPosition('O', -0.3, -0.3, 0, 'black', 1)
      let s1: Segment,
        s2: Segment,
        s3: Segment,
        s4: Segment,
        T: TracePoint,
        P: [Polygone, NommePolygone]
      let texte = ''
      let texteCorr = ''
      switch (typesDeQuestions) {
        case 1: // Triangle isocèle ou équilatéral
          s1 = segment(A, B, bleuMathalea)
          s2 = segment(A, C, bleuMathalea)
          s3 = segment(B, C, bleuMathalea)
          s1.epaisseur = 2
          s2.epaisseur = 2
          s3.epaisseur = 2
          T = tracePoint(A, B, C) // Repère les points avec une croix
          P = polygoneAvecNom(A, B, C)
          objets.push(P[1])
          objets.push(
            repere({
              xMin: XMIN,
              yMin: YMIN,
              xMax: XMAX,
              yMax: YMAX,
              yLabelEcart: 0.6,
              xLabelEcart: 0.6,
              yLabelDistance: 2,
              xLabelDistance: 2,
            }),
            I,
            J,
            o,
            T,
            s1,
            s2,
            s3,
          )
          texte =
            'Dans un repère orthonormé $(O, I, J)$, on donne les points suivants :'
          texte += ` $${A.nom}\\left(${xA}\\,;\\,${yA}\\right)$ ; $${B.nom}\\left(${xB}\\,;\\,${yB}\\right)$ et $${C.nom}\\left(${xC}\\,;\\,${yC}\\right)$.`
          texte += `<br>Déterminer la nature du triangle $${A.nom}${B.nom}${C.nom}$.`
          texteCorr =
            'On commence par réaliser un graphique permettant de visualiser la situation.<br>'
          texteCorr +=
            '<br>' +
            mathalea2d(
              { xmin: XMIN, ymin: YMIN, xmax: XMAX, ymax: YMAX },
              objets,
            )
          texteCorr += `<br> On calcule séparément les distances $${A.nom}${B.nom}$, $${A.nom}${C.nom}$ et $${B.nom}${C.nom}$.<br><br>`
          texteCorr += `$\\bullet$  $${A.nom}${B.nom}=\\sqrt{\\left(${xB}-${ecritureParentheseSiNegatif(xA)}\\right)^{2}+\\left(${yB}-${ecritureParentheseSiNegatif(yA)}\\right)^{2}}=\\sqrt{${xAbCarre}+${yAbCarre}}
          =\\sqrt{${texNombre(xAbCarre + yAbCarre)}}${extraireRacineCarree(abCarre)[0] === 1 ? '' : `=${texRacineCarree(abCarre)}`}$<br>`
          texteCorr += `$\\bullet$  $${A.nom}${C.nom}=\\sqrt{\\left(${xC}-${ecritureParentheseSiNegatif(xA)}\\right)^{2}+\\left(${yC}-${ecritureParentheseSiNegatif(yA)}\\right)^{2}}=\\sqrt{${xAcCarre}+${yAcCarre}}
          =\\sqrt{${texNombre(xAcCarre + yAcCarre)}}${extraireRacineCarree(acCarre)[0] === 1 ? '' : `=${texRacineCarree(acCarre)}`}$<br>`
          texteCorr += `$\\bullet$  $${B.nom}${C.nom}=\\sqrt{\\left(${xC}-${ecritureParentheseSiNegatif(xB)}\\right)^{2}+\\left(${yC}-${ecritureParentheseSiNegatif(yB)}\\right)^{2}}=\\sqrt{${xBcCarre}+${yBcCarre}}
          =\\sqrt{${texNombre(xBcCarre + yBcCarre)}}${extraireRacineCarree(bcCarre)[0] === 1 ? '' : `=${texRacineCarree(bcCarre)}`}$<br>`
          if (xBcCarre + yBcCarre === xAbCarre + yAbCarre) {
            texteCorr += `<br>On observe que $${A.nom}${B.nom}=${A.nom}${C.nom}=${B.nom}${C.nom}$ donc le triangle $${A.nom}${B.nom}${C.nom}$ est équilatéral.`
          } else {
            texteCorr += `<br>On observe que $${A.nom}${B.nom}=${A.nom}${C.nom}$ et que $${B.nom}${C.nom} \\ne ${A.nom}${B.nom}$ donc le triangle $${A.nom}${B.nom}${C.nom}$ est isocèle (il n'est pas équilatéral).`
          }
          break
        case 2: // ABC isocèle triangle rectangle
          s1 = segment(A, B, bleuMathalea)
          s2 = segment(A, C, bleuMathalea)
          s3 = segment(B, C, bleuMathalea)
          s1.epaisseur = 2
          s2.epaisseur = 2
          s3.epaisseur = 2
          T = tracePoint(A, B, C) // Repère les points avec une croix
          P = polygoneAvecNom(A, B, C)
          objets.push(P[1])
          objets.push(
            repere({
              xMin: XMIN,
              yMin: YMIN,
              xMax: XMAX,
              yMax: YMAX,
              yLabelEcart: 0.6,
              xLabelEcart: 0.6,
              yLabelDistance: 2,
              xLabelDistance: 2,
            }),
            I,
            J,
            o,
            T,
            s1,
            s2,
            s3,
          )
          texte =
            'Dans un repère orthonormé $(O, I, J)$, on donne les points suivants :'
          texte += ` $${A.nom}\\left(${xA}\\,;\\,${yA}\\right)$ ; $${B.nom}\\left(${xB}\\,;\\,${yB}\\right)$ et $${C.nom}\\left(${xC}\\,;\\,${yC}\\right)$.`
          texte += `<br>Déterminer la nature du triangle $${A.nom}${B.nom}${C.nom}$.`

          texteCorr =
            'On peut réaliser un graphique permettant de visualiser la situation.<br>'
          texteCorr +=
            '<br>' +
            mathalea2d(
              { xmin: XMIN, ymin: YMIN, xmax: XMAX, ymax: YMAX },
              objets,
            )
          texteCorr += `<br> On calcule séparément les distances $${A.nom}${B.nom}$, $${A.nom}${C.nom}$ et $${B.nom}${C.nom}$.<br><br>`
          texteCorr += `$\\bullet$  $${A.nom}${B.nom}=\\sqrt{\\left(${xB}-${ecritureParentheseSiNegatif(xA)}\\right)^{2}+\\left(${yB}-${ecritureParentheseSiNegatif(yA)}\\right)^{2}}=\\sqrt{${xAbCarre}+${yAbCarre}}
          =\\sqrt{${texNombre(xAbCarre + yAbCarre)}}$<br>`
          texteCorr += `$\\bullet$  $${A.nom}${C.nom}=\\sqrt{\\left(${xC}-${ecritureParentheseSiNegatif(xA)}\\right)^{2}+\\left(${yC}-${ecritureParentheseSiNegatif(yA)}\\right)^{2}}=\\sqrt{${xAcCarre}+${yAcCarre}}
          =\\sqrt{${texNombre(xAcCarre + yAcCarre)}}$<br>`
          texteCorr += `$\\bullet$  $${B.nom}${C.nom}=\\sqrt{\\left(${xC}-${ecritureParentheseSiNegatif(xB)}\\right)^{2}+\\left(${yC}-${ecritureParentheseSiNegatif(yB)}\\right)^{2}}=\\sqrt{${xBcCarre}+${yBcCarre}}
          =\\sqrt{${texNombre(xBcCarre + yBcCarre)}}$<br>`
          texteCorr += `<br>D'une part : $${B.nom}${C.nom}^{2} = ${texNombre(xBcCarre + yBcCarre)}$<br>`
          texteCorr += `D'autre part : $${A.nom}${B.nom}^{2}+${A.nom}${C.nom}^{2}=${texNombre(xAcCarre + yAcCarre)}+${texNombre(xAbCarre + yAbCarre)}=${texNombre(xBcCarre + yBcCarre)}$`
          texteCorr += `<br><br>On en déduit que $${B.nom}${C.nom}^{2}=${A.nom}${C.nom}^{2}+${A.nom}${B.nom}^{2}$.`
          texteCorr += `<br><br>D'après la réciproque du théorème de Pythagore,  le triangle $${A.nom}${B.nom}${C.nom}$ est rectangle en $${A.nom}$.`
          if (xAbCarre + yAbCarre === xAcCarre + yAcCarre) {
            texteCorr += `<br>On observe en plus que $${A.nom}${B.nom}=${A.nom}${C.nom}$. <br> Le triangle $${A.nom}${B.nom}${C.nom}$ est donc isocèle rectangle en $${A.nom}$.`
          }
          break
        case 3: // Dq ABCD losange
          T = tracePoint(A, B, C, D) // Repère les points avec une croix
          P = polygoneAvecNom(A, B, C, D)
          objets.push(P[1])
          s4 = segment(D, A, bleuMathalea)
          s1 = segment(A, B, bleuMathalea)
          s2 = segment(B, C, bleuMathalea)
          s3 = segment(D, C, bleuMathalea)
          s4 = segment(D, A, bleuMathalea)
          s1.epaisseur = 2
          s2.epaisseur = 2
          s3.epaisseur = 2
          s4.epaisseur = 2
          objets.push(
            repere({
              xMin: XMIN,
              yMin: YMIN,
              xMax: XMAX,
              yMax: YMAX,
              yLabelEcart: 0.6,
              xLabelEcart: 0.6,
              yLabelDistance: 2,
              xLabelDistance: 2,
            }),
            I,
            J,
            o,
            T,
            s1,
            s2,
            s3,
            s4,
          )
          texte =
            'Dans un repère orthonormé $(O, I, J)$, on donne les points suivants :'
          texte += ` $${A.nom}\\left(${xA}\\,;\\,${yA}\\right)$ ; $${B.nom}\\left(${xB}\\,;\\,${yB}\\right)$, $${C.nom}\\left(${xC}\\,;\\,${yC}\\right)$  et $${D.nom}\\left(${xD}\\,;\\,${yD}\\right)$.`
          texte += `<br>Démontrer que $${A.nom}${B.nom}${C.nom}${D.nom}$ est un losange.`
          texteCorr =
            'On peut réaliser un graphique permettant de visualiser la situation.<br>'
          texteCorr +=
            '<br>' +
            mathalea2d(
              { xmin: XMIN, ymin: YMIN, xmax: XMAX, ymax: YMAX },
              objets,
            )
          texteCorr += `<br>Il y a plusieurs méthodes  pour prouver  que le quadrilatère $${A.nom}${B.nom}${C.nom}${D.nom}$ est un losange.<br>
          Dans ce qui suit, nous démontrons que $${A.nom}${B.nom}${C.nom}${D.nom}$ est un parallélogramme avec deux côtés consécutifs de même longueur.<br>`
          texteCorr += `<br>On commence par prouver  que $${A.nom}${B.nom}${C.nom}${D.nom}$ est un parallélogramme.<br>`
          texteCorr += `<br>On sait que $${A.nom}${B.nom}${C.nom}${D.nom}$ est un parallélogramme si et seulement si ses diagonales se coupent en leur milieu.`
          texteCorr += `<br><br>$\\bullet$ On note $M$ le milieu de $[${A.nom}${C.nom}]$ :<br>
         $\\begin{cases}x_M=\\dfrac{${xA}+${ecritureParentheseSiNegatif(xC)}}{2}=\\dfrac{${texNombre(xA + xC)}}{2}=${texNombre((xA + xC) / 2, 1)} \\\\[0.8em] y_M=\\dfrac{${yA}+${ecritureParentheseSiNegatif(yC)}}{2}=\\dfrac{${texNombre(yA + yC)}}{2}=${texNombre((yA + yC) / 2, 1)}\\end{cases}$`
          texteCorr += `<br><br>On en déduit :  $M(${texNombre((xA + xC) / 2, 1)}\\,;\\,${texNombre((yA + yC) / 2, 1)})$.`
          texteCorr += `<br><br>$\\bullet$ On note $K$ le milieu de $[${B.nom}${D.nom}]$ :<br>
         $\\begin{cases}x_K=\\dfrac{${xB}+${ecritureParentheseSiNegatif(xD)}}{2}=\\dfrac{${texNombre(xB + xD)}}{2}=${texNombre((xB + xD) / 2, 1)} \\\\[0.8em] y_K=\\dfrac{${yB}+${ecritureParentheseSiNegatif(yD)}}{2}=\\dfrac{${texNombre(yB + yD)}}{2}=${texNombre((yB + yD) / 2, 1)}\\end{cases}$`
          texteCorr += `<br><br>On en déduit :  $K(${texNombre((xB + xD) / 2, 1)}\\,;\\,${texNombre((yB + yD) / 2, 1)})$.`
          texteCorr +=
            '<br><br>On observe que $M$ et $K$ ont les mêmes coordonnées, donc les deux diagonales du quadrilatère se coupent en leur milieu.'
          texteCorr += `<br>$${A.nom}${B.nom}${C.nom}${D.nom}$ est donc un parallélogramme.`
          texteCorr += `<br><br>On calcule maintenant les longueurs de deux cotés consécutifs : $[${A.nom}${B.nom}]$ et $[${A.nom}${D.nom}]$ par exemple.`
          texteCorr += `<br>$\\bullet$  $${A.nom}${B.nom}=\\sqrt{\\left(${xB}-${ecritureParentheseSiNegatif(xA)}\\right)^{2}+\\left(${yB}-${ecritureParentheseSiNegatif(yA)}\\right)^{2}}=\\sqrt{${xAbCarre}+${yAbCarre}}
          =\\sqrt{${texNombre(abCarre)}}$<br>`

          texteCorr += `$\\bullet$  $${A.nom}${D.nom}=\\sqrt{\\left(${xD}-${ecritureParentheseSiNegatif(xA)}\\right)^{2}+\\left(${yD}-${ecritureParentheseSiNegatif(yA)}\\right)^{2}}=\\sqrt{${xAdCarre}+${yAdCarre}}
          =\\sqrt{${texNombre(xAdCarre + yAdCarre)}}$<br>`
          texteCorr += `<br>On observe que $${A.nom}${B.nom}=${A.nom}${D.nom}$, donc $${A.nom}${B.nom}${C.nom}${D.nom}$ est un parallélogramme avec deux consécutifs de même longueur, c'est donc un losange.`

          texteCorr += `<br><br>${texteGras('Remarque :')} Pour montrer que  $${A.nom}${B.nom}${C.nom}${D.nom}$ est un losange on pouvait aussi montrer que le quadrilatère $${A.nom}${B.nom}${C.nom}${D.nom}$ a quatre côtés de même longueur.`
          break
        case 4: //  Dq rectangle
          T = tracePoint(A, B, C, D) // Repère les points avec une croix
          P = polygoneAvecNom(A, B, C, D)
          objets.push(P[1])
          s4 = segment(D, A, bleuMathalea)
          s1 = segment(A, B, bleuMathalea)
          s2 = segment(A, C, bleuMathalea)
          s3 = segment(D, C, bleuMathalea)
          s4 = segment(D, B, bleuMathalea)
          s1.epaisseur = 2
          s2.epaisseur = 2
          s3.epaisseur = 2
          s4.epaisseur = 2
          objets.push(
            repere({
              xMin: XMIN,
              yMin: YMIN,
              xMax: XMAX,
              yMax: YMAX,
              yLabelEcart: 0.6,
              xLabelEcart: 0.6,
              yLabelDistance: 2,
              xLabelDistance: 2,
            }),
            I,
            J,
            o,
            T,
            s1,
            s2,
            s3,
            s4,
          )

          texte =
            'Dans un repère orthonormé $(O, I, J)$, on donne les points suivants :'
          texte += ` $${A.nom}\\left(${xA}\\,;\\,${yA}\\right)$ ; $${B.nom}\\left(${xB}\\,;\\,${yB}\\right)$, $${C.nom}\\left(${xC}\\,;\\,${yC}\\right)$  et $${D.nom}\\left(${xD}\\,;\\,${yD}\\right)$.`
          texte += `<br>Démontrer que $${A.nom}${C.nom}${D.nom}${B.nom}$ est un rectangle.`
          texteCorr =
            'On peut réaliser un graphique permettant de visualiser la situation.<br>'
          texteCorr +=
            '<br>' +
            mathalea2d(
              { xmin: XMIN, ymin: YMIN, xmax: XMAX, ymax: YMAX },
              objets,
            )
          texteCorr += `<br>Il y a plusieurs méthodes  pour prouver  que le quadrilatère $${A.nom}${C.nom}${D.nom}${B.nom}$ est un rectangle.<br>
          Dans ce qui suit, nous démontrons que $${A.nom}${C.nom}${D.nom}${B.nom}$ est un parallélogramme avec des diagonales de même longueur.<br>`
          texteCorr += `<br>On commence par prouver  que $${A.nom}${C.nom}${D.nom}${B.nom}$ est un parallélogramme.<br>`
          texteCorr += `<br>On sait que $${A.nom}${C.nom}${D.nom}${B.nom}$ est un parallélogramme si et seulement si ses diagonales se coupent en leur milieu.`
          texteCorr += `<br><br>$\\bullet$ On note $M$ le milieu de $[${A.nom}${D.nom}]$ :<br>
         $\\begin{cases}x_M=\\dfrac{${xA}+${ecritureParentheseSiNegatif(xD)}}{2}=\\dfrac{${texNombre(xA + xD)}}{2}=${texNombre((xA + xD) / 2, 1)} \\\\[0.8em] y_M=\\dfrac{${yA}+${ecritureParentheseSiNegatif(yD)}}{2}=\\dfrac{${texNombre(yA + yD)}}{2}=${texNombre((yA + yD) / 2, 1)}\\end{cases}$`
          texteCorr += `<br><br>On en déduit :  $M(${texNombre((xA + xD) / 2, 1)}\\,;\\,${texNombre((yA + yD) / 2, 1)})$.`
          texteCorr += `<br><br>$\\bullet$ On note $K$ le milieu de $[${B.nom}${C.nom}]$ :<br>
         $\\begin{cases}x_K=\\dfrac{${xB}+${ecritureParentheseSiNegatif(xC)}}{2}=\\dfrac{${texNombre(xB + xC)}}{2}=${texNombre((xB + xC) / 2, 1)} \\\\[0.8em] y_K=\\dfrac{${yB}+${ecritureParentheseSiNegatif(yC)}}{2}=\\dfrac{${texNombre(yB + yC)}}{2}=${texNombre((yB + yC) / 2, 1)}\\end{cases}$`
          texteCorr += `<br><br>On en déduit :  $K(${texNombre((xB + xC) / 2, 1)}\\,;\\,${texNombre((yB + yC) / 2, 1)})$.`
          texteCorr +=
            '<br><br>On observe que $M$ et $K$ ont les mêmes coordonnées, donc les deux diagonales du quadrilatère se coupent en leur milieu.'
          texteCorr += `<br>$${A.nom}${C.nom}${D.nom}${B.nom}$ est donc un parallélogramme.`
          texteCorr += `<br><br>On calcule maintenant les longueurs des deux diagonales : $[${A.nom}${D.nom}]$ et $[${B.nom}${C.nom}]$ par exemple.`
          texteCorr += `<br>$\\bullet$  $${A.nom}${D.nom}=\\sqrt{\\left(${xD}-${ecritureParentheseSiNegatif(xA)}\\right)^{2}+\\left(${yD}-${ecritureParentheseSiNegatif(yA)}\\right)^{2}}=\\sqrt{${xAdCarre}+${yAdCarre}}
          =\\sqrt{${texNombre(xAdCarre + yAdCarre)}}$<br>`

          texteCorr += `$\\bullet$  $${B.nom}${C.nom}=\\sqrt{\\left(${xC}-${ecritureParentheseSiNegatif(xB)}\\right)^{2}+\\left(${yC}-${ecritureParentheseSiNegatif(yB)}\\right)^{2}}=\\sqrt{${xBcCarre}+${yBcCarre}}
          =\\sqrt{${texNombre(xBcCarre + yBcCarre)}}$<br>`
          texteCorr += `<br>On observe que $${B.nom}${C.nom}=${A.nom}${D.nom}$, donc $${A.nom}${C.nom}${D.nom}${B.nom}$ est un parallélogramme avec des diagonales  de même longueur, c'est donc un rectangle.`

          texteCorr += `<br><br>${texteGras('Remarque :')} Pour montrer que  $${A.nom}${C.nom}${D.nom}${B.nom}$ est un rectangle on pouvait aussi montrer que le parallélogramme $${A.nom}${C.nom}${D.nom}${B.nom}$ a un angle droit (en utilisant la réciproque du théorème de Pythagore).`
          break

        case 5: // carré
          T = tracePoint(A, B, C, D) // Repère les points avec une croix
          P = polygoneAvecNom(A, B, C, D)
          objets.push(P[1])
          s4 = segment(D, A, bleuMathalea)
          s1 = segment(A, B, bleuMathalea)
          s2 = segment(A, C, bleuMathalea)
          s3 = segment(D, C, bleuMathalea)
          s4 = segment(D, B, bleuMathalea)
          s1.epaisseur = 2
          s2.epaisseur = 2
          s3.epaisseur = 2
          s4.epaisseur = 2
          objets.push(
            repere({
              xMin: XMIN,
              yMin: YMIN,
              xMax: XMAX,
              yMax: YMAX,
              yLabelEcart: 0.6,
              xLabelEcart: 0.6,
              yLabelDistance: 2,
              xLabelDistance: 2,
            }),
            I,
            J,
            o,
            T,
            s1,
            s2,
            s3,
            s4,
          )

          texte =
            'Dans un repère orthonormé $(O, I, J)$, on donne les points suivants :'
          texte += ` $${A.nom}\\left(${xA}\\,;\\,${yA}\\right)$ ; $${B.nom}\\left(${xB}\\,;\\,${yB}\\right)$, $${C.nom}\\left(${xC}\\,;\\,${yC}\\right)$  et $${D.nom}\\left(${xD}\\,;\\,${yD}\\right)$.`
          texte += `<br>Démontrer que $${A.nom}${C.nom}${D.nom}${B.nom}$ est un carré.`
          texteCorr =
            'On peut réaliser un graphique permettant de visualiser la situation.<br>'
          texteCorr +=
            '<br>' +
            mathalea2d(
              { xmin: XMIN, ymin: YMIN, xmax: XMAX, ymax: YMAX },
              objets,
            )
          texteCorr += `<br>Il y a plusieurs méthodes  pour prouver  que le quadrilatère $${A.nom}${C.nom}${D.nom}${B.nom}$ est un carré.<br>
          Dans ce qui suit, nous démontrons que $${A.nom}${C.nom}${D.nom}${B.nom}$ est un parallélogramme avec des diagonales de même longueur et deux côtés consécutifs de même longueur.<br>`

          texteCorr += `<br>On commence par prouver  que $${A.nom}${C.nom}${D.nom}${B.nom}$ est un parallélogramme.<br>`
          texteCorr += `<br>On sait que $${A.nom}${C.nom}${D.nom}${B.nom}$ est un parallélogramme si et seulement si ses diagonales se coupent en leur milieu.`
          texteCorr += `<br><br>$\\bullet$ On note $M$ le milieu de $[${A.nom}${D.nom}]$ :<br>
         $\\begin{cases}x_M=\\dfrac{${xA}+${ecritureParentheseSiNegatif(xD)}}{2}=\\dfrac{${texNombre(xA + xD)}}{2}=${texNombre((xA + xD) / 2, 1)} \\\\[0.8em] y_M=\\dfrac{${yA}+${ecritureParentheseSiNegatif(yD)}}{2}=\\dfrac{${texNombre(yA + yD)}}{2}=${texNombre((yA + yD) / 2, 1)}\\end{cases}$`
          texteCorr += `<br><br>On en déduit :  $M(${texNombre((xA + xD) / 2, 1)}\\,;\\,${texNombre((yA + yD) / 2, 1)})$.`
          texteCorr += `<br><br>$\\bullet$ On note $K$ le milieu de $[${B.nom}${C.nom}]$ :<br>
         $\\begin{cases}x_K=\\dfrac{${xB}+${ecritureParentheseSiNegatif(xC)}}{2}=\\dfrac{${texNombre(xB + xC)}}{2}=${texNombre((xB + xC) / 2, 1)} \\\\[0.8em] y_K=\\dfrac{${yB}+${ecritureParentheseSiNegatif(yC)}}{2}=\\dfrac{${texNombre(yB + yC)}}{2}=${texNombre((yB + yC) / 2, 1)}\\end{cases}$`
          texteCorr += `<br><br>On en déduit :  $K(${texNombre((xB + xC) / 2, 1)}\\,;\\,${texNombre((yB + yC) / 2, 1)})$.`
          texteCorr +=
            '<br><br>On observe que $M$ et $K$ ont les mêmes coordonnées, donc les deux diagonales du quadrilatère se coupent en leur milieu.'
          texteCorr += `<br>$${A.nom}${C.nom}${D.nom}${B.nom}$ est donc un parallélogramme.`
          texteCorr += `<br><br>On calcule maintenant les longueurs des deux diagonales : $[${A.nom}${D.nom}]$ et $[${B.nom}${C.nom}]$ par exemple.`
          texteCorr += `<br>$\\bullet$  $${A.nom}${D.nom}=\\sqrt{\\left(${xD}-${ecritureParentheseSiNegatif(xA)}\\right)^{2}+\\left(${yD}-${ecritureParentheseSiNegatif(yA)}\\right)^{2}}=\\sqrt{${xAdCarre}+${yAdCarre}}
          =\\sqrt{${texNombre(xAdCarre + yAdCarre)}}$<br>`

          texteCorr += `$\\bullet$  $${B.nom}${C.nom}=\\sqrt{\\left(${xC}-${ecritureParentheseSiNegatif(xB)}\\right)^{2}+\\left(${yC}-${ecritureParentheseSiNegatif(yB)}\\right)^{2}}=\\sqrt{${xBcCarre}+${yBcCarre}}
          =\\sqrt{${texNombre(xBcCarre + yBcCarre)}}$<br>`
          texteCorr += `<br>On observe que $${B.nom}${C.nom}=${A.nom}${D.nom}$, donc $${A.nom}${C.nom}${D.nom}${B.nom}$ est un parallélogramme avec des diagonales  de même longueur, c'est donc un rectangle.`

          texteCorr += `<br><br>On calcule enfin les longueurs de deux côtés consécutifs : $[${A.nom}${B.nom}]$ et $[${A.nom}${C.nom}]$ par exemple.`
          texteCorr += `<br>$\\bullet$  $${A.nom}${B.nom}=\\sqrt{\\left(${xB}-${ecritureParentheseSiNegatif(xA)}\\right)^{2}+\\left(${yB}-${ecritureParentheseSiNegatif(yA)}\\right)^{2}}=\\sqrt{${xAbCarre}+${yAbCarre}}
          =\\sqrt{${texNombre(xAbCarre + yAbCarre)}}$<br>`

          texteCorr += `$\\bullet$  $${A.nom}${C.nom}=\\sqrt{\\left(${xC}-${ecritureParentheseSiNegatif(xA)}\\right)^{2}+\\left(${yC}-${ecritureParentheseSiNegatif(yA)}\\right)^{2}}=\\sqrt{${xAcCarre}+${yAcCarre}}
          =\\sqrt{${texNombre(xAcCarre + yAcCarre)}}$<br>`
          texteCorr += `<br>On observe que $${C.nom}${C.nom}=${A.nom}${B.nom}$, donc $${A.nom}${C.nom}${D.nom}${B.nom}$ est un rectangle  avec deux côtés consécutifs de même longueur, c'est donc un carré.`

          texteCorr += `<br><br>${texteGras('Remarque :')} Pour montrer que  $${A.nom}${C.nom}${D.nom}${B.nom}$ est un carré, il y a d'autres méthodes. <br>
          Par exemple, on montre que c'est d'abord un losange en calculant les quatre longueurs des côtés puis on montre que le losange a un angle droit (en utilisant la réciproque du théorème de Pythagore).`

          break
      }

      if (
        this.questionJamaisPosee(
          i,
          [xA, yA, xB, yB, typesDeQuestions].map(String).join(''),
        )
      ) {
        // Si la question n'a jamais été posée, on en créé une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
