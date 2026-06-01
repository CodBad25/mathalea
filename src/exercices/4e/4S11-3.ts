import { addMultiMathfield } from '../../lib/interactif/MultiMathfield/MultiMathfield'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { propositionsQcm } from '../../lib/interactif/qcm'
import {
  choice,
  combinaisonListes,
  shuffle,
} from '../../lib/outils/arrayOutils'
import {
  miseEnEvidence,
  texteEnCouleurEtGras,
} from '../../lib/outils/embellissements'
import { entreprise } from '../../lib/outils/entreprises'
import { texNombre } from '../../lib/outils/texNombre'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  "Différencier moyenne et médianes sur les salaires d'une entreprise"

export const interactifReady = true
export const interactifType = ['qcm', 'mathLive']
export const dateDePublication = '15/05/2026'

export const uuid = '0f388'
export const refs = {
  'fr-fr': ['4S11-3'],
  'fr-ch': [''],
}
/**
 * Différencier moyenne et médiane sur les salaires d'une entreprise :
 * L'une a beaucoup de petits salaires et un gros, l'autre a des salaires homogènes.
 * @author Mireille Gain
 */
export default class MedianeMoyenneSalaires extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 2
  }

  nouvelleVersion() {
    const typeQuestionsDisponibles = ['EntreprisePDG', 'EntrepriseCoop']
    const listeTypeQuestions = combinaisonListes(
      typeQuestionsDisponibles,
      this.nbQuestions,
    )
    this.consigne =
      this.nbQuestions > 1
        ? 'Calculer la moyenne et la médiane des salaires dans chacune de ces entreprises, et cocher la bonne interprétation.'
        : 'Calculer la moyenne et la médiane des salaires dans cette entreprise, et cocher la bonne interprétation.'

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const indiceSalaireBase = randint(17, 22)
      const S1 = indiceSalaireBase * 100
      const S2 = S1 + choice([0, 2]) * 50
      const S3 = S2 + choice([1, 3]) * 50
      const S4 = S3 + choice([0, 3]) * 50
      const S5pdg = indiceSalaireBase * 1000
      const S5coop = S4 + choice([1, 3]) * 50

      let texte = ''
      let texteCorr = ''
      const entreprisePdg = entreprise(1)
      const entrepriseCoop = entreprise(1)
      let moyenne = 0
      this.autoCorrection[2 * i + 1] = {}
      this.autoCorrection[2 * i + 1].options = {
        ordered: true,
        radio: true,
        vertical: true,
      }
      switch (listeTypeQuestions[i]) {
        case 'EntreprisePDG':
          const salairesPdg = [
            texNombre(S1),
            texNombre(S2),
            texNombre(S3),
            texNombre(S4),
            texNombre(S5pdg),
          ]
          const salairesPdgMelanges = shuffle([...salairesPdg])
          const salairesPdgTexte = salairesPdgMelanges
            .map((s) => s.replace(/\\[, ]/g, ' '))
            .join(' €, ')
          moyenne = (S1 + S2 + S3 + S4 + S5pdg) / 5
          texte += `Dans ${entreprisePdg}, les salaires sont les suivants : <br>`
          texte += `${salairesPdgTexte} €.<br>`

          texteCorr += `Le salaire moyen dans ${entreprisePdg} est : <br>`
          texteCorr += `$(${texNombre(S1)}\\text{€} + ${texNombre(S2)}\\text{€} + ${texNombre(S3)}\\text{€} + ${texNombre(S4)}\\text{€} + ${texNombre(S5pdg)}\\text{€}) \\div 5 = $`
          texteCorr += `$${miseEnEvidence(moyenne)}~\\text{€}.$<br>`
          texteCorr += `Les salaires ordonnés du plus petit au plus grand sont : `
          texteCorr += `$ ${texNombre(S1)}\\text{€} , ${texNombre(S2)}\\text{€} , ${texNombre(S3)}\\text{€} , ${texNombre(S4)}\\text{€} , ${texNombre(S5pdg)}\\text{€}. $<br>`
          texteCorr += `La médiane des salaires est donc égale au troisième salaire par ordre croissant : `
          texteCorr += `$${miseEnEvidence(texNombre(S3))}~\\text{€} $<br><br>`
          texteCorr += `Dans ${entreprisePdg}, la moyenne ($${miseEnEvidence(moyenne)}$ €) est très supérieure à la médiane ($${miseEnEvidence(texNombre(S3))}$ €).<br>`
          texteCorr += `Cela signifie que le plus haut salaire augmente fortement la moyenne des salaires, et que les salaires sont majoritairement très inférieurs à cette moyenne.<br><br>`
          texteCorr += `La bonne interprétation était donc :<br> ${texteEnCouleurEtGras('Dans cette entreprise, la moyenne des salaires est très supérieure à la médiane, ce qui signifie que le plus haut salaire augmente fortement la moyenne.')} `
          this.autoCorrection[2 * i + 1].propositions = [
            {
              texte:
                'Dans cette entreprise, la moyenne et la médiane des salaires sont proches, ce qui signifie que les salaires sont proches les uns des autres.',
              statut: false,
            },
            {
              texte: `Dans cette entreprise, la moyenne des salaires est très supérieure à la médiane, ce qui signifie que le plus haut salaire augmente fortement la moyenne.`,
              statut: true,
            },
          ]

          if (this.interactif) {
            texte += addMultiMathfield(this, 2 * i, {
              dataTemplate: `
              Moyenne des salaires dans ${entreprisePdg} : %{champ1} €
               Médiane des salaires dans ${entreprisePdg} : %{champ2} €
               `,
              dataOptions: {
                champ1: {
                  keyboard: KeyboardType.clavierDeBase,
                },
                champ2: {
                  keyboard: KeyboardType.clavierDeBase,
                },
              },
            })
          }

          break
        default: // 'EntrepriseCoop':
          const salairesCoop = [
            texNombre(S1),
            texNombre(S2),
            texNombre(S3),
            texNombre(S4),
            texNombre(S5coop),
          ]
          const salairesCoopMelanges = shuffle([...salairesCoop])
          const salairesCoopTexte = salairesCoopMelanges
            .map((s) => s.replace(/\\[, ]/g, ' '))
            .join(' €, ')
          moyenne = (S1 + S2 + S3 + S4 + S5coop) / 5
          texte += `Dans ${entrepriseCoop}, les salaires sont les suivants : <br>`
          texte += `${salairesCoopTexte} €.<br>`
          texteCorr += `Le salaire moyen dans ${entrepriseCoop} est : <br>`
          texteCorr += `$(${texNombre(S1)}\\text{€} + ${texNombre(S2)}\\text{€} + ${texNombre(S3)}\\text{€} + ${texNombre(S4)}\\text{€} + ${texNombre(S5coop)}\\text{€}) \\div 5 = $`
          texteCorr += `$${miseEnEvidence(moyenne)}~\\text{€}.$<br><br>`
          texteCorr += `Les salaires ordonnés du plus petit au plus grand sont : `
          texteCorr += `$ ${texNombre(S1)}\\text{€} , ${texNombre(S2)}\\text{€} , ${texNombre(S3)}\\text{€} , ${texNombre(S4)}\\text{€} , ${texNombre(S5coop)}\\text{€}. $<br>`
          texteCorr += `La médiane des salaires est donc égale au troisième salaire par ordre croissant : `
          texteCorr += `$${miseEnEvidence(texNombre(S3))}~\\text{€} $<br><br>`
          texteCorr += `Dans ${entrepriseCoop}, la moyenne ($${miseEnEvidence(moyenne)}$ €) et la médiane ($${miseEnEvidence(texNombre(S3))}$ €) sont proches.<br>`
          texteCorr += `Cela signifie que les salaires sont proches les uns des autres.<br><br>`
          texteCorr += `La bonne interprétation était donc : <br> ${texteEnCouleurEtGras('Dans cette entreprise, la moyenne et la médiane des salaires sont proches, ce qui signifie que les salaires sont proches les uns des autres.')} `

          this.autoCorrection[2 * i + 1].propositions = [
            {
              texte:
                'Dans cette entreprise, la moyenne et la médiane des salaires sont proches, ce qui signifie que les salaires sont proches les uns des autres.',
              statut: true,
            },
            {
              texte:
                'Dans cette entreprise, la moyenne des salaires est très supérieure à la médiane, ce qui signifie que le plus haut salaire augmente fortement la moyenne.',
              statut: false,
            },
          ]
          if (this.interactif) {
            texte += addMultiMathfield(this, 2 * i, {
              dataTemplate: `
              Moyenne des salaires dans ${entrepriseCoop} : %{champ1} €
               Médiane des salaires dans ${entrepriseCoop} : %{champ2} €
               `,
              dataOptions: {
                champ1: {
                  keyboard: KeyboardType.clavierDeBase,
                },
                champ2: {
                  keyboard: KeyboardType.clavierDeBase,
                },
              },
            })
          }
          break
      }

      handleAnswers(
        this,
        2 * i,
        {
          champ1: { value: moyenne },
          champ2: { value: S3 },
        },
        { formatInteractif: 'multiMathfield' },
      )

      const props = propositionsQcm(this, 2 * i + 1)
      texte += props.texte

      // Ajouter la question à la liste
      this.listeQuestions[i] = texte

      if (this.questionJamaisPosee(i, S1, S2, S3, S4, S5pdg, S5coop)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
