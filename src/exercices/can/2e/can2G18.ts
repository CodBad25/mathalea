import { point } from '../../../lib/2d/PointAbstrait'
import { repere } from '../../../lib/2d/reperes'
import { representantNomme } from '../../../lib/2d/representantVecteur'
import { segment } from '../../../lib/2d/segmentsVecteurs'
import { texteParPosition } from '../../../lib/2d/textes'
import { vecteur } from '../../../lib/2d/Vecteur'
import { handleAnswers } from '../../../lib/interactif/gestionInteractif'
import { remplisLesBlancs } from '../../../lib/interactif/questionMathLive'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { mathalea2d } from '../../../modules/mathalea2d'
import { listeQuestionsToContenu, randint } from '../../../modules/outils'
import Exercice from '../../Exercice'

export const titre =
  'Lire les coordonnées d’un vecteur représenté dans un repère'
export const interactifReady = true
export const interactifType = 'mathLive'

// Les exports suivants sont optionnels mais au moins la date de publication semble essentielle
export const dateDePublication = '29/06/2022' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag
// export const dateDeModifImportante = '14/02/2022' // Une date de modification importante au format 'jj/mm/aaaa' pour affichage temporaire d'un tag

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora modifié Stéphan Grignon (titre, vecteur colonne, noms vecteur)

 */
export const uuid = '8a0ce'

export const refs = {
  'fr-fr': ['can2G18'],
  'fr-ch': [],
}
export default class LectureGraphiqueVecteurRepere extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    let texte,
      texteCorr,
      xa,
      ya,
      k1,
      k2,
      o,
      r1,
      A,
      B,
      vAB,
      xmin,
      xmax,
      ymin,
      ymax,
      nomvAB,
      AB
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const nomVecteur = ['u', 'v', 'w', 'AB', 'HG', 'KL']
      const vec = choice(nomVecteur)
      xa = randint(-2, 2)
      ya = randint(-2, 2)
      k1 = randint(-6, 6, 0)
      k2 = randint(-6, 6)
      A = point(xa, ya)
      B = point(xa + k1, ya + k2)
      xmin = Math.min(A.x, B.x, -1) - 1
      ymin = Math.min(A.y, B.y, -1) - 1
      xmax = Math.max(A.x, B.x, 1) + 1
      ymax = Math.max(A.y, B.y, 1) + 1
      AB = segment(A, B, 'blue', '->')
      AB.epaisseur = 2
      vAB = vecteur(A, B)
      o = texteParPosition('O', -0.3, -0.3, 0, 'black', 1)
      nomvAB = representantNomme(vAB, A, `${vec}`, 1.5, 'blue')
      r1 = repere({
        xMin: xmin,
        xMax: xmax,
        xUnite: 1,
        yMin: ymin,
        yMax: ymax,
        yUnite: 1,
        thickHauteur: 0.2,
        xLabelMin: xmin + 1,
        xLabelMax: xmax - 1,
        yLabelMax: ymax - 1,
        yLabelMin: ymin + 1,
        axeXStyle: '->',
        axeYStyle: '->',
        yLabelDistance: 1,
        yLabelEcart: 0.5,
        grilleSecondaire: true,
        grilleSecondaireYDistance: 1,
        grilleSecondaireXDistance: 1,
        grilleSecondaireYMin: ymin,
        grilleSecondaireYMax: ymax,
        grilleSecondaireXMin: xmin,
        grilleSecondaireXMax: xmax,
      })

      texte = `Lire les coordonnées du vecteur $\\overrightarrow{${vec}}$.<br><br>`
      texte += mathalea2d(
        {
          xmin,
          xmax,
          ymin,
          ymax,
          style: 'margin: auto',
          pixelsParCm: 30,
          scale: 0.75,
        },
        r1,
        o,
        AB,
        nomvAB,
      )
      texte += ''

      handleAnswers(this, i, {
        bareme: (listePoints) => [Math.min(listePoints[0], listePoints[1]), 1],
        champ1: { value: k1 },
        champ2: { value: k2 },
      })
      if (this.interactif) {
        texte +=
          `<br>$\\overrightarrow{${vec}}$` +
          remplisLesBlancs(
            this,
            i,
            '\\begin{pmatrix}%{champ1}\\\\\\\\%{champ2}\\end{pmatrix}',
          )
      }

      texteCorr = `En partant de l'origine  du vecteur pour aller à son extrémité, on fait un déplacement de $${k1}$ unité(s) horizontalement et $${k2}$ unité(s) verticalement.<br>
        Les coordonnées du vecteur sont donc : $\\overrightarrow{${vec}}\\begin{pmatrix}${miseEnEvidence(`${k1}`)}\\\\\\\\${miseEnEvidence(`${k2}`)}\\end{pmatrix}$.`

      this.reponse = xa

      if (this.questionJamaisPosee(i, xa, ya, k1, k2)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
    this.canEnonce = texte // 'Compléter'
  }
}
