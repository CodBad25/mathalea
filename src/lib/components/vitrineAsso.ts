/**
 * Vitrine de l'association CoopMaths affichée sur la page d'accueil tant
 * qu'aucun exercice n'est sélectionné.
 *
 * Le contenu n'est pas dans le bundle : il est rédigé et construit dans le
 * projet `www` (coopmaths.fr/www), qui publie un fragment HTML autonome
 * (styles embarqués, sans script) sur `/www/vitrine/fragment/`. MathALÉA est
 * servi depuis plusieurs domaines (coopmaths.fr, mathalea.fr…) alors que ce
 * fragment n'existe que sous coopmaths.fr : on le récupère donc en
 * cross-origin explicite vers coopmaths.fr en production (qui envoie les
 * en-têtes CORS nécessaires pour ce chemin), et sur l'origine courante en
 * développement, où Vite proxifie `/www` (voir vite.config.ts).
 */

export const VITRINE_FRAGMENT_PATH = '/www/vitrine/fragment/'

const VITRINE_ORIGIN = 'https://coopmaths.fr'

/** Classe du conteneur racine du fragment, telle que produite par `www`. */
const ROOT_CLASS = 'vitrine-alea'

/**
 * Prépare le fragment reçu pour l'injection dans la page d'accueil :
 * vérifie qu'il s'agit bien de la vitrine et fait ouvrir tous les liens
 * dans un nouvel onglet pour ne pas quitter le générateur.
 *
 * Renvoie `null` si le HTML n'est pas celui attendu (page d'erreur du
 * serveur, réponse vide…).
 */
export function prepareVitrineHtml(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const root = doc.querySelector(`.${ROOT_CLASS}`)
  if (root == null) return null
  // Aucun script n'est exécuté par l'injection, mais on ne prend aucun risque.
  root.querySelectorAll('script').forEach((script) => script.remove())
  root.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href') ?? ''
    if (href.startsWith('mailto:') || href.startsWith('#')) return
    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')
  })
  return root.outerHTML
}

let cache: Promise<string | null> | undefined

/**
 * Récupère le fragment de la vitrine (une seule requête par chargement de
 * page, le résultat est mémorisé). Renvoie `null` en cas d'échec réseau ou
 * de contenu inattendu : l'appelant affiche alors l'accueil historique.
 */
export function loadVitrineHtml(): Promise<string | null> {
  if (cache === undefined) {
    cache = fetchVitrineHtml().catch(() => null)
  }
  return cache
}

async function fetchVitrineHtml(): Promise<string | null> {
  const origin = import.meta.env.DEV ? window.location.origin : VITRINE_ORIGIN
  const url = new URL(VITRINE_FRAGMENT_PATH, origin)
  const response = await fetch(url.toString(), {
    headers: { Accept: 'text/html' },
  })
  if (!response.ok) return null
  return prepareVitrineHtml(await response.text())
}

/** Réservé aux tests. */
export function resetVitrineCache(): void {
  cache = undefined
}
