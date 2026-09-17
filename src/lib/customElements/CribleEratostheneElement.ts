import { context } from '../../modules/context'
import type { IExercice } from '../types'
import MathaleaCustomElement, {
  registerMathaleaCustomElement,
} from './MathaleaCustomElement'
import { STYLE_SELECT } from './stylesFormulaires'

type Diviseur = 2 | 3 | 5 | 7

export type CribleEratostheneOptions = {
  id?: string
  numeroExercice?: number
  questionIndex?: number
  diviseur?: Diviseur
}

const DIVISEURS: Diviseur[] = [2, 3, 5, 7]
const COULEURS: Record<Diviseur, string> = {
  2: '#2563eb',
  3: '#16a34a',
  5: '#ea580c',
  7: '#9333ea',
}

function estDiviseur(value: number): value is Diviseur {
  return DIVISEURS.includes(value as Diviseur)
}

function grilleLatex(): string {
  const lignes = Array.from({ length: 10 }, (_, ligne) =>
    Array.from({ length: 10 }, (_, colonne) => ligne * 10 + colonne + 1).join(
      ' & ',
    ),
  )
  return `\\begin{center}\n\\renewcommand{\\arraystretch}{1.35}\n\\begin{tabular}{|*{10}{c|}}\n\\hline\n${lignes.join(' \\\\\n\\hline\n')} \\\\\n\\hline\n\\end{tabular}\n\\end{center}`
}

function grilleTypst(): string {
  const cases = Array.from({ length: 100 }, (_, index) => `[${index + 1}]`)
  return `#table(columns: 10, inset: 6pt, stroke: 0.5pt, ${cases.join(', ')})`
}

/** Support visuel pour présenter le crible d'Ératosthène en classe. */
export class CribleEratostheneElement extends MathaleaCustomElement {
  static readonly elementTag = 'crible-eratosthene'

  private diviseur: Diviseur | null = null
  private cellules: HTMLButtonElement[] = []
  private selecteur: HTMLSelectElement | null = null
  private boutonRejouer: HTMLButtonElement | null = null
  private boutonAnnuler: HTMLButtonElement | null = null
  private temporisateur: number | null = null
  private numeroAnime = 0
  private animationEnCours: Diviseur | null = null
  private diviseursColories = new Map<Diviseur, Set<number>>()

  static create(options: CribleEratostheneOptions = {}): string {
    if (context.isTypst)
      return `<mathalea-typst>${grilleTypst()}</mathalea-typst>`
    if (!context.isHtml) return grilleLatex()
    const diviseur = estDiviseur(Number(options.diviseur))
      ? (Number(options.diviseur) as Diviseur)
      : 2
    return super.create({
      ...options,
      diviseur,
      id:
        options.id ??
        `${CribleEratostheneElement.elementTag}Ex${options.numeroExercice ?? 0}Q${options.questionIndex ?? 0}`,
    })
  }

  connectedCallback() {
    const diviseur = Number(this.getAttribute('diviseur'))
    this.diviseur = estDiviseur(diviseur) ? diviseur : null
    this.construireInterface()
  }

  disconnectedCallback() {
    this.annulerAnimation()
  }

  render() {
    return ''
  }

  private construireInterface() {
    this.innerHTML = ''
    this.className = 'crible-eratosthene'
    const style = document.createElement('style')
    style.textContent = `
      .crible-eratosthene { display: block; max-width: 36rem; margin: 1rem auto; font-family: sans-serif; }
      .crible-eratosthene__commandes { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; margin-bottom: .8rem; }
      .crible-eratosthene__grille { display: grid; grid-template-columns: repeat(10, minmax(2rem, 1fr)); border-top: 1px solid #64748b; border-left: 1px solid #64748b; }
      .crible-eratosthene__case { aspect-ratio: 1; border: 0; border-right: 1px solid #64748b; border-bottom: 1px solid #64748b; background: white; color: #111827; font: inherit; cursor: default; transition: background-color .2s, color .2s; }
      .crible-eratosthene__case--coloree { color: #111827; font-weight: 700; }
      @media (max-width: 34rem) { .crible-eratosthene__case { font-size: .8rem; } }
    `
    this.appendChild(style)

    const commandes = document.createElement('div')
    commandes.className = 'crible-eratosthene__commandes'
    this.selecteur = document.createElement('select')
    this.selecteur.className = `${STYLE_SELECT} w-full md:w-auto focus:border-coopmaths-action-lightest dark:focus:border-coopmathsdark-action-lightest`
    this.selecteur.setAttribute('aria-label', 'Choisir la consigne')
    const choixInitial = document.createElement('option')
    choixInitial.value = ''
    choixInitial.textContent = 'Colorier les multiples de…'
    choixInitial.selected = this.diviseur === null
    this.selecteur.appendChild(choixInitial)
    DIVISEURS.forEach((diviseur) => {
      const option = document.createElement('option')
      option.value = String(diviseur)
      option.textContent = `Colorier les multiples de ${diviseur}`
      option.selected = diviseur === this.diviseur
      this.selecteur?.appendChild(option)
    })
    this.selecteur.addEventListener('change', () => {
      const valeur = Number(this.selecteur?.value)
      if (estDiviseur(valeur)) this.lancerAnimation(valeur)
    })
    commandes.appendChild(this.selecteur)

    this.boutonRejouer = this.creerBouton('Rejouer', () =>
      this.diviseur === null
        ? undefined
        : this.lancerAnimation(this.diviseur, true),
    )
    this.boutonAnnuler = this.creerBouton('Annuler', () =>
      this.annulerAnimation(true),
    )
    const boutonReinitialiser = this.creerBouton('Tout réinitialiser', () =>
      this.reinitialiser(),
    )
    const classeBouton =
      'inline-flex items-center px-3 py-2 bg-coopmaths-action dark:bg-coopmathsdark-action text-coopmaths-canvas dark:text-coopmathsdark-canvas font-medium text-sm rounded shadow-md hover:bg-coopmaths-action-lightest dark:hover:bg-coopmathsdark-action-lightest focus:bg-coopmaths-action-lightest dark:focus:bg-coopmathsdark-action-lightest focus:outline-none transition'
    this.boutonRejouer.className = classeBouton
    this.boutonAnnuler.className = classeBouton
    boutonReinitialiser.className = classeBouton
    this.afficherBoutons(false, false)
    commandes.append(
      this.boutonRejouer,
      this.boutonAnnuler,
      boutonReinitialiser,
    )
    this.appendChild(commandes)

    const grille = document.createElement('div')
    grille.className = 'crible-eratosthene__grille'
    this.cellules = Array.from({ length: 100 }, (_, index) => {
      const cellule = document.createElement('button')
      cellule.type = 'button'
      cellule.className = 'crible-eratosthene__case'
      cellule.textContent = String(index + 1)
      cellule.setAttribute('aria-label', String(index + 1))
      grille.appendChild(cellule)
      return cellule
    })
    this.appendChild(grille)
  }

  private creerBouton(label: string, action: () => void) {
    const bouton = document.createElement('button')
    bouton.type = 'button'
    bouton.textContent = label
    bouton.addEventListener('click', action)
    return bouton
  }

  private lancerAnimation(diviseur: Diviseur, rejouer = false) {
    this.annulerAnimation()
    this.diviseur = diviseur
    if (!rejouer && this.diviseursColories.has(diviseur)) {
      this.animationEnCours = diviseur
      this.afficherBoutons(true, true)
      return
    }
    this.animationEnCours = diviseur
    this.numeroAnime = 0
    if (!this.diviseursColories.has(diviseur)) {
      this.diviseursColories.set(diviseur, new Set())
    }
    if (rejouer) {
      const nombresColories = this.diviseursColories.get(diviseur) ?? new Set()
      this.diviseursColories.delete(diviseur)
      this.diviseursColories.set(diviseur, nombresColories)
      for (let nombre = diviseur; nombre <= 100; nombre += diviseur) {
        this.diviseursColories.get(diviseur)?.delete(nombre)
        this.actualiserCellule(nombre)
      }
    }
    this.afficherBoutons(false, true)
    this.animerProchainMultiple(diviseur)
  }

  private animerProchainMultiple(diviseur: Diviseur) {
    const multiples = Array.from(
      { length: Math.floor(100 / diviseur) },
      (_, index) => (index + 1) * diviseur,
    )
    if (this.numeroAnime >= multiples.length) {
      this.afficherBoutons(true, true)
      return
    }
    const nombre = multiples[this.numeroAnime++]
    this.diviseursColories.get(diviseur)?.add(nombre)
    this.actualiserCellule(nombre)
    this.temporisateur = window.setTimeout(
      () => this.animerProchainMultiple(diviseur),
      110,
    )
  }

  private actualiserCellule(nombre: number) {
    const cellule = this.cellules[nombre - 1]
    if (!cellule) return
    const couleurs = [...this.diviseursColories.entries()]
      .filter(([, nombres]) => nombres.has(nombre))
      .map(([diviseur]) => `${COULEURS[diviseur]}55`)
      .reverse()
    cellule.style.background =
      couleurs.length === 0
        ? 'white'
        : couleurs
            .map((couleur) => `linear-gradient(${couleur}, ${couleur})`)
            .join(', ')
    cellule.classList.toggle(
      'crible-eratosthene__case--coloree',
      couleurs.length > 0,
    )
  }

  private annulerAnimation(effacer = false) {
    if (this.temporisateur !== null) {
      window.clearTimeout(this.temporisateur)
      this.temporisateur = null
    }
    if (effacer && this.animationEnCours !== null) {
      const diviseur = this.animationEnCours
      for (let nombre = diviseur; nombre <= 100; nombre += diviseur) {
        this.diviseursColories.get(diviseur)?.delete(nombre)
        this.actualiserCellule(nombre)
      }
      this.diviseursColories.delete(diviseur)
      this.animationEnCours = null
      this.numeroAnime = 0
      if (this.selecteur) this.selecteur.value = ''
      this.afficherBoutons(false, false)
    }
  }

  private afficherBoutons(rejouer: boolean, annuler: boolean) {
    if (this.boutonRejouer)
      this.boutonRejouer.style.visibility = rejouer ? 'visible' : 'hidden'
    if (this.boutonAnnuler)
      this.boutonAnnuler.style.visibility = annuler ? 'visible' : 'hidden'
  }

  private reinitialiser() {
    this.annulerAnimation()
    this.diviseursColories.clear()
    for (let nombre = 1; nombre <= 100; nombre++) {
      this.actualiserCellule(nombre)
    }
    this.diviseur = null
    this.animationEnCours = null
    this.numeroAnime = 0
    if (this.selecteur) this.selecteur.value = ''
    this.afficherBoutons(false, false)
  }
}

export function addCribleEratosthene(
  exercice: IExercice,
  questionIndex: number,
  options: Omit<
    CribleEratostheneOptions,
    'numeroExercice' | 'questionIndex'
  > = {},
): string {
  return CribleEratostheneElement.create({
    ...options,
    numeroExercice: exercice.numeroExercice,
    questionIndex,
  })
}

registerMathaleaCustomElement(CribleEratostheneElement)
