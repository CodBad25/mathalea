import Decimal from 'decimal.js'
import { propositionsQcm } from '../../lib/interactif/qcm'
import { choice, combinaisonListes } from '../../lib/outils/arrayOutils'
import {
  ecritureAlgebrique,
  ecritureAlgebriqueSauf1,
  ecritureParentheseSiNegatif,
  rienSi1,
} from '../../lib/outils/ecritures'
import { texteEnCouleur } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'
export const titre = 'Reconnaitre une suite arithmétique/géométrique (QCM)'
export const interactifReady = true
export const interactifType = 'qcm'
export const dateDePublication = '23/11/2024'

/**
 *
 * @author Gilles Mora

*/
export const uuid = '42983'

export const refs = {
  'fr-fr': ['1AL11-1', '1Gen-A201', '1Tec-S201'],
  'fr-ch': ['autres-2'],
}
export default class ReconnaitreSuites extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.spacing = 1.5
    this.spacingCorr = 1.5
    this.comment =
      'Cet exercice ne présentant que 3 types de suites différentes, ne possède que 3 questions au maximum.'
  }

  nouvelleVersion() {
    // this.consigne = this.interactif ? `Indiquer l'écriture simplifiée ${this.nbQuestions === 1 ? 'du calcul suivant.' : 'des calculs suivants.'}` : `Donner, si possible, une écriture simplifiée ${this.nbQuestions === 1 ? 'du calcul suivant.' : 'des calculs suivants.'}`
    const typeDeQuestionsDisponibles = [1, 2, 3]
    let typeDeQuestion
    const listeTypeDeQuestions = combinaisonListes(
      typeDeQuestionsDisponibles,
      this.nbQuestions,
    )

    for (
      let i = 0, a, b, r, q, u0, q1, monQcm, texte, texteCorr, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      typeDeQuestion = listeTypeDeQuestions[i]
      if (this.questionJamaisPosee(i, typeDeQuestion)) {
        const ListeNomS = ['u', 'v', 'w', 't']
        const NomS = choice(ListeNomS)
        const reponseSA = `La suite $(${NomS}_n)$ est arithmétique de raison `
        const reponseSG = `La suite $(${NomS}_n)$ est géométrique de raison `
        const reponseNiNi = `La suite $(${NomS}_n)$ n'est ni arithmétique, ni géométrique. `
        const NiNi = `$${NomS}_{1}-${NomS}_{0}\\neq ${NomS}_{2}-${NomS}_{1}$ donc la suite ${texteEnCouleur("n'est pas arithmétque")}.<br>
          $\\dfrac{${NomS}_{1}}{${NomS}_{0}}\\neq \\dfrac{${NomS}_{2}}{${NomS}_{1}}$ donc la suite ${texteEnCouleur("n'est pas géométrique")}.`
        switch (typeDeQuestion) {
          case 1: // SA
            switch (randint(1, 3)) {
              case 1:
                r = randint(-10, 10, 0)
                u0 = randint(-10, 10, [0, r])
                texte = `On considère la suite $(${NomS}_n)$ définie pour tout $n\\in \\mathbb{N}$ par : $${NomS}_n=${choice([true, false]) ? `${rienSi1(r)}n${ecritureAlgebrique(u0)}` : `${u0}${ecritureAlgebriqueSauf1(r)}n`}$.<br>
          Alors :`
                texteCorr = `On reconnaît la forme explicite d'une suite $${NomS}$ arithmétique de raison $r$ et de premier terme $${NomS}_0$ :<br> $${NomS}_n=${NomS}_0+n\\times r$ avec $${NomS}_0=${u0}$ et $r=${r}$.`
                break

              case 2: // SA forme explicite2
                r = randint(-10, 10, 0)
                u0 = randint(-10, 10, [0, r])
                texte = `On considère la suite $(${NomS}_n)$ définie pour tout $n\\in \\mathbb{N}^*$ par :
          $${NomS}_n=${choice([true, false]) ? `\\dfrac{${rienSi1(r)}n^2${ecritureAlgebrique(u0)}n}{n}` : `\\dfrac{${rienSi1(u0)}n${ecritureAlgebriqueSauf1(r)}n^2}{n}`}$.<br>
          Alors :`
                texteCorr = `$${NomS}_n=${choice([true, false]) ? `\\dfrac{${rienSi1(r)}n^2${ecritureAlgebrique(u0)}n}{n}` : `\\dfrac{${u0}n${ecritureAlgebriqueSauf1(r)}n^2}{n}`}
          =${rienSi1(r)}n${ecritureAlgebrique(u0)}$<br>
          On reconnaît la forme explicite d'une suite $${NomS}$ arithmétique de raison $r=${r}$.`
                break

              default: // SA forme récurrente
                u0 = randint(-10, 10, 0)
                r = randint(-10, 10, [0, u0])
                texte = `On considère la suite $(${NomS}_n)$ définie pour tout $n\\in \\mathbb{N}$ par : $${NomS}_{n+1}=${choice([true, false]) ? `${NomS}_n${ecritureAlgebrique(r)}` : `${r}+${NomS}_n`}$ et $${NomS}_0=${u0}$.<br>
                  Alors :`
                texteCorr = `On reconnaît la forme récurrente d'une suite $${NomS}$ arithmétique de raison $r$  :<br> $${NomS}_{n+1}=${NomS}_n+ r$ avec  $r=${r}$.`
                break
            }
            this.autoCorrection[i] = {
              enonce: texte,
              options: { vertical: true },
              propositions: [
                {
                  texte: reponseSA + `$${r}$.`,
                  statut: true,
                },
                {
                  texte: reponseSA + `$${u0}$.`,
                  statut: false,
                },
                {
                  texte: reponseSG + ` $${r}$.`,
                  statut: false,
                },
                {
                  texte: reponseNiNi,
                  statut: false,
                },
              ],
            }
            texteCorr =
              texteCorr +
              `<br> ${texteEnCouleur(`$(${NomS}_n)$ est une suite arithmétique de raison $${r}$`)}.`
            break

          case 2: // SG
            switch (randint(1, 4)) {
              case 1: // SG forme récurrente
                u0 = randint(-10, 10, 0)
                q = randint(-9, 9, [0, 1, -1, u0])
                texte = `On considère la suite $(${NomS}_n)$ définie pour tout $n\\in \\mathbb{N}$ par : $${NomS}_{n+1}=${choice([true, false]) ? `${NomS}_n\\times ${ecritureParentheseSiNegatif(q)}` : `${q}${NomS}_n`}$ et $${NomS}_0=${u0}$.<br>
            Alors :`
                texteCorr = `On reconnaît la forme récurrente d'une suite $${NomS}$ géométrique de raison $q$  :<br> $${NomS}_{n+1}=q\\times ${NomS}_n$ avec  $q=${q}$.`
                break
              case 2:
                a = new Decimal(randint(-9, 9, 0)).div(10)
                u0 = randint(-9, 9, 0)
                q = a.add(1)
                texte = `On considère la suite $(${NomS}_n)$ définie pour tout $n\\in \\mathbb{N}$ par : $${NomS}_{n+1}=${NomS}_n${ecritureAlgebrique(a)}${NomS}_n$.<br>
          Alors :`
                texteCorr = `$${NomS}_{n+1}=${NomS}_n${ecritureAlgebrique(a)}${NomS}_n=${texNombre(q, 1)}${NomS}_n$.<br>
          On reconnaît la forme récurrente d'une suite $${NomS}$ géométrique de raison $q=${texNombre(q, 1)}$.`
                break

              case 3: // SG forme explicite1
                q = new Decimal(randint(-9, 9, 0)).div(10)
                u0 = randint(-9, 9, [0, -1, 1])
                texte = `On considère la suite $(${NomS}_n)$ définie pour tout $n\\in \\mathbb{N}$ par : $${NomS}_{n}=${u0}\\times ${ecritureParentheseSiNegatif(q)}^n$.<br>
                  Alors :`
                texteCorr = `On reconnaît la forme explicite d'une suite $${NomS}$ géométrique de raison $q$ et de premier terme $${NomS}_0$ :<br> $${NomS}_n=${NomS}_0\\times q^n$ avec $${NomS}_0=${u0}$ et $q=${texNombre(q, 1)}$.`
                break
              default: // SG forme explicite2
                q1 = choice([2, 4, 5])
                q = new Decimal(1).div(q1)
                u0 = randint(-9, 9, [0, -1, 1, q1])
                texte = `On considère la suite $(${NomS}_n)$ définie pour tout $n\\in \\mathbb{N}$ par : $${NomS}_{n}=\\dfrac{${u0}}{${q1}^n}$.<br>
                  Alors :`
                texteCorr = `On a $${NomS}_{n}=\\dfrac{${u0}}{${q1}^n}=${u0}\\times \\left(\\dfrac{1}{${q1}}\\right)^n$.<br>
                  On reconnaît la forme explicite d'une suite $${NomS}$ géométrique de raison $q$ et de premier terme $${NomS}_0$ :<br> $${NomS}_n=${NomS}_0\\times q^n$ avec $${NomS}_0=${u0}$ et $q=\\dfrac{1}{${q1}}=${texNombre(q, 2)}$.`
                break
            }

            this.autoCorrection[i] = {
              enonce: texte,
              options: { vertical: true },
              propositions: [
                {
                  texte: reponseSA + `$${texNombre(q, 2)}$.`,
                  statut: false,
                },
                {
                  texte: reponseSG + `$${u0}$.`,
                  statut: false,
                },
                {
                  texte: reponseSG + ` $${texNombre(q, 2)}$.`,
                  statut: true,
                },
                {
                  texte: reponseNiNi,
                  statut: false,
                },
              ],
            }
            texteCorr =
              texteCorr +
              `<br> ${texteEnCouleur(`$(${NomS}_n)$ est une suite géométrique de raison $${texNombre(q, 2)}$`)}.`
            break

          default: // NiNi
            switch (randint(1, 3)) {
              case 1: // NiNi1
                u0 = randint(-9, 9, [0, -1, 1])
                a = randint(-9, 9, [0, u0])
                texte = `On considère la suite $(${NomS}_n)$ définie pour tout $n\\in \\mathbb{N}$ par : $${NomS}_{n+1}=${a}-${NomS}_{n}$ et $${NomS}_{0}=${u0}$.<br>
            Alors :`
                texteCorr =
                  `On a $${NomS}_{0}=${u0}$, $${NomS}_{1}=${a - u0}$ et $${NomS}_{2}=${u0}$.<br>
            ` + NiNi
                break
              case 2:
                u0 = randint(-9, 9, [0, -1, 1])
                a = randint(-5, 5, [0, u0, -1, 1])
                b = randint(-5, 5, [0, a])
                texte = `On considère la suite $(${NomS}_n)$ définie pour tout $n\\in \\mathbb{N}$ par : $${NomS}_{n+1}=${a}${NomS}_{n}${ecritureAlgebrique(b)}$ et $${NomS}_{0}=${u0}$.<br>
            Alors :`

                texteCorr =
                  `On a $${NomS}_{0}=${u0}$, $${NomS}_{1}=${a * u0 + b}$ et $${NomS}_{2}=${a * (a * u0 + b) + b}$.<br>
            ` + NiNi
                break
              default: // NiNi3
                a = randint(-5, 5, 0)
                u0 = randint(-5, 5, [0, a])
                texte = `On considère la suite $(${NomS}_n)$ définie pour tout $n\\in \\mathbb{N}$ par : $${NomS}_{n}=${rienSi1(a)}n^2${ecritureAlgebrique(u0)}$.<br>
            Alors :`
                texteCorr =
                  `On a $${NomS}_{0}=${u0}$, $${NomS}_{1}=${a + u0}$ et $${NomS}_{2}=${a * 4 + u0}$.<br>
            ` + NiNi
                break
            }

            this.autoCorrection[i] = {
              enonce: texte,
              options: { vertical: true },
              propositions: [
                {
                  texte: reponseSA + `$${a}$.`,
                  statut: false,
                },
                {
                  texte: reponseSG + `$${a}$.`,
                  statut: false,
                },
                {
                  texte: reponseSA + `$${u0}$.`,
                  statut: false,
                },
                {
                  texte: reponseNiNi,
                  statut: true,
                },
              ],
            }
            break
        }
        monQcm = propositionsQcm(this, i)
        texte = texte + monQcm.texte

        // Si la question n'a jamais été posée, on en créé une autre
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
