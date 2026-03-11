import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import type { NestedObjetMathalea2dArray } from '../../types/2d'
import { BoiteBuilder } from '../2d/BoiteBuilder'
import { colorToLatexOrHTML } from '../2d/colorToLatexOrHtml'
import { fixeBordures } from '../2d/fixeBordures'
import { point } from '../2d/PointAbstrait'
import { polygone } from '../2d/polygones'
import { segment } from '../2d/segmentsVecteurs'
import { latex2d } from '../2d/textes'
import { tracePoint } from '../2d/TracePoint'
import { milieu } from '../2d/utilitairesPoint'
import { vide2d } from '../2d/Vide2d'
import { shuffle } from '../outils/arrayOutils'
import { texNombre } from '../outils/texNombre'

/**
 * Classe pour les statistiques descriptives
 * Accepte une série de nombres ou une série de paires [valeur, effectif]
 * Fournit des méthodes pour calculer la moyenne, la variance, l'écart-type, la médiane, le mode, le min, le max, l'étendue et le coefficient de variation
 * Inclut également des méthodes statiques pour effectuer les mêmes calculs sur un tableau de nombres
 * @author Jean-Claude Lhote (aidé par GPT-5 mini)
 */
export default class Stat {
  serie: (number | string)[]
  serieTableau: [number, number][] | [string, number][]
  isQualitative: boolean = false
  constructor(
    serie: Array<number | string | [number | string, number]>,
    isQualitative = false,
    shuffled = true,
  ) {
    if (!Array.isArray(serie) || serie.length === 0) {
      throw new Error('La série doit être un array non vide')
    }

    // Construire flatSerie en acceptant soit des valeurs simples, soit des paires [valeur, effectif]
    const flatSerie: (number | string)[] = []
    for (const el of serie) {
      if (Array.isArray(el)) {
        if (el.length !== 2) {
          throw new Error('Chaque paire doit être [valeur, effectif]')
        }
        const [val, freq] = el as [number | string, number]
        if (typeof freq !== 'number' || !isFinite(freq) || freq < 0) {
          throw new Error("L'effectif doit être un nombre positif")
        }
        const n = Math.floor(freq)
        for (let i = 0; i < n; i++) {
          flatSerie.push(val)
        }
      } else {
        flatSerie.push(el as number | string)
      }
    }

    if (flatSerie.length === 0) {
      throw new Error('Après expansion, la série est vide')
    }

    // Déterminer homogénéité et type final
    const hasString = flatSerie.some((v) => typeof v === 'string')

    let processed: (number | string)[]
    let inferredQualitative: boolean
    if (hasString) {
      // si au moins une valeur n'est pas numérique, tout convertir en string -> qualitatif
      processed = flatSerie.map((v) => String(v))
      inferredQualitative = true
    } else {
      // tout numérique
      processed = flatSerie.map((v) => Number(v))
      inferredQualitative = false
    }

    // Respecter le paramètre isQualitative s'il est fourni, sinon utiliser l'inférence
    this.isQualitative =
      typeof isQualitative === 'boolean' ? isQualitative : inferredQualitative

    // stocker la série (mélangée pour éviter biais d'ordre)
    if (shuffled) {
      this.serie = shuffle(processed)
    } else {
      this.serie = processed
    }

    // construire this.serieTableau : tableau [valeur, effectif]
    const counts = new Map<number | string, number>()
    for (const v of this.serie) {
      counts.set(v, (counts.get(v) || 0) + 1)
    }

    if (this.isQualitative) {
      this.serieTableau = Array.from(counts.entries()).map(([val, f]) => [
        String(val),
        f,
      ]) as [string, number][]
    } else {
      this.serieTableau = Array.from(counts.entries()).map(([val, f]) => [
        Number(val as number),
        f,
      ]) as [number, number][]
      // s'assurer que les paires sont ordonnées par valeur croissante pour les séries quantitatives
      ;(this.serieTableau as [number, number][]).sort((a, b) => a[0] - b[0])
    }
  }

  moyenne(): number {
    if (this.isQualitative) {
      throw new Error('Moyenne non définie : la série est qualitative')
    }
    const tableau = (this.serie as number[]).map(Number)
    const somme = tableau.reduce((acc, val) => acc + val, 0)
    return somme / tableau.length
  }

  variance(): number {
    if (this.isQualitative) {
      throw new Error('Variance non définie : la série est qualitative')
    }
    const moyenne = this.moyenne()
    const sommeDesCarres = (this.serie as number[]).reduce(
      (acc, val) => acc + Math.pow(Number(val) - moyenne, 2),
      0,
    )
    return sommeDesCarres / (this.serie as number[]).length
  }

  ecartType(): number {
    if (this.isQualitative) {
      throw new Error('Écart-type non défini : la série est qualitative')
    }
    return Math.sqrt(this.variance())
  }

  mediane(): number {
    if (this.isQualitative) {
      throw new Error('Médiane non définie : la série est qualitative')
    }
    const sorted = [...(this.serie as number[])]
      .map(Number)
      .sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2
    } else {
      return sorted[mid]
    }
  }

  // helper pour calculer médiane d'un tableau numérique (intern)
  private medianeArray(tableau: number[]): number {
    const sorted = [...tableau].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2
    } else {
      return sorted[mid]
    }
  }

  mode(): number[] {
    if (this.isQualitative) {
      throw new Error(
        'Mode (numérique) : la série est qualitative — utiliser this.serieTableau pour les modalités',
      )
    }
    const frequencyMap: { [key: number]: number } = {}
    for (const num of this.serie as number[]) {
      const k = Number(num)
      frequencyMap[k] = (frequencyMap[k] || 0) + 1
    }
    const maxFrequency = Math.max(...Object.values(frequencyMap))
    return Object.keys(frequencyMap)
      .filter((key) => frequencyMap[Number(key)] === maxFrequency)
      .map(Number)
  }

  min(): number {
    if (this.isQualitative) {
      throw new Error('Min non défini : la série est qualitative')
    }
    return Math.min(...(this.serie as number[]).map(Number))
  }

  max(): number {
    if (this.isQualitative) {
      throw new Error('Max non défini : la série est qualitative')
    }
    return Math.max(...(this.serie as number[]).map(Number))
  }

  etendue(): number {
    if (this.isQualitative) {
      throw new Error('Étendue non définie : la série est qualitative')
    }
    return this.max() - this.min()
  }

  coefVariation(): number {
    if (this.isQualitative) {
      throw new Error(
        'Coefficient de variation non défini : la série est qualitative',
      )
    }
    return this.ecartType() / this.moyenne()
  }

  get q1(): number {
    return this.quartiles().q1
  }

  get q3(): number {
    return this.quartiles().q3
  }

  quartiles(): { q1: number; q2: number; q3: number } {
    if (this.isQualitative) {
      throw new Error('Quartiles non définis : la série est qualitative')
    }
    const values = [...(this.serie as number[])]
      .map(Number)
      .sort((a, b) => a - b)
    const n = values.length
    const mid = Math.floor(n / 2)
    const lower = n % 2 === 0 ? values.slice(0, mid) : values.slice(0, mid)
    const upper = n % 2 === 0 ? values.slice(mid) : values.slice(mid + 1)
    const q1 = lower.length ? this.medianeArray(lower) : values[0]
    const q2 = this.medianeArray(values)
    const q3 = upper.length
      ? this.medianeArray(upper)
      : values[values.length - 1]
    return { q1, q2, q3 }
  }

  ecartInterQuartile(): number {
    if (this.isQualitative) {
      throw new Error(
        'Écart interquartile non défini : la série est qualitative',
      )
    }
    const { q1, q3 } = this.quartiles()
    return q3 - q1
  }

  serieTriee(): number[] {
    if (this.isQualitative) {
      throw new Error(
        'Série triée (numérique) non disponible : la série est qualitative',
      )
    }
    return [...(this.serie as number[])].map(Number).sort((a, b) => a - b)
  }

  /**
   * Calcule les éléments nécessaires pour tracer une boite à moustache (boxplot)
   * Retourne q1, q2, q3, iqr, fences, whiskers, outliers, min, max, l'étendue et les valeurs triées
   */
  boiteAMoustache(): {
    q1: number
    q2: number
    q3: number
    iqr: number
    borneInferieure: number
    borneSuperieure: number
    moustacheInferieure: number
    moustacheSuperieure: number
    valeursAberrantes: number[]
    min: number
    max: number
    valeurs: number[]
  } {
    if (this.isQualitative) {
      throw new Error(
        'Boîte à moustache non applicable : la série est qualitative',
      )
    }
    const values = [...(this.serie as number[])]
      .map(Number)
      .sort((a, b) => a - b)
    const n = values.length
    const mid = Math.floor(n / 2)
    const lower = n % 2 === 0 ? values.slice(0, mid) : values.slice(0, mid)
    const upper = n % 2 === 0 ? values.slice(mid) : values.slice(mid + 1)
    const q1 = lower.length ? this.medianeArray(lower) : values[0]
    const q2 = this.medianeArray(values)
    const q3 = upper.length
      ? this.medianeArray(upper)
      : values[values.length - 1]
    const iqr = q3 - q1
    const borneInferieure = q1 - 1.5 * iqr
    const borneSuperieure = q3 + 1.5 * iqr
    const moustacheInferieure =
      values.find((v) => v >= borneInferieure) ?? values[0]
    const moustacheSuperieure =
      [...values].reverse().find((v) => v <= borneSuperieure) ??
      values[values.length - 1]
    const valeursAberrantes = values.filter(
      (v) => v < moustacheInferieure || v > moustacheSuperieure,
    )
    return {
      q1,
      q2,
      q3,
      iqr,
      borneInferieure,
      borneSuperieure,
      moustacheInferieure,
      moustacheSuperieure,
      valeursAberrantes,
      min: values[0],
      max: values[values.length - 1],
      valeurs: values,
    }
  }

  traceBoiteAMoustache({
    size = 10,
    height = 4,
    legendeOn = true,
    valeursOn = true,
    echelle = 1,
  }: {
    size?: number
    height?: number
    legendeOn?: boolean
    valeursOn?: boolean
    echelle?: number
  }): string {
    if (this.isQualitative) {
      throw new Error(
        'Trace boîte à moustache non applicable : la série est qualitative',
      )
    }

    const boxplotData = this.boiteAMoustache()
    const etendue = boxplotData.max - boxplotData.min
    const scale = etendue / size

    const extremiteDroite = point(-1, 0)
    const extremiteGauche = point(size + 1, 0)
    const minPoint = point(0, 0)
    const maxPoint = point(size, 0)
    const q1Point = point(
      (size * (boxplotData.q1 - boxplotData.min)) / etendue,
      0,
    )
    const q2Point = point(
      (size * (boxplotData.q2 - boxplotData.min)) / etendue,
      0,
    )
    const q3Point = point(
      (size * (boxplotData.q3 - boxplotData.min)) / etendue,
      0,
    )
    const minDownPoint = point(minPoint.x, echelle * 0.8)
    const minUpPoint = point(minPoint.x, 2.4 * echelle)
    const maxDownPoint = point(maxPoint.x, echelle * 0.8)
    const maxUpPoint = point(maxPoint.x, 2.4 * echelle)
    const minMiddlePoint = milieu(minDownPoint, minUpPoint)
    const maxMiddlePoint = milieu(maxDownPoint, maxUpPoint)
    const q1DownPoint = point(q1Point.x, echelle * 0.8)
    const q1UpPoint = point(q1Point.x, 2.4 * echelle)
    const q2DownPoint = point(q2Point.x, echelle * 0.8)
    const q2UpPoint = point(q2Point.x, 2.4 * echelle)
    const q3DownPoint = point(q3Point.x, echelle * 0.8)
    const q3UpPoint = point(q3Point.x, 2.4 * echelle)
    const q1MiddlePoint = milieu(q1DownPoint, q1UpPoint)
    const q3MiddlePoint = milieu(q3DownPoint, q3UpPoint)
    const lineMin = segment(minDownPoint, minUpPoint, 'blue')
    const lineMax = segment(maxDownPoint, maxUpPoint, 'blue')
    const lineQ2 = segment(q2DownPoint, q2UpPoint, 'blue')
    const lineQ0Q1 =
      minMiddlePoint.x === q1MiddlePoint.x
        ? vide2d()
        : segment(minMiddlePoint, q1MiddlePoint, 'blue')
    const lineQ3Q4 =
      q3MiddlePoint.x === maxMiddlePoint.x
        ? vide2d()
        : segment(q3MiddlePoint, maxMiddlePoint, 'blue')
    lineMin.epaisseur = 2
    lineMax.epaisseur = 2
    lineQ2.epaisseur = 2
    lineQ0Q1.epaisseur = 2
    lineQ3Q4.epaisseur = 2
    const box = polygone(
      [q1DownPoint, q1UpPoint, q3UpPoint, q3DownPoint],
      'blue',
    )
    box.epaisseur = 2
    box.couleurDeRemplissage = colorToLatexOrHTML('blue')
    box.opaciteDeRemplissage = 0.15

    const lineBase = segment(extremiteDroite, extremiteGauche)
    lineBase.epaisseur = 1
    lineBase.styleExtremites = '->'
    lineBase.couleur = 'black'
    const plots = tracePoint(q1Point, q2Point, q3Point, minPoint, maxPoint)
    plots.taille = 2
    plots.epaisseur = 2
    plots.style = '.'
    // Ajout des différents éléments à tracer
    const objetsToTrace: NestedObjetMathalea2dArray = [
      lineBase,
      plots,
      lineMin,
      lineMax,
      lineQ2,
      lineQ0Q1,
      lineQ3Q4,
      box,
    ]
    // Ajout des étiquettes (valeurs numériques)
    if (valeursOn) {
      objetsToTrace.push(
        latex2d(texNombre(boxplotData.min), minPoint.x, minPoint.y - 0.8, {
          letterSize: 'scriptsize',
        }),
        latex2d(texNombre(boxplotData.q1), q1Point.x, q1Point.y - 0.8, {
          letterSize: 'scriptsize',
        }),
        latex2d(texNombre(boxplotData.q2), q2Point.x, q2Point.y - 0.8, {
          letterSize: 'scriptsize',
        }),
        latex2d(texNombre(boxplotData.q3), q3Point.x, q3Point.y - 0.8, {
          letterSize: 'scriptsize',
        }),
        latex2d(texNombre(boxplotData.max), maxPoint.x, maxPoint.y - 0.8, {
          letterSize: 'scriptsize',
        }),
      )
    }
    // Ajout des étiquettes (noms)
    if (legendeOn) {
      objetsToTrace.push(
        latex2d('\\text{Min}', minPoint.x, minPoint.y - 1.6, {
          letterSize: 'scriptsize',
        }),
        latex2d('Q_1', q1Point.x, q1Point.y - 1.6, {
          letterSize: 'scriptsize',
        }),
        latex2d('\\text{Méd}', q2Point.x, q2Point.y - 1.6, {
          letterSize: 'scriptsize',
        }),
        latex2d('Q_3', q3Point.x, q3Point.y - 1.6, {
          letterSize: 'scriptsize',
        }),
        latex2d('\\text{Max}', maxPoint.x, maxPoint.y - 1.6, {
          letterSize: 'scriptsize',
        }),
      )
    }
    if (context.isHtml) {
      return mathalea2d(
        Object.assign({}, fixeBordures(objetsToTrace)),
        objetsToTrace,
      )
    } else {
      return ` \\begin{tikzpicture}[every node/.style={inner sep=0pt,font=\\scriptsize},%
      boxplot prepared/every whisker/.style={ultra thick}]
    \\begin{axis}[
        clip=false,
        y=1cm,
        ymin=-0.5cm,
        xmin=${boxplotData.min - scale},
        xmax=${boxplotData.max + scale},
        height=${height}cm,
        width=${size / 2}cm,
        ytick=\\empty,
        axis y line=left,
        axis x line=middle,
        xtick = \\empty,
        y axis line style={draw=none},
        enlarge y limits={abs=5mm},
      ]
      \\addplot+[
        boxplot prepared ={
            every box/.style={ultra thick,fill=blue!15},
            every whisker/.style={ultra thick},
            every median/.style={ultra thick},
            lower whisker=${boxplotData.moustacheInferieure},
            lower quartile=${boxplotData.q1},
            median=${boxplotData.q2},
            upper quartile=${boxplotData.q3},
            upper whisker=${boxplotData.moustacheSuperieure},
          },
      ] coordinates {};
      \\foreach \\x/\\name [count=\\xi from 0] in {${boxplotData.min}/Min,${boxplotData.q1}/Q1,${boxplotData.q2}/Méd,${boxplotData.q3}/Q3,${boxplotData.max}/Max} {
          \\edef\\temp{\\noexpand\\fill (\\x,0) coordinate (a\\xi) circle (2pt);
            ${valeursOn ? '\\noexpand\\node[below=2mm of a\\xi] {\\x};' : ''}
            ${legendeOn ? '\\noexpand\\node[below=4mm of a\\xi]  {\\name};' : ''}
          }
          \\temp
        }
    \\end{axis}
  \\end{tikzpicture}
`
    }
  }

  listeSerie({
    precision = 2,
    separateur = '; ',
    triee = false,
    tableau = false,
    motValeurs = 'Valeurs',
  } = {}): string {
    const escapeLatex = (s: string) =>
      String(s).replace(/([%&$#_{}\\^~])/g, '\\$1')

    if (!tableau) {
      // affichage linéaire : gérer qualitatives et numériques séparément
      if (this.isQualitative) {
        const arr = triee
          ? [...this.serie].map(String).sort()
          : this.serie.slice()
        return arr
          .map((v) => `$\\text{${escapeLatex(String(v))}}$`)
          .join(separateur)
      } else {
        const arr = triee ? this.serieTriee() : (this.serie as number[])
        return arr
          .map((n) => `$${texNombre(Number(n), precision)}$`)
          .join(separateur)
      }
    } else {
      // mode tableau : construire lignes valeurs / effectifs en tenant compte du type
      const entries = this.serieTableau as Array<[number | string, number]>
      const nCols = entries.length
      const valuesRow = entries
        .map(([v]) =>
          this.isQualitative
            ? `\\text{${escapeLatex(String(v))}}`
            : texNombre(Number(v), precision),
        )
        .join(' & ')
      const effectsRow = entries.map(([, f]) => String(f)).join(' & ')
      const cols = '|l|' + 'c|'.repeat(nCols)
      return `$\\begin{array}{${cols}}
\\hline
\\text{${motValeurs}} & ${valuesRow} \\\\ \\hline
\\text{effectifs} & ${effectsRow} \\\\ \\hline
\\end{array}$`
    }
  }

  diagramme({
    cumul = false,
    croissance = true,
    barres = true,
    percentVsEffectifs = false,
    effectifsOn = false,
    valuesOn = true,
  } = {}) {
    const precision = 2
    // copier et trier selon croissance
    // Distinction explicite entre série qualitative et quantitative :
    // - qualitative : conserver l'ordre d'entrée (ou l'inverser si croissance=false)
    // - quantitative : trier numériquement par valeur (croissance ou décroissance)
    let pairs: Array<[number | string, number]> = (
      this.serieTableau as Array<[number | string, number]>
    ).slice()
    if (this.isQualitative) {
      if (!croissance) pairs.reverse()
    } else {
      pairs = (pairs as [number, number][])
        .slice()
        .sort((a, b) => (croissance ? a[0] - b[0] : b[0] - a[0]))
    }

    const total = pairs.reduce((s, [, f]) => s + f, 0)
    // calcul des valeurs à tracer (effectifs ou pourcentages / cumul)
    const ys: number[] = []
    if (cumul) {
      let acc = 0
      for (const [, f] of pairs) {
        acc += f
        ys.push(percentVsEffectifs ? (acc / total) * 100 : acc)
      }
    } else {
      for (const [, f] of pairs) {
        ys.push(percentVsEffectifs ? (f / total) * 100 : f)
      }
    }

    // labels et positions x
    const xs = pairs.map(([v]) => v)
    const labelsTex = pairs.map(([v]) =>
      this.isQualitative ? String(v) : texNombre(Number(v), precision),
    )

    // construire coords selon qualitative / quantitative
    let coords = ''
    if (this.isQualitative) {
      // utiliser labels symboliques
      coords = labelsTex
        .map((lab, i) => `(${lab},${Number(ys[i].toFixed(3))})`)
        .join(' ')
    } else {
      // positions numériques respectant l'échelle
      coords = xs
        .map((x, i) => `(${Number(x).toFixed(6)},${Number(ys[i].toFixed(6))})`)
        .join(' ')
    }

    const yName = percentVsEffectifs ? 'fréquences' : 'effectifs'
    const ylabel = percentVsEffectifs ? 'Fréquences en \\%' : 'Effectifs'
    const title = `${
      barres
        ? cumul
          ? `diagramme cumulé (${croissance ? 'croissant' : 'décroissant'})`
          : 'Diagramme en barres'
        : cumul
          ? `Polygone des ${yName} cumulé${yName === 'fréquences' ? 'es' : 's'} (${croissance ? 'croissantes' : 'décroissantes'})`
          : `Polygone des ${yName}`
    } `

    if (context.isHtml) {
      // code HTML existant inchangé
      const yMax = 8
      const nbValeursDifferentes = this.serieTableau.length
      const nbValeurs = this.serie.length
      const echelleYCumul = nbValeurs < 15 ? 2 : nbValeurs < 30 ? 5 : 10
      const echelleYPercent = 25
      const effectifMax = Math.max(...ys)
      const gridOpacity = 0.5
      const topCadre = 8.7
      // Pour les séries qualitatives, les valeurs x sont des positions 1..N
      let min: number, max: number
      if (this.isQualitative) {
        min = 0
        max = (this.serieTableau as [any, number][]).length + 1
      } else {
        const numericSerie = (this.serie as number[]).map(Number)
        min = Math.min(...numericSerie) - 1
        max = Math.max(...numericSerie) + 1
      }

      const echelleY = effectifMax < 15 ? 2 : effectifMax < 30 ? 3 : 4
      let yLabelsAndOrdinate: [number, number][] = []
      if (percentVsEffectifs) {
        yLabelsAndOrdinate = Array.from({ length: 5 }, (_, i) => [
          i * 25,
          (i * echelleYPercent * yMax) / 100,
        ])
      } else {
        if (cumul) {
          yLabelsAndOrdinate = Array.from(
            {
              length: Math.ceil(nbValeurs / echelleYCumul) + 1,
            },
            (_, i) => [i * echelleYCumul, (i * 8 * echelleYCumul) / nbValeurs],
          )
        } else {
          yLabelsAndOrdinate = Array.from({
            length: Math.ceil((effectifMax + 1) / echelleY),
          }).map((_, i) => [i * echelleY, (i * 8 * echelleY) / effectifMax])
        }
      }

      const cadre = new BoiteBuilder({
        xMin: 0,
        xMax: (max - min) * 2,
        yMin: 0,
        yMax: topCadre,
      }).render()

      const histo: NestedObjetMathalea2dArray = [cadre]
      for (const [i, yPos] of yLabelsAndOrdinate) {
        histo.push(
          latex2d(`${texNombre(i, 0)}`, -0.5, yPos + 0.1, {
            letterSize: 'scriptsize',
          }),
        )
      }
      for (const yLabel of yLabelsAndOrdinate) {
        const line = segment(
          point(0, yLabel[1]),
          point((nbValeursDifferentes + 1) * 2, yLabel[1]),
          'lightgray',
        )
        line.opacite = gridOpacity
        histo.push(line)
      }
      let xPosNext = 0
      let xPos = 0
      let yPos = 0
      let yPosNext = 0
      for (let i = 0; i < pairs.length; i++) {
        // normaliser la valeur courante et la suivante selon le type de série
        const [valRaw /* number|string */ /* freq */] = pairs[i]
        const nextRaw = i < pairs.length - 1 ? pairs[i + 1][0] : pairs[i][0]
        // convertir en nombre uniquement si la série est quantitative
        const valNum = this.isQualitative ? NaN : Number(valRaw)
        const nextNum = this.isQualitative ? NaN : Number(nextRaw)

        xPos = this.isQualitative ? (i + 1) * 2 : (valNum - min) * 2 + 1
        xPosNext = this.isQualitative ? (i + 2) * 2 : (nextNum - min) * 2 + 1
        yPos = cumul
          ? percentVsEffectifs
            ? (ys[i] * yMax) / 100
            : (ys[i] * yMax) / nbValeurs
          : percentVsEffectifs
            ? (ys[i] * yMax) / 100
            : (ys[i] * yMax) / effectifMax
        if (i < pairs.length - 1) {
          yPosNext = cumul
            ? percentVsEffectifs
              ? (ys[i + 1] * yMax) / 100
              : (ys[i + 1] * yMax) / nbValeurs
            : percentVsEffectifs
              ? (ys[i + 1] * yMax) / 100
              : (ys[i + 1] * yMax) / effectifMax
        } else {
          yPosNext = yPos
        }
        const verticalLine = segment(
          point(xPos, 0),
          point(xPos, topCadre),
          'lightgray',
        )
        verticalLine.epaisseur = 1
        verticalLine.opacite = gridOpacity

        histo.push(verticalLine)
        if (barres) {
          const barre = new BoiteBuilder({
            xMin: xPos - 0.2,
            xMax: xPos + 0.2,
            yMin: 0,
            yMax: yPos,
          })
            .addColor({
              color: 'blue',
              colorBackground: '#9699FF',
              backgroudOpacity: 1,
            })
            .render()

          histo.push(barre)
        } else {
          if (i < pairs.length - 1) {
            const line = segment(
              point(xPos, yPos),
              point(xPosNext, yPosNext),
              'blue',
            )
            line.epaisseur = 2
            line.opacite = 0.5
            histo.push(line)
          }
        }
        if (effectifsOn) {
          const effectifTex = latex2d(
            `${texNombre(ys[i], 0)}${percentVsEffectifs ? '\\%' : ''}`,
            xPos,
            yPos + 0.5,
            { letterSize: 'scriptsize' },
          )
          histo.push(effectifTex)
        }
        if (valuesOn) {
          // afficher la valeur : texte brut pour qualitative, format numérique sinon
          const label = this.isQualitative
            ? String(valRaw)
            : texNombre(valNum, precision)
          histo.push(
            latex2d(label, xPos, -0.5, {
              letterSize: 'scriptsize',
            }),
          )
        }
        const texLabel = latex2d(`\\text{${ylabel}}`, -1.5, topCadre / 2, {
          letterSize: 'normalsize',
          orientation: 90,
          opacity: 0.7,
        })
        histo.push(texLabel)
        const texteTitle = latex2d(
          `\\text{${title}}`,
          nbValeursDifferentes + 1,
          topCadre + 0.5,
          {
            letterSize: 'normalsize',
            opacity: 0.7,
          },
        )
        histo.push(texteTitle)
      }

      return mathalea2d(
        Object.assign({ style: 'display: inline-block' }, fixeBordures(histo)),
        histo,
      )
    } else {
      // choisir le style (barres ou polygone)
      const addplot = barres
        ? `\\addplot+[ybar, bar width=${(() => {
            if (this.isQualitative) return '12pt'
            // convertir les xs en nombres puis trier (filtrer les NaN par sécurité)
            const xsNumeric = xs
              .map((v) => Number(v))
              .filter((n) => Number.isFinite(n))
              .slice()
              .sort((a, b) => a - b)
            if (xsNumeric.length < 2) return '12pt'
            let minDiff = Infinity
            for (let i = 0; i < xsNumeric.length - 1; i++) {
              minDiff = Math.min(minDiff, xsNumeric[i + 1] - xsNumeric[i])
            }
            // bar width en unités x (60% du pas minimal)
            return `${(minDiff * 0.6).toFixed(6)}`
          })()}, draw=black, fill=blue!40] coordinates { ${coords} };`
        : `\\addplot+[sharp plot, thick, mark=*, mark options={fill=blue}] coordinates { ${coords} };`

      // Options conditionnelles pour pgfplots selon les flags fournis
      const axisOptionsArr: string[] = []
      axisOptionsArr.push(`title={${title}}`)
      axisOptionsArr.push(`ylabel={${ylabel}}`)
      axisOptionsArr.push(`xlabel={Valeurs}`)
      axisOptionsArr.push(`ymin=0`)
      axisOptionsArr.push(`enlarge x limits=0.15`)
      axisOptionsArr.push(`grid=major`)
      axisOptionsArr.push(`width=12cm`)
      axisOptionsArr.push(`height=6cm`)
      // nodes near coords / formatage des effectifs
      if (effectifsOn) {
        if (percentVsEffectifs) {
          axisOptionsArr.push(
            'nodes near coords={\\pgfmathprintnumber[fixed,precision=0]{\\pgfplotspointmeta}\\%}',
          )
        } else {
          axisOptionsArr.push('nodes near coords')
        }
        axisOptionsArr.push(
          'nodes near coords align={vertical}',
          'every node near coord/.append style={font=\\scriptsize}',
        )
      }
      // gestion des valeurs sur l'axe des x
      if (this.isQualitative) {
        if (valuesOn) {
          axisOptionsArr.push(
            `symbolic x coords={${labelsTex.join(',')}}`,
            'xtick=data',
          )
        } else {
          axisOptionsArr.push(
            'symbolic x coords={' + labelsTex.join(',') + '}',
            'xtick=\\empty',
          )
        }
      } else {
        // axe quantitatif : positions numériques, xticks positionnés sur xs si valuesOn
        // convertir xs en nombres (sécurité contre valeurs qualitatives) et filtrer les NaN
        const xsNumeric = xs
          .map((v) => Number(v))
          .filter((n) => Number.isFinite(n))
          .slice()
          .sort((a, b) => a - b)

        // fallback si conversion impossible
        const xmin = xsNumeric.length ? xsNumeric[0] : 0
        const xmax = xsNumeric.length ? xsNumeric[xsNumeric.length - 1] : 1

        axisOptionsArr.push(
          `xmin=${Number((xmin - (xmax - xmin) * 0.05).toFixed(6))}`,
        )
        axisOptionsArr.push(
          `xmax=${Number((xmax + (xmax - xmin) * 0.05).toFixed(6))}`,
        )

        if (valuesOn && xsNumeric.length) {
          const xticks = xsNumeric.map((v) => Number(v.toFixed(6))).join(',')
          axisOptionsArr.push(`xtick={${xticks}}`)
          const xticklabels = labelsTex.join(',')
          axisOptionsArr.push(`xticklabels={${xticklabels}}`)
        } else {
          axisOptionsArr.push('xtick=\\empty')
        }
      }

      return `\\begin{tikzpicture}
  \\begin{axis}[
    ${axisOptionsArr.join(',\n    ')}
  ]
    ${addplot}
  \\end{axis}
\\end{tikzpicture}`
    }
  }
}
