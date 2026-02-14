
import { createList } from '../../lib/format/lists'
import { ecritureAlgebrique, ecritureAlgebriqueSauf1, ecritureParentheseSiNegatif, rienSi1 } from '../../lib/outils/ecritures'
import { miseEnEvidence, texteEnCouleurEtGras } from '../../lib/outils/embellissements'
import FractionEtendue from '../../modules/FractionEtendue'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  "Déterminer le projeté orthogonal d'un point sur une droite."

export const dateDePublication = '26/01/2025' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag

export const uuid = 'd5251'

export const refs = {
  'fr-fr': ['TSG2-43'],
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

      // Point A
      const xA = randint(-6, 6, 0)
      const yA = randint(-6, 6, 0)
      const zA = randint(-6, 6, 0)
 
      // Vecteurs directeurs u et v non nuls et non colinéaires
      const k = randint(-5, 5, [0,-1,1])
      const ux = randint(-5, 5, 0)
      const uy = randint(-5, 5, 0)
      const uz = randint(-5, 5, 0)

      // Point H
      const xH = xA + ux*k
      const yH = yA + uy*k
      const zH = zA + uz*k
      const nx=uy-uz  
      const ny=uz-ux
      const nz=ux-uy
      const xM = xH+ nx
      const yM = yH+ny
      const zM = zH+nz
      const xB=xA+ux
      const yB=yA+uy
      const zB=zA+uz
      const valeurt = new FractionEtendue(ux * xM + uy * yM + uz * zM-(ux*xA+uy*yA+uz*zA),ux * ux + uy * uy + uz * uz)
      const abscisseH =new FractionEtendue(xA * (ux * ux + uy * uy + uz * uz) + ux * (ux * xM + uy * yM + uz * zM-(ux*xA+uy*yA+uz*zA)),ux * ux + uy * uy + uz * uz)
      const ordonneeH =new FractionEtendue(yA * (ux * ux + uy * uy + uz * uz) + uy * (ux * xM + uy * yM + uz * zM-(ux*xA+uy*yA+uz*zA)),ux * ux + uy * uy + uz * uz)
      const coteH =new FractionEtendue(zA * (ux * ux + uy * uy + uz * uz) + uz * (ux * xM + uy * yM + uz * zM-(ux*xA+uy*yA+uz*zA)),ux * ux + uy * uy + uz * uz) 
      texte = 'Dans un repère orthonormé de l\'espace, on considère les points $A$ , $B$  et $M$de coordonnées respectives : '
texte+=`$A(${xA} ; ${yA} ; ${zA})$ , $B(${xB} ; ${yB} ; ${zB})$ et $M(${xM} ; ${yM} ; ${zM})$ .<br>`
texte+=`Déterminer les coordonnées du point $H$ projeté orthogonal du point $M$ sur la droite $(AB)$ .<br>`

let ortho=''
ortho=` ${texteEnCouleurEtGras('Les vecteurs $\\overrightarrow{AB}$ et $\\overrightarrow{MH}$ sont orthogonaux :')} <br>On calcule les coordonnées du vecteur $\\overrightarrow{AB}\\begin{pmatrix}${xB}${ecritureAlgebrique(-xA)} \\\\${yB}${ecritureAlgebrique(-yA)} \\\\${zB}${ecritureAlgebrique(-zA)}\\end{pmatrix}$ d'où $\\overrightarrow{AB}\\begin{pmatrix}${ux} \\\\ ${uy} \\\\ ${uz}\\end{pmatrix}$ .<br>`
ortho +=`On calcule les coordonnées du vecteur $\\overrightarrow{MH} \\begin{pmatrix}x  ${ecritureAlgebrique(-xM)} \\\\ y  ${ecritureAlgebrique(-yM)} \\\\ z  ${ecritureAlgebrique(-zM)}\\end{pmatrix}$.`
ortho +=`<br>Le vecteur $\\overrightarrow{AB}$ est orthogonal au vecteur $\\overrightarrow{MH}$, leur produit scalaire est donc nul.<br>`
ortho +=`Donc : <br>$\\begin{aligned}\\phantom{\\iff}&\\overrightarrow{MH} \\cdot \\overrightarrow{AB} = 0\\\\
\\iff &(x ${ecritureAlgebrique(-xM)}) \\times ${ecritureParentheseSiNegatif(ux)} + (y ${ecritureAlgebrique(-yM)}) \\times ${ecritureParentheseSiNegatif(uy)} + (z ${ecritureAlgebrique(-zM)}) \\times ${ecritureParentheseSiNegatif(uz)} = 0\\\\
\\iff &${rienSi1(ux)}  x  ${ecritureAlgebriqueSauf1(uy)} y  ${ecritureAlgebriqueSauf1(uz)} z  ${ecritureAlgebrique(-(ux * xM + uy * yM + uz * zM))}=0\\quad(1)\\end{aligned}$ <br>`
let pointH=''
pointH=`${texteEnCouleurEtGras('Le point $H$ appartient à la droite $(AB)$.')}<br>`
pointH +=`Pour utiliser que le point $H$ appartient à la droite $(AB)$ , on détermine une représentation paramétrique de cette droite : <br>`
pointH +=`$(AB):\\left\\{ \\begin{array}{l} x = ${xA}  ${ecritureAlgebriqueSauf1(ux)} t \\\\ y = ${yA}  ${ecritureAlgebriqueSauf1(uy)} t \\quad (t\\in\\mathbb{R}) \\\\ z = ${zA}  ${ecritureAlgebriqueSauf1(uz)} t \\end{array} \\right.$ <br>`

      texteCorr =
        'Soit $x_H$, $y_H$ et $z_H$ des réels tels que les coordonnées du point $H$ soient $H(x_H;y_H;z_H)$.<br>' 
texteCorr +='<br>Par définition du projeté orthogonal, on déduit deux informations :'
+ createList({items :[ortho,pointH], style: 'fleches'})

texteCorr +=`${texteEnCouleurEtGras('<br>Synthèse des deux éléments précédents :')} <br>`
texteCorr +=`$H\\in(AB)\\cap\\mathcal{P}$. La droite $(AB)$ étant orthogonale au plan $\\mathscr{P}$, il existe un unique point $H$ solution. <br>`
texteCorr +=`$H(x_H,y_H,z_H)\\in(AB)\\cap\\mathcal{P}$ si et seulement s'il existe $t\\in\\mathbb{R}$ tel que : <br>`
texteCorr +=`$\\begin{cases}
x_H = ${xA}  ${ecritureAlgebriqueSauf1(ux)} t \\\\ y_H = ${yA}  ${ecritureAlgebriqueSauf1(uy)} t \\\\ z_H = ${zA}  ${ecritureAlgebriqueSauf1(uz)} t \\\\
${rienSi1(ux)}  x_H + ${rienSi1(uy)} y_H + ${rienSi1(uz)} z_H  ${ecritureAlgebrique(-(ux * xM + uy * yM + uz * zM))}=0\\end{cases}$ <br>`
texteCorr +=`En remplaçant $x_H$, $y_H$ et $z_H$ dans la dernière équation, on obtient : <br>`
texteCorr +=`$\\begin{aligned}
&${rienSi1(ux)}  (${xA}  ${ecritureAlgebriqueSauf1(ux)}  t) + ${rienSi1(uy)}  (${yA}  ${ecritureAlgebriqueSauf1(uy)}  t) + ${rienSi1(uz)}  (${zA}  ${ecritureAlgebriqueSauf1(uz)}  t)  ${ecritureAlgebrique(-(ux * xM + uy * yM + uz * zM))}=0\\\\
\\iff &${ux*xA}  ${ecritureAlgebriqueSauf1(ux*ux)}t  ${ecritureAlgebrique(uy*yA)} ${ecritureAlgebriqueSauf1(uy*uy)} t ${ecritureAlgebrique(uz*zA)} ${ecritureAlgebriqueSauf1(uz*uz)}t ${ecritureAlgebrique(-(ux * xM + uy * yM + uz * zM))}=0\\\\
\\iff &${ux*ux+uy*uy+uz*uz}t  = ${ux * xM + uy * yM + uz * zM-(ux*xA+uy*yA+uz*zA)} \\\\
\\iff & t=${valeurt.texFractionSimplifiee}\\end{aligned}$<br>`

texteCorr +=`On en déduit les coordonnées du point $H$ en remplaçant $t$ par ${valeurt.texFractionSimplifiee} dans les $3$ premières équations du système : <br>`
texteCorr +=`$\\begin{cases}
x_H = ${xA}  ${ecritureAlgebrique(ux)} \\times ${valeurt.texFSP} \\\\\\\\ y_H = ${yA}  ${ecritureAlgebrique(uy)} \\times ${valeurt.texFSP} \\\\\\\\ z_H = ${zA}  ${ecritureAlgebrique(uz)} \\times ${valeurt.texFSP} \\end{cases}$ d'où finalement`
texteCorr +=`$\\begin{cases}
x_H = ${abscisseH.texFractionSimplifiee} \\\\ y_H = ${ordonneeH.texFractionSimplifiee} \\\\ z_H = ${coteH.texFractionSimplifiee} \\end{cases}$ <br>`
texteCorr +=`On vérifie que le point $H$ ainsi déterminé satisfait bien la dernière équation du système. <br>`
texteCorr +=`Ainsi, les coordonnées du point $H$ sont $${miseEnEvidence(`H(${abscisseH.texFractionSimplifiee} ; ${ordonneeH.texFractionSimplifiee} ; ${coteH.texFractionSimplifiee}).`)}$`

      
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
