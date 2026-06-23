import type { MathfieldElement } from 'mathlive'
import { fixeBordures } from '../../../lib/2d/fixeBordures'
import Horloge from '../../../lib/2d/horloge'
import { handleAnswers } from '../../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../../lib/interactif/questionMathLive'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import Hms from '../../../modules/Hms'
import { mathalea2d } from '../../../modules/mathalea2d'
import { randint } from '../../../modules/outils'
import Exercice from '../../Exercice'
export const titre = 'Lire une heure sur une horloge'
export const interactifReady = true
export const interactifType = 'custom'
export const uuid = '0e237'
export const refs = {
  'fr-fr': [],
  'fr-ch': ['NR'],
}

/**
 * @author Gilles Mora

*/

export default class Can2025CE1Q18 extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.canOfficielle = true
    this.besoinFormulaireCaseACocher = ['CAN Officielle', true]
    this.nbQuestionsModifiable = false
  }

  nouvelleVersion() {
    let texte = ''
    let texteCorr = ''
    const hour = this.canOfficielle ? 13 : randint(13, 22)
    const minute = this.canOfficielle ? 30 : randint(1, 11) * 5
    const horloge2 = new Horloge(0, 0, 2, new Hms({ hour: hour % 12, minute }))
    const horloge = new Horloge(0, 0, 2)
    const objets = horloge.objets ?? []
    texte = mathalea2d(
      Object.assign(
        { scale: 0.7, display: 'block', center: true } as const,
        fixeBordures(objets, { rxmin: 0, rxmax: 0, rymin: 0, rymax: 0.5 }),
      ),
      horloge,
    )
    texte += `Il est $${hour}$ h $${minute}$. `
    if (this.interactif) {
      texte +=
        'La petite aiguille doit être entre le ' +
        ajouteChampTexteMathLive(this, 0) +
        'et le ' +
        ajouteChampTexteMathLive(this, 1) +
        '.<br>'
      texte +=
        'La grande aiguille doit être sur le ' +
        ajouteChampTexteMathLive(this, 2) +
        '.'
    } else {
      texte +=
        'La petite aiguille doit être entre le $\\ldots$ et le $\\ldots$ <br>'
      texte += 'La grande aiguille doit être sur le $\\ldots$ '
    }

    texteCorr =
      `La petite aiguille doit se situer entre le $${miseEnEvidence(hour - 12)}$ et le $${miseEnEvidence(hour - 11)}$.<br>
    La grande aiguille doit être sur le $${miseEnEvidence(minute / 5)}$.<br>` +
      mathalea2d(
        {
          xmin: -3,
          ymin: -3,
          xmax: 3,
          ymax: 3,
          scale: 0.7,
          center: true,
        },
        horloge2,
      )
    handleAnswers(this, 0, { reponse: { value: String(hour - 12) } })
    handleAnswers(this, 1, { reponse: { value: String(hour - 11) } })
    handleAnswers(this, 2, { reponse: { value: String(minute / 5) } })
    this.question = texte
    this.correction = texteCorr
    this.reponse = ''
    this.canEnonce = `Dessine les deux aiguilles de la pendule pour indiquer $${hour}$ h $${minute}$.`
    this.canReponseACompleter = mathalea2d(
      Object.assign(
        { scale: 0.7, display: 'block', center: true } as const,
        fixeBordures(objets, { rxmin: 0, rxmax: 0, rymin: 0, rymax: 0.5 }),
      ),
      horloge,
    )
    this.listeQuestions = [texte]
    this.listeCorrections = [texteCorr]
  }

  correctionInteractive(i: number) {
    const champsTexte = []
    const saisies = []
    let resultatOK = true
    for (let k = 0; k < 3; k++) {
      champsTexte[k] = document.getElementById(
        `champTexteEx${this.numeroExercice}Q${k}`,
      ) as MathfieldElement
      if (champsTexte[k] === null) {
        window.notify('champsTexte[k] est null', {
          k,
          champsTexte,
          this: this,
        })
        return 'KO'
      }
      saisies[k] = champsTexte[k].value
        .replace(',', '.')
        .replace(/\((\+?-?\d+)\)/, '$1')
      resultatOK =
        resultatOK &&
        saisies[k] === (this.autoCorrection[k]?.valeur?.reponse?.value ?? '')
    }
    const spanResultat = document.querySelector(
      `#resultatCheckEx${this.numeroExercice}Q${2}`,
    )
    if (spanResultat != null) {
      if (resultatOK) {
        spanResultat.innerHTML += '😎'
        return 'OK'
      }
      spanResultat.innerHTML += '☹️'
      return 'KO'
    }
    return 'KO'
  }
}
