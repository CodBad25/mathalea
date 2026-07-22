/**
 * ⚠️ Cet exercice est utilisé dans le test : tests/e2e/tests/view/view.capytale.save.can.test.ts ⚠️
 */

import Horloge from '../../../lib/2d/horloge'
import handleInteractiveClock, {
  addInteractiveClock,
} from '../../../lib/customElements/InteractiveClock'
import { handleAnswers } from '../../../lib/interactif/gestionInteractif'
import { combinaisonListes } from '../../../lib/outils/arrayOutils'
import { sp } from '../../../lib/outils/outilString'
import { formatMinute } from '../../../lib/outils/texNombre'
import { context } from '../../../modules/context'
import Hms from '../../../modules/Hms'
import { mathalea2d } from '../../../modules/mathalea2d'
import { listeQuestionsToContenu, randint } from '../../../modules/outils'
import Exercice from '../../Exercice'
export const titre = "Indiquer l'heure sur une horloge"
export const interactifReady = true
export const interactifType = 'interactive-clock'

export const dateDePublication = '21/2/2025'

export const uuid = '51242'
export const refs = {
  'fr-fr': ['canc3D04', 'auto6M4B-flash1'],
  'fr-ch': ['PR-5'],
}

/**
 * @author Rémi Angot

*/
export default class ExerciceInteractiveClock extends Exercice {
  goodAnswers: { hour: number; minute: number }[] = []
  constructor() {
    super()
    this.nbQuestions = 1
    this.interactifType = interactifType // MGu obligatoire car chargé en statique avec la CAN2025
    handleInteractiveClock() // Obligatoire pour la gestion de l'élément custom <interactive-clock>
    this.besoinFormulaireCaseACocher = [
      "Moitié des questions sur les heures de l'après-midi",
    ]
    this.sup = false
  }

  nouvelleVersion(numeroExercice: number, numeroQuestion?: number) {
    let isAfter12 = Array(this.nbQuestions).fill(false)
    if (this.sup) {
      isAfter12 = combinaisonListes([true, false], this.nbQuestions)
    }
    for (
      let i = numeroQuestion ?? 0, cpt = 0;
      i < (numeroQuestion ? numeroQuestion + 1 : this.nbQuestions) && cpt < 50;
    ) {
      let hour = randint(isAfter12[i] ? 13 : 1, isAfter12[i] ? 23 : 12)
      let minute = randint(1, 11) * 5
      if (this.canOfficielle) {
        hour = 13
        minute = 30
      }
      let enonce = `Placer correctement les aiguilles pour indiquer ${hour}${sp(1)}h${sp(1)}${formatMinute(minute)}.<br>`
      if (context.isHtml && !context.isTypst) {
        enonce += `<br><br>${addInteractiveClock(this, i, {
          interactivityOn: this.interactif,
          showHands: this.interactif,
        })}`
      } else {
        const horloge = new Horloge(0, 0, 2)
        enonce += mathalea2d(
          {
            xmin: -3,
            ymin: -3,
            xmax: 3,
            ymax: 3,
            scale: 0.6,
            center: true,
          },
          horloge,
        )
      }
      let correction = ''
      if (context.isHtml && !context.isTypst) {
        correction = addInteractiveClock(this, i, {
          id: `interactive-clock-correctionEx${this.numeroExercice}Q${i}`,
          hour,
          minute,
          interactivityOn: false,
          showHands: true,
        })
      } else {
        const horloge = new Horloge(0, 0, 2, new Hms({ hour, minute }))
        correction = mathalea2d(
          {
            xmin: -3,
            ymin: -3,
            xmax: 3,
            ymax: 3,
            scale: 0.6,
            center: true,
          },
          horloge,
        )
      }
      if (hour > 12) {
        correction += `<br>Remarque : ${hour} h correspond à ${hour - 12} h ${hour < 18 ? "de l'après-midi" : 'du soir'}.`
      }
      if (this.questionJamaisPosee(i, hour, minute)) {
        this.listeQuestions[i] = enonce
        this.listeCorrections[i] = correction
        this.goodAnswers[i] = { hour, minute }
        handleAnswers(
          this,
          i,
          {
            reponse: {
              value: new Hms({
                hour: this.goodAnswers[i].hour,
                minute: this.goodAnswers[i].minute,
              }).toString(),
            },
          },
          { formatInteractif: 'interactive-clock' },
        )

        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}

function formatHour012(hour: string): string {
  const hourNumber = parseInt(hour)
  if (hourNumber > 12) {
    return (hourNumber - 12).toString()
  } else {
    return hourNumber.toString()
  }
}
