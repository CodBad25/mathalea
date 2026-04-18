import { repere } from '../../../lib/2d/reperes'
import { texteParPosition } from '../../../lib/2d/textes'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { Spline, spline } from '../../../lib/mathFonctions/Spline'
import { choice } from '../../../lib/outils/arrayOutils'
import {
  miseEnEvidence,
  texteEnCouleurEtGras,
} from '../../../lib/outils/embellissements'
import { context } from '../../../modules/context'
import { mathalea2d } from '../../../modules/mathalea2d'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
import { bleuMathalea } from '../../../lib/colors'
export const dateDePublication = '26/10/2023'
export const interactifReady = true
export const interactifType = 'mathLive'
export const titre = 'Lire des antécédents graphiquement'

/**
 * @author Gilles MORA passage en qcm avec Claude ia
  *

*/
export const uuid = '0e1c6'

export const refs = {
  'fr-fr': ['can3F12'],
  'fr-ch': ['1mF1-17'],
}
type Noeud = {
  x: number
  y: number
  deriveeGauche: number
  deriveeDroit: number
  isVisible: boolean
}
export default class AntecedentSpline extends ExerciceSimple {
  spline: Spline | undefined
  constructor() {
    super()
    this.versionQcmDisponible = true
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.optionsDeComparaison = { suiteDeNombres: true }
    this.formatChampTexte = KeyboardType.clavierEnsemble
  }

  nouvelleVersion() {
    if (context.isAmc) this.versionQcm = false
    const noeuds1: Noeud[] = [
      { x: -4, y: -1, deriveeGauche: 0, deriveeDroit: 0, isVisible: true },
      { x: -3, y: 0, deriveeGauche: 1, deriveeDroit: 1, isVisible: true },
      { x: -2, y: 1, deriveeGauche: 0, deriveeDroit: 0, isVisible: true },
      { x: -1, y: 0, deriveeGauche: -1, deriveeDroit: -1, isVisible: true },
      { x: 0, y: -1, deriveeGauche: -1, deriveeDroit: -1, isVisible: true },
      { x: 2, y: -2, deriveeGauche: -1, deriveeDroit: -1, isVisible: true },
      { x: 3, y: -3, deriveeGauche: 0, deriveeDroit: 0, isVisible: true },
      { x: 4, y: -2, deriveeGauche: 1, deriveeDroit: 1, isVisible: true },
      { x: 5, y: -1, deriveeGauche: 0, deriveeDroit: 0, isVisible: true },
    ]
    const noeuds2: Noeud[] = [
      { x: -4, y: 0, deriveeGauche: 0, deriveeDroit: 0, isVisible: true },
      { x: -3, y: 1, deriveeGauche: 1, deriveeDroit: 1, isVisible: true },
      { x: -2, y: 2, deriveeGauche: 0, deriveeDroit: 0, isVisible: true },
      { x: -1, y: 1, deriveeGauche: -1, deriveeDroit: -1, isVisible: true },
      { x: 0, y: 0, deriveeGauche: -1, deriveeDroit: -1, isVisible: true },
      { x: 2, y: -1, deriveeGauche: 0, deriveeDroit: 0, isVisible: true },
      { x: 3, y: 0, deriveeGauche: 2, deriveeDroit: 2, isVisible: true },
      { x: 4, y: 1, deriveeGauche: 0, deriveeDroit: 0, isVisible: true },
      { x: 5, y: 0, deriveeGauche: -1, deriveeDroit: -1, isVisible: true },
      { x: 6, y: -1, deriveeGauche: 0, deriveeDroit: 0, isVisible: true },
    ]
    const mesFonctions = [noeuds1, noeuds2] //, noeuds2
    function aleatoiriseCourbe(listeFonctions: Noeud[][]) {
      const coeffX = choice([-1, 1]) // symétries ou pas
      const coeffY = choice([-1, 1])
      const deltaX = randint(-2, +2) // translations
      const deltaY = randint(-1, 1) // randint(-2, +2)
      const choix = choice(listeFonctions)
      return choix.map((noeud: Noeud) =>
        Object({
          x: (noeud.x + deltaX) * coeffX,
          y: (noeud.y + deltaY) * coeffY,
          deriveeGauche: noeud.deriveeGauche * coeffX * coeffY,
          deriveeDroit: noeud.deriveeDroit * coeffX * coeffY,
          isVisible: noeud.isVisible,
        }),
      )
    }
    let bornes = { xMin: 0, xMax: 0, yMin: 0, yMax: 0 }
    const o = texteParPosition('O', -0.3, -0.3, 1, 'black', 1, 'milieu')
    const nuage = aleatoiriseCourbe(mesFonctions)
    const theSpline = spline(nuage)
    this.spline = theSpline
    bornes = theSpline.trouveMaxes()
    const repere1 = repere({
      xMin: bornes.xMin - 1,
      xMax: bornes.xMax + 1,
      yMin: bornes.yMin - 1,
      yMax: bornes.yMax + 1,
      grilleX: false,
      grilleY: false,
      grilleSecondaire: true,
      grilleSecondaireYDistance: 1,
      grilleSecondaireXDistance: 1,
      grilleSecondaireYMin: bornes.yMin - 1,
      grilleSecondaireYMax: bornes.yMax + 1,
      grilleSecondaireXMin: bornes.xMin - 1,
      grilleSecondaireXMax: bornes.xMax + 1,
    })
    const courbe1 = theSpline.courbe({
      epaisseur: 1.5,
      ajouteNoeuds: true,
      optionsNoeuds: { color: bleuMathalea, taille: 2, style: 'x', epaisseur: 2 },
      color: bleuMathalea,
    })
    const objetsEnonce = [repere1, courbe1]
    const nbAntecedentsEntiersMaximum = theSpline.nombreAntecedentsMaximum(
      bornes.yMin,
      bornes.yMax,
      true,
      true,
    )

    const nombreAntecedentCherches1 = choice([
      randint(1, nbAntecedentsEntiersMaximum),
      randint(0, nbAntecedentsEntiersMaximum),
      randint(1, nbAntecedentsEntiersMaximum),
    ])
    let y1 = theSpline.trouveYPourNAntecedents(
      nombreAntecedentCherches1,
      bornes.yMin - 1,
      bornes.yMax + 1,
      true,
      true,
    )
    if (y1 == null) {
      window.notify(
        'Dans can3F12, Spline.trouveYPourNAntecedent fait encore des siennes je choisis une valeur intermédiaire',
        {},
      )
      y1 = Math.round((bornes.yMin + bornes.yMax) / 2)
    }
    if (y1 === false) {
      window.notify(
        "Dans can3F12 trouveYPourNAntecedents n'a pas trouvé d'antécédent",
        {},
      )
      return
    }
    const solutions1 = theSpline.solve(y1)
    let reponse1

    const graphique = mathalea2d(
      Object.assign(
        { pixelsParCm: 30, scale: 0.65, style: 'margin: auto' },
        {
          xmin: bornes.xMin - 1,
          ymin: bornes.yMin - 1,
          xmax: bornes.xMax + 1,
          ymax: bornes.yMax + 1,
        },
      ),
      objetsEnonce,
      o,
    ) // fixeBordures(objetsEnonce))
    if (this.versionQcm) {
      reponse1 =
        !solutions1 || solutions1.length === 0
          ? '$\\emptyset$'
          : `$\\{${solutions1.join('\\,;\\,')}\\}$`
    } else {
      reponse1 =
        !solutions1 || solutions1.length === 0
          ? '\\emptyset'
          : `${solutions1.join(';')}`
    }
    this.reponse = reponse1
    this.question = this.versionQcm
      ? `Voici la représentation graphique d'une fonction $f$ : <br><br>` +
        graphique +
        '<br>'
      : `Déterminer les antécédents éventuels de $${y1}$ par la fonction $f$.<br>` +
        graphique

    if (this.interactif && !this.versionQcm) {
      this.question +=
        "<br>Écrire les antécédents séparés par des points-virgules (saisir $\\emptyset$ s'il n'y en a pas).<br>"
      this.question += 'Antécédent(s) : '
    }
    if (this.versionQcm) {
      this.question += `L'ensemble des antécédents de $${y1}$ est : `
    }

    this.correction = `Déterminer les antécédents de $${y1}$ revient à déterminer les nombres qui ont pour image $${y1}$.<br>
    On part de $${y1}$ sur l'axe des ordonnées et on lit les antécédents (éventuels) sur l'axe des abscisses.<br>`
    if (!solutions1 || solutions1.length === 0) {
      this.correction += `Il n'y en a pas. <br> $${miseEnEvidence(y1)}$ ${texteEnCouleurEtGras("n'a pas d'antécédent par $\\boldsymbol{f}$")}.`
    } else {
      this.correction += `On en trouve $${solutions1.length}$ : $${miseEnEvidence(solutions1.join('\\,;\\,'))}$.`
    }
    if (!solutions1 || solutions1.length === 0) {
      // Cas : y1 n'a pas d'antécédent
      // Distracteurs : confusion avec y1 lui-même, avec 0, ou ensemble vide mal écrit
      const autreY =
        theSpline.y.find((val) => Math.abs(val - y1) > 0.5) ?? y1 + 1
      this.distracteurs = [
        `$\\{${y1}\\}$`, // Confusion : met y1 comme antécédent de lui-même
        `$\\{0\\}$`, // Réponse "au hasard" classique
        `$\\{${autreY}\\}$`, // Une autre valeur d'ordonnée de la courbe
        `$\\{0\\,;\\,${y1}\\}$`,
      ]
    } else if (solutions1.length === 1) {
      // Cas : 1 seul antécédent
      const autreY =
        theSpline.y.find((val) => val !== y1 && !solutions1.includes(val)) ??
        y1 + 1
      this.distracteurs = [
        `$\\{${y1}\\}$`, // Confusion image/antécédent
        `$\\emptyset$`, // Pense qu'il n'y en a pas
        `$\\{${solutions1[0]}\\,;\\,${autreY}\\}$`, // L'antécédent correct + une valeur incorrecte
      ]
    } else if (solutions1.length === 2) {
      const autreY =
        theSpline.y.find((val) => val !== y1 && !solutions1.includes(val)) ??
        y1 + 1
      this.distracteurs = [
        `$\\{${solutions1[0]}\\}$`, // Un seul des deux antécédents
        `$\\{${solutions1[0]}\\,;\\,${autreY}\\}$`, // Un antécédent correct + une valeur incorrecte
        `$\\{${solutions1[1]}\\}$`, // L'autre antécédent seul
      ]
    } else if (solutions1.length === 3) {
      const autreY =
        theSpline.y.find((val) => val !== y1 && !solutions1.includes(val)) ??
        y1 + 1
      this.distracteurs = [
        `$\\{${solutions1[0]}\\,;\\,${solutions1[1]}\\}$`, // Seulement 2 des 3 antécédents
        `$\\{${solutions1[0]}\\,;\\,${solutions1[1]}\\,;\\,${autreY}\\}$`, // 2 bons + 1 mauvais
        `$\\{${solutions1[1]}\\,;\\,${solutions1[2]}\\}$`, // Les 2 autres antécédents
      ]
    } else if (solutions1.length === 4) {
      const autreY =
        theSpline.y.find((val) => val !== y1 && !solutions1.includes(val)) ??
        y1 + 1
      this.distracteurs = [
        `$\\{${solutions1[0]}\\,;\\,${solutions1[1]}\\,;\\,${solutions1[2]}\\}$`, // 3 des 4 antécédents
        `$\\{${solutions1[0]}\\,;\\,${solutions1[1]}\\,;\\,${autreY}\\}$`, // 2 bons + 1 mauvais
        `$\\{${solutions1[1]}\\,;\\,${solutions1[2]}\\,;\\,${solutions1[3]}\\}$`, // 3 autres antécédents
      ]
    }
  }
}
