import { createList } from '../../lib/format/lists'
import { lampeMessage } from '../../lib/format/message'
import {
  ecritureAlgebrique,
  ecritureAlgebriqueSauf0,
  ecritureAlgebriqueSauf1,
  ecritureParentheseSiNegatif,
  reduireAxPlusB,
  rienSi1,
} from '../../lib/outils/ecritures'
import { texteEnCouleurEtGras } from '../../lib/outils/embellissements'
import FractionEtendue from '../../modules/FractionEtendue'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = "Déterminer la position relative d'une droite et d'un plan"

export const dateDePublication = '26/01/2025' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag

export const uuid = 'd5252'

export const refs = {
  'fr-fr': ['TSG2-10'],
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
      let produitScalaire: number = 0
      let a = 0
      let b = 0
      let c = 0
      let d = 0
      let ux = 0
      let uy = 0
      let uz = 0
      let x0 = 0
      let y0 = 0
      let z0 = 0
      let cas = ''
      let compteurBoucle = 0
      do {
        // Plan : équation ax + by + cz + d = 0 avec (a,b,c) non nul
        a = randint(-4, 4, 0)
        b = randint(-4, 4, 0)
        c = randint(-4, 4, 0)
        d = randint(-4, 4, 0)

        // Choix du cas : secant plus fréquent
        const tirageCas = randint(1, 6)
        cas =
          tirageCas <= 3 ? 'secant' : tirageCas <= 5 ? 'parallele' : 'incluse'

        // Fonction pour obtenir un vecteur directeur orthogonal à (a,b,c)
        ux = randint(-5, 5, 0)
        uy = randint(-5, 5, 0)

        z0 = z0 + randint(-5, 5, 0) // On ajuste la cote du point pour que le point ne soit pas dans le plan
      }
      if (cas === 'secant') {
        // Cas sécant : vecteur non orthogonal au normal
        uz = uz + randint(-4, 4, 0)
        c = randint(-4, 4, [0, 1])
      }
      const equationPlan = `${rienSi1(a)}x${ecritureAlgebriqueSauf1(b)}y${ecritureAlgebriqueSauf1(c)}z${ecritureAlgebriqueSauf0(d)}=0`
      const produitScalaire = a * ux + b * uy + c * uz
      // Les fractions suivantes ne sont utiles que dans le cas sécant.
      // Si le produit scalaire est nul, on évite un dénominateur nul.
      const solution =
        produitScalaire !== 0
          ? new FractionEtendue(-a * x0 - b * y0 - c * z0 - d, produitScalaire)
          : null
      const abscisseM =
        produitScalaire !== 0
          ? new FractionEtendue(
              x0 * produitScalaire + ux * (-a * x0 - b * y0 - c * z0 - d),
              produitScalaire,
            )
          : null
      const ordonneeM =
        produitScalaire !== 0
          ? new FractionEtendue(
              y0 * produitScalaire + uy * (-a * x0 - b * y0 - c * z0 - d),
              produitScalaire,
            )
          : null
      const coteM =
        produitScalaire !== 0
          ? new FractionEtendue(
              z0 * produitScalaire + uz * (-a * x0 - b * y0 - c * z0 - d),
              produitScalaire,
            )
          : null
  texte =
        'Dans l\'espace muni d\'un repère orthonormé, on considère un plan $\\mathcal{P}$ et une droite $(d)$ :<br>'
    texte += createList({
      items: [
        `Le plan $P$ a pour équation cartésienne : $${equationPlan}$.<br>`,
        `La droite $(d)$ admet la représentation paramétrique suivante : <br>
        $\\begin{cases}x=${x0}${ecritureAlgebriqueSauf1(ux)}t\\\\y=${y0}${ecritureAlgebriqueSauf1(uy)}t\\\\z=${z0}${ecritureAlgebriqueSauf1(uz)}t\\end{cases}.$<br>`
      ],
     style: 'nombres',
    })
      texte +=
        '<br>Déterminer la position relative de $(d)$ et $\\mathcal{P}$ .'
      texte +=
        '<br>En cas d’intersection, calculer les coordonnées du point commun.'

      // Correction
      let orthogonalite = `${texteEnCouleurEtGras("Étudier l'orthogonalité d'un vecteur directeur de $(d)$ et d'un vecteur normal à $\\mathcal{P}$ ")}<br>Si un vecteur directeur de la droite $(d)$ est orthogonal à un vecteur normal du plan $\\mathcal{P}$, alors la droite $(d)$ est strictement parallèle au plan $\\mathcal{P}$ ou incluse dans ce plan. <br>`
      orthogonalite +=
        'Dans le cas contraire, la droite $(d)$ est sécante au plan $\\mathcal{P}$.<br>'
      orthogonalite +=
        "On sait qu'un plan qui a une équation cartesienne du type $ax+by+cz+d=0$ admet  $\\vec n\\begin{pmatrix}" +
        `a\\\\b\\\\c\\end{pmatrix}$ comme vecteur normal. <br>`
      orthogonalite +=
        'On en déduit que le vecteur $\\vec n\\begin{pmatrix}' +
        `${a}\\\\${b}\\\\${c}\\end{pmatrix}$ est un vecteur normal au  plan $(\\mathcal{P})$. <br>`
      orthogonalite +=
        "On sait qu'une droite qui admet une représentation paramétrique de la forme $\\begin{cases}x=x_0+\\alpha t\\\\y=y_0+\\beta t\\quad (t\\in\\mathbb{R})\\\\z=z_0+\\gamma t\\end{cases}$"
      orthogonalite +=
        '$\\quad$ admet comme vecteur directeur $\\vec u\\begin{pmatrix}' +
        `\\alpha\\\\\\beta\\\\\\gamma\\end{pmatrix}$. <br>`
      orthogonalite +=
        "On en déduit qu'un vecteur directeur de la droite $(d)$ est $\\vec u\\begin{pmatrix}" +
        `${ux}\\\\${uy}\\\\${uz}\\end{pmatrix}$. <br>`
      orthogonalite +=
        'On calcule le produit scalaire des vecteurs $\\vec n$ et $ \\vec u$ :<br>' +
        `$\\begin{aligned}\\vec n \\cdot \\vec u &=${a}\\times ${ecritureParentheseSiNegatif(ux)}${ecritureAlgebrique(b)}\\times ${ecritureParentheseSiNegatif(uy)}${ecritureAlgebrique(c)}\\times ${ecritureParentheseSiNegatif(uz)}\\\\
        & = ${produitScalaire}\\end{aligned}$.`
      if (produitScalaire !== 0) {
        orthogonalite +=
          '<br>Le produit scalaire est non nul, les vecteurs ne sont donc pas orthogonaux.  La droite $(d)$ est sécante au plan $\\mathcal{P}$.'
      } else {
        orthogonalite +=
          '<br>Le produit scalaire est nul, les vecteurs sont donc orthogonaux.  Il reste donc deux possibilités : soit la droite $(d)$ est strictement parallèle au plan $\\mathcal{P}$ soit elle est incluse dans ce plan.'
      }

      let PointCommun = ''
      PointCommun += `${texteEnCouleurEtGras("Étude de l'intersection entre la droite $(d)$ et le plan $\\mathcal{P}$ :")}<br>`
      if (produitScalaire === 0) {
        PointCommun +=
          "Pour différencier les deux cas possibles, on va chercher s'il existe des points d'intersection entre la droite $(d)$ et le plan $\\mathcal{P}$. On cherche donc les points $M(x;y;z)$ dont les coordonnées vérifient en même temps la représentation paramétrique de $(d)$ et l'équation cartésienne de $(\\mathcal{P})$. <br>"
      } else {
        PointCommun +=
          "On  cherche les coordonnées du point $M(x;y;z)$, intersection entre la droite $(d)$ et le plan $\\mathcal{P}$. Ses coordonnées vérifient donc la représentation paramétrique de $(d)$ et l'équation cartésienne de $(\\mathcal{P})$. <br>"
      }
      PointCommun +=
        "On cherche donc l'ensemble des $(x, y, z, t)$ qui vérifient le système : <br>"
      PointCommun += `$\\begin{cases}x=${x0}${ecritureAlgebriqueSauf1(ux)}t\\\\y=${y0}${ecritureAlgebriqueSauf1(uy)}t\\\\z=${z0}${ecritureAlgebriqueSauf1(uz)}t\\\\ ${equationPlan}\\end{cases}.$<br>`
      PointCommun +=
        "En remplaçant les expressions de $x$, $y$ et $z$ issues de la représentation paramétrique de la droite dans l'équation du plan, on obtient cette équation en $t$ :<br>"
      PointCommun += `$\\begin{aligned}${rienSi1(a)}\\big(${x0}${ecritureAlgebriqueSauf1(ux)}t\\big)${ecritureAlgebriqueSauf1(b)}\\big(${y0}${ecritureAlgebriqueSauf1(uy)}t\\big)${ecritureAlgebriqueSauf1(c)}\\big(${z0}${ecritureAlgebriqueSauf1(uz)}t\\big)${ecritureAlgebriqueSauf0(d)}&=0\\\\
      ${a * x0}${ecritureAlgebriqueSauf1(ux * a)}t${ecritureAlgebrique(b * y0)}${ecritureAlgebriqueSauf1(uy * b)}t${ecritureAlgebrique(c * z0)}${ecritureAlgebriqueSauf1(uz * c)}t${ecritureAlgebrique(d)}&=0\\\\
     ${produitScalaire} t&=${-(a * x0 + b * y0 + c * z0 + d)}
       \\end{aligned}.$<br>`
      // Cas sécant
       if (cas === 'secant' && solution && abscisseM && ordonneeM && coteM) {   PointCommun +=`$\\begin{aligned}\\phantom {${a*x0}${ecritureAlgebriqueSauf1(ux*a)}t${a*x0}${ecritureAlgebriqueSauf1(ux*a)}t${ecritureAlgebrique(b*y0)}${ecritureAlgebriqueSauf1(uy*b)}t${ecritureAlgebrique(c*z0)}${ecritureAlgebriqueSauf1(uz*c)}}t&=${solution.texFractionSimplifiee}\\\\
     \\end{aligned}.$<br>`
        PointCommun +=
          "On remplace cette valeur de $t$ dans la représentation paramétrique de la droite pour obtenir les coordonnées du point d'intersection : <br>"
        PointCommun += `$\\begin{cases}x=${x0}${ecritureAlgebrique(ux)}\\times ${ecritureParentheseSiNegatif(solutionsimplifiee)}\\\\\\\\y=${y0}${ecritureAlgebrique(uy)}\\times ${ecritureParentheseSiNegatif(solutionsimplifiee)}\\\\\\\\z=${z0}${ecritureAlgebrique(uz)}\\times ${ecritureParentheseSiNegatif(solutionsimplifiee)}\\end{cases}\\quad$ d'où 
       $\\begin{cases}x=${abscisseM.texFractionSimplifiee}\\\\\\\\y=${ordonneeM.texFractionSimplifiee}\\\\\\\\z=${coteM.texFractionSimplifiee}\\end{cases}.$`
        PointCommun += `<br>${texteEnCouleurEtGras(`La droite $(d)$ et le plan $\\mathcal{P}$ sont donc sécants en $M\\left(${abscisseM.texFractionSimplifiee};${ordonneeM.texFractionSimplifiee};${coteM.texFractionSimplifiee}\\right)$.`)}<br>`
      }
      // Cas parallèles
      if (cas === 'parallele') {
        PointCommun += `Cette équation n'admet pas de solution. Il n'y a pas de point commun à $(d)$ et $\\mathcal P$. <br> ${texteEnCouleurEtGras('On peut conclure que la droite $(d)$ et le plan $\\mathcal P$ sont strictement parallèles.')}`
      }
      // Cas confondus
      if (cas === 'incluse') {
        PointCommun += `Cette équation admet une infinité de solution. Il y a une infinité de points commun à $(d)$ et $\\mathcal P$. <br> ${texteEnCouleurEtGras('On peut conclure que la droite $(d)$ est incluse dans le plan $\\mathcal P$.')}`
      }

      texteCorr =
        "Etudier la position relative de la droite $(d)$ et du plan $\\mathcal{P}$, c'est déterminer si : "
      texteCorr += createList({
        items: [
          '$(d)$ est strictement parallèle à $\\mathcal{P}$',
          '$(d)$ est incluse dans $\\mathcal{P}$',
          '$(d)$ est sécante à $\\mathcal{P}$',
        ],
        style: 'fleches',
      })
      texteCorr +=
        '<br>Nous allons pour cela procéder en deux étapes : <br>' +
        createList({ items: [orthogonalite, PointCommun], style: 'nombres' })

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
