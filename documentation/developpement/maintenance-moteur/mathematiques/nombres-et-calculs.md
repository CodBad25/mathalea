# Nombres et calculs

## Adaptation MathJSON pour les corrections détaillées

Dans `src/lib/calculerCe.ts`, `toMathJsonNode()` vérifie les expressions
`MathJsonExpression` du ComputeEngine avant leur utilisation par
`renderMathJsonLatex()` et `buildCorrDetails()`. Il copie récursivement les
tableaux, y compris `readonly`, sans changer l'ordre des opérandes ni supprimer
les `Delimiter`. Les objets `fn` et `sym` sont ramenés à leur forme compacte ;
les annotations MathJSON ne font pas partie de l'arbre de calcul.

Les nombres JSON `{ num: string }` restent exacts : leur chaîne n'est pas
convertie en `number`, afin de conserver les grands entiers, les exposants et les
décimaux périodiques. Leur rendu LaTeX est confié au ComputeEngine avec les mêmes
options de rendu brut que les autres opérateurs délégués.

Les objets `str` et `dict`, les nombres non finis et les formes mal construites
ou ambiguës déclenchent une erreur `MathJSON unsupported` indiquant le chemin
dans l'arbre. Ne pas contourner cette frontière par une assertion de type.

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

## Expressions arithmétiques générées

`generateArithmeticAst()` est défini dans `src/lib/mathFonctions/expression.ts`. Il construit un arbre de calcul pour les exercices qui demandent de traduire une expression numérique en blocs.

Avec trois opérations et `requireParentheses: true`, le générateur tire plusieurs formes qui imposent de calculer une addition ou une soustraction avant une multiplication ou une division. Il peut notamment produire deux sous-expressions additives, par exemple `(a + b) \times (c - d)`, ou une seule sous-expression additive combinée avec un terme non parenthésé, par exemple `(a - b) \div c + d`.

Avec trois opérations et `requireParentheses: false`, il construit au contraire une chaîne gauche de trois opérations, puis filtre les candidats qui exigeraient des parenthèses dans le rendu LaTeX.
