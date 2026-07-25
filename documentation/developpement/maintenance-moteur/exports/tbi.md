# Vue TBI (vidéoprojection)

La vue TBI (`v=tbi` dans l'URL) est pensée pour un professeur qui vidéoprojette des exercices. Elle est accessible depuis le bouton « Vue TBI (vidéoprojection) » de la page d'accueil (`ExportButtons.svelte`).

## Composants

Tout est sous `src/components/display/tbi/` :

- `Tbi.svelte` — orchestrateur : charge les instances d'exercices alignées par indice sur `exercicesParams`, initialise l'état, maintient l'URL et le localStorage ;
- `TbiToolbar.svelte` — barre flottante (bas droite) : retour à l'éditeur, nouvelles données pour tous (`newDataForAll`), widget horloge, popover de réglages (mode + nombre de colonnes) ;
- `TbiExerciceCard.svelte` — carte d'un exercice (rendu non interactif : `mathaleaFormatExercice` + action `renderMath` qui appelle `mathaleaRenderDiv(node, zoom)`) ;
- `TbiCardActions.svelte` — actions au survol : correction (dessous / à la place / plein écran), nouvelles données, paramètres (modale contenant `Settings.svelte` avec `inModal`), zoom ±, flèches de réordonnancement, saut de colonne, menu « Déplacer vers un onglet » ;
- `TbiClockWidget.svelte` — horloge / minuteur / chronomètre déplaçable en surimpression (temps calculés par horodatages, robustes au throttling) ;
- `layouts/` — `TbiListLayout`, `TbiColumnsLayout` (CSS multi-colonnes + `break-before: column` pour les sauts), `TbiFreeLayout` (cartes positionnées en absolu, poignées de déplacement/redimensionnement via `src/lib/components/tbiPointer.ts` ; largeur et zoom sont indépendants : la poignée ne fait varier que la largeur du cadre (bornée par `TBI_MIN_CARD_WIDTH`/`TBI_MAX_CARD_WIDTH`), le zoom du contenu ne change que via les boutons zoom ±), `TbiTabsLayout` (onglets compactés 0..k-1, chaque onglet a sa propre disposition liste / colonnes / libre).

Les exercices statiques et svelte ne sont pas pris en charge (carte d'information à la place, `TbiCardHost.svelte`).

## État et persistance

`src/lib/stores/tbiStore.ts` :

- `tbiState` — mode de page (`list | columns | free | tabs`), `nbColumns`, `cards[]` (zoom, position/largeur du mode libre, onglet, saut de colonne — alignées par indice sur `exercicesParams`), `tabConfigs[]` (disposition et nb de colonnes de chaque onglet), widget ;
- partie **partageable** (mode, nbColumns, répartition des onglets, sauts de colonne, tabConfigs) sérialisée en base64 dans le paramètre d'URL `tbiParam` via `tbiParamStore` (`generalStore.ts`, même mécanisme que `a4Param`/`typstParam`) ;
- partie **dépendante de l'écran** (positions/largeurs du mode libre, position du widget) sauvegardée en localStorage sous `tbiLayout:<liste des uuid>` ;
- `reorderTbiCard(from, to)` réordonne à la fois `exercicesParams` (ordre canonique, donc l'URL) et les états de carte ; `moveCardToTab` maintient les numéros d'onglets compacts (élagage des onglets vides) et fait suivre `tabConfigs`.

Le rezoom passe toujours par `mathaleaRenderDiv` (`resizeContent` redimensionne les figures SVG), jamais par un `transform` CSS.

Tests : `tests/unit/tbiStore.test.ts`.
