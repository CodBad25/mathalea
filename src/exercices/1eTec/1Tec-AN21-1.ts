import Decimal from 'decimal.js'
import { courbe } from '../../lib/2d/Courbe'
import { repere } from '../../lib/2d/reperes'
import { Polynome } from '../../lib/mathFonctions/Polynome'
import { choice } from '../../lib/outils/arrayOutils'
import { rienSi1 } from '../../lib/outils/ecritures'
import { miseEnEvidence, texteGras } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import FractionEtendue from '../../modules/FractionEtendue'
import { mathalea2d } from '../../modules/mathalea2d'
import { gestionnaireFormulaireTexte, randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const dateDePublication = '28/02/2026'
export const titre =
  'Associer une parabole à une expression algébrique de degré 2'
/**
 * @author Jordan Martin
  *

*/
export const uuid = 'e297b'

export const refs = {
  'fr-fr': ['1Tec-AN21-1'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'

const typePolynome = {
  monome: 1,
  monomeEtConstante: 2,
  deuxRacines: 3,
}

const amplitude = {
  x: 5,
  y: 10,
}

export default class ExpressionAParabole extends ExerciceQcmA {
  private creerQuestion(typeExpression: string | number): void {
    const coefDominant = new Decimal(randint(-12, 12, [0])).div(10).toNumber()
    const coefDominantTexte = texNombre(coefDominant)
    let expressionLatex = ''
    let grapheCorrect = ''
    let grapheErr2 = ''
    let grapheErr3 = ''
    let correction

    // Premier graphe erroné : affine ou polynome degré 3
    const erreur1 = this.affineOuPoly3()
    const grapheErr1 = erreur1.graphe

    // Distinguer le cas ax², ax²+c et a(x-r_1)(x-r_2)
    switch (typeExpression) {
      // Cas ax²
      case typePolynome.monome: {
        const polynome = new Polynome({ coeffs: [0, 0, coefDominant] })
        expressionLatex = polynome.toLatex()
        grapheCorrect = this.genererGraphique(
          polynome.fonction,
          this.reglerFenetrePoly2(coefDominant, 0, 0),
        )
        // Gestion du graphe erroné 2 : signe du coefficient dominant mal interprété
        const erreur2 = this.erreurCoefDominantOpposé(polynome, typeExpression)
        grapheErr2 = erreur2.graphe
        // Gestion du graphe erroné 3 : décalage vertical
        const erreur3 = this.erreurDecalageVertical(
          polynome,
          randint(-3, 3, [0]),
        )
        grapheErr3 = erreur3.graphe
        // Correction
        correction = `L'expression de $f$ est celle d'une fonction polynôme de degré 2 dont la représentation graphique est une ${texteGras('parabole')} ayant pour axe de symétrie l'axe des ordonnées.<br>`
        let signeCoef, orientation, minMax
        if (coefDominant > 0) {
          signeCoef = texteGras('positif')
          orientation = texteGras('haut')
          minMax = texteGras('minimum')
        } else {
          signeCoef = texteGras('négatif')
          orientation = texteGras('bas')
          minMax = texteGras('maximum')
        }
        correction += `Le coefficient dominant est ${signeCoef} : $${miseEnEvidence(coefDominantTexte)}$. Les branches de la parabole sont donc orientées vers le ${orientation}.<br>`
        correction += `Le ${minMax} de $f$ est atteint en $0$ et vaut $${miseEnEvidence(0)}$.`
        break
      }
      // Cas /ax²+c
      case typePolynome.monomeEtConstante: {
        const coefConstant = randint(-3, 3, [0])
        const polynome = new Polynome({
          coeffs: [coefConstant, 0, coefDominant],
        })
        expressionLatex = polynome.toLatex()
        grapheCorrect = this.genererGraphique(
          polynome.fonction,
          this.reglerFenetrePoly2(coefDominant, 0, coefConstant),
        )
        // Gestion du graphe erroné 2 : signe du coefficient dominant mal interprété
        const erreur2 = this.erreurCoefDominantOpposé(polynome, typeExpression)
        grapheErr2 = erreur2.graphe

        // Graphe erroné 3 : même coefficient dominant mais coefficient décalage vertical ou horizontal
        const erreur3 = this.erreurDecalage(polynome, coefConstant)
        grapheErr3 = erreur3.graphe
        // Correction
        correction = `L'expression de $f$ est celle d'une fonction polynôme de degré 2 dont la représentation graphique est une ${texteGras('parabole')} ayant pour axe de symétrie l'axe des ordonnées.<br>`
        let signeCoef, orientation, minMax
        if (coefDominant > 0) {
          signeCoef = texteGras('positif')
          orientation = texteGras('haut')
          minMax = texteGras('minimum')
        } else {
          signeCoef = texteGras('négatif')
          orientation = texteGras('bas')
          minMax = texteGras('maximum')
        }
        correction += `Le coefficient dominant est ${signeCoef} : $${miseEnEvidence(coefDominantTexte)}$. Les branches de la parabole sont donc orientées vers le ${orientation}.<br>`
        correction += `Le ${minMax} de $f$ est atteint en $0$ et vaut $${miseEnEvidence(coefConstant)}$.`
        break
      }
      // Cas a(x-r_1)(r-r_2)
      case typePolynome.deuxRacines: {
        const racine1 = randint(-4, 4)
        const racine2 = randint(-4, 4, [0])
        // (x - r_1) et (x - r_2)
        const polynome1 = new Polynome({ coeffs: [-racine1, 1] })
        const polynome2 = new Polynome({ coeffs: [-racine2, 1] })
        const polynome = polynome1.multiply(polynome2).multiply(coefDominant)
        // Exression
        expressionLatex = this.gererExpressionDeuxRacines(
          coefDominant,
          racine1,
          racine2,
        )
        // Graphe
        const absSommet = new Decimal(racine1 + racine2).div(2).toNumber()
        const extremum = polynome.fonction(absSommet)
        grapheCorrect = this.genererGraphique(
          polynome.fonction,
          this.reglerFenetrePoly2(coefDominant, absSommet, extremum),
        )
        // Gestion du graphe erroné 2 : signe du coefficient dominant mal interprété
        const erreur2 = this.erreurCoefDominantOpposé(
          polynome,
          typeExpression,
          absSommet,
        )
        grapheErr2 = erreur2.graphe
        // Graphe erroné 3 : une racine changée ou les deux racines opposées
        const erreur3 = this.erreurRacines(polynome, racine1, racine2)
        grapheErr3 = erreur3.graphe
        // Correction
        correction = `L'expression  développée de $f$ est $${polynome.toLatex()}$.<br>C'est l'expression d'une fonction polynôme de degré 2. La représentation graphique est donc une ${texteGras('parabole')}.<br>`
        let signeCoef, orientation
        if (coefDominant > 0) {
          signeCoef = texteGras('positif')
          orientation = texteGras('haut')
        } else {
          signeCoef = texteGras('négatif')
          orientation = texteGras('bas')
        }
        correction += `Le coefficient dominant est ${signeCoef} : $${miseEnEvidence(coefDominantTexte)}$. Les branches de la parabole sont donc orientées vers le ${orientation}.<br>`
        correction +=
          racine1 === racine2
            ? `Le polynôme admet une racine double : $${miseEnEvidence(racine1)}$. La parabole passe donc par le point $(${texNombre(racine1)};0)$.`
            : `Le polynôme possède deux racines distinctes : $${miseEnEvidence(racine1)}$ et $${miseEnEvidence(racine2)}$. La parabole passe donc par les points $(${texNombre(racine1)};0)$ et $(${texNombre(racine2)};0)$.`
        break
      }
    }

    this.enonce = `Choisir la représentation graphique de la fonction $f$ définie sur $\\mathbb{R}$
    par $f(x) = ${expressionLatex}$.`
    this.reponses = [grapheCorrect, grapheErr1, grapheErr2, grapheErr3]
    this.correction = correction
  }

  // Renvoie les valeurs xMin, xMax, yMin et yMax pour une fenetre adaptée à une fonction polynôme de degré 2, à partir du coefficient dominant,de l'extremum et de son abscisse
  private reglerFenetrePoly2(
    coefDominant: number,
    absSommet: number,
    extremum: number,
  ): { xMin: number; xMax: number; yMin: number; yMax: number } {
    let yMin, yMax
    // Gestion de yMin/Max selon l'orientatin de la parabole, donc selon le signe du coefficient dominant
    if (coefDominant > 0) {
      yMin = Math.min(extremum - 2, -2)
      yMax = yMin + 2 * amplitude.y
    } else {
      yMax = Math.max(extremum + 2, 2)
      yMin = yMax - 2 * amplitude.y
    }
    return {
      xMin: absSommet - amplitude.x,
      xMax: absSommet + amplitude.x,
      yMin,
      yMax,
    }
  }

  // Génère un graphique pour la fonction fournie et avec la fenêtre donnée
  private genererGraphique(
    fonction: (x: number) => number,
    fenetre: {
      xMin?: number
      xMax?: number
      yMin?: number
      yMax?: number
    },
  ): string {
    const {
      xMin = -amplitude.x,
      xMax = amplitude.x,
      yMin = -amplitude.y,
      yMax = amplitude.y,
    } = fenetre
    const rapportY = 2
    const optionsFenetre = {
      xmin: xMin * 1.1,
      xmax: xMax * 1.1,
      ymin: new Decimal(yMin).div(rapportY).toNumber(),
      ymax: new Decimal(yMax).div(rapportY).toNumber(),
    }
    const r1 = repere({
      xMin,
      yMin,
      yMax,
      xMax,
      xUnite: 1,
      yUnite: new Decimal(1).div(rapportY).toNumber(),
      yThickDistance: rapportY,
      axeXStyle: '->',
      axeYStyle: '->',
      grilleX: false,
      grilleY: false,
    })
    const graphe1 = mathalea2d(
      optionsFenetre,
      r1,
      courbe(fonction, { repere: r1, color: 'blue', epaisseur: 2 }),
    )
    return graphe1
  }

  // Gère le cas particulier de l'expression Latex avec deux racines
  private gererExpressionDeuxRacines(
    coefDominant: number,
    racine1: number,
    racine2: number,
  ): string {
    let expressionRacine2, expressionRacine1
    let coefOppose = false
    const format = ['x-r', 'r-x']
    // Cas de la racine2, jamais nulle
    // Si positive, deux expressions possibles : (x - r2) ou (r2 - x)
    if (racine2 > 0) {
      if (choice(format) === 'x-r')
        expressionRacine2 = `(x - ${texNombre(racine2)})`
      else {
        expressionRacine2 = `(${texNombre(racine2)} - x)`
        coefOppose = true
        coefDominant *= -1
      }
    } else expressionRacine2 = `(x + ${texNombre(-racine2)})`
    // Cas d'égalité (dans ce cas, racine1 est non nulle) : (x - r2)²
    if (racine1 === racine2) {
      coefDominant = coefOppose ? -1 * coefDominant : coefDominant
      return rienSi1(coefDominant) + expressionRacine2 + `^2`
    }
    // Si racine1 nulle
    if (racine1 === 0) expressionRacine1 = `x`
    else {
      if (racine1 > 0) {
        if (choice(format) === 'x-r')
          expressionRacine1 = `(x - ${texNombre(racine1)})`
        else {
          coefDominant *= -1
          expressionRacine1 = `(${texNombre(racine1)} - x)`
        }
      } else expressionRacine1 = `(x + ${texNombre(-racine1)})`
    }
    return rienSi1(coefDominant) + expressionRacine1 + expressionRacine2
  }

  // Génère une fausse réponse "évidente", une fonction affine ou une fonction polynôme de degré 3
  public affineOuPoly3(avecGraphe = true): {
    polynome: Polynome | undefined
    graphe: string
  } {
    let polynome
    let graphe = ''
    const typeFonction = choice(['affine', 'deg3'])
    switch (typeFonction) {
      case 'affine': {
        const coefDominant = randint(-3, 3, [0])
        const coefConstant = randint(-3, 3)
        polynome = new Polynome({ coeffs: [coefConstant, coefDominant] })
        const yMin = polynome.fonction(0) - amplitude.y
        graphe = avecGraphe
          ? this.genererGraphique(polynome.fonction, {
              yMin,
              yMax: yMin + 2 * amplitude.y,
            })
          : ''
        break
      }
      case 'deg3': {
        // Choix des abscisses des extrema locaux puis primitive
        const extrema1 = randint(-3, 3)
        const extrema2 = randint(-3, 3, [extrema1 - 1, extrema1, extrema1 + 1])
        polynome = Polynome.fromRoots([extrema1, extrema2])
          .primitive0()
          .multiply(randint(-1, 1, [0]))
          .add(randint(-3, 3))
        // Atténuation verticale (entre 40 % et 90 %)
        const attenuation = new Decimal(randint(4, 9)).div(10).toNumber()
        const amplitudeMax = new Decimal(10)
          .div(
            Math.max(
              Math.abs(polynome.fonction(extrema1)),
              Math.abs(polynome.fonction(extrema2)),
            ),
          )
          .mul(attenuation)
          .toNumber()
        polynome = polynome.multiply(amplitudeMax)
        graphe = avecGraphe ? this.genererGraphique(polynome.fonction, {}) : ''
        break
      }
    }
    return { polynome, graphe }
  }

  // Génère une fausse réponse avec la parabole orientée dans le mauvais sens
  public erreurCoefDominantOpposé(
    polynome: Polynome,
    typePoly: number,
    absSommet = 0,
    avecGraphe = true,
  ): {
    polynome: Polynome | undefined
    graphe: string
  } {
    let graphe = ''
    // Polynome opposé dans deux cas, "symétrie" dans l'autre
    let erreurPolynome = polynome.multiply(-1)
    if (typePoly === typePolynome.monomeEtConstante)
      erreurPolynome = erreurPolynome.add(2 * polynome.fonction(absSommet))
    if (avecGraphe) {
      let coefDominant = erreurPolynome.monomes[polynome.deg]
      if (
        coefDominant instanceof FractionEtendue ||
        coefDominant instanceof Decimal
      )
        coefDominant = coefDominant.toNumber()
      graphe = this.genererGraphique(
        erreurPolynome.fonction,
        this.reglerFenetrePoly2(
          coefDominant,
          absSommet,
          erreurPolynome.fonction(absSommet),
        ),
      )
    }
    return { polynome: erreurPolynome, graphe }
  }

  // Génère une fausse réponse avec un décalage vertical
  public erreurDecalageVertical(
    polynome: Polynome,
    decalage: number,
    avecGraphe = true,
  ): { polynome: Polynome | undefined; graphe: string } {
    let graphe = ''
    const coeffs = polynome.monomes.map(function (monome) {
      if (monome instanceof Decimal || monome instanceof FractionEtendue)
        return monome.toNumber()
      return monome
    })
    coeffs[0] += decalage
    const erreurPolynome = new Polynome({ coeffs, letter: polynome.letter })
    graphe = avecGraphe
      ? this.genererGraphique(
          erreurPolynome.fonction,
          this.reglerFenetrePoly2(coeffs[polynome.deg], 0, decalage),
        )
      : ''
    return { polynome: erreurPolynome, graphe }
  }

  // Génère une fausse réponse avec un décalage horizontal ou vertical
  public erreurDecalage(
    polynome: Polynome,
    decalage: number,
    avecGraphe = true,
  ): { polynome: Polynome | undefined; graphe: string } {
    let graphe = ''
    const coeffs = polynome.monomes.map(function (monome) {
      if (monome instanceof Decimal || monome instanceof FractionEtendue)
        return monome.toNumber()
      return monome
    })
    const coefDominant = coeffs[polynome.deg]
    let erreurPolynome
    const typeDecalage = choice(['horizontal', 'vertical'])
    switch (typeDecalage) {
      case 'horizontal': {
        // Monome constant
        erreurPolynome = new Polynome({
          coeffs: [coeffs[0]],
          letter: polynome.letter,
        })
        // Polynome (x - decalage)
        const polynomeDecaleBase = new Polynome({ coeffs: [-decalage, 1] })
        // Polynome constant 1
        let polynomeDecale = new Polynome({ coeffs: [1] })
        for (let indice = 1; indice < coeffs.length; indice++) {
          // (x - decalage)^indice
          polynomeDecale = polynomeDecale.multiply(polynomeDecaleBase)
          // Ajout pour construire le polynome final
          erreurPolynome = erreurPolynome.add(
            polynomeDecale.multiply(coeffs[indice]),
          )
        }
        graphe = avecGraphe
          ? this.genererGraphique(
              erreurPolynome.fonction,
              this.reglerFenetrePoly2(
                coefDominant,
                decalage,
                erreurPolynome.fonction(decalage),
              ),
            )
          : ''
        break
      }
      case 'vertical': {
        coeffs[0] += decalage
        erreurPolynome = new Polynome({ coeffs, letter: polynome.letter })
        graphe = avecGraphe
          ? this.genererGraphique(
              erreurPolynome.fonction,
              this.reglerFenetrePoly2(coefDominant, 0, decalage),
            )
          : ''
        break
      }
    }
    return { polynome: erreurPolynome, graphe }
  }

  // Génère une fausse réponse dans le cas (x - r_1)(x - r_2) en changeant les racines en leurs opposées si elles sont différentes ou en changeant une seule racine si les deux sont identiques
  public erreurRacines(
    polynome: Polynome,
    racine1: number,
    racine2: number,
    avecGraphe = true,
  ): { polynome: Polynome | undefined; graphe: string } {
    let graphe = ''
    if (racine1 === -racine2) {
      racine1 = randint(-4, 4, [racine2, -racine2])
    } else {
      racine1 = -racine1
      racine2 = -racine2
    }
    const erreurPolynome = Polynome.fromRoots([racine1, racine2]).multiply(
      polynome.monomes[polynome.deg],
    )
    erreurPolynome.letter = polynome.letter
    if (avecGraphe) {
      let coefDominant = polynome.monomes[polynome.deg]
      if (
        coefDominant instanceof FractionEtendue ||
        coefDominant instanceof Decimal
      )
        coefDominant = coefDominant.toNumber()
      const absSommet = new Decimal(racine1 + racine2).div(2).toNumber()
      graphe = this.genererGraphique(
        erreurPolynome.fonction,
        this.reglerFenetrePoly2(
          coefDominant,
          absSommet,
          erreurPolynome.fonction(absSommet),
        ),
      )
    }
    return { polynome: erreurPolynome, graphe }
  }

  versionAleatoire: () => void = () => {
    const expressionsPossibles = gestionnaireFormulaireTexte({
      saisie: this.sup3,
      min: 1,
      max: 3,
      defaut: 1,
      melange: 4,
      nbQuestions: 0,
    })
    const choixExpression = choice(expressionsPossibles)
    this.creerQuestion(choixExpression)
  }

  constructor() {
    super()
    this.nbQuestionsModifiable = true
    this.besoinFormulaireCaseACocher = false
    this.besoinFormulaire2CaseACocher = false
    this.besoinFormulaire4CaseACocher = false
    this.besoinFormulaire3Texte = [
      "Types d'expression",
      `Nombres séparés par des tirets\n1 : $ax^2$\n2 : $ax^2 + c$\n3 : $a(x-r_1)(x-r_2)$\n4 : Mélange`,
    ]
    this.sup3 = 4
    this.versionAleatoire()
  }
}
