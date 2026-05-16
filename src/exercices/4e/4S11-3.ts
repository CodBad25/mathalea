import { choice, combinaisonListes, shuffle } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { entreprise } from '../../lib/outils/entreprises'
import { texNombre } from '../../lib/outils/texNombre'
import {
  listeQuestionsToContenu,
  randint
} from '../../modules/outils'
import Exercice from '../Exercice'

export const titre =
  'Différencier moyenne et médianes sur les salaires d\'une entreprise'
export const interactifReady = false
export const dateDePublication = '15/05/2026'

export const uuid = '802f0'
export const refs = {
  'fr-fr': ['4S11-3'],
  'fr-ch': [],
}
/**
 * Différencier moyenne et médiane sur les salaires d'une entreprise :
 * L'une a beaucoup de petits salaires et un gros, l'autre a des salaires homogènes.
 * @author Mireille Gain
 */
export default class MedianeMoyenneSalaires extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 1
    this.consigne = ''
  }

  nouvelleVersion() {
    const typeQuestionsDisponibles = ['EntreprisePDG', 'EntrepriseCoop']
    const listeTypeQuestions = combinaisonListes(
      typeQuestionsDisponibles,
      this.nbQuestions,
    )
   
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const indiceSalaireBase = randint(17,22)
      const S1 = indiceSalaireBase * 100
      const S2 = S1 + choice([0,2])*50
      const S3 = S2 + choice([1,3])*50
      const S4 = S3 + choice([0,3])*50
      const S5pdg = indiceSalaireBase * 1000
      const S5coop = S4 + choice([1,3])*50
      const alea = choice([0,1])
      let texte = ''
      let texteCorr = ''
      if (alea === 0){
      // 'EntreprisePDG':
      const entreprisePdg = entreprise(1)
          const salairesPdg = [texNombre(S1), texNombre(S2), texNombre(S3), texNombre(S4), texNombre(S5pdg)]
          const salairesPdgMelanges = shuffle([...salairesPdg])
          const salairesPdgTexte = salairesPdgMelanges.map(s => s.replace(/\\[, ]/g, ' ')).join(' €, ');
          texte += `Les salaires dans ${entreprisePdg} sont les suivants :<br>`
          texte += `${salairesPdgTexte} €.<br><br>`
          let moyennePdg = (S1+S2+S3+S4+S5pdg)/5
          texteCorr += `Le salaire moyen dans ${entreprisePdg} est : <br>`
          texteCorr += `$(${texNombre(S1)}~€ + ${texNombre(S2)}~€ + ${texNombre(S3)}~€ + ${texNombre(S4)}~€ + ${texNombre(S5pdg)}~€) \\div 5 = $`
          texteCorr += `$${miseEnEvidence(moyennePdg)}~€.$<br><br>`
          texteCorr += `Les salaires ordonnés du plus petit au plus grand sont : `
          texteCorr += `$ ${texNombre(S1)}~€ ; ${texNombre(S2)}~€ ; ${texNombre(S3)}~€ ; ${texNombre(S4)}~€ ; ${texNombre(S5pdg)}~€. $<br>`
          texteCorr += `La médiane des salaires est donc égale au troisième salaire par ordre croissant : `
          texteCorr += `$${miseEnEvidence(texNombre(S3))}~€ $<br><br>`
          texteCorr += `Dans ${entreprisePdg}, la moyenne ($${miseEnEvidence(moyennePdg)}$ €) est très supérieure à la médiane ($${miseEnEvidence(texNombre(S3))}$ €).<br>` 
          texteCorr += `Cela signifie que le plus haut salaire augmente fortement la moyenne des salaires, et que les salaires sont majoritairement très inférieurs à cette moyenne.<br><br>`

              // 'EntrepriseCoop':
              const entrepriseCoop = entreprise(1)
              const salairesCoop = [texNombre(S1), texNombre(S2), texNombre(S3), texNombre(S4), texNombre(S5coop)]
              const salairesCoopMelanges = shuffle([...salairesCoop])
              const salairesCoopTexte = salairesCoopMelanges.map(s => s.replace(/\\[, ]/g, ' ')).join(' €, ');
              texte += `Les salaires dans ${entrepriseCoop} sont les suivants :<br>`
              texte += `${salairesCoopTexte} €.<br><br>`
              let moyenneCoop = (S1+S2+S3+S4+S5coop)/5
              let mediane = S3 
              texteCorr += `Le salaire moyen dans ${entrepriseCoop} est : <br>`
              texteCorr += `$(${texNombre(S1)}~€ + ${texNombre(S2)}~€ + ${texNombre(S3)}~€ + ${texNombre(S4)}~€ + ${texNombre(S5coop)}~€) \\div 5 = $`
              texteCorr += `$${miseEnEvidence(moyenneCoop)}$ €.<br><br>`
              texteCorr += `Les salaires ordonnés du plus petit au plus grand sont : `
              texteCorr += `$ ${texNombre(S1)}~€ ; ${texNombre(S2)}~€ ; ${texNombre(S3)}~€ ; ${texNombre(S4)}~€ ; ${texNombre(S5coop)}~€. $<br>`
              texteCorr += `La médiane des salaires est donc égale au troisième salaire par ordre croissant : `
              texteCorr += `$${miseEnEvidence(texNombre(S3))}$ €<br><br>`              
              texteCorr += `Dans ${entrepriseCoop}, la moyenne ($${miseEnEvidence(moyenneCoop)}$ €.) et la médiane ($${miseEnEvidence(texNombre(S3))}$ €) sont proches.<br>` 
              texteCorr += `Cela signifie que les salaires sont proches les uns des autres.<br>`             
      }
else {
         // 'EntrepriseCoop':
         const entrepriseCoop = entreprise(1)
         const salairesCoop = [texNombre(S1), texNombre(S2), texNombre(S3), texNombre(S4), texNombre(S5coop)]
         const salairesCoopMelanges = shuffle([...salairesCoop])
         const salairesCoopTexte = salairesCoopMelanges.map(s => s.replace(/\\[, ]/g, ' ')).join(' €, ');
         texte += `Les salaires dans ${entrepriseCoop} sont les suivants :<br> `
         texte += `${salairesCoopTexte} €.<br><br>`
         let moyenneCoop = (S1+S2+S3+S4+S5coop)/5
         let mediane = S3 
         texteCorr += `Le salaire moyen dans ${entrepriseCoop} est : <br>`
         texteCorr += `$(${texNombre(S1)}~€ + ${texNombre(S2)}~€ + ${texNombre(S3)}~€ + ${texNombre(S4)}~€ + ${texNombre(S5coop)}~€) \\div 5 = $`
         texteCorr += `$${miseEnEvidence(moyenneCoop)}~€.$<br><br>`
         texteCorr += `Les salaires ordonnés du plus petit au plus grand sont : `
         texteCorr += `$ ${texNombre(S1)}~€ ; ${texNombre(S2)}~€ ; ${texNombre(S3)}~€ ; ${texNombre(S4)}~€ ; ${texNombre(S5coop)}~€ $<br>`
         texteCorr += `La médiane des salaires est donc égale au troisième salaire par ordre croissant : `
         texteCorr += `$${miseEnEvidence(texNombre(S3))}~€ $<br><br>` 
        texteCorr += `Dans ${entrepriseCoop}, la moyenne ($${miseEnEvidence(moyenneCoop)}$ €.) et la médiane ($${miseEnEvidence(texNombre(S3))}$ €) sont proches.<br>` 
        texteCorr += `Cela signifie que les salaires sont proches les uns des autres.<br><br>`

              // 'EntreprisePDG':
              const entreprisePdg = entreprise(1)
              const salairesPdg = [texNombre(S1), texNombre(S2), texNombre(S3), texNombre(S4), texNombre(S5pdg)]
              const salairesPdgMelanges = shuffle([...salairesPdg])
              const salairesPdgTexte = salairesPdgMelanges.map(s => s.replace(/\\[, ]/g, ' ')).join(' €, ');
              texte += `Les salaires dans ${entreprisePdg} sont les suivants :<br> `
              texte += `${salairesPdgTexte} €.<br><br>`
              let moyennePdg = (S1+S2+S3+S4+S5pdg)/5
              texteCorr += `Le salaire moyen dans ${entreprisePdg} est : <br>`
              texteCorr += `$(${texNombre(S1)}~€ + ${texNombre(S2)}~€ + ${texNombre(S3)}~€ + ${texNombre(S4)}~€ + ${texNombre(S5pdg)}~€) \\div 5 = $`
              texteCorr += `$${miseEnEvidence(moyennePdg)}~€.$<br><br>`
              texteCorr += `Les salaires ordonnés du plus petit au plus grand sont : `
              texteCorr += `$ ${texNombre(S1)}~€ ; ${texNombre(S2)}~€ ; ${texNombre(S3)}~€ ; ${texNombre(S4)}~€ ; ${texNombre(S5pdg)}~€ $<br>`
              texteCorr += `La médiane des salaires est donc égale au troisième salaire par ordre croissant : `
              texteCorr += `$ ${miseEnEvidence(texNombre(S3))}~€ $<br><br>`
              texteCorr += `Dans ${entreprisePdg}, la moyenne ($${miseEnEvidence(moyennePdg)}$ €) est très supérieure à la médiane ($${miseEnEvidence(texNombre(S3))}$ €).<br>` 
              texteCorr += `Cela signifie que le plus haut salaire augmente fortement la moyenne des salaires, et que les salaires sont majoritairement très inférieurs à cette moyenne.<br><br>`

            }
      texte += 'Calculer la moyenne et la médiane des salaires dans chacune de ces entreprises.<br>'
      texte += 'Quelle interprétation pouvez-vous faire des différences de moyennes et de médianes entre ces deux entreprises ?<br><br>'

      if (this.questionJamaisPosee(i, S1, S2, S3, S4, S5pdg, S5coop)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}

