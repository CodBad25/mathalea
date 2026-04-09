import {
  miseEnEvidence,
  texteEnCouleur,
  texteEnCouleurEtGras,
} from '../../lib/outils/embellissements'
import { context } from '../../modules/context'
import { mathalea2d } from '../../modules/mathalea2d'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

import {
  barre3d,
  plaque3d,
} from '../../lib/3d/3dProjectionMathalea2d/BarreEtPlaque3dPerspectiveCavaliere'
import { cube3d } from '../../lib/3d/3dProjectionMathalea2d/Cube3dPerspectiveCavaliere'
import { paveLPH3d } from '../../lib/3d/3dProjectionMathalea2d/PaveEtPaveLPH3dPerspectiveCavaliere'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { setReponse } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import type { NestedObjetMathalea2dArray } from '../../types/2d'

export const titre = 'Déterminer le volume de pavés droit par dénombrement'
export const interactifReady = true
export const amcReady = true
export const interactifType = 'mathLive'
export const amcType = 'AMCNum'

export const uuid = '0d4be'

export const refs = {
  'fr-fr': ['6M3C'],
  'fr-2016': ['6M30-0'],
  'fr-ch': ['9GM3-1'],
}
/**
 * @author Jean-claude Lhote
 */
export default class VolumesPavesParDenombrement extends Exercice {
  constructor() {
    super()

    this.nbQuestions = 1 // Ici le nombre de questions
    this.correctionDetailleeDisponible = true
    this.correctionDetaillee = true
  }

  nouvelleVersion() {
    context.anglePerspective = 30
    context.coeffPerspective = 0.5
    const dimensions = []
    const objetsAtracer: NestedObjetMathalea2dArray = []
    for (
      let q = 0,
        cpt = 0,
        l,
        p,
        h,
        monPave,
        cubes,
        plaques,
        barres,
        texte,
        texteCorr;
      q < this.nbQuestions && cpt < 50;
    ) {
      const pavesCorr: NestedObjetMathalea2dArray[] = []
      l = randint(5, 10)
      p = randint(2, 5)
      h = randint(3, 6)
      monPave = paveLPH3d(0, 0, 0, 1, l, p, h, 'black')
      for (let j = 0; j < p * h; j++) {
        pavesCorr[j] = []
      }

      cubes = []
      barres = []
      plaques = []

      texte = 'Donner le nombre de petits cubes qui constituent ce pavé droit'
      texte += this.interactif
        ? ' : ' +
          ajouteChampTexteMathLive(this, q, KeyboardType.clavierNumbers) +
          '.'
        : '.'
      texte +=
        '<br>' +
        mathalea2d(
          {
            xmin: -1,
            ymin: -1,
            xmax: l + 0.9 * p,
            ymax: h + 0.6 * p,
            scale: context.isHtml ? 1 : 0.6,
          },
          ...monPave.c2d,
        )
      for (let i = 0; i < h - 1; i++) {
        plaques.push(...plaque3d(0, 0, i * 1.5, 1, l, p).c2d)
      }
      plaques.push(...plaque3d(0, 0, (h - 1) * 1.5, 1, l, p).c2d)
      for (let i = p - 1; i > 0; i--) {
        barres.push(...barre3d(0, i * 1.5, 0, 1, l).c2d)
      }
      barres.push(...barre3d(0, 0, 0, 1, l).c2d)

      for (let i = 0; i < l; i++) {
        for (let j = 0; j < p; j++) {
          for (let k = 0; k < h; k++) {
            if (j === 0 && k === 0 && i !== l - 1)
              pavesCorr[j * h + k].push(
                ...cube3d(
                  i * 1.2 - 0.06 * l,
                  2 * j,
                  -k * 1.5 + h * 1.5 - 1.5,
                  1,
                  'black',
                  'blue',
                ).c2d,
              )
            else if (i === l - 1 && j === 0 && k !== 0)
              pavesCorr[j * h + k].push(
                ...cube3d(
                  i * 1.2 - 0.06 * l,
                  2 * j,
                  -k * 1.5 + h * 1.5 - 1.5,
                  1,
                  'black',
                  'lightgray',
                  'white',
                  'red',
                ).c2d,
              )
            else if (i === l - 1 && k === 0 && j !== 0)
              pavesCorr[j * h + k].push(
                ...cube3d(
                  i * 1.2 - 0.06 * l,
                  2 * j,
                  -k * 1.5 + h * 1.5 - 1.5,
                  1,
                  'black',
                  'lightgray',
                  'green',
                ).c2d,
              )
            else if (i === l - 1 && k === 0 && j === 0)
              pavesCorr[j * h + k].push(
                ...cube3d(
                  i * 1.2 - 0.06 * l,
                  2 * j,
                  -k * 1.5 + h * 1.5 - 1.5,
                  1,
                  'black',
                  'blue',
                  'green',
                  'red',
                ).c2d,
              )
            else
              pavesCorr[j * h + k].push(
                ...cube3d(
                  i * 1.2 - 0.06 * l,
                  2 * j,
                  -k * 1.5 + h * 1.5 - 1.5,
                  1,
                  'black',
                ).c2d,
              )
          }
        }
        cubes.push(...cube3d(1.5 * i - 0.06 * l, 0, 0, 1).c2d)
      }

      if (this.correctionDetaillee) {
        texteCorr = `Il y a ${l} cubes par barre :<br>`
        texteCorr += mathalea2d(
          { xmin: -1, xmax: l * 1.5 + 2, ymin: -0.5, ymax: 1.5 },
          cubes,
        )
        texteCorr += `<br>Il y a ${p} barres par plaque :<br>`
        texteCorr += mathalea2d(
          { xmin: -1, xmax: l * 1.5 + 2, ymin: -0.5, ymax: 1.5 + p * 0.3 },
          barres,
        )
        texteCorr += `<br>Enfin, il y a ${h} plaques empilées :<br>`
        texteCorr += mathalea2d(
          { xmin: -1, ymin: -1, xmax: 15, ymax: 1.5 + h * 1.4 },
          plaques,
        )
        texteCorr += `<br>Il y a donc $${l} \\times ${p} \\times ${h} = ${miseEnEvidence(h * l * p)}$ cubes.<br>`
      } else {
        for (let i = 0; i < h * p; i++) {
          objetsAtracer.push(...pavesCorr[h * p - 1 - i])
        }
        texteCorr = `La face de devant est composée de ${texteEnCouleur(String(l), 'blue')} $\\times$ ${texteEnCouleur(String(h), 'red')} cubes, soit ${l * h} cubes.<br>Donc le nombre de cubes de ce pavé droit est ${l * h} $\\times$ ${texteEnCouleur(String(p), 'green')} cubes, soit ${texteEnCouleurEtGras(l * h * p)} cubes.`
        texteCorr += mathalea2d(
          { xmin: -1, ymin: -1, xmax: (l + p) * 1.5, ymax: h * 2 + p * 0.2 },
          objetsAtracer,
        )
      }
      if (dimensions.indexOf([l, p, h]) === -1) {
        setReponse(this, q, l * p * h)
        this.listeQuestions[q] = texte
        this.listeCorrections[q] = texteCorr

        dimensions.push([l, p, h])
        q++
      }
      cpt++
    }
    listeQuestionsToContenu(this) // On envoie l'exercice à la fonction de mise en page
  }
}
