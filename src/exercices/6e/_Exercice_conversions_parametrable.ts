import Decimal from 'decimal.js'
import { texTexte } from '../../lib/format/texTexte'
import {
  lireFormulaireComplexe,
  repartitionPonderee,
  repartitionPondereeOrdonnee,
  serialiseFormulaireComplexe,
  valeursParDefaut,
  type FormulaireComplexe,
} from '../../lib/formulaireComplexe'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import { fraction } from '../../modules/fractions'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

/**
 * Conversions de longueurs, masses, contenances, prix et unités informatiques,
 * paramétrées par un formulaire complexe (`besoinFormulaireComplexe`).
 *
 * Contrairement à `_Exercice_conversions.ts`, dont le niveau de difficulté est un
 * unique menu déroulant énumérant les combinaisons prévues, l'enseignant choisit ici
 * indépendamment :
 *
 * * les unités travaillées, leur ordre et leur poids d'apparition ;
 * * le type d'opérations (multiplications, divisions ou les deux) ;
 * * la présence de nombres décimaux ;
 * * l'utilisation de fractions dans la correction.
 *
 * @author Rémi Angot
 */

type Prefixe = {
  symbole: string
  facteur: number
  nom: string
  /** Début de la phrase de correction, complété par « de » ou « d' » puis l'unité. */
  explication: string
}

const prefixesMultiplicateurs: Record<string, Prefixe> = {
  da: { symbole: 'da', facteur: 10, nom: 'déca', explication: 'une dizaine' },
  h: { symbole: 'h', facteur: 100, nom: 'hecto', explication: 'une centaine' },
  k: { symbole: 'k', facteur: 1000, nom: 'kilo', explication: 'un millier' },
}

const prefixesDiviseurs: Record<string, Prefixe> = {
  d: { symbole: 'd', facteur: 10, nom: 'déci', explication: 'un dixième' },
  c: { symbole: 'c', facteur: 100, nom: 'centi', explication: 'un centième' },
  m: { symbole: 'm', facteur: 1000, nom: 'milli', explication: 'un millième' },
}

type DefinitionUnite = {
  symbole: string
  singulier: string
  pluriel: string
  /** Préfixes multiplicateurs utilisables avec cette unité (`kL` n'est pas usuel). */
  multiplicateurs: string[]
  /** Préfixes diviseurs utilisables avec cette unité (il n'y a pas de `d€`). */
  diviseurs: string[]
  /**
   * Nom de l'unité préfixée dans la correction. Par défaut, le nom du préfixe est
   * accolé au singulier (« kilogramme ») ; l'euro fait exception (« k€ »).
   */
  nomPrefixe?: (prefixe: Prefixe) => string
  /** `true` si l'unité s'élide : « un millier d'euros » et non « de euros ». */
  elision?: boolean
}

/** Unités décimales classiques, hors unités de stockage informatique. */
const definitionsUnites: Record<string, DefinitionUnite> = {
  m: {
    symbole: 'm',
    singulier: 'mètre',
    pluriel: 'mètres',
    multiplicateurs: ['da', 'h', 'k'],
    diviseurs: ['d', 'c', 'm'],
  },
  L: {
    symbole: 'L',
    singulier: 'litre',
    pluriel: 'litres',
    multiplicateurs: ['da', 'h'],
    diviseurs: ['d', 'c', 'm'],
  },
  g: {
    symbole: 'g',
    singulier: 'gramme',
    pluriel: 'grammes',
    multiplicateurs: ['da', 'h', 'k'],
    diviseurs: ['d', 'c', 'm'],
  },
  euro: {
    symbole: '€',
    singulier: 'euro',
    pluriel: 'euros',
    multiplicateurs: ['k'],
    diviseurs: [],
    nomPrefixe: (prefixe) => `${prefixe.symbole}€`,
    elision: true,
  },
}

/**
 * Phrase d'explication du préfixe : « Un kilogramme est un millier de grammes ».
 */
function phraseExplication(
  definition: DefinitionUnite,
  prefixe: Prefixe,
  division: boolean,
): string {
  const nomPrefixe =
    definition.nomPrefixe?.(prefixe) ?? `${prefixe.nom}${definition.singulier}`
  const complement = division ? definition.singulier : definition.pluriel
  const liaison = definition.elision ? 'd’' : 'de '
  return `Un ${nomPrefixe} est ${prefixe.explication} ${liaison}${complement}`
}

/** Unités de stockage informatique, séparées de 1 000 en 1 000. */
const unitesInformatiques = ['o', 'ko', 'Mo', 'Go', 'To']

/**
 * Formulaire de paramétrage partagé par tous les exercices utilisant cette classe.
 */
export const formulaireConversions: FormulaireComplexe = {
  champs: [
    {
      type: 'selection',
      nom: 'operations',
      label: 'Type d’opérations',
      options: [
        { valeur: 'mult', label: 'Multiplications (da, h, k)' },
        { valeur: 'div', label: 'Divisions (d, c, m)' },
        { valeur: 'both', label: 'Multiplications et divisions' },
      ],
      defaut: 'mult',
    },

    {
      type: 'listePondereeOrdonnee',
      nom: 'unites',
      label: 'Unités (poids d’apparition)',
      labelOrdre: 'Respecter l’ordre des unités',
      items: [
        { nom: 'm', label: 'Longueurs (m)', poids: 1 },
        { nom: 'L', label: 'Contenances (L)', poids: 1 },
        { nom: 'g', label: 'Masses (g)', poids: 1 },
        { nom: 'euro', label: 'Prix (€)', poids: 0 },
        { nom: 'octet', label: 'Stockage informatique (o)', poids: 0 },
      ],
    },

    {
      type: 'case',
      nom: 'decimaux',
      label: 'Avec des nombres décimaux',
      defaut: false,
    },
    {
      type: 'case',
      nom: 'fractions',
      label: 'Avec des fractions dans la correction',
      defaut: false,
    },
  ],
}

/** Valeur de `this.sup` correspondant aux réglages par défaut du formulaire. */
export const supParDefaut = serialiseFormulaireComplexe(
  formulaireConversions,
  valeursParDefaut(formulaireConversions),
)

/** Nombre à convertir : entier « rond » ou décimal simple. */
function valeurADistribuer(avecDecimaux: boolean): Decimal {
  if (avecDecimaux) {
    // XX,X puis 0,X puis 0,0X puis X,XX
    return choice([
      new Decimal(randint(1, 9)).div(10).add(randint(1, 19)),
      new Decimal(randint(1, 9)).div(10),
      new Decimal(randint(1, 9)).div(100),
      new Decimal(randint(1, 9) * 100 + randint(1, 9) * 10 + randint(1, 9)).div(
        100,
      ),
    ])
  }
  // X puis X0 puis X00 puis XX
  return new Decimal(
    choice([
      randint(1, 9),
      randint(1, 9) * 10,
      randint(1, 9) * 100,
      randint(1, 9) * 10 + randint(1, 9),
    ]),
  )
}

export default class ExerciceConversionsParametrable extends Exercice {
  constructor() {
    super()
    this.titre =
      'Convertir des longueurs, masses, contenances, prix ou unités informatiques'
    this.consigne = 'Compléter.'
    this.spacing = 2
    this.nbQuestions = 5
    this.besoinFormulaireComplexe = formulaireConversions
    this.sup = supParDefaut
    this.correctionDetailleeDisponible = true
    this.correctionDetaillee = true
  }

  /**
   * Écrit l'énoncé « valeur unité de départ = … unité d'arrivée », avec un champ de
   * saisie en HTML interactif et des pointillés sinon.
   */
  private enonce(
    i: number,
    valeur: Decimal,
    decimalesValeur: number,
    uniteDepart: string,
    uniteArrivee: string,
  ): string {
    const debut = `$ ${texNombre(valeur, decimalesValeur)}${texTexte(uniteDepart)} = `
    if (this.interactif && context.isHtml) {
      return `${debut}$ ${ajouteChampTexteMathLive(
        this,
        i,
        KeyboardType.clavierNumbers,
        { texteApres: '$' + texTexte(uniteArrivee) + '$' },
      )}`
    }
    return `${debut}\\dotfill ${texTexte(uniteArrivee)}$`
  }

  nouvelleVersion() {
    const params = lireFormulaireComplexe(formulaireConversions, this.sup)
    const avecDecimaux = params.case('decimaux')
    const avecFractions = params.case('fractions')
    const operations = params.selection('operations')

    // Une unité n'est retenue que si elle possède des préfixes compatibles avec le
    // type d'opérations choisi (il n'existe pas de sous-multiple usuel de l'euro).
    const estCompatible = (nom: string) => {
      if (nom === 'octet') return true
      const definition = definitionsUnites[nom]
      if (definition === undefined) return false
      if (operations === 'mult') return definition.multiplicateurs.length > 0
      if (operations === 'div') return definition.diviseurs.length > 0
      return (
        definition.multiplicateurs.length > 0 || definition.diviseurs.length > 0
      )
    }

    // Les unités incompatibles sont écartées avant la répartition ; celles déclarées
    // par le formulaire servent de repli si l'enseignant a tout décoché.
    const unitesRetenues = params
      .liste('unites')
      .filter((item) => estCompatible(item.nom))
    const unitesDeReference = params
      .declares('unites')
      .filter((item) => estCompatible(item.nom))
    const repartition = params.ordreImpose('unites')
      ? repartitionPondereeOrdonnee
      : repartitionPonderee
    const unitesParQuestion = repartition(
      unitesRetenues,
      this.nbQuestions,
      unitesDeReference,
    )

    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; cpt++) {
      const nomUnite = unitesParQuestion[i]
      if (nomUnite === undefined) break
      const division =
        operations === 'div' || (operations === 'both' && choice([true, false]))

      let texte: string
      let texteCorr: string
      let resultat: Decimal
      let valeur: Decimal

      if (nomUnite === 'octet') {
        // Nombre de multiplications par 1 000 : on s'en tient à un seul palier pour
        // les divisions, sinon les nombres de départ deviennent illisibles.
        const ecart = division ? 1 : randint(1, 2)
        const indiceGrand = randint(ecart, unitesInformatiques.length - 1)
        const indicePetit = indiceGrand - ecart
        const facteur = new Decimal(1000).pow(ecart)
        const nombreDeBase = valeurADistribuer(avecDecimaux)
        const decimalesBase = nombreDeBase.decimalPlaces()
        if (division) {
          // Ex. : 3 000 ko = 3 Mo
          valeur = nombreDeBase.mul(facteur)
          resultat = nombreDeBase
          const uniteDepart = unitesInformatiques[indicePetit]
          const uniteArrivee = unitesInformatiques[indiceGrand]
          texte = this.enonce(i, valeur, 0, uniteDepart, uniteArrivee)
          texteCorr =
            `$ ${texNombre(valeur, 0)}${texTexte(uniteDepart)} = ` +
            `${texNombre(valeur, 0)}\\div${texNombre(facteur, 0)}${texTexte(uniteArrivee)} = ` +
            `${miseEnEvidence(texNombre(resultat, decimalesBase))}${texTexte(uniteArrivee)}$`
        } else {
          // Ex. : 3 Mo = 3 000 ko
          valeur = nombreDeBase
          resultat = nombreDeBase.mul(facteur)
          const uniteDepart = unitesInformatiques[indiceGrand]
          const uniteArrivee = unitesInformatiques[indicePetit]
          texte = this.enonce(
            i,
            valeur,
            decimalesBase,
            uniteDepart,
            uniteArrivee,
          )
          texteCorr =
            `$ ${texNombre(valeur, decimalesBase)}${texTexte(uniteDepart)} = ` +
            `${texNombre(valeur, decimalesBase)}\\times${texNombre(facteur, 0)}${texTexte(uniteArrivee)} = ` +
            `${miseEnEvidence(texNombre(resultat, 0))}${texTexte(uniteArrivee)}$`
        }
      } else {
        const definition = definitionsUnites[nomUnite]
        const symbolesPossibles = division
          ? definition.diviseurs
          : definition.multiplicateurs
        // Le type d'opérations « les deux » peut tomber sur un sens impossible
        // pour l'unité tirée (l'euro n'a pas de sous-multiple) : on tente à nouveau.
        if (symbolesPossibles.length === 0) continue
        const prefixe = division
          ? prefixesDiviseurs[choice(symbolesPossibles)]
          : prefixesMultiplicateurs[choice(symbolesPossibles)]
        valeur = valeurADistribuer(avecDecimaux)
        const decimalesValeur = valeur.decimalPlaces()
        const uniteDepart = prefixe.symbole + definition.symbole
        resultat = division
          ? valeur.div(prefixe.facteur)
          : valeur.mul(prefixe.facteur)
        const decimalesResultat = resultat.decimalPlaces()
        texte = this.enonce(
          i,
          valeur,
          decimalesValeur,
          uniteDepart,
          definition.symbole,
        )
        // Les fractions ne sont proposées que pour un numérateur entier : une
        // écriture comme 2,5/100 n'apporterait rien à la correction.
        const etapeIntermediaire =
          division && avecFractions && valeur.isInteger()
            ? fraction(valeur.toNumber(), prefixe.facteur).texFraction
            : `${texNombre(valeur, decimalesValeur)}${division ? '\\div' : '\\times'}${texNombre(prefixe.facteur, 0)}`
        texteCorr =
          `$ ${texNombre(valeur, decimalesValeur)}${texTexte(uniteDepart)} = ` +
          `${etapeIntermediaire}${texTexte(definition.symbole)} = ` +
          `${miseEnEvidence(texNombre(resultat, decimalesResultat))}${texTexte(definition.symbole)}$`
        if (this.correctionDetaillee) {
          texteCorr = `${phraseExplication(definition, prefixe, division)} donc :<br>${texteCorr}`
        }
      }

      if (this.questionJamaisPosee(i, nomUnite, texte)) {
        handleAnswers(this, i, {
          reponse: {
            value: resultat.toString(),
            options: { nombreDecimalSeulement: true, fractionDecimale: true },
          },
        })
        if (context.vue === 'diap') {
          texte = texte.replace('= \\dotfill', '\\text{ en }')
        }
        if (context.isHtml) {
          texte = texte.replace(
            '\\dotfill',
            '................................................',
          )
        }
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
    }
    listeQuestionsToContenu(this)
  }
}
