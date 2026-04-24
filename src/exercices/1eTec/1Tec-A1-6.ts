import { choice } from '../../lib/outils/arrayOutils'
import { texNombre } from '../../lib/outils/texNombre'
import { randint } from '../../modules/outils'
import ExerciceSimple from '../ExerciceSimple'
export const titre = 'Calculer des proportions de proportions'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDeModifImportante = '09/05/2023'
/**
* Modèle d'exercice très simple pour la course aux nombres
* @author Stéphane Guyon et Gilles Mora pour augmenter les cas

* Date de publication
*/
export const uuid = 'f0c23'

export const refs = {
  'fr-fr': ['2S10-11'],
  'fr-ch': [],
}
export default class ProportiondeProportion extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1

    this.optionsChampTexte = { texteApres: ' %' }
  }

  nouvelleVersion() {
    let a, b, c, d, g, tauxb, tauxc, tauxG
    switch (
      choice([
        'association',
        'lycee',
        'lyceeBis',
        'election',
        'associationBis',
        'electionBis',
      ]) //
    ) {
      case 'association':
        b = randint(3, 80)
        tauxb = b / 100
        a = randint(20, 50)
        c = randint(20, 50)
        tauxc = c / 100
        d = randint(2, 15)
        g = (b * c) / 100
        tauxG = (b * c) / 10000

        this.question = `Dans une association,  $${b}\\,\\%$ des adhérents ont plus de $${a}$ ans. <br>
        Parmi eux,   $${c}\\,\\%$ ont plus de $${d}$ années d'ancienneté.<br>
        Quel est le pourcentage d'adhérents de plus de $${a}$ ans ayant plus de $${d}$ années d'ancienneté dans cette association ?<br>`
        this.correction = `La population de référence est celle des membres de l'association.<br>
        La première sous-population est celle des plus de $${a}$ ans,
        qui représente $p_1=${b}\\,\\%$ de la population de référence. <br>
        Dans cette sous-population, on sait que la population de ceux qui ont plus de $${d}$ années d'ancienneté représente $p_2=${c}\\,\\%$.<br>
        <br> D'après le cours, on calcule $p=p_1\\times p_2$, ce qui représente $${b}\\,\\%$ de $${c}\\,\\%$.<br>
      <br>Ainsi,  $p=${texNombre(tauxb)}\\times ${texNombre(tauxc)}=${texNombre(tauxG, 4)}$.<br>
      Il y a donc $${texNombre(g, 2)}\\,\\%$ d'adhérents de plus de $${a}$ ans ayant plus de $${a}$ années d'ancienneté.`
        this.reponse = g.toFixed(2)
        break
      case 'associationBis':
        b = randint(3, 80)
        tauxb = b / 100
        a = randint(35, 50)
        c = randint(20, 50)
        tauxc = c / 100
        d = randint(3, 15)
        g = (b * c) / 100
        tauxG = (b * c) / 10000

        this.question = `Dans une association,  $${b}\\,\\%$ des adhérents ont plus de  $${a}$ ans. <br>
       On dénombre également dans cette association  $${texNombre(g, 2)}\\,\\%$ d'adhérents de  plus $${a}$ ans ayant plus de $${d}$ années d'ancienneté.<br>
       Parmi les adhérents de plus de $${a}$ ans, quel est le pourcentage de ceux qui ont plus de $${d}$ années d'ancienneté ?<br> `
        this.correction = `La population de référence est celle des membres de l'association.<br>
        La première sous-population est celle des plus de $${a}$ ans,
        qui représente $p_1=${b}\\,\\%$ de la population de référence. <br>
        Dans cette sous-population, on note $p_2$ la proportion de ceux qui ont  plus de  $${d}$ années d'ancienneté.<br>
        La proportion $P$ des adhérents de  plus $${a}$ ans qui ont plus de $${d}$ ans d'ancienneté est $P=${texNombre(g, 2)}\\,\\%$.<br>
        <br> D'après le cours, on a $P=p_1\\times p_2$, ce qui donne  $${texNombre(tauxG, 4)}=${texNombre(tauxb, 2)}\\times p_2$<br>
        <br>Ainsi, $p_2=\\dfrac{${texNombre(tauxG, 4)}}{${texNombre(tauxb, 2)}}=${texNombre(tauxc, 4)}$.<br>
      Il y a donc $${texNombre(c, 2)}\\,\\%$ d'adhérents de plus de  $${d}$ ans d'ancienneté parmi les adhérents de plus de $${a}$ ans.`
        this.reponse = c.toString()
        break

      case 'lycee':
        b = randint(20, 40)
        tauxb = b / 100
        a = randint(20, 50)
        c = randint(10, 70)
        tauxc = c / 100
        g = (b * c) / 100
        tauxG = (b * c) / 10000
        this.question = `Dans un lycée,  $${b}\\,\\%$ des lycéens sont en classe de première. <br>
            Parmi eux,   $${c}\\,\\%$ sont en filière technologique.<br>
            Quel est le pourcentage d'élèves en première technologique de ce lycée ?<br>`
        this.correction = `La population de référence est celle des élèves du lycée.<br>
            La sous-population est celle des élèves de première et d'après l'énoncé, $p_1=${b}\\,\\%$.<br>
             Les élèves de 1ère technologique sont une sous-population des élèves de première, qui représente d'après l'énnoncé d'après l'énoncé, $p_2=${c}\\,\\%$. <br>
             <br>Pour connaitre la proportion $p$ des élèves de première technologique par rapport à la population de référence (les élèves du lycée), on calcule $p=p_1\\times p_2$, ce qui revient à calculer $${b}\\,\\%$ de $${c}\\,\\%$.<br>
             <br>Ainsi, $p=${texNombre(b / 100)}\\times ${texNombre(tauxc, 2)}=${texNombre(tauxG, 4)}$.<br>
             Il y a $${texNombre(g, 2)}\\,\\%$ d'élèves de première technologique parmi les élèves du lycée.`
        this.reponse = g.toFixed(2)
        break
      case 'lyceeBis':
        b = randint(20, 40)
        tauxb = b / 100
        a = randint(20, 50)
        c = randint(10, 70)
        tauxc = c / 100
        g = (b * c) / 100
        tauxG = (b * c) / 10000
        this.question = `Dans un lycée,  $${b}\\,\\%$ des lycéens sont en classe de première et  $${texNombre(g, 2)}\\,\\%$ des lycéens sont en première technologique.<br>
              Quel est le pourcentage d'élèves en première technologique parmi les élèves de première du lycée ?<br>`
        this.correction = `La population de référence est celle des élèves du lycée.<br>
              La sous-population est celle des élèves de première et d'après l'énoncé, $p_1=${b}\\,\\%$.<br>
              Dans cette sous-population, on note $p_2$ la proportion des élèves en première technologique.<br>
              La proportion $P$ des élèves en première technologique parmi les élèves du lycée est $P=${texNombre(g, 2)}\\,\\%$.<br>
              <br> D'après le cours, on a $P=p_1\\times p_2$, ce qui donne  $${texNombre(tauxG, 4)}=${texNombre(tauxb, 2)}\\times p_2$<br>
              Ainsi, $p_2=\\dfrac{${texNombre(tauxG, 4)}}{${texNombre(tauxb, 2)}}=${texNombre(tauxc, 4)}$.<br>
              Il y a donc $${texNombre(c, 2)}\\,\\%$ des élèves de première en première technologique.`

        this.reponse = c.toString()
        break

      case 'election':
        b = randint(40, 80)
        tauxb = b / 100
        a = randint(20, 50)
        c = randint(10, 70)
        tauxc = c / 100
        g = (b * c) / 100
        tauxG = (b * c) / 10000

        this.question = `Lors d'une élection,  la participation (suffrages exprimés) a été de $${b}\\,\\%$ des inscrits.<br>
               Un candidat a obtenu   $${c}\\,\\%$ des suffrages exprimés.<br>
                Quel est le pourcentage de voix obtenues par ce candidat par rapport au nombre d' inscrits ?<br>`
        this.correction = `La population de référence est celle des inscrits sur les listes électorales.<br>
                La sous-population est celle des suffrages exprimés et d'après l'énoncé, $p_1=${b}\\,\\%$.<br>
                 Les suffrages du candidat sont une sous-population des suffrages exprimés, qui représentent d'après l'énoncé, $p_2=${c}\\,\\%$. <br>
                 <br>Pour connaitre le pourcentage de voix obtenues  par ce candidat par rapport aux nombre d'inscrits, on calcule $p=p_1\\times p_2$, ce qui revient à calculer $${b}\\,\\%$ de $${c}\\,\\%$.<br>
                 <br>Ainsi, $p=${texNombre(tauxb, 2)}\\times ${texNombre(tauxc, 2)}=${texNombre(tauxG, 4)}$.<br>
                Ce candidat a donc obtenu $${texNombre(g, 2)}\\,\\%$ des voix des inscrits.`
        this.reponse = g.toFixed(2)
        break

      case 'electionBis':
        b = randint(40, 80)
        tauxb = b / 100
        a = randint(20, 50)
        c = randint(10, 70)
        tauxc = c / 100
        g = (b * c) / 100
        tauxG = (b * c) / 10000

        this.question = `Lors d'une élection,  la participation (suffrages exprimés) a été de $${b}\\,\\%$ des inscrits.<br>
        Un candidat a obtenu $${texNombre(g, 2)}\\,\\%$ de voix parmi les inscrits.<br>
                Quel est le pourcentage de voix obtenues par ce candidat par rapport aux suffrages exprimés ?<br>`
        this.correction = `La population de référence est celle des inscrits sur les listes électorales.<br>
                La sous-population est celle des suffrages exprimés et d'après l'énoncé, $p_1=${b}\\,\\%$.<br>
Dans cette sous-population, on note $p_2$ la proportion des suffrages du candidat.<br>
La proportion $P$ des suffrages du candidat parmi les inscrits est $P=${texNombre(g, 2)}\\,\\%$.<br>
<br>D'après le cours, on a $P=p_1\\times p_2$, ce qui donne  $${texNombre(tauxG, 4)}=${texNombre(tauxb, 2)}\\times p_2$<br>
<br>Ainsi, $p_2=\\dfrac{${texNombre(tauxG, 4)}}{${texNombre(tauxb, 2)}}=${texNombre(tauxc, 4)}$.<br>
$${texNombre(c, 2)}\\,\\%$ des suffrages exprimés ont voté pour le candidat.`
        this.reponse = c.toString()
        break
    }
    if (this.interactif) this.question += '<br>'
  }
}
