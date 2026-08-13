import { driver } from 'driver.js'
import { get } from 'svelte/store'
import 'driver.js/dist/driver.css'
import './tour.css'
import { darkMode, exercicesParams } from '../stores/generalStore'
import type { InterfaceParams } from '../types'

const TOUR_SEEN_KEY = 'mathalea-onboarding-tour-vue'
const DEMO_EXERCISE_ID = '3L11'
const DEMO_EXERCISE_2_ID = '4G20'

let originalExercicesParams: InterfaceParams[] | null = null
let demoExerciseIndex = -1

/**
 * `true` si la visite guidée a déjà été vue sur ce poste (localStorage).
 */
export function hasSeenTour(): boolean {
  try {
    return window.localStorage.getItem(TOUR_SEEN_KEY) === '1'
  } catch {
    // Stockage indisponible (navigation privée, quota…) : on considère
    // qu'elle a été vue pour ne pas ré-afficher la visite à chaque page.
    return true
  }
}

export function markTourSeen(): void {
  try {
    window.localStorage.setItem(TOUR_SEEN_KEY, '1')
  } catch {
    // Stockage indisponible : rien à faire
  }
}

function fillInput(input: HTMLInputElement, value: string): void {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

/**
 * Coche ou décoche une case du panneau de paramètres comme le ferait l'enseignant.
 * Ces cases réagissent à `change` et non à `input` ; on ne notifie rien quand la
 * case est déjà dans l'état voulu, pour ne pas régénérer l'exercice inutilement.
 */
function setCheckbox(selecteur: string, coche: boolean): void {
  const input = document.querySelector<HTMLInputElement>(selecteur)
  if (input === null || input.checked === coche) return
  input.checked = coche
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

/** Règle un champ numérique du panneau de paramètres (poids d'apparition). */
function setNumberInput(selecteur: string, value: string): void {
  const input = document.querySelector<HTMLInputElement>(selecteur)
  if (input === null) return
  fillInput(input, value)
}

/**
 * Laisse Svelte terminer son cycle de rendu (déclenché par l'action qui
 * vient de s'exécuter — saisie, clic sur un nœud du référentiel…) avant de
 * faire avancer la visite : driver.js capture l'élément cible de l'étape
 * suivante de façon synchrone, ce qui peut le faire pointer sur un nœud que
 * Svelte remplace juste après si on ne lui laisse pas ce délai.
 */
function moveNextAfterRender(driverObj: { moveNext: () => void }): void {
  setTimeout(() => driverObj.moveNext(), 50)
}

function restoreExercicesParams(): void {
  if (originalExercicesParams !== null) {
    exercicesParams.set(originalExercicesParams)
    originalExercicesParams = null
  }
}

/**
 * Étape 2 → 3 : simule la saisie de « 3L11 » dans le champ de recherche.
 */
function playSearchDemo(): void {
  const input = document.querySelector<HTMLInputElement>(
    '[data-tour="search-input"]',
  )
  if (input) fillInput(input, DEMO_EXERCISE_ID)
}

function clearSearchInput(): void {
  const input = document.querySelector<HTMLInputElement>(
    '[data-tour="search-input"]',
  )
  if (input) fillInput(input, '')
}

/**
 * Étape 3 → 4 : simule le clic sur le résultat « 3L11 » pour l'ajouter à la
 * feuille d'exercices. On mémorise l'index qu'aura ce nouvel exercice dans
 * `exercicesParams` (toujours ajouté en fin de liste) pour cibler ensuite
 * son panneau de paramètres.
 */
function playAddExerciseDemo(): void {
  demoExerciseIndex = get(exercicesParams).length
  const button = document.querySelector<HTMLButtonElement>(
    `[data-tour-id="${DEMO_EXERCISE_ID}"] button`,
  )
  button?.click()
}

/**
 * Étape 5 → 6 : règle le nombre de questions à 4, puis coche la première forme
 * de développement avec un poids de 3 et la deuxième avec un poids de 1, pour
 * illustrer concrètement le mécanisme (3 questions sous la forme 1, 1 question
 * sous la forme 2).
 */
function playFormeDeveloppementDemo(): void {
  const nbQuestionsInput = document.querySelector<HTMLInputElement>(
    `#settings-nb-questions-${demoExerciseIndex}`,
  )
  if (nbQuestionsInput) fillInput(nbQuestionsInput, '4')
  const liste = `#settings-formTextListe3-${demoExerciseIndex}`
  // 3L11 arrive réglé sur « Mélange », donc toutes les formes cochées : on ne
  // garde que les deux premières.
  for (const forme of [3, 4, 5, 6]) setCheckbox(`${liste}-${forme}`, false)
  setCheckbox(`${liste}-1`, true)
  setCheckbox(`${liste}-2`, true)
  // Le champ de poids n'est actif qu'une fois la case cochée.
  setNumberInput(`${liste}-1-poids`, '3')
}

/**
 * Cherche, parmi les boutons de nœuds du référentiel (menu de gauche —
 * niveaux, chapitres…), celui dont le libellé contient `text`. Ces boutons
 * portent un id `titre-liste-…` généré dynamiquement (position dans l'arbre,
 * dépend du tri courant) : on ne peut donc pas les cibler par id, mais leur
 * propre texte (hors enfants, rendus dans un `<ul>` frère) suffit.
 */
function findNodeButtonByText(text: string): Element | null {
  const buttons = document.querySelectorAll<HTMLButtonElement>(
    'button[id^="titre-liste-"]',
  )
  for (const button of buttons) {
    if (button.textContent?.includes(text)) return button
  }
  return null
}

function clickNodeByText(text: string): void {
  const button = findNodeButtonByText(text)
  if (button instanceof HTMLButtonElement) button.click()
}

/**
 * Étape « 4G20 » : simule le clic sur l'exercice pour l'ajouter, une fois le
 * niveau « Quatrième » puis le chapitre « Théorème de Pythagore » dépliés.
 */
function playChoisirExerciceParNiveauDemo(): void {
  const button = document.querySelector<HTMLButtonElement>(
    `[data-tour-id="${DEMO_EXERCISE_2_ID}"] button`,
  )
  button?.click()
}

/** Simule Ctrl+K (ou Cmd+K) pour ouvrir la modale « Ajouter un exercice ». */
function openAddExerciseShortcut(): void {
  window.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }),
  )
}

/** Simule la saisie « Pythagore » dans la modale Ctrl+K. */
function playPythagoreSearchDemo(): void {
  const input = document.querySelector<HTMLInputElement>(
    '[data-tour="add-exercise-search-input"]',
  )
  if (input) fillInput(input, 'Pythagore')
}

/** Simule Échap pour refermer la modale « Ajouter un exercice ». */
function closeAddExerciseModal(): void {
  window.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  )
}

/**
 * Lance la visite guidée de la page d'accueil (driver.js). La visite
 * démontre elle-même les actions (recherche, ajout, saisie) : l'utilisateur
 * n'a qu'à cliquer sur « Suivant ». Les exercices de démonstration ajoutés
 * sont retirés à la fin (quelle que soit la façon dont la visite se
 * termine).
 */
export function startTour(): void {
  originalExercicesParams = get(exercicesParams)
  demoExerciseIndex = -1

  const driverObj = driver({
    showProgress: true,
    progressText: '{{current}} / {{total}}',
    nextBtnText: 'Suivant',
    prevBtnText: 'Précédent',
    doneBtnText: 'Terminer',
    allowClose: true,
    overlayOpacity: 0.65,
    stagePadding: 6,
    waitForElement: 8000,
    smoothScroll: true,
    // driver.js anime les transitions entre étapes via requestAnimationFrame ;
    // dans un onglet en arrière-plan ou peu prioritaire (navigateur headless,
    // onglet non actif…), rAF peut être fortement throttlé et la transition
    // ne se termine alors jamais, laissant la visite figée sur l'étape
    // précédente. On désactive donc l'animation : chaque étape s'affiche
    // instantanément, sans dépendre du rythme des frames.
    animate: false,
    popoverClass: get(darkMode).isActive
      ? 'mathalea-tour-popover mathalea-tour-popover-dark'
      : 'mathalea-tour-popover',
    onDestroyed: () => {
      restoreExercicesParams()
      markTourSeen()
    },
    steps: [
      {
        popover: {
          title: 'Bienvenue sur MathALÉA',
          description:
            'MathALÉA génère des exercices de mathématiques à données aléatoires, prêts à imprimer, à vidéoprojeter ou à utiliser sur mobile. On cherche, on choisit les exercices à gauche&nbsp;; ils s’affichent ensuite à droite et on peut les paramétrer.',
        },
      },
      {
        element: '[data-tour="search-input"]',
        popover: {
          title: 'Rechercher un exercice',
          description:
            'Tapez un thème (« pythagore ») ou directement un identifiant d’exercice, par exemple <strong>3L11</strong>. Essayons&nbsp;!',
          side: 'right',
          align: 'start',
          onNextClick: (_element, _step, opts) => {
            playSearchDemo()
            moveNextAfterRender(opts.driver)
          },
        },
      },
      {
        element: `[data-tour-id="${DEMO_EXERCISE_ID}"]`,
        popover: {
          title: '3L11 — Simple distributivité',
          description:
            'Cliquez sur un résultat (ou appuyez sur Entrée) pour l’ajouter à votre feuille d’exercices, à droite.',
          side: 'right',
          align: 'start',
          onNextClick: (_element, _step, opts) => {
            playAddExerciseDemo()
            moveNextAfterRender(opts.driver)
          },
        },
      },
      {
        element: () =>
          document.querySelector(`#exercice${demoExerciseIndex}`) as Element,
        popover: {
          title: 'L’exercice sélectionné',
          description:
            'Chaque exercice ajouté s’affiche ici, avec son panneau de paramètres à droite&nbsp;: nombre de questions, niveau de difficulté…',
          side: 'left',
          align: 'start',
        },
      },
      {
        element: () =>
          document.querySelector(
            `#settings-formTextListe3-${demoExerciseIndex}`,
          ) as Element,
        popover: {
          title: 'Paramétrer finement un exercice',
          description:
            'Pour certains exercices, on choisit les variantes proposées en cochant des cases, et on règle leur poids d’apparition. Exemple&nbsp;: avec 4 questions, cocher la <strong>forme 1 avec un poids de 3</strong> et la <strong>forme 2</strong> donne trois quarts de questions sous une 1re forme et un quart de questions sous une autre forme.',
          side: 'left',
          align: 'start',
          onNextClick: (_element, _step, opts) => {
            playFormeDeveloppementDemo()
            clearSearchInput()
            moveNextAfterRender(opts.driver)
          },
        },
      },
      {
        element: () => findNodeButtonByText('Course aux nombres') as Element,
        popover: {
          title: 'Travailler les automatismes',
          description:
            'Le menu <strong>Course aux nombres</strong> propose des exercices pour s’entraîner à tous les automatismes sans calculatrice.',
          side: 'right',
          align: 'start',
          onNextClick: (_element, _step, opts) => {
            clickNodeByText('Quatrième')
            moveNextAfterRender(opts.driver)
          },
        },
      },
      {
        element: () => findNodeButtonByText('Quatrième') as Element,
        popover: {
          title: 'Une entrée par niveau',
          description:
            'Chaque niveau (Sixième, Cinquième…) se parcourt aussi directement&nbsp;: on y trouve des exercices d’application directe du cours, ainsi que des exercices de synthèse. Ouvrons <strong>Quatrième</strong>.',
          side: 'right',
          align: 'start',
          onNextClick: (_element, _step, opts) => {
            clickNodeByText('Pythagore')
            moveNextAfterRender(opts.driver)
          },
        },
      },
      {
        element: () => findNodeButtonByText('Pythagore') as Element,
        popover: {
          title: 'Un chapitre',
          description:
            'Chaque niveau se découpe en chapitres. Ouvrons <strong>Théorème de Pythagore</strong>.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: `[data-tour-id="${DEMO_EXERCISE_2_ID}"]`,
        popover: {
          title: '4G20 — Calculer une longueur avec Pythagore',
          description:
            'On retrouve ici les exercices du chapitre, chacun avec son propre identifiant (ici <strong>4G20</strong>). Cliquons pour l’ajouter à la feuille.',
          side: 'right',
          align: 'start',
          onNextClick: (_element, _step, opts) => {
            playChoisirExerciceParNiveauDemo()
            moveNextAfterRender(opts.driver)
          },
        },
      },
      {
        popover: {
          title: 'Un raccourci pour aller plus vite',
          description:
            'À tout moment, <strong>Ctrl+K</strong> ou <strong>Cmd+K</strong> ouvre une recherche avec aperçu des exercices. Essayons avec « Pythagore ».',
          onNextClick: (_element, _step, opts) => {
            openAddExerciseShortcut()
            // La modale se monte de façon asynchrone (juste après le
            // raccourci) : on attend qu'elle existe avant d'y saisir la
            // recherche.
            setTimeout(() => {
              playPythagoreSearchDemo()
              moveNextAfterRender(opts.driver)
            }, 100)
          },
        },
      },
      {
        element: () =>
          document.querySelector('[data-tour-exam^="dnb"]') as Element,
        popover: {
          title: 'Aperçus des exercices de brevet',
          description:
            'La recherche mélange exercices d’entraînement et sujets d’examen. Plus bas dans les résultats, chaque sujet de brevet s’affiche en aperçu, prêt à être ajouté à la feuille&nbsp;: pratique pour faire son choix.',
          side: 'top',
          align: 'center',
          onNextClick: (_element, _step, opts) => {
            closeAddExerciseModal()
            moveNextAfterRender(opts.driver)
          },
        },
      },
      {
        element: '[data-tour="export-buttons"]',
        popover: {
          title: 'Une fois la feuille prête',
          description:
            'Cinq boutons permettent de l’exploiter&nbsp;: <strong>Diaporama</strong> pour la présenter question par question, <strong>Vidéoprojection</strong> pour l’afficher au tableau, <strong>Lien élèves</strong> pour paramétrer un lien (interactif ou pas, correction ou pas...), <strong>Impression</strong> pour générer un PDF, et <strong>Plus d’exports</strong> pour les autres formats (Moodle, À la carte, AMC, Anki…).',
          side: 'bottom',
          align: 'end',
        },
      },
      {
        element: '[data-tour="help-button"]',
        popover: {
          title: 'Besoin d’aide plus tard ?',
          description:
            'Ce bouton rouvre cette visite guidée à tout moment, ainsi que d’autres liens utiles.',
          side: 'bottom',
          align: 'end',
        },
      },
    ],
  })

  driverObj.drive()
}
