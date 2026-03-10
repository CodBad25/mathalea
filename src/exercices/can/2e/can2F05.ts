import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { context } from '../../../modules/context'
import { fraction } from '../../../modules/fractions'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Déterminer un antécédent avec la racine carrée'
export const interactifReady = true
export const interactifType = 'mathLive'

// Les exports suivants sont optionnels mais au moins la date de publication semble essentielle
export const dateDePublication = '1/11/2021' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag

/**
 * Retrouver l'ancédédent (un carré parfait) d'un nombre par une fonction avec racine carrée
 * @author Gilles Mora

*/
export const uuid = '82d4a'

export const refs = {
  'fr-fr': ['can2F05'],
  'fr-ch': [],
}
export default class AntecedentFonctionRacine extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    if (context.isHtml) this.spacingCorr = 2
    const m = randint(2, 5)
    const p = randint(1, 4) * m
    const a = randint(5, 10) * m
    const maFraction = fraction(a - p, m)
    this.question = `Déterminer l'antécédent de $${a}$
    par la fonction $f$ définie sur $\\mathbb{R}_+$ par : $f(x)=${m}\\sqrt{x}+${p}$.`
    this.correction = `L'antécédent de $${a}$ (s'il existe) par la fonction $f$ est la solution de l'équation $f(x)=${a}$.<br>
Pour résoudre cette équation, on isole la racine carrée dans le membre de gauche.<br>

    $\\begin{aligned}
    ${m}\\sqrt{x}+${p}&=${a}\\\\[2ex]
    ${m}\\sqrt{x}+${p}~${miseEnEvidence(-p, 'blue')}&=${a}~${miseEnEvidence(-p, 'blue')}\\\\[2ex]
    \\dfrac{${m}\\sqrt{x}}{${miseEnEvidence(m, 'blue')}}&=\\dfrac{${a - p}}{${miseEnEvidence(m, 'blue')}}\\\\[2ex]
    \\sqrt{x}&=${maFraction.simplifie().texFSD}{\\qquad\\text{ On cherche le nombre dont la racine carrée vaut }}${maFraction.simplifie().texFSD} \\\\[2ex]
    x&=${miseEnEvidence(maFraction.puissanceFraction(2).simplifie().texFraction)}
    \\end{aligned}$
    `
    this.reponse = maFraction.puissanceFraction(2)
  }
}
