<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import ExerciceSimple from '../../../../../../exercices/ExerciceSimple'
  import type { FormulaireComplexe } from '../../../../../../lib/formulaireComplexe'
  import {
    COEFF_BAREME_MAX,
    COEFF_BAREME_MIN,
    normaliseCoeffBareme,
  } from '../../../../../../lib/interactif/baremeExercice'
  import type { IExercice } from '../../../../../../lib/types'
  import CheckboxWithLabel from '../../../../forms/CheckboxWithLabel.svelte'
  import InputNumber from '../../../../forms/InputNumber.svelte'
  import InputText from '../../../../forms/InputText.svelte'
  import SupParameterGroup from './SupParameterGroup.svelte'

  export let exercice: IExercice
  export let exerciceIndex: number
  export let isVisible: boolean = true
  export let inModal: boolean = false
  /** Le barème n'est réglable que sur un exercice affiché en interactif. */
  export let isInteractif: boolean = false
  /** Nombre de points maximum de l'exercice, avant coefficient. */
  export let pointsMax: number = 0

  const dispatch = createEventDispatcher()

  type FormNumerique = {
    titre: string
    champs: string[] | number
  }

  let nbQuestions: number
  let duration: number
  let sup: boolean | number | string
  let sup2: boolean | number | string
  let sup3: boolean | number | string
  let sup4: boolean | number | string
  let sup5: boolean | number | string
  let versionQcm: boolean
  let alea: string
  let correctionDetaillee: boolean
  let tipAvailable: boolean
  let coeffBareme: number = normaliseCoeffBareme(exercice.coeffBareme)

  $: isBaremeDisplayed = isInteractif && pointsMax > 0

  let isCommentDisplayed: boolean = false

  let formNum1: FormNumerique
  let formNum2: FormNumerique
  let formNum3: FormNumerique
  let formNum4: FormNumerique
  let formNum5: FormNumerique

  type CategoriesForm = {
    titre: string
    categories: { label: string; max: number }[]
    defaut: number[]
  }
  let categoriesForm: CategoriesForm | undefined = undefined
  let formulaireComplexe: FormulaireComplexe | undefined = undefined

  let previousSeed: string | undefined
  $: {
    // Pour que la série dans le formulaire se mette à jour lorsqu'on clique sur "Nouvel énoncé"
    if (previousSeed !== exercice.seed) {
      // Sans ça, on ne peut pas modifier la série dans le formulaire
      previousSeed = exercice.seed
      alea = exercice.seed ?? ''
    }
  }

  // Mêmes précautions pour les réglages qu'un composant de l'énoncé peut
  // changer lui-même (le sélecteur des questions de cours par exemple) : le
  // formulaire doit refléter la nouvelle valeur, sans écraser une saisie en
  // cours puisque celle-ci ne modifie pas `exercice`.
  let previousNbQuestions: number | undefined
  $: {
    if (previousNbQuestions !== exercice.nbQuestions) {
      previousNbQuestions = exercice.nbQuestions
      nbQuestions = exercice.nbQuestions
    }
  }
  let previousSup: string | number | boolean | undefined
  $: {
    if (previousSup !== exercice.sup) {
      previousSup = exercice.sup
      sup = exercice.sup === 'false' ? false : exercice.sup
    }
  }

  onMount(() => {
    nbQuestions = exercice.nbQuestions
    coeffBareme = normaliseCoeffBareme(exercice.coeffBareme)
    duration = exercice.duration || 10
    sup = exercice.sup === 'false' ? false : exercice.sup
    sup2 = exercice.sup2 === 'false' ? false : exercice.sup2
    sup3 = exercice.sup3 === 'false' ? false : exercice.sup3
    sup4 = exercice.sup4 === 'false' ? false : exercice.sup4
    sup5 = exercice.sup5 === 'false' ? false : exercice.sup5
    versionQcm =
      exercice instanceof ExerciceSimple ? exercice.versionQcm || false : false
    correctionDetaillee = exercice.correctionDetaillee
    tipAvailable = exercice.tipAvailable ?? !!exercice.tip?.length

    if (
      Array.isArray(exercice.besoinFormulaireNumerique) &&
      exercice.besoinFormulaireNumerique.length > 0
    ) {
      formNum1 = parseFormNumerique(exercice.besoinFormulaireNumerique)
    }
    if (
      Array.isArray(exercice.besoinFormulaire2Numerique) &&
      exercice.besoinFormulaire2Numerique.length > 0
    ) {
      formNum2 = parseFormNumerique(exercice.besoinFormulaire2Numerique)
    }
    if (
      Array.isArray(exercice.besoinFormulaire3Numerique) &&
      exercice.besoinFormulaire3Numerique.length > 0
    ) {
      formNum3 = parseFormNumerique(exercice.besoinFormulaire3Numerique)
    }
    if (
      Array.isArray(exercice.besoinFormulaire4Numerique) &&
      exercice.besoinFormulaire4Numerique.length > 0
    ) {
      formNum4 = parseFormNumerique(exercice.besoinFormulaire4Numerique)
    }
    if (
      Array.isArray(exercice.besoinFormulaire5Numerique) &&
      exercice.besoinFormulaire5Numerique.length > 0
    ) {
      formNum5 = parseFormNumerique(exercice.besoinFormulaire5Numerique)
    }
    if (exercice.besoinFormulaireNombresCategories) {
      categoriesForm =
        exercice.besoinFormulaireNombresCategories as CategoriesForm
    }
    if (exercice.besoinFormulaireComplexe) {
      formulaireComplexe = exercice.besoinFormulaireComplexe
    }
  })

  /**
   * Transforme le tableau des tooltips d'un paramètre type numérique en un objet
   * constitué d'un titre (celui du paramètre) et soit d'un tableau
   * des options, soit d'un nombre correspond à la valeur maximale.
   * <i>Référence :</i> commentaire du fichier Exercice.ts sur la propriété
   * <code>besoinFormulaireNumerique</code> (<code>false</code>
   * sinon this.besoinFormulaireNumerique = [texte, max, tooltip facultatif])
   * @param {string[]} entreesFormulaire Typiquement la valeur de la propriété
   * <code>besoinFormulaireNumerique</code>
   * @author sylvain chambon
   */
  function parseFormNumerique(
    entreesFormulaire:
      | [titre: string, max: number, tooltip: string]
      | [titre: string, max: number],
  ): FormNumerique {
    const entrees:
      | [titre: string, max: number, tooltip: string]
      | [titre: string, max: number] = [...entreesFormulaire]
    if (![2, 3].includes(entrees.length)) {
      // `besoinFormulaireNumerique` est de la forme [texte, max, tooltip] ou [texte, max]
      throw new Error(
        `Dans ${exercice.uuid}, besoinFormulaireNumerique est mal déclaré`,
      )
    } else {
      // la liste entrees a deux ou trois éléments
      const premier = entrees.shift()
      const titre: string = (premier as string) ?? '' // le titre du paramètre est le 1er elt
      let champs: string[] | number
      if (entrees.length > 1) {
        // il y a une liste de tooltips qui deviendront les entrées
        const dernier = entrees.pop() as string
        if (dernier) {
          champs = dernier
            .split('\n')
            .map((x) => x.replace(/(?:\d* *: *)/i, ''))
        } else {
          champs = []
        }
      } else {
        // les champs se résument à un seul nombre correspondant au maximum
        const max = entrees[0]
        champs = typeof max === 'number' ? max : parseInt(max)
      }
      return { titre, champs }
    }
  }

  function dispatchNewSettings() {
    dispatch('settings', {
      nbQuestions,
      duration,
      sup,
      sup2,
      sup3,
      sup4,
      sup5,
      versionQcm,
      alea,
      correctionDetaillee,
      tipAvailable,
      coeffBareme,
    })
  }

  /**
   * Modifie le coefficient multiplicateur du barème.
   * @param pas +1 ou -1
   */
  function changeCoeffBareme(pas: number) {
    const nouveauCoeff = normaliseCoeffBareme(coeffBareme + pas)
    if (nouveauCoeff === coeffBareme) return
    coeffBareme = nouveauCoeff
    dispatchNewSettings()
  }
</script>

<div
  id="settings{exerciceIndex}"
  class="relative text-coopmaths-struct dark:text-coopmathsdark-struct bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark z-20 {inModal
    ? 'visible w-full'
    : isVisible
      ? 'visible lg:w-1/4'
      : 'hidden lg:w-0'} flex flex-col duration-500"
>
  <div class="absolute top-2 right-3">
    <button
      type="button"
      aria-label="Fermer les paramètres"
      on:click={() => {
        isVisible = !isVisible
        dispatch('clickSettings', { isVisible })
      }}
    >
      <i
        class="text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest text-xl bx bx-x"
      ></i>
    </button>
  </div>
  <div
    class="text-lg lg:text-base ml-2 lg:ml-4 space-y-4 p-3 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
  >
    <h3 class="text-coopmaths-struct dark:text-coopmathsdark-struct font-bold">
      Paramètres
    </h3>
    <div class="w-full flex flex-row items-end gap-x-4">
      <div class="w-1/2">
        {#if exercice.nbQuestionsModifiable}
          <span
            class="text-sm md:text-normal text-coopmaths-struct dark:text-coopmathsdark-struct font-light"
          >
            Nombre de questions&nbsp;:
          </span>
          <InputNumber
            id="settings-nb-questions-{exerciceIndex}"
            min={1}
            max={100}
            bind:value={nbQuestions}
            on:change={dispatchNewSettings}
            darkBackground={true}
          />
        {/if}
      </div>

      {#if !exercice.pasDeVersionAleatoire}
        <form
          id="settings-form-formAlea-{exerciceIndex}"
          name="settings-form-formAlea"
          autocomplete="off"
          class="w-1/2"
          on:submit|preventDefault={dispatchNewSettings}
        >
          <InputText
            inputID="settings-formAlea-{exerciceIndex}"
            title="Série :"
            bind:value={alea}
            darkBackground={true}
            classAddenda="w-full"
            on:input={dispatchNewSettings}
          />
        </form>
      {/if}
    </div>
    <SupParameterGroup
      supIndex={1}
      {exercice}
      {exerciceIndex}
      bind:supValue={sup}
      formNum={formNum1}
      {categoriesForm}
      {formulaireComplexe}
      on:change={dispatchNewSettings}
    />

    <SupParameterGroup
      supIndex={2}
      {exercice}
      {exerciceIndex}
      bind:supValue={sup2}
      formNum={formNum2}
      on:change={dispatchNewSettings}
    />

    <SupParameterGroup
      supIndex={3}
      {exercice}
      {exerciceIndex}
      bind:supValue={sup3}
      formNum={formNum3}
      on:change={dispatchNewSettings}
    />

    <SupParameterGroup
      supIndex={4}
      {exercice}
      {exerciceIndex}
      bind:supValue={sup4}
      formNum={formNum4}
      on:change={dispatchNewSettings}
    />

    <SupParameterGroup
      supIndex={5}
      {exercice}
      {exerciceIndex}
      bind:supValue={sup5}
      formNum={formNum5}
      on:change={dispatchNewSettings}
    />

    {#if exercice.tip && exercice.tip.length > 0}
      <CheckboxWithLabel
        id="settings-indice-disponible-{exerciceIndex}"
        bind:isChecked={tipAvailable}
        label="Indice disponible pour les élèves"
        on:change={dispatchNewSettings}
      />
    {/if}

    {#if exercice.correctionDetailleeDisponible}
      <CheckboxWithLabel
        id="settings-correction-detaillee-{exerciceIndex}"
        bind:isChecked={correctionDetaillee}
        label="Correction détaillée"
        on:change={dispatchNewSettings}
      />
    {/if}

    {#if exercice instanceof ExerciceSimple && exercice.versionQcmDisponible}
      <CheckboxWithLabel
        id="settings-version-qcm-{exerciceIndex}"
        bind:isChecked={versionQcm}
        label="Version QCM"
        on:change={dispatchNewSettings}
      />
    {/if}

    {#if isBaremeDisplayed}
      <div class="flex flex-col gap-y-1">
        <span
          class="text-sm md:text-normal text-coopmaths-struct dark:text-coopmathsdark-struct font-light"
        >
          Barème&nbsp;:
        </span>
        <div class="flex flex-row items-center gap-x-3">
          <span class="inline-flex items-center">
            <button
              type="button"
              id="settings-bareme-moins-{exerciceIndex}"
              class="w-7 h-7 flex items-center justify-center
                border border-coopmaths-action dark:border-coopmathsdark-action
                text-coopmaths-action dark:text-coopmathsdark-action
                hover:bg-coopmaths-action hover:text-coopmaths-canvas
                dark:hover:bg-coopmathsdark-action dark:hover:text-coopmathsdark-canvas
                disabled:opacity-30"
              disabled={coeffBareme <= COEFF_BAREME_MIN}
              aria-label="Diminuer le coefficient du barème"
              on:click={() => changeCoeffBareme(-1)}
            >
              <i class="bx bx-minus"></i>
            </button>
            <span
              class="w-10 h-7 flex items-center justify-center border-y
                border-coopmaths-action dark:border-coopmathsdark-action
                text-coopmaths-corpus dark:text-coopmathsdark-corpus"
              aria-live="polite"
            >
              &times;{coeffBareme}
            </span>
            <button
              type="button"
              id="settings-bareme-plus-{exerciceIndex}"
              class="w-7 h-7 flex items-center justify-center
                border border-coopmaths-action dark:border-coopmathsdark-action
                text-coopmaths-action dark:text-coopmathsdark-action
                hover:bg-coopmaths-action hover:text-coopmaths-canvas
                dark:hover:bg-coopmathsdark-action dark:hover:text-coopmathsdark-canvas
                disabled:opacity-30"
              disabled={coeffBareme >= COEFF_BAREME_MAX}
              aria-label="Augmenter le coefficient du barème"
              on:click={() => changeCoeffBareme(1)}
            >
              <i class="bx bx-plus"></i>
            </button>
          </span>
          <span
            id="settings-bareme-points-{exerciceIndex}"
            class="text-coopmaths-struct dark:text-coopmathsdark-struct font-bold"
          >
            {pointsMax * coeffBareme}
            {pointsMax * coeffBareme > 1 ? 'points' : 'point'}
          </span>
        </div>
        {#if coeffBareme > 1}
          <span
            class="text-xs font-light text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light"
          >
            {pointsMax}
            {pointsMax > 1 ? 'points' : 'point'} &times; {coeffBareme}
          </span>
        {/if}
      </div>
    {/if}

    {#if exercice.comment !== undefined && exercice.comment !== ''}
      <div class="flex flex-col justify-start items-start p-2">
        <button
          type="button"
          class="flex items-center text-coopmaths-action dark:text-coopmathsdark-action cursor-pointer"
          on:click={() => {
            isCommentDisplayed = !isCommentDisplayed
          }}
          on:keydown={() => {
            isCommentDisplayed = !isCommentDisplayed
          }}
        >
          <i class="bx bx-info-circle mr-2"></i>En savoir plus...
        </button>
        <div
          class="{isCommentDisplayed
            ? 'block'
            : 'hidden'} pt-4 font-light text-justify text-coopmaths-corpus-light text-sm"
        >
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html exercice.comment}
        </div>
      </div>
    {/if}
  </div>
</div>
