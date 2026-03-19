import { tableauColonneLigne } from '../../lib/2d/tableau'
import { propositionsQcm } from '../../lib/interactif/qcm'
import {
  choice,
  combinaisonListesSansChangerOrdre,
  shuffle,
} from '../../lib/outils/arrayOutils'
import { texteEnCouleurEtGras } from '../../lib/outils/embellissements'
import { arrondi } from '../../lib/outils/nombres'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const dateDeModifImportante = '01/06/2024'
export const titre = 'Reconnaitre des tableaux de proportionnalité'
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

/**
 * * Justifier qu'un tableau est un tableau de proportionnalité ou non
 * @author Sébastien Lozano
 */

export const uuid = 'aa997'

export const refs = {
  'fr-fr': ['5P10', 'BP2AutoL3'],
  'fr-ch': ['9FA3-3'],
}

// une fonction pour la justification
function justificationsOK(
  n1: number,
  n2: number,
  n3: number,
  coeff: number,
  sens: string,
) {
  let sortie
  switch (sens) {
    case 'L1L2':
      sortie = `$\\dfrac{\\textcolor{blue}{${n1}}}{\\textcolor{red}{${n1 * coeff}}} = \\dfrac{\\textcolor{blue}{${n2}}}{\\textcolor{red}{${n2 * coeff}}} = \\dfrac{\\textcolor{blue}{${n3}}}{\\textcolor{red}{${n3 * coeff}}}$`
      break
    case 'L2L1':
      sortie = `$\\dfrac{\\textcolor{red}{${n1 * coeff}}}{\\textcolor{blue}{${n1}}} = \\dfrac{\\textcolor{red}{${n2 * coeff}}}{\\textcolor{blue}{${n2}}} = \\dfrac{\\textcolor{red}{${n3 * coeff}}}{\\textcolor{blue}{${n3}}}$`
      break
  }
  return sortie
}

// une fonction pour la justification sens1
function justificationsKO(
  n1: number,
  n2: number,
  n3: number,
  coeff: number,
  operation: string,
  sens: string,
) {
  let sortie
  const isEq = function (n1: number, n2: number, coeff: number) {
    if (arrondi(n1 / (n1 + coeff), 8) === arrondi(n2 / (n2 + coeff), 8)) {
      return '='
    } else {
      return '\\neq'
    }
  }
  let color1, color2
  switch (sens) {
    case 'L1L2':
      color1 = 'red'
      color2 = 'blue'
      break
    case 'L2L1':
      color1 = 'blue'
      color2 = 'red'
      break
  }
  switch (operation) {
    case '+':
      sortie = `$\\dfrac{\\textcolor{${color2}}{${n1}}}{\\textcolor{${color1}}{${n1 + coeff}}}`
      sortie += isEq(n1, n2, coeff)
      sortie += `\\dfrac{\\textcolor{${color2}}{${n2}}}{\\textcolor{${color1}}{${n2 + coeff}}}`
      sortie += isEq(n2, n3, coeff)
      sortie += `\\dfrac{\\textcolor{${color2}}{${n3}}}{\\textcolor{${color1}}{${n3 + coeff}}}$`
      break
    case '-':
      sortie = `$\\dfrac{\\textcolor{${color2}}{${n1}}}{\\textcolor{${color1}}{${n1 - coeff}}}`
      sortie += isEq(n1, n2, coeff)
      sortie += `\\dfrac{\\textcolor{${color2}}{${n2}}}{\\textcolor{${color1}}{${n2 - coeff}}}`
      sortie += isEq(n2, n3, coeff)
      sortie += `\\dfrac{\\textcolor{${color2}}{${n3}}}{\\textcolor{${color1}}{${n3 - coeff}}}$`
      break
  }
  return sortie
}

export default class TableauxEtProportionnalite extends Exercice {
  constructor() {
    super()

    this.sup = 1

    this.nbQuestions = 4

    this.interactif = false

    context.isHtml ? (this.spacing = 3) : (this.spacing = 2)
    context.isHtml ? (this.spacingCorr = 2.5) : (this.spacingCorr = 1.5)
  }

  nouvelleVersion() {
    let typesDeQuestionsDisponibles = [choice([0, 1]), 2, choice([3, 4]), 5]
    typesDeQuestionsDisponibles = shuffle(typesDeQuestionsDisponibles)

    this.consigne = this.interactif
      ? ''
      : 'Dire si les tableaux suivants sont de tableaux de proportionnalité. Justifier.'

    const listeTypeDeQuestions = combinaisonListesSansChangerOrdre(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    ) // Tous les types de questions sont posées --> à remettre comme ci-dessus

    for (
      let i = 0, texte, texteCorr, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      const n1 = randint(5, 9)
      const n2 = randint(5, 9, [n1])
      const n3 = randint(5, 9, [n1, n2])
      const coeff = randint(2, 9)
      const coeffSoust = randint(2, 4)

      // pour les décimaux seulement en demis
      const u1 = randint(1, 9)
      let ci1 = choice([0, 5])
      const u2 = randint(1, 9)
      let ci2 = choice([0, 5])
      const u3 = randint(1, 9)
      let ci3 = choice([0, 5])

      while (ci1 === 0 && ci2 === 0 && ci3 === 0) {
        ci1 = choice([0, 5])
        ci2 = choice([0, 5])
        ci3 = choice([0, 5])
      }

      // pour les situations, autant de situations que de cas dans le switch !
      const situations = [
        {
          // case 0 --> multiplication ligne1 vers ligne2
          tableau: tableauColonneLigne(
            [
              '\\phantom{000}' + n1 + '\\phantom{000}',
              '\\phantom{000}' + n2 + '\\phantom{000}',
              '\\phantom{000}' + n3 + '\\phantom{000}',
            ],
            [n1 * coeff],
            [n2 * coeff, n3 * coeff],
            1,
            true,
            this.numeroExercice,
            i,
            false,
            { L0C0: 'white', L0C1: 'white', L0C2: 'white', L1C0: 'white' },
          ),
          justification_L1_L2: justificationsOK(n1, n2, n3, coeff, 'L1L2'),
          justification_L2_L1: justificationsOK(n1, n2, n3, coeff, 'L2L1'),
          isProportionnel: texteEnCouleurEtGras(
            "C'est donc un tableau de proportionnalité.",
          ),
          areEgaux: 'égaux',
        },
        {
          // case 1 --> multiplication ligne1 vers ligne2 Décimaux
          tableau: tableauColonneLigne(
            [
              '\\phantom{000}' + texNombre(u1 + ci1 / 10, 1) + '\\phantom{000}',
              '\\phantom{000}' + texNombre(u2 + ci2 / 10, 1) + '\\phantom{000}',
              '\\phantom{000}' + texNombre(u3 + ci3 / 10, 1) + '\\phantom{000}',
            ],
            [texNombre((u1 + ci1 / 10) * coeff, 1)],
            [
              texNombre((u2 + ci2 / 10) * coeff, 1),
              texNombre((u3 + ci3 / 10) * coeff, 1),
            ],
            1,
            true,
            this.numeroExercice,
            i,
            false,
            { L0C0: 'white', L0C1: 'white', L0C2: 'white', L1C0: 'white' },
          ),
          justification_L1_L2: justificationsOK(
            u1 + ci1 / 10,
            u2 + ci2 / 10,
            u3 + ci3 / 10,
            coeff,
            'L1L2',
          ),
          justification_L2_L1: justificationsOK(
            u1 + ci1 / 10,
            u2 + ci2 / 10,
            u3 + ci3 / 10,
            coeff,
            'L2L1',
          ),
          isProportionnel: texteEnCouleurEtGras(
            "C'est donc un tableau de proportionnalité.",
          ),
          areEgaux: 'égaux',
        },
        {
          // case 2 --> division ligne1 vers ligne2
          tableau: tableauColonneLigne(
            [
              '\\phantom{000}' + n1 * coeff + '\\phantom{000}',
              '\\phantom{000}' + n2 * coeff + '\\phantom{000}',
              '\\phantom{000}' + n3 * coeff + '\\phantom{000}',
            ],
            [n1],
            [n2, n3],
            1,
            true,
            this.numeroExercice,
            i,
            false,
            { L0C0: 'white', L0C1: 'white', L0C2: 'white', L1C0: 'white' },
          ),
          justification_L1_L2: justificationsOK(
            n1 * coeff,
            n2 * coeff,
            n3 * coeff,
            1 / coeff,
            'L1L2',
          ),
          justification_L2_L1: justificationsOK(
            n1 * coeff,
            n2 * coeff,
            n3 * coeff,
            1 / coeff,
            'L2L1',
          ),
          isProportionnel: texteEnCouleurEtGras(
            "C'est donc un tableau de proportionnalité.",
          ),
          areEgaux: 'égaux',
        },
        {
          // case 3 --> addition ligne1 vers ligne2
          tableau: tableauColonneLigne(
            [
              '\\phantom{000}' + n1 + '\\phantom{000}',
              '\\phantom{000}' + n2 + '\\phantom{000}',
              '\\phantom{000}' + n3 + '\\phantom{000}',
            ],
            [n1 + coeff],
            [n2 + coeff, n3 + coeff],
            1,
            true,
            this.numeroExercice,
            i,
            false,
            { L0C0: 'white', L0C1: 'white', L0C2: 'white', L1C0: 'white' },
          ),
          justification_L1_L2: justificationsKO(n1, n2, n3, coeff, '+', 'L1L2'),
          justification_L2_L1: justificationsKO(
            n1 + coeff,
            n2 + coeff,
            n3 + coeff,
            -coeff,
            '+',
            'L2L1',
          ),
          isProportionnel: texteEnCouleurEtGras(
            "Ce n'est donc pas un tableau de proportionnalité.",
          ),
          areEgaux: 'différents',
        },
        {
          // case 4 --> addition ligne1 vers ligne2 Décimaux
          tableau: tableauColonneLigne(
            [
              '\\phantom{000}' + texNombre(u1 + ci1 / 10, 1) + '\\phantom{000}',
              '\\phantom{000}' + texNombre(u2 + ci2 / 10, 1) + '\\phantom{000}',
              '\\phantom{000}' + texNombre(u3 + ci3 / 10, 1) + '\\phantom{000}',
            ],
            [texNombre(u1 + ci1 / 10 + coeff, 1)],
            [
              texNombre(u2 + ci2 / 10 + coeff, 1),
              texNombre(u3 + ci3 / 10 + coeff, 1),
            ],
            1,
            true,
            this.numeroExercice,
            i,
            false,
            { L0C0: 'white', L0C1: 'white', L0C2: 'white', L1C0: 'white' },
          ),
          justification_L1_L2: justificationsKO(
            u1 + ci1 / 10,
            u2 + ci2 / 10,
            u3 + ci3 / 10,
            coeff,
            '+',
            'L1L2',
          ),
          justification_L2_L1: justificationsKO(
            u1 + ci1 / 10,
            u2 + ci2 / 10,
            u3 + ci3 / 10,
            coeff,
            '+',
            'L2L1',
          ),
          isProportionnel: texteEnCouleurEtGras(
            "Ce n'est donc pas un tableau de proportionnalité.",
          ),
          areEgaux: 'différents',
        },
        {
          // case 5 --> soustraction ligne1 vers ligne2
          tableau: tableauColonneLigne(
            [
              '\\phantom{000}' + n1 + '\\phantom{000}',
              '\\phantom{000}' + n2 + '\\phantom{000}',
              '\\phantom{000}' + n3 + '\\phantom{000}',
            ],
            [n1 - coeffSoust],
            [n2 - coeffSoust, n3 - coeffSoust],
            1,
            true,
            this.numeroExercice,
            i,
            false,
            { L0C0: 'white', L0C1: 'white', L0C2: 'white', L1C0: 'white' },
          ),
          justification_L1_L2: justificationsKO(
            n1,
            n2,
            n3,
            coeffSoust,
            '-',
            'L1L2',
          ),
          justification_L2_L1: justificationsKO(
            n1 - coeffSoust,
            n2 - coeffSoust,
            n3 - coeffSoust,
            -coeffSoust,
            '-',
            'L2L1',
          ),
          isProportionnel: texteEnCouleurEtGras(
            "Ce n'est donc pas un tableau de proportionnalité.",
          ),
          areEgaux: 'différents',
        },
      ]

      const enonces = []
      for (let k = 0; k < situations.length; k++) {
        enonces.push({
          enonce: `${situations[k].tableau}`,
          question: '',
          correction: `Pour déterminer si c'est un tableau de proportionnalité, il suffit de comparer les quotients d'un nombre de la première ligne par le nombre correspondant de la seconde ligne ou inversement.
<br> Soit ${situations[k].justification_L1_L2}, on constate qu'ils sont ${situations[k].areEgaux}.
<br>Ou bien ${situations[k].justification_L2_L1}, on constate aussi qu'ils sont ${situations[k].areEgaux}.
<br>${situations[k].isProportionnel}`,
        })
      }

      // autant de cases que d'elements dans le tableau des situations
      texte = `${enonces[listeTypeDeQuestions[i]].enonce}`
      texte += this.interactif
        ? 'Le tableau ci-dessus est-il un tableau de proportionnalité ?'
        : ''
      texteCorr = `${enonces[listeTypeDeQuestions[i]].correction}`

      this.autoCorrection[i] = {}
      this.autoCorrection[i].options = { ordered: true, radio: true }
      this.autoCorrection[i].enonce = `${texte}\n`
      this.autoCorrection[i].propositions = [
        {
          texte: 'Oui',
          statut: !enonces[listeTypeDeQuestions[i]].correction.includes('pas'),
        },
        {
          texte: 'Non',
          statut: enonces[listeTypeDeQuestions[i]].correction.includes('pas'),
        },
      ]
      const props = propositionsQcm(this, i)
      if (this.interactif) {
        texte += props.texte
      }

      if (this.listeQuestions.indexOf(texte) === -1) {
        // Si la question n'a jamais été posée, on en créé une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
