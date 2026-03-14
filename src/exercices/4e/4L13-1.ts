import { texteEnCouleur } from '../../lib/outils/embellissements'
import { prenom } from '../../lib/outils/Personne'
import Exercice from '../Exercice'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import { ajouteQuestionMathlive } from '../../lib/interactif/questionMathLive'
export const interactifReady = true
export const interactifType = 'mathLive'
export const titre =
  'Produire une forme littérale en introduisant une lettre pour désigner une valeur inconnue'

/**
 * Produire une forme littérale en introduisant une lettre pour désigner une valeur inconnue
 * @author Sébastien Lozano, modifié par François-Rémi Zawadzki
 */
export const uuid = '8b18b'

export const refs = {
  'fr-fr': ['4L13-1', 'BP2RES2'],
  'fr-ch': ['9FA2-9', '10FA3-10'],
}

const pluriel = function (
  n: number,
  obj: { lettre: string; article: string; sing: string; plur: string },
) {
  if (n > 1) {
    return obj.plur
  } else {
    return obj.sing
  }
}

// une fonction pour gérer la chaine de sortie et supprimer le coeff 1 !
const sliceUn = function (n: number) {
  if (n === 1) {
    return ''
  } else {
    return `${n}`
  }
}
export default class FormeLitteraleIntroduireUneLettre extends Exercice {
  constructor() {
    super()
    this.sup = 1
    this.nbQuestions = 2
    this.consigne =
      "Exprimer le prix total de l'achat, en fonction des lettres introduites dans l'énoncé."
  }

  nouvelleVersion() {
    for (
      let i = 0, texte, texteCorr, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      // une fonction pour gérer le pluriel

      // on definit un tableau de couples possibles
      const situations = [
        {
          prenom: prenom(),
          elt1: { lettre: 'c', article: 'un', sing: 'crayon', plur: 'crayons' },
          elt2: { lettre: 'g', article: 'une', sing: 'gomme', plur: 'gommes' },
        },
        {
          prenom: prenom(),
          elt1: { lettre: 'r', article: 'une', sing: 'règle', plur: 'règles' },
          elt2: {
            lettre: 'e',
            article: 'une',
            sing: 'équerre',
            plur: 'équerres',
          },
        },
        {
          prenom: prenom(),
          elt1: { lettre: 'p', article: 'une', sing: 'poire', plur: 'poires' },
          elt2: {
            lettre: 'b',
            article: 'une',
            sing: 'banane',
            plur: 'bananes',
          },
        },
        {
          prenom: prenom(),
          elt1: {
            lettre: 'c',
            article: 'un',
            sing: 'couteau',
            plur: 'couteaux',
          },
          elt2: {
            lettre: 'f',
            article: 'une',
            sing: 'fourchette',
            plur: 'fourchettes',
          },
        },
        {
          prenom: prenom(),
          elt1: {
            lettre: 'm',
            article: 'un',
            sing: 'marteau',
            plur: 'marteaux',
          },
          elt2: {
            lettre: 'e',
            article: 'une',
            sing: 'enclume',
            plur: 'enclumes',
          },
        },
        {
          prenom: prenom(),
          elt1: {
            lettre: 'r',
            article: 'un',
            sing: 'roman',
            plur: 'romans',
          },
          elt2: {
            lettre: 'm',
            article: 'un',
            sing: 'manga',
            plur: 'mangas',
          },
        },
        {
          prenom: prenom(),
          elt1: {
            lettre: 'p',
            article: 'un',
            sing: 'poireau',
            plur: 'poireaux',
          },
          elt2: {
            lettre: 'n',
            article: 'un',
            sing: 'navet',
            plur: 'navets',
          },
        },
        {
          prenom: prenom(),
          elt1: {
            lettre: 'b',
            article: 'un',
            sing: 'bracelet',
            plur: 'bracelet',
          },
          elt2: {
            lettre: 'c',
            article: 'un',
            sing: 'collier',
            plur: 'colliers',
          },
        },
        {
          prenom: prenom(),
          elt1: {
            lettre: 'p',
            article: 'un',
            sing: 'pantalon',
            plur: 'patallons',
          },
          elt2: {
            lettre: 't',
            article: 'un',
            sing: 't-shirt',
            plur: 't-shirts',
          },
        },
        {
          prenom: prenom(),
          elt1: {
            lettre: 'c',
            article: 'un',
            sing: 'CD',
            plur: 'CDs',
          },
          elt2: {
            lettre: 'v',
            article: 'un',
            sing: 'vynil',
            plur: 'vynils',
          },
        },
        {
          prenom: prenom(),
          elt1: {
            lettre: 'm',
            article: 'un',
            sing: 'crayon',
            plur: 'crayons',
          },
          elt2: {
            lettre: 'g',
            article: 'une',
            sing: 'gomme',
            plur: 'gommes',
          },
        },
        {
          prenom: prenom(),
          elt1: {
            lettre: 'r',
            article: 'une',
            sing: 'rose',
            plur: 'roses',
          },
          elt2: {
            lettre: 't',
            article: 'une',
            sing: 'tulipe',
            plur: 'tulipes',
          },
        },
        {
          prenom: prenom(),
          elt1: {
            lettre: 'c',
            article: 'un',
            sing: 'croissant',
            plur: 'croissants',
          },
          elt2: {
            lettre: 'p',
            article: 'un',
            sing: 'pain au chocolat',
            plur: 'pains au chocolat',
          },
        },
        {
          prenom: prenom(),
          elt1: {
            lettre: 'c',
            article: 'un',
            sing: 'café',
            plur: 'cafés',
          },
          elt2: {
            lettre: 't',
            article: 'un',
            sing: 'thé',
            plur: 'thés',
          },
        },
        {
          prenom: prenom(),
          elt1: {
            lettre: 'g',
            article: 'une',
            sing: 'glace',
            plur: 'glaces',
          },
          elt2: {
            lettre: 's',
            article: 'un',
            sing: 'sorbet',
            plur: 'sorbets',
          },
        },
        {
          prenom: prenom(),
          elt1: {
            lettre: 'e',
            article: 'une',
            sing: 'écharpe',
            plur: 'écharpes',
          },
          elt2: {
            lettre: 'b',
            article: 'un',
            sing: 'bonnet',
            plur: 'bonnets',
          },
        },
      ]
      const enonces = []
      const n = randint(1, 6)
      const p = randint(1, 6)
      const situation = situations[randint(0, situations.length - 1)]
      enonces.push({
        enonce: `${situation.prenom} veut acheter ${n} ${pluriel(n, situation.elt1)} et ${p} ${pluriel(p, situation.elt2)}.
<br>On note $${situation.elt1.lettre}$ le prix d'${situation.elt1.article} ${situation.elt1.sing} et $${situation.elt2.lettre}$ le prix d'${situation.elt2.article} ${situation.elt2.sing}.`,
        question: '',
        correction: `
        ${situation.prenom} va payer $${n}$ fois le prix d'${situation.elt1.article} ${situation.elt1.sing} et $${p}$ fois le prix d'${situation.elt2.article} ${situation.elt2.sing}.
        <br> C'est-à-dire $${n}\\times ${situation.elt1.lettre} + ${p}\\times ${situation.elt2.lettre} = ${sliceUn(n)}${situation.elt1.lettre} + ${sliceUn(p)}${situation.elt2.lettre}$.
        <br>${texteEnCouleur(`Donc le prix total de l'achat est  $${sliceUn(n)}${situation.elt1.lettre} + ${sliceUn(p)}${situation.elt2.lettre}$.`)}
        `,
      })
      texte = `${enonces[0].enonce}`
      texteCorr = `${enonces[0].correction}`
      const formule = `${sliceUn(n)}${situation.elt1.lettre} + ${sliceUn(p)}${situation.elt2.lettre}`

      if (
        this.questionJamaisPosee(i, situation.elt1.sing, situation.elt2.sing)
      ) {
        // Si la question n'a jamais été posée, on en créé une autre
        this.listeQuestions[i] =
          texte +
          ajouteQuestionMathlive({
            exercice: this, // ça, c'est pour que la fonction récupère un pointeur sur ton exo
            question: i, // ça, c'est pour qu'il numérote correctement l'input
            typeInteractivite: 'mathlive', // ça, c'est l'input le plus souvent utilisé
            objetReponse: {
              // ça c'est ce qui définit la réponse attendue et la façon dont elle doit être vérifiée
              reponse: {
                value: formule,
                options: { calculFormel: true },
              },
            },
          })

        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
