<script lang="ts">
  import { writable } from 'svelte/store'
  import { generateLatex, handleUrl } from '../../../lib/alacarte'
  import { mathaleaGetExercicesFromParams } from '../../../lib/mathalea'
  import { darkMode } from '../../../lib/stores/generalStore'
  import { referentielLocale } from '../../../lib/stores/languagesStore'
  import type { IExercice, IExerciceStatique } from '../../../lib/types'
  import Footer from '../../Footer.svelte'
  import ButtonActionInfo from '../../shared/forms/ButtonActionInfo.svelte'
  import ButtonTextAction from '../../shared/forms/ButtonTextAction.svelte'
  import NavBar from '../../shared/header/NavBar.svelte'

  const userInput = writable('')
  const latexOutput = writable('')

  const itemsWithExercises: {
    [key: string]: (IExercice | IExerciceStatique)[]
  } = {}

  function formatUserInput() {
    try {
      const parsedInput = JSON.parse($userInput)
      userInput.set(JSON.stringify(parsedInput, null, 4))
      return true
    } catch (e) {
      console.info('JSON non valide')
      return false
    }
  }

  async function handleValidate() {
    if (!formatUserInput()) {
      alert('JSON invalide')
      return
    }
    const userSettings = JSON.parse($userInput)
    const items = userSettings?.items ?? {}
    for (const item in items) {
      if (typeof items[item] === 'string') {
        const url = new URL(items[item])
        const exercisesParams = handleUrl(url)
        const exercises = await mathaleaGetExercicesFromParams(exercisesParams)
        itemsWithExercises[item] = exercises
      }
    }
    const content = generateLatex(userSettings, itemsWithExercises)
    latexOutput.set(content)
  }

  function handleKeyDownUserInput(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault()
    }
  }

  const defaultValueForUserInput = `{
    "items": {
        "Pythagore": "https://coopmaths.fr/alea/?uuid=bd660&id=4G20&n=1&d=10&s=3&s2=3&s3=false&alea=DEW7&cd=1&uuid=40c47&id=4G20-1&n=1&d=10&s=1&s2=3&s3=false&alea=scAR&cd=1",
        "Relatifs": "https://coopmaths.fr/alea/?uuid=745ba&id=4C10&alea=Vlug"
    },
    "documents": [
        {
            "title": "Élève 1",
            "items": [
                "Pythagore"
            ],
            "number": 2
        },
        {
            "title": "Élève 2",
            "items": [
                "Pythagore",
                "Relatifs"
            ],
            "number": 2
        }
    ]
}`

  userInput.set(defaultValueForUserInput)
</script>

<main
  class="bg-coopmaths-canvas dark:bg-coopmathsdark-canvas {$darkMode.isActive
    ? 'dark'
    : ''}"
>
  <NavBar
    subtitle="À la carte"
    subtitleType="export"
    handleLanguage={() => {}}
    locale={$referentielLocale}
  />

  <section
    class="px-4 py-0 md:py-10 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas"
  >
    <textarea
      bind:value={$userInput}
      class="w-full p-2 border rounded mb-5"
      rows="10"
      placeholder=""
      on:keydown={handleKeyDownUserInput}
    ></textarea>

    <ButtonTextAction text="Valider" on:click={handleValidate} />

    <ButtonActionInfo
      action="copy"
      textToCopy={$latexOutput}
      text="Copier le code"
      successMessage="Code LaTeX copié"
      errorMessage="Impossible de copier le code LaTeX dans le presse-papier"
      class="px-2 py-1 rounded-md"
    />

    <pre
      class="my-10 shadow-md bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark text-coopmaths-corpus dark:text-coopmathsdark-corpus p-4 w-full overflow-y-auto overflow-x-scroll text-xs">
      {$latexOutput}
    </pre>
  </section>
  <footer>
    <Footer />
  </footer>
</main>

<style>
  footer {
    margin-top: auto;
  }
</style>
