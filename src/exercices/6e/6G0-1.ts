import { demiDroite } from '../../lib/2d/DemiDroite'
import { droite } from '../../lib/2d/droites'
import type { ObjetMathalea2D } from '../../lib/2d/ObjetMathalea2D'
import { PointAbstrait, pointAbstrait } from '../../lib/2d/PointAbstrait'
import { segment } from '../../lib/2d/segmentsVecteurs'
import { labelPoint } from '../../lib/2d/textes'
import { tracePoint } from '../../lib/2d/TracePoint'
import { combinaisonListes } from '../../lib/outils/arrayOutils'
import { creerNomDePolygone } from '../../lib/outils/outilString'
import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import { listeQuestionsToContenu } from '../../modules/outils'
import Exercice from '../Exercice'
export const titre = 'Utiliser la notation de droites, segments et demi-droites'
export const amcReady = true
export const amcType = 'AMCOpen'

/**
 * Utiliser les notations des segments, droites et demi-droites
 * @author Rémi Angot
 */
export const uuid = '8f5d3'

export const refs = {
  'fr-fr': ['6G0-1'],
  'fr-2016': ['6G10'],
  'fr-ch': ['9ES1-1'],
}
export default class NotationSegmentDroiteDemiDroite extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 3
    this.nbCols = 3
    this.nbColsCorr = 2
  }

  nouvelleVersion() {
    this.consigne =
      this.nbQuestions === 1 || context.vue === 'diap' || context.isAmc
        ? "Compléter le programme de construction qui a permis d'obtenir cette figure."
        : "Compléter les programmes de construction qui ont permis d'obtenir ces figures."
    const listeDesTypesDeQuestions = combinaisonListes(
      [1, 1, 2, 3, 4, 4],
      this.nbQuestions * 3,
    )
    let listeDeNomsDePolygones: string[] = []
    for (
      let i = 0, texte, texteCorr, figure, enonceAMC, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      if (i % 5 === 0) listeDeNomsDePolygones = ['PQD']
      const p = creerNomDePolygone(3, listeDeNomsDePolygones)
      listeDeNomsDePolygones.push(p)
      const A = pointAbstrait(0, 0, p[0], 'above left')
      const B = pointAbstrait(2, 2.2, p[1], 'above')
      const C = pointAbstrait(4.2, -0.6, p[2], 'above right')
      const creerDroiteDemiSegment = (
        A: PointAbstrait,
        B: PointAbstrait,
        type: number,
      ) => {
        let trait: ObjetMathalea2D, notation, typeLigne
        switch (type) {
          case 1:
            trait = droite(A, B)
            notation = `$(${A.nom}${B.nom})$`
            typeLigne = 'la droite'
            break
          case 2:
            trait = demiDroite(A, B)
            notation = `$[${A.nom}${B.nom})$`
            typeLigne = 'la demi-droite'
            break
          case 3:
            trait = demiDroite(B, A)
            notation = `$[${B.nom}${A.nom})$`
            typeLigne = 'la demi-droite'
            break
          case 4:
          default:
            trait = segment(A, B)
            notation = `$[${A.nom}${B.nom}]$`
            typeLigne = 'le segment'
            break
        }
        return [trait, notation, typeLigne] as [ObjetMathalea2D, string, string]
      }
      const [dAB, dABCorr, typeLigneAB] = creerDroiteDemiSegment(
        A,
        B,
        listeDesTypesDeQuestions[3 * i],
      )
      const [dAC, dACCorr, typeLigneAC] = creerDroiteDemiSegment(
        A,
        C,
        listeDesTypesDeQuestions[3 * i + 1],
      )
      const [dBC, dBCCorr, typeLigneBC] = creerDroiteDemiSegment(
        B,
        C,
        listeDesTypesDeQuestions[3 * i + 2],
      )
      context.pixelsParCm = 20
      const labels = labelPoint(A, B, C)

      texte = `Placer 3 points $${p[0]}$, $${p[1]}$ et $${p[2]}$ non alignés puis tracer... <br><br>`
      figure = mathalea2d(
        {
          xmin: -1,
          ymin: -1,
          xmax: 5,
          ymax: 4.5,
          pixelsParCm: 20,
          scale: 1,
          zoom: 1.5,
        },
        dAB,
        dBC,
        dAC,
        labels,
        tracePoint(A, B, C),
      )
      enonceAMC = figure + texte
      texte += figure
      texteCorr = `Placer 3 points $${p[0]}$, $${p[1]}$ et $${p[2]}$ non alignés puis tracer ${typeLigneAB} ${dABCorr}, ${typeLigneBC} ${dBCCorr} et ${typeLigneAC} ${dACCorr}.`
      if (context.isAmc) {
        this.autoCorrectionAMC[i] = {
          enonce: this.consigne + '<br>' + enonceAMC,
          propositions: [
            {
              texte: texteCorr,
              statut: 3, // OBLIGATOIRE (ici c'est le nombre de lignes du cadre pour la réponse de l'élève sur AMC)
              enonce: 'Texte écrit au dessus ou avant les cases à cocher', // EE : ce champ est facultatif et fonctionnel qu'en mode hybride (en mode normal, il n'y a pas d'intérêt)
              sanscadre: false, // EE : ce champ est facultatif et permet (si true) de cacher le cadre et les lignes acceptant la réponse de l'élève
              pointilles: true, // EE : ce champ est facultatif et permet (si false) d'enlever les pointillés sur chaque ligne.
            },
          ],
        }
      }

      if (this.listeQuestions.indexOf(texte) === -1) {
        // Si la question n'a jamais été posée, on en crée une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
