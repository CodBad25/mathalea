import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { ecritureAlgebrique } from '../../lib/outils/ecritures'
import { texteEnCouleurEtGras } from '../../lib/outils/embellissements'
import FractionEtendue from '../../modules/FractionEtendue'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '8b6cd'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Résoudre une équation '
export const dateDePublication = '02/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoQ8ANs2026 extends ExerciceQcmA {
 appliquerLesValeurs = (a: number, b: number, c: number, cas: number) => {
    // Écriture algébrique des parenthèses
    const expr1 = `${a}(x${ecritureAlgebrique(b)})`
    const expr2 = `(${a}x${ecritureAlgebrique(c)})`

    // Préparation de la première solution (toujours -b)
    const sol1 = -b
    
    // Pour éviter le doublon "-1 et -1" dans les distracteurs des cas 1 et 2, 
    // on s'assure que les deux fractions générées sont distinctes de sol1.
    // (Dans le cas 3, c est choisi de sorte que ces fractions soient naturellement distinctes).
    let fracSol2 = new FractionEtendue(-c, a)
    let fracSol2Fausse = new FractionEtendue(c, a)

    if (fracSol2.valeurDecimale === sol1) {
      fracSol2 = new FractionEtendue(c !== 0 ? c : a, a)
    }
    if (fracSol2Fausse.valeurDecimale === sol1 || fracSol2Fausse.valeurDecimale === fracSol2.valeurDecimale) {
      fracSol2Fausse = new FractionEtendue(c + a, a)
      if (fracSol2Fausse.valeurDecimale === sol1 || fracSol2Fausse.valeurDecimale === fracSol2.valeurDecimale) {
        fracSol2Fausse = new FractionEtendue(c + 2 * a, a)
      }
    }

    const sol2Tex = fracSol2.texFractionSimplifiee
    const sol2FausseTex = fracSol2Fausse.texFractionSimplifiee

    // Valeur du membre de droite une fois les constantes passées de l'autre côté (c - ab)
    const valDroite = c - a * b

    // Préparation des distracteurs (textes des réponses)
    const propDeuxSols = `Deux solutions : $${sol1}$ et $${sol2Tex}$`
    const propDeuxSolsFausses = `Deux solutions : $${sol1}$ et $${sol2FausseTex}$`
    const propAucune = 'Aucune solution'
    const propInfinie = 'Une infinité de solutions'

    switch (cas) {
      case 1: // Équation type original avec aucune solution
        this.enonce = `L'équation $${expr1} - ${expr2} = 0$ admet :`
        this.correction = `On développe et on regroupe les termes en $x$ :<br>
        $\\begin{aligned}
        ${expr1} - ${expr2} &= 0\\\\
        ${a}x${ecritureAlgebrique(a * b)} - ${a}x${ecritureAlgebrique(-c)} &= 0\\\\
        ${a}x - ${a}x &= ${c}${ecritureAlgebrique(-a * b)}\\\\
        0x &= ${valDroite}
        \\end{aligned}$<br>
        Il n'existe aucun nombre $x$ tel que multiplié par $0$, le résultat soit $${valDroite}$. <br>
        L'équation n'admet donc ${texteEnCouleurEtGras('aucune solution')}.`
        
        this.reponses = [
          propAucune,
          propDeuxSolsFausses,
          propDeuxSols,
          propInfinie
        ]
        break

      case 2: // Même type d'équation mais avec une infinité de solutions
        this.enonce = `L'équation $${expr1} - ${expr2} = 0$ admet :`
        this.correction = `On développe et on regroupe les termes en $x$ :<br>
        $\\begin{aligned}
        ${expr1} - ${expr2} &= 0\\\\
        ${a}x${ecritureAlgebrique(a * b)} - ${a}x${ecritureAlgebrique(-c)} &= 0\\\\
        ${a}x - ${a}x &= ${c}${ecritureAlgebrique(-a * b)}\\\\
        0x &= 0
        \\end{aligned}$<br>
        Tout nombre multiplié par $0$ donne $0$. Cette égalité est vraie pour toute valeur de $x$. <br>
        L'équation admet donc ${texteEnCouleurEtGras('une infinité de solutions')}.`
        
        this.reponses = [
          propInfinie,
          propAucune,
          propDeuxSolsFausses,
          propDeuxSols
        ]
        break

      case 3: // Équation produit nul
        this.enonce = `L'équation $${expr1}${expr2} = 0$ admet :`
        this.correction = `Il s'agit d'une équation produit nul. Un produit de facteurs est nul si et seulement si au moins l'un de ses facteurs est nul.<br>
        $\\begin{aligned}
        x${ecritureAlgebrique(b)} = 0 &\\quad\\text{ou}\\quad ${a}x${ecritureAlgebrique(c)} = 0\\\\
        x = ${sol1} &\\quad\\text{ou}\\quad ${a}x = ${-c}\\\\
        x = ${sol1} &\\quad\\text{ou}\\quad x = ${sol2Tex}
        \\end{aligned}$<br>
        L'équation admet donc ${texteEnCouleurEtGras(`deux solutions : $${sol1}$ et $${sol2Tex}$`)}.`
        
        this.reponses = [
          propDeuxSols,
          propDeuxSolsFausses,
          propAucune,
          propInfinie
        ]
        break
    }
  }

  versionOriginale: () => void = () => {
    // Cas reproduisant exactement l'image : 2(x-4) - (2x+1) = 0 -> Aucune solution (cas 1)
    this.appliquerLesValeurs(2, -4, 1, 1)
  }

  versionAleatoire = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    let compteur = 0
    do {
      const cas = choice([1, 2, 3])
      const a = randint(2, 6)
      const b = randint(-6, 6, [0])
      let c: number
      
      if (cas === 1) { 
        // Exclure a * b pour garantir que l'égalité sera fausse (aucune solution)
        c = randint(-10, 10, [0, a * b])
      } else if (cas === 2) { 
        c = a * b
      } else { 
        // Exclure a * b pour éviter d'avoir deux fois la même solution (-b et -c/a)
        // Exclure -a * b pour éviter que la fausse solution soit égale à la vraie
        c = randint(-10, 10, [0, a * b, -a * b])
      }
      
      this.appliquerLesValeurs(a, b, c, cas)
      compteur++
    } while (
      compteur < 100 &&
      !aLeBonNombreDePropsDifferentes(this, 4, true, {})
    )
  }

  constructor() {
    super()
    this.versionAleatoire()
    this.options = { vertical: true}
  }
}