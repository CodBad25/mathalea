<script lang="ts">
  import { onMount } from 'svelte'
  import { buildMathAleaURL } from '../../../lib/components/urls'
  import {
    mathaleaGenerateSeed,
    mathaleaUpdateUrlFromExercicesParams,
  } from '../../../lib/mathalea.js'
  import { canOptions } from '../../../lib/stores/canStore'
  import { darkMode, exercicesParams } from '../../../lib/stores/generalStore'
  import { globalOptions } from '../../../lib/stores/globalOptions'
  import { referentielLocale } from '../../../lib/stores/languagesStore'
  import Footer from '../../Footer.svelte'
  import ButtonActionInfo from '../../shared/forms/ButtonActionInfo.svelte'
  import ButtonQRCode from '../../shared/forms/ButtonQRCode.svelte'
  import ButtonTextAction from '../../shared/forms/ButtonTextAction.svelte'
  import ButtonToggleAlt from '../../shared/forms/ButtonToggleAlt.svelte'
  import FormRadio from '../../shared/forms/FormRadio.svelte'
  import InputNumber from '../../shared/forms/InputNumber.svelte'
  import InputText from '../../shared/forms/InputText.svelte'
  import NavBar from '../../shared/header/NavBar.svelte'
  import Tabs from '../../shared/ui/Tabs.svelte'

  $: activeTab = $canOptions.isChoosen ? 'can' : 'classic'

  const tabs = [
    {
      id: 'classic',
      label: 'Présentation classique',
      ariaControls: 'tabs-pres-classic',
    },
    { id: 'can', label: 'Course aux nombres', ariaControls: 'tabs-pres-can' },
  ]

  function handleTabChange(e: CustomEvent<string>) {
    if (e.detail === 'classic') {
      $canOptions.isChoosen = false
    } else {
      $canOptions.isChoosen = true
      toggleCan()
    }
  }

  onMount(() => {
    handleSeed()
  })

  const availableLinkFormats = {
    clear: {
      toolTipsMessage: 'En clair',
      icon: 'bx-glasses-alt',
      isShort: false,
      isEncrypted: false,
    },
    short: {
      toolTipsMessage: 'Raccourci',
      icon: 'bx-move-horizontal',
      isShort: true,
      isEncrypted: false,
    },
    crypt: {
      toolTipsMessage: 'Crypté',
      icon: 'bx-lock',
      isShort: false,
      isEncrypted: true,
    },
  }
  $: $canOptions.isInteractive = $globalOptions.setInteractive === '1'
  type LinkFormat = keyof typeof availableLinkFormats
  let currentLinkFormat: LinkFormat = 'clear'
  let setInteractive: string = $globalOptions.setInteractive ?? '2'
  let presMode:
    | 'liste_exos'
    | 'un_exo_par_page'
    | 'une_question_par_page'
    | 'recto'
    | 'verso' = $globalOptions.presMode ?? 'liste_exos'

  /**
   * Construit l'URL correspondant aux choix de la page de configuration et bascule sur cette page
   */
  function handleVueSetUp() {
    const nextView = $canOptions.isChoosen ? 'can' : 'eleve'
    const url = buildMathAleaURL({
      view: nextView,
      isEncrypted: availableLinkFormats[currentLinkFormat].isEncrypted,
      removeSeed: isDataRandom,
    })
    window.open(url, '_blank')?.focus()
  }

  // Gestion de la graine
  let isDataRandom: boolean = false
  function handleSeed() {
    for (const param of $exercicesParams) {
      if (!isDataRandom && param.alea === undefined) {
        param.alea = mathaleaGenerateSeed()
      } else if (isDataRandom) {
        param.alea = undefined
      }
    }
    mathaleaUpdateUrlFromExercicesParams($exercicesParams)
  }

  function toggleCan() {
    if ($canOptions.isChoosen) {
      $globalOptions.setInteractive = '1'
    }
  }
</script>

<main
  class=" {$darkMode.isActive
    ? 'dark'
    : ''} mb-auto flex flex-col min-h-screen justify-start bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
>
  <NavBar
    subtitle="La page Élève"
    subtitleType="export"
    handleLanguage={() => {}}
    locale={$referentielLocale}
  />
  <div
    class="flex flex-col h-full w-full bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
  >
    <div
      class="h-full w-full md:w-2/3 lg:w-3/5 flex flex-col px-4 pb-4 md:py-10 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark mx-auto"
    >
      <div
        class="flex flex-col md:flex-row justify-start px-4 py-4 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
      >
        <h3
          class="font-bold text-2xl text-coopmaths-struct dark:text-coopmathsdark-struct bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
        >
          Réglages
        </h3>
      </div>
      <!-- Tabulations pour la présentation -->
      <Tabs {tabs} {activeTab} on:change={handleTabChange} />
      <!-- Pages des réglages -->
      <div class="pb-6 pt-4 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas">
        <div
          class="transition-opacity duration-150 ease-linear {activeTab ===
          'classic'
            ? 'block opacity-100'
            : 'hidden opacity-0'}"
          id="tabs-pres-classic"
          role="tabpanel"
          aria-labelledby="tabs-pres-classic-btn"
        >
          <!-- Présentation classique -->
          <div
            class="flex px-6 py-2 font-light text-lg text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light"
          >
            Les exercices seront posés suivant les réglages ci-dessous.
          </div>
          <div class="pt-2 px-4 grid grid-flow-row md:grid-cols-3 gap-4">
            <div class="pb-2 w-full flex flex-col">
              <div
                class="pl-2 pb-2 font-bold text-coopmaths-struct-light dark:text-coopmathsdark-struct-light"
              >
                Présentation
              </div>
              <div
                class="pl-4 pb-4 w-full flex flex-row justify-start items-center space-x-2"
              >
                <div
                  class="text-sm font-light w-1/4 text-coopmaths-corpus/70 dark:text-coopmathsdark-corpus/70"
                >
                  Titre :
                </div>
                <InputText
                  inputID="config-eleve-titre-input"
                  bind:value={$globalOptions.title}
                  showTitle={false}
                  classAddenda="w-1/2 font-light"
                />
                <div
                  class="mt-1 text-coopmaths-corpus font-light italic text-xs {$globalOptions.title &&
                  $globalOptions.title.length === 0
                    ? ''
                    : 'invisible'}"
                >
                  Pas de bandeau si laissé vide.
                </div>
              </div>
              <FormRadio
                title="présentation"
                bind:valueSelected={presMode}
                on:newvalue={() => ($globalOptions.presMode = presMode)}
                labelsValues={[
                  {
                    label: 'Tous les exercices sur une page',
                    value: 'liste_exos',
                  },
                  {
                    label: 'Une page par exercice',
                    value: 'un_exo_par_page',
                    isDisabled: $exercicesParams.length === 1,
                  },
                  {
                    label: 'Une page par question',
                    value: 'une_question_par_page',
                  },
                  // { label: 'Cartes', value: 'cartes' }
                ]}
              />
              <div class="pl-4 pt-4">
                <ButtonToggleAlt
                  title={'Deux colonnes'}
                  isDisabled={$globalOptions.presMode === 'un_exo_par_page' ||
                    $globalOptions.presMode === 'une_question_par_page'}
                  bind:value={$globalOptions.twoColumns}
                  id={'config-eleve-nb-colonnes-toggle'}
                  explanations={[
                    'Les exercices seront présentés sur deux colonnes.',
                    'Les exercices seront présentés sur une seule colonne.',
                  ]}
                />
              </div>
            </div>

            <div class="pb-2">
              <div
                class="pl-2 pb-2 font-bold text-coopmaths-struct-light dark:text-coopmathsdark-struct-light"
              >
                Interactivité
              </div>
              <FormRadio
                title="Interactif"
                bind:valueSelected={setInteractive}
                on:newvalue={() =>
                  ($globalOptions.setInteractive = setInteractive)}
                labelsValues={[
                  { label: 'Laisser tel quel', value: '2' },
                  { label: 'Tout interactif', value: '1' },
                  { label: "Pas d'interactivité", value: '0' },
                ]}
              />
              <div class="pl-2 pt-4">
                <ButtonToggleAlt
                  title={"Modifier l'interactivité"}
                  bind:value={$globalOptions.isInteractiveFree}
                  id={'config-eleve-interactif-permis-toggle'}
                  explanations={[
                    "Les élèves peuvent rendre l'exercice interactif ou pas.",
                    "Les élèves ne pourront pas changer le status de l'interactivité.",
                  ]}
                />
              </div>
              <div class="pl-2 pt-2">
                <ButtonToggleAlt
                  title={'Une seule réponse'}
                  isDisabled={$globalOptions.setInteractive === '0'}
                  bind:value={$globalOptions.oneShot}
                  id={'config-eleve-refaire-toggle'}
                  explanations={[
                    "Les élèves n'auront qu'une seule possibilité pour répondre aux exercices.",
                    "Les élèves pourront refaire les exercices autant de fois qu'ils le souhaitent.",
                  ]}
                />
              </div>
            </div>
            <div class="pb-2">
              <div
                class="pl-2 pb-2 font-bold text-coopmaths-struct-light dark:text-coopmathsdark-struct-light"
              >
                Correction
              </div>
              <div class="flex flex-row justify-start items-center px-4">
                <ButtonToggleAlt
                  title={'Accès aux corrections'}
                  bind:value={$globalOptions.isSolutionAccessible}
                  id={'config-eleve-acces-corrections-toggle'}
                  explanations={[
                    'Les élèves pourront accéder aux corrections en cliquant sur un bouton.',
                    "Les élèves n'auront aucun moyen de voir la correction.",
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
        <div
          class="transition-opacity duration-150 ease-linear
          {activeTab === 'can' ? 'block opacity-100' : 'hidden opacity-0'}"
          id="tabs-pres-can"
          role="tabpanel"
          aria-labelledby="tabs-pres-can-btn"
        >
          <!-- Can -->
          <div
            class="flex px-6 py-2 font-light text-lg text-coopmaths-corpus-light dark:text-coopmathsdark-corpus-light"
          >
            Les questions seront posées les unes à la suite des autres en temps
            limité.
          </div>
          <div class="pt-2 px-4 grid grid-flow-row md:grid-cols-2 gap-4">
            <div class="pb-2 w-full flex flex-col">
              <div
                class="pl-2 pb-2 font-bold text-coopmaths-struct-light dark:text-coopmathsdark-struct-light"
              >
                Présentation
              </div>
              <div
                class="flex flex-col items-start justify-start space-y-2 px-4"
              >
                <div class="flex justify-start flex-row items-center space-x-2">
                  <div
                    class="text-sm font-light {$canOptions.isChoosen
                      ? 'text-coopmaths-corpus-light dark:text-coopmathsdark-corpus'
                      : 'text-coopmaths-corpus-light/10 dark:text-coopmathsdark-corpus/10'}"
                  >
                    Durée&nbsp;:
                  </div>
                  <InputNumber
                    id="config-eleve-can-duration-input"
                    min={1}
                    max={60}
                    bind:value={$canOptions.durationInMinutes}
                    isDisabled={!$canOptions.isChoosen}
                  />
                  <div
                    class="text-sm font-light {$canOptions.isChoosen
                      ? 'text-coopmaths-corpus-light dark:text-coopmathsdark-corpus'
                      : 'text-coopmaths-corpus-light/10 dark:text-coopmathsdark-corpus/10'}"
                  >
                    minute{$canOptions.durationInMinutes !== undefined &&
                    $canOptions.durationInMinutes > 1
                      ? 's'
                      : ''}.
                  </div>
                </div>
                <div class="flex justify-start flex-row items-center space-x-2">
                  <div
                    class="text-sm font-light {$canOptions.isChoosen
                      ? 'text-coopmaths-corpus-light dark:text-coopmathsdark-corpus'
                      : 'text-coopmaths-corpus-light/10 dark:text-coopmathsdark-corpus/10'}"
                  >
                    Sous-titre :
                  </div>
                  <InputText
                    inputID="config-eleve-can-subtitle-input"
                    bind:value={$canOptions.subTitle}
                    isDisabled={!$canOptions.isChoosen}
                    showTitle={false}
                    classAddenda="w-1/2 font-light"
                  />
                </div>
              </div>
            </div>
            <div class="pb-2">
              <div
                class="pl-2 pb-2 font-bold text-coopmaths-struct-light dark:text-coopmathsdark-struct-light"
              >
                Solutions
              </div>
              <div
                class="flex flex-col items-start justify-start space-y-2 px-4"
              >
                <ButtonToggleAlt
                  title={'Accès aux solutions'}
                  id={'config-eleve-solutions-can-toggle'}
                  bind:value={$canOptions.solutionsAccess}
                  isDisabled={!$canOptions.isChoosen}
                  explanations={[
                    'Les élèves auront accès aux solutions dans le format défini ci-dessous.',
                    "Les élèves n'auront pas accès aux solutions.",
                  ]}
                />
                <FormRadio
                  title="can-solutions-config"
                  bind:valueSelected={$canOptions.solutionsMode}
                  isDisabled={!$canOptions.isChoosen ||
                    !$canOptions.solutionsAccess}
                  labelsValues={[
                    {
                      label: 'Solutions rassemblées à la fin.',
                      value: 'gathered',
                    },
                    {
                      label: 'Solutions avec les questions.',
                      value: 'split',
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="pt-2 pl-2 grid grid-flow-row md:grid-cols-2 gap-4 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
      >
        <div class="pb-2">
          <div
            class="pl-2 pb-2 font-bold text-coopmaths-struct-light dark:text-coopmathsdark-struct-light"
          >
            Affichage du titre de l'exercice
          </div>
          <div class="flex flex-row justify-start items-center px-4">
            <ButtonToggleAlt
              title={"Titre de l'exercice"}
              bind:value={$globalOptions.isTitleDisplayed}
              id={'config-eleve-title-displayed-toggle'}
              explanations={[
                'Les titres sont affichés',
                'Les titres sont masqués.',
              ]}
              on:toggle={handleSeed}
            />
          </div>
        </div>
        <div class="pb-2">
          <div
            class="pl-2 pb-2 font-bold text-coopmaths-struct-light dark:text-coopmathsdark-struct-light"
          >
            Affichage de la référence de l'exercice
          </div>
          <div class="flex flex-row justify-start items-center px-4">
            <ButtonToggleAlt
              title={"Référence de l'exercice"}
              bind:value={$globalOptions.isReferenceDisplayed}
              id={'config-eleve-reference-displayed-toggle'}
              explanations={[
                'Les références sont affichées',
                'Les références sont masquées.',
              ]}
              on:toggle={handleSeed}
            />
          </div>
        </div>
        <div class="pb-2">
          <div
            class="pl-2 pb-2 font-bold text-coopmaths-struct-light dark:text-coopmathsdark-struct-light"
          >
            Données
          </div>
          <div class="flex flex-row justify-start items-center px-4">
            <ButtonToggleAlt
              title={'Données différentes'}
              bind:value={isDataRandom}
              id={'config-eleve-donnes-differentes-toggle'}
              explanations={[
                "Chaque élève aura des pages avec des données différentes d'un autre élève.",
                'Tous les élèves auront des pages identiques.',
              ]}
            />
          </div>
        </div>
      </div>
      <div
        class="pt-4 pb-8 px-4 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
      >
        <ButtonTextAction
          on:click={handleVueSetUp}
          class="px-2 py-1 rounded-md"
          text="Visualiser"
        />
      </div>
      <div
        class="flex flex-row justify-start px-4 pt-4 pb-2 bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
      >
        <h3
          class="font-bold text-2xl text-coopmaths-struct dark:text-coopmathsdark-struct"
        >
          Utilisation
        </h3>
      </div>
      <div class="py-4 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas">
        <div
          class="flex flex-col md:flex-row justify-start space-x-10 items-start md:items-center px-4 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
        >
          <div
            class="text-coopmaths-struct-light dark:text-coopmathsdark-struct-light font-semibold"
          >
            Format de l'URL
          </div>
          <div class="flex">
            <FormRadio
              title="linkFormat"
              bind:valueSelected={currentLinkFormat}
              labelsValues={[
                { label: 'En clair', value: 'clear' },
                { label: 'Crypté', value: 'crypt' },
                { label: 'Raccourci', value: 'short', isDisabled: true },
              ]}
              orientation="row"
            />
          </div>
        </div>
        <div
          class="flex flex-row justify-start items-start space-x-10 pt-3 pl-4 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
        >
          <div class="flex flex-col items-center px-2">
            <div
              class="text-coopmaths-struct-lightest dark:text-coopmathsdark-struct-light font-semibold"
            >
              Lien
            </div>
            <div class="my-1">
              <ButtonActionInfo
                action="copy"
                textToCopy={buildMathAleaURL({
                  view: $canOptions.isChoosen ? 'can' : 'eleve',
                  isEncrypted:
                    availableLinkFormats[currentLinkFormat].isEncrypted,
                  removeSeed: isDataRandom,
                }).toString()}
                tooltip={'Lien ' +
                  availableLinkFormats[currentLinkFormat].toolTipsMessage}
                icon={'bx-link text-2xl'}
                cornerIcon={availableLinkFormats[currentLinkFormat].icon}
                messageSuccess="Le lien de la fiche élève est copié dans le presse-papier !"
                messageError="Impossible de copier le lien dans le presse-papier !"
              />
            </div>
          </div>
          <div class="flex flex-col justify-center items-center px-2">
            <div
              class="font-semibold
              text-coopmaths-struct-lightest dark:text-coopmathsdark-struct-lightest"
            >
              QR-Code
            </div>
            <div class="my-1">
              <ButtonQRCode
                tooltip={'QR-code (lien ' +
                  availableLinkFormats[currentLinkFormat].toolTipsMessage +
                  ')'}
                customUrl={buildMathAleaURL({
                  view: $canOptions.isChoosen ? 'can' : 'eleve',
                  isEncrypted:
                    availableLinkFormats[currentLinkFormat].isEncrypted,
                  removeSeed: isDataRandom,
                }).toString()}
                cornerIcon={availableLinkFormats[currentLinkFormat].icon}
              />
            </div>
          </div>
          <div class="flex flex-col justify-center items-center px-2">
            <div
              class="text-coopmaths-struct-lightest dark:text-coopmathsdark-struct-light font-semibold"
            >
              Embarqué
            </div>
            <div class="my-1">
              <ButtonActionInfo
                action="copy"
                textToCopy={`<iframe src="${buildMathAleaURL({
                  view: $canOptions.isChoosen ? 'can' : 'eleve',
                  isEncrypted:
                    availableLinkFormats[currentLinkFormat].isEncrypted,
                  removeSeed: isDataRandom,
                }).toString()}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`}
                tooltip={'Code (lien ' +
                  availableLinkFormats[currentLinkFormat].toolTipsMessage +
                  ')'}
                icon={'bx-code-alt text-2xl'}
                cornerIcon={availableLinkFormats[currentLinkFormat].icon}
                messageSuccess="Le code de la fiche élève est copié dans le presse-papier !"
                messageError="Impossible de copier le code dans le presse-papier !"
              />
            </div>
          </div>
          <div class="flex flex-col justify-center items-center px-2">
            <div
              class="text-coopmaths-struct-lightest dark:text-coopmathsdark-struct-light font-semibold"
            >
              Fichier
            </div>
            <div class="my-1">
              <ButtonActionInfo
                action="download"
                urlToDownload={buildMathAleaURL({
                  view: $canOptions.isChoosen ? 'can' : 'eleve',
                  isEncrypted:
                    availableLinkFormats[currentLinkFormat].isEncrypted,
                  removeSeed: isDataRandom,
                }).toString()}
                fileName={$globalOptions.title
                  ? $globalOptions.title
                  : 'mathAlea'}
                successMessage="Le téléchargement va début dans quelques instants."
                errorMessage="Impossible de télécharger le fichier."
                tooltip={'Fichier de redirection (lien ' +
                  availableLinkFormats[currentLinkFormat].toolTipsMessage +
                  ')'}
                icon={'bxs-file-export text-2xl'}
                cornerIcon={availableLinkFormats[currentLinkFormat].icon}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Footer />
</main>
