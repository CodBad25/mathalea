import { type AutoCorrection, type IExercice } from '../types'
import { fonctionComparaison } from '../interactif/comparisonFunctions'
import {
  ensureAMCOpenAutoCorrection,
  extractAMCValue,
  inferNumericValueForAMC,
  inferScientificNotationForAMC,
  mergeNumericParamsFromOptions,
} from './amcInferenceHelpers'
import { normalizeAMCNumBlocks } from './amcNormalize'
import type {
  AMCReponseValue,
  AMCUneProposition,
  IExerciceAMC,
  ReponseParams,
} from './amcTypes'

function hasIndependentFieldScoring(
  bareme: unknown,
  fieldCount: number,
): boolean {
  if (bareme == null) return true
  if (typeof bareme !== 'function' || fieldCount < 1 || fieldCount > 12) {
    return false
  }

  try {
    const combinationCount = 2 ** fieldCount
    for (let mask = 0; mask < combinationCount; mask++) {
      const points: number[] = Array.from({ length: fieldCount }, (_, index) =>
        mask & (1 << index) ? 1 : 0,
      )
      const result = bareme([...points])
      if (
        !Array.isArray(result) ||
        result.length !== 2 ||
        result[0] !== points.reduce((sum, point) => sum + point, 0) ||
        result[1] !== fieldCount
      ) {
        return false
      }
    }
    return true
  } catch {
    return false
  }
}

function getAMCFieldLabel(fieldKey: string, fallbackIndex: number): string {
  const tableCell = fieldKey.match(/^L(\d+)C(\d+)$/i)
  if (tableCell != null) {
    return `Ligne ${tableCell[1]}, colonne ${tableCell[2]}`
  }

  const numberedField = fieldKey.match(/^(?:champ|field|rectangle)(\d+)$/i)
  if (numberedField != null) {
    const number = Number(numberedField[1])
    return `Réponse ${fieldKey.toLowerCase().startsWith('field') ? number + 1 : number}`
  }

  return `Réponse ${fallbackIndex + 1}`
}

/**
 * Applique une compatibilité AMC par défaut quand un exercice n'est pas paramétré finement.
 * Cette fonction privilégie un export possible (fallback AMCOpen) plutôt qu'un rejet.
 * @author Jean-claude Lhote
 */
export function mathaleaEnsureAMCCompatibility(
  exercice: IExercice | IExerciceAMC,
): IExerciceAMC {
  type InferenceAutoCorrectionItem = {
    enonce?: string
    propositions?: Array<{ statut?: unknown; [key: string]: unknown }>
    reponse?: {
      valeur?: unknown
      param?: ReponseParams
      [key: string]: unknown
    }
    [key: string]: unknown
  }

  const exerciseAny = exercice as any
  const interactiveAutoCorrection = Array.isArray(
    exerciseAny.interactiveAutoCorrectionForAMC,
  )
    ? exerciseAny.interactiveAutoCorrectionForAMC
    : []
  const amcAutoCorrection = Array.isArray(exerciseAny.autoCorrectionAMC)
    ? exerciseAny.autoCorrectionAMC
    : []
  const generatedAutoCorrection = Array.isArray(exercice.autoCorrection)
    ? exercice.autoCorrection
    : []
  const statementQuestionCount = Math.max(
    exercice.listeQuestions.length,
    exercice.question != null ? 1 : 0,
  )

  const getFormat = (item: InferenceAutoCorrectionItem | undefined): string =>
    String(
      item?.formatInteractif ?? exercice.formatInteractif ?? '',
    ).toLowerCase()

  const isQcmItem = (
    item: InferenceAutoCorrectionItem | undefined,
  ): boolean => {
    const propositions = item?.propositions
    if (!Array.isArray(propositions) || propositions.length < 2) return false
    const format = getFormat(item)
    if (format === 'qcm' || format === 'mathalea-qcm') return true

    // Compatibilité des anciens QCM qui ne renseignaient pas toujours le
    // format par question. Les statuts AMCOpen sont numériques (nombre de
    // lignes) : exiger des booléens évite de les prendre pour des QCM.
    return propositions.every(
      (proposition) => typeof proposition.statut === 'boolean',
    )
  }

  // La passe AMC de certains exercices historiques (notamment des listes
  // déroulantes) fabrique un QCM qui n'existait pas dans le snapshot HTML
  // interactif. Ce QCM explicite prime ; pour les autres formats, le snapshot
  // interactif reste la source la plus riche en comparateurs et options.
  const sourceLength = Math.max(
    interactiveAutoCorrection.length,
    generatedAutoCorrection.length,
    amcAutoCorrection.length,
  )
  const autoCorrectionSource: AutoCorrection[] = Array.from(
    { length: sourceLength },
    (_, index) => {
      const generated = generatedAutoCorrection[index]
      const amcGenerated = amcAutoCorrection[index]
      if (isQcmItem(generated)) return generated
      if (isQcmItem(amcGenerated)) return amcGenerated as AutoCorrection
      return interactiveAutoCorrection[index] ?? generated ?? amcGenerated
    },
  )

  const applyQcmInference = (): boolean => {
    if (
      autoCorrectionSource.length === 0 ||
      autoCorrectionSource.length < statementQuestionCount ||
      autoCorrectionSource.some((item) => item == null || !isQcmItem(item))
    ) {
      return false
    }
    const items = autoCorrectionSource as Array<
      AutoCorrection & InferenceAutoCorrectionItem
    >

    // Le type AMC porte sur tout le groupe. Dès qu'une question a plusieurs
    // bonnes réponses, qcmMult est le seul type qui conserve tous les statuts.
    const hasMultipleCorrectAnswers = items.some(
      (item) =>
        (item.propositions ?? []).filter((p) => Boolean(p.statut)).length > 1,
    )
    exercice.amcType = hasMultipleCorrectAnswers ? 'qcmMult' : 'qcmMono'
    exercice.amcReady = true
    exerciseAny.autoCorrectionAMC = items.map((item, index) => ({
      ...item,
      enonce: item.enonce ?? exercice.listeQuestions[index],
      propositions: (item.propositions ?? []).map((proposition) => ({
        ...proposition,
        statut: Boolean(proposition.statut),
      })),
    }))
    return true
  }

  const applyAMCOpenFallback = (): IExerciceAMC => {
    exercice.amcType = 'AMCOpen'
    exercice.amcReady = true
    const target = amcAutoCorrection.map((item: unknown) =>
      item != null &&
      typeof item === 'object' &&
      'enonce' in item &&
      typeof item.enonce === 'string'
        ? { enonce: item.enonce }
        : {},
    )
    ensureAMCOpenAutoCorrection(exercice, target)
    exerciseAny.autoCorrectionAMC = target
    return exercice as IExerciceAMC
  }

  const numericFormats = new Set([
    'mathlive',
    'mathalea-mathfield',
    'calcul',
    'fillintheblank',
    'fill-in-the-blank',
    'multi-mathfield',
    'tableaumathlive',
    'tableau-mathlive',
  ])
  const hasOnlyPotentiallyNumericQuestions =
    autoCorrectionSource.length > 0 &&
    autoCorrectionSource.every(
      (item) => item != null && numericFormats.has(getFormat(item)),
    )
  const hasGeneratedQcmQuestions = autoCorrectionSource.some((item) =>
    isQcmItem(item),
  )
  const hasGeneratedNonQcmQuestions = autoCorrectionSource.some(
    (item) => item != null && !isQcmItem(item),
  )
  const hasMixedGeneratedQuestions =
    hasGeneratedQcmQuestions && hasGeneratedNonQcmQuestions

  // Ici on débute l'inférence du type AMC de l'exercice.
  // Si l'exercice est déja amcReady, on suppose que le type AMC est correctement défini et on ne fait rien.
  // Ensuite, si le type AMC n'est pas défini, on va essayer de l'inférer à partir des données disponibles dans les autoCorrections, les réponses interactives mises en cache, et la réponse de l'exercice lui-même.

  if (exercice.amcReady) {
    // L'exercice est déjà prêt pour AMC, on suppose que tout est en ordre, mais c'est faux.
    // On doit pour les AMCNum s'assurer que les données dans autoCorrectionAMC comme digits, decimals, signe, etc sont bien renseignées
    // On doit aussi s'assurer que pour les qcm la propriété 'correction' de options est bien renseignée pour l'afficher à l'lélève dans le détail de correction AMC.
    if (exercice.amcType === 'AMCNum') {
      const autoCorrectionAmc = []
      const declaredSource =
        amcAutoCorrection.length > 0
          ? amcAutoCorrection
          : autoCorrectionSource.length > 0
            ? autoCorrectionSource
            : exercice.reponse != null
              ? [
                  {
                    enonce: exercice.question ?? exercice.listeQuestions[0],
                    valeur: { reponse: { value: exercice.reponse } },
                  },
                ]
              : []

      for (const [index, item] of declaredSource.entries()) {
        if (item == null) continue
        const valeur = inferNumericValueForAMC(
          extractAMCValue(item.reponse?.valeur ?? item.valeur),
        )
        if (valeur === undefined) continue
        // item est un item de autoCorrectionAMC, qui est censé être déjà au format AMC, mais on fait le travail d'inférence au cas où les données ne seraient pas parfaitement conformes. On infère les options AMC à partir de la réponse interactive (item.reponse) plutôt que de réutiliser directement les options de comparaison interactive (item.options) pour éviter de faire des hypothèses sur la structure des options interactives qui peuvent être différentes des options attendues par AMC.
        const param = mergeNumericParamsFromOptions(
          item.reponse?.param,
          item.options,
        )

        const blocks = normalizeAMCNumBlocks({
          valeur,
          param,
        })

        if (blocks.length === 0) continue

        autoCorrectionAmc.push({
          ...item,
          enonce: item.enonce ?? exercice.listeQuestions[index],
          reponse: {
            ...(item.reponse ?? {}),
            valeur,
            param,
          },
        })
      }
      if (
        autoCorrectionAmc.length === 0 ||
        autoCorrectionAmc.length !== declaredSource.length ||
        autoCorrectionAmc.length < statementQuestionCount
      ) {
        return applyAMCOpenFallback()
      }
      exerciseAny.autoCorrectionAMC = autoCorrectionAmc as any
    } else if (
      exercice.amcType === 'qcmMono' ||
      exercice.amcType === 'qcmMult'
    ) {
      const qcmSource =
        autoCorrectionSource.length > 0
          ? autoCorrectionSource
          : (amcAutoCorrection as AutoCorrection[])
      // L'instance peut ne pas être générée encore (tests, chargement initial).
      // Dans ce cas on conserve la déclaration native ; la page AMC refera la
      // vérification après nouvelleVersion().
      if (qcmSource.length === 0) return exercice as IExerciceAMC
      if (
        qcmSource.length < statementQuestionCount ||
        qcmSource.some((item) => item == null || !isQcmItem(item))
      ) {
        // Certaines anciennes déclarations qcmMono/qcmMult couvrent en fait
        // des exercices mêlant sous-questions QCM et numériques. La preuve
        // portée par autoCorrection est plus précise que cette métadonnée :
        // poursuivre l'inférence permet de construire un AMCHybride fidèle.
        exercice.amcReady = undefined
        exercice.amcType = undefined
      } else {
        const autoCorrectionAmc = qcmSource.map(
          (item: InferenceAutoCorrectionItem, index) => {
            if (item == null) return item

            const propositions = Array.isArray(item.propositions)
              ? item.propositions.map((p) => ({
                  ...p,
                  statut: Boolean(p.statut),
                }))
              : item.propositions

            return {
              ...item,
              enonce: item.enonce ?? exercice.listeQuestions[index],
              propositions,
            }
          },
        )
        if (
          autoCorrectionAmc.some(
            (item) =>
              (item?.propositions ?? []).filter((p) => Boolean(p.statut))
                .length > 1,
          )
        ) {
          exercice.amcType = 'qcmMult'
        }
        exerciseAny.autoCorrectionAMC = autoCorrectionAmc as any
      }
    } else if (
      exercice.amcType === 'AMCOpen' ||
      exercice.amcType === 'AMCHybride'
    ) {
      // Les structures explicites restent prioritaires. Une déclaration vide
      // ne doit toutefois pas faire disparaître l'exercice de l'export.
      return amcAutoCorrection.length > 0
        ? (exercice as IExerciceAMC)
        : applyAMCOpenFallback()
    } else if (exercice.amcType != null) {
      return applyAMCOpenFallback()
    } else {
      // amcReady sans amcType existe dans quelques anciens modules : poursuivre
      // l'inférence évite qu'ils disparaissent silencieusement de l'export.
      exercice.amcReady = undefined
    }
    if (exercice.amcReady) return exercice as IExerciceAMC
  }

  // Respecte un marquage explicite "non prêt AMC" quand un type AMC est déjà posé.
  // Cela permet d'exclure volontairement un exercice de l'export sans qu'un fallback le réactive.
  if (exercice.amcReady === false && exercice.amcType != null) {
    return exercice as IExerciceAMC
  }

  if (applyQcmInference()) return exercice as IExerciceAMC
  if (autoCorrectionSource.length === 0) return applyAMCOpenFallback()

  // type interactifs non supportés par AMC : svg-selection, cliqueFigure, DragAndDrop, apiGeom, tableur, MetaInteractif2d : on les considère comme des AMCOpen car ils ne sont pas incompatibles avec AMC, mais ils nécessitent une correction personnalisée.
  if (
    [
      'svg-selection', // inadapté clairement pour AMC
      'cliqueFigure', // inadapté clairement pour AMC
      'dnd', // inadapté clairement pour AMC
      'my-spreadsheet', // Difficile à faire rentrer dans AMC
      'MetaInteractif2d', // Difficile à faire rentrer dans AMC
      'texte', // inadapté pour AMC, mais on peut faire du AMCOpen
      'custom', // inadapté pour AMC (contient du apiGeom et autres), mais on peut faire du AMCOpen
    ].some((format) =>
      autoCorrectionSource.some((item) => getFormat(item) === format),
    )
  ) {
    return applyAMCOpenFallback()
  }

  if (
    autoCorrectionSource.some((item) => getFormat(item) === 'liste-deroulante')
  ) {
    return applyAMCOpenFallback()
  }

  if (!hasOnlyPotentiallyNumericQuestions && !hasMixedGeneratedQuestions) {
    // Pour ce qui ne rentre pas dans les cas précédents : fallback AMCOpen.
    return applyAMCOpenFallback()
  }

  // Cas Mathlive à détailler
  // à priori, les données pour AMC n'ont pas été renseignées sinon on peut espérer que amcReady serait true et amcType défini
  // On va essayer d'inférer un type AMCNum à partir des réponses numériques présentes dans les autoCorrections ou les réponses interactives mises en cache.

  const extractNumericFields = (item: AutoCorrection) => {
    if (item == null) return []
    const format = getFormat(item)
    const isLegacyNumericItemMislabeledAsQcm =
      hasMixedGeneratedQuestions &&
      (format === 'qcm' || format === 'mathalea-qcm') &&
      !isQcmItem(item) &&
      item.valeur != null
    if (!numericFormats.has(format) && !isLegacyNumericItemMislabeledAsQcm) {
      return []
    }

    const values = item.valeur as
      | Record<
          string,
          | {
              value?: unknown
              compare?: unknown
              options?: Record<string, unknown>
            }
          | unknown
        >
      | undefined
    if (values == null || typeof values !== 'object') return []

    const fieldEntries = Object.entries(values).filter(
      ([key]) => !['bareme', 'feedback', 'callback'].includes(key),
    )
    if (
      typeof values.callback === 'function' ||
      !hasIndependentFieldScoring(values.bareme, fieldEntries.length)
    ) {
      return []
    }

    return fieldEntries.map(([key, answer]) => {
      const answerRecord =
        answer != null && typeof answer === 'object'
          ? (answer as {
              value?: unknown
              compare?: unknown
              options?: Record<string, unknown>
            })
          : undefined
      const activeComparisonOptions = Object.entries(
        answerRecord?.options ?? {},
      )
        .filter(([, value]) => value !== false && value != null)
        .map(([key]) => key)
      const supportedComparisonOptions = new Set([
        'noFeedback',
        'nombreDecimalSeulement',
        'fractionEgale',
        'fractionIrreductible',
        'ecritureScientifique',
      ])
      const usesEquivalentFractionComparison =
        activeComparisonOptions.includes('fractionEgale') &&
        !activeComparisonOptions.includes('fractionIrreductible')
      const scientificNotation = activeComparisonOptions.includes(
        'ecritureScientifique',
      )
        ? inferScientificNotationForAMC(answerRecord?.value)
        : undefined
      const inferredValue = activeComparisonOptions.includes(
        'ecritureScientifique',
      )
        ? scientificNotation?.valeur
        : inferNumericValueForAMC(extractAMCValue(answer))
      // Une fraction équivalente non entière ne peut pas être reproduite par
      // une grille AMC : celle-ci impose un numérateur et un dénominateur
      // précis, tandis que fonctionComparaison accepte tous leurs multiples.
      // Le cas entier reste fidèle et corrige notamment 100/25 -> 4.
      const hasRepresentableFractionSemantics =
        !usesEquivalentFractionComparison ||
        (typeof inferredValue === 'number' && Number.isInteger(inferredValue))
      const hasSupportedComparison =
        (answerRecord?.compare == null ||
          answerRecord.compare === fonctionComparaison) &&
        activeComparisonOptions.every((key) =>
          supportedComparisonOptions.has(key),
        ) &&
        hasRepresentableFractionSemantics
      const valeur = hasSupportedComparison ? inferredValue : undefined
      const answerOptions =
        answerRecord?.options != null
          ? (answerRecord.options as ReponseParams)
          : undefined
      const explicitParam = mergeNumericParamsFromOptions(
        item.options,
        answerOptions,
      )
      const param = {
        ...(scientificNotation?.param ?? {}),
        ...explicitParam,
      }
      return {
        key,
        valeur,
        param,
      }
    })
  }

  // Plusieurs champs numériques indépendants se traduisent fidèlement en
  // AMCHybride. Si un seul champ est non numérique, on ne devine pas : AMCOpen.
  const numericFieldGroups = autoCorrectionSource.map(extractNumericFields)

  const canGroupByStatement =
    statementQuestionCount > 0 &&
    autoCorrectionSource.length >= statementQuestionCount &&
    autoCorrectionSource.length % statementQuestionCount === 0
  if (hasMixedGeneratedQuestions && canGroupByStatement) {
    const blocksPerStatement =
      autoCorrectionSource.length / statementQuestionCount
    exerciseAny.autoCorrectionAMC = Array.from(
      { length: statementQuestionCount },
      (_, statementIndex) => {
        const firstItemIndex = statementIndex * blocksPerStatement
        const propositions = autoCorrectionSource
          .slice(firstItemIndex, firstItemIndex + blocksPerStatement)
          .flatMap<AMCUneProposition>((item, offset) => {
            const itemIndex = firstItemIndex + offset
            if (isQcmItem(item)) {
              const qcmPropositions = item?.propositions ?? []
              const hasMultipleAnswers =
                qcmPropositions.filter((proposition) =>
                  Boolean(proposition.statut),
                ).length > 1
              return [
                {
                  type: hasMultipleAnswers ? 'qcmMult' : 'qcmMono',
                  enonce: item?.enonce ?? '',
                  propositions: qcmPropositions.map((proposition) => ({
                    ...proposition,
                    statut: Boolean(proposition.statut),
                  })) as AMCUneProposition['propositions'],
                  options: item?.options as AMCUneProposition['options'],
                },
              ]
            }

            const numericFields = numericFieldGroups[itemIndex]
            const hasSupportedNumericFields =
              numericFields.length > 0 &&
              numericFields.every((field) => field.valeur !== undefined)
            if (!hasSupportedNumericFields) {
              return [
                {
                  type: 'AMCOpen',
                  propositions: [
                    {
                      texte: exercice.listeCorrections[statementIndex] ?? '',
                      statut: 3,
                      enonce: item?.enonce ?? '',
                    },
                  ],
                },
              ]
            }

            return numericFields.map((field, fieldIndex, fields) => ({
              type: 'AMCNum',
              propositions: [
                {
                  texte:
                    offset === blocksPerStatement - 1 &&
                    fieldIndex === fields.length - 1
                      ? (exercice.listeCorrections[statementIndex] ?? '')
                      : '',
                  reponse: {
                    texte: getAMCFieldLabel(field.key, offset + fieldIndex),
                    valeur: field.valeur,
                    param: field.param,
                  },
                },
              ],
            }))
          })

        return {
          enonce: exercice.listeQuestions[statementIndex],
          propositions,
        }
      },
    )
    exercice.amcType = 'AMCHybride'
    exercice.amcReady = true
    return exercice as IExerciceAMC
  }

  if (
    numericFieldGroups.some((fields) => fields.length > 1) &&
    numericFieldGroups.every(
      (fields) =>
        fields.length > 0 &&
        fields.every((field) => field.valeur !== undefined),
    )
  ) {
    exerciseAny.autoCorrectionAMC = numericFieldGroups.map((fields, index) => ({
      enonce: exercice.listeQuestions[index],
      propositions: fields.map((field, fieldIndex) => ({
        type: 'AMCNum',
        propositions: [
          {
            texte:
              fieldIndex === fields.length - 1
                ? (exercice.listeCorrections[index] ?? '')
                : '',
            reponse: {
              texte: getAMCFieldLabel(field.key, fieldIndex),
              valeur: field.valeur,
              param: field.param,
            },
          },
        ],
      })),
    }))
    exercice.amcType = 'AMCHybride'
    exercice.amcReady = true
    return exercice as IExerciceAMC
  }

  const canInferAMCNum =
    autoCorrectionSource.length > 0 &&
    autoCorrectionSource.length >= statementQuestionCount &&
    numericFieldGroups.every(
      (fields) => fields.length === 1 && fields[0].valeur !== undefined,
    )
  const autoCorrectionAmc = canInferAMCNum
    ? autoCorrectionSource.map((item, index) => {
        const field = numericFieldGroups[index][0]
        const valeur = field.valeur as AMCReponseValue
        const blocks = normalizeAMCNumBlocks({ valeur, param: field.param })
        if (blocks.length === 0) return undefined

        return {
          ...item,
          enonce: item?.enonce ?? exercice.listeQuestions[index],
          reponse: {
            valeur,
            param: field.param,
          },
        }
      })
    : []

  if (canInferAMCNum && autoCorrectionAmc.every((item) => item !== undefined)) {
    exerciseAny.autoCorrectionAMC = autoCorrectionAmc
    exercice.amcType = 'AMCNum'
    exercice.amcReady = true
    return exercice as IExerciceAMC
  }

  return applyAMCOpenFallback()
}
