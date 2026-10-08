import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { toutPourUnPoint } from '../../lib/interactif/fonctionsBaremes'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { remplisLesBlancs } from '../../lib/interactif/questionMathLive'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  'Déterminer le quotient et le reste de la division euclidienne d’un entier et de son opposé'
export const dateDePublication = '07/10/2026'
export const uuid = '92eec'
export const interactifReady = true
export const refs = { 'fr-fr': ['TEA1-21'], 'fr-ch': [] }

/** @author Stéphane Guyon */
export default class DivisionEuclidienneOppose extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.nbQuestionsModifiable = true
  }

  nouvelleVersion(): void {
    this.consigne = ''
    for (
      let exercice = 0, tentatives = 0;
      exercice < this.nbQuestions && tentatives < 50;
      tentatives++
    ) {
      const b = randint(12, 30)
      const q = randint(15, 50)
      const r = randint(1, b - 1)
      const resteDonne = b + r
      const a = b * q + resteDonne
      if (!this.questionJamaisPosee(exercice, a, b)) continue
      const quotientPositif = q + 1
      const quotientNegatif = -quotientPositif - 1
      const resteNegatif = b - r
      let enonce = `Sachant que $${a}=${q}\\times ${b}+${resteDonne}$, en déduire le quotient $q$ et le reste $r$ des divisions euclidiennes suivantes.<br>`
      const dividendes = [a, -a]
      const quotients = [quotientPositif, quotientNegatif]
      const restes = [r, resteNegatif]
      for (let i = 0; i < 2; i++) {
        let texte = `${i === 0 ? 'a' : 'b'}) Division euclidienne de $${dividendes[i]}$ par $${b}$.`
        if (this.interactif) {
          texte +=
            '<br>' +
            remplisLesBlancs(
              this,
              exercice,
              i === 0
                ? 'q=%{champ1}\\quad r=%{champ2}'
                : 'q=%{champ3}\\quad r=%{champ4}',
              KeyboardType.clavierDeBase,
            )
        }
        enonce += texte + (i === 0 ? '<br><br>' : '')
      }
      this.listeQuestions[exercice] = enonce
      handleAnswers(this, exercice, {
        bareme: toutPourUnPoint,
        champ1: { value: quotients[0] },
        champ2: { value: restes[0] },
        champ3: { value: quotients[1] },
        champ4: { value: restes[1] },
      })
      const correctionPositive = `Dans la division euclidienne de $${a}$ par $${b}$, le reste doit vérifier $0\\leqslant r<${b}$. Le nombre $${resteDonne}$ ne peut donc pas être le reste de cette division, car il est supérieur au diviseur $${b}$.<br>
    $\\begin{aligned}
    ${a}&=${b}\\times ${q}+${resteDonne} &&\\text{mais } ${resteDonne}>${b}\\\\
    ${a}&=${b}\\times ${q}+${b}+${r}\\\\
    ${a}&=${b}\\times (${q}+1)+${r}\\\\
    ${a}&=${b}\\times ${quotientPositif}+${r}.
    \\end{aligned}$<br>
    Comme $0\\leqslant ${r}<${b}$, il s’agit bien de la division euclidienne de $${a}$ par $${b}$.<br>
    Le quotient est donc $q=${miseEnEvidence(quotientPositif)}$ et le reste est $r=${miseEnEvidence(r)}$.`
      const correctionNegative = `En prenant l’opposé de l’égalité de l’énoncé, on a :<br>
    $\\begin{aligned}
    ${-a}&=${b}\\times (${-q})-${resteDonne} &&\\text{mais } -${resteDonne}<0\\\\
    ${-a}&=${b}\\times (${-q})-${b}-${r}\\\\
    ${-a}&=${b}\\times (${-q}-1)-${r}\\\\
    ${-a}&=${b}\\times (${-quotientPositif})-${r}\\\\
    ${-a}&=${b}\\times (${-quotientPositif})\\underbrace{-${b}+${b}}_{=0}-${r}\\\\
    ${-a}&=${b}\\times (${quotientNegatif})+${resteNegatif}.
    \\end{aligned}$<br>
    Comme $0\\leqslant ${resteNegatif}<${b}$, il s’agit bien de la division euclidienne de $${-a}$ par $${b}$.<br>
    Le quotient est donc $q=${miseEnEvidence(quotientNegatif)}$ et le reste est $r=${miseEnEvidence(resteNegatif)}$.`
      this.listeCorrections[exercice] =
        'a) ' + correctionPositive + '<br><br>b) ' + correctionNegative
      exercice++
    }
    listeQuestionsToContenu(this)
  }
}
