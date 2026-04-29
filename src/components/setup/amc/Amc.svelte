<script lang="ts">
  import seedrandom from 'seedrandom'
  import { onMount } from 'svelte'
  import type { IExerciceAMC } from '../../../lib/amc/amcTypes'
  import {
    checkAMCGroupConsistency,
    creerDocumentAmc,
    type AMCGroupConsistencyReport,
  } from '../../../lib/amc/creerDocumentAmc'
  import {
    mathaleaGenerateSeed,
    mathaleaGetExercicesFromParams,
    mathaleaHandleExerciceSimple,
    mathaleaUpdateExercicesParamsFromUrl,
    mathaleaUpdateUrlFromExercicesParams,
  } from '../../../lib/mathalea.js'
  import {
    darkMode,
    exercicesParams,
  } from '../../../lib/stores/generalStore.js'
  import { referentielLocale } from '../../../lib/stores/languagesStore.js'
  import type { IExercice } from '../../../lib/types'
  import { context } from '../../../modules/context.js'
  import Footer from '../../Footer.svelte'
  import ButtonActionInfo from '../../shared/forms/ButtonActionInfo.svelte'
  import ButtonTextAction from '../../shared/forms/ButtonTextAction.svelte'
  import FormRadio from '../../shared/forms/FormRadio.svelte'
  import InputNumber from '../../shared/forms/InputNumber.svelte'
  import InputText from '../../shared/forms/InputText.svelte'
  import NavBar from '../../shared/header/NavBar.svelte'
  import BasicClassicModal from '../../shared/modal/BasicClassicModal.svelte'

  const isSettingsVisible: boolean[] = []
  let exercices: IExercice[] = []

  /**
   * Cast documenté : les exercices AMC-ready ont été générés avec autoCorrection de type AMCCorrection.
   * C'est la frontière explicite entre le monde interactif HTML et le monde AMC.
   */
  function asAMCExercices(exos: IExercice[]): IExerciceAMC[] {
    return exos as unknown as IExerciceAMC[]
  }
  let content = ''
  let entete = 'AMCcodeGrid'
  let format = 'A4'
  let matiere = ''
  let titre = ''
  const nbQuestionsModif: number[] = []
  const exercicesARetirer: string[] = []
  let refsExercicesARetirer: string[]
  $: refsExercicesARetirer = []

  type NbQuestionsIndexees = {
    indexExercice: number
    nombre: number
  }

  let nbQuestions: Array<NbQuestionsIndexees> = []
  let nbExemplaires = 1
  let textForOverleaf: HTMLInputElement
  let isNonAMCModaleDisplayed = false
  let isOverleafModalDisplayed = false
  let groupConsistencyReport: AMCGroupConsistencyReport | null = null

  async function initExercices() {
    exercicesARetirer.length = 0
    await mathaleaUpdateExercicesParamsFromUrl()
    exercices = (await mathaleaGetExercicesFromParams($exercicesParams)).filter(
      (exercice): exercice is IExercice => exercice.typeExercice !== 'statique',
    )
    for (const exercice of exercices) {
      isSettingsVisible.push(false)
      context.isHtml = false
      context.isAmc = true
      seedrandom(exercice.seed, { global: true })
      if (exercice.typeExercice === 'simple') {
        mathaleaHandleExerciceSimple(exercice, false)
      } else {
        if (exercice.nouvelleVersionWrapper != null)
          exercice.nouvelleVersionWrapper()
      }
      if (exercice.amcType == null) {
        // l'exercice n'est pas disponible AMC
        exercicesARetirer.push(exercice.uuid)
        if (exercice.id != null) {
          refsExercicesARetirer.push(exercice.id)
        } else {
          const proprietes: string[] = Object.values(exercice)
          proprietes.shift()
          refsExercicesARetirer.push(proprietes.join(' '))
        }
      }
    }
    exercices = exercices.filter(
      (exercice) => !exercicesARetirer.includes(exercice.uuid),
    )

    refsExercicesARetirer = refsExercicesARetirer
    // afficher le modal pour les exercices non AMC ?
    isNonAMCModaleDisplayed = refsExercicesARetirer.length !== 0
  }

  initExercices()

  $: {
    // ToDo vérifier la saisie utilisateur
    // Si les copies sont préremplies, c'est un seul exemplaire pour ne pas avoir plusieurs sujets avec le même nom
    if (entete === 'AMCassociation') nbExemplaires = 1
    // On récupère les nombres de questions par groupe indexé sur l'index d'exercice dans exercices
    // la ligne suivante lève une erreur
    // nbQuestions = nbQuestionsModif.map((elt, i) => {
    //   if (elt !== null) return { indexExercice: i, nombre: elt }
    // })
    // on la remplace par une boucle classique
    nbQuestions.length = 0
    for (let i = 0; i < nbQuestionsModif.length; i++) {
      nbQuestions.push({ indexExercice: i, nombre: nbQuestionsModif[i] })
    }
    nbQuestions = nbQuestions
    // on blinde le nbExemplaires qui ne peut être 0 ou undefined
    if (nbExemplaires == null) nbExemplaires = 1
    for (let i = 0; i < exercices.length; i++) {
      const exo = exercices[i]
      const nbQ = nbQuestions.find((elt, i) => elt.indexExercice === i)
      if (nbQ != null) {
        if (exo.nbQuestions < nbQ.nombre) {
          exo.nbQuestions = nbQ.nombre * nbExemplaires
          context.isHtml = false
          context.isAmc = true
          seedrandom(exo.seed, { global: true })
          if (exo.typeExercice === 'simple') {
            mathaleaHandleExerciceSimple(exo, false)
          } else {
            if (exo.nouvelleVersionWrapper != null) exo.nouvelleVersionWrapper()
          }
        }
      }
    }
    const nbQuestionsParGroupe: number[] = nbQuestions.map((elt) => elt.nombre)
    content = creerDocumentAmc({
      exercices: asAMCExercices(exercices),
      typeEntete: entete,
      format,
      matiere,
      titre,
      nbQuestions: nbQuestionsParGroupe,
      nbExemplaires,
    })
    groupConsistencyReport = checkAMCGroupConsistency(content)
  }

  /* =======================================================
   *
   * Mécanismes de gestion du modal d'infos sur OverLeaf
   *
   */
  let overleafForm: HTMLFormElement | undefined
  // $: isNonAmcModal Visible = false
  onMount(async () => {
    const form = document.getElementById('overleaf-form')
    if (form instanceof HTMLFormElement) {
      overleafForm = form
    }
  })

  /**
   * Gérer le POST pour Overleaf
   */
  function handleOverLeaf() {
    if (overleafForm == null) return
    textForOverleaf.value =
      'data:text/plain;base64,' + btoa(unescape(encodeURIComponent(content)))
    overleafForm.submit()
    isOverleafModalDisplayed = false
  }

  // =======================================================
</script>

<main
  class="bg-coopmaths-canvas dark:bg-coopmathsdark-canvas {$darkMode.isActive
    ? 'dark'
    : ''}"
>
  <NavBar
    subtitle="AMC"
    subtitleType="export"
    handleLanguage={() => {}}
    locale={$referentielLocale}
  />

  <section
    class="px-10 py-10 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas text-coopmaths-struct-lightest dark:text-coopmathsdark-struct-lightest"
  >
    <div
      class="flex flex-col md:flex-row justify-start items-start my-4 space-y-5 md:space-y-0 md:space-x-10"
    >
      <div>
        <div class="pb-2 font-bold">Type d'entête</div>
        <FormRadio
          bind:valueSelected={entete}
          labelsValues={[
            { label: 'Grille de codage', value: 'AMCcodeGrid' },
            { label: 'Copies pré-remplies', value: 'AMCassociation' },
            { label: 'Noms et prénoms manuscrits', value: 'manuscrits' },
          ]}
          title="entete"
        />
      </div>
      <div>
        <div
          class="pb-2 font-bold text-coopmaths-struct-light dark:text-coopmathsdark-struct-light"
        >
          Format
        </div>
        <FormRadio
          bind:valueSelected={format}
          labelsValues={[
            { label: 'Format A4 portrait', value: 'A4' },
            { label: 'Format A3 paysage 2 colonnes', value: 'A3' },
          ]}
          title="format"
        />
      </div>
    </div>
    <div
      class="flex flex-col md:flex-row justify-start items-start my-4 space-y-5 md:space-y-0 md:space-x-10"
    >
      <div>
        <div
          class="pb-2 font-bold text-coopmaths-struct-light dark:text-coopmathsdark-struct-light"
        >
          Matière
        </div>
        <InputText
          inputID="amc-export-matiere-input"
          bind:value={matiere}
          showTitle={false}
          classAddenda="ml-4 md:ml-0"
        />
      </div>
      <div>
        <div
          class="pb-2 font-bold text-coopmaths-struct-light dark:text-coopmathsdark-struct-light"
        >
          Titre
        </div>
        <InputText
          inputID="amc-export-titre-input"
          bind:value={titre}
          showTitle={false}
          classAddenda="ml-4 md:ml-0"
        />
      </div>
      <div>
        <div
          class="pb-2 font-bold text-coopmaths-struct-light dark:text-coopmathsdark-struct-light"
        >
          Nombre de questions par groupe
        </div>
        {#each exercices as exercice, i}
          <div>
            {exercice.id}{exercice.sup
              ? `-S:${exercice.sup}`
              : ''}{exercice.sup2 ? `-S2:${exercice.sup2}` : ''}{exercice.sup3
              ? `-S3:${exercice.sup3}`
              : ''}
            <InputText
              inputID="amc-export-nb-questions-gr{i}-input"
              placeholder={exercice.nbQuestions.toString()}
              bind:value={nbQuestionsModif[i]}
              showTitle={false}
              classAddenda="ml-4 md:ml-0"
            />
            <span>{exercice.amcType ? exercice.amcType : 'not amcReady'}</span>
            <button
              class="mx-2 tooltip tooltip-left"
              data-tip="Nouvel énoncé"
              id="amc-export-new-enonce-button"
              type="button"
              aria-label="Nouvel énoncé"
              on:click={() => {
                exercice.seed = mathaleaGenerateSeed()
                seedrandom(exercice.seed, { global: true })
                if (exercice.nouvelleVersionWrapper != null)
                  exercice.nouvelleVersionWrapper()
                $exercicesParams[i].alea = exercice.seed
                mathaleaUpdateUrlFromExercicesParams()
              }}
              ><i
                class="text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest bx bx-refresh"
              ></i>
            </button>
            <!-- <button
               class="tooltip tooltip-left tooltip-neutral"
               data-tip="Changer les paramètres de l'exercice"
               type="button"
               on:click={() => {
    isSettingsVisible[i] = !isSettingsVisible[i]
  }}
             >
               <i
                 class="text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest bx {isSettingsVisible
        ? 'bxs-cog'
        : 'bx-cog'}"
               />
             </button>
            <div class="{isSettingsVisible[i] ? 'flex': 'hidden'} flex-col ...">
              <SettingsAmc {exercice}/>
            </div>
                         -->
          </div>
        {/each}
        <div>
          <BasicClassicModal
            bind:isDisplayed={isNonAMCModaleDisplayed}
            icon="bxs-error"
          >
            <span slot="header"></span>
            <div slot="content" class="text-justify">
              Les exercices suivants n'ayant pas de version AMC, ils ont été
              retirés de la liste.
              <ul class="list-inside list-disc text-left text-base mt-1">
                {#each refsExercicesARetirer as reference}
                  <li>{reference}</li>
                {/each}
              </ul>
            </div>
          </BasicClassicModal>
        </div>
      </div>
      <div>
        <div
          class="pb-2 font-bold text-coopmaths-struct-light dark:text-coopmathsdark-struct-light"
        >
          Nombre d'exemplaires distincts
        </div>
        <InputNumber
          id="amc-nb-exemplaires"
          min={1}
          max={100}
          bind:value={nbExemplaires}
        />
      </div>
    </div>

    <div
      class="flex flex-col md:flex-row justify-start items-start my-4 space-y-5 md:space-y-0 md:space-x-10 mt-8"
    >
      <ButtonActionInfo
        action="copy"
        textToCopy={content}
        tooltip="Copier le code LaTeX dans le presse-papier"
        text="Copier le code LaTeX"
        inverted={false}
        successMessage="Le code LaTeX a été copié dans le presse-papier"
        errorMessage="Impossible de copier le code dans le presse-papier !"
        displayDuration={3000}
        class="px-2 py-1 rounded-md"
      />
      <ButtonTextAction
        class="px-2 py-1 rounded-md"
        id="open-btn"
        on:click={() => {
          isOverleafModalDisplayed = true
        }}
        text="Compiler sur OverLeaf"
      />
    </div>

    {#if groupConsistencyReport && groupConsistencyReport.missingGroupDefinitions.length > 0}
      <div
        class="my-6 rounded-md border border-coopmaths-action bg-coopmaths-canvas-dark p-4 text-coopmaths-corpus dark:text-coopmathsdark-corpus"
      >
        <p class="font-bold">Alerte cohérence AMC</p>
        <p class="mt-1">
          Des groupes sont restitués sans élément correspondant. La compilation
          AMC peut échouer avec "No group mode".
        </p>
        <ul class="list-inside list-disc text-left text-base mt-2">
          {#each groupConsistencyReport.missingGroupDefinitions as groupName}
            <li>{groupName}</li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if groupConsistencyReport && groupConsistencyReport.unusedGroupDefinitions.length > 0}
      <div
        class="my-6 rounded-md border border-coopmaths-struct-light bg-coopmaths-canvas-dark p-4 text-coopmaths-corpus dark:text-coopmathsdark-corpus"
      >
        <p class="font-bold">Information cohérence AMC</p>
        <p class="mt-1">
          Certains groupes sont définis dans le document mais ne sont jamais
          restitués dans la copie finale.
        </p>
        <ul class="list-inside list-disc text-left text-base mt-2">
          {#each groupConsistencyReport.unusedGroupDefinitions as groupName}
            <li>{groupName}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <pre
      class="my-10 shadow-md bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark text-coopmaths-corpus dark:text-coopmathsdark-corpus p-4 w-full overflow-auto">
      {content}
    </pre>
  </section>
  <!-- Message avant envoi sur Overleaf -->
  <BasicClassicModal
    bind:isDisplayed={isOverleafModalDisplayed}
    icon="bxs-error"
  >
    <span slot="header">Attention !</span>
    <ul class="list-inside list-disc text-left text-base" slot="content">
      <li>Le fichier sorti d'Overleaf ne constitue qu'un aperçu.</li>
      <li>
        Le fichier doit être compilé sous AMC impérativement pour que le fichier
        soit fonctionnel.
      </li>
    </ul>
    <div slot="footer">
      <ButtonTextAction
        text="Compiler sur OverLeaf"
        on:click={handleOverLeaf}
      />
    </div>
  </BasicClassicModal>
  <!-- Formulaire pour Overleaf -->
  <form
    action="https://www.overleaf.com/docs"
    id="overleaf-form"
    method="POST"
    target="_blank"
  >
    <input
      type="hidden"
      name="snip_uri[]"
      value="https://coopmaths.fr/alea/static/amc/automultiplechoice.sty"
      autocomplete="off"
    />
    <input
      type="hidden"
      name="snip_name[]"
      value="automultiplechoice.sty"
      autocomplete="off"
    />
    <input
      autocomplete="off"
      bind:this={textForOverleaf}
      name="snip_uri[]"
      type="hidden"
      value=""
    />
    <input
      autocomplete="off"
      name="snip_name[]"
      type="hidden"
      value="coopmaths.tex"
    />
    <input autocomplete="off" name="engine" type="hidden" value="lualatex" />
  </form>
  <Footer />
</main>
