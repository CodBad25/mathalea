import {
  all,
  sameParametricLine,
  singleParameterVariable,
} from '../../../lib/interactif/checks'
import { compareSameParametricLineFromFields } from '../../../lib/interactif/checks/sameParametricLineFromFields'
import { handleAnswers } from '../../../lib/interactif/gestionInteractif'
import { remplisLesBlancs } from '../../../lib/interactif/questionMathLive'
import {
  ecritureAlgebrique,
  ecritureParentheseSiNegatif,
  reduireAxPlusB,
} from '../../../lib/outils/ecritures'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { lettreDepuisChiffre } from '../../../lib/outils/outilString'
import { listeQuestionsToContenu, randint } from '../../../modules/outils'
import Exercice from '../../Exercice'

export const titre = "Déterminer une représentation paramétrique d'une droite"
export const dateDePublication = '05/10/2024'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 *
 * @author Stéphane Guyon et Nathan Scheinmann pour l'adaptation de l'interactivité
 */

export const uuid = '58bb7'
export const refs = {
  'fr-fr': ['canTSpeE03'],
  'fr-ch': ['3G98-1'],
}

export default class RepresentationParametrique extends Exercice {
  constructor() {
    super()

    this.nbQuestions = 2
  }

  nouvelleVersion() {
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      let texte = ''
      let texteCorr = ''
      const choixLettre = randint(1, 23, [9, 10, 11, 15])
      const pointA = lettreDepuisChiffre(choixLettre)
      const xA = randint(-6, 6, 0)
      const yA = randint(-6, 6, 0)
      const zA = randint(-6, 6)
      const xV = randint(-6, 6, 0)
      const yV = randint(-6, 6)
      const zV = randint(-6, 6, 0)
      // const xV = (xB + xA) / 2
      // const yV = (yB + yA) / 2
      // const zV = (zB + zA) / 2
      texte = `Dans un repère orthonormé $\\big(0,\\vec \\imath,\\vec \\jmath, \\vec k\\big)$, on donne le point $${pointA}$ et le vecteur $\\vec v$ de coordonnées respectives :`
      texte += `<br>$${pointA}(${xA}~;~${yA}~;~${zA})$ et  $\\vec v\\begin{pmatrix}${xV}\\\\${yV}\\\\${zV}\\end{pmatrix}$.<br>`
      texte += `Déterminer une représentation paramétrique de la droite $(d)$, passant par le point $${pointA}$ et ayant comme vecteur directeur $\\vec v$.<br>`

      if (this.interactif)
        texte += remplisLesBlancs(
          this,
          i,
          '\\begin{cases}x=%{champ1} \\\\y= %{champ2}\\\\z= %{champ3}\\end{cases}',
        )
      // else texte += '.'
      const expected = JSON.stringify({
        point: [xA, yA, zA],
        direction: [xV, yV, zV],
      })
      const compare = compareSameParametricLineFromFields({
        compare: all([
          singleParameterVariable({ dimension: 3 }),
          sameParametricLine({ dimension: 3 }),
        ]),
        numeroExercice: this.numeroExercice,
        question: i,
        dimension: 3,
      })
      handleAnswers(this, i, {
        champ1: { value: expected, compare },
        champ2: { value: expected, compare },
        champ3: { value: expected, compare },
      })
      texteCorr = 'Soit $M(x~;~y~;~z)$ un point de la droite $(d)$.<br>'
      texteCorr += `$M\\in (d)$ si et seulement si les vecteurs $\\overrightarrow{${pointA}M}$ et $\\vec v$ sont colinéaires. <br>`
      texteCorr += `Ce qui est équivalent à dire qu'il existe un réel $t$ tel que : $ \\overrightarrow{${pointA}M}=t \\times \\vec v$.<br>`
      texteCorr += `On calcule : $\\overrightarrow{${pointA}M}\\begin{pmatrix}x-${ecritureParentheseSiNegatif(xA)}\\\\y-${ecritureParentheseSiNegatif(yA)}\\\\z-${ecritureParentheseSiNegatif(zA)}\\end{pmatrix}$, `
      texteCorr += `et on obtient : $\\overrightarrow{${pointA}M}\\begin{pmatrix}x${ecritureAlgebrique(-xA)}\\\\y${ecritureAlgebrique(-yA)}\\\\z${ecritureAlgebrique(-zA)}\\end{pmatrix}$.<br>`
      texteCorr += `$ \\phantom{\\iff}\\overrightarrow{${pointA}M}=t \\times \\vec v$<br>`
      texteCorr += `$\\iff\\begin{cases}x${ecritureAlgebrique(-xA)}=t \\times ${ecritureParentheseSiNegatif(xV)} \\\\y${ecritureAlgebrique(-yA)}=t \\times ${ecritureParentheseSiNegatif(yV)}\\\\z${ecritureAlgebrique(-zA)}=t \\times ${ecritureParentheseSiNegatif(zV)}\\end{cases}$.<br>`
      texteCorr += `$ \\iff\\begin{cases}x= ${reduireAxPlusB(xV, xA, 't')} \\\\y= ${reduireAxPlusB(yV, yA, 't')}\\\\z= ${reduireAxPlusB(zV, zA, 't')}\\end{cases}$.<br>`
      texteCorr += `Une représentation paramétrique de la droite $(d)$ est donc, pour tout $t\\in\\mathbb{R}, \\begin{cases}x= ${miseEnEvidence(`${reduireAxPlusB(xV, xA, 't')}`)} \\\\y= ${miseEnEvidence(`${reduireAxPlusB(yV, yA, 't')}`)}\\\\z= ${miseEnEvidence(`${reduireAxPlusB(zV, zA, 't')}`)}\\end{cases}$.<br>`

      // texteCorr += `ce qui donne finalement : $I${miseEnEvidence`(${((xA + xB)/2,1)}   ;   ${texNombre((yA + yB)/2,1)}  ;  ${texNombre((zA + zB)/2,1)})`}$<br>`

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
