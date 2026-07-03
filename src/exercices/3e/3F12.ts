import { combinaisonListesSansChangerOrdre } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { numAlpha } from '../../lib/outils/outilString'
import { context } from '../../modules/context'
import { texCadreParOrange, tikzMachineDiag } from '../../modules/machines'
import { SvgMachineDiag3F12 } from '../../modules/macroSvgJs'
import {
  gestionnaireFormulaireTexte,
  itemize,
  listeQuestionsToContenu,
  randint,
  texEnumerate,
} from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  'Calculer, de manières différentes, des images par une fonction'

/**
 * 3F12 Notion de fonction - Vocabulaire
 * Déterminer à partir de plusieurs modes de représentation l'image d'un nombre
 * @author Sébastien LOZANO
 */
export const uuid = '02116'

export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export default class FonctionsCalculsDImages extends Exercice {
  constructor() {
    super()
    // this.besoinFormulaireNumerique = ['Règle à travailler', 5, '1 : À partir d\'un programme de calcul\n2 : À partir de l\'expression algébrique sous forme f(x) = ...\n3 : À partir de l\'expression algébrique sous forme f : x --> ...\n4 : À partir d\'un diagramme\n5 : Mélange']
    this.besoinFormulaireTexte = [
      'Règle à travailler',
      "Nombres séparés par des tirets :\n1 : À partir d'un programme de calcul\n2 : À partir de l'expression algébrique sous forme f(x) = ...\n3 : À partir de l'expression algébrique sous forme f : x --> ...\n4 : À partir d'un diagramme\n5 : Mélange",
    ]
    // pas de différence entre la version html et la version latex pour la consigne

    this.spacing = context.isHtml ? 2 : 1
    this.spacingCorr = context.isHtml ? 2 : 1
    this.nbQuestions = 4
    // this.correctionDetailleeDisponible = true;

    this.sup = 5
  }

  nouvelleVersion(numeroExercice: number) {
    let pourcentage, j
    let idDuDiv = ''
    let idDuDivCorr = ''
    const numEx = '3F12' // pour rendre unique les id des SVG, en cas d'utilisation dans plusieurs exercices y faisant appel

    if (context.isHtml) {
      pourcentage = '100%' // pour l'affichage des svg. On a besoin d'une variable globale
    } else {
      // sortie LaTeX
    }
    let typesDeQuestions

    // let typesDeQuestionsDisponibles = [1];
    const typesDeQuestionsDisponibles = gestionnaireFormulaireTexte({
      saisie: this.sup,
      min: 1,
      max: 4,
      melange: 5,
      defaut: 5,
      nbQuestions: 50,
    })
    const listeTypeDeQuestions = combinaisonListesSansChangerOrdre(
      typesDeQuestionsDisponibles,
      this.nbQuestions,
    )

    for (
      let i = 0, a, b, c, texte, texteCorr, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      typesDeQuestions = listeTypeDeQuestions[i]
      texte = ''
      texteCorr = ''
      if (context.isHtml) {
        const idUnique = `${numEx}_${i}_${Date.now()}`
        idDuDiv = `div_svg${numeroExercice}${idUnique}`
        idDuDivCorr = `div_svg_corr${numeroExercice}${idUnique}`
      }
      // on part sur de l'affine avec coeff positifs, on verra ensuite
      a = randint(2, 9)
      b = randint(2, 9)
      c = randint(2, 9)

      switch (typesDeQuestions) {
        case 1:
          j = 0 // pour la sous-numérotation
          texte =
            'On donne le programme de calcul suivant qui correspond à une certaine fonction :'
          texteCorr = 'Avec ce programme de calcul :'
          if (context.isHtml) {
            texte += `<br>
<div class="ui compact warning message">
<p>
- Choisir un nombre.<br>
- Multiplier ce nombre par ${a}.<br>
- Ajouter ${b} au résultat obtenu.<br>
</p>
</div>
<br>`
            // sous-question a/
            texte +=
              numAlpha(j) +
              ` Appliquer ce programme de calcul au nombre ${c}.<br>`
            texteCorr +=
              '<br>' +
              numAlpha(j) +
              `
<br>
<div class="ui compact warning message">
<p>
- On choisit le nombre ${c}.<br>
- On multiplie ce nombre par ${a}, soit ${a}$\\times$ ${c} = ${a * c}.<br>
- On ajoute ${b} au résultat obtenu, soit ${a * c}+${b}=${a * c + b}.<br>
</p>
</div>
<br>
`
            j++
            // sous-question b/
            texte +=
              numAlpha(j) +
              ' Traduire ce calcul par une phrase contenant le mot image.'
            texteCorr +=
              numAlpha(j) +
              `L'image de ${c} par cette fonction vaut ${a * c + b}.`
            texteCorr += `<br> On peut aussi dire que ${a * c + b} est l'image de ${c} par cette fonction.`
          } else {
            const monTexte = itemize([
              'Choisir un nombre.',
              `Multiplier ce nombre par ${a}.`,
              `Ajouter ${b} au résultat obtenu.`,
            ])
            texte += texCadreParOrange(
              typeof monTexte === 'string' ? monTexte : '',
            )
            // sous-question a/
            texte += texEnumerate(
              [
                `Appliquer ce programme de calcul au nombre ${c}.`,
                'Traduire ce calcul par une phrase contenant le mot image.',
              ],
              this.spacing,
            )
            const monTexteCorr = itemize([
              `On choisit le nombre ${c}`,
              `On multiplie ce nombre par ${a} : $${a} \\times ${c} = ${a * c}$. `,
              `On ajoute ${b} au résultat obtenu : $${a * c}+${b}=${a * c + b}$.`,
            ])
            texteCorr += texEnumerate(
              [
                texCadreParOrange(
                  typeof monTexteCorr === 'string' ? monTexteCorr : '',
                ),
                `L'image de ${c} par cette fonction vaut ${a * c + b}.<br>On peut aussi dire que ${a * c + b} est l'image de ${c} par cette fonction.`,
              ],
              this.spacing,
            )
          }

          break
        case 2:
          j = 0 // pour la sous-numérotation

          // les variables a,b,c changent sans refaire un appel à randint
          texte = `Soit $f$ la fonction définie par l'expression algébrique $f(x)=$ ${a}$x+$${b}.`
          if (context.isHtml) {
            // sous-question a/
            texte += '<br>' + numAlpha(j) + ` Calculer l'image de ${c}.`
            texte += '<br>'
            texteCorr =
              numAlpha(j) + ` Calculons l'image par $f$ de $x= ${c}$ :`
            texteCorr += `<br>$f(${miseEnEvidence('\\textit{\\textbf{x}}')})= ${a} ${miseEnEvidence('\\textit{\\textbf{x}}')}+${b}$`
            texteCorr += `<br>$f(${miseEnEvidence(c)})= ${a}\\times ${miseEnEvidence(c)}+${b}$`
            texteCorr += `<br>$f(${miseEnEvidence(c)})= ${a * c}+${b}$`
            texteCorr += `<br>$f(${miseEnEvidence(c)})= ${a * c + b}$`
            j++
            // sous question b/
            texte +=
              numAlpha(j) +
              ' Traduire ce calcul par une phrase contenant le mot image.'
            texteCorr +=
              '<br>' +
              numAlpha(j) +
              ` L'image de ${c} par la fonction $f$ vaut ${a * c + b}.`
            texteCorr += `<br> On peut aussi dire que ${a * c + b} est l'image de ${c} par la fonction $f$.`
          } else {
            // sous-question a/ et b/
            texte += texEnumerate(
              [
                `Calculer l'image de ${c}.`,
                'Traduire ce calcul par une phrase contenant le mot image.',
              ],
              this.spacing,
            )
            texteCorr = texEnumerate(
              [
                `Calculons l'image par $f$ de $x= ${c}$ :<br>
                $f(${miseEnEvidence('\\textit{\\textbf{x}}')})= ${a} ${miseEnEvidence('\\textit{\\textbf{x}}')}+${b}$<br>
                $f(${miseEnEvidence(c)})= ${a}\\times ${miseEnEvidence(c)}+${b}$<br>
                $f(${miseEnEvidence(c)})= ${a * c}+${b}$<br>
                $f(${miseEnEvidence(c)})= ${a * c + b}$`,
                `L'image de ${c} par la fonction $f$ vaut ${a * c + b}.<br>
                 On peut aussi dire que ${a * c + b} est l'image de ${c} par la fonction $f$.`,
              ],
              this.spacing,
            )
          }

          break
        case 3:
          j = 0 // pour la sous-numérotation

          // les variables a,b,c changent sans refaire un appel à randint
          texte = `Soit $g$ la fonction définie par $g:x\\longmapsto$ ${a}$x+$${b}.`
          if (context.isHtml) {
            // sous-question a/
            texte += '<br>' + numAlpha(j) + ` Calculer l'image de ${c}.`
            texte += '<br>'
            texteCorr =
              numAlpha(j) + ` Calculons l'image par $g$ de $x= ${c}$ :`
            texteCorr += `<br>$g:${miseEnEvidence('\\textit{\\textbf{x}}')}\\longmapsto ${a} ${miseEnEvidence('\\textit{\\textbf{x}}')}+${b}$`
            texteCorr += `<br>$g:${miseEnEvidence(c)}\\longmapsto ${a}\\times${miseEnEvidence(c)}+${b}$`
            texteCorr += `<br>$g:${miseEnEvidence(c)}\\longmapsto ${a * c}+${b}$`
            texteCorr += `<br>$g:${miseEnEvidence(c)}\\longmapsto ${a * c + b}$`
            j++
            // sous question b/
            texte +=
              numAlpha(j) +
              ' Traduire ce calcul par une phrase contenant le mot image.'
            texteCorr +=
              '<br>' +
              numAlpha(j) +
              ` L'image de ${c} par la fonction $g$ vaut ${a * c + b}.`
            texteCorr += `<br> On peut aussi dire que ${a * c + b} est l'image de ${c} par la fonction $g$.`
          } else {
            // sous-question a/ et b/
            texte += texEnumerate(
              [
                `Calculer l'image de ${c}.`,
                'Traduire ce calcul par une phrase contenant le mot image.',
              ],
              this.spacing,
            )
            texteCorr = texEnumerate(
              [
                `Calculons l'image par $g$ de $x= ${c}$ :<br>
                $g:${miseEnEvidence('\\textit{\\textbf{x}}')}\\longmapsto ${a} ${miseEnEvidence('\\textit{\\textbf{x}}')}+${b}$<br>
                $g:${miseEnEvidence(c)}\\longmapsto ${a}\\times ${miseEnEvidence(c)}+${b}$<br>
                $g:${miseEnEvidence(c)}\\longmapsto ${a * c}+${b}$<br>
                $g:${miseEnEvidence(c)}\\longmapsto ${a * c + b}$`,
                `L'image de ${c} par la fonction $g$ vaut ${a * c + b}.<br>
                 On peut aussi dire que ${a * c + b} est l'image de ${c} par la fonction $g$.`,
              ],
              this.spacing,
            )
          }

          break
        case 4:
          texte = ''
          texteCorr = ''
          texteCorr += 'Calculer avec un diagramme.'
          j = 0 // pour la sous-numérotation

          // les variables a,b,c changent sans refaire un appel à randint
          texte += 'Soit la fonction $h$ définie par le diagramme :'
          if (context.isHtml) {
            // sous-question a/
            texte += `<div id="${idDuDiv}" style="width: ${pourcentage}"; height: 50px; display : table ">${SvgMachineDiag3F12(
              idDuDiv,
              800,
              100,
              'h',
              'x',
              [
                ['' + a, a + 'x'],
                ['' + b, a + 'x+' + b],
              ],
            )}</div>`
            texte += numAlpha(j) + ` Calculer l'image de ${c}.`
            texte += '<br>'
            texteCorr += '<br>'
            texteCorr +=
              numAlpha(j) + ` Calculons l'image par $h$ de $x=$ ${c} :`
            texteCorr += `<div id="${idDuDivCorr}" style="width: ${pourcentage}"; display : table ">${SvgMachineDiag3F12(
              idDuDivCorr,
              800,
              100,
              'h',
              '' + c,
              [
                ['' + a, '' + a * c],
                ['' + b, '' + (a * c + b)],
              ],
            )}</div>`
            j++
            // sous question b/
            texte +=
              numAlpha(j) +
              ' Traduire ce calcul par une phrase contenant le mot image.'
            texteCorr +=
              '<br>' +
              numAlpha(j) +
              ` L'image de ${c} par la fonction $h$ vaut ${a * c + b}.`
            texteCorr += `<br> On peut aussi dire que ${a * c + b} est l'image de ${c} par la fonction $h$.`
          } else {
            texte +=
              '<br>' +
              tikzMachineDiag('h', 'x', [
                ['\\times ' + a, a + 'x'],
                ['+' + b, a + 'x+' + b],
              ])
            // sous-question a/ et b/
            texte += texEnumerate(
              [
                `Calculer l'image de ${c}.`,
                'Traduire ce calcul par une phrase contenant le mot image.',
              ],
              this.spacing,
            )
            texteCorr = texEnumerate(
              [
                `Calculons l'image par $g$ de $x=$ ${c} :<br>` +
                  tikzMachineDiag('h', `${c}`, [
                    ['\\times ' + a, a * c],
                    ['+' + b, a * c + b],
                  ]),
                `L'image de ${c} par la fonction $g$ vaut ${a * c + b}.<br>
                 On peut aussi dire que ${a * c + b} est l'image de ${c} par la fonction $g$.`,
              ],
              this.spacing,
            )
          }

          break
      }

      if (this.questionJamaisPosee(i, a, b, c)) {
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
