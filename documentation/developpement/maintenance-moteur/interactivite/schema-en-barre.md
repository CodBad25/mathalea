# Custom element « Schéma en barre »

Tag : `schema-en-barre`. Les quatre schémas en barre qui modélisent les
problèmes arithmétiques, avec tous leurs textes éditables : l'élève (ou le
professeur) choisit un schéma puis le complète. Rendu HTML interactif ou figé,
LaTeX (TikZ) et Typst.

La recette côté exercice est dans
[Formats interactifs spécialisés](../../auteurs-exercices/complements/formats-interactifs.md#schéma-en-barre).
Cette page documente l'implémentation.

## Fichiers

| Fichier                                          | Rôle                                                                                                             |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `src/lib/customElements/SchemaEnBarreElement.ts` | Le custom element, ses types, la comparaison de deux schémas, le helper `addSchemaEnBarre()` et les trois rendus |
| `src/app.css`                                    | Styles (classes préfixées `schema-en-barre__`), en thème clair et sombre                                         |
| `src/lib/problems/problemesSchemasEnBarre.ts`    | Banque de problèmes avec leur schéma attendu, par type de schéma                                                 |
| `src/exercices/6e/6N4A-5.ts`                     | Exercice : choisir et compléter le schéma d'un problème, puis répondre (couteau suisse schéma + champ MathLive)  |
| `src/exercices/profs/P030.ts`                    | Outil du professeur : le composant seul, avec un réglage pour imposer le type                                    |
| `tests/unit/schemaEnBarreElement.test.ts`        | Tests unitaires                                                                                                  |

Le composant vit dans le DOM clair (pas de shadow DOM) : les couleurs suivent
le thème via les variables `--color-coopmaths*`.

## Les quatre schémas et leurs textes

| Type                         | Textes (`CleTexteSchema`)                                    |
| ---------------------------- | ------------------------------------------------------------ |
| `additif-parties-tout`       | `partieA`, `partieB`, `tout` (accolade au-dessus)            |
| `additif-comparaison`        | `partieA` (grande), `partieB` (petite), `difference`, `tout` |
| `multiplicatif-parties-tout` | `part`, `nombreDeParts` (flèche dessous), `tout`             |
| `multiplicatif-comparaison`  | `etiquetteA`, `etiquetteB`, `part`, `nFois`, `tout`          |

Le choix du type (quatre vignettes sur deux lignes) et le schéma ne sont
jamais affichés ensemble : choisir une vignette fait apparaître le schéma, le
bouton « Changer de schéma » ramène les vignettes sans perdre les textes déjà
saisis. Les champs sont des `textarea` d'une ligne qui grandissent avec leur
contenu (`ajusteHauteur()`), vides par défaut et sans placeholder : les
libellés génériques (`LIBELLES_TEXTE`) ne servent qu'aux vignettes et à
l'`aria-label`.

Dans les schémas multiplicatifs, tous les rectangles partagent le même texte
`part` (saisir dans l'un remplit les autres). Le nombre de rectangles se
règle de 2 à 5, ou `'plus'` : trois rectangles puis des pointillés (et un
dernier rectangle qui ferme la barre dans le parties-tout).

Dans le schéma additif de comparaison, l'accolade « Tout » (A + B) n'est
affichée qu'à la demande (bouton « Afficher le tout », `toutVisible` dans
l'état) : la plupart des problèmes n'en ont pas besoin. La masquer efface son
texte. Le schéma figé la dessine dès que `tout` porte un texte (correction).

Un texte de rectangle peut tenir sur deux lignes (`Roses\n6 fleurs` :
la grandeur, puis la quantité et son unité, comme dans les schémas des
manuels). Le rendu figé remplace `\n` par `<br>` ; TikZ et Typst agrandissent
alors les rectangles (`hauteurRect()`).

## État et valeur

`value` est le JSON de `SchemaEnBarreState` :
`{ type, textes, nbRectangles, toutVisible }`, avec `type` à `null` tant que rien n'est
choisi et les neuf textes toujours présents (vides par défaut).
`parseSchemaEnBarreState()` relit ce JSON en tolérant les champs manquants ;
le setter `value` délègue à `update()`, qui redessine.

Attributs de `create()` : `type-impose` (le choix des quatre schémas n'est pas
proposé), `initial-state` (JSON d'un état partiel), `interactivity-on`.

## Correction

`verifQuestion()` compare le schéma de l'élève à
`autoCorrection[i].valeur.reponse.value`, le JSON d'un `SchemaEnBarreAttendu`
posé par `addSchemaEnBarre(exercice, i, { attendu })`, avec
`comparerSchemas()` :

- le type doit être le bon ;
- seule la place des nombres est vérifiée, avec `nombreBienPlace()` : pour
  chaque texte de `attendu.textes` qui contient un nombre, le texte de
  l'élève à la même place doit contenir ce nombre (le reste est ignoré :
  `Matin\n12 pages` attendu accepte `12`, `12 pages` ou `Isabelle 12`,
  virgule ou point décimal, espaces des milliers). Les textes eux-mêmes ne
  sont pas jugés : un texte attendu sans nombre (`?`, une étiquette) est
  toujours accepté ;
- `attendu.textesIndicatifs` (les étiquettes A et B par exemple) ne sont pas
  vérifiés : ils ne servent qu'à l'affichage du schéma de la correction ;
- `partieA` et `partieB` peuvent être échangés dans le seul schéma additif
  parties-tout, où les deux parties jouent le même rôle ;
- `nbRectangles` n'est vérifié que s'il est présent dans l'attendu.

Le score est de 1 point pour le schéma entier. Après la vérification, le type
et les textes dont le nombre est mal placé reçoivent la classe `is-faux`, puis
le composant devient inerte.

## Rendus imprimés

`create()` choisit la sortie dans cet ordre (`context.isHtml` reste vrai
pendant un export Typst) :

1. `context.isTypst` → `<mathalea-typst>${schemaTypst()}</mathalea-typst>` ;
2. `!context.isHtml` → `schemaLatex()` ; mais si l'interactivité est active
   sans type imposé, rien n'est imprimé : l'élève dessine le schéma ;
3. sinon la balise `<schema-en-barre>`, suivie du `span#resultatCheck…` et du
   `div#feedback…` quand l'interactivité est active.

Les trois rendus partagent la géométrie `GEO` (en `em` pour le HTML, ce qui
permet des vignettes réduites par un simple `font-size`, converties en cm pour
TikZ et en `em` Typst). Les accolades LaTeX utilisent `decoration={brace}`
(bibliothèque chargée automatiquement par `preambuleTex.ts`). Le Typst
n'utilise aucun paquet : accolades et flèches horizontales passent par le
helper `mathalea-schema-span` (injecté par `buildTypstDocument.ts` dès qu'il
est cité), l'accolade verticale par `stretch(brace.r)` sur la hauteur mesurée
des barres.

Les textes saisis sont protégés par `echappeLatex()` et `echappeTypst()` : ce
sont des nombres, des unités ou des prénoms, pas du LaTeX.

## Dans l'exercice `6N4A-5`

Chaque question est un `mathalea-couteau-suisse` à deux enfants : le schéma
(index de la question) et le champ MathLive de la phrase de conclusion, qui
reçoit l'index décalé de `DECALAGE_INDEX_CONCLUSION` (100) pour que ses
identifiants (`champTexteEx…Q…`, `resultatCheckEx…Q…`) ne se confondent pas
avec ceux du schéma. La question vaut donc deux points (le couteau suisse
additionne les `pointsMaxQuestion()` de ses enfants).

La banque `problemesSchemasEnBarre.ts` fournit, pour chaque problème, le
schéma attendu (textes « grandeur, quantité, unité »), les calculs (`Calcul`,
écrits par `texLigneCalcul()` : texte d'introduction, calcul avec ou sans
unités selon le réglage « Unités dans les calculs », phrase à la ligne) et la
phrase de conclusion (`texConclusion()`), dont la valeur
est la réponse attendue dans le champ.
