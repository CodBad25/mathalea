import { createList } from '../../lib/format/lists'
import { lampeMessage } from '../../lib/format/message'
import {
  ecritureAlgebrique,
  ecritureAlgebriqueSauf1,
  ecritureParentheseSiNegatif,
  rienSi1,
} from '../../lib/outils/ecritures'
import {
  miseEnEvidence,
  texteEnCouleurEtGras,
} from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import FractionEtendue from '../../modules/FractionEtendue'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = "Calculer la distance d'un point à un plan"

export const dateDePublication = '26/01/2025' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag

export const uuid = '3c811'

export const refs = {
  'fr-fr': ['TSG2-27'],
  'fr-ch': [],
}

/**
 *
 * @author Stéphane Guyon
 */
export default class NomExercice extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      let texte = ''
      let texteCorr = ''

      const xA = randint(-6, 6, 0)
      const yA = randint(-6, 6, 0)
      const zA = randint(-6, 6, 0)

      const a = randint(-5, 5, 0)
      const b = randint(-5, 5, 0)
      const c = randint(-5, 5, 0)

      let d = randint(-8, 8)
      const valeurPlanEnA = () => a * xA + b * yA + c * zA + d
      if (valeurPlanEnA() === 0) {
        d += randint(-4, 4, 0)
      }

      const denom = a * a + b * b + c * c
      const tIntersection = new FractionEtendue(-valeurPlanEnA(), denom)
      const xH = new FractionEtendue(xA * denom - a * valeurPlanEnA(), denom)
      const yH = new FractionEtendue(yA * denom - b * valeurPlanEnA(), denom)
      const zH = new FractionEtendue(zA * denom - c * valeurPlanEnA(), denom)
      const distanceAH = Math.abs(valeurPlanEnA()) / Math.sqrt(denom)

      texte =
        "Dans un repère orthonormé de l'espace, on considère le point $A$ de coordonnées "
      texte += `$A(${xA} ; ${yA} ; ${zA})$ et le plan $\\mathcal{P}$  d'équation cartésienne : `
      texte += `$${rienSi1(a)}x ${ecritureAlgebriqueSauf1(b)} y ${ecritureAlgebriqueSauf1(c)} z ${ecritureAlgebrique(d)} = 0$.<br>`
      texte += `Déterminer la valeur approchée, arrondie au centième, de la distance du point $A$ au plan $\\mathcal{P}$ .<br>`

      const normal = `${texteEnCouleurEtGras('Vecteur normal au plan :', 'black')}<br>A partir de l'équation cartésienne du plan $\\mathcal{P}$, on en déduit que le vecteur $\\vec{n}\\begin{pmatrix}${a}\\\\${b}\\\\${c}\\end{pmatrix}$ est un vecteur normal du plan $\\mathcal{P}$.<br>`

      const droiteNormale = `${texteEnCouleurEtGras('Représentation paramétrique de la droite orthogonale au plan $\\mathcal{P}$ passant par le point $A$ :', 'black')}<br>
      On cherche une représentation paramétrique de la droite $(d)$, orthogonale au plan $\\mathcal{P}$ et passant par le point $A(${xA} ; ${yA} ; ${zA})$.
      Elle possède comme vecteur directeur vecteur $\\vec{n}\\begin{pmatrix}${a}\\\\${b}\\\\${c}\\end{pmatrix}$. 
      On obtient alors : <br>  $(d) :\\left\\{ \\begin{array}{l} x = ${xA} ${ecritureAlgebriqueSauf1(a)} t \\\\ y = ${yA} ${ecritureAlgebriqueSauf1(b)} t \\quad (t\\in\\mathbb{R}) \\\\ z = ${zA} ${ecritureAlgebriqueSauf1(c)} t \\end{array} \\right.$<br>`

      let intersection = `${texteEnCouleurEtGras('Coordonnées du point $H$ intersection entre la droite $(d)$ et la plan $\\mathcal{P}$ :', 'black')}<br>`
      intersection += `La droite $(d)$ étant orthogonale au plan $\\mathcal{P}$, on sait qu'ils admettent un unique point commun $H$.<br>
      Le point $H(x_H,y_H,z_H)$ appartient au plan $\\mathcal{P}$ et à la droite $(d)$ si et seulement si il existe des réels $(x_H,y_H,z_H,t)$ tels que : <br>`
      intersection += `$\\begin{cases}x_H = ${xA} ${ecritureAlgebriqueSauf1(a)} t \\\\ y_H = ${yA} ${ecritureAlgebriqueSauf1(b)} t \\\\ z_H = ${zA} ${ecritureAlgebriqueSauf1(c)} t \\\\ ${rienSi1(a)}x_H ${ecritureAlgebriqueSauf1(b)} y_H ${ecritureAlgebriqueSauf1(c)} z_H ${ecritureAlgebrique(d)} = 0\\end{cases}$<br>`
      intersection += `En remplaçant $x_H$, $y_H$ et $z_H$ dans la quatrième équation, on obtient : <br>`
      intersection += `$${rienSi1(a)}(${xA} ${ecritureAlgebriqueSauf1(a)} t) ${ecritureAlgebriqueSauf1(b)}(${yA} ${ecritureAlgebriqueSauf1(b)} t) ${ecritureAlgebriqueSauf1(c)}(${zA} ${ecritureAlgebriqueSauf1(c)} t) ${ecritureAlgebrique(d)} = 0$<br>`
      intersection += `$\\iff (${a * a}+${b * b}+${c * c})t ${ecritureAlgebrique(valeurPlanEnA())} = 0$ <br>$\\iff t=${tIntersection.texFractionSimplifiee}$<br>`

      intersection += `En remplaçant $t$ par $${tIntersection.texFractionSimplifiee}$ dans la représentation paramétrique de la droite $(d)$, on obtient : `
      intersection += `$\\begin{cases}x_H = ${xA} ${ecritureAlgebrique(a)} \\times ${tIntersection.texFSP} \\\\\\\\ y_H = ${yA} ${ecritureAlgebrique(b)} \\times ${tIntersection.texFSP} \\\\\\\\ z_H = ${zA} ${ecritureAlgebrique(c)} \\times ${tIntersection.texFSP} \\end{cases} \\iff $`
      intersection += `$\\begin{cases} x_H = ${xH.texFractionSimplifiee} \\\\\\\\ y_H = ${yH.texFractionSimplifiee} \\\\\\\\ z_H = ${zH.texFractionSimplifiee} \\end{cases}$.<br>`

      let distance = `${texteEnCouleurEtGras('Distance $AH$ :', 'black')}<br>`
      const dx = new FractionEtendue(-a * valeurPlanEnA(), denom)
      const dy = new FractionEtendue(-b * valeurPlanEnA(), denom)
      const dz = new FractionEtendue(-c * valeurPlanEnA(), denom)
      distance +=
        'Pour calculer la distance entre les points $A$ et $H$, on calcule la norme du vecteur $\\overrightarrow{AH}$ :<br>'
      distance +=
        '$ AH=\\vert\\vert\\overrightarrow{AH}\\vert\\vert =\\sqrt{(x_H - x_A)^2 + (y_H - y_A)^2 + (z_H - z_A)^2}$.<br>'
      distance += `On a $\\overrightarrow{AH}\\begin{pmatrix} ${xH.texFractionSimplifiee} ${ecritureAlgebrique(-xA)} \\\\\\\\ ${yH.texFractionSimplifiee} ${ecritureAlgebrique(-yA)} \\\\\\\\ ${zH.texFractionSimplifiee} ${ecritureAlgebrique(-zA)} \\end{pmatrix}$`
      distance += `donc $\\overrightarrow{AH}\\begin{pmatrix}${dx.texFractionSimplifiee} \\\\\\\\ ${dy.texFractionSimplifiee} \\\\\\\\ ${dz.texFractionSimplifiee} \\end{pmatrix} $.<br>`
      distance += `On en déduit que : <br>`

      distance += ` $AH=\\sqrt{\\left(${dx.texFractionSimplifiee}\\right)^2 + \\left(${dy.texFractionSimplifiee}\\right)^2 + \\left(${dz.texFractionSimplifiee}\\right)^2}  \\approx ${texNombre(distanceAH, 2)}$`
      let appartient = `${texteEnCouleurEtGras("Vérification que $A$ n'appartient pas au plan $\\mathcal{P}$  :", 'black')}<br>`
      appartient += `On remplace les coordonénes du point $A$ dans l'équation du plan et on calcule $${a} \\times ${ecritureParentheseSiNegatif(xA)}  ${ecritureAlgebrique(b)} \\times ${ecritureParentheseSiNegatif(yA)}  ${ecritureAlgebrique(c)} \\times ${ecritureParentheseSiNegatif(zA)}  ${ecritureAlgebrique(d)} = ${valeurPlanEnA()} \\neq 0$.<br>`
      appartient += `Donc le point $A$ n'appartient pas au plan $\\mathcal{P}$ .<br>`
      texteCorr = lampeMessage({
        titre: 'Méthode de résolution :',
        texte:
          "Pour calculer la distance du point $A$ au plan $\\mathcal{P}$, nous allons d'abord vérifier que le point $A$ n'appartient pas au plan (sinon, la distance est nulle).<br>S'il n'appartient pas, on cherche une représentation paramétrique de la droite $(\\Delta)$ orthogonale au plan $\\mathcal{P}$ passant par le point $A$. De là, on calcule les coordonnées du point H intersection de (Δ) avec P. La distance recherchée est la longueur AH.",
        couleur: 'black',
      })

      texteCorr += createList({
        items: [appartient, normal, droiteNormale, intersection, distance],
        style: 'fleches',
      })
      texteCorr += `<br>La valeur approchée au centième de la distance entre le point $A$ et le plan $\\mathcal{P}$ est donc $${miseEnEvidence(
        `AH  \\approx ${texNombre(distanceAH, 2)}`,
      )}$. `
      // = \\dfrac{${valeurAbsolue}}{\\sqrt{${denom}}}

      if (this.questionJamaisPosee(i, texte)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }

    listeQuestionsToContenu(this)
  }
}
