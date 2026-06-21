import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { polygone } from '../../lib/2d/polygones'
import { homothetie } from '../../lib/2d/transformations'
import { labelPoint } from '../../lib/2d/textes'
import { choisitLettresDifferentes } from '../../lib/outils/aleatoires'
import { choice, shuffle } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const titre =
  'Calculer une longueur avec le théorème de Thalès en configuration papillon'
export const dateDePublication = '20/06/2026'

export const uuid = 'e4b81'

export const refs = {
  'fr-fr': ['1A-G03-6'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

type Cote = 'BD' | 'BC' | 'HD' | 'AC'

/**
 * Calculer une longueur dans une configuration de Thalès en papillon.
 * @author Stéphane Guyon
 */
export default class LongueurAvecThalesPapillonQcm extends ExerciceQcmA {
  private appliquerLesValeurs(
    bd: number,
    bc: number,
    hd: number,
    ac: number,
    coteCherche: Cote,
  ) {
    const [nomA, nomH, nomB, nomD, nomC] = choisitLettresDifferentes(5)
    const nomsCotes: Record<Cote, string> = {
      BD: `${nomB}${nomD}`,
      BC: `${nomB}${nomC}`,
      HD: `${nomH}${nomD}`,
      AC: `${nomA}${nomC}`,
    }
    const longueurs: Record<Cote, number> = { BD: bd, BC: bc, HD: hd, AC: ac }
    const formules: Record<
      Cote,
      [premierFacteur: Cote, secondFacteur: Cote, diviseur: Cote]
    > = {
      BD: ['BC', 'HD', 'AC'],
      BC: ['BD', 'AC', 'HD'],
      HD: ['BD', 'AC', 'BC'],
      AC: ['BC', 'HD', 'BD'],
    }
    const [premierFacteur, secondFacteur, diviseur] = formules[coteCherche]
    const valeurCorrecte = longueurs[coteCherche]
    const candidatsDistracteurs = shuffle([
      (longueurs[premierFacteur] * longueurs[diviseur]) /
        longueurs[secondFacteur],
      (longueurs[secondFacteur] * longueurs[diviseur]) /
        longueurs[premierFacteur],
      longueurs[premierFacteur] * longueurs[secondFacteur],
      valeurCorrecte + 1,
      valeurCorrecte + 2,
      valeurCorrecte + 3,
    ])
    const valeursDejaUtilisees = new Set([texNombre(valeurCorrecte, 2)])
    const distracteurs = candidatsDistracteurs.filter((valeur) => {
      const valeurTex = texNombre(valeur, 2)
      if (valeur <= 0 || valeursDejaUtilisees.has(valeurTex)) return false
      valeursDejaUtilisees.add(valeurTex)
      return true
    })

    this.reponses = [valeurCorrecte, ...distracteurs.slice(0, 3)].map(
      (valeur) => `$${texNombre(valeur, 2)}\\text{ cm}$`,
    )

    const pointB = pointAbstrait(0, 0, nomB, 'above')
    const pointC = pointAbstrait(5, 0, nomC, 'below right')
    const pointA = pointAbstrait(4, 3, nomA, 'above right')
    const rapportHomothetie = -bd / bc
    const pointH = homothetie(pointA, pointB, rapportHomothetie, nomH)
    const pointD = homothetie(pointC, pointB, rapportHomothetie, nomD)
    pointH.positionLabel = 'below left'
    pointD.positionLabel = 'above left'
    const coteInutile = choice([`${nomB}${nomA}`, `${nomB}${nomH}`])
    const longueurInutile = randint(5, 15)
    const grandTriangle = polygone([pointA, pointB, pointC])
    const petitTriangle = polygone([pointH, pointB, pointD])
    const objets = [
      grandTriangle,
      petitTriangle,
      labelPoint(pointA, pointH, pointB, pointD, pointC),
    ]
    const figure = mathalea2d(
      Object.assign({ scale: 0.7 }, fixeBordures(objets)),
      objets,
    )
    const donnees = (['BD', 'BC', 'HD', 'AC'] as Cote[])
      .filter((cote) => cote !== coteCherche)
      .map((cote) => `$${nomsCotes[cote]}=${longueurs[cote]}\\text{ cm}$`)
      .join(' ; ')

    this.enonce = `La figure suivante n'est pas à l'échelle.<br>${figure}
$${nomH}$, $${nomB}$ et $${nomA}$ sont alignés.<br>
$${nomD}$, $${nomB}$ et $${nomC}$ sont alignés.<br>
Les droites $(${nomH}${nomD})$ et $(${nomA}${nomC})$ sont parallèles.<br>
On donne ${donnees} et $${coteInutile}=${longueurInutile}\\text{ cm}$.<br>
Quelle est la longueur du segment $[${nomsCotes[coteCherche]}]$ ?`

    this.correction = `Les points $${nomH}$, $${nomB}$, $${nomA}$ et $${nomD}$, $${nomB}$, $${nomC}$ sont alignés dans le même ordre, et les droites $(${nomH}${nomD})$ et $(${nomA}${nomC})$ sont parallèles.<br>
D'après le théorème de Thalès :
$\\dfrac{${nomsCotes.BD}}{${nomsCotes.BC}}=\\dfrac{${nomsCotes.HD}}{${nomsCotes.AC}}$.<br>
<br>On en déduit que $${nomsCotes[coteCherche]}=\\dfrac{${nomsCotes[premierFacteur]}\\times ${nomsCotes[secondFacteur]}}{${nomsCotes[diviseur]}}=\\dfrac{${longueurs[premierFacteur]}\\times ${longueurs[secondFacteur]}}{${longueurs[diviseur]}}=${miseEnEvidence(`${texNombre(valeurCorrecte, 2)}\\text{ cm}`)}$.`
  }

  versionAleatoire = () => {
    const rapport = choice([2, 3, 4])
    const bd = randint(2, 5)
    let hd: number
    do {
      hd = randint(2, 6)
    } while (hd === bd)
    this.appliquerLesValeurs(
      bd,
      rapport * bd,
      hd,
      rapport * hd,
      choice<Cote>(['BD', 'BC', 'HD', 'AC']),
    )
  }

  constructor() {
    super()
    this.options = { vertical: false, ordered: false }
    this.nbQuestions = 1
    this.besoinFormulaireCaseACocher = false
    this.besoinFormulaire4CaseACocher = false
    this.versionAleatoire()
  }
}
