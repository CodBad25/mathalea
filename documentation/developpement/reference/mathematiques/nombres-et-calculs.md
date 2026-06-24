# Nombres et calculs

## `FractionEtendue`

`FractionEtendue` est l'export par défaut de `src/modules/FractionEtendue.ts`. Elle représente une fraction avec numérateur et dénominateur entiers et expose de nombreuses formes textuelles ou LaTeX : fraction brute, simplifiée, irréductible, signe normalisé, valeur numérique.

Usages typiques :

- stocker une valeur exacte plutôt qu'un flottant ;
- afficher une fraction avec une propriété LaTeX adaptée ;
- comparer ou transformer des fractions avant de les transmettre à `handleAnswers()`.

Pour les réponses interactives, `handleAnswers()` sait normaliser une `FractionEtendue`. Dans les nouveaux exercices, préférer une réponse explicite en LaTeX ou une `FractionEtendue` accompagnée des options de comparaison adaptées.

## `Complexe`

`Complexe` est définie dans `src/lib/mathFonctions/Complexe.ts`. La classe encapsule les opérations usuelles sur les nombres complexes et leur affichage : formes algébriques, modules, arguments, opérations, textes symboliques.

Les helpers `texAngleSymbolique()` et `texNombreSymbolique()` complètent la classe pour produire des écritures LaTeX lisibles.

## `Hms`

`Hms` est l'export par défaut de `src/modules/Hms.ts`. Il représente des durées ou horaires en semaines, jours, heures, minutes et secondes. La classe sait notamment :

- construire une durée depuis un objet ou `Hms.fromString()` ;
- convertir en secondes ;
- normaliser les retenues ;
- additionner avec `add()`, calculer une différence absolue avec `substract()` ;
- comparer avec `isGreaterThan()`, `isEqual()`, `isTheSame()` ou `isEquivalentToString()`.

Le comparateur interactif peut comparer des durées via les options dédiées de `fonctionComparaison()`.

## `Grandeur`

`Grandeur` est l'export par défaut de `src/modules/Grandeur.ts`. Elle associe une mesure à une unité et gère des conversions entre unités compatibles : longueurs, masses, volumes, aires, vitesses, durées et cas particuliers pris en charge par le module.

La classe expose notamment `convertirEn()`, `estEgal()`, `estUneApproximation()`, `fromString()`, `fromHHMMSS()`, `toTex()` et `toHHMMSS()`. Elle est utilisée dans les exercices et dans l'interactivité avec l'option `unite`, afin d'accepter les conversions correctes selon la précision attendue.

## Affichage des nombres

L'affichage utilisateur passe principalement par les helpers de `src/lib/outils/texNombre.ts` et les fonctions associées. Ils évitent les problèmes fréquents de notation française, de séparateurs décimaux, d'espaces et de rendu LaTeX/HTML.
