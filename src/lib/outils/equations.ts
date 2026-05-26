import Decimal from 'decimal.js'
import FractionEtendue from '../../modules/FractionEtendue'
import { randint } from '../../modules/outils'
import { texFractionFromString } from './deprecatedFractions'
import {
  ecritureAlgebrique,
  ecritureParentheseSiNegatif,
  rienSi1,
} from './ecritures'
import { miseEnEvidence } from './embellissements'
import { abs, arrondi, signe } from './nombres'
import { texNombre } from './texNombre'

/**
 * Génère une équation du premier degré à une inconnue, avec son énoncé,
 * sa correction et sa correction détaillée.
 *
 * Les quatre types d'équations supportés sont :
 * - `'x+b=d'`      : équation sans coefficient devant l'inconnue
 * - `'ax=d'`       : équation sans terme constant
 * - `'ax+b=0'`     : équation avec second membre nul
 * - `'ax+b=d'`     : équation complète à un seul membre avec inconnue
 * - `'ax+b=cx+d'`  : équation avec inconnue des deux côtés (type par défaut)
 *
 * Si `a`, `b`, `c`, `d` sont fournis, le type est déduit automatiquement
 * et la réponse est calculée exactement. Sinon, les coefficients manquants
 * sont tirés aléatoirement de façon à garantir une solution entière ou
 * fractionnaire simple.
 *
 * @param options - Paramètres de configuration de l'équation.
 * @param options.valeursRelatives - Si `true`, autorise des coefficients et
 *   une solution négatifs. Si `false` (défaut), tous les coefficients et la
 *   solution générés aléatoirement sont positifs.
 * @param options.divisiblePar - Facteur multiplicatif appliqué aux coefficients
 *   tirés aléatoirement, afin de garantir une divisibilité particulière.
 *   Défaut : `1`.
 * @param options.type - Force le type d'équation. Ignoré si `a`, `b`, `c`, `d`
 *   sont tous fournis (le type est alors recalculé). Défaut : `'ax+b=cx+d'`.
 * @param options.a - Coefficient de l'inconnue au membre gauche. Si absent,
 *   tiré aléatoirement selon le type et `valeursRelatives`.
 * @param options.b - Terme constant au membre gauche. Si absent, calculé pour
 *   que la solution soit un entier simple ou tiré aléatoirement.
 * @param options.c - Coefficient de l'inconnue au membre droit. Si absent,
 *   tiré aléatoirement (peut être `0` selon le type).
 * @param options.d - Terme constant au membre droit. Si absent, tiré
 *   aléatoirement selon le type et `valeursRelatives`.
 * @param options.inconnue - Symbole utilisé pour l'inconnue dans les chaînes
 *   LaTeX générées. Défaut : `'x'`.
 *
 * @returns Un objet contenant :
 * - `membreDeGauche` — chaîne LaTeX du membre gauche (ex. `"3x+2"`)
 * - `membreDeDroite` — chaîne LaTeX du membre droit (ex. `"x-4"`)
 * - `egalite` — chaîne LaTeX de l'équation complète (ex. `"3x+2=x-4"`)
 * - `reponse` — solution exacte, sous forme de `number` si entière ou
 *   décimale exacte, ou de `FractionEtendue` si rationnelle non décimale
 * - `reponseDecimale` — valeur décimale de la solution, arrondie à 2 décimales
 * - `correction` — correction LaTeX concise (étapes de résolution + conclusion)
 * - `correctionDetaillee` — correction LaTeX avec explications textuelles à
 *   chaque étape
 * - `correctionSansConclusion` — correction LaTeX concise sans la phrase de
 *   conclusion finale
 * - `correctionSansConclusionDetaillee` — correction détaillée sans la phrase
 *   de conclusion finale
 * - `a` — valeur numérique du coefficient `a` effectivement utilisé
 * - `aDecimal` — valeur `Decimal` du coefficient `a`
 * - `b` — valeur numérique du coefficient `b` effectivement utilisé
 * - `bDecimal` — valeur `Decimal` du coefficient `b`
 * - `c` — valeur numérique du coefficient `c` effectivement utilisé
 * - `cDecimal` — valeur `Decimal` du coefficient `c`
 * - `d` — valeur numérique du coefficient `d` effectivement utilisé
 * - `dDecimal` — valeur `Decimal` du coefficient `d`
 *
 * @example
 * // Équation entièrement aléatoire avec valeurs relatives
 * const eq = equation1erDegre1Inconnue({ valeursRelatives: true })
 * // eq.egalite -->  "-2x+3=x-9"
 * // eq.reponse -->  4
 * // eq.correction --> chaîne LaTeX prête à l'emploi
 *
 * @example
 * // Équation imposée : 3x + 2 = x - 4  →  solution : -3
 * const eq = equation1erDegre1Inconnue({
 *   valeursRelatives: true,
 *   a: 3, b: 2, c: 1, d: -4,
 * })
 * // eq.reponse --> -3
 *
 * @example
 * // Équation avec inconnue personnalisée et divisibilité forcée
 * const eq = equation1erDegre1Inconnue({
 *   valeursRelatives: false,
 *   divisiblePar: 3,
 *   inconnue: 't',
 * })
 * // eq.membreDeGauche --> "6t+9"
 *
 * @author Guillaume Valmont
 * Eric Elter a rajouté la possibilité de choisir a, b, c, d, inconnue
 * Eric Elter a permis la sortie en fraction quand a, b, c et d choisi.
 */

export const equation1erDegre1Inconnue = (
  options: {
    valeursRelatives: boolean
    divisiblePar?: number
    type?: 'x+b=d' | 'ax=d' | 'ax+b=0' | 'ax+b=d' | 'ax+b=cx+d'
    a?: number
    b?: number
    c?: number
    d?: number
    inconnue?: string
  } = {
    valeursRelatives: false,
    divisiblePar: 1,
    type: 'ax+b=cx+d',
  },
) => {
  let a: Decimal = options.a != null ? new Decimal(options.a) : new Decimal(999)
  let b: Decimal = options.b != null ? new Decimal(options.b) : new Decimal(999)
  let c: Decimal = options.c != null ? new Decimal(options.c) : new Decimal(999)
  let d: Decimal = options.d != null ? new Decimal(options.d) : new Decimal(999)
  let type = options.type != null ? options.type : 'ax+b=cx+d'
  if (b.isZero()) type = 'ax=d'
  else if (a.toNumber() === 1) type = 'x+b=d'
  else if (c.isZero() && d.isZero()) type = 'ax+b=0'
  else if (c.isZero()) type = 'ax+b=d'
  else type = 'ax+b=cx+d'

  let reponse: FractionEtendue | Decimal
  const inconnue = options.inconnue ?? 'x'
  switch (type) {
    case 'x+b=d':
      if (options.a == null) a = new Decimal(1)
      if (options.c == null) c = new Decimal(0)
      if (options.b == null)
        b = new Decimal(randint(-9, 9, [0])).times(options.divisiblePar ?? 1)
      if (options.d == null)
        d = new Decimal(randint(-16, 15, 0)).times(options.divisiblePar ?? 1)
      if (!options.valeursRelatives) {
        d = d.abs()
      }
      reponse = d.minus(b)
      break

    case 'ax=d':
      if (options.b == null) b = new Decimal(0)
      if (options.c == null) c = new Decimal(0)
      if (options.a != null && options.d != null)
        reponse = new FractionEtendue(options.d, options.a)
      else {
        if (options.valeursRelatives) {
          if (options.a == null) a = new Decimal(randint(-9, 9, [0, -1, 1]))
          reponse = new Decimal(randint(-9, 9, [-1, 0, 1]))
        } else {
          if (options.a == null) a = new Decimal(randint(2, 15))
          reponse = new Decimal(randint(2, 9))
        }
        if (options.d == null) d = a.times(reponse)
      }
      break

    case 'ax+b=0':
    case 'ax+b=d':
      if (options.a != null && options.b != null)
        reponse = new FractionEtendue(
          (options.d != null ? options.d : 0) - options.b,
          options.a,
        )
      else {
        do {
          if (options.c == null) c = new Decimal(0)
          if (type === 'ax+b=0') {
            if (options.d == null) d = new Decimal(0)
          } else {
            if (options.d == null)
              d = new Decimal(randint(-9, 9, [0])).times(
                options.divisiblePar ?? 1,
              )
          }
          reponse = new Decimal(randint(-5, 5, [0, -1, 1]))
          if (options.a == null)
            a = new Decimal(randint(-5, 5, [-1, 0, 1])).times(
              options.divisiblePar ?? 1,
            )
          if (!options.valeursRelatives) {
            reponse = reponse.abs()
            if (options.a == null) a = a.abs()
            if (options.d == null) d = d.abs()
          }
          if (options.b == null) b = d.minus(a.times(reponse))
        } while (b.equals(0))
      }
      break

    case 'ax+b=cx+d':
    default:
      if (
        options.a != null &&
        options.b != null &&
        options.c != null &&
        options.d != null
      )
        reponse = new FractionEtendue(
          options.d - options.b,
          options.a - options.c,
        )
      else {
        if (options.d == null)
          d = new Decimal(randint(-15, 15, 0)).times(options.divisiblePar ?? 1)
        if (options.c == null)
          c = new Decimal(randint(-5, 5, [-1, 0, 1])).times(
            options.divisiblePar ?? 1,
          )
        if (!options.valeursRelatives) {
          if (options.c == null) c = c.abs()
          if (options.a == null)
            a = new Decimal(randint(2, 5))
              .times(options.divisiblePar ?? 1)
              .plus(c)
          reponse = new Decimal(
            randint(-9, 9, [0, -1, 1, -d.div(c.minus(a))]),
          ).abs()
        } else {
          if (options.a == null)
            a = new Decimal(randint(-5, 5, [-c, -c + 1, -c - 1, 0]))
              .times(options.divisiblePar ?? 1)
              .plus(c)
          reponse = new Decimal(randint(-9, 9, [0, -1, 1, -d.div(c.minus(a))]))
        }
        if (options.b == null) b = c.minus(a).times(reponse).plus(d)
      }
      break
  }
  const membreDeGauche = a.equals(0)
    ? b
    : `${rienSi1(a)}${inconnue}${b.equals(0) ? '' : ecritureAlgebrique(b)}`
  const membreDeDroite = c.equals(0)
    ? d
    : `${rienSi1(c)}${inconnue}${d.equals(0) ? '' : ecritureAlgebrique(d)}`
  const egalite = `${membreDeGauche}=${membreDeDroite}`
  let correction = ''
  let correctionDetaillee = ''
  if (!c.equals(0)) {
    if (c.greaterThan(0)) {
      correctionDetaillee += `On soustrait $${rienSi1(c)}${inconnue}$ aux deux membres.<br>`
    } else {
      correctionDetaillee += `On ajoute $${rienSi1(-c)}${inconnue}$ aux deux membres.<br>`
    }
    const soustraireCx = `$${rienSi1(a)}${inconnue}${ecritureAlgebrique(b)}${miseEnEvidence(signe(-c) + rienSi1(abs(c)) + inconnue)}=${texNombre(c)}${inconnue}${ecritureAlgebrique(d)}${miseEnEvidence(signe(-c) + rienSi1(abs(c)) + inconnue)}$<br>
      $${rienSi1(a.minus(c))}${inconnue}${ecritureAlgebrique(b)}=${texNombre(d)}$<br>`
    correction += soustraireCx
    correctionDetaillee += soustraireCx
  }
  if (!b.equals(0)) {
    if (b.greaterThan(0)) {
      correctionDetaillee += `On soustrait $${b}$ aux deux membres.<br>`
    } else {
      correctionDetaillee += `On ajoute $${texNombre(-b)}$ aux deux membres.<br>`
    }
    const soustraireB = `$${rienSi1(a.minus(c))}${inconnue}${ecritureAlgebrique(b)}${miseEnEvidence(ecritureAlgebrique(-b))}=${texNombre(d)}${miseEnEvidence(ecritureAlgebrique(-b))}$<br>
      $${rienSi1(a.minus(c))}${inconnue}=${texNombre(d.minus(b))}$<br>`
    correction += soustraireB
    correctionDetaillee += soustraireB
  }
  if (!a.minus(c).equals(1)) {
    correctionDetaillee += `On divise les deux membres par $${texNombre(a.minus(c))}$.<br>`
    let diviserParA = `$${rienSi1(a.minus(c))}${inconnue}${miseEnEvidence('\\div' + ecritureParentheseSiNegatif(a.minus(c)))}=${texNombre(d.minus(b)) + miseEnEvidence('\\div' + ecritureParentheseSiNegatif(a.minus(c)))}$<br>
      $${inconnue}=${texFractionFromString(texNombre(d.minus(b)), texNombre(a.minus(c)))}`

    const estDecimal =
      reponse instanceof FractionEtendue
        ? new FractionEtendue(100 * reponse.num, reponse.den).estEntiere
        : true
    diviserParA +=
      reponse instanceof FractionEtendue
        ? estDecimal
          ? `=${texNombre(arrondi(reponse.toNumber(), 2))}`
          : `\\approx ${texNombre(arrondi(reponse.toNumber(), 2))}`
        : `=${reponse}`
    diviserParA += `$<br>`
    correction += diviserParA
    correctionDetaillee += diviserParA
  }
  const correctionSansConclusion = correction
  const correctionSansConclusionDetaillee = correctionDetaillee
  const conclusion = `La solution de l'équation $${egalite}$ est $${miseEnEvidence(reponse instanceof FractionEtendue ? reponse.texFSP : texNombre(reponse))}$.`
  correction += conclusion
  correctionDetaillee += conclusion
  return {
    membreDeGauche: String(membreDeGauche),
    membreDeDroite: String(membreDeDroite),
    egalite,
    reponse: reponse instanceof Decimal ? reponse.toNumber() : reponse,
    reponseDecimale:
      reponse instanceof Decimal
        ? reponse.toNumber()
        : arrondi(reponse.valeurDecimale, 2),
    correction,
    correctionDetaillee,
    correctionSansConclusion,
    correctionSansConclusionDetaillee,
    a: a.toNumber(),
    aDecimal: a,
    b: b.toNumber(),
    bDecimal: b,
    c: c.toNumber(),
    cDecimal: c,
    d: d.toNumber(),
    dDecimal: d,
  }
}
