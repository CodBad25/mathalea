<script lang="ts">
  import katex from 'katex'
  import { onMount } from 'svelte'
  import { slide } from 'svelte/transition'
  import codeToLevelList from '../../../../../../json/codeToLevelList.json'
  import themesList from '../../../../../../json/levelsThemesList.json'
  import themesListCH from '../../../../../../json/levelsThemesListCH.json'
  import { monthes } from '../../../../../../lib/components/handleDate'
  import { codeToLevelTitle } from '../../../../../../lib/components/refUtils'
  import { toMap } from '../../../../../../lib/components/toMap'
  import {
    bibliothequeDisplayedContent,
    exercicesParams,
  } from '../../../../../../lib/stores/generalStore'
  import {
    isExamItemInReferentiel,
    isJSONReferentielEnding,
    type JSONReferentielObject,
  } from '../../../../../../lib/types/referentiels'
  import ReferentielEnding from './ReferentielEnding.svelte'

  const themes = toMap(themesList)
  const themesCH = toMap(themesListCH)

  export let subset: JSONReferentielObject
  export let unfold: boolean = false
  export let nestedLevelCount: number
  export let indexBase: number
  export let levelTitle: string
  export let pathToThisNode: string[]
  $: items = prepareSubset(subset)
  const levels = Object.keys(codeToLevelList)

  /**
   * Recherche dans la liste des thèmes si le thème est référencé
   * et si oui, renvoie son intitulé
   * @param {string} themeCode code du thème
   * @return {string} intitulé du thème
   * @author Sylvain Chambon & Rémi Angot
   */
  function themeTitle(themeCode: string) {
    let title = ''
    if (themes.has(themeCode)) {
      title = [
        themeCodeisSubthemeCode(
          levelTitle,
          Array.from(levelTitle.replace('auto', ''))[0],
        )
          ? ''
          : ' : ',
        themes.get(themeCode).get('titre'),
      ].join('')
    } else if (themesCH.has(themeCode)) {
      title = [
        themeCodeisSubthemeCode(
          levelTitle,
          Array.from(levelTitle.replace('auto', ''))[0],
        )
          ? ''
          : ' : ',
        themesCH.get(themeCode).get('titre'),
      ].join('')
    } else {
      title = ''
    }
    if (title.includes('$')) {
      const regexp = /(['$])(.*?)\1/g
      const matchs = title.match(regexp)
      matchs?.forEach((match) => {
        title = title.replace(
          match,
          katex.renderToString(match.replaceAll('$', '')),
        )
      })
    }
    return title
  }

  /**
   * Teste si le code du niveau correspond à un sous-thème :
   * sur la base de la syntaxe adoptée pour les codes des thèmes
   * (à savoir :  <NB><LETTRE><NOMBRE> ou auto<NB><LETTRE><NOMBRE>),
   * la fonction confronte le code à tester à une expression régulière afin de savoir si
   * une lettre suit le code de trois caractères.
   * @param {string} themeCode code du niveau
   * @param {string} level? niveau optionnel (6 par défaut)
   * @author Sylvain Chambon
   */
  function themeCodeisSubthemeCode(
    themeCode: string,
    level: string = '6',
  ): boolean {
    const regexp = new RegExp(`^(auto)?${level}[A-Z]\\d+[A-Z0-9]$`, 'g')
    const regexp3Auto = new RegExp(`^(3Auto)?[A-Z]\\d+[A-Z0-9]$`, `g`)
    const regexp1Auto = new RegExp(`^[12]A-[A-Z]\\d{1,2}$`, `g`)
    return (
      regexp.test(themeCode) ||
      regexp3Auto.test(themeCode) ||
      regexp1Auto.test(themeCode)
    )
  }

  /**
   * Ordonne les entrées d'un sous-menu à l'envers lorsque son titre contient le mot `année`
   * afin de commencer par l'année la plus récente
   */
  function prepareSubset(s: JSONReferentielObject) {
    // console.log('======= referentiel before preparation ====')
    // console.log(pathToThisNode.join('/'))
    // console.log(Object.entries(s))
    if (pathToThisNode.length !== 0) {
      // console.log('object in prepareSubset (pathToThisNode): ')
      // console.log(pathToThisNode)
      // console.log(s)
      // classement entrées CAN
      if (pathToThisNode[pathToThisNode.length - 1].includes('CAN')) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return Object.entries(s).sort(([keyA, valueA], [keyB, valueB]) => {
          return levels.indexOf(keyA) - levels.indexOf(keyB)
        })
      }
      // classement des entrées par années décroissantes
      const key = pathToThisNode[
        pathToThisNode.length - 1
      ] as keyof typeof codeToLevelList
      if (codeToLevelList[key]?.includes('année')) {
        return Object.entries(s).reverse()
      }
      // classement des entrées par années décroissantes
      if (pathToThisNode[pathToThisNode.length - 1].includes('année')) {
        return Object.entries(s).reverse()
      }

      // classement des thèmes dans l'ordre alphabétique
      const key2 = pathToThisNode[
        pathToThisNode.length - 1
      ] as keyof typeof codeToLevelList
      if (codeToLevelList[key2]?.includes('thème')) {
        return Object.entries(s).sort(([keyA, valueA], [keyB, valueB]) => {
          return keyA.localeCompare(keyB, 'fr')
        })
      }

      // classement des thèmes dans l'ordre alphabétique
      if (pathToThisNode[pathToThisNode.length - 1].includes('Tags')) {
        return Object.entries(s).sort(([keyA, valueA], [keyB, valueB]) => {
          return keyA.localeCompare(keyB, 'fr')
        })
      }

      // classement des thèmes dans l'ordre alphabétique
      if (pathToThisNode[pathToThisNode.length - 1].includes('Tags')) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const e = Object.entries(s).sort(([keyA, valueA], [keyB, valueB]) => {
          return keyA.localeCompare(keyB, 'fr')
        })

        // console.log('======= referentiel after (theme) ====')
        // console.log(e)
        return e
      }
      // classement des entrées par années : sujets 1 et 2
      const regExpForExactlyFourDigits = /^\d{4}$/gm
      if (
        regExpForExactlyFourDigits.test(
          pathToThisNode[pathToThisNode.length - 1],
        )
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return Object.entries(s).sort(([keyA, valueA], [keyB, valueB]) => {
          if (
            isExamItemInReferentiel(valueA) &&
            isExamItemInReferentiel(valueB) &&
            valueA.jour &&
            valueB.jour
          ) {
            const jourA = parseInt(valueA.jour.replace('J', ''))
            const jourB = parseInt(valueB.jour.replace('J', ''))
            const moisA = monthes.indexOf(valueA.mois ?? '')
            const moisB = monthes.indexOf(valueB.mois ?? '')
            return (
              moisB - moisA ||
              valueA.lieu.localeCompare(valueB.lieu) ||
              jourA - jourB
            )
          } else {
            return 0
          }
        })
      }
      return Object.entries(s)
    } else {
      // classement dans l'ordre alphabétique
      if (
        'Géométrie dynamique' === levelTitle ||
        'Vos ressources' === levelTitle
      ) {
        return Object.entries(s).sort(([keyA, valueA], [keyB, valueB]) => {
          return keyA.localeCompare(keyB, 'fr')
        })
      }
      return Object.entries(s)
    }
  }

  /**
   * Gestion la bibliothèque de statiques
   */
  let bibliothequeUuidInExercisesList: string[]
  $: {
    bibliothequeUuidInExercisesList = []
    const uuidList: string[] = []
    for (const entry of $exercicesParams) {
      uuidList.push(entry.uuid)
    }
    if ($bibliothequeDisplayedContent) {
      for (const item of Object.values($bibliothequeDisplayedContent)) {
        if (isJSONReferentielEnding(item) && uuidList.includes(item.uuid)) {
          bibliothequeUuidInExercisesList.push(item.uuid)
        }
      }
    }
    bibliothequeUuidInExercisesList = bibliothequeUuidInExercisesList
  }

  onMount(() => {
    //   console.log('******** subset ********')
    //   console.log(Object.entries(subset))
    // console.log('levelTitle: ', levelTitle)
    if (
      (nestedLevelCount === 1 && levelTitle === 'Exercices aléatoires') ||
      themeCodeisSubthemeCode(
        levelTitle,
        Array.from(levelTitle.replace('auto', ''))[0],
      )
    ) {
      unfold = true
    }
  })
</script>

<!--
  @component
  Composant destiné à afficher la liste des entrées d'un référentiel à un niveau N.
  On affiche le titre du niveau N et un clic sur ce titre déploie la liste des entrées
  du niveau N+1. Lorsque N=1, on considère que c'est un titre de section et le format est différent.

  #### Remarque
  Le composant s'appelle lui-même afin d'assurer récursivement le parcours entier du référentiel.
  On détecte si l'objet passé en paramètre est du type `JSONReferentielEnding` pour s'arrèter.
  Dans ce cas, le composant `ReferentielEnding.svelte` est appelé.

  #### Paramètres
  - **subset** (_JSONReferentielObject_) : la branche du référentiel à afficher.
  - **unfold** (_boolean_) : flag pour savoir si le niveau courant est déployé ou pas.
  - **nestedLevelCount** (_number_) : compteur pour connaître le nombre d'imbrication (utilisé pour la mise en page).
  - **indexBase** (_number_) : nombre utilisé pour identifier les éléments HTML.
  - **levelTitle** (_string_) : titre du niveau courant (clé du nœud retraduite sur la base des fichiers `levelsThemesList.json` et `codeToLevelList.json`).

 -->
<div class={`${$$props.class || ''}`}>
  <button
    id={'titre-liste-' + indexBase}
    type="button"
    disabled={Object.keys(subset).length === 0}
    class="w-full flex flex-row text-start items-center justify-between font-bold first-letter:first-linemarker
    {nestedLevelCount !== 1
      ? 'text-coopmaths-action dark:text-coopmathsdark-action hover:bg-coopmaths-canvas-darkest dark:hover:bg-coopmathsdark-canvas-darkest'
      : 'text-coopmaths-struct dark:text-coopmathsdark-struct py-2'}
    {unfold &&
    nestedLevelCount !== 1 &&
    !themeCodeisSubthemeCode(
      levelTitle,
      Array.from(levelTitle.replace('auto', ''))[0],
    )
      ? 'bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest'
      : 'bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark'}
    {Object.keys(subset).length === 0
      ? 'opacity-10'
      : 'opacity-100 cursor-pointer'}"
    style="padding-left: {(nestedLevelCount * 2) / 5}rem"
    on:click={() => {
      unfold = !unfold
    }}
  >
    <div
      id={'titre-liste-' + indexBase + '-content'}
      class=" {nestedLevelCount === 1
        ? 'text-xl'
        : themeCodeisSubthemeCode(
              levelTitle,
              Array.from(levelTitle.replace('auto', ''))[0],
            )
          ? 'text-base leading-none py-2'
          : 'text-base'}"
    >
      <!-- on va chercher dans les fichiers JSON les significations des clés passées comme titre -->
      {#if !themeCodeisSubthemeCode(levelTitle, Array.from(levelTitle.replace('auto', ''))[0])}
        {codeToLevelTitle(levelTitle)}
      {/if}
      <span
        class={themeCodeisSubthemeCode(
          levelTitle,
          Array.from(levelTitle.replace('auto', ''))[0],
        )
          ? 'font-normal text-sm leading-[80%]'
          : 'font-normal '}>{@html themeTitle(levelTitle)}</span
      >
    </div>
    <div>
      <!-- Suivant que c'est le premier niveau (nestedLevelCount = 1) ou pas, on a un affichage différent :
      le premier niveau correspond au tritre du référentiel -->
      {#if nestedLevelCount !== 1}
        <i
          class=" flex text-xl bg-transparent transition-transform duration-500 ease-in-out
        {unfold && nestedLevelCount !== 1
            ? 'bx bx-plus rotate-[225deg]'
            : 'bx bx-plus'}"
        ></i>
      {/if}

      {#if nestedLevelCount === 1}
        <i
          class="flex text-sm text-coopmaths-action dark:text-coopmathsdark-action bg-transparent transition-transform duration-500 ease-in-out
        {unfold ? 'bx bxs-up-arrow' : 'bx bxs-up-arrow rotate-[180deg]'}"
        ></i>
      {/if}
    </div>
  </button>
  <div>
    {#if unfold}
      <ul transition:slide|global={{ duration: 500 }}>
        {#each items as [key, obj], i}
          <li>
            {#if isJSONReferentielEnding(obj)}
              <ReferentielEnding
                ending={obj}
                nestedLevelCount={nestedLevelCount + 1}
                class={i === items.length - 1 ? 'pb-1' : ''}
              />
            {:else}
              <svelte:self
                indexBase={`${indexBase}-${i.toString()}`}
                levelTitle={key}
                nestedLevelCount={nestedLevelCount + 1}
                pathToThisNode={[...pathToThisNode, key]}
                bind:subset={obj}
              />
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
