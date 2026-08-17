import { courbe } from '../../lib/2d/Courbe'
import { repere } from '../../lib/2d/reperes'
import { segment } from '../../lib/2d/segmentsVecteurs'
import { latex2d } from '../../lib/2d/textes'
import { bleuMathalea, orangeMathalea } from '../../lib/colors'
import { choice, shuffle } from '../../lib/outils/arrayOutils'
import { texteEnCouleurEtGras } from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const titre = 'Lire graphiquement des informations sur la convexité'
export const dateDePublication = '10/08/2026'
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'

export const uuid = 'a341f'
export const refs = {
  'fr-fr': ['TSA3-41', 'TCA7-41'],
  'fr-ch': [],
}
export const tags = ['programme de transition']
type TypeRepresentation = 1 | 2 | 3

function intervalle(a: number, b: number): string {
  return `[${a}\\,;\\,${b}]`
}

function uniteVerticale(ymin: number, ymax: number): number {
  return Math.min(1, 10 / (ymax - ymin))
}

function parametresVerticaux(
  ymin: number,
  ymax: number,
): {
  ymin: number
  ymax: number
  pas: number
  unite: number
} {
  const amplitude = ymax - ymin
  const pas = amplitude > 25 ? 5 : amplitude > 14 ? 2 : 1
  const yminAdapte = pas === 5 ? Math.floor(ymin / pas) * pas : ymin
  const ymaxAdapte = pas === 5 ? Math.ceil(ymax / pas) * pas : ymax

  return {
    ymin: yminAdapte,
    ymax: ymaxAdapte,
    pas,
    unite: uniteVerticale(yminAdapte, ymaxAdapte),
  }
}

function positionLabelCourbe(
  fonction: (x: number) => number,
  xmin: number,
  xmax: number,
  ymin: number,
  ymax: number,
  pasY: number,
  yUnite: number,
): { x: number; y: number } {
  const margeVerticale = Math.max(pasY * 0.7, (ymax - ymin) * 0.08)
  const candidats = Array.from(
    { length: 9 },
    (_, index) => xmax - 0.45 - index * ((xmax - xmin - 0.9) / 8),
  )
  const x =
    candidats.find((abscisse) => {
      const image = fonction(abscisse)
      return image >= ymin + margeVerticale && image <= ymax - margeVerticale
    }) ?? (xmin + xmax) / 2
  const image = fonction(x)
  const pasDerivee = Math.max((xmax - xmin) / 1000, 0.001)
  const penteGraphique =
    ((fonction(x + pasDerivee) - fonction(x - pasDerivee)) / (2 * pasDerivee)) *
    yUnite
  const norme = Math.hypot(penteGraphique, 1)
  const decalage = 1.5
  const normaleXBrute = (-penteGraphique * decalage) / norme
  const normaleX = Math.max(-0.85, Math.min(0.85, normaleXBrute))
  const normaleY = decalage / norme
  const margeX = 0.65
  const margeY = 0.45
  const candidatsLabel = [1, -1].map((sens) => ({
    x: x + sens * normaleX,
    y: image * yUnite + sens * normaleY,
  }))
  const espaceDansCadre = (position: { x: number; y: number }): number =>
    Math.min(
      position.x - (xmin + margeX),
      xmax - margeX - position.x,
      position.y - (ymin * yUnite + margeY),
      ymax * yUnite - margeY - position.y,
    )
  const position = candidatsLabel.sort(
    (position1, position2) =>
      espaceDansCadre(position2) - espaceDansCadre(position1),
  )[0]

  return {
    x: Math.max(xmin + margeX, Math.min(xmax - margeX, position.x)),
    y: Math.max(
      ymin * yUnite + margeY,
      Math.min(ymax * yUnite - margeY, position.y),
    ),
  }
}

function graphique(
  fonction: (x: number) => number,
  xmin: number,
  xmax: number,
  ymin: number,
  ymax: number,
  nomCourbe: string,
  objetsSupplementaires: ReturnType<typeof segment>[] = [],
): string {
  const parametresY = parametresVerticaux(ymin, ymax)
  ymin = parametresY.ymin
  ymax = parametresY.ymax
  const yUnite = parametresY.unite
  const pasY = parametresY.pas
  const r = repere({
    xMin: xmin,
    xMax: xmax,
    yMin: ymin,
    yMax: ymax,
    yUnite,
    yThickDistance: pasY,
    yLabelDistance: pasY,
    grilleX: false,
    grilleY: false,
    grilleSecondaire: true,
    grilleSecondaireXDistance: 1,
    grilleSecondaireYDistance: pasY,
  })
  const c = courbe(fonction, {
    repere: r,
    color: bleuMathalea,
    epaisseur: 2.5,
    xMin: xmin,
    xMax: xmax,
    yMin: ymin,
    yMax: ymax,
    step: 0.03,
  })
  const positionLabel = positionLabelCourbe(
    fonction,
    xmin,
    xmax,
    ymin,
    ymax,
    pasY,
    yUnite,
  )
  const label = latex2d(nomCourbe, positionLabel.x, positionLabel.y, {
    color: bleuMathalea,
    letterSize: 'small',
  })
  const cadre = [
    segment(xmin, ymin * yUnite, xmax, ymin * yUnite),
    segment(xmax, ymin * yUnite, xmax, ymax * yUnite),
    segment(xmax, ymax * yUnite, xmin, ymax * yUnite),
    segment(xmin, ymax * yUnite, xmin, ymin * yUnite),
  ]
  cadre.forEach((cote) => {
    cote.epaisseur = 1
  })

  return mathalea2d(
    {
      xmin: xmin - 0.3,
      xmax: xmax + 0.3,
      ymin: ymin * yUnite - 0.3,
      ymax: ymax * yUnite + 0.3,
      pixelsParCm: 22,
      scale: 0.7,
      center: true,
    },
    r,
    ...cadre,
    c,
    ...objetsSupplementaires,
    label,
  )
}

/**
 * @author Stéphane Guyon
 */
export default class ConvexiteEtCourbesDerivees extends ExerciceQcmA {
  private ordreDesCas: TypeRepresentation[] = shuffle([
    1, 2, 3,
  ] as TypeRepresentation[])
  private indiceDuCas = 0

  private casCourbeDeF(): void {
    const a = randint(-2, 2)
    const b = randint(-2, 2)
    const signe = randint(0, 1) === 0 ? -1 : 1
    const xmin = a - 3
    const xmax = a + 3
    const ymin = b - 9
    const ymax = b + 9
    const yUnite = uniteVerticale(ymin, ymax)
    const f = (x: number) => signe * (x - a) ** 3 + b
    const tangente = segment(xmin, b * yUnite, xmax, b * yUnite, orangeMathalea)
    tangente.epaisseur = 2
    tangente.pointilles = 2
    const figure = graphique(f, xmin, xmax, ymin, ymax, '\\mathcal C_f', [
      tangente,
    ])
    const gauche = intervalle(xmin, a)
    const droite = intervalle(a, xmax)
    const autourDuPoint = intervalle(a - 1, a + 1)
    const bonneReponseConvexite =
      signe > 0
        ? `$f$ est concave sur $${gauche}$.`
        : `$f$ est convexe sur $${gauche}$.`
    const proposerPointInflexion = randint(0, 1) === 0
    const bonneReponse = proposerPointInflexion
      ? `La courbe de $f$ admet un point d’inflexion d’abscisse $${a}$.`
      : bonneReponseConvexite
    const reponseInversee =
      signe > 0
        ? `$f$ est concave sur $${droite}$.`
        : `$f$ est convexe sur $${droite}$.`
    const courbureAutourDuPoint =
      randint(0, 1) === 0
        ? `$f$ est convexe sur $${autourDuPoint}$.`
        : `$f$ est concave sur $${autourDuPoint}$.`
    const distracteurVariation = proposerPointInflexion
      ? randint(0, 1) === 0
        ? `$f$ admet un maximum en $${a}$.`
        : `$f$ admet un minimum en $${a}$.`
      : `La courbe de $f$ admet un point d’inflexion d’abscisse $${a + (randint(0, 1) === 0 ? -1 : 1)}$.`

    this.enonce = `On considère une fonction $f$ deux fois dérivable sur $${intervalle(xmin, xmax)}$. On a représenté ci-dessous sa courbe $\\mathcal C_f$. La droite en pointillés est la tangente à $\\mathcal C_f$ au point d’abscisse $${a}$.<br>${figure}<br>
    Quelle affirmation est correcte ?`
    this.reponses = [
      bonneReponse,
      reponseInversee,
      courbureAutourDuPoint,
      distracteurVariation,
    ]
    this.correction = `La tangente à $\\mathcal C_f$ au point d’abscisse $${a}$ traverse la courbe : le point correspondant est donc un point d’inflexion.<br>
    Lorsque la courbe est orientée vers le haut, la fonction est convexe ; lorsqu’elle est orientée vers le bas, la fonction est concave.<br>
    On examine les quatre affirmations :<br>
    • ${texteEnCouleurEtGras(bonneReponse, 'black')} Elle est vraie : ${proposerPointInflexion ? `la tangente traverse la courbe au point d’abscisse $${a}$` : `sur l’intervalle proposé, la courbe est orientée vers ${signe > 0 ? 'le bas' : 'le haut'}`}.<br>
    • ${texteEnCouleurEtGras(reponseInversee, 'black')} Elle est fausse : sur cet intervalle, la courbe est orientée vers ${signe > 0 ? 'le haut' : 'le bas'}.<br>
    • ${texteEnCouleurEtGras(courbureAutourDuPoint, 'black')} Elle est fausse puisque cet intervalle contient le point d’inflexion d’abscisse $${a}$.<br>
    • ${texteEnCouleurEtGras(distracteurVariation, 'black')} Elle est fausse : ${proposerPointInflexion ? `le point d’abscisse $${a}$ est un point d’inflexion, pas un extremum` : `le changement de convexité a lieu en $${a}$`}.<br>
    La bonne réponse est donc : ${texteEnCouleurEtGras(bonneReponse)}`
  }

  private casCourbeDeFPrime(): void {
    const centre = randint(-1, 1)
    const h = randint(1, 2)
    const a = centre - h
    const b = centre + h
    const signe = randint(0, 1) === 0 ? -1 : 1
    const xmin = a - 1
    const xmax = b + 1
    const fPrime = (x: number) => {
      const t = x - centre
      return signe * (t ** 3 - 3 * h ** 2 * t)
    }
    const valeurs = [xmin, a, b, xmax].map(fPrime)
    const ymin = Math.floor(Math.min(...valeurs)) - 2
    const ymax = Math.ceil(Math.max(...valeurs)) + 2
    const yUnite = parametresVerticaux(ymin, ymax).unite
    const tangenteA = segment(
      a - 0.65,
      fPrime(a) * yUnite,
      a + 0.65,
      fPrime(a) * yUnite,
      orangeMathalea,
    )
    const tangenteB = segment(
      b - 0.65,
      fPrime(b) * yUnite,
      b + 0.65,
      fPrime(b) * yUnite,
      orangeMathalea,
    )
    tangenteA.epaisseur = 2
    tangenteB.epaisseur = 2
    const figure = graphique(
      fPrime,
      xmin,
      xmax,
      ymin,
      ymax,
      "\\mathcal C_{f'}",
      [tangenteA, tangenteB],
    )
    const interieur = intervalle(a, b)
    const gauche = intervalle(xmin, a)
    const bonneReponse =
      signe > 0
        ? `$f$ est concave sur $${interieur}$.`
        : `$f$ est convexe sur $${interieur}$.`
    const reponseInversee =
      signe > 0
        ? `$f$ est concave sur $${gauche}$.`
        : `$f$ est convexe sur $${gauche}$.`
    const proposerMaximum = randint(0, 1) === 0
    const proposerPointInflexion = randint(0, 1) === 0
    const distracteurVariation = proposerPointInflexion
      ? `La courbe de $f$ admet un point d’inflexion d’abscisse $${centre}$.`
      : proposerMaximum
        ? `$f$ admet un maximum en $${signe > 0 ? a : b}$.`
        : `$f$ admet un minimum en $${signe > 0 ? b : a}$.`
    const distracteurConvexiteDeFPrime =
      signe > 0
        ? `$f'$ est convexe sur $${intervalle(b, xmax)}$.`
        : `$f'$ est concave sur $${intervalle(b, xmax)}$.`

    this.enonce = `On considère une fonction $f$ deux fois dérivable sur $${intervalle(xmin, xmax)}$. On a représenté ci-dessous la courbe de sa fonction dérivée $f'$. Les tangentes aux sommets d’abscisses $${a}$ et $${b}$ sont horizontales.<br>${figure}<br>
    Quelle affirmation décrit correctement la convexité de la fonction $f$ ?`
    this.reponses = [
      bonneReponse,
      reponseInversee,
      distracteurVariation,
      distracteurConvexiteDeFPrime,
    ]
    this.correction = `La fonction $f$ est convexe lorsque sa dérivée $f'$ est croissante et concave lorsque $f'$ est décroissante.<br>
    On examine les quatre affirmations :<br>
    • ${texteEnCouleurEtGras(bonneReponse, 'black')} Elle est vraie car, sur $${interieur}$, $f'$ est ${signe > 0 ? 'décroissante' : 'croissante'}.<br>
    • ${texteEnCouleurEtGras(reponseInversee, 'black')} Elle est fausse : sur $${gauche}$, $f'$ est ${signe > 0 ? 'croissante' : 'décroissante'}, donc $f$ y est ${signe > 0 ? 'convexe' : 'concave'}.<br>
    • ${texteEnCouleurEtGras(distracteurVariation, 'black')} Elle est fausse : ${proposerPointInflexion ? `les changements de variation de $f'$ ont lieu en $${a}$ et $${b}$ ; ce sont donc ces abscisses qui correspondent aux points d’inflexion de la courbe de $f$` : `l’abscisse indiquée est celle d’un extremum de la fonction $f'$ représentée, et non d’un extremum de $f$`}.<br>
    • ${texteEnCouleurEtGras(distracteurConvexiteDeFPrime, 'black')} Cette affirmation décrit correctement la courbure de $f'$, mais elle ne répond pas à la question, qui porte sur la convexité de $f$.<br>
    La bonne réponse est donc : ${texteEnCouleurEtGras(bonneReponse)}`
  }

  private casCourbeDeFSeconde(): void {
    const [a, b] = choice([
      [-3, 1],
      [-3, 3],
      [-2, 2],
      [-1, 1],
      [-1, 3],
    ] as Array<[number, number]>)
    const signe = randint(0, 1) === 0 ? -1 : 1
    const xmin = a - 2
    const xmax = b + 2
    const fSeconde = (x: number) => signe * (x - a) * (x - b)
    const sommet = (a + b) / 2
    const valeurs = [fSeconde(xmin), fSeconde(xmax), fSeconde(sommet)]
    const ymin = Math.floor(Math.min(...valeurs)) - 2
    const ymax = Math.ceil(Math.max(...valeurs)) + 2
    const figure = graphique(
      fSeconde,
      xmin,
      xmax,
      ymin,
      ymax,
      "\\mathcal C_{f''}",
    )
    const interieur = intervalle(a, b)
    const gauche = intervalle(xmin, a)
    const droite = intervalle(b, xmax)
    const bonneReponse =
      signe > 0
        ? `$f$ est concave sur $${interieur}$.`
        : `$f$ est convexe sur $${interieur}$.`
    const reponseInversee =
      signe > 0
        ? `$f$ est concave sur $${gauche}$.`
        : `$f$ est convexe sur $${gauche}$.`
    const distracteurVariationDeFPrime =
      signe > 0
        ? `$f'$ est décroissante sur $${droite}$.`
        : `$f'$ est croissante sur $${droite}$.`
    const proposerPointInflexion = randint(0, 1) === 0
    const distracteurExtremumDeFSeconde = proposerPointInflexion
      ? `La courbe de $f$ admet un point d’inflexion d’abscisse $${sommet}$.`
      : signe > 0
        ? `$f'$ admet un minimum en $${sommet}$.`
        : `$f'$ admet un maximum en $${sommet}$.`

    this.enonce = `On considère une fonction $f$ deux fois dérivable sur $${intervalle(xmin, xmax)}$. On a représenté ci-dessous la courbe de sa dérivée seconde $f''$. Cette courbe coupe l’axe des abscisses en $${a}$ et $${b}$.<br>${figure}<br>
    Quelle affirmation décrit correctement la convexité de la fonction $f$ ?`
    this.reponses = [
      bonneReponse,
      reponseInversee,
      distracteurVariationDeFPrime,
      distracteurExtremumDeFSeconde,
    ]
    this.correction = `La fonction $f$ est convexe lorsque $f''$ est positive et concave lorsque $f''$ est négative.<br>
    On examine les quatre affirmations :<br>
    • ${texteEnCouleurEtGras(bonneReponse, 'black')} Elle est vraie d’après le signe de $f''$ entre ses deux racines.<br>
    • ${texteEnCouleurEtGras(reponseInversee, 'black')} Elle est fausse : sur $${gauche}$, $f''$ est ${signe > 0 ? 'positive' : 'négative'}, donc $f$ y est ${signe > 0 ? 'convexe' : 'concave'}.<br>
    • ${texteEnCouleurEtGras(distracteurVariationDeFPrime, 'black')} Elle est fausse : sur $${droite}$, $f''$ est ${signe > 0 ? 'positive' : 'négative'}, donc $f'$ est ${signe > 0 ? 'croissante' : 'décroissante'}.<br>
    • ${texteEnCouleurEtGras(distracteurExtremumDeFSeconde, 'black')} Elle est fausse : ${proposerPointInflexion ? `la dérivée seconde change de signe en $${a}$ et en $${b}$ ; les points d’inflexion de la courbe de $f$ ont donc ces abscisses` : `l’abscisse indiquée est celle de l’extremum de la fonction $f''$ représentée, et non d’un extremum de $f'$`}.<br>
    La bonne réponse est donc : ${texteEnCouleurEtGras(bonneReponse)}`
  }

  versionAleatoire: () => void = () => {
    const cas = this.ordreDesCas[this.indiceDuCas % this.ordreDesCas.length]
    this.indiceDuCas++
    switch (cas) {
      case 1:
        this.casCourbeDeF()
        break
      case 2:
        this.casCourbeDeFPrime()
        break
      case 3:
        this.casCourbeDeFSeconde()
        break
    }
  }

  nouvelleVersion(): void {
    this.ordreDesCas = shuffle([1, 2, 3] as TypeRepresentation[])
    this.indiceDuCas = 0
    super.nouvelleVersion()
    if (!context.isHtml) {
      this.listeQuestions = this.listeQuestions.map((question) =>
        question.replaceAll(
          '\\begin{qcmprop}[cols=4]',
          '\\begin{qcmprop}[cols=1]',
        ),
      )
    }
  }

  constructor() {
    super()
    this.besoinFormulaireCaseACocher = false
    this.options = { vertical: false, ordered: false }
    this.versionAleatoire()
  }
}
