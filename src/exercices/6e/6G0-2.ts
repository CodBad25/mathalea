import { demiDroite, type DemiDroite } from '../../lib/2d/DemiDroite'
import { Droite, droite } from '../../lib/2d/droites'
import { PointAbstrait, pointAbstrait } from '../../lib/2d/PointAbstrait'
import { Segment, segment } from '../../lib/2d/segmentsVecteurs'
import { labelPoint } from '../../lib/2d/textes'
import { tracePointSurDroite } from '../../lib/2d/TracePointSurDroite'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import { creerNomDePolygone } from '../../lib/outils/outilString'
import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  'Donner description et notation de droites, segments et demi-droites'
export const amcReady = true
export const amcType = 'qcmMult'
export const interactifReady = true
export const interactifType = 'qcm'
export const dateDeModifImportante = '07/10/2023' // Interactivité type Qcm par Jean-claude Lhote puis style par Rémi Angot

/**
 * Utiliser les notations des segments, droites et demi-droites
 * @author Rémi Angot
 */
export const uuid = 'd81c6'

export const refs = {
  'fr-fr': ['6G0-2'],
  'fr-2016': ['6G10-1'],
  'fr-ch': ['9ES1-2'],
}
export default class DescriptionSegmentDroiteDemiDroite extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 3
  }

  nouvelleVersion() {
    this.consigne =
      this.interactif || context.isAmc
        ? 'Cocher les propositions correspondant à la figure.'
        : 'Décrire précisément, avec des mots, la figure et donner sa notation mathématique.'
    const typesDeQuestionsDisponibles = [1, 4, choice([2, 3])]
    const listeTypeDeQuestions = combinaisonListes(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    )
    let listeDeNomsDePolygones: string[] = []
    for (
      let i = 0, texte, texteCorr, cpt = 0;
      i < this.nbQuestions && cpt < 50;

    ) {
      if (i % 5 === 0) listeDeNomsDePolygones = ['QD']
      const p = creerNomDePolygone(2, listeDeNomsDePolygones)
      listeDeNomsDePolygones.push(p)
      const A = pointAbstrait(0, randint(0, 20) / 10, p[0])
      const B = pointAbstrait(4, randint(0, 20) / 10, p[1])
      const t1 = tracePointSurDroite(A, B)
      const t2 = tracePointSurDroite(B, A)
      const creerDroiteDemiSegment: (
        A: PointAbstrait,
        B: PointAbstrait,
      ) => {
        trait: Segment | Droite | DemiDroite
        correction: string
        propsQcm: {
          droite: { phrase: string; notation: string; bonneReponse: boolean }
          segment: { phrase: string; notation: string; bonneReponse: boolean }
          demiDroite1: {
            phrase: string
            notation: string
            bonneReponse: boolean
          }
          demiDroite2: {
            phrase: string
            notation: string
            bonneReponse: boolean
          }
        }
      } = (A: PointAbstrait, B: PointAbstrait) => {
        let trait, correction
        const propsQcm = {
          droite: {
            phrase: `La droite passant par $${A.nom}$ et $${B.nom}$`,
            notation: `$(${A.nom}${B.nom})$`,
            bonneReponse: false,
          },
          segment: {
            phrase: `Le segment d'extrémités $${A.nom}$ et $${B.nom}$`,
            notation: `$[${A.nom}${B.nom}]$`,
            bonneReponse: false,
          },
          demiDroite1: {
            phrase: `La demi-droite d'origine $${A.nom}$ passant par $${B.nom}$`,
            notation: `$[${A.nom}${B.nom})$`,
            bonneReponse: false,
          },
          demiDroite2: {
            phrase: `La demi-droite d'origine $${B.nom}$ passant par $${A.nom}$`,
            notation: `$[${B.nom}${A.nom})$`,
            bonneReponse: false,
          },
        }
        switch (listeTypeDeQuestions[i]) {
          case 1:
            trait = droite(A, B)
            correction = `La droite qui passe par les points $${A.nom}$ et $${B.nom}$ notée $(${A.nom}${B.nom})$.`
            propsQcm.droite.bonneReponse = true
            break
          case 2:
            trait = demiDroite(A, B)
            correction = `La demi-droite d'origine $${A.nom}$ passant par $${B.nom}$ notée $[${A.nom}${B.nom})$.`
            propsQcm.demiDroite1.bonneReponse = true
            break
          case 3:
            trait = demiDroite(B, A)
            correction = `La demi-droite d'origine $${B.nom}$ passant par $${A.nom}$ notée $[${B.nom}${A.nom})$.`
            propsQcm.demiDroite2.bonneReponse = true
            break
          case 4:
          default:
            trait = segment(A, B)
            correction = `Le segment d'extrémités $${A.nom}$ et $${B.nom}$ noté $[${A.nom}${B.nom}]$.`
            propsQcm.segment.bonneReponse = true
            break
        }
        return { trait, correction, propsQcm }
      }

      const {
        trait: dAB,
        correction: dABCorr,
        propsQcm,
      } = creerDroiteDemiSegment(A, B)
      const labels = labelPoint(A, B)
      texte = mathalea2d(
        {
          xmin: -2,
          ymin: -1,
          xmax: 7,
          ymax: 3,
          pixelsParCm: 40,
          scale: 0.6,
          optionsTikz: ['baseline=(current bounding box.north)'],
        },
        dAB,
        t1,
        t2,
        labels,
      )
      this.autoCorrection[i] = {
        enonce: texte,
        options: { vertical: true, ordered: true },
        propositions: [
          {
            texte: propsQcm.droite.phrase,
            statut: propsQcm.droite.bonneReponse,
          },
          {
            texte: propsQcm.demiDroite1.phrase,
            statut: propsQcm.demiDroite1.bonneReponse,
          },
          {
            texte: propsQcm.demiDroite2.phrase,
            statut: propsQcm.demiDroite2.bonneReponse,
          },
          {
            texte: propsQcm.segment.phrase,
            statut: propsQcm.segment.bonneReponse,
          },
          {
            texte: propsQcm.droite.notation,
            statut: propsQcm.droite.bonneReponse,
          },
          {
            texte: propsQcm.demiDroite1.notation,
            statut: propsQcm.demiDroite1.bonneReponse,
          },
          {
            texte: propsQcm.demiDroite2.notation,
            statut: propsQcm.demiDroite2.bonneReponse,
          },
          {
            texte: propsQcm.segment.notation,
            statut: propsQcm.segment.bonneReponse,
          },
        ],
      }

      const leQcmHtml = propositionsQcm(this, i)
      texte += this.interactif ? leQcmHtml.texte : ''
      if (this.interactif) {
        texteCorr = dABCorr + leQcmHtml.texteCorr
      } else {
        texteCorr = dABCorr
      }

      if (this.questionJamaisPosee(i, texte)) {
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
