import { colorToLatexOrHTML } from '../../lib/2d/colorToLatexOrHtml'
import { droite } from '../../lib/2d/droites'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { papierPointe } from '../../lib/2d/reperes'
import { TracePoint } from '../../lib/2d/TracePoint'
import { symetrieAxiale } from '../../lib/2d/transformations'
import { longueur } from '../../lib/2d/utilitairesGeometriques'
import { bleuMathalea } from '../../lib/colors'
import { choice, shuffle } from '../../lib/outils/arrayOutils'
import { PointCliquable, pointCliquable } from '../../modules/2dinteractif'
import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'
export const titre = 'Compléter un nuage de points symétriques'
export const dateDePublication = '18/12/2021'
export const interactifReady = false
// remettre interactif_Ready à true qd l'exo sera refait avec apiGEom
export const interactifType = 'custom'
export const amcReady = true
export const amcType = 'AMCHybride'

/**
 * Symétrie axiale sur papier pointé
 * Ref 6G24-4
 * @author Jean-claude Lhote
 * Publié le 18/12/2021
 */
export const uuid = '07f8a'

export const refs = {
  'fr-fr': ['6G7B-4'],
  'fr-2016': ['6G24-4'],
  'fr-ch': ['9ES6-15'],
}
export default class CompleterParSymetrie6e extends Exercice {
  pointsNonSolution: PointCliquable[][]
  pointsSolution: PointCliquable[][]
  pointsCliquables: PointCliquable[][]
  pointsCliques: TracePoint[][] | undefined
  constructor() {
    super()
    this.nbQuestions = 1
    this.besoinFormulaireNumerique = [
      "Type d'axes",
      5,
      '1 : Axe vertical\n2 : Axe horizontal\n3 : Axe oblique /\n4 : Axe oblique \\\n5 : Mélange',
    ]
    this.besoinFormulaire2Numerique = [
      'Type de papier pointé',
      4,
      '1 : Carrés\n2 : Hexagones\n3 : Triangles équilatéraux\n4 : Mélange',
    ]
    this.besoinFormulaire3CaseACocher = ['Axe centré', true]
    this.sup = 1
    this.sup2 = 1
    this.sup3 = true
    this.pointsNonSolution = []
    this.pointsSolution = []
    this.pointsCliquables = []
    this.pointsCliques = []
  }

  nouvelleVersion() {
    const couples = []
    let pointsPossibles
    const objetsEnonce: any[][] = []
    const objetsCorrection: any[][] = []
    const pointsChoisis = []
    const pointsAffiches = []
    const pointsEnPlusCorr = []
    this.pointsNonSolution = []
    this.pointsSolution = []
    this.pointsCliquables = []
    this.pointsCliques = []
    const changeAxe = []
    const typeDePapier = ['quad', 'quad', 'hexa', 'equi'] // l'élément 0 sera changé aléatoirement pour correspondre au type mélange (this.sup2 % 4)
    for (
      let i = 0,
        cpt = 0,
        papier,
        image,
        d,
        j,
        trouve,
        texte,
        texteCorr,
        nbCouplesComplets;
      i < this.nbQuestions && cpt < 50;
    ) {
      typeDePapier[0] = typeDePapier[1 + (i % 3)]
      // on remet à vide tous les tableaux utilisés pour la question suivante
      objetsEnonce[i] = []
      objetsCorrection[i] = []
      pointsChoisis.length = 0
      pointsAffiches.length = 0
      pointsEnPlusCorr.length = 0
      this.pointsNonSolution[i] = []
      this.pointsSolution[i] = []
      this.pointsCliquables[i] = []
      this.pointsCliques[i] = []
      couples.length = 0
      changeAxe[i] = this.sup3 ? 0 : randint(-2, 2, 0)
      papier = papierPointe({
        xmin: 0,
        ymin: 0,
        xmax: 10,
        ymax: 10,
        type: typeDePapier[this.sup2 === 4 ? 0 : this.sup2],
      })

      objetsEnonce[i].push(papier)

      switch (this.sup === 5 ? randint(1, 4) : this.sup) {
        case 1:
          if (typeDePapier[this.sup2 === 5 ? 0 : this.sup2] === 'quad') {
            d = droite(
              pointAbstrait(5 + changeAxe[i] / 2, 0),
              pointAbstrait(5 + changeAxe[i] / 2, 10),
            )
          } else {
            d = droite(
              pointAbstrait(4.33 + 0.866 * changeAxe[i], 0),
              pointAbstrait(4.33 + 0.866 * changeAxe[i], 10),
            )
          }
          break
        case 2:
          if (typeDePapier[this.sup2 === 4 ? 0 : this.sup2] === 'quad') {
            d = droite(
              pointAbstrait(0, 5 + changeAxe[i] / 2),
              pointAbstrait(10, 5 + changeAxe[i] / 2),
            )
          } else {
            d = droite(
              pointAbstrait(0, 5.5 + changeAxe[i] / 2),
              pointAbstrait(10, 5.5 + changeAxe[i] / 2),
            )
          }
          break
        case 3:
          if (typeDePapier[this.sup2 === 4 ? 0 : this.sup2] === 'quad') {
            d = droite(
              pointAbstrait(0, 1 + changeAxe[i]),
              pointAbstrait(9 - changeAxe[i], 10),
            )
          } else {
            d = droite(
              pointAbstrait(0, 3 + changeAxe[i]),
              pointAbstrait(8.66, 8 + changeAxe[i]),
            )
          }
          break
        case 4:
        default:
          if (typeDePapier[this.sup2 === 4 ? 0 : this.sup2] === 'quad') {
            d = droite(
              pointAbstrait(0, 10 - changeAxe[i]),
              pointAbstrait(10 - changeAxe[i], 0),
            )
          } else {
            d = droite(
              pointAbstrait(0, 8 + changeAxe[i]),
              pointAbstrait(8.66, 3 + changeAxe[i]),
            )
          }
          break
      }
      d.epaisseur = 2
      d.color = context.isHtml
        ? colorToLatexOrHTML(bleuMathalea)
        : colorToLatexOrHTML('black')
      objetsEnonce[i].push(d)
      pointsPossibles = papier.listeCoords.slice()
      // on prépare les points cliquables pour la version interactive
      // over, out et click sont des ojets pour le style css des évènements de la souris, radius, width, color, size, style sont les paramètres possibles pour la trace du point
      if (this.interactif && context.isHtml) {
        for (let p = 0; p < papier.listeCoords.length; p++) {
          this.pointsCliquables[i].push(
            pointCliquable(papier.listeCoords[p][0], papier.listeCoords[p][1], {
              radius: 0.2,
              color: 'red',
              width: 2,
              opacite: 0.7,
            }),
          )
        }
      }
      while (pointsPossibles.length > 1) {
        // si il n'en reste qu'un, on ne peut pas trouver de symétrique
        image = symetrieAxiale(
          pointAbstrait(pointsPossibles[0][0], pointsPossibles[0][1]),
          d,
        )
        j = 1
        trouve = false
        while (j < pointsPossibles.length && !trouve) {
          // si l'image est proche d'un point, c'est qu'on a deux symétriques donc un couple potentiel.
          if (
            longueur(
              image,
              pointAbstrait(pointsPossibles[j][0], pointsPossibles[j][1]),
            ) < 0.5
          ) {
            trouve = true
          } else j++
        }
        if (trouve) {
          // on stocke le couple de symétrique en modifiant aléatoirement l'ordre.
          couples.push(
            choice([true, false])
              ? [pointsPossibles[0], pointsPossibles[j]]
              : [pointsPossibles[j], pointsPossibles[0]],
          )
          pointsPossibles.splice(j, 1) // on retire d'abord le points d'indice j
          pointsPossibles.splice(0, 1) // puis le point d'indice 0
        } else {
          pointsPossibles.splice(0, 1) // Le point d'indice 0 n'a pas de symétrique, on le retire
        }
      }
      // la liste des couples est prête, on va pouvoir choisir les points affichés et ceux qu'on n'affiche pas.
      const nbCouplesChoisis = randint(8, 12)
      const couplesChoisis = shuffle(couples).splice(0, nbCouplesChoisis)
      for (let p = 0; p < couplesChoisis.length; p++) {
        pointsChoisis.push(couplesChoisis[p][0], couplesChoisis[p][1])
      }
      nbCouplesComplets = randint(2, 5)
      for (let p = 0; p < pointsChoisis.length; p += 2) {
        if (p < nbCouplesComplets) {
          // On affiche un certains nombre de couples
          pointsAffiches.push(
            pointAbstrait(pointsChoisis[p][0], pointsChoisis[p][1]),
          )
          pointsAffiches.push(
            pointAbstrait(pointsChoisis[p + 1][0], pointsChoisis[p + 1][1]),
          )
        } else {
          // et on affiche un seul des points pour les couples restants
          pointsAffiches.push(
            pointAbstrait(pointsChoisis[p][0], pointsChoisis[p][1]),
          )
          pointsEnPlusCorr.push(
            pointAbstrait(pointsChoisis[p + 1][0], pointsChoisis[p + 1][1]),
          )
        }
      }
      for (let p = 0; p < pointsAffiches.length; p++) {
        objetsEnonce[i].push(new TracePoint(pointsAffiches[p]))
      }
      for (let p = 0; p < pointsEnPlusCorr.length; p++) {
        objetsCorrection[i].push(new TracePoint(pointsEnPlusCorr[p], 'red'))
      }
      for (let p = 0; p < this.pointsCliquables[i].length; p++) {
        trouve = false
        let q = 0
        while (q < pointsEnPlusCorr.length && !trouve) {
          if (
            longueur(pointsEnPlusCorr[q], this.pointsCliquables[i][p].point) <
            0.1
          ) {
            trouve = true
            this.pointsSolution[i].push(this.pointsCliquables[i][p])
          } else {
            q++
          }
        }
        if (!trouve) {
          this.pointsNonSolution[i].push(this.pointsCliquables[i][p])
        }
      }
      texte = context.isAmc
        ? "Voici une grille contenant des points et un axe de symétrie.<br>Ajouter un minimum de points afin que la figure soit symétrique par rapport à l'axe.<br>Écrire le nombre de points ajoutés dans le cadre et coder numériquement ce nombre.<br>"
        : "Voici une grille contenant des points et un axe de symétrie.<br>Ajouter un minimum de points afin que la figure soit symétrique par rapport à l'axe.<br>"
      // On prépare la figure...
      texte += mathalea2d(
        { xmin: -1, ymin: -1, xmax: 11, ymax: 11, scale: 0.5 },
        ...objetsEnonce[i],
        ...this.pointsCliquables[i],
      )
      if (this.interactif && context.isHtml) {
        texte += `<div id="resultatCheckEx${this.numeroExercice}Q${i}"></div>`
      }
      texteCorr = `Il faut ajouter au minimum ${pointsEnPlusCorr.length} points (en rouge sur la figure) afin que la figure soit symétrique par rapport à l'axe.
      ${mathalea2d({ xmin: -1, ymin: -1, xmax: 11, ymax: 11, scale: 0.5, style: 'inline' }, ...objetsEnonce[i], ...objetsCorrection[i])}`

      if (
        this.questionJamaisPosee(
          i,
          nbCouplesChoisis,
          nbCouplesComplets,
          pointsChoisis[0][0],
          pointsChoisis[0][1],
        )
      ) {
        if (context.isAmc) {
          this.autoCorrectionAMC[i] = {
            enonce: '',
            enonceAGauche: true,
            enonceAvant: false,
            propositions: [
              {
                type: 'AMCOpen',
                propositions: [
                  {
                    enonce: texte,
                    texte: texteCorr,
                    statut: 1,
                    pointilles: true,
                  },
                ],
              },
              {
                type: 'AMCNum',
                propositions: [
                  {
                    texte: '',
                    statut: '',
                    reponse: {
                      texte: 'Nombre de points ajoutés',
                      valeur: [pointsEnPlusCorr.length],
                      param: {
                        digits: 2,
                        signe: false,
                        decimals: 0,
                      },
                    },
                  },
                ],
              },
            ],
          }
        }
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }

  correctionInteractive = (i: number) => {
    let resultat = 'Ok'
    let aucunMauvaisPointsCliques = true
    if (this.pointsCliques == null) this.pointsCliques = []
    if (this.pointsCliques[i] == null) this.pointsCliques[i] = []
    for (const monPoint of this.pointsNonSolution[i]) {
      if (monPoint.etat) {
        aucunMauvaisPointsCliques = false
        this.pointsCliques[i].push(new TracePoint(monPoint.point, 'red')) // ça c'est pour éventuellement modifier la correction avec les points cliqués par l'utilisateur.
      }
      monPoint.stopCliquable()
    }
    for (const monPoint of this.pointsSolution[i]) {
      if (!monPoint.etat) aucunMauvaisPointsCliques = false
      else this.pointsCliques[i].push(new TracePoint(monPoint.point, 'red')) // ça c'est pour éventuellement modifier la correction avec les points cliqués par l'utilisateur.
      monPoint.stopCliquable()
    }
    const spanResultat = document.querySelector(
      `#resultatCheckEx${this.numeroExercice}Q${i}`,
    )
    for (let j = 0; j < this.pointsSolution[i].length; j++) {
      this.pointsSolution[i][j].stopCliquable()
    }
    let etat = true
    for (let k = 0; k < this.pointsSolution[i].length; k++) {
      etat = etat && this.pointsSolution[i][k].etat
    }
    if (aucunMauvaisPointsCliques && etat) {
      if (spanResultat != null) {
        spanResultat.innerHTML = '😎'
        resultat = 'OK'
      }
    } else {
      if (spanResultat != null) {
        spanResultat.innerHTML = '☹️'
        resultat = 'KO'
      }
    }
    // this.listeCorrections[i] = mathalea2d({ xmin: -1, ymin: -1, xmax: 11, ymax: 11, scale: 0.7, style: 'inline' }, ...objetsEnonce[i], ...pointsCliques[i]) + mathalea2d({ xmin: -1, ymin: -1, xmax: 11, ymax: 11, scale: 0.5, style: 'inline' }, ...objetsEnonce, ...objetsCorrection[i])
    // le contenu est déjà prêt. Il faudra modifier les <svg> à postéreiori...
    return resultat
  }
}
