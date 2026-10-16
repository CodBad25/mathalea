import { arc } from '../../lib/2d/Arc'
import { cercle } from '../../lib/2d/cercle'
import { colorToLatexOrHTML } from '../../lib/2d/colorToLatexOrHtml'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import type { ObjetMathalea2D } from '../../lib/2d/ObjetMathalea2D'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { polygone } from '../../lib/2d/polygones'
import { latex2d } from '../../lib/2d/textes'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { matriceCompare } from '../../lib/interactif/comparaisonMatrices'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { numAlpha } from '../../lib/outils/outilString'
import { mathalea2d } from '../../modules/mathalea2d'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = "Utiliser la matrice d'adjacence d'un graphe"
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDePublication = '08/10/2026'

/**
 * Écrire la matrice d'adjacence d'un graphe (orienté ou non), puis compter
 * les chemins (ou les chaînes) d'une longueur donnée entre deux sommets à
 * l'aide d'une puissance de cette matrice.
 *
 * @author Arnaud Meistermann
 */
export const uuid = 'ecca7'

export const refs = {
  'fr-fr': ['TEG1-21'],
  'fr-ch': [],
}

const sommets = ['A', 'B', 'C', 'D', 'E', 'F']

function texPmatrix(table: (string | number)[][]): string {
  return `\\begin{pmatrix}${table.map((ligne) => ligne.join(' & ')).join('\\\\')}\\end{pmatrix}`
}

function produit(X: number[][], Y: number[][]): number[][] {
  return X.map((ligne) =>
    Y[0].map((_, j) => ligne.reduce((s, x, k) => s + x * Y[k][j], 0)),
  )
}

function puissance(M: number[][], k: number): number[][] {
  let P = M
  for (let e = 1; e < k; e++) P = produit(P, M)
  return P
}

/** Les sommets atteignables depuis le premier, en suivant les arcs. */
function estConnexe(adj: number[][]): boolean {
  const vus = new Set([0])
  const pile = [0]
  while (pile.length > 0) {
    const i = pile.pop() as number
    adj[i].forEach((a, j) => {
      if (a === 1 && !vus.has(j)) {
        vus.add(j)
        pile.push(j)
      }
    })
  }
  return vus.size === adj.length
}

/**
 * Graphe aléatoire sans sommet isolé. Orienté : chaque sommet a au moins un
 * arc sortant et un arc entrant, avec au plus une boucle. Non orienté : connexe
 * et sans boucle.
 */
function grapheAleatoire(n: number, oriente: boolean): number[][] | null {
  const adj = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => 0),
  )
  if (oriente) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) adj[i][j] = randint(1, 10) <= 4 ? 1 : 0
      }
    }
    if (choice([true, false, false])) {
      const s = randint(0, n - 1)
      adj[s][s] = 1
    }
    if (adj.some((ligne) => ligne.every((a) => a === 0))) return null
    if (adj.some((_, j) => adj.every((ligne) => ligne[j] === 0))) return null
    const nbArcs = adj.flat().filter((a) => a === 1).length
    if (nbArcs < n + 1 || nbArcs > 2 * n + 1) return null
  } else {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        adj[i][j] = randint(1, 10) <= 5 ? 1 : 0
        adj[j][i] = adj[i][j]
      }
    }
    if (!estConnexe(adj)) return null
    const nbAretes = adj.flat().filter((a) => a === 1).length / 2
    if (nbAretes < n || nbAretes > 2 * n - 2) return null
  }
  return adj
}

/** Liste des chemins de longueur k de s à t (à n'appeler que s'ils sont peu nombreux). */
function chemins(adj: number[][], s: number, t: number, k: number): number[][] {
  if (k === 0) return s === t ? [[s]] : []
  const resultat: number[][] = []
  adj[s].forEach((a, j) => {
    if (a === 1) {
      for (const suite of chemins(adj, j, t, k - 1))
        resultat.push([s, ...suite])
    }
  })
  return resultat
}

/**
 * Trace l'arc de cercle de centre (cx ; cy) et de rayon r partant de l'angle
 * a0 (en degrés) et balayant l'angle balayage (positif dans le sens direct).
 * Si fleche est vrai, l'arc est raccourci et terminé par une pointe pleine
 * dont le bout est exactement à l'extrémité de l'arc.
 */
function lienCourbe(
  objets: ObjetMathalea2D[],
  cx: number,
  cy: number,
  r: number,
  a0: number,
  balayage: number,
  fleche: boolean,
) {
  const longueurPointe = 0.25
  const demiLargeur = 0.1
  const surCercle = (angle: number) => ({
    x: cx + r * Math.cos((angle * Math.PI) / 180),
    y: cy + r * Math.sin((angle * Math.PI) / 180),
  })
  const retrait = fleche
    ? Math.sign(balayage) *
      ((2 * Math.asin(longueurPointe / (2 * r)) * 180) / Math.PI)
    : 0
  const debut = surCercle(a0)
  const courbe = arc(
    pointAbstrait(debut.x, debut.y),
    pointAbstrait(cx, cy),
    balayage - retrait,
  )
  courbe.epaisseur = 1.2
  objets.push(courbe)
  if (!fleche) return
  const bout = surCercle(a0 + balayage)
  const base = surCercle(a0 + balayage - retrait)
  const tx = (bout.x - base.x) / longueurPointe
  const ty = (bout.y - base.y) / longueurPointe
  const pointe = polygone(
    pointAbstrait(bout.x, bout.y),
    pointAbstrait(base.x - demiLargeur * ty, base.y + demiLargeur * tx),
    pointAbstrait(base.x + demiLargeur * ty, base.y - demiLargeur * tx),
  )
  pointe.couleurDeRemplissage = colorToLatexOrHTML('black')
  pointe.opaciteDeRemplissage = 1
  objets.push(pointe)
}

/**
 * Sommets répartis sur un cercle, dans le sens des aiguilles d'une montre en
 * partant d'en haut à gauche : aucune arête ne passe par un autre sommet.
 */
function figureGraphe(adj: number[][], oriente: boolean): string {
  const n = adj.length
  const rayon = 2.6
  const rayonSommet = 0.3
  // Les liens s'arrêtent sur le cercle de rayon marge autour de chaque sommet.
  const marge = rayonSommet + 0.05
  const positions = adj.map((_, i) => {
    const depart = n % 2 === 0 ? 90 + 180 / n : 90
    const angle = ((depart - (360 * i) / n) * Math.PI) / 180
    return { x: rayon * Math.cos(angle), y: rayon * Math.sin(angle) }
  })
  const objets: ObjetMathalea2D[] = []
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (adj[i][j] === 0 || (!oriente && j < i)) continue
      const P = positions[i]
      if (i === j) {
        // Boucle : cercle de centre C à l'extérieur du sommet, tracé de l'un à
        // l'autre de ses points d'intersection avec le cercle de rayon marge.
        const ux = P.x / rayon
        const uy = P.y / rayon
        const D = 0.6
        const r = 0.42
        const a = (D * D + marge * marge - r * r) / (2 * D)
        const beta =
          (Math.atan2(Math.sqrt(marge * marge - a * a), D - a) * 180) / Math.PI
        const phi = (Math.atan2(uy, ux) * 180) / Math.PI
        lienCourbe(
          objets,
          P.x + D * ux,
          P.y + D * uy,
          r,
          phi + 180 - beta,
          -(360 - 2 * beta),
          oriente,
        )
        continue
      }
      const Q = positions[j]
      const d = Math.hypot(Q.x - P.x, Q.y - P.y)
      const wx = (Q.x - P.x) / d
      const wy = (Q.y - P.y) / d
      // Chaque lien est un arc de cercle d'angle au centre alpha, raccourci de
      // la marge à chaque bout. Deux arcs de sens contraires sont bombés
      // chacun sur sa droite ; un lien seul est bombé vers l'extérieur.
      const mx = (P.x + Q.x) / 2
      const my = (P.y + Q.y) / 2
      const sens =
        oriente && adj[j][i] === 1 ? 1 : wy * mx - wx * my < 0 ? -1 : 1
      const alpha = 40
      const alphaRad = (alpha * Math.PI) / 180
      const R = d / 2 / Math.sin(alphaRad / 2)
      const h = d / 2 / Math.tan(alphaRad / 2)
      const cx = mx - sens * wy * h
      const cy = my + sens * wx * h
      const delta = (2 * Math.asin(marge / (2 * R)) * 180) / Math.PI
      const angleP = (Math.atan2(P.y - cy, P.x - cx) * 180) / Math.PI
      lienCourbe(
        objets,
        cx,
        cy,
        R,
        angleP + sens * delta,
        sens * (alpha - 2 * delta),
        oriente,
      )
    }
  }
  positions.forEach(({ x, y }, i) => {
    objets.push(cercle(pointAbstrait(x, y), rayonSommet, 'black', 'white'))
    objets.push(latex2d(sommets[i], x, y, {}))
  })
  return mathalea2d(
    Object.assign({}, fixeBordures(objets), { pixelsParCm: 40, scale: 0.8 }),
    objets,
  )
}

export default class MatriceAdjacence extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.besoinFormulaireNumerique = [
      'Type de graphe',
      3,
      '1 : Orienté\n2 : Non orienté\n3 : Mélange',
    ]
    this.besoinFormulaire2Numerique = [
      'Nombre de sommets',
      3,
      '1 : 4 sommets\n2 : 5 sommets\n3 : Mélange',
    ]
    this.besoinFormulaire3CaseACocher = [
      "Puissance de la matrice d'adjacence donnée dans l'énoncé",
      false,
    ]
    this.sup = 3
    this.sup2 = 3
    this.sup3 = false
    this.spacingCorr = 2
  }

  nouvelleVersion() {
    const listeOriente = combinaisonListes(
      this.sup === 3 ? [true, false] : [this.sup === 1],
      this.nbQuestions,
    )
    const listeOrdres = combinaisonListes(
      this.sup2 === 3 ? [4, 5] : [this.sup2 + 3],
      this.nbQuestions,
    )
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; cpt++) {
      const oriente = listeOriente[i]
      const n = listeOrdres[i]
      let adj: number[][] | null = null
      for (let essai = 0; essai < 1000 && adj == null; essai++) {
        adj = grapheAleatoire(n, oriente)
      }
      if (adj == null) continue
      const k = randint(2, 4)
      const Mk = puissance(adj, k)
      const s = randint(0, n - 1)
      const t = randint(0, n - 1)
      const nombre = Mk[s][t]
      // On veut au moins un chemin, mais pas trop pour rester lisible.
      if (nombre === 0 || nombre > 30) continue
      if (!this.questionJamaisPosee(i, adj.flat().join(''), k, s, t)) continue

      const nom = oriente ? 'chemins' : 'chaînes'
      const depart = sommets[s]
      const arrivee = sommets[t]
      const trajet =
        s === t
          ? `partant de ${depart} et revenant en ${depart}`
          : oriente
            ? `allant de ${depart} à ${arrivee}`
            : `reliant ${depart} et ${arrivee}`
      const texM = texPmatrix(adj)
      const texMk = texPmatrix(Mk)

      let texte = `On considère le graphe ${oriente ? 'orienté' : 'non orienté'} $G$ ci-dessous.<br>`
      texte += figureGraphe(adj, oriente)
      texte += `<br>${numAlpha(0)}Écrire la matrice d'adjacence $M$ du graphe $G$, les sommets étant rangés dans l'ordre alphabétique.`
      if (this.interactif) {
        texte +=
          "<br>Saisir la matrice à l'aide de la touche « Matrice ».<br>" +
          ajouteChampTexteMathLive(this, 2 * i, KeyboardType.clavierMatrice, {
            texteAvant: '$M=$',
          })
      }
      texte += this.sup3
        ? `<br>${numAlpha(1)}On donne $M^${k}=${texMk}$.<br>Déterminer le nombre de ${nom} de longueur $${k}$ ${trajet}.`
        : `<br>${numAlpha(1)}Déterminer, à l'aide de la calculatrice, le nombre de ${nom} de longueur $${k}$ ${trajet}.`
      if (this.interactif) {
        texte +=
          '<br>' +
          ajouteChampTexteMathLive(this, 2 * i + 1, KeyboardType.clavierNumbers)
      }
      handleAnswers(this, 2 * i, {
        reponse: { value: texM, compare: matriceCompare },
      })
      handleAnswers(this, 2 * i + 1, { reponse: { value: nombre } })

      let texteCorr = `${numAlpha(0)}`
      texteCorr += oriente
        ? "Le coefficient de la ligne $i$ et de la colonne $j$ de $M$ vaut $1$ s'il existe un arc allant du $i$-ième sommet vers le $j$-ième sommet, et $0$ sinon."
        : "Le coefficient de la ligne $i$ et de la colonne $j$ de $M$ vaut $1$ s'il existe une arête reliant le $i$-ième sommet et le $j$-ième sommet, et $0$ sinon. La matrice $M$ est donc symétrique."
      texteCorr += `<br>$M=${miseEnEvidence(texM)}$<br>`
      texteCorr += `${numAlpha(1)}Le nombre de ${nom} de longueur $${k}$ ${trajet} est le coefficient de la ligne $${s + 1}$ et de la colonne $${t + 1}$ de la matrice $M^${k}$.<br>`
      const MkColore = texPmatrix(
        Mk.map((ligne, l) =>
          ligne.map((x, c) =>
            l === s && c === t ? `\\textcolor{blue}{${x}}` : x,
          ),
        ),
      )
      texteCorr += this.sup3
        ? `$M^${k}=${MkColore}$<br>`
        : `La calculatrice donne $M^${k}=${MkColore}$.<br>`
      texteCorr += `Il y a donc $${miseEnEvidence(nombre)}$ ${nombre === 1 ? nom.slice(0, -1) : nom} de longueur $${k}$ ${trajet}.`
      if (nombre <= 6) {
        const liste = chemins(adj, s, t, k).map(
          (c) => `$${c.map((v) => sommets[v]).join(oriente ? '\\to ' : '-')}$`,
        )
        texteCorr +=
          liste.length === 1
            ? `<br>Il s'agit de ${liste[0]}.`
            : `<br>Il s'agit de ${liste.slice(0, -1).join(', ')} et ${liste[liste.length - 1]}.`
      }

      this.listeQuestions[i] = texte
      this.listeCorrections[i] = texteCorr
      i++
    }
    listeQuestionsToContenu(this)
  }
}
