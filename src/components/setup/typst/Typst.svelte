<script lang="ts">
  import { EditorState } from '@codemirror/state'
  import { EditorView } from '@codemirror/view'
  import JSZip from 'jszip'
  import seedrandom from 'seedrandom'
  import { onDestroy, onMount } from 'svelte'
  import { get } from 'svelte/store'
  import {
    buildExercise,
    buildExercisesList,
    getBanquesExternesPreambuleTyp,
    getStaticExerciceCorTypUrl,
    getStaticExerciceTypUrl,
  } from '../../../lib/components/exercisesUtils'
  import { applyExerciceSettings } from '../../../lib/components/exerciceSettings'
  import {
    mathaleaFormatExercice,
    mathaleaHandleExerciceSimple,
    mathaleaUpdateUrlFromExercicesParams,
  } from '../../../lib/mathalea'
  import {
    darkMode,
    exercicesParams,
    freezeUrl,
    typstParamStore,
  } from '../../../lib/stores/generalStore'
  import { referentielLocale } from '../../../lib/stores/languagesStore'
  import { isLocalStorageAvailable } from '../../../lib/stores/storage'
  import type { IExercice, InterfaceParams } from '../../../lib/types'
  import { decodeBase64, encodeBase64 } from '../latex/LatexConfig'
  import { context } from '../../../modules/context'
  import Settings from '../../shared/exercice/exerciceMathalea/exerciceMathaleaVueProf/presentationalComponents/Settings.svelte'
  import ButtonTextAction from '../../shared/forms/ButtonTextAction.svelte'
  import NavBar from '../../shared/header/NavBar.svelte'
  import { SM_BREAKPOINT } from '../../keyboard/lib/sizes'
  import {
    BADGE_STYLES,
    COVER_TEMPLATES,
    COVER_TEMPLATE_DEFAULTS,
    HEADER_STYLES,
    INSERTION_CORRECTION_TAG,
    INSERTION_TAG,
    MATH_FONTS,
    TEXT_FONTS,
    buildStandaloneExerciseCode,
    buildTypstDocument,
    defaultTypstDocumentOptions,
    getGeneratedCanRowCode,
    getGeneratedCorrectionCode,
    getGeneratedExerciseCode,
    harvestCarryOver,
    type ActiveCoverTemplate,
    type CoverTemplate,
    type TypstCarryOver,
    type TypstDocumentOptions,
    type TypstExerciseInput,
    type WritingLinesPosition,
  } from './buildTypstDocument'
  import TypstAddExerciseModal from './addExercise/TypstAddExerciseModal.svelte'
  import TypstLayoutOverlay, {
    type OverlayWidget,
    type TasksLayoutValue,
  } from './TypstLayoutOverlay.svelte'
  import type { TypstAnchor } from './typstCompiler'
  import { setStaticImagePaths } from './latexToTypst'
  import { LOGO_CAN_URL, LOGO_CAN_VIRTUAL_PATH } from './mathaleaLogo'
  import {
    countErrors,
    parseTypstDiagnostics,
    summarizeDiagnostics,
    type TypstDiagnostic,
  } from './typstDiagnostics'
  import {
    codeEditorExtensions,
    revealPosition,
    setEditorMarkers,
    setEditorTheme,
    type EditorMarker,
  } from '../shared/editor/editorSetup'
  import { typstLanguage } from './editor/typstLanguage'

  /** Libellés des habillages d'en-tête */
  const HEADER_STYLE_LABELS: Record<(typeof HEADER_STYLES)[number], string> = {
    epure: 'Épuré',
    cartouche: 'Cartouche',
    cadre: 'Cadre',
    aucun: 'Aucun',
  }

  /** Libellés des styles de badge du paquet exercise-bank */
  const BADGE_STYLE_LABELS: Record<(typeof BADGE_STYLES)[number], string> = {
    'border-accent': 'Barre latérale',
    box: 'Encadré (marge)',
    'rounded-box': 'Encadré arrondi',
    'header-card': 'Bandeau',
    underline: 'Souligné',
    pill: 'Pastille (marge)',
    tag: 'Étiquette (marge)',
    circled: 'Numéro cerclé (marge)',
    'filled-circle': 'Numéro plein (marge)',
  }

  /** Libellés des modèles de page de garde */
  const COVER_TEMPLATE_LABELS: Record<CoverTemplate, string> = {
    aucune: 'Aucune',
    evaluation: 'Évaluation',
    brevet: 'Brevet des collèges',
    bac: 'BAC',
    can: 'Course aux nombres',
  }

  /** Palette de couleurs proposées pour les badges (expression Typst) */
  const BADGE_COLORS: { label: string; value: string; css: string }[] = [
    { label: 'Noir', value: 'black', css: '#000000' },
    { label: 'Orange', value: 'rgb("#f15929")', css: '#f15929' },
    { label: 'Bleu', value: 'rgb("#1d4ed8")', css: '#1d4ed8' },
    { label: 'Vert', value: 'rgb("#4a7c59")', css: '#4a7c59' },
    { label: 'Rouge', value: 'rgb("#dc2626")', css: '#dc2626' },
    { label: 'Violet', value: 'rgb("#7c3aed")', css: '#7c3aed' },
  ]

  type DisplayMode = 'code' | 'split' | 'preview'
  const STORAGE_KEY = 'mathaleaTypstView'

  // Sur téléphone, l'éditeur de code et l'affichage côte à côte n'ont pas de
  // place : seul l'aperçu est proposé et le volet de réglages reste replié.
  const isMobile = window.innerWidth < SM_BREAKPOINT

  let displayMode: DisplayMode = $state('preview')
  let isSettingsOpen = $state(!isMobile)
  /** Affiche la palette de mise en page sur l'aperçu */
  let showOverlay = $state(!isMobile)
  /**
   * Valeur initiale de `documentOptions` (calculée ici, hors réactivité, pour
   * n'assigner l'état qu'une seule fois — lire un `$state` en dehors d'un
   * `$derived`/`$effect` ne fait que capturer l'instantané courant).
   */
  let restoredDocumentOptions: TypstDocumentOptions = {
    ...defaultTypstDocumentOptions,
  }
  if (isLocalStorageAvailable()) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved != null) {
        const parsed = JSON.parse(saved)
        // sur téléphone on reste sur l'aperçu quel que soit le mode mémorisé
        if (
          !isMobile &&
          ['code', 'split', 'preview'].includes(parsed.displayMode)
        ) {
          const restoredDisplayMode = parsed.displayMode as DisplayMode
          displayMode = restoredDisplayMode
          // le bouton Réglages n'existe qu'en Aperçu : hors de ce mode, le
          // volet doit rester fermé (isSettingsOpen n'est pas persisté)
          if (restoredDisplayMode !== 'preview') isSettingsOpen = false
        }
        if (!isMobile && typeof parsed.showOverlay === 'boolean') {
          showOverlay = parsed.showOverlay
        }
        if (parsed.documentOptions != null) {
          restoredDocumentOptions = {
            ...defaultTypstDocumentOptions,
            ...parsed.documentOptions,
          }
          // assainit les réglages issus d'anciennes versions : une valeur qui
          // n'existe plus (ex. style de badge « margin » retiré) retombe sur
          // la valeur par défaut
          const has = (list: readonly string[], value: string) =>
            list.includes(value)
          if (!has(BADGE_STYLES, restoredDocumentOptions.badgeStyle)) {
            restoredDocumentOptions.badgeStyle =
              defaultTypstDocumentOptions.badgeStyle
          }
          if (!has(HEADER_STYLES, restoredDocumentOptions.headerStyle)) {
            restoredDocumentOptions.headerStyle =
              defaultTypstDocumentOptions.headerStyle
          }
          if (!has(TEXT_FONTS, restoredDocumentOptions.font)) {
            restoredDocumentOptions.font = defaultTypstDocumentOptions.font
          }
          if (!has(MATH_FONTS, restoredDocumentOptions.mathFont)) {
            restoredDocumentOptions.mathFont =
              defaultTypstDocumentOptions.mathFont
          }
          if (
            !Number.isInteger(restoredDocumentOptions.nbVersions) ||
            restoredDocumentOptions.nbVersions < 1 ||
            restoredDocumentOptions.nbVersions > 4
          ) {
            restoredDocumentOptions.nbVersions =
              defaultTypstDocumentOptions.nbVersions
          }
          restoredDocumentOptions.coverPage = sanitizeCoverPage(
            restoredDocumentOptions.coverPage,
          )
        }
      }
    } catch {
      // préférences illisibles : on garde les valeurs par défaut
    }
  }
  /**
   * Réglages de la palette de mise en page (colonnes/espacement des
   * questions, textes et sections insérés, sauts de page/colonne, fusions,
   * zoom/alignement des figures) restaurés depuis l'URL. Injectés dans la
   * première génération du code ; les modifications suivantes sont relues
   * dans le code courant.
   */
  let urlCarryOver: TypstCarryOver | null = null
  // Le diaporama (bouton « PDF sujets + corrigés ») transmet ici son nombre
  // de vues via typstParam — comme le fait la vue A4 avec a4Param — pour que
  // le nombre de sujets Typst corresponde au nombre de vues jouées. Depuis
  // que la vue Typst réécrit ce paramètre à chaque modification, il porte
  // aussi tous les réglages du document et de la mise en page (rechargeables).
  const typstUrlParam = new URL(window.location.href).searchParams.get(
    'typstParam',
  )
  /**
   * Un lien partagé fixe déjà ces réglages : la détection automatique de la
   * présentation « Course aux nombres » (voir `loadExercises`) ne doit
   * remplacer que ceux qu'il n'a pas fixés.
   */
  let canModeSetFromUrl = false
  let pageFormatSetFromUrl = false
  let coverTemplateSetFromUrl = false
  let headerStyleSetFromUrl = false
  let titleSetFromUrl = false
  if (typstUrlParam != null) {
    typstParamStore.set(typstUrlParam)
    const parsed = decodeBase64(typstUrlParam)
    if (parsed.options != null) {
      restoredDocumentOptions = {
        ...restoredDocumentOptions,
        ...parsed.options,
      }
      canModeSetFromUrl = parsed.options.canMode !== undefined
      pageFormatSetFromUrl = parsed.options.pageFormat !== undefined
      coverTemplateSetFromUrl = parsed.options.coverPage?.template !== undefined
      headerStyleSetFromUrl = parsed.options.headerStyle !== undefined
      titleSetFromUrl = parsed.options.title !== undefined
      restoredDocumentOptions.coverPage = sanitizeCoverPage(
        restoredDocumentOptions.coverPage,
      )
    }
    if (parsed.carryOver != null) {
      urlCarryOver = parsed.carryOver
    }
  }
  let documentOptions: TypstDocumentOptions = $state(restoredDocumentOptions)

  /**
   * Page de garde restaurée d'un lien partagé ou des préférences : un réglage
   * absent (fiche d'avant la fonctionnalité) ou d'un modèle qui n'existe plus
   * retombe sur les valeurs par défaut.
   */
  function sanitizeCoverPage(
    cover: TypstDocumentOptions['coverPage'] | undefined,
  ): TypstDocumentOptions['coverPage'] {
    const fallback = defaultTypstDocumentOptions.coverPage
    if (cover == null || typeof cover !== 'object') {
      return { ...fallback, consignes: [], bareme: [] }
    }
    const texte = (value: unknown, defaut = ''): string =>
      typeof value === 'string' ? value : defaut
    return {
      template: COVER_TEMPLATES.includes(cover.template)
        ? cover.template
        : fallback.template,
      titre: texte(cover.titre),
      session: texte(cover.session),
      matiere: texte(cover.matiere),
      duree: texte(cover.duree),
      consignes: Array.isArray(cover.consignes)
        ? cover.consignes.filter((ligne) => typeof ligne === 'string')
        : [],
      noteFin: texte(cover.noteFin),
      bareme: Array.isArray(cover.bareme)
        ? cover.bareme.map(Number).filter((points) => Number.isFinite(points))
        : [],
      showBareme:
        typeof cover.showBareme === 'boolean'
          ? cover.showBareme
          : fallback.showBareme,
    }
  }

  /** Page de garde en cours de réglage (raccourci d'écriture) */
  const coverPage = $derived(documentOptions.coverPage)

  /** Total du barème affiché à côté du tableau des points */
  const coverTotalPoints = $derived(
    coverPage.bareme.reduce((total, points) => total + Number(points || 0), 0),
  )

  /** Session courante, au format « Juin 2026 » (comme la vue LaTeX) */
  function currentSession(): string {
    const date = new Date()
    const mois = date.toLocaleDateString('fr-FR', { month: 'long' })
    return `${mois.charAt(0).toUpperCase() + mois.slice(1)} ${date.getFullYear()}`
  }

  /**
   * Un texte est « d'origine » tant qu'il est vide ou qu'il reprend mot pour
   * mot celui d'un modèle : changer de modèle le remplace alors par le texte
   * du nouveau. Un texte réécrit par le professeur, lui, est conservé —
   * sans quoi passer du Brevet à la Course aux nombres garderait « Durée :
   * 2 heures » et « calculatrice autorisée », qui la contredisent.
   */
  function isDefaultCoverText(
    valeur: string,
    champ: 'titre' | 'matiere' | 'duree' | 'noteFin',
  ): boolean {
    return (
      valeur === '' ||
      Object.values(COVER_TEMPLATE_DEFAULTS).some(
        (defauts) => defauts[champ] === valeur,
      )
    )
  }

  /** Pendant de `isDefaultCoverText` pour la liste des consignes */
  function isDefaultCoverConsignes(consignes: string[]): boolean {
    return (
      consignes.length === 0 ||
      Object.values(COVER_TEMPLATE_DEFAULTS).some(
        (defauts) =>
          defauts.consignes.length === consignes.length &&
          defauts.consignes.every((ligne, i) => ligne === consignes[i]),
      )
    )
  }

  /**
   * Prépare (ou efface) la page de garde au changement de modèle : les textes
   * du nouveau modèle remplacent ceux qui n'ont pas été personnalisés, et le
   * barème est initialisé à partir des exercices de la fiche. Choisir un
   * modèle bascule aussi l'habillage en-tête sur « Aucun » : la page de garde
   * porte déjà le titre de la fiche, un second bloc de titre en page 2 ferait
   * doublon (l'utilisateur peut toujours le rétablir ensuite à la main).
   */
  async function applyCoverTemplate() {
    const template = coverPage.template
    if (template === 'aucune') {
      applyDocumentOptions()
      return
    }
    const defauts = COVER_TEMPLATE_DEFAULTS[template as ActiveCoverTemplate]
    documentOptions.coverPage = {
      ...coverPage,
      titre: isDefaultCoverText(coverPage.titre, 'titre')
        ? defauts.titre
        : coverPage.titre,
      matiere: isDefaultCoverText(coverPage.matiere, 'matiere')
        ? defauts.matiere
        : coverPage.matiere,
      session: coverPage.session === '' ? currentSession() : coverPage.session,
      duree: isDefaultCoverText(coverPage.duree, 'duree')
        ? defauts.duree
        : coverPage.duree,
      consignes: isDefaultCoverConsignes(coverPage.consignes)
        ? defauts.consignes
        : coverPage.consignes,
      noteFin: isDefaultCoverText(coverPage.noteFin, 'noteFin')
        ? defauts.noteFin
        : coverPage.noteFin,
      bareme:
        coverPage.bareme.length > 0 ? coverPage.bareme : defaultCoverBareme(),
    }
    documentOptions.headerStyle = 'aucun'
    // le modèle « can » a son propre logo (asset fixe, pas embarqué dans le
    // code) : sans ce prefetch, il resterait absent du registre tant qu'une
    // autre action (ex. « Nouvelles données ») ne le redéclencherait pas.
    if (template === 'can') await prefetchStaticImages()
    applyDocumentOptions()
  }

  /** Titre affiché en page de garde et repris dans le pied de page (`titre`
   * Typst) en présentation « Course aux nombres » — au lieu du titre par
   * défaut d'une fiche classique, sans objet ici (il n'y a pas de « fiche
   * d'exercices », juste l'épreuve du jour).
   */
  const CAN_TITLE = 'La course aux nombres'

  /**
   * (Dé)cocher « Présentation Course aux nombres » : la coche vient souvent
   * du réglage automatique de `loadExercises` (fiche 100% « can » → format
   * A5 + page de garde « can » + en-tête « Aucun » (pas de second titre en
   * page 2, la page de garde en porte déjà un) + titre « La course aux
   * nombres », repris dans le pied de page), donc la (dé)cocher doit
   * (dé)faire ces quatre réglages plutôt que de laisser une fiche normale en
   * A5, sans page de garde ni en-tête, ou une fiche « Course aux nombres »
   * dont le pied de page dit encore « Fiche d'exercices ». Sans effet si
   * l'utilisateur a lui-même choisi un autre format/une autre page de
   * garde/un autre en-tête/un autre titre entre-temps.
   */
  function toggleCanMode() {
    if (documentOptions.canMode) {
      if (documentOptions.title === defaultTypstDocumentOptions.title) {
        documentOptions.title = CAN_TITLE
      }
    } else {
      if (documentOptions.pageFormat === 'a5') {
        documentOptions.pageFormat = 'a4'
      }
      if (documentOptions.coverPage.template === 'can') {
        documentOptions.coverPage = {
          ...documentOptions.coverPage,
          template: 'aucune',
        }
      }
      if (documentOptions.headerStyle === 'aucun') {
        documentOptions.headerStyle = defaultTypstDocumentOptions.headerStyle
      }
      if (documentOptions.title === CAN_TITLE) {
        documentOptions.title = defaultTypstDocumentOptions.title
      }
    }
    applyDocumentOptions()
  }

  /**
   * Barème proposé : un point par question, comme la page de garde de la vue
   * PDF (`buildExamExercices` de `lib/LatexGroup.ts`).
   */
  function defaultCoverBareme(): number[] {
    return exercises.map((exercise) => exercise?.listeQuestions?.length || 1)
  }

  /**
   * Réaligne le barème sur les exercices de la fiche : les points déjà saisis
   * sont gardés, les exercices ajoutés depuis prennent le barème par défaut.
   */
  function resizeCoverBareme() {
    const defauts = defaultCoverBareme()
    documentOptions.coverPage.bareme = defauts.map(
      (points, index) => coverPage.bareme[index] ?? points,
    )
    applyDocumentOptions()
  }

  /**
   * Retire une ligne du barème (comme `TexSettingsPane.removeExamExercice`) :
   * la page de garde peut compter moins de lignes que d'exercices (groupés,
   * ou dont le barème ne suit pas un-à-un la fiche).
   */
  function removeCoverBaremeRow(index: number) {
    documentOptions.coverPage.bareme = coverPage.bareme.filter(
      (_points, i) => i !== index,
    )
    applyDocumentOptions()
  }

  /** Couleur des badges au format `#rrggbb` pour le sélecteur natif */
  const badgeColorHex = $derived(
    (() => {
      const value = documentOptions.badgeColor
      const hex = value.match(/#([0-9a-fA-F]{6})/)
      if (hex != null) return `#${hex[1]}`
      if (value === 'black') return '#000000'
      return '#000000'
    })(),
  )
  /** La couleur active ne fait pas partie des pastilles prédéfinies */
  const isCustomBadgeColor = $derived(
    !BADGE_COLORS.some((color) => color.value === documentOptions.badgeColor),
  )

  let exercises: (IExercice | null)[] = $state([])
  let isLoading = $state(true)
  /**
   * Le code a été modifié à la main depuis sa génération. Les éditions
   * faites par la palette de mise en page ne comptent pas : elles sont
   * reprises telles quelles à la régénération (carry-over), il n'y a donc
   * rien à perdre — l'avertissement ne concerne que la frappe directe.
   */
  let isEdited = false
  /** Édition en cours déclenchée par la palette (et non par la frappe) */
  let isPaletteEdit = false

  /** Édition du code par la palette : ne marque pas le code comme modifié */
  function dispatchPaletteEdit(changes: {
    from: number
    to?: number
    insert: string
  }) {
    if (editorView == null) return
    isPaletteEdit = true
    try {
      editorView.dispatch({ changes })
    } finally {
      isPaletteEdit = false
    }
  }
  let isCompiling = $state(false)
  let isCompilerLoading = $state(false)
  /**
   * Vrai seulement une fois confirmé que le compilateur n'est PAS en cache
   * (téléchargement à prévoir). Par défaut faux : on affiche un message
   * neutre tant qu'on ne sait pas, pour éviter un clignotement « première
   * visite » sur les rechargements où le compilateur est déjà en cache.
   */
  let compilerFirstVisit = $state(false)
  let isGeneratingPdf = $state(false)
  /** Fenêtre d'aide listant les raccourcis clavier de l'éditeur */
  let isShortcutsOpen = $state(false)
  /** Touche de modification affichée dans l'aide, selon la plateforme */
  const MOD_KEY =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad/.test(navigator.userAgent)
      ? '⌘'
      : 'Ctrl'
  /**
   * Raccourcis de l'éditeur, par famille. Ils viennent de CodeMirror
   * (`defaultKeymap`, `searchKeymap`) et de `codeEditorExtensions`.
   */
  const EDITOR_SHORTCUTS: { title: string; keys: [string, string][] }[] = [
    {
      title: 'Rechercher et sélectionner',
      keys: [
        [`${MOD_KEY} + F`, 'Rechercher / remplacer'],
        [`${MOD_KEY} + G`, 'Occurrence suivante'],
        [`${MOD_KEY} + D`, 'Ajouter l’occurrence suivante à la sélection'],
        [`${MOD_KEY} + Maj + L`, 'Sélectionner toutes les occurrences'],
        [`${MOD_KEY} + L`, 'Sélectionner la ligne'],
        ['Alt + G', 'Aller à la ligne…'],
        ['Échap', 'Revenir à un seul curseur'],
      ],
    },
    {
      title: 'Modifier',
      keys: [
        [`${MOD_KEY} + /`, 'Commenter / décommenter'],
        ['Alt + ↑ / ↓', 'Déplacer la ligne'],
        ['Maj + Alt + ↑ / ↓', 'Dupliquer la ligne'],
        [`${MOD_KEY} + Maj + D`, 'Dupliquer la ligne vers le bas'],
        [`${MOD_KEY} + Maj + K`, 'Supprimer la ligne'],
        ['Tab / Maj + Tab', 'Indenter / désindenter'],
        [`${MOD_KEY} + Z`, 'Annuler'],
        [`${MOD_KEY} + Maj + Z`, 'Rétablir'],
      ],
    },
    {
      title: 'Curseurs multiples',
      keys: [
        [
          `${MOD_KEY} + Alt + ↑ / ↓`,
          'Ajouter un curseur au-dessus / en dessous',
        ],
        ['Alt + glisser', 'Sélection rectangulaire'],
      ],
    },
    {
      title: 'Compiler et replier',
      keys: [
        [`${MOD_KEY} + Entrée`, 'Compiler tout de suite'],
        [`${MOD_KEY} + Maj + [ / ]`, 'Replier / déplier le bloc'],
      ],
    },
  ]

  /** Diagnostics de la dernière compilation, traduits en français */
  let diagnostics: TypstDiagnostic[] = $state([])
  /** Le panneau d'erreurs est replié (l'utilisateur l'a fermé) */
  let isDiagnosticsCollapsed = $state(false)
  let svgContent = $state('')

  const errorCount = $derived(countErrors(diagnostics))
  const diagnosticsSummary = $derived(summarizeDiagnostics(diagnostics))
  /**
   * L'aperçu affiché ne correspond plus au code : la compilation a échoué et
   * c'est le rendu précédent qui reste à l'écran. Sans rien de visible en
   * mode « Code », la remarque n'a pas lieu d'être.
   */
  const isPreviewStale = $derived(
    errorCount > 0 && svgContent !== '' && displayMode !== 'code',
  )

  /**
   * Dernier code Typst qui a compilé, et son horodatage. Sert au bouton de
   * retour arrière proposé quand la compilation échoue : le professeur
   * récupère une fiche qui s'affiche, sans avoir à retrouver lui-même
   * la modification fautive.
   */
  let lastGoodCode: string | null = null
  let lastGoodAt: Date | null = $state(null)
  /** Vrai quand le code courant diffère de la dernière version qui compilait */
  let canRestoreLastGood = $state(false)

  let editorEl: HTMLDivElement = $state()!
  let editorView: EditorView | null = null

  /** Géométrie d'une page dans le SVG de l'aperçu (unités pt du viewBox) */
  interface PreviewPageGeometry {
    /** Ordonnée du haut de la page (espacement entre pages inclus) */
    y: number
    width: number
    height: number
  }
  let previewPages: PreviewPageGeometry[] = $state([])
  let previewViewBox = $state({ width: 0, height: 0 })
  /** Repères publiés par le document compilé (palette de mise en page) */
  let anchors: TypstAnchor[] = $state([])
  /**
   * Mise en page des questions, lue dans le code courant, par préfixe de
   * variables (`ex1` pour l'énoncé, `ex1-corr` pour la correction)
   */
  let tasksLayoutValues: Record<string, TasksLayoutValue> = $state({})
  /** Insertions (texte/section) présentes dans le code, par repère de gap */
  let insertionValues: Record<number, string[]> = $state({})
  /** Insertions (texte/section) présentes juste avant chaque correction, par numéro d'exercice */
  let insertionCorrectionValues: Record<number, string[]> = $state({})
  /**
   * Numéros (1-based) des exercices fusionnés avec le précédent, lus dans
   * le code courant (bouton de la palette de mise en page).
   */
  let mergedExercises: number[] = $state([])
  /** Variables d'en-tête de la fiche, lues dans le code courant */
  let headerValues = $state({ titre: '', 'sous-titre': '', entete: '' })
  /** Variables texte de la page de garde (`couverture-*`), lues dans le code courant */
  let coverValues = $state({
    titre: '',
    session: '',
    matiere: '',
    duree: '',
    noteFin: '',
  })
  /** Consignes de la page de garde (`couverture-consignes`), lues dans le code courant */
  let coverConsignesValue: string[] = $state([])
  /** Texte du pied de page (`#let pied-page = "..."`), lu dans le code courant */
  let footerValue = $state('')
  /** Nombre de colonnes du document (`#let colonnes`), lu dans le code */
  let documentColumns = $state(1)
  /** Zoom de chaque figure (`#let fig-N-zoom`), lu dans le code courant */
  let figureZoomValues: Record<number, number> = $state({})
  /** Alignement de chaque figure (`#let fig-N-align`), lu dans le code courant */
  let figureAlignValues: Record<number, 'left' | 'center' | 'right'> = $state(
    {},
  )
  /** Exercice dont la modale de réglages (panneau Settings) est ouverte */
  let settingsExerciseIndex: number | null = $state(null)
  const settingsExercise = $derived(
    settingsExerciseIndex !== null
      ? (exercises[settingsExerciseIndex] ?? null)
      : null,
  )
  /** Surcharges de code Typst par exercice (modale d'édition), lues dans le code */
  let codeOverrideValues: Record<number, string> = $state({})
  /** Surcharges de code Typst de la correction par exercice, lues dans le code */
  let codeOverrideCorrectionValues: Record<number, string> = $state({})
  /** Lignes en pointillés réglées par exercice (palette), lues dans le code */
  let writingLinesValues: Record<
    number,
    { position: WritingLinesPosition; count: number; spacing: number }
  > = $state({})
  /** Numéro de l'exercice dont la modale d'édition du code Typst est ouverte */
  let codeEditNum: number | null = $state(null)
  /** Partie éditée par la modale : énoncé ou correction de `codeEditNum` */
  let codeEditPart: 'enonce' | 'correction' = $state('enonce')
  /** Brouillon de la modale d'édition du code Typst */
  let codeEditDraft = $state('')
  /** Surcharges d'énoncé par ligne du tableau « Course aux nombres », lues dans le code */
  let codeOverrideCanValues: Record<number, string> = $state({})
  /** Surcharges de réponse par ligne du tableau « Course aux nombres », lues dans le code */
  let codeOverrideCanReponseValues: Record<number, string> = $state({})
  /** Numéro de ligne (1-based) du tableau « Course aux nombres » dont la modale d'édition est ouverte */
  let canRowEditNum: number | null = $state(null)
  /** Brouillons de la modale d'édition d'une ligne « Course aux nombres » */
  let canRowEditEnonceDraft = $state('')
  let canRowEditReponseDraft = $state('')
  /** Message de confirmation affiché après un clic sur un bouton « Copier » de la modale */
  let codeCopyStatus = $state('')
  let codeCopyStatusTimer: ReturnType<typeof setTimeout>

  /** Copie `text` dans le presse-papier et affiche une confirmation temporaire */
  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      codeCopyStatus = `${label} copié dans le presse-papier.`
    } catch {
      codeCopyStatus =
        'Impossible de copier automatiquement : sélectionnez le texte et copiez-le manuellement.'
    }
    clearTimeout(codeCopyStatusTimer)
    codeCopyStatusTimer = setTimeout(() => {
      codeCopyStatus = ''
    }, 3000)
  }

  /** Copie le brouillon de la modale tel quel, sans préambule */
  function copyExerciseCode() {
    void copyToClipboard(codeEditDraft, 'Le code')
  }

  /**
   * Copie le brouillon de la modale précédé d'un préambule minimal (imports,
   * aides et réglages qu'il utilise réellement) : contrairement au code seul,
   * ce texte compile de façon autonome (`typst compile`), utile pour réutiliser
   * l'exercice dans un autre fichier Typst.
   */
  function copyExerciseCodeWithPreamble(num: number) {
    const carryOver = editorView != null ? harvestCarryOver(currentCode()) : {}
    const standalone = buildStandaloneExerciseCode(
      buildInputs(),
      num,
      documentOptions,
      carryOver,
      codeEditDraft,
      codeEditPart,
    )
    void copyToClipboard(standalone, 'Le code avec préambule')
  }

  /** Convertit les repères (pt, par page) en positions % sur l'aperçu */
  function computeOverlayWidgets(
    anchorList: TypstAnchor[],
    pages: PreviewPageGeometry[],
    viewBox: { width: number; height: number },
  ): OverlayWidget[] {
    if (viewBox.width <= 0 || viewBox.height <= 0) return []
    const widgets: OverlayWidget[] = []
    for (const anchor of anchorList) {
      const page = pages[anchor.page - 1]
      if (page == null) continue
      const isTasks = anchor.kind === 'tasks' || anchor.kind === 'tasks-corr'
      widgets.push({
        kind: isTasks
          ? 'tasks'
          : (anchor.kind as
              | 'exo'
              | 'corr'
              | 'gap'
              | 'header'
              | 'cover'
              | 'footer'
              | 'figure'
              | 'can-row'),
        num: anchor.num,
        // les variables de la correction sont indépendantes de l'énoncé
        target: isTasks
          ? anchor.kind === 'tasks-corr'
            ? `ex${anchor.num}-corr`
            : `ex${anchor.num}`
          : undefined,
        left: (anchor.x / viewBox.width) * 100,
        top: ((page.y + anchor.y) / viewBox.height) * 100,
        // les contrôles des questions vont dans la marge la plus proche :
        // à gauche pour la colonne de gauche, à droite sinon
        side: anchor.x < page.width / 2 ? 'left' : 'right',
      })
    }
    return widgets
  }
  const overlayWidgets = $derived(
    computeOverlayWidgets(anchors, previewPages, previewViewBox),
  )

  /**
   * Relit dans le code les données de la palette : valeurs
   * `#let exN-colonnes`/`#let exN-gutter` (et variantes `-corr`), variables
   * d'en-tête et insertions marquées.
   */
  function refreshTasksLayout(code: string) {
    const values: Record<string, TasksLayoutValue> = {}
    const defaults = (): TasksLayoutValue => ({
      columns: '"auto-fit"',
      gutter: 'interligne-questions',
    })
    for (const match of code.matchAll(
      /^#let (ex\d+(?:-corr)?)-colonnes = (.+?)\s*$/gm,
    )) {
      const value = match[2].trim()
      ;(values[match[1]] ??= defaults()).columns = /^\d+$/.test(value)
        ? Number(value)
        : value
    }
    for (const match of code.matchAll(
      /^#let (ex\d+(?:-corr)?)-gutter = (\S+)/gm,
    )) {
      ;(values[match[1]] ??= defaults()).gutter = match[2]
    }
    tasksLayoutValues = values
    const harvested = harvestCarryOver(code)
    insertionValues = harvested.insertions ?? {}
    insertionCorrectionValues = harvested.insertionsCorrection ?? {}
    mergedExercises = harvested.merges ?? []
    codeOverrideValues = harvested.codeOverrides ?? {}
    codeOverrideCorrectionValues = harvested.codeOverridesCorrection ?? {}
    codeOverrideCanValues = harvested.codeOverridesCan ?? {}
    codeOverrideCanReponseValues = harvested.codeOverridesCanReponse ?? {}
    writingLinesValues = harvested.writingLines ?? {}
    const columns = code.match(/^#let colonnes = (\d+)/m)
    documentColumns = columns != null ? Number(columns[1]) : 1
    const figureZoom: Record<number, number> = {}
    for (const match of code.matchAll(/^#let fig-(\d+)-zoom = ([\d.]+)/gm)) {
      figureZoom[Number(match[1])] = Number(match[2])
    }
    figureZoomValues = figureZoom
    const figureAlign: Record<number, 'left' | 'center' | 'right'> = {}
    for (const match of code.matchAll(
      /^#let fig-(\d+)-align = (left|center|right)/gm,
    )) {
      figureAlign[Number(match[1])] = match[2] as 'left' | 'center' | 'right'
    }
    figureAlignValues = figureAlign
    const header = { titre: '', 'sous-titre': '', entete: '' }
    for (const name of ['titre', 'sous-titre', 'entete'] as const) {
      const match = new RegExp(
        `^#let ${name} = "((?:[^"\\\\]|\\\\.)*)"`,
        'm',
      ).exec(code)
      if (match != null) {
        header[name] = match[1].replace(/\\(.)/g, '$1')
      }
    }
    headerValues = header
    const cover = {
      titre: '',
      session: '',
      matiere: '',
      duree: '',
      noteFin: '',
    }
    // `noteFin` (JS) ↔ `note-fin` (variable Typst, voir `coverDeclarationLines`)
    const coverFieldNames: [keyof typeof cover, string][] = [
      ['titre', 'titre'],
      ['session', 'session'],
      ['matiere', 'matiere'],
      ['duree', 'duree'],
      ['noteFin', 'note-fin'],
    ]
    for (const [jsName, typstName] of coverFieldNames) {
      const match = new RegExp(
        `^#let couverture-${typstName} = "((?:[^"\\\\]|\\\\.)*)"`,
        'm',
      ).exec(code)
      if (match != null) {
        cover[jsName] = match[1].replace(/\\(.)/g, '$1')
      }
    }
    coverValues = cover
    // le tableau tient sur une seule ligne (voir `coverDeclarationLines`) :
    // chaque littéral entre guillemets y est extrait puis déséchappé
    const consignesMatch = /^#let couverture-consignes = \((.*)\)$/m.exec(code)
    coverConsignesValue =
      consignesMatch != null
        ? [...consignesMatch[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) =>
            m[1].replace(/\\(.)/g, '$1'),
          )
        : []
    const footerMatch = /^#let pied-page = "((?:[^"\\]|\\.)*)"/m.exec(code)
    footerValue =
      footerMatch != null ? footerMatch[1].replace(/\\(.)/g, '$1') : ''
  }

  /** Modifie la ligne `#let <prefix>-<clef> = ...` (édition ciblée, annulable) */
  function setTasksVariable(
    target: string,
    key: 'colonnes' | 'gutter',
    value: string,
  ) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const match = new RegExp(`^#let ${target}-${key} = .*$`, 'm').exec(doc)
    if (match == null) return
    dispatchPaletteEdit({
      from: match.index,
      to: match.index + match[0].length,
      insert: `#let ${target}-${key} = ${value}`,
    })
  }

  function adjustColumns(target: string, delta: number) {
    const raw = tasksLayoutValues[target]?.columns ?? '"auto-fit"'
    if (typeof raw !== 'number') {
      if (delta > 0) setTasksVariable(target, 'colonnes', String(1))
      return
    }
    const current = raw
    const next = current + delta
    if (next < 1) {
      setTasksVariable(target, 'colonnes', '"auto-fit"')
      return
    }
    const clamped = Math.min(4, next)
    if (clamped !== current)
      setTasksVariable(target, 'colonnes', String(clamped))
  }

  /** Pas d'ajustement de l'espacement vertical des questions, en em */
  const GUTTER_STEP = 0.25
  function adjustGutter(target: string, delta: number) {
    const raw = tasksLayoutValues[target]?.gutter ?? 'interligne-questions'
    // « interligne-questions » (le défaut global) vaut 1,2 em : le premier
    // clic le remplace par une valeur explicite pour cet exercice
    const current = raw.endsWith('em') ? parseFloat(raw) : 1.2
    const next = Math.max(
      0,
      Math.round((current + delta * GUTTER_STEP) * 100) / 100,
    )
    setTasksVariable(target, 'gutter', `${next}em`)
  }

  /** Pas d'ajustement du zoom d'une figure, et bornes (20 % à 300 %) */
  const FIGURE_ZOOM_STEP = 0.1
  function adjustFigureZoom(figNum: number, delta: number) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const match = new RegExp(`^#let fig-${figNum}-zoom = .*$`, 'm').exec(doc)
    if (match == null) return
    const current = figureZoomValues[figNum] ?? 1
    const next = Math.min(
      3,
      Math.max(
        0.2,
        Math.round((current + delta * FIGURE_ZOOM_STEP) * 100) / 100,
      ),
    )
    dispatchPaletteEdit({
      from: match.index,
      to: match.index + match[0].length,
      insert: `#let fig-${figNum}-zoom = ${next}`,
    })
  }

  /** Alignement d'une figure : gauche, centré ou à droite */
  function setFigureAlign(figNum: number, align: 'left' | 'center' | 'right') {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const match = new RegExp(`^#let fig-${figNum}-align = .*$`, 'm').exec(doc)
    if (match == null) return
    dispatchPaletteEdit({
      from: match.index,
      to: match.index + match[0].length,
      insert: `#let fig-${figNum}-align = ${align}`,
    })
  }

  /**
   * Exercices statiques (annale scannée, éventuellement convertie en `.typ`),
   * par numéro : contenu figé, aucune régénération possible (voir `regenerate`).
   */
  const staticExercises = $derived(
    Object.fromEntries(
      exercises.map((exercise, k) => [
        k + 1,
        exercise?.typeExercice === 'statique',
      ]),
    ) as Record<number, boolean>,
  )

  /**
   * Exercices dont le code Typst n'est pas éditable : exercices statiques
   * sans fichier source `.typ` (`typ: true` absent du référentiel), qui ne
   * sont donc qu'une image scannée (voir `applyTypSourcesForStaticExercises`)
   * — leur icône crayon (« Éditer le code Typst ») est masquée.
   */
  const nonEditableStaticExercises = $derived(
    Object.fromEntries(
      exercises.map((exercise, k) => [
        k + 1,
        exercise?.typeExercice === 'statique' &&
          (exercise.uuid == null ||
            getStaticExerciceTypUrl(exercise.uuid) == null),
      ]),
    ) as Record<number, boolean>,
  )

  /**
   * Exercices dont la correction n'est pas éditable : exercices statiques
   * sans fichier source `_cor.typ` (`typ: true` sans correction rédigée en
   * Typst), qui n'ont donc qu'une correction scannée (image) — leur icône
   * crayon sur la correction est masquée. Un exercice non statique sans
   * correction n'a de toute façon pas de repère `tasks-corr` où l'afficher.
   */
  const nonEditableCorrections = $derived(
    Object.fromEntries(
      exercises.map((exercise, k) => [
        k + 1,
        exercise?.typeExercice === 'statique' &&
          (exercise.uuid == null ||
            getStaticExerciceCorTypUrl(exercise.uuid) == null),
      ]),
    ) as Record<number, boolean>,
  )

  /**
   * Nombre de questions par exercice (null : non réglable), pour la palette.
   * Toujours `null` pour un exercice statique : son nombre de questions est
   * figé par son contenu (image ou `.typ`), pas de génération possible.
   */
  const questionCounts = $derived(
    Object.fromEntries(
      exercises.map((exercise, k) => [
        k + 1,
        exercise?.typeExercice === 'statique'
          ? null
          : (exercise?.nbQuestions ?? null),
      ]),
    ) as Record<number, number | null>,
  )

  /** Change le nombre de questions de l'exercice num et régénère le code */
  function changeQuestionCount(num: number, delta: number) {
    const exercise = exercises[num - 1]
    if (exercise?.nbQuestions == null) return
    const next = Math.max(1, exercise.nbQuestions + delta)
    if (next === exercise.nbQuestions || !confirmOverwrite()) return
    // fige le contenu courant : les questions déjà affichées gardent leurs
    // valeurs (la régénération avec un autre nbQuestions rebrasse les tirages)
    const current = buildInputs()[num - 1]
    if (current.warning == null) {
      frozenInputs.set(exercise, {
        intro: current.intro,
        introCorrection: current.introCorrection,
        questions: current.questions,
        corrections: current.corrections,
        canQuestions: current.canQuestions ?? [],
        canAnswers: current.canAnswers ?? [],
      })
    }
    exercise.nbQuestions = next
    const params = get(exercicesParams)
    if (params[num - 1] != null) params[num - 1].nbQuestions = next
    exercicesParams.update((list) => list)
    exercises = exercises
    const code = buildCode()
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  /**
   * Décale les réglages de la palette après la suppression de l'exercice
   * `removed` : `ex3` devient `ex2`, etc. Les insertions qui suivaient
   * l'exercice supprimé sont rattachées au repère précédent.
   */
  function shiftCarryOver(
    carryOver: ReturnType<typeof harvestCarryOver>,
    removed: number,
  ): ReturnType<typeof harvestCarryOver> {
    const tasksLayout: NonNullable<typeof carryOver.tasksLayout> = {}
    for (const [prefix, layout] of Object.entries(
      carryOver.tasksLayout ?? {},
    )) {
      const match = prefix.match(/^ex(\d+)(-corr)?$/)
      if (match == null) continue
      const n = Number(match[1])
      if (n === removed) continue
      tasksLayout[n > removed ? `ex${n - 1}${match[2] ?? ''}` : prefix] = layout
    }
    const insertions: NonNullable<typeof carryOver.insertions> = {}
    for (const [key, lines] of Object.entries(carryOver.insertions ?? {})) {
      const n = Number(key)
      const target = n >= removed ? Math.max(0, n - 1) : n
      insertions[target] = [...(insertions[target] ?? []), ...lines]
    }
    // l'exercice supprimé ne peut plus être fusionné ; les suivants décalent
    const merges = (carryOver.merges ?? [])
      .filter((n) => n !== removed)
      .map((n) => (n > removed ? n - 1 : n))
    const codeOverrides: NonNullable<typeof carryOver.codeOverrides> = {}
    for (const [key, value] of Object.entries(carryOver.codeOverrides ?? {})) {
      const n = Number(key)
      if (n === removed) continue
      codeOverrides[n > removed ? n - 1 : n] = value
    }
    const codeOverridesCorrection: NonNullable<
      typeof carryOver.codeOverridesCorrection
    > = {}
    for (const [key, value] of Object.entries(
      carryOver.codeOverridesCorrection ?? {},
    )) {
      const n = Number(key)
      if (n === removed) continue
      codeOverridesCorrection[n > removed ? n - 1 : n] = value
    }
    const insertionsCorrection: NonNullable<
      typeof carryOver.insertionsCorrection
    > = {}
    for (const [key, value] of Object.entries(
      carryOver.insertionsCorrection ?? {},
    )) {
      const n = Number(key)
      if (n === removed) continue
      insertionsCorrection[n > removed ? n - 1 : n] = value
    }
    const writingLines: NonNullable<typeof carryOver.writingLines> = {}
    for (const [key, value] of Object.entries(carryOver.writingLines ?? {})) {
      const n = Number(key)
      if (n === removed) continue
      writingLines[n > removed ? n - 1 : n] = value
    }
    return {
      tasksLayout,
      insertions,
      insertionsCorrection,
      merges,
      codeOverrides,
      codeOverridesCorrection,
      // surcharges de ligne « Course aux nombres » (par numéro de ligne, pas
      // d'exercice) : pas renumérotées ici, faute de connaître le nombre de
      // questions retirées avec l'exercice — conservées telles quelles pour
      // ne pas perdre le travail du professeur, au prix d'un décalage
      // possible si l'exercice supprimé contribuait plusieurs lignes.
      codeOverridesCan: carryOver.codeOverridesCan ?? {},
      codeOverridesCanReponse: carryOver.codeOverridesCanReponse ?? {},
      writingLines,
    }
  }

  /** Retire l'exercice num de la fiche et régénère le code */
  function deleteExercise(num: number) {
    if (!window.confirm(`Supprimer l'exercice ${num} de la fiche ?`)) return
    const carryOver =
      editorView != null
        ? shiftCarryOver(harvestCarryOver(currentCode()), num)
        : {}
    const exercise = exercises[num - 1]
    exercise?.reinit?.()
    exercise?.destroy?.()
    exercises = exercises.filter((_, k) => k !== num - 1)
    exercicesParams.update((list) => list.filter((_, k) => k !== num - 1))
    const code = buildTypstDocument(
      buildInputs(),
      documentOptions,
      carryOver,
      [],
      {
        sourceUrl: currentUrl(),
        extraPreamble: extraPreamble(),
      },
    )
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  /** Modale « Ajouter un exercice » (navigation dans les référentiels) */
  let isAddExerciseOpen = $state(false)

  /**
   * Ouvre la modale d'ajout. Pas de confirmation ici (contrairement aux
   * autres actions qui régénèrent le code) : comme `deleteExercise`, ajouter
   * un exercice est un geste déjà délibéré (plusieurs clics dans la modale),
   * et le bloquer derrière l'avertissement générique « le code Typst a été
   * modifié » forcerait à choisir entre perdre ses modifications et ne
   * jamais pouvoir ajouter d'exercice tant que le code a été retouché à la
   * main.
   */
  function openAddExercise() {
    isAddExerciseOpen = true
  }

  /**
   * Ajoute une ressource à la fin de la fiche : ses paramètres rejoignent
   * `exercicesParams` (donc l'URL) et son contenu est généré comme les autres.
   * Les réglages de la palette ne bougent pas — le nouvel exercice s'ajoute
   * après le dernier, aucun numéro existant n'est décalé.
   * @param {InterfaceParams} params paramètres de l'exercice choisi
   */
  async function addExerciseToSheet(params: InterfaceParams) {
    exercicesParams.update((list) => [...list, params])
    let exercise: IExercice | null = null
    try {
      exercise = await buildExercise(params)
      // la vue Typst n'affiche jamais les exercices en mode interactif
      exercise.interactif = false
    } catch {
      // exercice non chargeable : buildInputs signalera l'avertissement
      exercise = null
    }
    exercises = [...exercises, exercise]
    await applyTypSourcesForStaticExercises()
    await prefetchStaticImages()
    const code = buildCode()
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  /**
   * Échange les réglages de la palette (colonnes/espacement des questions,
   * insertions) entre les exercices `numA` et `numB` : ce que le professeur
   * avait réglé « pour cet exercice » le suit quand il change de position.
   */
  function swapCarryOver(
    carryOver: ReturnType<typeof harvestCarryOver>,
    numA: number,
    numB: number,
  ): ReturnType<typeof harvestCarryOver> {
    const swapNum = (n: number) => (n === numA ? numB : n === numB ? numA : n)
    const tasksLayout: NonNullable<typeof carryOver.tasksLayout> = {}
    for (const [prefix, layout] of Object.entries(
      carryOver.tasksLayout ?? {},
    )) {
      const match = prefix.match(/^ex(\d+)(-corr)?$/)
      if (match == null) continue
      tasksLayout[`ex${swapNum(Number(match[1]))}${match[2] ?? ''}`] = layout
    }
    const insertions: NonNullable<typeof carryOver.insertions> = {}
    for (const [key, lines] of Object.entries(carryOver.insertions ?? {})) {
      // le repère de gap `g` précède l'exercice `g + 1`
      const newGap = swapNum(Number(key) + 1) - 1
      insertions[newGap] = [...(insertions[newGap] ?? []), ...lines]
    }
    const merges = (carryOver.merges ?? []).map(swapNum)
    const codeOverrides: NonNullable<typeof carryOver.codeOverrides> = {}
    for (const [key, value] of Object.entries(carryOver.codeOverrides ?? {})) {
      codeOverrides[swapNum(Number(key))] = value
    }
    const codeOverridesCorrection: NonNullable<
      typeof carryOver.codeOverridesCorrection
    > = {}
    for (const [key, value] of Object.entries(
      carryOver.codeOverridesCorrection ?? {},
    )) {
      codeOverridesCorrection[swapNum(Number(key))] = value
    }
    const insertionsCorrection: NonNullable<
      typeof carryOver.insertionsCorrection
    > = {}
    for (const [key, value] of Object.entries(
      carryOver.insertionsCorrection ?? {},
    )) {
      insertionsCorrection[swapNum(Number(key))] = value
    }
    const writingLines: NonNullable<typeof carryOver.writingLines> = {}
    for (const [key, value] of Object.entries(carryOver.writingLines ?? {})) {
      writingLines[swapNum(Number(key))] = value
    }
    return {
      tasksLayout,
      insertions,
      insertionsCorrection,
      merges,
      codeOverrides,
      codeOverridesCorrection,
      // surcharges de ligne « Course aux nombres » : voir le même
      // commentaire dans `shiftCarryOver` (pas renumérotées, conservées
      // telles quelles).
      codeOverridesCan: carryOver.codeOverridesCan ?? {},
      codeOverridesCanReponse: carryOver.codeOverridesCanReponse ?? {},
      writingLines,
    }
  }

  /** Échange l'exercice num avec son voisin (delta : -1 monter, 1 descendre) */
  function moveExercise(num: number, delta: -1 | 1) {
    const k = num - 1
    const target = k + delta
    if (target < 0 || target >= exercises.length) return
    if (!confirmOverwrite()) return
    const carryOver =
      editorView != null
        ? swapCarryOver(harvestCarryOver(currentCode()), k + 1, target + 1)
        : {}
    const newExercises = [...exercises]
    ;[newExercises[k], newExercises[target]] = [
      newExercises[target],
      newExercises[k],
    ]
    exercises = newExercises
    exercicesParams.update((list) => {
      const copy = [...list]
      ;[copy[k], copy[target]] = [copy[target], copy[k]]
      return copy
    })
    const code = buildTypstDocument(
      buildInputs(),
      documentOptions,
      carryOver,
      [],
      {
        sourceUrl: currentUrl(),
        extraPreamble: extraPreamble(),
      },
    )
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  /** Nouvelle graine pour l'exercice d'indice k (sans régénérer le code) */
  function applyNewSeedTo(k: number) {
    const exercise = exercises[k]
    if (exercise == null) return
    // regenerate() (via seedrandom(..., { global: true })) laisse Math.random
    // verrouillé sur la graine du dernier exercice régénéré : sans ce
    // réamorçage sur de l'entropie réelle, le tirage de la nouvelle graine
    // serait déterministe et se figerait au bout de quelques clics.
    seedrandom(undefined, { global: true })
    exercise.seed = undefined
    if (typeof exercise.applyNewSeed === 'function') exercise.applyNewSeed()
    const params = get(exercicesParams)[k]
    if (params != null && exercise.seed !== undefined) {
      params.alea = exercise.seed
    }
    frozenInputs.delete(exercise)
  }

  /** Nouvelles données aléatoires pour l'exercice num */
  function newDataForExercise(num: number) {
    if (!confirmOverwrite()) return
    applyNewSeedTo(num - 1)
    exercicesParams.update((list) => list)
    const code = buildCode()
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  function openSettings(num: number) {
    settingsExerciseIndex = num - 1
  }

  /**
   * Ouvre la modale d'édition du code Typst de l'exercice num, préremplie
   * avec sa surcharge existante ou, à défaut, le code actuellement généré
   * pour cet exercice (voir `getGeneratedExerciseCode`).
   */
  function openCodeEdit(num: number) {
    const carryOver = editorView != null ? harvestCarryOver(currentCode()) : {}
    codeEditDraft =
      carryOver.codeOverrides?.[num] ??
      getGeneratedExerciseCode(buildInputs(), num, documentOptions, carryOver)
    codeEditPart = 'enonce'
    codeEditNum = num
  }

  /**
   * Ouvre la modale d'édition du code Typst de la correction de l'exercice
   * num, préremplie avec sa surcharge existante ou, à défaut, le code
   * actuellement généré pour cette correction (voir `getGeneratedCorrectionCode`).
   * Pendant de `openCodeEdit` pour la correction plutôt que l'énoncé.
   */
  function openCorrectionCodeEdit(num: number) {
    const carryOver = editorView != null ? harvestCarryOver(currentCode()) : {}
    codeEditDraft =
      carryOver.codeOverridesCorrection?.[num] ??
      getGeneratedCorrectionCode(buildInputs(), num, documentOptions, carryOver)
    codeEditPart = 'correction'
    codeEditNum = num
  }

  /**
   * Retire la surcharge de l'exercice num (énoncé ou correction, selon
   * `codeEditPart`) : son contenu redevient celui généré automatiquement
   * (icône crayon désactivée, « Nouvelles données » de nouveau opérant sur
   * son contenu). Contrairement au brouillon de la modale, une surcharge
   * n'est un texte figé que tant qu'elle existe : la restaurer doit donc
   * réellement la supprimer, pas seulement préremplir le brouillon avec un
   * instantané du texte généré.
   */
  function restoreGeneratedCode(num: number) {
    updateExerciseCode(num, '', codeEditPart)
  }

  /**
   * Applique (ou retire, si `code` est vide) la surcharge de code Typst
   * (énoncé ou correction, selon `part`) de l'exercice num, saisie dans la
   * modale d'édition. Régénère le document (comme suppression/déplacement/
   * fusion) : la surcharge change la structure du code (elle remplace le
   * contenu généré), un simple patch de texte comme pour les insertions ne
   * suffit pas.
   */
  function updateExerciseCode(
    num: number,
    code: string,
    part: 'enonce' | 'correction' = 'enonce',
  ) {
    if (!confirmOverwrite()) return
    const carryOver = editorView != null ? harvestCarryOver(currentCode()) : {}
    const trimmed = code.trim()
    if (part === 'correction') {
      const codeOverridesCorrection = {
        ...(carryOver.codeOverridesCorrection ?? {}),
      }
      if (trimmed.length === 0) delete codeOverridesCorrection[num]
      else codeOverridesCorrection[num] = code
      carryOver.codeOverridesCorrection = codeOverridesCorrection
    } else {
      const codeOverrides = { ...(carryOver.codeOverrides ?? {}) }
      if (trimmed.length === 0) delete codeOverrides[num]
      else codeOverrides[num] = code
      carryOver.codeOverrides = codeOverrides
    }
    const [primary, ...extraVersions] = buildAllVersionInputs()
    const newCode = buildTypstDocument(
      primary,
      documentOptions,
      carryOver,
      extraVersions,
      { sourceUrl: currentUrl(), extraPreamble: extraPreamble() },
    )
    setEditorContent(newCode)
    scheduleCompile(newCode, 0)
    codeEditNum = null
  }

  /**
   * Ouvre la modale d'édition d'une ligne du tableau « Course aux nombres »
   * (énoncé et réponse), préremplie avec ses surcharges existantes ou, à
   * défaut, le contenu actuellement généré pour cette ligne (voir
   * `getGeneratedCanRowCode`). Pendant de `openCodeEdit`, à l'échelle d'une
   * ligne plutôt que d'un exercice entier.
   */
  function openCanRowCodeEdit(row: number) {
    const carryOver = editorView != null ? harvestCarryOver(currentCode()) : {}
    const generated =
      carryOver.codeOverridesCan?.[row] == null ||
      carryOver.codeOverridesCanReponse?.[row] == null
        ? getGeneratedCanRowCode(buildInputs(), row, documentOptions)
        : null
    canRowEditEnonceDraft =
      carryOver.codeOverridesCan?.[row] ?? generated?.enonce ?? ''
    canRowEditReponseDraft =
      carryOver.codeOverridesCanReponse?.[row] ?? generated?.reponse ?? ''
    canRowEditNum = row
  }

  /**
   * Retire les surcharges (énoncé et réponse) de la ligne `row` : son contenu
   * redevient celui généré automatiquement. Pendant de `restoreGeneratedCode`.
   */
  function restoreCanRowCode(row: number) {
    updateCanRowCode(row, '', '')
  }

  /**
   * Applique (ou retire, si vide) les surcharges d'énoncé et de réponse de
   * la ligne `row` du tableau « Course aux nombres », saisies dans la
   * modale d'édition. Pendant de `updateExerciseCode`, à l'échelle d'une
   * ligne : les deux moitiés (énoncé/réponse) sont réglées ensemble, chacune
   * indépendamment retirée si son champ a été vidé.
   */
  function updateCanRowCode(row: number, enonce: string, reponse: string) {
    if (!confirmOverwrite()) return
    const carryOver = editorView != null ? harvestCarryOver(currentCode()) : {}
    const codeOverridesCan = { ...(carryOver.codeOverridesCan ?? {}) }
    if (enonce.trim().length === 0) delete codeOverridesCan[row]
    else codeOverridesCan[row] = enonce
    carryOver.codeOverridesCan = codeOverridesCan
    const codeOverridesCanReponse = {
      ...(carryOver.codeOverridesCanReponse ?? {}),
    }
    if (reponse.trim().length === 0) delete codeOverridesCanReponse[row]
    else codeOverridesCanReponse[row] = reponse
    carryOver.codeOverridesCanReponse = codeOverridesCanReponse
    const [primary, ...extraVersions] = buildAllVersionInputs()
    const newCode = buildTypstDocument(
      primary,
      documentOptions,
      carryOver,
      extraVersions,
      { sourceUrl: currentUrl(), extraPreamble: extraPreamble() },
    )
    setEditorContent(newCode)
    scheduleCompile(newCode, 0)
    canRowEditNum = null
  }

  /**
   * Fusionne/sépare l'exercice num avec celui qui le précède : ils partagent
   * alors un seul titre (banque exercise-bank) et la numérotation de ses
   * questions continue celle de son prédécesseur. Régénère le code (comme
   * suppression/déplacement) plutôt que d'éditer le texte : la fusion
   * change la structure du document (les deux exercices rejoignent la même
   * définition `exo.with(...)`).
   */
  function toggleMergeBefore(num: number) {
    if (!confirmOverwrite()) return
    const carryOver = editorView != null ? harvestCarryOver(currentCode()) : {}
    const merges = carryOver.merges ?? []
    carryOver.merges = merges.includes(num)
      ? merges.filter((n) => n !== num)
      : [...merges, num]
    const [primary, ...extraVersions] = buildAllVersionInputs()
    const code = buildTypstDocument(
      primary,
      documentOptions,
      carryOver,
      extraVersions,
      { sourceUrl: currentUrl(), extraPreamble: extraPreamble() },
    )
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  /**
   * Règle (ou retire, `value` null) les lignes en pointillés de l'exercice
   * num. Régénère le code (comme la fusion) plutôt que d'éditer le texte :
   * le passage à « après chaque question » change la structure du document
   * (les appels s'intercalent après chaque item de la liste `tasks`).
   */
  function setWritingLines(
    num: number,
    value: {
      position: WritingLinesPosition
      count: number
      spacing: number
    } | null,
  ) {
    if (!confirmOverwrite()) return
    const carryOver = editorView != null ? harvestCarryOver(currentCode()) : {}
    const writingLines = { ...(carryOver.writingLines ?? {}) }
    if (value == null) delete writingLines[num]
    else writingLines[num] = value
    carryOver.writingLines = writingLines
    const [primary, ...extraVersions] = buildAllVersionInputs()
    const code = buildTypstDocument(
      primary,
      documentOptions,
      carryOver,
      extraVersions,
      { sourceUrl: currentUrl(), extraPreamble: extraPreamble() },
    )
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  /** Applique les réglages émis par le panneau Settings de la vue prof */
  function applyNewSettings(k: number, detail: Record<string, unknown>) {
    const exercise = exercises[k]
    const params = get(exercicesParams)[k]
    if (exercise == null || params == null) return
    if (!confirmOverwrite()) return
    applyExerciceSettings(exercise, params, detail)
    exercicesParams.update((list) => list)
    frozenInputs.delete(exercise)
    const code = buildCode()
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  /**
   * Modifie une variable d'en-tête (`#let titre = "..."`) dans le code et
   * reporte la valeur dans les réglages persistés (elle survit ainsi à une
   * régénération).
   */
  function updateHeaderValue(
    name: 'titre' | 'sous-titre' | 'entete',
    value: string,
  ) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const match = new RegExp(`^#let ${name} = ".*"`, 'm').exec(doc)
    if (match == null) return
    const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    dispatchPaletteEdit({
      from: match.index,
      to: match.index + match[0].length,
      insert: `#let ${name} = "${escaped}"`,
    })
    if (name === 'titre') documentOptions.title = value
    else if (name === 'sous-titre') documentOptions.subtitle = value
    else documentOptions.headerLine = value
    persistPreferences()
  }

  /** Échappe une chaîne pour l'inscrire dans un littéral Typst `"..."` */
  function escapeTypstStringLiteral(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  }

  /**
   * Modifie une variable texte de la page de garde (`#let couverture-titre =
   * "..."`…) dans le code et reporte la valeur dans les réglages persistés —
   * même mécanisme que `updateHeaderValue`, édition ciblée sans régénération.
   */
  function updateCoverValue(
    name: 'titre' | 'session' | 'matiere' | 'duree' | 'noteFin',
    value: string,
  ) {
    if (editorView == null) return
    // `noteFin` (JS) ↔ `note-fin` (variable Typst, voir `coverDeclarationLines`)
    const typstName = name === 'noteFin' ? 'note-fin' : name
    const doc = editorView.state.doc.toString()
    const match = new RegExp(`^#let couverture-${typstName} = ".*"`, 'm').exec(
      doc,
    )
    if (match == null) return
    dispatchPaletteEdit({
      from: match.index,
      to: match.index + match[0].length,
      insert: `#let couverture-${typstName} = "${escapeTypstStringLiteral(value)}"`,
    })
    documentOptions.coverPage[name] = value
    persistPreferences()
  }

  /**
   * Pendant de `updateCoverValue` pour les consignes (`#let
   * couverture-consignes = (...)`) : la liste est réémise sur une seule
   * ligne, comme `coverDeclarationLines` (`buildTypstDocument.ts`) le fait à
   * la génération — un tableau d'un seul élément exige la virgule finale.
   */
  function updateCoverConsignes(consignes: string[]) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const match = /^#let couverture-consignes = \(.*\)$/m.exec(doc)
    if (match == null) return
    const items = consignes.map(
      (ligne) => `"${escapeTypstStringLiteral(ligne)}"`,
    )
    const literal =
      items.length === 0
        ? '()'
        : items.length === 1
          ? `(${items[0]},)`
          : `(${items.join(', ')})`
    dispatchPaletteEdit({
      from: match.index,
      to: match.index + match[0].length,
      insert: `#let couverture-consignes = ${literal}`,
    })
    documentOptions.coverPage.consignes = consignes
    persistPreferences()
  }

  /**
   * Modifie le texte du pied de page (`#let pied-page = "..."`) — même
   * mécanisme que `updateHeaderValue`/`updateCoverValue`, édition ciblée
   * sans régénération. Réglé sur l'aperçu (icône sur le pied de page de la
   * première page) plutôt que dans le volet : contrairement au titre et à la
   * page de garde, le pied de page se répète sur chaque page, sans second
   * réglage à synchroniser.
   */
  function updateFooterText(value: string) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const match = /^#let pied-page = ".*"/m.exec(doc)
    if (match == null) return
    dispatchPaletteEdit({
      from: match.index,
      to: match.index + match[0].length,
      insert: `#let pied-page = "${escapeTypstStringLiteral(value)}"`,
    })
    documentOptions.footerText = value
    persistPreferences()
  }

  /** Repère de gap `num` dans le code (indentation et fin de sa ligne) */
  function findGapAnchor(
    doc: string,
    num: number,
  ): { indent: string; lineEnd: number } | null {
    const match = new RegExp(
      `^([ \\t]*)#mathalea-anchor\\("gap", ${num}\\).*$`,
      'm',
    ).exec(doc)
    if (match == null) return null
    return { indent: match[1], lineEnd: match.index + match[0].length }
  }

  /**
   * Bornes de la ligne de la `index`-ième insertion qui suit le repère de
   * gap `num` (sans son saut de ligne initial). La recherche s'arrête au
   * repère suivant.
   */
  function findInsertionLine(
    doc: string,
    num: number,
    index: number,
  ): { from: number; to: number } | null {
    const anchor = findGapAnchor(doc, num)
    if (anchor == null) return null
    let offset = anchor.lineEnd
    let count = 0
    while (offset < doc.length) {
      const from = offset + 1 // saute le saut de ligne
      let to = doc.indexOf('\n', from)
      if (to === -1) to = doc.length
      const line = doc.slice(from, to)
      if (line.includes('#mathalea-anchor(')) return null
      if (/\/\/ mathalea:insertion\s*$/.test(line)) {
        if (count === index) return { from, to }
        count++
      }
      offset = to
    }
    return null
  }

  /** Insère un fragment (texte, #section[...]) juste après l'exercice num */
  function insertAfterExercise(num: number, snippet: string) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const anchor = findGapAnchor(doc, num)
    if (anchor == null) return
    // la nouvelle ligne s'ajoute après les insertions déjà présentes
    // (leur ordre d'affichage est conservé)
    let insertAt = anchor.lineEnd
    let offset = anchor.lineEnd
    while (offset < doc.length) {
      const from = offset + 1
      let to = doc.indexOf('\n', from)
      if (to === -1) to = doc.length
      const line = doc.slice(from, to)
      if (line.includes('#mathalea-anchor(')) break
      if (/\/\/ mathalea:insertion\s*$/.test(line)) insertAt = to
      else if (line.trim().length > 0) break
      offset = to
    }
    dispatchPaletteEdit({
      from: insertAt,
      insert: `\n${anchor.indent}${snippet} ${INSERTION_TAG}`,
    })
  }

  /** Remplace la `index`-ième insertion qui suit l'exercice num */
  function updateInsertion(num: number, index: number, snippet: string) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const line = findInsertionLine(doc, num, index)
    if (line == null) return
    const indent = doc.slice(line.from, line.to).match(/^[ \t]*/)?.[0] ?? ''
    dispatchPaletteEdit({
      from: line.from,
      to: line.to,
      insert: `${indent}${snippet} ${INSERTION_TAG}`,
    })
  }

  /** Supprime la `index`-ième insertion qui suit l'exercice num */
  function deleteInsertion(num: number, index: number) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const line = findInsertionLine(doc, num, index)
    if (line == null) return
    // la ligne entière disparaît, saut de ligne précédent compris
    dispatchPaletteEdit({ from: line.from - 1, to: line.to, insert: '' })
  }

  /** Repère `corr` de l'exercice num dans le code (indentation et fin de sa ligne) */
  function findCorrAnchor(
    doc: string,
    num: number,
  ): { indent: string; lineEnd: number } | null {
    const match = new RegExp(
      `^([ \\t]*)#mathalea-anchor\\("corr", ${num}\\).*$`,
      'm',
    ).exec(doc)
    if (match == null) return null
    return { indent: match[1], lineEnd: match.index + match[0].length }
  }

  /**
   * Bornes de la ligne de la `index`-ième insertion qui précède la
   * correction de l'exercice num (sans son saut de ligne initial). Pendant
   * de `findInsertionLine` pour le repère `corr`.
   */
  function findInsertionCorrectionLine(
    doc: string,
    num: number,
    index: number,
  ): { from: number; to: number } | null {
    const anchor = findCorrAnchor(doc, num)
    if (anchor == null) return null
    let offset = anchor.lineEnd
    let count = 0
    while (offset < doc.length) {
      const from = offset + 1
      let to = doc.indexOf('\n', from)
      if (to === -1) to = doc.length
      const line = doc.slice(from, to)
      if (line.includes('#mathalea-anchor(')) return null
      if (/\/\/ mathalea:insertion-corr\s*$/.test(line)) {
        if (count === index) return { from, to }
        count++
      }
      offset = to
    }
    return null
  }

  /** Insère un fragment (texte, #section[...]) juste avant la correction de l'exercice num */
  function insertBeforeCorrection(num: number, snippet: string) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const anchor = findCorrAnchor(doc, num)
    if (anchor == null) return
    // la nouvelle ligne s'ajoute après les insertions déjà présentes
    // (leur ordre d'affichage est conservé)
    let insertAt = anchor.lineEnd
    let offset = anchor.lineEnd
    while (offset < doc.length) {
      const from = offset + 1
      let to = doc.indexOf('\n', from)
      if (to === -1) to = doc.length
      const line = doc.slice(from, to)
      if (line.includes('#mathalea-anchor(')) break
      if (/\/\/ mathalea:insertion-corr\s*$/.test(line)) insertAt = to
      else if (line.trim().length > 0) break
      offset = to
    }
    dispatchPaletteEdit({
      from: insertAt,
      insert: `\n${anchor.indent}${snippet} ${INSERTION_CORRECTION_TAG}`,
    })
  }

  /** Remplace la `index`-ième insertion qui précède la correction de l'exercice num */
  function updateInsertionCorrection(
    num: number,
    index: number,
    snippet: string,
  ) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const line = findInsertionCorrectionLine(doc, num, index)
    if (line == null) return
    const indent = doc.slice(line.from, line.to).match(/^[ \t]*/)?.[0] ?? ''
    dispatchPaletteEdit({
      from: line.from,
      to: line.to,
      insert: `${indent}${snippet} ${INSERTION_CORRECTION_TAG}`,
    })
  }

  /** Supprime la `index`-ième insertion qui précède la correction de l'exercice num */
  function deleteInsertionCorrection(num: number, index: number) {
    if (editorView == null) return
    const doc = editorView.state.doc.toString()
    const line = findInsertionCorrectionLine(doc, num, index)
    if (line == null) return
    dispatchPaletteEdit({ from: line.from - 1, to: line.to, insert: '' })
  }

  function persistPreferences() {
    persistToUrl()
    if (!isLocalStorageAvailable()) return
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ displayMode, documentOptions, showOverlay }),
      )
    } catch {
      // stockage plein ou indisponible : sans conséquence
    }
  }

  /** Dernière valeur écrite dans `typstParam` (évite les réécritures inutiles) */
  let lastTypstParam = typstUrlParam ?? ''

  /**
   * Sauvegarde dans l'URL (`typstParam`) tous les réglages du document et de
   * la mise en page (colonnes/espacement des questions, textes et sections
   * insérés, sauts de page/colonne, fusions, zoom/alignement des figures) pour
   * pouvoir recharger la fiche à l'identique. La liste des exercices, leurs
   * graines et leurs réglages sont déjà portés par l'URL (`exercicesParams`).
   */
  function persistToUrl() {
    const carryOver =
      editorView != null
        ? harvestCarryOver(currentCode())
        : (urlCarryOver ?? {})
    const encoded = encodeBase64({ options: documentOptions, carryOver })
    // le store est la source de vérité ; on redéclenche ensuite l'écrivain
    // d'URL de l'app pour que sa prochaine écriture (débouncée) reparte de
    // cette valeur et ne réécrive pas l'URL sans typstParam (comme la vue A4)
    typstParamStore.set(encoded)
    mathaleaUpdateUrlFromExercicesParams()
    if (encoded === lastTypstParam) return
    lastTypstParam = encoded
    // l'URL est bloquée dans un iframe (recorder Capytale/Moodle…)
    if (get(freezeUrl)) return
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('typstParam', encoded)
      window.history.replaceState(null, '', url)
    } catch {
      // URL non modifiable (iframe sandboxée…) : sans conséquence
    }
  }

  function setDisplayMode(mode: DisplayMode) {
    displayMode = mode
    // le bouton Réglages n'existe qu'en Aperçu : on y revient toujours avec
    // le volet ouvert, et il reste fermé (masqué) dans les deux autres modes
    isSettingsOpen = mode === 'preview'
    persistPreferences()
  }

  /** Regénère le code à partir des réglages du document (interligne...) */
  function applyDocumentOptions() {
    persistPreferences()
    const code = buildCode()
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  function resetDocumentOptions() {
    documentOptions = { ...defaultTypstDocumentOptions }
    persistPreferences()
    // réinitialisation complète : les réglages de la palette de mise en page
    // (colonnes/espacement par exercice, insertions) ne sont pas repris
    const code = buildTypstDocument(buildInputs(), documentOptions, {}, [], {
      sourceUrl: currentUrl(),
      extraPreamble: extraPreamble(),
    })
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  /** Regénère le contenu (listeQuestions, listeCorrections...) de l'exercice k */
  function regenerate(k: number) {
    const exercise = exercises[k]
    if (exercise == null) return
    exercise.numeroExercice = k
    if (
      exercise.seed === undefined &&
      typeof exercise.applyNewSeed === 'function'
    ) {
      exercise.applyNewSeed()
    }
    seedrandom(exercise.seed, { global: true })
    if (exercise.typeExercice === 'statique') {
      // Contenu figé (images/texte fixes) : rien à régénérer.
      return
    }
    context.isTypst = true
    try {
      if (exercise.typeExercice === 'simple') {
        mathaleaHandleExerciceSimple(exercise, false, k)
      } else if (typeof exercise.nouvelleVersionWrapper === 'function') {
        exercise.nouvelleVersionWrapper(k)
      }
    } finally {
      context.isTypst = false
    }
  }

  /**
   * Contenu figé des exercices dont le nombre de questions a été changé via
   * la palette : régénérer un exercice avec un autre `nbQuestions` rebrasse
   * toutes ses valeurs (mêmes graines, tirages décalés). Les questions déjà
   * affichées sont donc figées ; seules les questions ajoutées prennent le
   * contenu fraîchement généré. Vidé par « Nouvelles données ».
   */
  const frozenInputs = new Map<
    IExercice,
    {
      intro: string
      introCorrection: string
      questions: string[]
      corrections: string[]
      /** Énoncés et réponses du tableau « Course aux nombres » */
      canQuestions: string[]
      canAnswers: string[]
    }
  >()

  /**
   * Lien vers l'exercice seul sur MathALÉA (réglages et graine inclus),
   * encodé dans le QR-code. Mêmes paramètres que la sortie LaTeX.
   */
  function exerciceUrl(exercise: IExercice): string {
    const url = new URL('https://coopmaths.fr/alea')
    url.searchParams.append('uuid', String(exercise.uuid))
    if (exercise.id !== undefined) url.searchParams.append('id', exercise.id)
    if (exercise.nbQuestions !== undefined) {
      url.searchParams.append('n', exercise.nbQuestions.toString())
    }
    if (exercise.duration !== undefined) {
      url.searchParams.append('d', exercise.duration.toString())
    }
    if (exercise.sup !== undefined)
      url.searchParams.append('s', String(exercise.sup))
    if (exercise.sup2 !== undefined)
      url.searchParams.append('s2', String(exercise.sup2))
    if (exercise.sup3 !== undefined)
      url.searchParams.append('s3', String(exercise.sup3))
    if (exercise.sup4 !== undefined)
      url.searchParams.append('s4', String(exercise.sup4))
    if (exercise.sup5 !== undefined)
      url.searchParams.append('s5', String(exercise.sup5))
    if (exercise.seed !== undefined)
      url.searchParams.append('alea', exercise.seed)
    if (exercise.correctionDetaillee !== undefined) {
      url.searchParams.append('cd', exercise.correctionDetaillee ? '1' : '0')
    }
    if (exercise.nbCols !== undefined) {
      url.searchParams.append('cols', exercise.nbCols.toString())
    }
    // vue élève, sans réglages affichés (comme le QR-code de la sortie LaTeX)
    url.searchParams.append('v', 'eleve')
    url.searchParams.append('es', '0211')
    return url.href
  }

  /** Contenu HTML (avec formules `$...$`) de chaque exercice */
  function buildInputs(): TypstExerciseInput[] {
    const params = get(exercicesParams)
    return exercises.map((exercise, k) => {
      const input: TypstExerciseInput = {
        // un exercice statique n'a pas d'id de référentiel de compétences :
        // sa référence affichée (réglage « Afficher la référence des
        // exercices ») est alors son titre (ex. « DNB Juin 2026... Ex 1 »)
        ref:
          exercise?.typeExercice === 'statique'
            ? (exercise.titre ?? '')
            : (params[k]?.id ?? ''),
        intro: '',
        questions: [],
        introCorrection: '',
        corrections: [],
        numbered: false,
      }
      if (exercise == null) {
        input.warning =
          "Cet exercice n'a pas pu être chargé : il n'est pas pris en charge par la vue Typst."
        return input
      }
      if (
        exercise.typeExercice != null &&
        exercise.typeExercice.includes('html')
      ) {
        input.warning = `${exercise.titre} : cet exercice n'existe qu'en version interactive, il ne peut pas être exporté.`
        return input
      }
      regenerate(k)
      input.url = exerciceUrl(exercise)
      input.intro = mathaleaFormatExercice(
        [exercise.consigne, exercise.introduction]
          .filter((text) => text != null && text.length > 0)
          .join('<br>'),
      )
      const format = (text: string) =>
        mathaleaFormatExercice(text).replaceAll('{zoomFactor}', '1')
      input.questions = (exercise.listeQuestions ?? []).map(format)
      input.corrections = (exercise.listeCorrections ?? []).map(format)
      input.introCorrection = mathaleaFormatExercice(
        exercise.consigneCorrection ?? '',
      )
      // le nombre de questions n'entre pas en jeu ici : un exercice à
      // question unique n'est de toute façon jamais mis dans un
      // environnement `tasks` (donc jamais numéroté), sauf s'il rejoint un
      // groupe fusionné (voir `forceList` dans buildTypstDocument)
      input.numbered = exercise.listeAvecNumerotation !== false
      // mode « Course aux nombres » : énoncés propres au tableau (à défaut,
      // les questions ordinaires) et réponses à compléter, comme le style
      // « Can » de la sortie LaTeX (voir `lib/Latex.ts`)
      input.canQuestions = input.questions.map((question, i) => {
        const canEnonce = exercise.listeCanEnonces?.[i]
        return canEnonce != null && canEnonce.length > 0
          ? format(canEnonce)
          : question
      })
      input.canAnswers = input.questions.map((_, i) =>
        format(exercise.listeCanReponsesACompleter?.[i] ?? ''),
      )
      // questions figées par la palette (nombre de questions modifié) : les
      // questions déjà affichées gardent leur contenu, seules les questions
      // ajoutées prennent le contenu fraîchement généré
      const frozen = frozenInputs.get(exercise)
      if (frozen != null) {
        input.intro = frozen.intro
        input.introCorrection = frozen.introCorrection
        input.questions = input.questions.map(
          (question, i) => frozen.questions[i] ?? question,
        )
        input.corrections = input.corrections.map(
          (correction, i) => frozen.corrections[i] ?? correction,
        )
        input.canQuestions = input.canQuestions?.map(
          (question, i) => frozen.canQuestions[i] ?? question,
        )
        input.canAnswers = input.canAnswers?.map(
          (answer, i) => frozen.canAnswers[i] ?? answer,
        )
      }
      return input
    })
  }

  /**
   * Contenu de chaque version du sujet (Sujet A, B...) : la version 0 utilise
   * la graine de base (visible dans les réglages), les suivantes une graine
   * dérivée — même formule que la vue A4 (`Diaporama.svelte` `reroll`), pour
   * que la 2e version corresponde à la 2e vue du diaporama.
   */
  function buildAllVersionInputs(): TypstExerciseInput[][] {
    const baseSeeds = exercises.map((exercise) => exercise?.seed)
    const nbVersions = Math.max(1, documentOptions.nbVersions)
    const perVersion: TypstExerciseInput[][] = []
    for (let version = 0; version < nbVersions; version++) {
      for (const [k, exercise] of exercises.entries()) {
        if (exercise == null) continue
        const base = baseSeeds[k]
        exercise.seed =
          version === 0 || base === undefined ? base : `${base}${version}`
      }
      perVersion.push(buildInputs())
    }
    // on restaure la graine de base : c'est elle que montrent les réglages
    for (const [k, exercise] of exercises.entries()) {
      if (exercise != null) exercise.seed = baseSeeds[k]
    }
    return perVersion
  }

  function buildCode(): string {
    // les ajustements faits via la palette de mise en page (colonnes,
    // espacement, insertions) sont repris du code courant pour survivre
    // à la régénération ; au tout premier rendu (éditeur pas encore créé),
    // on repart des réglages restaurés depuis l'URL le cas échéant
    const carryOver =
      editorView != null
        ? harvestCarryOver(currentCode())
        : (urlCarryOver ?? {})
    const [primary, ...extraVersions] = buildAllVersionInputs()
    return buildTypstDocument(
      primary,
      documentOptions,
      carryOver,
      extraVersions,
      {
        sourceUrl: currentUrl(),
        extraPreamble: extraPreamble(),
      },
    )
  }

  function initEditor(content: string) {
    editorView?.destroy()
    editorView = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions: [
          ...codeEditorExtensions({
            dark: $darkMode.isActive,
            language: typstLanguage,
            // Ctrl/Cmd + Entrée : compiler sans attendre le débounce
            onCompileNow: () => scheduleCompile(currentCode(), 0),
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              // les éditions de la palette survivent à la régénération :
              // seule la frappe directe arme l'avertissement d'écrasement
              if (!isPaletteEdit) isEdited = true
              const code = update.state.doc.toString()
              refreshTasksLayout(code)
              canRestoreLastGood = lastGoodCode != null && lastGoodCode !== code
              // toute modification structurée (palette, régénération) est
              // reportée dans l'URL ; le garde-fou sur la valeur encodée
              // évite d'écrire à chaque frappe qui ne change pas les réglages
              persistToUrl()
              scheduleCompile(code)
            }
          }),
        ],
      }),
      parent: editorEl,
    })
    refreshTasksLayout(content)
  }

  // l'éditeur suit le thème clair/sombre de l'application
  $effect(() => {
    const dark = $darkMode.isActive
    if (editorView != null) setEditorTheme(editorView, dark)
  })

  /**
   * Rétablit le dernier code qui a compilé. L'opération passe par
   * l'historique de CodeMirror : elle est annulable par Ctrl/Cmd + Z si le
   * professeur veut finalement récupérer sa version en cours.
   */
  function restoreLastGoodCode() {
    if (editorView == null || lastGoodCode == null) return
    const restored = lastGoodCode
    editorView.dispatch({
      changes: { from: 0, to: editorView.state.doc.length, insert: restored },
      selection: { anchor: 0 },
    })
    editorView.focus()
    scheduleCompile(restored, 0)
  }

  /** Place le curseur sur la ligne d'un diagnostic (clic dans le panneau) */
  function goToDiagnostic(diagnostic: TypstDiagnostic) {
    if (editorView == null || diagnostic.line == null) return
    if (displayMode === 'preview') setDisplayMode('split')
    revealPosition(
      editorView,
      diagnostic.line,
      diagnostic.column,
      diagnostic.endLine,
      diagnostic.endColumn,
    )
  }

  /**
   * Repère (1-based) de la ligne de code où éditer un exercice ou sa
   * correction.
   *
   * En mode « banque » (le mode courant), le contenu d'un énoncé est dans sa
   * définition (`// ----- Exercice N -----` puis `#let exN = exo.with(...)`) :
   * le repère `#mathalea-anchor("exo", N)`, lui, ne précède que l'appel
   * `#exN()` de la section « Énoncés », où il n'y a rien à modifier. On vise
   * donc d'abord le titre de la définition, et on ne retombe sur le repère
   * que s'il n'y en a pas — c'est le cas du mode fusionné, où le contenu suit
   * directement le repère.
   *
   * Une correction n'a pas de définition séparée : son contenu suit son
   * repère `#mathalea-anchor("corr", N)`, qui reste donc la bonne cible.
   */
  function findExerciseSourceLine(
    code: string,
    kind: 'exo' | 'corr',
    num: number,
  ): number | null {
    const lines = code.split('\n')
    if (kind === 'exo') {
      const titleLine = lines.findIndex((line) =>
        new RegExp(`^//\\s*-+\\s*Exercice ${num}\\b`).test(line),
      )
      if (titleLine !== -1) return titleLine + 1
    }
    const anchorPattern = new RegExp(
      `#mathalea-anchor\\(\\s*"${kind}"\\s*,\\s*${num}\\s*\\)`,
    )
    const anchorLine = lines.findIndex((line) => anchorPattern.test(line))
    return anchorLine === -1 ? null : anchorLine + 1
  }

  /**
   * Double-clic sur l'aperçu : amène le curseur, dans l'éditeur, sur
   * l'exercice (ou sa correction) affiché au point cliqué. Convertit le
   * clic en coordonnées SVG (mêmes unités que les repères de la palette de
   * mise en page, voir `computeOverlayWidgets`), repère la page puis le
   * dernier repère « exo »/« corr » rencontré au-dessus du point cliqué.
   */
  function jumpToSourceFromClick(event: MouseEvent) {
    if (editorView == null) return
    // ignore un double-clic sur un contrôle de la palette de mise en page
    // (bouton, champ…), qui a déjà son propre comportement
    const target = event.target as HTMLElement
    if (
      target !== event.currentTarget &&
      target.closest('button, input, select')
    )
      return
    if (previewViewBox.width <= 0 || previewViewBox.height <= 0) return
    const container = event.currentTarget as HTMLElement
    const rect = container.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const clickX =
      ((event.clientX - rect.left) / rect.width) * previewViewBox.width
    const clickY =
      ((event.clientY - rect.top) / rect.height) * previewViewBox.height

    let pageIndex = previewPages.findIndex(
      (page) => clickY >= page.y && clickY <= page.y + page.height,
    )
    if (pageIndex === -1) {
      // clic dans l'espacement entre deux pages : la page la plus proche
      let bestDistance = Infinity
      previewPages.forEach((page, index) => {
        const distance = Math.min(
          Math.abs(clickY - page.y),
          Math.abs(clickY - (page.y + page.height)),
        )
        if (distance < bestDistance) {
          bestDistance = distance
          pageIndex = index
        }
      })
    }
    if (pageIndex === -1) return
    const pageNum = pageIndex + 1
    const localY = clickY - previewPages[pageIndex].y

    const sectionAnchors = anchors.filter(
      (anchor) => anchor.kind === 'exo' || anchor.kind === 'corr',
    )
    let candidate: TypstAnchor | null = null
    for (const anchor of sectionAnchors) {
      const isBeforeClick =
        anchor.page < pageNum || (anchor.page === pageNum && anchor.y <= localY)
      if (!isBeforeClick) continue
      if (
        candidate == null ||
        anchor.page > candidate.page ||
        (anchor.page === candidate.page && anchor.y > candidate.y)
      ) {
        candidate = anchor
      }
    }
    // clic au-dessus du premier repère de la page (ex. dans l'en-tête) :
    // on vise plutôt le premier exercice qui suit
    if (candidate == null) {
      candidate =
        sectionAnchors.find((anchor) => anchor.page >= pageNum) ??
        sectionAnchors[0] ??
        null
    }
    if (candidate == null) return

    const line = findExerciseSourceLine(
      currentCode(),
      candidate.kind === 'corr' ? 'corr' : 'exo',
      candidate.num,
    )
    if (line == null) return
    if (displayMode === 'preview') setDisplayMode('split')
    revealPosition(editorView, line)
  }

  function setEditorContent(content: string) {
    if (editorView == null) return
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: content,
      },
    })
    isEdited = false
  }

  function currentCode(): string {
    return editorView?.state.doc.toString() ?? ''
  }

  /**
   * URL complète permettant de régénérer cette fiche à l'identique (tenue à
   * jour par `persistToUrl`) : inscrite en commentaire en tête du code
   * Typst généré, pour un professeur qui en retrouve un exemplaire imprimé
   * ou téléchargé.
   */
  function currentUrl(): string {
    return window.location.href
  }

  /**
   * Code Typst du préambule des banques externes dont un exercice figure
   * dans la fiche (voir `manifest.preambule.typ`), à insérer dans le document
   * généré.
   */
  function extraPreamble(): string {
    return getBanquesExternesPreambuleTyp(
      exercises
        .filter((e): e is IExercice => e != null)
        .map((e) => String(e.uuid)),
    )
  }

  /**
   * Compilation en direct : débouncée pendant la frappe et sérialisée
   * (une seule compilation à la fois, la dernière demande gagne).
   */
  let compileTimer: ReturnType<typeof setTimeout>
  let compileToken = 0
  function scheduleCompile(code: string, delay = 500) {
    clearTimeout(compileTimer)
    compileTimer = setTimeout(() => compile(code), delay)
  }

  /** Espace entre deux pages de l'aperçu, en unités SVG (pt) */
  const PAGE_GAP = 16

  /** Aperçu préparé : SVG retouché et géométrie des pages pour la palette */
  interface SeparatedPreview {
    svg: string
    pages: PreviewPageGeometry[]
    viewBox: { width: number; height: number }
  }

  /**
   * Le SVG de typst.ts empile les pages sans séparation : on insère un
   * fond blanc bordé derrière chaque page (`g.typst-page`) et un espace
   * entre les pages, sur le fond gris du panneau d'aperçu. La géométrie des
   * pages est renvoyée pour positionner la palette de mise en page.
   */
  function separatePages(svg: string): SeparatedPreview {
    const degraded: SeparatedPreview = {
      svg,
      pages: [],
      viewBox: { width: 0, height: 0 },
    }
    try {
      // parseur HTML (pas XML) : le SVG de typst.ts embarque un <script>
      // et des styles qui ne sont pas du XML strict
      const doc = new DOMParser().parseFromString(svg, 'text/html')
      const root = doc.querySelector('svg')
      if (root == null) return degraded
      const pages = [...root.querySelectorAll('g.typst-page')]
      if (pages.length === 0) return degraded
      const viewBox = (root.getAttribute('viewBox') ?? '')
        .trim()
        .split(/\s+/)
        .map(Number)
      if (viewBox.length !== 4 || viewBox.some(Number.isNaN)) return degraded
      const geometry: PreviewPageGeometry[] = []
      let cumulatedY = 0
      for (const [i, page] of pages.entries()) {
        const width = parseFloat(page.getAttribute('data-page-width') ?? '0')
        const height = parseFloat(page.getAttribute('data-page-height') ?? '0')
        // la position verticale de la page est celle de son transform
        // (les pages sont empilées) ; à défaut, la somme des hauteurs
        const translate = (page.getAttribute('transform') ?? '').match(
          /translate\(\s*[\d.e+-]+[ ,]+([\d.e+-]+)\s*\)/i,
        )
        const pageY = translate != null ? parseFloat(translate[1]) : cumulatedY
        cumulatedY += height
        geometry.push({ y: pageY + i * PAGE_GAP, width, height })
        const wrapper = doc.createElementNS('http://www.w3.org/2000/svg', 'g')
        wrapper.setAttribute('transform', `translate(0, ${i * PAGE_GAP})`)
        const sheet = doc.createElementNS('http://www.w3.org/2000/svg', 'rect')
        sheet.setAttribute('x', '0')
        sheet.setAttribute('y', String(pageY))
        sheet.setAttribute('width', String(width))
        sheet.setAttribute('height', String(height))
        sheet.setAttribute('fill', '#ffffff')
        sheet.setAttribute('stroke', '#c8c8c8')
        sheet.setAttribute('stroke-width', '1')
        page.replaceWith(wrapper)
        wrapper.appendChild(sheet)
        wrapper.appendChild(page)
      }
      const totalGap = (pages.length - 1) * PAGE_GAP
      viewBox[3] += totalGap
      root.setAttribute('viewBox', viewBox.join(' '))
      const heightAttr = parseFloat(root.getAttribute('height') ?? '')
      if (!Number.isNaN(heightAttr)) {
        root.setAttribute('height', String(heightAttr + totalGap))
      }
      return {
        svg: root.outerHTML,
        pages: geometry,
        viewBox: { width: viewBox[2], height: viewBox[3] },
      }
    } catch {
      // aperçu dégradé (pages non séparées, pas de palette) plutôt que rien
      return degraded
    }
  }

  /**
   * Traduit les diagnostics bruts du compilateur et les reporte dans
   * l'éditeur (surlignage des lignes fautives et pastilles dans la marge).
   * Le panneau se rouvre dès qu'une nouvelle erreur apparaît, même si le
   * professeur l'avait replié.
   */
  function applyDiagnostics(raw: string[]) {
    const previousErrors = countErrors(diagnostics)
    diagnostics = parseTypstDiagnostics(raw)
    if (countErrors(diagnostics) > previousErrors)
      isDiagnosticsCollapsed = false
    if (editorView != null) {
      const markers: EditorMarker[] = diagnostics
        .filter((diagnostic) => diagnostic.line != null)
        .map((diagnostic) => ({
          line: diagnostic.line as number,
          column: diagnostic.column,
          endLine: diagnostic.endLine,
          endColumn: diagnostic.endColumn,
          severity: diagnostic.severity,
          message: diagnostic.message,
        }))
      setEditorMarkers(editorView, markers)
    }
  }

  async function compile(code: string) {
    const token = ++compileToken
    isCompiling = true
    if (svgContent === '') isCompilerLoading = true
    try {
      const { compileTypstToSvg, isCompilerCached } =
        await import('./typstCompiler')
      // adapte le message d'attente : « première visite » seulement si le
      // compilateur n'est pas déjà en cache (téléchargement à prévoir)
      if (isCompilerLoading) compilerFirstVisit = !(await isCompilerCached())
      const result = await compileTypstToSvg(code)
      if (token !== compileToken) return
      applyDiagnostics(result.diagnostics)
      if (result.svg != null) {
        const separated = separatePages(result.svg)
        svgContent = separated.svg
        previewPages = separated.pages
        previewViewBox = separated.viewBox
        anchors = result.anchors ?? []
        // point de retour : ce code produit bien un document
        lastGoodCode = code
        lastGoodAt = new Date()
        canRestoreLastGood = false
      } else {
        canRestoreLastGood = lastGoodCode != null && lastGoodCode !== code
      }
    } catch (error) {
      if (token !== compileToken) return
      console.error('Erreur lors de la compilation Typst', error)
      applyDiagnostics([
        'error: ' + (error instanceof Error ? error.message : String(error)),
      ])
      canRestoreLastGood = lastGoodCode != null && lastGoodCode !== code
    } finally {
      if (token === compileToken) {
        isCompiling = false
        isCompilerLoading = false
      }
    }
  }

  /**
   * Récupère les images référencées par un `<img>` dans le contenu HTML de
   * n'importe quel exercice (pas seulement les annales scannées) et les
   * charge dans le compilateur Typst (système de fichiers virtuel), pour
   * qu'elles s'affichent dans l'aperçu au lieu d'un encart « non convertie ».
   * Une image dont la récupération échoue (réseau, ou hôte n'autorisant pas
   * le CORS) reste absente du registre : elle s'affiche alors comme un
   * encart, sans bloquer le reste de la fiche.
   */
  /**
   * Récrit une URL `https://coopmaths.fr/alea/...` en URL de même origine
   * que l'application (proxyée vers coopmaths.fr en développement, voir
   * `vite.config.ts`) : coopmaths.fr n'envoie pas d'en-têtes CORS, un fetch
   * direct échouerait sinon dès que l'appli n'est pas servie depuis ce domaine.
   */
  function toSameOriginUrl(url: string): string {
    const prefix = 'https://coopmaths.fr/alea/'
    return url.startsWith(prefix)
      ? `${window.location.origin}${import.meta.env.BASE_URL}${url.slice(prefix.length)}`
      : url
  }

  /**
   * Repère de début d'un item d'énumération Typst de premier niveau (`+ `
   * en tout début de ligne, sans indentation : une sous-liste indentée
   * n'est donc pas prise pour des questions séparées).
   */
  const TYP_QUESTION_ITEM = /^\+[ \t]+/m

  /**
   * Sépare le code Typst d'un exercice statique en énoncé fixe et questions
   * individuelles, à partir de sa numérotation classique (`+ question`) :
   * c'est l'affichage qui repère les questions, l'auteur du `.typ` écrit une
   * énumération Typst ordinaire (toujours compilable seule avec
   * `typst compile`, sans convention MathALÉA à connaître). Sans item de
   * premier niveau, tout le fichier reste une question unique.
   */
  function splitTypQuestions(code: string): {
    intro: string
    questions: string[]
  } {
    const parts = code.split(TYP_QUESTION_ITEM)
    if (parts.length === 1) return { intro: code, questions: [] }
    const [intro, ...questions] = parts
    return { intro, questions }
  }

  /**
   * Remplace, pour chaque exercice statique (annale scannée) disposant d'un
   * fichier source Typst (`typ: true` dans le référentiel), l'énoncé généré
   * par `buildExercisesList` (un `<img>` pointant vers le png) par le code
   * Typst du fichier, inséré tel quel via le marqueur `<mathalea-typst>`
   * (voir `htmlToTypst`). Propre à la vue Typst : les autres vues
   * (A4, QuestionParPage...) continuent d'afficher le png, `buildExercisesList`
   * n'est pas modifiée. Un fichier absent ou vide laisse l'énoncé (png) inchangé.
   *
   * Les questions repérées par `splitTypQuestions` deviennent des entrées
   * séparées de `listeQuestions` : la numérotation passe alors par le même
   * environnement `#tasks(...)` que les autres exercices et respecte le
   * réglage « Numéros des questions en gras ».
   *
   * La correction suit le même principe à partir du fichier `<uuid>_cor.typ`
   * (à côté du `.typ` de l'énoncé), indépendamment de celui-ci : ce fichier
   * est optionnel (pas toujours encore rédigé), son absence laisse la
   * correction (png scanné) inchangée même si l'énoncé a bien son `.typ`.
   */
  async function applyTypSourcesForStaticExercises() {
    for (const exercise of exercises) {
      if (exercise == null || exercise.typeExercice !== 'statique') continue
      const uuid = exercise.uuid
      if (uuid == null) continue
      if (getStaticExerciceTypUrl(uuid) == null) continue

      const typUrl = getStaticExerciceTypUrl(uuid)
      try {
        if (typUrl == null) throw new Error('no typ url')
        const response = await window.fetch(typUrl)
        if (!response.ok) throw new Error('fetch failed')
        const code = await response.text()
        if (code.trim().length === 0) throw new Error('empty file')
        const { intro, questions } = splitTypQuestions(code)
        if (questions.length === 0) {
          exercise.listeQuestions[0] = `<mathalea-typst>${code}</mathalea-typst>`
        } else {
          if (intro.trim().length > 0) {
            exercise.consigne = `<mathalea-typst>${intro}</mathalea-typst>`
          }
          exercise.listeQuestions = questions.map(
            (question) => `<mathalea-typst>${question}</mathalea-typst>`,
          )
          exercise.nbQuestions = questions.length
        }
      } catch {
        // fichier .typ absent ou inaccessible : l'énoncé (png) reste inchangé
      }

      try {
        const corTypUrl = getStaticExerciceCorTypUrl(uuid)
        if (corTypUrl == null) throw new Error('no cor typ url')
        const response = await window.fetch(corTypUrl)
        if (!response.ok) throw new Error('fetch failed')
        const code = await response.text()
        if (code.trim().length === 0) throw new Error('empty file')
        const { intro, questions } = splitTypQuestions(code)
        if (questions.length === 0) {
          exercise.listeCorrections[0] = `<mathalea-typst>${code}</mathalea-typst>`
        } else {
          if (intro.trim().length > 0) {
            exercise.consigneCorrection = `<mathalea-typst>${intro}</mathalea-typst>`
          }
          exercise.listeCorrections = questions.map(
            (question) => `<mathalea-typst>${question}</mathalea-typst>`,
          )
        }
      } catch {
        // fichier _cor.typ absent ou inaccessible (pas encore rédigé) :
        // la correction (png scanné) reste inchangée
      }
    }
  }

  /** Extensions d'image reconnues par Typst pour le chemin virtuel du fichier */
  const KNOWN_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp'])

  /**
   * Appel `#image("chemin relatif")` dans le code Typst brut d'un exercice
   * statique (`typ: true`), tel qu'écrit par l'auteur du `.typ` (voir
   * `applyTypSourcesForStaticExercises`). Ne capture que les chemins
   * relatifs : une URL absolue (`https://...`) n'est pas prise en charge par
   * `#image`, elle échouerait de toute façon à la compilation d'origine.
   */
  const TYP_IMAGE_CALL = /#image\(\s*"([^"]+)"/g

  /**
   * Octets des images nécessaires à la compilation du code courant, indexés
   * par le chemin virtuel exact référencé par les `image(...)` du document
   * généré (mêmes clés que `setStaticImageBytes`, voir `prefetchStaticImages`).
   * Réutilisés par `downloadTyp` pour empaqueter le `.typ` téléchargé avec
   * ses images : sans elles, le fichier téléchargé seul ne compile pas
   * (chemins relatifs ou virtuels introuvables hors de l'appli).
   */
  let requiredImageAssets: Map<string, Uint8Array> = $state(new Map())

  async function prefetchStaticImages() {
    // régénère chaque exercice (avec context.isTypst, comme le fera buildCode()
    // juste après) : pour un exercice non « statique » (dont son contenu est
    // déjà figé par buildExercisesList), consigne/listeQuestions sont encore
    // vides à ce stade, nouvelleVersion() n'ayant pas encore tourné — sans
    // cette passe, aucun <img> ne serait trouvé. Idempotent (reseed
    // déterministe par exercise.seed) : regenerate() est rappelée par
    // buildCode() juste après sans changer son résultat.
    for (const k of exercises.keys()) regenerate(k)

    const urls = new Set<string>()
    const imgSrc = /<img[^>]*\ssrc=["']([^"']+)["']/gi
    // chemin virtuel (identique au chemin relatif du `#image(...)`, pour que
    // le `.typ` reste utilisable tel quel) -> URL réelle, résolue par rapport
    // au dossier du `.typ` source de l'exercice
    const typImageUrls = new Map<string, string>()
    for (const exercise of exercises) {
      if (exercise == null) continue
      const html = [
        exercise.consigne,
        ...(exercise.listeQuestions ?? []),
        ...(exercise.listeCorrections ?? []),
      ].join('')
      for (const match of html.matchAll(imgSrc)) urls.add(match[1])

      if (exercise.typeExercice === 'statique' && exercise.uuid != null) {
        const typUrl = getStaticExerciceTypUrl(exercise.uuid)
        if (typUrl != null) {
          const typBase = new URL(typUrl, window.location.href)
          for (const match of html.matchAll(TYP_IMAGE_CALL)) {
            const relativePath = match[1]
            if (/^[a-z][a-z0-9+.-]*:/i.test(relativePath)) continue // URL absolue : non gérée par #image
            typImageUrls.set(
              `/${relativePath}`,
              new URL(relativePath, typBase).href,
            )
          }
        }
      }
    }
    // logo de la page de garde « Course aux nombres » (voir `mathaleaLogo.ts`) :
    // un asset fixe de l'appli, pas une image d'exercice, mais chargé et
    // empaqueté (aperçu + .zip téléchargé) par le même mécanisme
    const needsLogoCan = documentOptions.coverPage.template === 'can'
    if (urls.size === 0 && typImageUrls.size === 0 && !needsLogoCan) {
      requiredImageAssets = new Map()
      return
    }
    const { cachedBytes, setStaticImageBytes } = await import('./typstCompiler')
    const paths = new Map<string, string>()
    const bytes = new Map<string, Uint8Array>()
    await Promise.all(
      [...urls].map(async (url, i) => {
        try {
          // le chemin virtuel doit porter la vraie extension : Typst détermine
          // le format d'une image d'après l'extension de son chemin (`format:
          // auto`), une image JPEG enregistrée sous un chemin `.png` échoue au
          // décodage
          const rawExt = /\.([a-z0-9]+)(?:[?#]|$)/i
            .exec(url)?.[1]
            ?.toLowerCase()
          const ext =
            rawExt != null && KNOWN_IMAGE_EXTENSIONS.has(rawExt)
              ? rawExt
              : 'png'
          const path = `/static-img-${i}.${ext}`
          bytes.set(path, await cachedBytes(toSameOriginUrl(url)))
          paths.set(url, path)
        } catch {
          // image indisponible : elle apparaîtra comme un encart
        }
      }),
    )
    await Promise.all(
      [...typImageUrls].map(async ([virtualPath, url]) => {
        try {
          bytes.set(virtualPath, await cachedBytes(toSameOriginUrl(url)))
        } catch {
          // image indisponible : #image() échouera pour cet exercice (diagnostic Typst)
        }
      }),
    )
    if (needsLogoCan) {
      try {
        bytes.set(
          LOGO_CAN_VIRTUAL_PATH,
          await cachedBytes(`${import.meta.env.BASE_URL}${LOGO_CAN_URL}`),
        )
      } catch {
        // logo indisponible : encart « image non convertie » à sa place
      }
    }
    setStaticImagePaths(paths)
    setStaticImageBytes(bytes)
    requiredImageAssets = bytes
  }

  async function loadExercises() {
    isLoading = true
    const results = await Promise.allSettled(buildExercisesList())
    exercises = results.map((result) =>
      result.status === 'fulfilled' ? result.value : null,
    )
    for (const exercise of exercises) {
      if (exercise != null) exercise.interactif = false
    }
    await applyTypSourcesForStaticExercises()
    await prefetchStaticImages()
    isLoading = false
  }

  onMount(async () => {
    await loadExercises()
    // Course aux nombres par défaut si la fiche ne contient que des
    // exercices « can » (identifiant commençant par « can », comme
    // `can6M20`) : présentation en tableau, format A5 (feuille de passation
    // plus petite) et page de garde assortie — sauf si un lien partagé fixe
    // déjà l'un de ces réglages.
    const loaded = exercises.filter(
      (exercise): exercise is IExercice => exercise != null,
    )
    const allCan =
      loaded.length > 0 &&
      loaded.every((exercise) =>
        (exercise.id ?? '').toLowerCase().includes('can'),
      )
    if (allCan) {
      if (!canModeSetFromUrl) documentOptions.canMode = true
      if (!pageFormatSetFromUrl) documentOptions.pageFormat = 'a5'
      if (
        !titleSetFromUrl &&
        documentOptions.title === defaultTypstDocumentOptions.title
      ) {
        documentOptions.title = CAN_TITLE
      }
      if (!coverTemplateSetFromUrl) {
        documentOptions.coverPage = {
          ...documentOptions.coverPage,
          template: 'can',
          ...COVER_TEMPLATE_DEFAULTS.can,
          bareme: defaultCoverBareme(),
        }
        // la page de garde porte déjà le titre du sujet : pas de second
        // bloc de titre en page 2 (même raison que `applyCoverTemplate`)
        if (!headerStyleSetFromUrl) documentOptions.headerStyle = 'aucun'
      }
      // le passage en page de garde « can » ci-dessus arrive après le
      // premier prefetch (loadExercises) : celui-ci n'a donc pas pu charger
      // le logo, absent du registre à ce moment-là — on le relance.
      await prefetchStaticImages()
    }
    const code = buildCode()
    initEditor(code)
    // normalise l'URL : elle porte désormais l'ensemble des réglages
    // (document + mise en page) tels qu'appliqués au premier rendu
    persistToUrl()
    compile(code)
  })

  onDestroy(() => {
    clearTimeout(compileTimer)
    editorView?.destroy()
    editorView = null
    for (const exercise of exercises) {
      if (exercise == null) continue
      exercise.reinit?.()
      exercise.destroy?.()
    }
  })

  /** Le professeur perd ses modifications manuelles : on le prévient */
  function confirmOverwrite(): boolean {
    if (!isEdited) return true
    return window.confirm(
      'Le code Typst a été modifié : le regénérer écrasera vos modifications. Continuer ?',
    )
  }

  /** Nouvelles données aléatoires pour tous les exercices */
  function newDataForAll() {
    if (!confirmOverwrite()) return
    // nouvelles graines : les questions figées par la palette sont libérées
    frozenInputs.clear()
    // voir applyNewSeedTo : Math.random peut être verrouillé sur la graine
    // du dernier exercice régénéré, il faut le réamorcer avant de tirer
    seedrandom(undefined, { global: true })
    const params = get(exercicesParams)
    for (const [k, exercise] of exercises.entries()) {
      if (exercise == null) continue
      exercise.seed = undefined
      if (typeof exercise.applyNewSeed === 'function') exercise.applyNewSeed()
      if (params[k] != null && exercise.seed !== undefined) {
        params[k].alea = exercise.seed
      }
    }
    exercicesParams.update((list) => list)
    const code = buildCode()
    setEditorContent(code)
    scheduleCompile(code, 0)
  }

  function exportFilename() {
    return (
      documentOptions.title
        .trim()
        .replace(/[^\p{L}\p{N} _-]/gu, '')
        .replace(/\s+/g, '_') || 'fiche'
    )
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  /** Compile un code Typst en PDF et le télécharge (nom `filename.pdf`) */
  async function compileAndDownload(
    code: string,
    filename: string,
  ): Promise<boolean> {
    const { compileTypstToPdf } = await import('./typstCompiler')
    const pdf = await compileTypstToPdf(code)
    if (pdf == null) return false
    downloadBlob(
      new Blob([pdf as BlobPart], { type: 'application/pdf' }),
      `${filename}.pdf`,
    )
    return true
  }

  async function downloadPdf() {
    if (isGeneratingPdf) return
    isGeneratingPdf = true
    try {
      const ok = await compileAndDownload(currentCode(), exportFilename())
      if (!ok) {
        window.alert(
          'La compilation du PDF a échoué : corrigez les erreurs signalées sous l’aperçu.',
        )
      }
    } catch (error) {
      console.error("Erreur lors de l'export PDF", error)
    } finally {
      isGeneratingPdf = false
    }
  }

  /**
   * Code de l'énoncé seul : `corrige = false` masque le corrigé
   * (le paquet exercise-bank passe alors en affichage « ex »).
   */
  function enonceCode(code: string): string {
    return code.replace('#let corrige = true', '#let corrige = false')
  }

  /**
   * Code du corrigé seul (mode banque exercise-bank) : affichage « sol » —
   * chaque exercice rend sa correction à la place de l'énoncé. `corrige`
   * repasse à false pour ignorer le bloc de corrections regroupées (sinon un
   * titre « Corrections » vide s'ajouterait). En mode fusionné (pas de banque),
   * la séparation n'est pas possible : on garde le document complet.
   */
  function corrigeCode(code: string): string {
    const bankDisplay = 'display: if corrige { "both" } else { "ex" }'
    if (!code.includes(bankDisplay)) return code
    return (
      code
        .replace('#let corrige = true', '#let corrige = false')
        .replace(bankDisplay, 'display: "sol"')
        // on garde le titre mais on retire la ligne Nom/Prénom/Classe
        // (inutile sur le corrigé) en vidant la variable `entete`
        .replace(/#let entete = .*/, '#let entete = ""')
    )
  }

  /**
   * Télécharge deux PDF à la suite : `titre_enonce.pdf` puis
   * `titre_corrige.pdf`, à partir du code courant.
   */
  async function downloadPdfSeparate() {
    if (isGeneratingPdf) return
    isGeneratingPdf = true
    try {
      const code = currentCode()
      const base = exportFilename()
      const okEnonce = await compileAndDownload(
        enonceCode(code),
        `${base}_enonce`,
      )
      // court délai : certains navigateurs ignorent deux téléchargements
      // déclenchés dans le même tick
      await new Promise((resolve) => setTimeout(resolve, 400))
      const okCorrige = await compileAndDownload(
        corrigeCode(code),
        `${base}_corrige`,
      )
      if (!okEnonce || !okCorrige) {
        window.alert(
          'La compilation du PDF a échoué : corrigez les erreurs signalées sous l’aperçu.',
        )
      }
    } catch (error) {
      console.error("Erreur lors de l'export PDF séparé", error)
    } finally {
      isGeneratingPdf = false
    }
  }

  /**
   * Code Typst « propre » pour la réutilisation hors de l'appli (fichier
   * .typ téléchargé) : sans les repères `mathalea-anchor` ni les variables
   * de mise en page des questions (`exN-colonnes`...), propres à la palette
   * de l'éditeur intégré et sans effet une fois le code sorti de l'appli.
   */
  function buildExportCode(): string {
    const carryOver = editorView != null ? harvestCarryOver(currentCode()) : {}
    const [primary, ...extraVersions] = buildAllVersionInputs()
    return buildTypstDocument(
      primary,
      documentOptions,
      carryOver,
      extraVersions,
      {
        exportMode: true,
        sourceUrl: currentUrl(),
        extraPreamble: extraPreamble(),
      },
    )
  }

  /**
   * Télécharge le `.typ` : seul s'il ne référence aucune image, sinon dans
   * une archive ZIP avec les images nécessaires (mêmes chemins que ceux
   * référencés par le code, voir `requiredImageAssets`) — sans elles, le
   * `.typ` téléchargé seul ne compile pas hors de l'appli.
   */
  async function downloadTyp() {
    const filename = exportFilename()
    if (requiredImageAssets.size === 0) {
      downloadBlob(
        new Blob([buildExportCode()], { type: 'text/plain;charset=utf-8' }),
        `${filename}.typ`,
      )
      return
    }
    const zip = new JSZip()
    zip.file(`${filename}.typ`, buildExportCode())
    for (const [virtualPath, bytes] of requiredImageAssets) {
      zip.file(virtualPath.replace(/^\//, ''), bytes)
    }
    downloadBlob(await zip.generateAsync({ type: 'blob' }), `${filename}.zip`)
  }
</script>

<svelte:head>
  <title>MathALÉA - Impression</title>
</svelte:head>

<main
  class="typst-view {$darkMode.isActive
    ? 'dark'
    : ''} flex flex-col h-screen bg-coopmaths-canvas-darkest dark:bg-coopmathsdark-canvas-darkest"
>
  <!-- `relative z-10` : la barre d'outils précède l'aperçu dans le DOM, elle
       doit rester au-dessus de ses pastilles de mise en page (voir `isolate`
       sur le conteneur de l'aperçu) -->
  <div class="relative z-10 bg-coopmaths-canvas dark:bg-coopmathsdark-canvas">
    <NavBar
      subtitle="Impression"
      subtitleType="export"
      handleLanguage={() => {}}
      locale={$referentielLocale}
      showLanguage={!isMobile}
    />
    <div
      class="flex flex-row flex-wrap items-center gap-x-6 gap-y-3 px-4 md:px-8 py-3 border-b border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest text-coopmaths-corpus dark:text-coopmathsdark-corpus"
    >
      <!-- Sur téléphone, seul l'aperçu est disponible : le sélecteur est masqué -->
      <div
        class="{isMobile
          ? 'hidden'
          : 'flex'} flex-row rounded-lg overflow-hidden border border-coopmaths-action dark:border-coopmathsdark-action"
        role="group"
        aria-label="Mode d'affichage"
      >
        {#each [{ mode: 'code', icon: 'bx-code-alt', label: 'Code' }, { mode: 'split', icon: 'bx-columns', label: 'Côte à côte' }, { mode: 'preview', icon: 'bx-file-pdf', label: 'Aperçu' }] as choice}
          <button
            type="button"
            class="flex items-center gap-1 px-3 py-1 text-sm {displayMode ===
            choice.mode
              ? 'bg-coopmaths-action text-coopmaths-canvas dark:bg-coopmathsdark-action dark:text-coopmathsdark-canvas'
              : 'text-coopmaths-action dark:text-coopmathsdark-action hover:bg-coopmaths-canvas-dark dark:hover:bg-coopmathsdark-canvas-dark'}"
            aria-pressed={displayMode === choice.mode}
            onclick={() => setDisplayMode(choice.mode as DisplayMode)}
          >
            <i class="bx {choice.icon} text-lg"></i>
            {choice.label}
          </button>
        {/each}
      </div>

      {#if displayMode === 'preview'}
        <button
          type="button"
          title="Réglages du document"
          aria-pressed={isSettingsOpen}
          class="flex items-center gap-1 text-sm {isSettingsOpen
            ? 'text-coopmaths-action font-semibold dark:text-coopmathsdark-action'
            : 'text-coopmaths-action/60 hover:text-coopmaths-action dark:text-coopmathsdark-action/60 dark:hover:text-coopmathsdark-action'}"
          onclick={() => (isSettingsOpen = !isSettingsOpen)}
        >
          <i class="bx bx-cog text-xl"></i>
          Réglages
        </button>
      {/if}

      <button
        type="button"
        title="Nouvelles données aléatoires pour tous les exercices"
        class="flex items-center gap-1 text-sm text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
        onclick={newDataForAll}
      >
        <i class="bx bx-refresh text-xl"></i>
        Nouvelles données
      </button>

      <button
        type="button"
        title="Afficher sur l'aperçu les contrôles de mise en page (colonnes et espacement des questions, insertions entre les exercices)"
        aria-pressed={showOverlay}
        class="flex items-center gap-1 text-sm {showOverlay
          ? 'text-coopmaths-action font-semibold dark:text-coopmathsdark-action'
          : 'text-coopmaths-action/60 hover:text-coopmaths-action dark:text-coopmathsdark-action/60 dark:hover:text-coopmathsdark-action'}"
        onclick={() => {
          showOverlay = !showOverlay
          persistPreferences()
        }}
      >
        <i class="bx bx-slider text-xl"></i>
        Mise en page
      </button>

      <label class="flex items-center gap-2 text-sm">
        <i class="bx bx-copy text-xl"></i>
        Versions
        <select
          class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
          bind:value={documentOptions.nbVersions}
          onchange={applyDocumentOptions}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </label>

      <div class="grow"></div>

      {#if displayMode === 'code' || displayMode === 'split'}
        <button
          type="button"
          title="Raccourcis clavier de l’éditeur de code"
          aria-label="Raccourcis clavier de l’éditeur de code"
          class="flex items-center justify-center rounded-lg border border-coopmaths-action py-1 px-2 text-coopmaths-action hover:bg-coopmaths-action hover:text-coopmaths-canvas dark:border-coopmathsdark-action dark:text-coopmathsdark-action dark:hover:bg-coopmathsdark-action dark:hover:text-coopmathsdark-canvas"
          onclick={() => (isShortcutsOpen = true)}
        >
          <i class="bx bx-help-circle text-xl"></i>
        </button>
      {/if}
      {#if displayMode === 'code' || displayMode === 'split'}
        <ButtonTextAction
          text={requiredImageAssets.size > 0
            ? 'Télécharger le .typ (.zip)'
            : 'Télécharger le .typ'}
          icon="bx-file-blank"
          inverted={true}
          class="rounded-lg py-1 px-2"
          title={requiredImageAssets.size > 0
            ? 'Archive ZIP contenant le .typ et les images dont il a besoin'
            : ''}
          on:click={downloadTyp}
        />
      {/if}
      {#if displayMode === 'preview' || displayMode === 'split'}
        <ButtonTextAction
          text={isGeneratingPdf ? 'PDF en cours...' : 'Télécharger le PDF'}
          icon={isGeneratingPdf ? 'bx-loader-alt bx-spin' : 'bx-download'}
          inverted={true}
          class="rounded-lg py-1 px-2 min-w-42.5"
          on:click={downloadPdf}
        />
        <ButtonTextAction
          text={isGeneratingPdf
            ? 'PDF en cours...'
            : 'Énoncé + corrigé séparés'}
          icon={isGeneratingPdf ? 'bx-loader-alt bx-spin' : 'bx-copy'}
          inverted={true}
          class="rounded-lg py-1 px-2 min-w-42.5"
          title="Télécharge deux PDF : l'énoncé seul puis le corrigé seul"
          on:click={downloadPdfSeparate}
        />
      {/if}
    </div>
  </div>

  {#if isLoading}
    <div
      class="flex w-full justify-center items-center py-24 text-coopmaths-corpus dark:text-coopmathsdark-corpus"
    >
      <i class="bx bx-loader-alt bx-spin text-4xl"></i>
    </div>
  {:else}
    <!-- colonne : volets (réglages, éditeur, aperçu) puis panneau d'erreurs -->
    <div class="flex flex-col grow min-h-0">
      <div class="flex flex-row grow min-h-0">
        {#if isSettingsOpen}
          <div
            class="typst-settings-pane relative z-10 w-80 shrink-0 overflow-y-auto border-r border-coopmaths-canvas-darkest dark:border-coopmathsdark-canvas-darkest bg-coopmaths-canvas dark:bg-coopmathsdark-canvas text-coopmaths-corpus dark:text-coopmathsdark-corpus p-5 space-y-4"
          >
            <div class="flex items-center justify-between">
              <h3
                class="font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
              >
                Réglages du document
              </h3>
              <button
                type="button"
                aria-label="Fermer les réglages"
                onclick={() => (isSettingsOpen = false)}
              >
                <i
                  class="bx bx-x text-2xl text-coopmaths-action dark:text-coopmathsdark-action"
                ></i>
              </button>
            </div>

            <label class="flex items-center justify-between gap-4 text-sm">
              Format
              <select
                class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
                bind:value={documentOptions.pageFormat}
                onchange={applyDocumentOptions}
              >
                <option value="a4">A4</option>
                <option value="a5">A5</option>
              </select>
            </label>

            <label class="flex items-center justify-between gap-4 text-sm">
              Orientation
              <select
                class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
                bind:value={documentOptions.orientation}
                onchange={applyDocumentOptions}
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Paysage</option>
              </select>
            </label>

            <div class="flex items-center justify-between gap-4 text-sm">
              <label for="typst-columns-input">Nombre de colonnes</label>
              <input
                id="typst-columns-input"
                type="number"
                min="1"
                max="3"
                step="1"
                class="w-16 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
                bind:value={documentOptions.columns}
                onchange={applyDocumentOptions}
              />
            </div>

            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                bind:checked={documentOptions.showCorrections}
                onchange={applyDocumentOptions}
              />
              Afficher la correction
            </label>

            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                bind:checked={documentOptions.minimalCorrections}
                disabled={!documentOptions.showCorrections}
                onchange={applyDocumentOptions}
              />
              <span
                class:opacity-50={!documentOptions.showCorrections}
                title="Quand une correction met sa réponse en évidence (en orange), n'imprimer que cette réponse"
              >
                Correction minimale
              </span>
            </label>

            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                bind:checked={documentOptions.canMode}
                onchange={toggleCanMode}
              />
              Présentation « Course aux nombres »
            </label>

            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                bind:checked={documentOptions.mergeExercises}
                disabled={documentOptions.canMode}
                onchange={applyDocumentOptions}
              />
              <span class:opacity-50={documentOptions.canMode}>
                Fusionner tous les exercices (questions numérotées à la suite)
              </span>
            </label>

            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                bind:checked={documentOptions.showExerciseRefs}
                disabled={documentOptions.mergeExercises ||
                  documentOptions.canMode}
                onchange={applyDocumentOptions}
              />
              <span
                class:opacity-50={documentOptions.mergeExercises ||
                  documentOptions.canMode}
              >
                Afficher la référence des exercices
              </span>
            </label>

            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                bind:checked={documentOptions.showQrCode}
                disabled={documentOptions.mergeExercises ||
                  documentOptions.canMode}
                onchange={applyDocumentOptions}
              />
              <span
                class:opacity-50={documentOptions.mergeExercises ||
                  documentOptions.canMode}
              >
                QR-code vers chaque exercice
              </span>
            </label>

            <label class="flex items-center justify-between gap-4 text-sm">
              Habillage en-tête
              <select
                class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
                bind:value={documentOptions.headerStyle}
                onchange={applyDocumentOptions}
              >
                {#each HEADER_STYLES as style}
                  <option value={style}>{HEADER_STYLE_LABELS[style]}</option>
                {/each}
              </select>
            </label>

            <p class="text-xs opacity-75">
              Le titre, le sous-titre et la ligne d'en-tête se modifient
              directement sur l'aperçu (bouton
              <i class="bx bx-edit"></i> à gauche du titre).
            </p>

            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                bind:checked={documentOptions.showFooter}
                onchange={applyDocumentOptions}
              />
              Afficher le pied de page
            </label>

            {#if documentOptions.showFooter}
              <p class="text-xs opacity-75">
                Le texte du pied de page se modifie directement sur l'aperçu
                (bouton <i class="bx bx-edit"></i> sur le pied de la première page).
              </p>
            {/if}

            <label class="flex items-center justify-between gap-4 text-sm">
              Police du texte
              <select
                class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
                bind:value={documentOptions.font}
                onchange={applyDocumentOptions}
              >
                {#each TEXT_FONTS as font}
                  <option value={font}>{font}</option>
                {/each}
              </select>
            </label>

            <label class="flex items-center justify-between gap-4 text-sm">
              Police des maths
              <select
                class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
                bind:value={documentOptions.mathFont}
                onchange={applyDocumentOptions}
              >
                {#each MATH_FONTS as font}
                  <option value={font}>{font}</option>
                {/each}
              </select>
            </label>

            <div class="flex items-center justify-between gap-4 text-sm">
              <label for="typst-font-size-input">Taille du texte (pt)</label>
              <input
                id="typst-font-size-input"
                type="number"
                min="7"
                max="16"
                step="0.5"
                class="w-16 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
                bind:value={documentOptions.fontSize}
                onchange={applyDocumentOptions}
              />
            </div>

            <div class="flex items-center justify-between gap-4 text-sm">
              <label for="typst-line-spacing-input">Interligne</label>
              <input
                id="typst-line-spacing-input"
                type="number"
                min="0.3"
                max="2"
                step="0.05"
                class="w-16 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
                bind:value={documentOptions.lineSpacing}
                onchange={applyDocumentOptions}
              />
            </div>

            <div class="flex items-center justify-between gap-4 text-sm">
              <label for="typst-word-spacing-input"
                >Espacement entre les mots (%)</label
              >
              <input
                id="typst-word-spacing-input"
                type="number"
                min="50"
                max="300"
                step="5"
                class="w-16 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
                bind:value={documentOptions.wordSpacing}
                onchange={applyDocumentOptions}
              />
            </div>

            <div class="flex items-center justify-between gap-4 text-sm">
              <label for="typst-exercise-spacing-input"
                >Espacement entre les exercices</label
              >
              <input
                id="typst-exercise-spacing-input"
                type="number"
                min="0"
                max="6"
                step="0.1"
                class="w-16 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
                bind:value={documentOptions.exerciseSpacing}
                onchange={applyDocumentOptions}
              />
            </div>

            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                bind:checked={documentOptions.autoVerticalSpacing}
                onchange={applyDocumentOptions}
              />
              Gestion automatique des espaces verticaux
            </label>

            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                bind:checked={documentOptions.boldQuestionNumbers}
                onchange={applyDocumentOptions}
              />
              Numéros des questions en gras
            </label>

            <label
              class="flex items-center justify-between gap-4 text-sm"
              class:opacity-50={documentOptions.mergeExercises ||
                documentOptions.canMode}
            >
              Style des exercices
              <select
                class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
                bind:value={documentOptions.badgeStyle}
                disabled={documentOptions.mergeExercises ||
                  documentOptions.canMode}
                onchange={applyDocumentOptions}
              >
                {#each BADGE_STYLES as style}
                  <option value={style}>{BADGE_STYLE_LABELS[style]}</option>
                {/each}
              </select>
            </label>

            <div
              class="flex items-center justify-between gap-4 text-sm"
              class:opacity-50={documentOptions.mergeExercises}
            >
              <span>Couleur des titres</span>
              <div class="flex items-center gap-1.5">
                {#each BADGE_COLORS as color}
                  <button
                    type="button"
                    title={color.label}
                    aria-label={color.label}
                    aria-pressed={documentOptions.badgeColor === color.value}
                    disabled={documentOptions.mergeExercises}
                    class="h-6 w-6 rounded-full border-2 transition {documentOptions.badgeColor ===
                    color.value
                      ? 'border-coopmaths-action dark:border-coopmathsdark-action scale-110'
                      : 'border-transparent'}"
                    style="background-color: {color.css};"
                    onclick={() => {
                      documentOptions.badgeColor = color.value
                      applyDocumentOptions()
                    }}
                  ></button>
                {/each}
                <input
                  type="color"
                  title="Couleur personnalisée"
                  aria-label="Couleur personnalisée"
                  disabled={documentOptions.mergeExercises}
                  class="h-6 w-6 cursor-pointer rounded-full border-2 {isCustomBadgeColor
                    ? 'border-coopmaths-action dark:border-coopmathsdark-action scale-110'
                    : 'border-transparent'} bg-transparent p-0"
                  value={badgeColorHex}
                  oninput={(e) => {
                    documentOptions.badgeColor = `rgb("${e.currentTarget.value}")`
                    applyDocumentOptions()
                  }}
                />
              </div>
            </div>

            <!-- ------------------------------------------ page de garde -->
            <h4
              class="pt-2 text-xs font-semibold uppercase tracking-wide opacity-70 border-t border-coopmaths-canvas-dark dark:border-coopmathsdark-canvas-dark"
            >
              Page de garde
            </h4>

            <label class="flex items-center justify-between gap-4 text-sm">
              Modèle
              <select
                class="rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
                bind:value={documentOptions.coverPage.template}
                onchange={applyCoverTemplate}
              >
                {#each COVER_TEMPLATES as template}
                  <option value={template}>
                    {COVER_TEMPLATE_LABELS[template]}
                  </option>
                {/each}
              </select>
            </label>

            {#if coverPage.template !== 'aucune'}
              <p class="text-xs opacity-75">
                L'intitulé, la session, la matière, la durée et les consignes se
                modifient directement sur l'aperçu (bouton
                <i class="bx bx-edit"></i> en haut de la page de garde).
              </p>

              {#if coverPage.template === 'can'}
                <p class="text-xs opacity-75">
                  La durée, le nombre de questions et le score sur le total des
                  questions sont ajoutés automatiquement.
                </p>
              {:else}
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    bind:checked={documentOptions.coverPage.showBareme}
                    onchange={applyDocumentOptions}
                  />
                  Afficher le barème
                </label>

                {#if coverPage.showBareme}
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-sm">
                      <span>Barème</span>
                      <span class="text-xs opacity-70">
                        Total : {coverTotalPoints} pts
                      </span>
                    </div>
                    {#each coverPage.bareme as _points, index (index)}
                      <div class="flex items-center gap-2 text-sm">
                        <label class="grow" for="typst-points-{index}">
                          Exercice {index + 1}
                        </label>
                        <input
                          id="typst-points-{index}"
                          type="number"
                          step="0.5"
                          min="0"
                          class="w-16 rounded border-coopmaths-action bg-coopmaths-canvas dark:bg-coopmathsdark-canvas-dark py-0.5 text-sm"
                          bind:value={documentOptions.coverPage.bareme[index]}
                          onchange={applyDocumentOptions}
                        />
                        <button
                          type="button"
                          aria-label="Retirer l'exercice {index + 1} du barème"
                          class="text-coopmaths-action dark:text-coopmathsdark-action"
                          onclick={() => removeCoverBaremeRow(index)}
                        >
                          <i class="bx bx-x text-lg"></i>
                        </button>
                      </div>
                    {/each}
                    <button
                      type="button"
                      class="text-sm text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action"
                      onclick={resizeCoverBareme}
                    >
                      <i class="bx bx-sync"></i>
                      Reprendre les exercices de la fiche
                    </button>
                  </div>
                {/if}
              {/if}
            {/if}

            <p class="text-xs opacity-75">
              Ces réglages régénèrent le code Typst à partir des exercices : vos
              modifications manuelles du code seront perdues.
            </p>

            <button
              type="button"
              class="flex items-center gap-1 text-sm text-coopmaths-action hover:text-coopmaths-action-lightest dark:text-coopmathsdark-action dark:hover:text-coopmathsdark-action-lightest"
              onclick={resetDocumentOptions}
            >
              <i class="bx bx-reset"></i>
              Réinitialiser les réglages du document
            </button>
          </div>
        {/if}
        <div
          class="typst-editor-pane {isSettingsOpen
            ? 'hidden'
            : displayMode === 'code'
              ? 'w-full'
              : displayMode === 'split'
                ? 'w-1/2'
                : 'hidden'} min-h-0"
          bind:this={editorEl}
        ></div>
        <div
          class="typst-preview-pane {isSettingsOpen
            ? 'grow'
            : displayMode === 'preview'
              ? 'w-full'
              : displayMode === 'split'
                ? 'w-1/2'
                : 'hidden'} min-h-0 flex flex-col"
        >
          <!-- `isolate` : les pastilles de la palette de mise en page portent
               des z-index (jusqu'à z-30) qui, sans contexte d'empilement ici,
               les placeraient au-dessus des voisins de l'aperçu (panneau de
               diagnostics, volet Réglages). Chrome les rend inoffensives en
               les rognant (overflow), mais Safari leur laisse capter le survol
               et les clics hors du cadre : le bouton « Revenir à la dernière
               version qui compilait » se retrouvait sous une pastille
               invisible. -->
          <div class="relative isolate grow overflow-auto p-4">
            {#if isCompilerLoading}
              <div
                class="flex flex-col items-center gap-2 py-24 text-coopmaths-corpus dark:text-coopmathsdark-corpus"
              >
                <i class="bx bx-loader-alt bx-spin text-4xl"></i>
                <span class="text-sm">
                  {compilerFirstVisit
                    ? 'Chargement du compilateur Typst (première visite, ~30 Mo)…'
                    : 'Chargement du compilateur Typst…'}
                </span>
              </div>
            {:else if svgContent !== ''}
              {#if isCompiling}
                <div
                  class="absolute top-2 right-4 z-10 text-coopmaths-action dark:text-coopmathsdark-action"
                >
                  <i class="bx bx-loader-alt bx-spin text-2xl"></i>
                </div>
              {/if}
              <!-- le fond blanc des pages est dessiné dans le SVG (separatePages) -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                class="typst-svg-container relative mx-auto"
                title="Double-cliquez sur un exercice pour éditer son code"
                ondblclick={jumpToSourceFromClick}
              >
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html svgContent}
                {#if showOverlay && overlayWidgets.length > 0}
                  <TypstLayoutOverlay
                    widgets={overlayWidgets}
                    layoutValues={tasksLayoutValues}
                    insertions={insertionValues}
                    insertionsCorrection={insertionCorrectionValues}
                    header={headerValues}
                    cover={coverValues}
                    coverConsignes={coverConsignesValue}
                    coverTemplate={documentOptions.coverPage.template}
                    footerText={footerValue}
                    {documentColumns}
                    {questionCounts}
                    {staticExercises}
                    {nonEditableStaticExercises}
                    {nonEditableCorrections}
                    {figureZoomValues}
                    {figureAlignValues}
                    codeOverrides={codeOverrideValues}
                    codeOverridesCorrection={codeOverrideCorrectionValues}
                    codeOverridesCan={codeOverrideCanValues}
                    codeOverridesCanReponse={codeOverrideCanReponseValues}
                    exerciseCount={exercises.length}
                    {mergedExercises}
                    mergeExercisesEnabled={!documentOptions.mergeExercises &&
                      !documentOptions.canMode}
                    canMode={documentOptions.canMode}
                    onAdjustColumns={adjustColumns}
                    onAdjustGutter={adjustGutter}
                    onAdjustFigureZoom={adjustFigureZoom}
                    onSetFigureAlign={setFigureAlign}
                    onInsert={insertAfterExercise}
                    onUpdateInsertion={updateInsertion}
                    onDeleteInsertion={deleteInsertion}
                    onInsertCorrection={insertBeforeCorrection}
                    onUpdateInsertionCorrection={updateInsertionCorrection}
                    onDeleteInsertionCorrection={deleteInsertionCorrection}
                    onUpdateHeader={updateHeaderValue}
                    onUpdateCover={updateCoverValue}
                    onUpdateCoverConsignes={updateCoverConsignes}
                    onUpdateFooterText={updateFooterText}
                    onChangeQuestionCount={changeQuestionCount}
                    onDeleteExercise={deleteExercise}
                    onAddExercise={openAddExercise}
                    onMoveExercise={moveExercise}
                    onNewData={newDataForExercise}
                    onOpenSettings={openSettings}
                    onEditCode={openCodeEdit}
                    onEditCorrectionCode={openCorrectionCodeEdit}
                    onEditCanRow={openCanRowCodeEdit}
                    onToggleMergeBefore={toggleMergeBefore}
                    {writingLinesValues}
                    onSetWritingLines={setWritingLines}
                  />
                {/if}
              </div>
            {/if}
          </div>
        </div>
      </div>

      {#if diagnostics.length > 0}
        {@const isError = errorCount > 0}
        <div
          data-testid="typst-diagnostics"
          class="shrink-0 border-t {isError
            ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-100'
            : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100'}"
        >
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
            <button
              type="button"
              class="flex items-center gap-2 text-sm font-semibold"
              aria-expanded={!isDiagnosticsCollapsed}
              onclick={() => (isDiagnosticsCollapsed = !isDiagnosticsCollapsed)}
            >
              <i class="bx {isError ? 'bx-error-circle' : 'bx-error'} text-xl"
              ></i>
              {isError
                ? 'La fiche ne compile pas'
                : 'La fiche compile avec des remarques'}
              <span class="font-normal opacity-80">({diagnosticsSummary})</span>
              <i
                class="bx {isDiagnosticsCollapsed
                  ? 'bx-chevron-up'
                  : 'bx-chevron-down'} text-xl"
              ></i>
            </button>

            <div class="grow"></div>

            {#if isPreviewStale}
              <span class="text-xs opacity-80">
                <i class="bx bx-time-five"></i>
                L’aperçu ci-dessus est celui de la dernière compilation réussie{lastGoodAt !=
                null
                  ? ` (${lastGoodAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`
                  : ''}.
              </span>
            {/if}

            {#if isError && canRestoreLastGood}
              <button
                type="button"
                data-testid="typst-restore-last-good"
                class="flex items-center gap-1 rounded-lg border border-current px-2 py-1 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/60"
                title="Remplace le code par la dernière version qui compilait. Annulable avec Ctrl/Cmd + Z."
                onclick={restoreLastGoodCode}
              >
                <i class="bx bx-undo text-lg"></i>
                <!-- libellé dans un <span> : un nœud de texte nu dans un
                     conteneur flex forme une boîte anonyme, dont le survol et
                     le clic ne sont pas toujours rattachés au bouton -->
                <span>Revenir à la dernière version qui compilait</span>
              </button>
            {/if}
          </div>

          {#if !isDiagnosticsCollapsed}
            <ul class="max-h-52 overflow-auto px-4 pb-3 space-y-1.5">
              {#each diagnostics as diagnostic}
                <li
                  class="rounded border-l-4 {diagnostic.severity === 'error'
                    ? 'border-red-500'
                    : 'border-amber-500'} bg-white/60 px-3 py-2 dark:bg-black/25"
                >
                  <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    {#if diagnostic.line != null}
                      <button
                        type="button"
                        class="shrink-0 rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs hover:bg-black/20 dark:bg-white/15 dark:hover:bg-white/25"
                        title="Aller à cette ligne dans l’éditeur"
                        onclick={() => goToDiagnostic(diagnostic)}
                      >
                        ligne {diagnostic.line}
                      </button>
                    {:else if diagnostic.packageName != null}
                      <span
                        class="shrink-0 rounded bg-black/10 px-1.5 py-0.5 font-mono text-xs dark:bg-white/15"
                      >
                        paquet {diagnostic.packageName}
                      </span>
                    {/if}
                    <span class="text-sm">{diagnostic.message}</span>
                  </div>
                  {#if diagnostic.hint != null}
                    <p class="mt-1 text-xs opacity-90">
                      <i class="bx bx-bulb"></i>
                      {diagnostic.hint}
                    </p>
                  {/if}
                  {#if diagnostic.message !== diagnostic.original}
                    <details class="mt-1 text-xs opacity-70">
                      <summary class="cursor-pointer">Message d’origine</summary
                      >
                      <code class="font-mono break-all">{diagnostic.raw}</code>
                    </details>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  {#if isShortcutsOpen}
    <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onclick={(e) => {
        if (e.target === e.currentTarget) isShortcutsOpen = false
      }}
    >
      <div
        class="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-coopmaths-canvas-dark p-5 shadow-xl dark:bg-coopmathsdark-canvas-dark text-coopmaths-corpus dark:text-coopmathsdark-corpus"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2
            class="font-bold text-coopmaths-struct dark:text-coopmathsdark-struct"
          >
            Raccourcis clavier de l’éditeur
          </h2>
          <button
            type="button"
            aria-label="Fermer"
            onclick={() => (isShortcutsOpen = false)}
          >
            <i
              class="bx bx-x text-2xl text-coopmaths-action dark:text-coopmathsdark-action"
            ></i>
          </button>
        </div>
        <div class="grid gap-5 sm:grid-cols-2">
          {#each EDITOR_SHORTCUTS as group}
            <div>
              <h3
                class="mb-1.5 text-sm font-semibold text-coopmaths-struct dark:text-coopmathsdark-struct"
              >
                {group.title}
              </h3>
              <dl class="space-y-1 text-sm">
                {#each group.keys as [keys, label]}
                  <div class="flex items-baseline justify-between gap-3">
                    <dd class="opacity-90">{label}</dd>
                    <dt
                      class="shrink-0 rounded border border-current/30 bg-black/5 px-1.5 py-0.5 font-mono text-xs dark:bg-white/10"
                    >
                      {keys}
                    </dt>
                  </div>
                {/each}
              </dl>
            </div>
          {/each}
        </div>
        <p class="mt-4 text-xs opacity-75">
          L’éditeur reconnaît aussi les raccourcis habituels de déplacement et
          de sélection. Cliquez sur « ligne N » dans le panneau d’erreurs pour
          sauter directement à la ligne concernée.
        </p>
      </div>
    </div>
  {/if}

  {#if isAddExerciseOpen}
    <TypstAddExerciseModal
      onAdd={addExerciseToSheet}
      onClose={() => (isAddExerciseOpen = false)}
    />
  {/if}

  {#if settingsExerciseIndex !== null && settingsExercise != null}
    <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onclick={(e) => {
        if (e.target === e.currentTarget) settingsExerciseIndex = null
      }}
    >
      <div
        class="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-lg shadow-xl bg-coopmaths-canvas-dark dark:bg-coopmathsdark-canvas-dark"
      >
        {#key settingsExerciseIndex}
          <Settings
            exercice={settingsExercise}
            exerciceIndex={settingsExerciseIndex}
            inModal={true}
            on:settings={(event) => {
              if (settingsExerciseIndex !== null) {
                applyNewSettings(settingsExerciseIndex, event.detail)
              }
            }}
            on:clickSettings={() => (settingsExerciseIndex = null)}
          />
        {/key}
      </div>
    </div>
  {/if}

  {#if codeEditNum !== null}
    {@const num = codeEditNum}
    <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onclick={(e) => {
        if (e.target === e.currentTarget) codeEditNum = null
      }}
    >
      <div
        class="relative flex w-full max-w-2xl flex-col gap-3 rounded-lg bg-coopmaths-canvas-dark p-4 shadow-xl dark:bg-coopmathsdark-canvas-dark"
      >
        <h2 class="text-base font-semibold">
          {codeEditPart === 'correction'
            ? `Code Typst de la correction de l'exercice ${num}`
            : `Code Typst de l'exercice ${num}`}
        </h2>
        <p class="text-sm text-coopmaths-corpus dark:text-coopmathsdark-corpus">
          {#if codeEditPart === 'correction'}
            Modifiez le code ci-dessous : il remplacera la correction générée de
            cet exercice. Videz le champ pour revenir à la correction générée
            automatiquement.
          {:else}
            Modifiez le code ci-dessous : il remplacera l'énoncé généré de cet
            exercice (QR-code et numérotation continue des questions désactivés
            pour lui). Videz le champ pour revenir à l'énoncé généré
            automatiquement.
          {/if}
        </p>
        <textarea
          class="h-64 w-full rounded border border-gray-300 bg-coopmaths-canvas p-2 font-mono text-xs text-coopmaths-corpus dark:border-coopmathsdark-corpus-lightest dark:bg-coopmathsdark-canvas dark:text-coopmathsdark-corpus"
          bind:value={codeEditDraft}
          onkeydown={(e) => {
            if (e.key === 'Escape') codeEditNum = null
          }}
        ></textarea>
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded border border-coopmaths-action px-3 py-1 text-coopmaths-action hover:bg-coopmaths-action hover:text-white"
            onclick={copyExerciseCode}
          >
            Copier le code
          </button>
          <button
            type="button"
            class="rounded border border-coopmaths-action px-3 py-1 text-coopmaths-action hover:bg-coopmaths-action hover:text-white"
            onclick={() => copyExerciseCodeWithPreamble(num)}
          >
            Copier avec le préambule
          </button>
          {#if codeCopyStatus !== ''}
            <span
              class="text-xs text-coopmaths-corpus dark:text-coopmathsdark-corpus"
              >{codeCopyStatus}</span
            >
          {/if}
        </div>
        <div class="flex justify-between gap-2">
          <button
            type="button"
            class="px-3 py-1 hover:text-coopmaths-action"
            onclick={() => restoreGeneratedCode(num)}
          >
            Restaurer le code d'origine
          </button>
          <div class="flex gap-2">
            <button
              type="button"
              class="px-3 py-1 hover:text-coopmaths-action"
              onclick={() => (codeEditNum = null)}
            >
              Annuler
            </button>
            <button
              type="button"
              class="rounded bg-coopmaths-action px-3 py-1 text-white"
              onclick={() =>
                updateExerciseCode(num, codeEditDraft, codeEditPart)}
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if canRowEditNum !== null}
    {@const row = canRowEditNum}
    <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onclick={(e) => {
        if (e.target === e.currentTarget) canRowEditNum = null
      }}
    >
      <div
        class="relative flex w-full max-w-2xl flex-col gap-3 rounded-lg bg-coopmaths-canvas-dark p-4 shadow-xl dark:bg-coopmathsdark-canvas-dark"
      >
        <h2 class="text-base font-semibold">
          Code Typst de la ligne {row} du tableau
        </h2>
        <p class="text-sm text-coopmaths-corpus dark:text-coopmathsdark-corpus">
          Modifiez le code ci-dessous : il remplacera l'énoncé et la réponse
          générés de cette ligne. Videz un champ pour revenir à son contenu
          généré automatiquement.
        </p>
        <label class="flex flex-col gap-1 text-sm">
          Énoncé
          <textarea
            class="h-32 w-full rounded border border-gray-300 bg-coopmaths-canvas p-2 font-mono text-xs text-coopmaths-corpus dark:border-coopmathsdark-corpus-lightest dark:bg-coopmathsdark-canvas dark:text-coopmathsdark-corpus"
            bind:value={canRowEditEnonceDraft}
            onkeydown={(e) => {
              if (e.key === 'Escape') canRowEditNum = null
            }}
          ></textarea>
        </label>
        <label class="flex flex-col gap-1 text-sm">
          Réponse
          <textarea
            class="h-24 w-full rounded border border-gray-300 bg-coopmaths-canvas p-2 font-mono text-xs text-coopmaths-corpus dark:border-coopmathsdark-corpus-lightest dark:bg-coopmathsdark-canvas dark:text-coopmathsdark-corpus"
            bind:value={canRowEditReponseDraft}
            onkeydown={(e) => {
              if (e.key === 'Escape') canRowEditNum = null
            }}
          ></textarea>
        </label>
        <div class="flex justify-between gap-2">
          <button
            type="button"
            class="px-3 py-1 hover:text-coopmaths-action"
            onclick={() => restoreCanRowCode(row)}
          >
            Restaurer le contenu d'origine
          </button>
          <div class="flex gap-2">
            <button
              type="button"
              class="px-3 py-1 hover:text-coopmaths-action"
              onclick={() => (canRowEditNum = null)}
            >
              Annuler
            </button>
            <button
              type="button"
              class="rounded bg-coopmaths-action px-3 py-1 text-white"
              onclick={() =>
                updateCanRowCode(
                  row,
                  canRowEditEnonceDraft,
                  canRowEditReponseDraft,
                )}
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</main>

<style>
  .typst-svg-container {
    max-width: 900px;
  }
  .typst-svg-container :global(svg) {
    width: 100%;
    height: auto;
    display: block;
  }
</style>
