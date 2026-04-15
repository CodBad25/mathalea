import { colorToLatexOrHTML } from '../lib/2d/colorToLatexOrHtml'
import { ObjetMathalea2D } from '../lib/2d/ObjetMathalea2D'
import { PointAbstrait, pointAbstrait } from '../lib/2d/PointAbstrait'
import { Polygone, polygone } from '../lib/2d/polygones'
import { tracePoint } from '../lib/2d/TracePoint'
import { orangeMathalea, vertMathalea } from '../lib/colors'
import { context } from './context'

/**
 * @author Rémi ANGOT
 * @param {number} x abscisse du point
 * @param {number} y ordonnée du point
 * @param {object} options over, out et click sont des objets pour le style css des évènements de la souris, radius, width, color, opacite, size, style sont les paramètres possibles pour la trace du point
 */
export class PointCliquable extends ObjetMathalea2D {
  point: PointAbstrait
  etat: boolean
  width: number
  style: string
  taille: number
  stringColor: string
  radius: number
  groupe: HTMLElement | null
  stopCliquable: () => void
  out: Partial<CSSStyleDeclaration>
  over: Partial<CSSStyleDeclaration>
  click: Partial<CSSStyleDeclaration>

  constructor(
    x: number,
    y: number,
    options: {
      over?: Partial<CSSStyleDeclaration>
      out?: Partial<CSSStyleDeclaration>
      click?: Partial<CSSStyleDeclaration>
      radius?: number
      width?: number
      color?: string
      opacite?: number
      size?: number
      style?: string
      taille?: number
      couleur?: string
    },
  ) {
    super()
    this.point = pointAbstrait(x, y)
    this.width = options.width ?? options.size ?? 1
    this.stringColor = options.color ?? 'black'
    this.style = options.style ?? 'x'
    this.taille = options.size ?? options.taille ?? 3
    this.radius = options.radius ?? 1
    this.groupe = null // il sera initialiser lorsque les exercices seront affichés.

    if (!options) options = {}
    this.out = options.out ?? { opacity: '0' }
    this.over = options.over ?? { opacity: '0.5' }
    this.click = options.click ?? { opacity: String(options.opacite) ?? '1' }
    this.etat = false // Pour récupérer si le point est affiché ou pas
    const gestionDeLaSouris = () => {
      document.removeEventListener('exercicesAffiches', gestionDeLaSouris)
      this.groupe = document.getElementById(`${this.id}`)
      const changeEtatPoint = (etat: boolean) => {
        this.etat = etat
      }
      const mouseOutEffect = () => {
        for (const key in this.out) {
          try {
            if (this.out[key] != null) this.groupe!.style[key] = this.out[key]
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error('Erreur inconnue')
            window.notify(
              err.message +
                `\nProblème pour modifier groupe.style.${key} sur ${this}`,
              { element: this, key },
            )
          }
        }
      }
      const mouseOverEffect = () => {
        for (const key in this.over) {
          try {
            if (this.over[key] != null) this.groupe!.style[key] = this.over[key]
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error('Erreur inconnue')
            window.notify(
              err.message +
                `\nProblème pour modifier groupe.style.${key} sur ${this}`,
              { element: this, key },
            )
          }
        }
      }
      const mouseClick = () => {
        if (this.etat && this.groupe) {
          // On désactive le point
          this.groupe.addEventListener('mouseover', mouseOverEffect)
          this.groupe.addEventListener('mouseout', mouseOutEffect)
          // On lui remet le style de out
          for (const key in this.out) {
            try {
              if (this.out[key] != null) this.groupe!.style[key] = this.out[key]
            } catch (error) {
              const err =
                error instanceof Error ? error : new Error('Erreur inconnue')
              window.notify(
                err.message +
                  `\nProblème pour modifier style.${key} sur ${this}`,
                { element: this, key },
              )
            }
          }
          this.etat = false
          changeEtatPoint(false)
        } else {
          // On désactive les listeners
          if (this.groupe) {
            this.groupe.removeEventListener('mouseover', mouseOverEffect)
            this.groupe.removeEventListener('mouseout', mouseOutEffect)
            // On applique le style de click
            for (const key in this.click) {
              try {
                if (this.click[key] != null)
                  this.groupe!.style[key] = this.click[key]
              } catch (error) {
                const err =
                  error instanceof Error ? error : new Error('Erreur inconnue')
                window.notify(
                  err.message +
                    `\nProblème pour modifier style.${key} sur ${this}`,
                  { element: this, key },
                )
              }
            }
            this.etat = true
          }
        }
      }

      // On initialise avec le style de out
      if (this.groupe) {
        for (const key in this.out) {
          try {
            if (this.out[key] != null) this.groupe!.style[key] = this.out[key]
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error('Erreur inconnue')
            window.notify(
              err.message +
                `\nProblème pour modifier style.${key} sur ${this.groupe}`,
              { element: this.groupe, key },
            )
          }
        }
        this.groupe.addEventListener('mouseover', mouseOverEffect)
        this.groupe.addEventListener('mouseout', mouseOutEffect)
        this.groupe.addEventListener('click', mouseClick)
      }
    }
    document.addEventListener('exercicesAffiches', gestionDeLaSouris)
    this.stopCliquable = () => {
      // On retire tous les listener en le remplaçant par un clone
      if (this.groupe) this.groupe.replaceWith(this.groupe.cloneNode(true))
    }
  }

  svg(coeff: number) {
    let code
    const trace = tracePoint(this.point, this.stringColor)
    trace.epaisseur = this.width ?? this.epaisseur ?? 1
    trace.taille = this.taille ?? 3
    trace.style = this.style ?? 'x'
    code = `<g id="${this.id}">\n`
    code += trace.svg(coeff) + '\n'
    // Le cercle est la zone d'effet pour les évènements
    // Comme fill est à none, il faut ajouter pointer-events="visible" cf https://www.smashingmagazine.com/2018/05/svg-interaction-pointer-events-property/
    code += `<circle cx="${this.point.xSVG(coeff)}" cy="${this.point.ySVG(coeff)}" r="${(this.radius ?? 1) * coeff}" fill="none" pointer-events="visible" />\n`
    code += '</g>'
    return code
  }

  tikz() {
    // PointCliquable n'a pas vocation à être utilisé en TikZ cependant, est-ce que ça peut être utile ?
    return ''
  }
}

export function pointCliquable(
  x: number,
  y: number,
  options: {
    over?: Partial<CSSStyleDeclaration>
    out?: Partial<CSSStyleDeclaration>
    click?: Partial<CSSStyleDeclaration>
    radius?: number
    width?: number
    color?: string
    opacite?: number
    size?: number
    style?: string
    taille?: number
    couleur?: string
  },
) {
  return new PointCliquable(x, y, options)
}

/**
 * @author Rémi ANGOT
 * @param {number} x abscisse du point
 * @param {number} y ordonnée du point
 * @param {object} options over, out et click sont des ojets pour le style css des évènements de la souris, radius, width, color, size, style sont les paramètres possibles pour la trace du point
 */
export class RectangleCliquable extends ObjetMathalea2D {
  bordure: Polygone
  rectangle: Polygone
  etat: boolean
  out: Partial<CSSStyleDeclaration>
  over: Partial<CSSStyleDeclaration>
  click: Partial<CSSStyleDeclaration>
  stringColor: string
  cliquable: boolean
  groupe: null | HTMLElement
  stopCliquable: () => void
  constructor(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options: {
      over?: Partial<CSSStyleDeclaration>
      out?: Partial<CSSStyleDeclaration>
      click?: Partial<CSSStyleDeclaration>
      couleur?: string
      cliquable?: boolean
      hachures?: boolean | string
      epaisseur?: number
      etat?: boolean
      couleurDeRemplissage?: string
      epaisseurDesHachures?: number
    },
  ) {
    super()
    const A = pointAbstrait(x1, y1)
    const B = pointAbstrait(x2, y1)
    const C = pointAbstrait(x2, y2)
    const D = pointAbstrait(x1, y2)
    this.rectangle = polygone(A, B, C, D)
    this.bordure = polygone(A, B, C, D)
    if (!options) options = {}
    this.out = options.out ?? { opacity: '0' }
    this.over = options.over ?? { opacity: '0.2' }
    this.click = options.click ?? { opacity: '1' }
    this.stringColor = options.couleur ?? orangeMathalea
    this.cliquable = options.cliquable !== undefined ? options.cliquable : true
    this.rectangle.hachures = options.hachures ?? false
    this.rectangle.couleurDesHachures = colorToLatexOrHTML('black')
    this.rectangle.epaisseurDesHachures = options.epaisseurDesHachures ?? 4
    this.bordure.epaisseur = options.epaisseur ?? 1
    this.etat = options.etat ?? false // Pour récupérer si le rectangle est cliqué ou pas
    this.groupe = null // il sera initialisé lorsque les exercices seront affichés.
    this.stopCliquable = () => {
      // On retire tous les listener en le remplaçant par un clone
      this.groupe!.replaceWith(this.groupe!.cloneNode(true))
    }
    const gestionDeLaSouris = () => {
      document.removeEventListener('exercicesAffiches', gestionDeLaSouris)
      const changeEtatPoint = (etat: boolean) => {
        this.etat = etat
      }
      if (this.groupe) {
        // On initialise avec le style de out ou de click suivant l'état
        for (const key in this.out) {
          try {
            const opacite = this.etat ? this.click[key] : this.out[key]
            if (opacite != null) this.groupe!.style[key] = opacite
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error('Erreur inconnue')
            window.notify(
              err.message +
                `\nProblème pour modifier style.${key} sur ${this.groupe}`,
              { element: this.groupe, key },
            )
          }
        }
      }
      const mouseOverEffect = () => {
        for (const key in this.over) {
          try {
            if (this.out[key] != null) this.groupe!.style[key] = this.out[key]
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error('Erreur inconnue')
            window.notify(
              err.message + `\nProblème pour modifier style.${key} sur ${this}`,
              { element: this, key },
            )
          }
        }
      }
      const mouseOutEffect = () => {
        for (const key in this.out) {
          try {
            if (this.out[key] != null) this.groupe!.style[key] = this.out[key]
          } catch (error) {
            const err =
              error instanceof Error ? error : new Error('Erreur inconnue')
            window.notify(
              err.message + `\nProblème pour modifier style.${key} sur ${this}`,
              { element: this, key },
            )
          }
        }
      }
      const mouseClick = () => {
        if (this.etat && this.groupe) {
          // On désactive le point
          this.groupe.addEventListener('mouseover', mouseOverEffect)
          this.groupe.addEventListener('mouseout', mouseOutEffect)
          // On lui remet le style de out
          for (const key in this.out) {
            try {
              if (this.out[key] != null) this.groupe.style[key] = this.out[key]
            } catch (error) {
              const err =
                error instanceof Error ? error : new Error('Erreur inconnue')
              window.notify(
                err.message +
                  `\nProblème pour modifier style.${key} sur ${this}`,
                { element: this, key },
              )
            }
          }
          this.etat = false
          changeEtatPoint(false)
        } else {
          // On désactive les listeners
          if (this.groupe) {
            this.groupe.removeEventListener('mouseover', mouseOverEffect)
            this.groupe.removeEventListener('mouseout', mouseOutEffect)
            // On applique le style de click
            for (const key in this.click) {
              try {
                if (this.click[key] != null)
                  this.groupe.style[key] = this.click[key]
              } catch (error) {
                const err =
                  error instanceof Error ? error : new Error('Erreur inconnue')
                window.notify(
                  err.message +
                    `\nProblème pour modifier style.${key} sur ${this}`,
                  { element: this, key },
                )
              }
            }
            this.etat = true
          }
        }
      }
      if (this.groupe && this.cliquable) {
        this.groupe.addEventListener('mouseover', mouseOverEffect)
        this.groupe.addEventListener('mouseout', mouseOutEffect)
        this.groupe.addEventListener('click', mouseClick)
      }
    }
    document.addEventListener('exercicesAffiches', gestionDeLaSouris)
  }

  svg(coeff: number) {
    let code
    this.rectangle.couleurDeRemplissage = colorToLatexOrHTML(
      this.stringColor ?? 'black',
    )
    this.rectangle.epaisseur = 0
    code = `<g id="rectangle${this.id}">\n`
    code += this.rectangle.svg(coeff) + '\n'
    code += '</g>'
    code += this.bordure.svg(coeff)
    return code
  }

  tikz() {
    if (this.etat)
      this.bordure.couleurDeRemplissage = colorToLatexOrHTML(this.stringColor)
    this.bordure.couleurDesHachures = colorToLatexOrHTML('black')
    this.bordure.hachures = this.rectangle.hachures
    return this.bordure.tikz()
  }
}

export function rectangleCliquable(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: {
    over?: Partial<CSSStyleDeclaration>
    out?: Partial<CSSStyleDeclaration>
    click?: Partial<CSSStyleDeclaration>
    couleur?: string
    cliquable?: boolean
    hachures?: boolean | string
    epaisseur?: number
    etat?: boolean
    couleurDeRemplissage?: string
    epaisseurDesHachures?: number
  },
) {
  return new RectangleCliquable(x1, y1, x2, y2, options)
}

export class FractionCliquable extends ObjetMathalea2D {
  constructor(
    x: number,
    y: number,
    unites: number,
    denominateur: number,
    options: {
      longueur?: number
      ecart?: number
      hauteur?: number
      liste1?: number[]
      liste2?: number[]
      couleur1?: string
      couleur2?: string
      hachures1?: boolean
      hachures2?: boolean
      couleur?: string
      cliquable?: boolean
    } = {},
  ) {
    super()
    this.objets = []
    if (!options) options = {}
    const longueur = options.longueur ?? 4
    const ecart = options.ecart ?? 1
    const hauteur = options.hauteur ?? 1
    const liste1 = options.liste1 ?? []
    const liste2 = options.liste2 ?? []
    let couleur1 = options.couleur1 ?? orangeMathalea
    let couleur2 = options.couleur2 ?? vertMathalea
    if (!context.isHtml) {
      couleur1 = options.couleur1 ?? 'gray'
      couleur2 = options.couleur2 ?? 'lightgray'
    }
    const hachures1 = options.hachures1 ? 'north east lines' : false
    const hachures2 = options.hachures2 ? 'dots' : false
    const couleur =
      options.couleur ?? (liste1.length === 0 ? couleur1 : 'white')
    const cliquable = options.cliquable !== undefined ? options.cliquable : true
    let O
    for (let i = 0; i < unites; i++) {
      O = pointAbstrait(x + i * (longueur + ecart), y)
      for (let j = 0; j < denominateur; j++) {
        if (liste1.includes(i * denominateur + j + 1)) {
          this.objets.push(
            rectangleCliquable(
              O.x + (j * longueur) / denominateur,
              y,
              O.x + ((j + 1) * longueur) / denominateur,
              y + hauteur,
              { cliquable, etat: true, couleur: couleur1, hachures: hachures1 },
            ),
          )
        } else if (liste2.includes(i * denominateur + j + 1)) {
          this.objets.push(
            rectangleCliquable(
              O.x + (j * longueur) / denominateur,
              y,
              O.x + ((j + 1) * longueur) / denominateur,
              y + hauteur,
              { cliquable, etat: true, couleur: couleur2, hachures: hachures2 },
            ),
          )
        } else {
          this.objets.push(
            rectangleCliquable(
              O.x + (j * longueur) / denominateur,
              y,
              O.x + ((j + 1) * longueur) / denominateur,
              y + hauteur,
              { cliquable, couleur, etat: false },
            ),
          )
        }
      }
    }
  }
}

export function fractionCliquable(
  x: number,
  y: number,
  unites: number,
  denominateur: number,
  options: {
    longueur?: number
    ecart?: number
    hauteur?: number
    liste1?: number[]
    liste2?: number[]
    couleur1?: string
    couleur2?: string
    hachures1?: boolean
    hachures2?: boolean
    couleur?: string
    cliquable?: boolean
  },
) {
  return new FractionCliquable(x, y, unites, denominateur, options)
}
