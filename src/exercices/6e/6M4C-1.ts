import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { combinaisonListes } from '../../lib/outils/arrayOutils'
import {
  texteEnCouleur,
  texteEnCouleurEtGras,
} from '../../lib/outils/embellissements'
import { sp } from '../../lib/outils/outilString'
import { context } from '../../modules/context'
import Hms from '../../modules/Hms'

import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { listeQuestionsToContenu, randint } from '../../modules/outils'

import { bleuMathalea } from '../../lib/colors'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { minToHoraire } from '../../lib/outils/dateEtHoraires'
import { arrondi } from '../../lib/outils/nombres'
import Exercice from '../Exercice'

export const titre = 'Convertir en min vers h et min ou en s vers min et s'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'
export const dateDeModifImportante = '14/05/2022'

/**
 * @author
 * Ajout d'une option "Mélange" par Guillaume Valmont le 14/05/2022
 */

export const uuid = '4f8f4'

export const refs = {
  'fr-fr': ['6M4C-1'],
  'fr-2016': ['6D13'],
  'fr-ch': ['10GM3-5'],
}
export default class ConversionHeuresMinutesOuMinutesEtSecondes extends Exercice {
  can: boolean
  constructor(can = false) {
    super()
    this.besoinFormulaireNumerique = [
      "Type d'unité de départ",
      3,
      '1 : Minutes\n2 : Secondes\n3 : Mélange',
    ]
    this.nbQuestions = 5
    this.correctionDetailleeDisponible = true
    this.correctionDetaillee = false
    this.sup = 1
    this.can = can
  }

  nouvelleVersion() {
    let typeQuestionsDisponibles = ['min vers h et min', 's vers min et s']
    if (this.sup === 1) typeQuestionsDisponibles = ['min vers h et min']
    else if (this.sup === 2) typeQuestionsDisponibles = ['s vers min et s']
    const listeTypeQuestions = combinaisonListes(
      typeQuestionsDisponibles,
      this.nbQuestions,
    )
    for (
      let i = 0, cpt = 0, a, b, d, texte, texteCorr;
      i < this.nbQuestions && cpt < 50;
    ) {
      a = randint(2, 4)
      b = randint(10, 59)
      d = arrondi(a * 60 + b)
      if (listeTypeQuestions[i] === 'min vers h et min') {
        texte =
          `Convertir $${d}$ minutes en heures (h) et minutes (min).` +
          ajouteChampTexteMathLive(this, i, KeyboardType.clavierHms)
        this.canEnonce = `Convertir $${d}$ minutes en heures et minutes.`
        this.canReponseACompleter = '$\\ldots$ h $\\ldots$ min'
      } else {
        texte =
          `Convertir $${d}$ secondes en minutes (min) et secondes (s).` +
          ajouteChampTexteMathLive(this, i, KeyboardType.clavierHms)
        this.canEnonce = `Convertir $${d}$ secondes en minutes et secondes.`
        this.canReponseACompleter = '$\\ldots$ min $\\ldots$ s'
      }
      if (this.can) {
        if (listeTypeQuestions[i] === 'min vers h et min') {
          texteCorr =
            texteEnCouleur(
              `
    Mentalement : <br>
On cherche le multiple de $60$ inférieur à $${d}$ le plus grand possible. C'est $${Math.floor(d / 60)}\\times 60 = ${Math.floor(d / 60) * 60}$.<br>
Ainsi $${d} = ${Math.floor(d / 60) * 60} + ${d % 60}$ donc $${d}$min $= ${Math.floor(d / 60)}$${sp(1)}h${sp(1)}$${d % 60}$${sp(1)}min.`,
              bleuMathalea,
            ) + '<br>'
        } else {
          texteCorr =
            texteEnCouleur(
              `
           Mentalement : <br>
      On cherche le multiple de $60$ inférieur à $${d}$ le plus grand possible. C'est $${Math.floor(d / 60)}\\times 60 = ${Math.floor(d / 60) * 60}$.<br>
      Ainsi $${d} = ${Math.floor(d / 60) * 60} + ${d % 60}$ donc $${d}$s $= ${Math.floor(d / 60)}$${sp(1)}min${sp(1)}$${d % 60}$${sp(1)}s.`,
              bleuMathalea,
            ) + '<br>'
        }
        this.listeCanEnonces.push(this.canEnonce)
        this.listeCanReponsesACompleter.push(this.canReponseACompleter)
      } else {
        if (this.correctionDetaillee) {
          texteCorr = `On doit effectuer la division euclidienne de ${d} par 60 car il y a 60 minutes dans une heure.<br>Le quotient entier donne le nombre d'heures et le reste enter donne le nombre de minutes.<br>`
        } else {
          texteCorr = ''
        }
      }
      if (listeTypeQuestions[i] === 'min vers h et min') {
        texteCorr += `$${d} = (${a} \\times 60) + ${b}$ donc $${d}$ minutes = ${texteEnCouleurEtGras(minToHoraire(a * 60 + b))}.`
      } else {
        texteCorr += `$${d} = (${a} \\times 60) + ${b}$ donc $${d}$ s = ${texteEnCouleurEtGras(`${a}${sp()}min${sp()}${b}${sp()}s`)}.`
      }
      if (this.questionJamaisPosee(i, a, b, d)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr

        if (context.isAmc) {
          if (listeTypeQuestions[i] === 'min vers h et min') {
            this.autoCorrection[i] = {
              enonce: texte,
              options: { multicols: true },
              propositions: [
                {
                  type: 'AMCNum',
                  propositions: [
                    {
                      texte: texteCorr,
                      statut: '',
                      reponse: {
                        texte: 'Heure(s)',
                        valeur: a,
                        param: {
                          digits: 1,
                          decimals: 0,
                          signe: false,
                          approx: 0,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'AMCNum',
                  propositions: [
                    {
                      texte: '',
                      statut: '',
                      reponse: {
                        texte: 'Minute(min)',
                        valeur: b,
                        param: {
                          digits: 2,
                          decimals: 0,
                          signe: false,
                          approx: 0,
                        },
                      },
                    },
                  ],
                },
              ],
            }
          } else {
            this.autoCorrection[i] = {
              enonce: texte,
              options: { multicols: true },
              propositions: [
                {
                  type: 'AMCNum',
                  propositions: [
                    {
                      texte: texteCorr,
                      statut: '',
                      reponse: {
                        texte: 'Minutes(min)',
                        valeur: a,
                        param: {
                          digits: 1,
                          decimals: 0,
                          signe: false,
                          approx: 0,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'AMCNum',
                  propositions: [
                    {
                      texte: '',
                      statut: '',
                      reponse: {
                        texte: 'Secondes(s)',
                        valeur: b,
                        param: {
                          digits: 2,
                          decimals: 0,
                          signe: false,
                          approx: 0,
                        },
                      },
                    },
                  ],
                },
              ],
            }
          }
        } else {
          if (listeTypeQuestions[i] === 'min vers h et min') {
            handleAnswers(this, i, {
              reponse: {
                value: new Hms({ hour: a, minute: b }).toString(),
                options: { HMS: true },
              },
            })
          } else {
            handleAnswers(this, i, {
              reponse: {
                value: new Hms({ minute: a, second: b }).toString(),
                options: { HMS: true },
              },
            })
          }
        }

        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
