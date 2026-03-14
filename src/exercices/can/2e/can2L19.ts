import { texteCentre } from '../../../lib/format/miseEnPage'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { context } from '../../../modules/context'
import ExerciceSimple from '../../ExerciceSimple'
export const titre =
  'Exprimer une variable en fonction des autres (formules avec sommes/produits/quotients)'
export const interactifReady = true
export const interactifType = 'qcm'

// Les exports suivants sont optionnels mais au moins la date de publication semble essentielle
export const dateDePublication = '06/07/2025' // La date de publication initiale au format 'jj/mm/aaaa' pour affichage temporaire d'un tag
export const dateDeModifImportante = '14/02/2026' // Une date de modification importante au format 'jj/mm/aaaa' pour affichage temporaire d'un tag

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/
export const uuid = 'c42f7'

export const refs = {
  'fr-fr': ['can2L19'],
  'fr-ch': [],
}
export default class ExprimerEnFonction extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.versionQcmDisponible = true
    this.formatChampTexte = KeyboardType.alphanumeric
    this.optionsChampTexte = { texteAvant: '<br> ' }
    this.optionsDeComparaison = { calculFormel: true }
  }

  nouvelleVersion() {
    const choixQ = choice([true, false])

    if (context.isAmc) this.versionQcm = false
    switch (
      choice([1, 2, 3, 4, 5]) //
    ) {
      case 1:
        this.question = `Le degré Fahrenheit $F$ est une unité de mesure de la température utilisée aux États-Unis. <br>Il est lié au degré Celsius $C$ par la formule suivante : <br>`
        this.question += choixQ
          ? `${texteCentre('$F=\\dfrac{9}{5}C+32$')}`
          : `${texteCentre('$C=\\dfrac{5}{9}(F-32)$')}`
        if (this.versionQcm) {
          this.question += choixQ
            ? `L'expression permettant, à partir de cette formule, d'exprimer $C$ est : `
            : `L'expression permettant, à partir de cette formule, d'exprimer $F$ est : `
          this.reponse = choixQ
            ? '$C=\\dfrac{5}{9}(F-32)$'
            : '$F=\\dfrac{9}{5}C+32$'
        } else {
          this.question += choixQ
            ? `Donner l'expression permettant, à partir de cette formule, d'exprimer $C$.`
            : `Donner l'expression permettant, à partir de cette formule, d'exprimer $F$.`
          this.reponse = choixQ
            ? '$\\dfrac{5}{9}(F-32)$'
            : '$\\dfrac{9}{5}C+32$'
        }
        if (this.versionQcm) {
          this.distracteurs = choixQ
            ? [
                '$C=\\dfrac{9}{5}(F-32)$',
                '$C=\\dfrac{5}{9}F-32$',
                '$C=\\dfrac{5F-32}{9}$',
              ]
            : [
                '$F=\\dfrac{5}{9}C+32$',
                '$F=\\dfrac{9}{5}C-32$',
                '$F=\\dfrac{9}{5}(C+32)$',
              ]
        }
        choixQ
          ? (this.optionsChampTexte = {
              texteAvant: '<br> $C=$',
              texteApres: ' ',
            })
          : (this.optionsChampTexte = {
              texteAvant: '<br> $F=$',
              texteApres: ' ',
            })
        this.correction = choixQ
          ? `On part de la formule : $F = \\dfrac{9}{5}C + 32$.<br>
En isolant  $C$, on obtient  : $F - 32 = \\dfrac{9}{5}C$.<br>
En multipliant les deux membres par $\\dfrac{5}{9}$, on obtient  : $${miseEnEvidence('C = \\dfrac{5}{9}(F - 32)')}$.`
          : `On part de la formule : $C = \\dfrac{5}{9}(F - 32)$<br>
En multipliant les deux membres par $\\dfrac{9}{5}$, on obtient : $\\dfrac{9}{5}C = F - 32$.<br>
Puis en isolant  $F$, on obtient : $${miseEnEvidence('F = \\dfrac{9}{5}C + 32')}$.`
        break
      case 2:
        this.question = `Le taux d'évolution $T$ entre une valeur initiale $I$ et une valeur finale $F$ est donné par la formule : <br>`
        this.question += choixQ
          ? `${texteCentre('$T=\\dfrac{F-I}{I}$')}`
          : `${texteCentre('$F=I(1+T)$')}`
        if (this.versionQcm) {
          this.question += choixQ
            ? `L'expression permettant, à partir de cette formule, d'exprimer $I$ est : `
            : `L'expression permettant, à partir de cette formule, d'exprimer $T$ est : `
          this.reponse = choixQ ? '$I=\\dfrac{F}{1+T}$' : '$T=\\dfrac{F-I}{I}$'
        } else {
          this.question += choixQ
            ? `Donner l'expression permettant, à partir de cette formule, d'exprimer $I$.`
            : `Donner l'expression permettant, à partir de cette formule, d'exprimer $T$.`
          this.reponse = choixQ ? '$\\dfrac{F}{1+T}$' : '$\\dfrac{F-I}{I}$'
        }
        if (this.versionQcm) {
          this.distracteurs = choixQ
            ? ['$I=\\dfrac{F}{T}$', '$I=\\dfrac{1+T}{F}$', '$I=F(1-T)$']
            : [
                '$T=\\dfrac{F}{I}$',
                '$T=\\dfrac{I-F}{I}$',
                '$T=\\dfrac{F+I}{I}$',
              ]
        }
        choixQ
          ? (this.optionsChampTexte = {
              texteAvant: '<br> $I=$',
              texteApres: ' ',
            })
          : (this.optionsChampTexte = {
              texteAvant: '<br> $T=$',
              texteApres: ' ',
            })
        if (choixQ) {
          this.correction = `On part de la formule : $T = \\dfrac{F-I}{I}$.<br>
En multipliant  par $I$ les deux membres, on obtient : $TI = F - I$.<br>
En isolant $I$ et en factorisant, on obtient : $TI + I = F$, soit $I(T + 1) = F$.<br>
Donc : $${miseEnEvidence('I = \\dfrac{F}{1 + T}')}$.`
        } else {
          this.correction = `On part de la formule : $F = I(1 + T)$.<br>
En divisant les deux membres par $I$, on obtient : $\\dfrac{F}{I} = 1 + T$.<br>
En isolant $T$, on obtient : $${miseEnEvidence('T = \\dfrac{F}{I} - 1 = \\dfrac{F - I}{I}')}$.`
        }
        break

      case 4:
        this.question = `L'aire $A$ d'un trapèze de petite base $b$, de grande base $B$ et de hauteur $h$ est donnée par :<br>`
        this.question += texteCentre('$A=\\dfrac{(b+B)\\times h}{2}$')
        if (this.versionQcm) {
          this.question += choixQ
            ? `L'expression permettant, à partir de cette formule, d'exprimer la hauteur $h$ est : `
            : `L'expression permettant, à partir de cette formule, d'exprimer la grande base $B$ est : `
          this.reponse = choixQ
            ? '$h=\\dfrac{2A}{b+B}$'
            : '$B=\\dfrac{2A}{h}-b$'
        } else {
          this.question += choixQ
            ? `Donner l'expression permettant, à partir de cette formule, d'exprimer la hauteur $h$.`
            : `Donner l'expression permettant, à partir de cette formule, d'exprimer la grande base $B$.`
          this.reponse = choixQ
            ? ['$\\dfrac{2A}{b+B}$', '$\\dfrac{2A}{B+b}$']
            : ['$\\dfrac{2A}{h}-b$', '$\\dfrac{2A-bh}{h}$']
        }
        if (this.versionQcm) {
          this.distracteurs = choixQ
            ? ['$h=\\dfrac{A}{b+B}$', '$h=\\dfrac{2A}{bB}$', '$h=2A(b+B)$']
            : [
                '$B=\\dfrac{2A}{h}+b$',
                '$B=\\dfrac{2A-b}{h}$',
                '$B=\\dfrac{A}{h}-b$',
              ]
        }
        choixQ
          ? (this.optionsChampTexte = {
              texteAvant: '<br> $h=$',
              texteApres: ' ',
            })
          : (this.optionsChampTexte = {
              texteAvant: '<br> $B=$',
              texteApres: ' ',
            })

        if (choixQ) {
          this.correction = `On part de la formule : $A = \\dfrac{(b + B) \\times h}{2}$.<br>
En multipliant les deux membres par $2$, on obtient : $2A = (b + B) \\times h$.<br>
En isolant $h$, on obtient : $${miseEnEvidence('h = \\dfrac{2A}{b + B}')}$.`
        } else {
          this.correction = `On part de la formule : $A = \\dfrac{(b + B) \\times h}{2}$.<br>
En multipliant les deux membres par $2$, on obtient : $2A = (b + B) \\times h$.<br>
En divisant par $h$, on obtient : $\\dfrac{2A}{h} = b + B$.<br>
En isolant $B$, on obtient : $${miseEnEvidence('B = \\dfrac{2A}{h} - b')}$.`
        }
        break
      case 3:
        this.question = `Le périmètre $P$ d'un rectangle est donnée en fonction de sa longueur $L$ et sa largeur $\\ell$.<br>`
        this.question += texteCentre('$P=2(L+\\ell)$')
        this.reponse = choixQ ? '$\\dfrac{P}{2}-l$' : '$\\dfrac{P}{2}-L$'
        if (this.versionQcm) {
          this.question += choixQ
            ? `L'expression permettant, à partir de cette formule, d'exprimer $L$ est : `
            : `L'expression permettant, à partir de cette formule, d'exprimer $\\ell$ est : `
          this.reponse = choixQ
            ? '$L=\\dfrac{P}{2}-\\ell$'
            : '$\\ell=\\dfrac{P}{2}-L$'
        } else {
          this.question += choixQ
            ? `Donner l'expression permettant, à partir de cette formule, d'exprimer $L$.`
            : `Donner l'expression permettant, à partir de cette formule, d'exprimer $\\ell$.`
        }
        if (this.versionQcm) {
          this.distracteurs = choixQ
            ? [
                '$L=\\dfrac{P-\\ell}{2}$',
                '$L=P-2\\ell$',
                '$L=\\dfrac{P}{2\\ell}$',
              ]
            : [
                '$\\ell=\\dfrac{P-L}{2}$',
                '$\\ell=P-2L$',
                '$\\ell=\\dfrac{P}{2L}$',
              ]
        }
        choixQ
          ? (this.optionsChampTexte = {
              texteAvant: '<br> $L=$',
              texteApres: ' ',
            })
          : (this.optionsChampTexte = {
              texteAvant: '<br> $\\ell=$',
              texteApres: ' ',
            })

        if (choixQ) {
          this.correction = `On part de la formule : $P = 2(L + \\ell)$.<br>
En développant, on obtient : $P = 2L + 2\\ell$.<br>
En isolant $2L$, puis en divisant par $2$, on obtient : $2L = P - 2\\ell$ soit $${miseEnEvidence('L = \\dfrac{P}{2} - \\ell')}$.<br>`
        } else {
          this.correction = `On part de la formule : $P = 2(L + \\ell)$.<br>
En développant, on obtient : $P = 2L + 2\\ell$.<br>
En isolant $2\\ell$, puis en divisant par $2$, on obtient : $2\\ell = P - 2L$, soit $${miseEnEvidence('\\ell = \\dfrac{P}{2} - L')}$. `
        }
        break

      case 5:
      default:
        this.question = `Le taux de marge $T$ d'un produit est donné par la formule suivante où $M$ est la marge et $C$ le coût d'achat :<br>`
        this.question += texteCentre('$T=\\dfrac{M}{C}\\times 100$')
        if (this.versionQcm) {
          this.question += choixQ
            ? `L'expression permettant, à partir de cette formule, d'exprimer $M$ est : `
            : `L'expression permettant, à partir de cette formule, d'exprimer $C$ est : `
          this.reponse = choixQ
            ? '$M=\\dfrac{TC}{100}$'
            : '$C=\\dfrac{100M}{T}$'
        } else {
          this.question += choixQ
            ? `Donner l'expression permettant, à partir de cette formule, d'exprimer $M$.`
            : `Donner l'expression permettant, à partir de cette formule, d'exprimer $C$.`
          this.reponse = choixQ
            ? ['$\\dfrac{TC}{100}$', '$\\dfrac{CT}{100}$']
            : ['$\\dfrac{100M}{T}$', '$\\dfrac{M\\times 100}{T}$']
        }
        if (this.versionQcm) {
          this.distracteurs = choixQ
            ? [
                '$M=\\dfrac{T}{100C}$',
                '$M=\\dfrac{100T}{C}$',
                '$M=\\dfrac{100C}{T}$',
              ]
            : [
                '$C=\\dfrac{MT}{100}$',
                '$C=\\dfrac{100T}{M}$',
                '$C=\\dfrac{T}{100M}$',
              ]
        }
        choixQ
          ? (this.optionsChampTexte = {
              texteAvant: '<br> $M=$',
              texteApres: ' ',
            })
          : (this.optionsChampTexte = {
              texteAvant: '<br> $C=$',
              texteApres: ' ',
            })

        if (choixQ) {
          this.correction = `On part de la formule : $T = \\dfrac{M}{C} \\times 100$.<br>
En divisant les deux membres par $100$, on obtient : $\\dfrac{T}{100} = \\dfrac{M}{C}$.<br>
En multipliant les deux membres par $C$, on obtient : $${miseEnEvidence('M = \\dfrac{TC}{100}')}$.`
        } else {
          this.correction = `On part de la formule : $T = \\dfrac{M}{C} \\times 100$.<br>
En divisant les deux membres par $100$, on obtient : $\\dfrac{T}{100} = \\dfrac{M}{C}$.<br>
En multipliant les deux membres par $C$, on obtient : $\\dfrac{TC}{100} = M$.<br>
En divisant les deux membres par $\\dfrac{T}{100}$, on obtient : $${miseEnEvidence('C = \\dfrac{100M}{T}')}$.`
        }
        break
    }
  }
}
