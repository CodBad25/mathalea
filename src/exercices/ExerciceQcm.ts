/* eslint-disable no-template-curly-in-string */
import { qcmCamExport } from '../lib/amc/qcmCam'
import { createList } from '../lib/format/lists'
import { propositionsQcm } from '../lib/interactif/qcm'
import { texteEnCouleurEtGras } from '../lib/outils/embellissements'
import type { IExerciceQcm, IExerciceQcmOptions } from '../lib/types'
import { context } from '../modules/context'
import Exercice from './Exercice'

// export const uuid = 'UUID à modifier'
// export const titre = 'Titre de l'exercice à modifier'
// export const refs = [{'fr-fr',['ref française à renseigner']},{'fr-ch', ['ref suisse à renseigner']}]

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'

export const nombreElementsDifferents = (liste: string[]) => {
  const elements = new Set(liste)
  return elements.size
}

// class à utiliser pour fabriquer des Qcms sans aléatoirisation (en cas d'aléatoirisation, on utilisera ExerciceQcmA à la place)
export default class ExerciceQcm extends Exercice implements IExerciceQcm {
  versionQcm?: boolean
  versionQcmDisponible = true

  enonce!: string
  reponses!: string[]
  bonnesReponses?: boolean[]
  corrections?: string[]
  options: IExerciceQcmOptions
  ajouteQcmCorr = false // Pour savoir si on ajoute le qcm corrigé à la fin de la correction.
  versionAleatoire?: () => void
  versionOriginale?: () => void = undefined
  constructor() {
    super()
    this.besoinFormulaire2CaseACocher = ['Consigne augmentée', false]
    this.sup2 = false
    // Il n'est pas prévu d'avoir plus d'une question car ceci est prévu pour un seul énoncé statique à la base même si on pourra changer les valeurs et prévoir une aléatoirisation
    this.nbQuestions = 1
    this.nbQuestionsModifiable = false

    this.spacingCorr = 2 // idem pour la correction
    // Les options pour le qcm à modifier éventuellement (vertical à true pour les longues réponses par exemple)
    this.options = { vertical: false, ordered: false, lastChoice: 8 }
    this.enonce = ''
    this.reponses = []
    this.correction = ''
  }

  nouvelleVersion() {
    if (this.sup2) {
      this.consigne =
        this.bonnesReponses == null
          ? `Parmi les ${this.reponses.length} réponses ci-dessous, une seule est correcte.<br>
${this.interactif || context.isAmc ? 'Cocher la case correspondante' : 'Donner la lettre correspondante'}${this.sup4 ? ', ou choisir « Je ne sais pas ».' : '.'}`
          : `Parmi les ${this.reponses.length} réponses ci-dessous, il peut y avoir plusieurs bonnes réponses.<br>
${this.interactif || context.isAmc ? 'Cocher la (ou les) case(s) correspondante(s)' : 'Donner la (ou les) lettre(s) correspondante(s)'}${this.sup4 ? ', ou choisir « Je ne sais pas ».' : '.'}`
    } else {
      this.consigne = ''
    }
    const statuts: boolean[] = []
    if (this.bonnesReponses == null) {
      statuts.fill(false, 0, this.reponses.length - 1)
      statuts[0] = true
    } else {
      for (let k = 0; k < this.reponses.length; k++) {
        statuts[k] = this.bonnesReponses[k] ?? false
      }
    }
    if (this.versionAleatoire != null) {
      for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 30; ) {
        if (this.sup && this.versionOriginale != null) this.versionOriginale()
        else this.versionAleatoire()

        const bonneReponse = this.reponses[0]
        if (this.questionJamaisPosee(i, bonneReponse)) {
          let texte = this.enonce
          this.autoCorrection[i] = {}
          if (this.options != null) {
            this.autoCorrection[i].options = { ...this.options }
          }
          const autoCorr = this.autoCorrection[i]
          autoCorr.propositions = []
          for (let j = 0; j < this.reponses.length; j++) {
            autoCorr.propositions.push({
              texte: this.reponses[j],
              statut: statuts[j],
            })
          }
          if (this.sup4) {
            autoCorr.propositions.push({
              texte: 'Je ne sais pas',
              statut: false,
            })
            if (autoCorr.options) {
              autoCorr.options.lastChoice = this.reponses.length - 1
            }
          }
          const lettres = [
            'A',
            'B',
            'C',
            'D',
            'E',
            'F',
            'G',
            'H',
            'I',
            'J',
          ].slice(0, this.reponses.length)
          const monQcm = propositionsQcm(this, i, {
            style: 'margin:0 3px 0 3px;',
            format: this.interactif ? 'case' : 'lettre',
          })
          texte += `<br><br>${monQcm.texte}`
          let messageBonnesReponses: string
          if (this.corrections && autoCorr.propositions != null) {
            this.correction = ''
            const correctionsList: string[] = new Array(this.reponses.length)
            const props = autoCorr.propositions
            for (let n = 0; n < this.reponses.length; n++) {
              const index = this.reponses.findIndex(
                (el) => el === props[n].texte,
              )
              if (
                this.corrections[index] != null &&
                this.corrections[index] !== ''
              ) {
                correctionsList[n] =
                  `réponse ${lettres[n]} : ${this.corrections[index]}${
                    context.isHtml
                      ? props[n].statut
                        ? '\u2705' // ✅
                        : '\u274C' // ❌
                      : props[n].statut
                        ? '${\\bf \\color[cmyk]{.63,.23,.93,.06}\\boldsymbol{\\checkmark}}$' // ✅
                        : '${\\bf \\color[rgb]{1,.1,.1}\\boldsymbol{\\times}}$' // ❌
                  }<br>`
              }
            }
            const listeAffichable = correctionsList.filter(
              (el) => el != null && el !== '',
            )
            if (listeAffichable.length !== 0) {
              this.correction = createList({
                items: listeAffichable,
                style: 'fleches',
              })
            } else {
              this.correction += this.correction.endsWith('\\end{tikzpicture}')
                ? '\n\n'
                : this.correction !== ''
                  ? '<br>'
                  : ''
            }
          } else {
            this.correction += this.correction?.endsWith('\\end{tikzpicture}')
              ? '\n\n'
              : this.correction !== ''
                ? '<br>'
                : ''
          }
          if (this.ajouteQcmCorr) {
            this.correction += `<br>${monQcm.texteCorr}`
          }
          if (this.bonnesReponses) {
            const lesBonnesLettres = autoCorr.propositions
              .map((el, i) => Object.assign({}, { prop: el, index: i }))
              .filter((obj) => obj.prop.statut)
              .map((obj) => lettres[obj.index])
            messageBonnesReponses = `Les bonnes réponses sont les réponses ${texteEnCouleurEtGras(lesBonnesLettres.join(' ; '))}.`
          } else {
            const laBonneLettre =
              lettres[autoCorr.propositions.findIndex((el) => el.statut)]
            messageBonnesReponses = `La bonne réponse est la réponse ${texteEnCouleurEtGras(laBonneLettre)}.`
          }
          // Ici on colle le texte de la correction à partir du latex d'origine (vérifier la compatibilité Katex et doubler les \)s
          const texteCorr = `${this.correction}${this.interactif ? '' : messageBonnesReponses}`

          this.listeQuestions[i] = texte
          this.listeCorrections[i] = texteCorr
          i++
        }
        cpt++
        if (this.sup) break // Si on a coché pour la version originale, il n'y aura qu'une seule question
      }
    } else {
      if (this.versionOriginale != null) this.versionOriginale()
      let texte = this.enonce
      this.autoCorrection[0] = {}
      if (this.options != null) {
        this.autoCorrection[0].options = { ...this.options }
      }
      const autoCorr = this.autoCorrection[0]
      autoCorr.propositions = []
      for (let j = 0; j < this.reponses.length; j++) {
        autoCorr.propositions.push({
          texte: this.reponses[j],
          statut: statuts[j],
        })
      }
      const lettres = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].slice(
        0,
        this.reponses.length,
      )
      const monQcm = propositionsQcm(this, 0, {
        style: 'margin:0 3px 0 3px;',
        format: this.interactif ? 'case' : 'lettre',
      })
      texte += `<br>${monQcm.texte}`
      if (this.ajouteQcmCorr) {
        this.correction += `<br>${monQcm.texteCorr}`
      }
      const laBonneLettre =
        lettres[autoCorr.propositions.findIndex((el) => el.statut)]
      // Ici on colle le texte de la correction à partir du latex d'origine (vérifier la compatibilité Katex et doubler les \)s
      const texteCorr = `${this.correction}<br>${this.interactif ? '' : `La bonne réponse est la réponse ${texteEnCouleurEtGras(laBonneLettre)}.`}`

      this.listeQuestions[0] = texte
      this.listeCorrections[0] = texteCorr
    }
  }

  // Pour permettre d'exporter tous les qcm pour en faire des séries de questions pour QcmCam. Ne pas y toucher
  qcmCamExport(): { question: string; reponse: string }[] {
    return qcmCamExport(this)
  }
}
