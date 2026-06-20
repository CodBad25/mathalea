import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence, texteEnCouleurEtGras } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '2cdc4'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Calculer un taux global d\'évolution '
export const dateDePublication = '02/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoQ6AGs2026 extends ExerciceQcmA {
  private appliquerLesValeurs(s1: number, p1: number, s2: number, p2: number): void {
    const fmt = (v: number) => texNombre(v, Math.round(v * 100) % 10 === 0 ? 1 : 2)
    const mot = (s: number) => (s > 0 ? 'augmente' : 'baisse')

    const c1 = 1 + (s1 * p1) / 100
    const c2 = 1 + (s2 * p2) / 100
    const C = c1 * c2

    const vCorrect = Math.round((C - 1) * 100) // variation globale (signée)
    const vAdditif = s1 * p1 + s2 * p2 // erreur classique : on additionne les pourcentages
    const vCoeff = Math.round(C * 100) // erreur : on lit le coefficient multiplicateur direct comme pourcentage

    const formatVar = (v: number) => {
      if (v > 0) return `une hausse de $${texNombre(v)}\\,\\%$`
      if (v < 0) return `une baisse de $${texNombre(-v)}\\,\\%$`
      return `une variation de $0\\,\\%$`
    }

    this.enonce = `Le prix d'un article ${mot(s1)} de $${p1}\\,\\%$ puis ${mot(s2)} de $${p2}\\,\\%$.<br>`
    this.enonce += `Ces deux variations sont équivalentes à :`

    // Génération propre de distracteurs uniques
    const repCorrecte = formatVar(vCorrect)
    const faussesReponses = new Set<string>()
    faussesReponses.add(formatVar(vAdditif))
    faussesReponses.add(formatVar(-vCorrect)) // Erreur de signe (hausse au lieu de baisse)
    faussesReponses.add(formatVar(s1 < 0 && s2 < 0 ? -vCoeff : vCoeff)) // Transformation du coeff en pourcentage

    // Complétion si besoin pour s'assurer d'avoir 4 choix
    let offset = 10
    while (faussesReponses.size < 3) {
      faussesReponses.add(formatVar(vCorrect + offset))
      offset += 5
    }
    faussesReponses.delete(repCorrecte)
    const arrDist = Array.from(faussesReponses)

    this.reponses = [repCorrecte, arrDist[0], arrDist[1], arrDist[2]]

    // Rédaction de la correction avec la nomenclature officielle
    this.correction = `On traduit chaque variation par un coefficient multiplicateur :<br><br>`
    this.correction += `$\\bullet$ ${mot(s1)} de $${p1}\\,\\%$ : $CM_1 = 1 ${s1 > 0 ? '+' : '-'} ${texNombre(p1/100,2)} = ${fmt(c1)}$<br>`
    this.correction += `$\\bullet$ ${mot(s2)} de $${p2}\\,\\%$ : $CM_2 = 1 ${s2 > 0 ? '+' : '-'} ${texNombre(p2/100,2)} = ${fmt(c2)}$<br><br>`
    
    this.correction += `Le coefficient multiplicateur global $CM_G$ des deux variations est :<br>`
    this.correction += `$CM_G = CM_1 \\times CM_2 = ${fmt(c1)} \\times ${fmt(c2)} = ${fmt(C)}$<br><br>`
    
    this.correction += `Le taux d'évolution global $T_g$ est donc :<br>`
    this.correction += `$T_g = CM_G - 1 = ${fmt(C)} - 1 = ${fmt(C - 1)}$<br><br>`

    const mag = Math.round(Math.abs(C - 1) * 100)
    if (C < 1) {
      this.correction += `Comme le taux $T_g$ est négatif, le prix a globalement baissé.<br>Cela équivaut à ${texteEnCouleurEtGras('une baisse de')} $${miseEnEvidence(`${mag}\\,\\%`)}$.`
    } else if (C > 1) {
      this.correction += `Comme le taux $T_g$ est positif, le prix a globalement augmenté.<br>Cela équivaut à ${texteEnCouleurEtGras('une hausse de')} $${miseEnEvidence(`${mag}\\,\\%`)}$.`
    } else {
      this.correction += `Comme le taux $T_g$ est nul, le prix n'a globalement pas varié.<br>Cela équivaut à une variation de $${miseEnEvidence('0\\,\\%')}$.`
    }
  }

  versionOriginale: () => void = () => {
    // Sujet de l'image : baisse de 50 % puis hausse de 40 % => baisse de 30 %
    this.appliquerLesValeurs(-1, 50, 1, 40)
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    let compteur = 0
    do {
      const typeChoix = choice([1, 2, 3])
      let s1 = 1, p1 = 10, s2 = 1, p2 = 10

      if (typeChoix === 1) {
        // Double baisse : Calculs mentaux accessibles avec des dizaines
        s1 = -1
        s2 = -1
        p1 = choice([10, 20, 30, 40, 50])
        p2 = choice([10, 20, 30, 40, 50])
      } else if (typeChoix === 2) {
        // Baisse puis hausse : La baisse doit être de 50% ou 75%
        s1 = -1
        s2 = 1
        p1 = choice([50, 75])
        p2 = choice([10, 20, 30, 40, 50, 60])
      } else {
        // Hausse puis baisse : La baisse doit être de 50% ou 75%
        s1 = 1
        s2 = -1
        p1 = choice([10, 20, 30, 40, 50, 60])
        p2 = choice([50, 75])
      }

      this.appliquerLesValeurs(s1, p1, s2, p2)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}