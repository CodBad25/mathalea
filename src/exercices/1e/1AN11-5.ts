import { courbe, intervallesDansLaFenetre } from '../../lib/2d/Courbe'
import { fixeBordures } from '../../lib/2d/fixeBordures'
import type { ObjetMathalea2D } from '../../lib/2d/ObjetMathalea2D'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { repere } from '../../lib/2d/reperes'
import { segment } from '../../lib/2d/segmentsVecteurs'
import { texteParPosition } from '../../lib/2d/textes'
import { tracePoint } from '../../lib/2d/TracePoint'
import { bleuMathalea, vertMathalea } from '../../lib/colors'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { ecritureAlgebrique } from '../../lib/outils/ecritures'
import {
  miseEnEvidence,
  texteEnCouleur,
} from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { mathalea2d } from '../../modules/mathalea2d'
import { context } from '../../modules/context'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
  randint,
} from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  'Lire graphiquement un nombre dérivé avec la tangente à une courbe'
export const dateDePublication = '12/10/2026'
export const uuid = '8c073'
export const refs = {
  'fr-fr': ['1AN11-5'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Une courbe et sa tangente en un point $A$ sont tracées : il faut lire le nombre dérivé en $A$,
 * c'est-à-dire le coefficient directeur de la tangente.
 * Le point de tangence $A$ est toujours à coordonnées entières et la pente est entière ou demi-entière,
 * de sorte que la tangente passe par un second point $B$ à coordonnées entières.
 * La correction trace en pointillés le « triangle de pente » entre $A$ et $B$.
 * @author Rémi Angot
 */

const fenetre = { xMin: -6, xMax: 6, yMin: -5, yMax: 5 }
const tolerance = 1e-9

/** Courbe tirée au sort : $f$, sa dérivée et les caractéristiques utiles au choix du point de tangence */
type Modele = {
  f: (x: number) => number
  df: (x: number) => number
  /** Intervalles sur lesquels la courbe est tracée (les asymptotes et bords de domaine en sont exclus) */
  intervalles: [number, number][]
  /** Abscisses possibles pour le point de tangence (par défaut, tous les entiers de [-5 ; 5]) */
  abscisses?: number[]
  /** Identifiant des paramètres tirés, pour ne pas poser deux fois la même question */
  cle: string
}

const toutLIntervalle: [number, number][] = [[fenetre.xMin, fenetre.xMax]]

const parabole = (): Modele => {
  const k = choice([-2, -1, -0.5, -0.25, 0.25, 0.5, 1, 2])
  const h = randint(-3, 3)
  const c = randint(-3, 3)
  return {
    f: (x) => k * (x - h) ** 2 + c,
    df: (x) => 2 * k * (x - h),
    intervalles: toutLIntervalle,
    cle: `parabole${k};${h};${c}`,
  }
}

const cube = (): Modele => {
  const k = choice([-1, -0.5, -0.25, 0.25, 0.5, 1])
  const h = randint(-2, 2)
  const c = randint(-2, 2)
  return {
    f: (x) => k * (x - h) ** 3 + c,
    df: (x) => 3 * k * (x - h) ** 2,
    intervalles: toutLIntervalle,
    cle: `cube${k};${h};${c}`,
  }
}

const cubiqueTroisRacines = (): Modele => {
  const k = choice([-1, -0.5, -0.25, 0.25, 0.5, 1])
  const racines = new Set<number>()
  while (racines.size < 3) racines.add(randint(-3, 3))
  const [r1, r2, r3] = [...racines]
  return {
    f: (x) => k * (x - r1) * (x - r2) * (x - r3),
    df: (x) =>
      k * ((x - r2) * (x - r3) + (x - r1) * (x - r3) + (x - r1) * (x - r2)),
    intervalles: toutLIntervalle,
    cle: `cubique${k};${r1};${r2};${r3}`,
  }
}

const racine = (): Modele => {
  const k = choice([-2, -1, 1, 2])
  const h = randint(-4, 1)
  const c = randint(-3, 3)
  return {
    f: (x) => k * Math.sqrt(x - h) + c,
    df: (x) => k / (2 * Math.sqrt(x - h)),
    intervalles: [[h, fenetre.xMax]],
    cle: `racine${k};${h};${c}`,
  }
}

const inverse = (): Modele => {
  const k = choice([-4, -2, -1, 1, 2, 4])
  const h = randint(-2, 2)
  const c = randint(-2, 2)
  return {
    f: (x) => k / (x - h) + c,
    df: (x) => -k / (x - h) ** 2,
    intervalles: [
      [fenetre.xMin, h - 0.02],
      [h + 0.02, fenetre.xMax],
    ],
    cle: `inverse${k};${h};${c}`,
  }
}

const exponentielle = (): Modele => {
  const k = choice([-3, -2, -1, 1, 2, 3])
  const sens = choice([-1, 1])
  const h = randint(-3, 3)
  const c = randint(-3, 2)
  return {
    f: (x) => k * Math.exp(sens * (x - h)) + c,
    df: (x) => sens * k * Math.exp(sens * (x - h)),
    intervalles: toutLIntervalle,
    cle: `exp${k};${sens};${h};${c}`,
  }
}

const logarithme = (): Modele => {
  const k = choice([-3, -2, -1, 1, 2, 3])
  const h = randint(-4, 0)
  const c = randint(-3, 3)
  return {
    f: (x) => k * Math.log(x - h) + c,
    df: (x) => k / (x - h),
    intervalles: [[h + 0.005, fenetre.xMax]],
    cle: `ln${k};${h};${c}`,
  }
}

const sinusoide = (): Modele => {
  const amplitude = choice([-3, -2, -1, 1, 2, 3])
  const demiPeriode = choice([2, 3, 4])
  const h = randint(-2, 2)
  const c = randint(-1, 1)
  const omega = Math.PI / demiPeriode
  return {
    f: (x) => amplitude * Math.cos(omega * (x - h)) + c,
    df: (x) => -amplitude * omega * Math.sin(omega * (x - h)),
    intervalles: toutLIntervalle,
    cle: `cos${amplitude};${demiPeriode};${h};${c}`,
  }
}

/**
 * Courbe « quelconque » : interpolation d'Hermite cubique passant par des points à coordonnées entières
 * (une abscisse sur deux) avec des pentes demi-entières imposées. Les pentes sont nulles aux extremums
 * et assez petites ailleurs pour que la courbe reste monotone entre deux points.
 */
const courbeQuelconque = (): Modele => {
  const pas = 2
  const xs = [-6, -4, -2, 0, 2, 4, 6]
  const ys = [randint(-3, 3)]
  while (ys.length < xs.length) {
    const precedent = ys[ys.length - 1]
    ys.push(
      Math.max(-4, Math.min(4, precedent + choice([-3, -2, -1, 0, 1, 2, 3]))),
    )
  }
  const pentes = ys.map((y, i) => {
    if (i === 0) return (ys[1] - y) / pas
    if (i === ys.length - 1) return (y - ys[i - 1]) / pas
    const avant = (y - ys[i - 1]) / pas
    const apres = (ys[i + 1] - y) / pas
    if (avant * apres <= 0) return 0
    const moyenne = Math.round(avant + apres) / 2
    const maximum = 3 * Math.min(Math.abs(avant), Math.abs(apres))
    return Math.sign(moyenne) * Math.min(Math.abs(moyenne), maximum)
  })
  const morceau = (x: number) => {
    const i = Math.min(
      Math.max(Math.floor((x - xs[0]) / pas), 0),
      xs.length - 2,
    )
    return { i, t: (x - xs[i]) / pas }
  }
  return {
    f: (x) => {
      const { i, t } = morceau(x)
      return (
        (2 * t ** 3 - 3 * t ** 2 + 1) * ys[i] +
        (t ** 3 - 2 * t ** 2 + t) * pas * pentes[i] +
        (-2 * t ** 3 + 3 * t ** 2) * ys[i + 1] +
        (t ** 3 - t ** 2) * pas * pentes[i + 1]
      )
    },
    df: (x) => {
      const { i, t } = morceau(x)
      return (
        ((6 * t ** 2 - 6 * t) * ys[i] +
          (3 * t ** 2 - 4 * t + 1) * pas * pentes[i] +
          (-6 * t ** 2 + 6 * t) * ys[i + 1] +
          (3 * t ** 2 - 2 * t) * pas * pentes[i + 1]) /
        pas
      )
    },
    intervalles: toutLIntervalle,
    abscisses: xs.slice(1, -1),
    cle: `quelconque${ys.join(',')};${pentes.join(',')}`,
  }
}

/** Familles de courbes, dans l'ordre du paramètre de l'exercice */
const familles: (() => Modele)[] = [
  parabole,
  cube,
  cubiqueTroisRacines,
  racine,
  inverse,
  exponentielle,
  logarithme,
  sinusoide,
  courbeQuelconque,
]

type Tirage = {
  modele: Modele
  a: number
  image: number
  /** Nombre dérivé en $a$ : entier ou demi-entier */
  pente: number
  /** Second point entier de la tangente, à un déplacement horizontal de $A$ */
  b: { x: number; y: number }
}

const estDemiEntier = (x: number) =>
  Math.abs(2 * x - Math.round(2 * x)) < tolerance

/** Second point entier de la tangente, à droite de $A$ si le repère le permet, sinon à gauche */
const secondPoint = (a: number, image: number, pente: number) => {
  const dx = Number.isInteger(pente) ? 1 : 2
  for (const sens of [1, -1]) {
    const x = a + sens * dx
    const y = image + sens * dx * pente
    if (Math.abs(x) <= 5 && Math.abs(y) <= 4) return { x, y }
  }
  return undefined
}

/** Point de tangence lisible : coordonnées entières, pente entière ou demi-entière et second point entier dans le repère */
const pointsDeTangencePossibles = (modele: Modele): Tirage[] => {
  const abscisses =
    modele.abscisses ?? Array.from({ length: 11 }, (_, n) => n - 5)
  const tirages: Tirage[] = []
  for (const a of abscisses) {
    const y = modele.f(a)
    const m = modele.df(a)
    if (!isFinite(y) || !isFinite(m)) continue
    if (Math.abs(y - Math.round(y)) > tolerance) continue
    if (!estDemiEntier(m) || Math.abs(m) > 3) continue
    const image = Math.round(y)
    const pente = Math.round(2 * m) / 2 + 0 // + 0 évite -0
    if (Math.abs(image) > 3) continue
    const b = secondPoint(a, image, pente)
    if (b === undefined) continue
    tirages.push({ modele, a, image, pente, b })
  }
  return tirages
}

const ecriturePente = (pente: number) =>
  Number.isInteger(pente)
    ? texNombre(pente)
    : `${pente < 0 ? '-' : ''}\\dfrac{${Math.abs(2 * pente)}}{2}`

const fractionPente = (dy: number, dx: number) => `\\dfrac{${dy}}{${dx}}`

/** Côté du point `(x ; y)` de la tangente où ne pas poser une étiquette : celui où se trouve la courbe (+1 : au-dessus, −1 : en dessous) */
const coteDeLaCourbe = (
  f: (x: number) => number,
  tangente: (x: number) => number,
  x: number,
) => {
  const ecart = (xx: number) => f(xx) - tangente(xx)
  const valeurs = [
    ecart(x - 0.5) + ecart(x + 0.5),
    ecart(x + 0.5),
    ecart(x - 0.5),
  ]
  const valeur = valeurs.find((v) => isFinite(v) && Math.abs(v) > 1e-6)
  return valeur === undefined || valeur > 0 ? 1 : -1
}

export default class LireNombreDeriveGraphiquement extends Exercice {
  constructor() {
    super()
    this.consigne = ''
    this.nbQuestions = 3
    this.nbCols = 1
    this.nbColsCorr = 1
    this.spacing = 1.5
    this.spacingCorr = 1.5
    this.besoinFormulaireTexte = [
      'Type de courbe',
      [
        'Nombres séparés par des tirets :',
        '1 : Parabole',
        '2 : Fonction cube',
        '3 : Polynôme de degré 3 à trois racines',
        '4 : Fonction racine carrée',
        '5 : Fonction inverse',
        '6 : Fonction exponentielle',
        '7 : Fonction logarithme',
        '8 : Fonction périodique',
        '9 : Courbe quelconque',
        '10 : Mélange',
      ].join('\n'),
    ]
    this.sup = '10'
  }

  nouvelleVersion() {
    const types = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: familles.length,
      melange: familles.length + 1,
      defaut: familles.length + 1,
      nbQuestions: this.nbQuestions,
    }).map(Number)
    const listeTypes = combinaisonListes(types, this.nbQuestions)

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 100; cpt++) {
      const possibles = pointsDeTangencePossibles(familles[listeTypes[i] - 1]())
      if (possibles.length === 0) continue
      const { modele, a, image, pente, b } = choice(possibles)
      const { f, df } = modele
      const tangente = (x: number) => pente * (x - a) + image
      if (Math.abs(df(a) - pente) > tolerance) continue

      const r = repere({
        ...fenetre,
        grille: true,
        grilleSecondaire: false,
        thickHauteur: 0.1,
        axeXStyle: '->',
        axeYStyle: '->',
      })
      const courbes = intervallesDansLaFenetre(
        f,
        modele.intervalles,
        fenetre.yMin,
        fenetre.yMax,
      ).map(([xMin, xMax]) =>
        courbe(f, {
          repere: r,
          xMin,
          xMax,
          yMin: fenetre.yMin,
          yMax: fenetre.yMax,
          color: bleuMathalea,
          epaisseur: 2,
          step: 0.05,
        }),
      )
      const droiteTangente = courbe(tangente, {
        repere: r,
        ...fenetre,
        color: 'red',
        epaisseur: 1.5,
      })
      const marque = (x: number, y: number) => {
        const p = tracePoint(pointAbstrait(x, y), 'black')
        p.taille = 6
        p.epaisseur = 2
        return p
      }
      /** Étiquette d'un point de la tangente, placée du côté opposé à la courbe */
      const etiquette = (nom: string, x: number, y: number) => {
        const cote = -coteDeLaCourbe(f, tangente, x)
        const norme = Math.sqrt(1 + pente ** 2)
        return texteParPosition(
          `$${nom}$`,
          x - (cote * pente * 0.5) / norme,
          y + (cote * 0.5) / norme,
          0,
          'black',
          1,
        )
      }
      // Le nom de la tangente est placé sur une portion visible de T, le plus loin possible de A et de B
      const positionsNomTangente = [1, -1].flatMap((sens) =>
        Array.from({ length: 100 }, (_, n) => ({
          sens,
          x: (sens > 0 ? fenetre.xMax : fenetre.xMin) - sens * (0.5 + n * 0.1),
        })).filter(({ x }) => Math.abs(tangente(x)) <= fenetre.yMax - 0.8),
      )
      const ecartAuxPoints = (x: number) =>
        Math.min(2, Math.abs(x - a), Math.abs(x - b.x))
      const xT = positionsNomTangente.reduce(
        (meilleure, position) =>
          ecartAuxPoints(position.x) > ecartAuxPoints(meilleure.x)
            ? position
            : meilleure,
        positionsNomTangente[0],
      )
      const nomTangente = texteParPosition(
        '$T$',
        xT.x + xT.sens * 0.3,
        tangente(xT.x) + (pente * xT.sens >= 0 ? 0.3 : -0.3),
        0,
        'red',
        1,
      )

      const objetsEnonce: ObjetMathalea2D[] = [
        r,
        ...courbes,
        droiteTangente,
        marque(a, image),
        etiquette('A', a, image),
        nomTangente,
      ]
      const dessiner = (objets: ObjetMathalea2D[]) =>
        mathalea2d(
          Object.assign(
            { pixelsParCm: 30, scale: 0.6, style: 'margin: auto' },
            fixeBordures(objets),
            { center: !context.isHtml },
          ),
          objets,
        )

      // Triangle de pente en pointillés : un déplacement horizontal puis un déplacement vertical, de A à B
      const dx = b.x - a
      const dy = b.y - image
      const horizontal = segment(a, image, b.x, image, vertMathalea)
      const pointilles = [horizontal]
      // Pente non nulle : le déplacement horizontal est écrit à l'extérieur du triangle ; sinon, du côté de la courbe,
      // les étiquettes A et B étant du côté opposé
      const ecartLabelHorizontal =
        dy === 0 ? 0.45 * coteDeLaCourbe(f, tangente, a) : dy > 0 ? -0.4 : 0.4
      const objetsCorrection = [
        ...objetsEnonce,
        horizontal,
        marque(b.x, b.y),
        etiquette('B', b.x, b.y),
        texteParPosition(
          `$${ecritureAlgebrique(dx)}$`,
          (a + b.x) / 2,
          image + ecartLabelHorizontal,
          0,
          vertMathalea,
          1,
        ),
        texteParPosition(
          `$${dy === 0 ? 0 : ecritureAlgebrique(dy)}$`,
          b.x + Math.sign(dx) * 0.6,
          dy === 0 ? image + ecartLabelHorizontal : (image + b.y) / 2,
          0,
          vertMathalea,
          1,
        ),
      ]
      if (dy !== 0) {
        const vertical = segment(b.x, image, b.x, b.y, vertMathalea)
        pointilles.push(vertical)
        objetsCorrection.push(vertical)
      }
      for (const s of pointilles) {
        s.pointilles = 2
        s.epaisseur = 3
      }

      const reponse = ecriturePente(pente)
      let texte = `On a tracé ci-dessous la courbe $\\mathcal{C}_f$ (en bleu) d'une fonction $f$ et la tangente $T$ (en rouge) à $\\mathcal{C}_f$ au point $A$ d'abscisse $${a}$.<br>
${dessiner(objetsEnonce)}
Déterminer, par lecture graphique, $f'(${a})$.`
      if (this.interactif) {
        texte += ajouteChampTexteMathLive(
          this,
          i,
          KeyboardType.clavierDeBaseAvecFraction,
          { texteAvant: `<br>$f'(${a})=$`, texteApres: '.' },
        )
      } else {
        texte += '<br>'
      }
      handleAnswers(this, i, { reponse: { value: reponse } })

      let texteCorr = texteEnCouleur(
        `Le nombre dérivé $f'(${a})$ est le coefficient directeur de la tangente $T$ à $\\mathcal{C}_f$ au point $A$ d'abscisse $${a}$.<br>`,
        bleuMathalea,
      )
      const deplacement = (valeur: number, positif: string, negatif: string) =>
        `$${Math.abs(valeur)}$ ${Math.abs(valeur) > 1 ? 'unités' : 'unité'} vers ${valeur > 0 ? positif : negatif}`
      const deplacementVertical =
        dy === 0
          ? 'sans monter ni descendre'
          : `puis de ${deplacement(dy, 'le haut', 'le bas')}`
      texteCorr += texteEnCouleur(
        `La tangente $T$ passe par $A(${a}\\,;\\,${image})$ et par le point $B(${b.x}\\,;\\,${b.y})$, de coordonnées entières.<br>
Pour aller de $A$ à $B$, on se déplace de ${deplacement(dx, 'la droite', 'la gauche')}, ${deplacementVertical} (pointillés verts).<br>
Le coefficient directeur de $T$ est donc $\\dfrac{y_B-y_A}{x_B-x_A}=${fractionPente(dy, dx)}$, soit $${ecriturePente(pente)}$.<br>`,
        bleuMathalea,
      )
      texteCorr += `Ainsi, $f'(${a})=${miseEnEvidence(reponse)}$.<br>${dessiner(objetsCorrection)}`

      if (this.questionJamaisPosee(i, modele.cle, a)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
    }
    listeQuestionsToContenu(this)
  }
}
