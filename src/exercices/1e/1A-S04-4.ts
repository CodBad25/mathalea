import Stat from '../../lib/mathFonctions/Stat'
import { choisitNombresEntreMetN } from '../../lib/outils/aleatoires'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { nombreElementsDifferents } from '../ExerciceQcm'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '5ba2a'
export const refs = {
  'fr-fr': ['1A-S04-4', '2A-S4-4'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = "Calculer une médiane à partir d'un diagramme en barres"
export const dateDePublication = '01/01/2026'
/**
 * @author Jean-claude Lhote
 */

export default class CalculMedianeHistogrammeQCM extends ExerciceQcmA {
  // Ceci est la fonction qui s'occupe d'écrire l'énoncé, la correction et les réponses
  // Elle factorise le code qui serait dupliqué dans versionAleatoire et versionOriginale
  private appliquerLesValeurs(serie: [number, number][]): void {
    const maSerieQ = new Stat(serie, true, false)
    const maSerie = new Stat(serie)
    const n = maSerie.serie.length
    const values = maSerie.serieTriee()
    const histogramme = maSerieQ.diagramme({
      cumul: false,
      barres: true,
      valuesOn: true,
    })
    const mediane = maSerie.mediane()
    const q1 = maSerie.q1
    const q3 = maSerie.q3
    const moyenne = maSerie.moyenne()

    this.reponses = [
      `${texNombre(mediane, 1)}`,
      `${texNombre(q1, 1)}`,
      `${texNombre(moyenne, 1)}`,
      `${texNombre(q3, 1)}`,
    ].map((r) => `$${r}$`)
    this.enonce = `${histogramme}<br><br>Quelle est la médiane de la série statistique étudiée sur ce diagramme en barres ?`

    // Correction : explication simple, claire
    this.correction =
      n % 2 === 0
        ? `La médiane est une valeur qui partage la série statistique en deux parties égales.<br>
    Il y a un total de $${n}$ valeurs.<br>
    La médiane est donc à prendre entre la valeur de rang $${n / 2}$ et celle de rang $${n / 2 + 1}$ (nous prendrons la moyenne de ces deux valeurs centrales).<br>
    En regardant le diagramme, on constate que la valeur de rang $${n / 2}$ est $${values[n / 2 - 1]}$ et la valeur de rang $${n / 2 + 1}$ est $${values[n / 2]}$` +
          (values[n / 2 - 1] === values[n / 2]
            ? ` aussi.<br>
      Donc la médiane de la série est $${miseEnEvidence(texNombre(mediane, 0))}$.`
            : `.<br>
      La médiane est donc : $\\dfrac{${values[n / 2 - 1]}+${values[n / 2]}}{2}=${miseEnEvidence(texNombre(mediane, 1))}$.`)
        : `La médiane est la valeur qui partage la série statistique en deux parties égales.<br>
    Il y a un total de $${n}$ valeurs.<br>
    La médiane est donc la valeur de rang $${Math.ceil(n / 2)}$ (la valeur centrale car le nombre de valeurs est impair).<br>
    En regardant le diagramme, on constate que la valeur de rang $${Math.ceil(n / 2)}$ est ${texNombre(mediane, 0)}.<br>
    Donc la médiane est égale à : $${miseEnEvidence(texNombre(mediane, 0))}$.`
  }

  versionOriginale: () => void = () => {
    const maSerie: [number, number][] = [
      [3, 2],
      [8, 8],
      [13, 7],
      [18, 4],
    ]
    this.appliquerLesValeurs(maSerie)
  }

  versionAleatoire: () => void = () => {
    const n = 4 // Nombre de réponses différentes souhaitées
    do {
      const valeurs = choisitNombresEntreMetN(1, 20, 4).sort((a, b) => a - b)
      const effectifs = choisitNombresEntreMetN(2, 8, 4)
      const maSerie: [number, number][] = valeurs.map((v, i) => [
        v,
        effectifs[i],
      ])
      this.appliquerLesValeurs(maSerie)
    } while (nombreElementsDifferents(this.reponses) < n)
  }

  // Ici il n'y a rien à faire, on appelle juste la version aleatoire (pour un qcm aleatoirisé, c'est le fonctionnement par défaut)
  constructor() {
    super()
    this.options = { vertical: true, ordered: false }
    this.versionAleatoire()
  }
}
