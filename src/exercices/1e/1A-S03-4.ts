import Stat from '../../lib/mathFonctions/Stat'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { randint } from '../../modules/outils'
import { creerSerieDeQuartiles } from '../../modules/outilsStat'
import { nombreElementsDifferents } from '../ExerciceQcm'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '0cd7a'
export const refs = {
  'fr-fr': ['1A-S03-4'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre =
  'Interpréter des effectifs à partir d’une boite à moustaches'
export const dateDePublication = '04/07/2026'

type TypeQuestion = 'inferieurQ3' | 'superieurQ1'

/**
 * @author Stéphane Guyon
 */
export default class LireEffectifBoiteMoustachesQCM extends ExerciceQcmA {
  private appliquerLesValeurs(
    effectifTotal: number,
    min: number,
    q1: number,
    mediane: number,
    q3: number,
    max: number,
    typeQuestion: TypeQuestion,
  ): void {
    const serie = creerSerieDeQuartiles({
      q1,
      mediane,
      q3,
      min,
      max,
      n: effectifTotal,
      isInteger: true,
    })
    const maSerie = new Stat(serie)
    const moustache = maSerie.traceBoiteAMoustache({
      size: 10,
      height: 4,
      legendeOn: false,
      valeursOn: true,
      echelle: 1,
    })
    const reponse = (3 * effectifTotal) / 4
    const valeurRepere = typeQuestion === 'inferieurQ3' ? q3 : q1
    const question =
      typeQuestion === 'inferieurQ3'
        ? `Le nombre d'élèves ayant une note inférieure ou égale à $${valeurRepere}$ est au moins égal à :`
        : `Le nombre d'élèves ayant une note supérieure ou égale à $${valeurRepere}$ est au plus moins à :`
    const interpretation =
      typeQuestion === 'inferieurQ3'
        ? `On lit sur le diagramme en boîtes que $Q_3=${q3}$.<br>
      On cherche donc le nombre d'élèves ayant une note au plus égale à $${q3}$.<br>
      Par définition, $75\\,\\%$ des notes sont inférieures ou égales au troisième quartile $Q_3$.`
        : `On lit que $Q_1=${q1}$.<br>
      On cherche donc le nombre d'élèves ayant une note au moins égale à $${q1}$.<br>
      Par définition, $75\\,\\%$ des notes sont supérieures ou égales au premier quartile $Q_1$.`

    const distracteurs = [
      effectifTotal / 4,
      effectifTotal / 2,
      valeurRepere,
      effectifTotal,
      reponse - 1,
      reponse + 1,
    ].filter((valeur) => valeur > 0 && valeur !== reponse)
    const reponses = [reponse]
    for (const distracteur of distracteurs) {
      if (!reponses.includes(distracteur)) reponses.push(distracteur)
      if (reponses.length === 4) break
    }

    this.reponses = reponses.map((r) => `$${texNombre(r, 0)}$`)

    this.enonce = `Les notes d'une classe de $${effectifTotal}$ élèves sont résumées par le diagramme en boite ci-dessous.<br>
      ${moustache}<br>
      ${question}`

    this.correction = `${interpretation}<br>
      Cela correspond donc à $\\dfrac{3}{4}$ de l'effectif total.<br>
      $\\dfrac{3}{4}\\times ${effectifTotal}=${miseEnEvidence(texNombre(reponse, 0))}$.`
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(24, 2, 5, 9, 13, 18, 'inferieurQ3')
  }

  versionAleatoire: () => void = () => {
    const n = 4
    do {
      const effectifTotal = choice([24, 28, 32, 36])
      const min = randint(2, 5)
      const q1 = randint(min + 1, min + 4)
      const mediane = randint(q1 + 2, q1 + 5)
      const q3 = randint(mediane + 2, mediane + 4)
      const max = randint(q3 + 1, 20)
      const typeQuestion = choice([
        'inferieurQ3',
        'superieurQ1',
      ]) as TypeQuestion
      this.appliquerLesValeurs(
        effectifTotal,
        min,
        q1,
        mediane,
        q3,
        max,
        typeQuestion,
      )
    } while (nombreElementsDifferents(this.reponses) < n)
  }

  constructor() {
    super()
    this.options = { vertical: false, ordered: false }
    this.versionAleatoire()
  }
}
