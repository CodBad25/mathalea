import { colorToLatexOrHTML } from '../../lib/2d/colorToLatexOrHtml'
import { courbeInterpolee } from '../../lib/2d/CourbeInterpolee.1'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import { point } from '../../lib/2d/PointAbstrait'
import { repere } from '../../lib/2d/reperes'
import { tracePoint } from '../../lib/2d/TracePoint'
import { mathalea2d } from '../../modules/mathalea2d'
import Exercice from '../Exercice'
export const titre = 'Effectuer une interpolation cosinusoïdale'

export const refs = {
  'fr-fr': ['P013'],
  'fr-ch': [],
}
export const uuid = '5b767'

/**
 * Trace une courbe interpolee par portions cosinusoïdales.
 * @author Jean-Claude Lhote

*/
export function valideListeOfPoints(liste: string): boolean {
  const points = liste.split('/')
  if (points.length < 2) {
    return false
  }
  for (let i = 0; i < points.length; i++) {
    const coords = points[i].split(';')
    if (coords.length !== 2) {
      return false
    }
    const x = parseFloat(coords[0].substring(1))
    const y = parseFloat(coords[1].substring(0, coords[1].length - 1))
    if (isNaN(x) || isNaN(y)) {
      return false
    }
  }
  return true
}
export default class TraceCourbeInterpolee1 extends Exercice {
  constructor() {
    super()
    this.besoinFormulaireTexte = [
      'Liste des points (au moins deux) sous la forme: (x0;y0)/(x1;y1)/...',
      '',
    ]
    this.besoinFormulaire2CaseACocher = ['Afficher les points ', true]
    this.besoinFormulaire3Numerique = [
      'Modèles de couleur ',
      3,
      '1 : Points rouges sur courbe noire\n2 : Points bleus sur courbe rouge\n3 : Points verts sur courbe bleue',
    ]

    this.nbQuestions = 1
    this.nbQuestionsModifiable = false

    this.sup = '(-5;0)/(0;5)/(5;0)' // liste de points
    this.sup2 = true
    this.sup3 = 1
  }

  nouvelleVersion() {
    if (
      this.sup === undefined ||
      typeof this.sup !== 'string' ||
      this.sup.trim() === ''
    ) {
      this.sup = '(-5;0)/(0;5)/(5;0)'
    }
    if (!valideListeOfPoints(this.sup)) {
      this.sup = '(-5;0)/(0;5)/(5;0)'
    }
    const liste = this.sup.split('/')
    const points = []
    const objets = []
    const couleurs = [
      { colPoint: 'red', colCourbe: 'black' },
      { colPoint: 'blue', colCourbe: 'red' },
      { colPoint: 'green', colCourbe: 'blue' },
    ]
    for (let i = 0, coords; i < liste.length; i++) {
      coords = liste[i].split(';')
      if (coords.length !== 2) {
        continue
      }
      const x = parseFloat(coords[0].substring(1))
      const y = parseFloat(coords[1].substring(0, coords[1].length - 1))
      if (isNaN(x) || isNaN(y)) {
        continue
      }
      points.push([x, y])
    }
    if (points.length < 2) {
      exit.call(this)
      return
    }
    let xMin = 100
    let xMax = -100
    let yMin = 100
    let yMax = -100
    for (let i = 0; i < points.length; i++) {
      xMin = Math.min(xMin, points[i][0])
      xMax = Math.max(xMax, points[i][0])
      yMin = Math.min(yMin, points[i][1])
      yMax = Math.max(yMax, points[i][1])
    }
    const r = repere({
      xMin: xMin - 1,
      xMax: xMax + 1,
      yMin: yMin - 1,
      yMax: yMax + 1,
    })
    const c = courbeInterpolee(points, {
      color: couleurs[parseInt(this.sup3) - 1].colCourbe,
      epaisseur: 2,
      repere: r,
      xMin,
      xMax,
    })
    objets.push(r, c)
    if (this.sup2) {
      for (let i = 0, p; i < points.length; i++) {
        p = tracePoint(point(points[i][0], points[i][1]))
        p.style = '+'
        p.epaisseur = 2
        p.color = colorToLatexOrHTML(couleurs[parseInt(this.sup3) - 1].colPoint)
        objets.push(p)
      }
    }
    this.contenu = mathalea2d(fixeBordures(objets), objets)
    this.listeQuestions[0] = this.contenu
  }
}

function exit(this: TraceCourbeInterpolee1) {
  this.listeQuestions[0] = "La liste de points n'est pas correctement formatée."
}
