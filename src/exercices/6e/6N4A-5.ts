import {
  addMathaleaCouteauSuisse,
  type MathaleaCouteauSuisseChild,
} from '../../lib/customElements/MathaleaCouteauSuisse'
import {
  SchemaEnBarreElement,
  textesVides,
  TYPES_SCHEMA_EN_BARRE,
  type SchemaEnBarreType,
} from '../../lib/customElements/SchemaEnBarreElement'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { combinaisonListes } from '../../lib/outils/arrayOutils'
import { texNombre } from '../../lib/outils/texNombre'
import {
  problemesSchemasEnBarre,
  texConclusion,
  texLigneCalcul,
  type ProblemeSchemaEnBarre,
} from '../../lib/problems/problemesSchemasEnBarre'
import {
  gestionnaireFormulaireTexte,
  listeQuestionsToContenu,
} from '../../modules/outils'
import { context } from '../../modules/context'
import Exercice from '../Exercice'

export const titre = 'Modéliser un problème par un schéma en barre'
export const dateDePublication = '19/09/2026'
export const interactifReady = true
export const uuid = 'b7c21'
export const refs = {
  'fr-fr': ['6N4A-5'],
  'fr-ch': [],
}

/**
 * Le champ de la phrase de conclusion est un second enfant du couteau suisse :
 * il reçoit un index de question décalé pour que ses identifiants
 * (`champTexteEx…Q…`, `resultatCheckEx…Q…`) ne se confondent pas avec ceux du
 * schéma, qui porte l'index de la question.
 */
const DECALAGE_INDEX_CONCLUSION = 100

/**
 * L'élève choisit parmi les quatre schémas en barre celui qui modélise le
 * problème (additif ou multiplicatif, parties-tout ou comparaison), le
 * complète avec les données de l'énoncé et un « ? » pour la valeur cherchée,
 * puis écrit la réponse dans la phrase de conclusion.
 * @author Rémi Angot
 */
export default class ModeliserParUnSchemaEnBarre extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 4
    this.besoinFormulaireTexte = [
      'Types de problèmes',
      'Nombres séparés par des tirets :\n1 : Additif de parties-tout\n2 : Additif de comparaison\n3 : Multiplicatif de parties-tout\n4 : Multiplicatif de comparaison\n5 : Mélange',
    ]
    this.sup = '5'
    this.besoinFormulaire2CaseACocher = [
      "Imposer le type de schéma (l'élève ne fait que le compléter)",
      false,
    ]
    this.sup2 = false
    this.besoinFormulaire3CaseACocher = ['Unités dans les calculs', false]
    this.sup3 = false
  }

  nouvelleVersion() {
    const types = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: 4,
      defaut: 5,
      melange: 5,
      nbQuestions: this.nbQuestions,
    }).map((n) => TYPES_SCHEMA_EN_BARRE[Number(n) - 1])
    const tirages = Object.fromEntries(
      TYPES_SCHEMA_EN_BARRE.map((type) => [
        type,
        combinaisonListes(problemesSchemasEnBarre[type], this.nbQuestions),
      ]),
    ) as Record<SchemaEnBarreType, (() => ProblemeSchemaEnBarre)[]>
    const indices = Object.fromEntries(
      TYPES_SCHEMA_EN_BARRE.map((type) => [type, 0]),
    ) as Record<SchemaEnBarreType, number>
    this.consigne = this.sup2
      ? 'Compléter le schéma avec les données du problème, en écrivant « ? » pour la valeur cherchée, puis répondre à la question.'
      : 'Choisir le schéma qui modélise le problème et le compléter avec ses données, en écrivant « ? » pour la valeur cherchée, puis répondre à la question.'

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; cpt++) {
      const type = types[i]
      const probleme = tirages[type][indices[type]++ % tirages[type].length]()
      if (!this.questionJamaisPosee(i, probleme.enonce)) continue
      const { attendu, conclusion } = probleme
      const typeImpose = this.sup2 ? attendu.type : undefined
      const numeroExercice = this.numeroExercice ?? 0
      const indexConclusion = i + DECALAGE_INDEX_CONCLUSION
      const uniteEtSuite = `${conclusion.unite}${conclusion.apres === '' ? '.' : ` ${conclusion.apres}`}`

      let schema = ''
      if (this.interactif) {
        schema = SchemaEnBarreElement.create({
          numeroExercice,
          questionIndex: i,
          typeImpose,
        })
      } else if (typeImpose != null) {
        // Sur papier ou sans interactivité : le gabarit vide du schéma imposé.
        schema = SchemaEnBarreElement.create({
          id: `schemaEnBarreVideEx${numeroExercice}Q${i}`,
          numeroExercice,
          questionIndex: i,
          typeImpose,
          interactivityOn: false,
        })
      }
      const phrase = this.interactif
        ? ajouteChampTexteMathLive(
            this,
            indexConclusion,
            KeyboardType.clavierDeBase,
            { texteAvant: conclusion.avant, texteApres: uniteEtSuite },
          )
        : `${conclusion.avant} $\\ldots\\ldots$ ${uniteEtSuite}`
      // Le <br> avant le schéma : une ligne terminée par un saut forcé n'est
      // pas justifiée, la dernière ligne de l'énoncé reste alignée à gauche.
      const contenu = `${probleme.enonce}${context.isHtml ? '<br>' : ''}${schema}<br>${phrase}`

      if (this.interactif) {
        const elements: MathaleaCouteauSuisseChild[] = [
          {
            formatInteractif: SchemaEnBarreElement.elementTag,
            autoCorrection: {
              valeur: { reponse: { value: JSON.stringify(attendu) } },
            },
          },
          {
            formatInteractif: 'mathalea-mathfield',
            questionIndex: indexConclusion,
            autoCorrection: {
              valeur: {
                reponse: { value: texNombre(conclusion.reponse, 2) },
              },
            },
          },
        ]
        this.listeQuestions[i] = addMathaleaCouteauSuisse(this, i, {
          elements,
          contenu,
        })
      } else {
        this.listeQuestions[i] = contenu
      }

      const schemaCorrige = SchemaEnBarreElement.create({
        id: `schemaEnBarreCorrEx${numeroExercice}Q${i}`,
        numeroExercice,
        questionIndex: i,
        initialState: {
          type: attendu.type,
          textes: {
            ...textesVides(),
            ...attendu.textesIndicatifs,
            ...attendu.textes,
          },
          nbRectangles: attendu.nbRectangles ?? 'plus',
        },
        interactivityOn: false,
      })
      const calculs = probleme.calculs
        .map((calcul, index) =>
          texLigneCalcul(
            calcul,
            this.sup3,
            index === probleme.calculs.length - 1,
          ),
        )
        .join('<br>')
      this.listeCorrections[i] =
        `${probleme.explication}${schemaCorrige}${calculs}<br>${texConclusion(conclusion)}`
      i++
    }
    listeQuestionsToContenu(this)
  }
}
