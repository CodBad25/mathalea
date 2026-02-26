import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { toutPourUnPoint } from '../../../lib/interactif/mathLive'
import { choice } from '../../../lib/outils/arrayOutils'
import { ecritureAlgebriqueSauf1, rienSi1 } from '../../../lib/outils/ecritures'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { randint } from '../../../modules/outils'
import ExerciceCan from '../../ExerciceCan'
export const titre =
  "Déterminer les coordonnées d'un vecteur normal à un plan à partir de son équation"
export const interactifReady = true
export const interactifType = 'mathLive'
export const uuid = 'y75un'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/ export default class Can2026TermQ19 extends ExerciceCan {
  enonce(a?: number, b?: number, c?: number, d?: number): void {
    if (a == null || b == null || c == null || d == null) {
      // On génère une équation avec 2 ou 3 termes non nuls
      const cas = choice([1, 2, 3])
      switch (cas) {
        case 1: // ax + cz = d (pas de y)
          a = randint(-5, 5, 0)
          b = 0
          c = randint(-5, 5, 0)
          d = randint(-9, 9)
          break
        case 2: // ax + by = d (pas de z)
          a = randint(-5, 5, 0)
          b = randint(-5, 5, 0)
          c = 0
          d = randint(-9, 9)
          break
        case 3: //  by + cz = d
        default:
          a = 0
          b = randint(-5, 5, 0)
          c = randint(-5, 5, 0)
          d = randint(-9, 9)
          break
      }
    }

    this.formatInteractif = 'fillInTheBlank'
    this.reponse = {
      bareme: toutPourUnPoint,
      champ1: { value: String(a) },
      champ2: { value: String(b) },
      champ3: { value: String(c) },
    }

    // Construction de l'équation du plan
    let equation = ''
    let premier = true
    if (a !== 0) {
      equation += `${rienSi1(a)}x`
      premier = false
    }
    if (b !== 0) {
      equation += premier ? `${rienSi1(b)}y` : `${ecritureAlgebriqueSauf1(b)}y`
      premier = false
    }
    if (c !== 0) {
      equation += premier ? `${rienSi1(c)}z` : `${ecritureAlgebriqueSauf1(c)}z`
    }
    equation += `=${d}`

    this.consigne = `Coordonnées d'un vecteur normal $\\vec{n}$ au plan d'équation $${equation}$ :`
    this.question = `\\vec{n}(%{champ1}\\,;\\,%{champ2}\\,;\\,%{champ3})`

    this.correction = `Pour un plan d'équation $ax+by+cz=d$, un vecteur normal est $\\vec{n}(a\\,;\\,b\\,;\\,c)$.<br>
    Ici, $${equation}$, donc $\\vec{n}(${miseEnEvidence(String(a))}\\,;\\,${miseEnEvidence(String(b))}\\,;\\,${miseEnEvidence(String(c))})$.`
    this.formatChampTexte = KeyboardType.clavierDeBase
    this.canEnonce = `Coordonnées d'un vecteur normal $\\vec{n}$ au plan d'équation $${equation}$.`
    this.canReponseACompleter =
      '$\\vec{n}(\\ldots\\,;\\,\\ldots\\,;\\,\\ldots)$'
  }

  nouvelleVersion(): void {
    this.canOfficielle ? this.enonce(1, 0, -3, 0) : this.enonce()
  }
}
