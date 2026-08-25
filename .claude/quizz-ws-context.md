# Contexte — Service Quizz WS (Socket.IO) pour MathALÉA

> Document d'amorçage pour le développement du service temps réel du quizz
> MathALÉA. À placer à la racine du dépôt du service (ex. `CONTEXT.md`).
> Il est auto-suffisant : aucune autre source n'est requise pour démarrer.
> Dernière mise à jour : 2026-07-28.

---

## 1. Mission du service

Service **Node.js + Socket.IO** hébergeant le mode **multi-joueurs temps réel**
du quizz MathALÉA (quiz façon Kahoot construits à partir d'exercices QCM de
MathALÉA ; logique de jeu adaptée de la plateforme open-source **Razzia**,
licence MIT — attribution à conserver dans un fichier `NOTICE`).

Le service :

- héberge des **rooms** identifiées par un **PIN à 6 chiffres** ;
- exécute le **moteur de quizz côté serveur** (autorité : chronomètres et
  scores calculés côté serveur — anti-triche) ;
- relaie les statuts de jeu aux clients (manager = navigateur de
  l'enseignant ; players = navigateurs des élèves).

Le service ne fait **pas** :

- de chargement d'exercices MathALÉA (le quiz complet, questions HTML/KaTeX
  incluses, est **construit par le navigateur de l'enseignant** puis envoyé au
  serveur à la création de la room) ;
- de persistance des résultats (mémoire vive uniquement, durée de vie = la
  session) ;
- de service de fichiers statiques (MathALÉA reste un site statique ailleurs).

---

## 2. Infrastructure VALIDÉE (ne pas refaire les tests)

Hébergement **o2switch** (mutualisé, cPanel + CloudLinux) :

| Fait vérifié | Conséquence |
|---|---|
| Sous-domaine `https://ws.bradype.fr` avec SSL Let's Encrypt | endpoint du service |
| Node **22** (v22.23.0) via « Setup Node.js App », runtime **Phusion Passenger** | Passenger gère le cycle de vie et relance l'app en cas de crash |
| **Reverse port binding** : Passenger intercepte `listen()` (socket Unix) | garder `httpServer.listen(process.env.PORT \|\| 3000)` ; aucun port custom accessible |
| **WebSocket bloqué** par la chaîne frontale (testé : `WS fermé 1006`) | **long-polling obligatoire** : `allowUpgrades: false` côté serveur, `transports: ['polling']` côté client. Le long-polling Socket.IO est quasi temps réel (requête tenue, réponse immédiate à chaque message) et validé stable |
| Socket.IO servi sur `path: '/ws'` ; client auto-servi à `/ws/socket.io.js` | toute l'API transite par ce chemin |
| App root : `/home/taxu3800/nodevenv/quizz-ws` (**hors** racine web) ; document root séparé `~/ws.bradype.fr` | les sources et la config ne sont **pas** exposées en HTTP — à préserver |
| Redémarrage de l'app | bouton *Restart* dans cPanel, ou `touch tmp/restart.txt` depuis l'app root |
| **Ne jamais lancer `node` à la main** en production | Passenger est le seul pilote |
| Compilateurs natifs bloqués (`node-gyp`) | dépendances 100 % JS pur uniquement (`socket.io`, `zod` : OK) |
| Passenger endort l'app inactive | prévoir un cron de chauffe : `*/5 * * * * curl -s https://ws.bradype.fr/health` |
| Endpoints existants : `/health` (répond `ok`), `/test` (page de diagnostic Socket.IO) | à conserver/enrichir |

Capacité : le long-polling supporte sans difficulté ~4 classes simultanées
(~150 clients ; rafales ~180 req/s de petit JSON). **Contrainte d'instance
unique** : le registre des rooms est en mémoire d'un seul processus — vérifier
dans les logs que Passenger ne monte pas une 2ᵉ instance sous charge (à
verrouiller si possible via le support : `PassengerMaxInstances 1`).

---

## 3. Configuration et sécurité

### Modèle de sécurité : pas d'authentification, maîtrise de l'abus

Décision produit (2026-07-28) : **aucun mot de passe manager** — la création
de session est transparente pour l'enseignant (flux « API » déclenché au clic
sur « Lancer le quizz »). MathALÉA étant un site statique, tout secret côté
client serait public ; l'association ne peut pas distribuer de secrets. La
sécurité repose donc sur la **limitation de l'abus**, pas sur
l'authentification — ce qui est acceptable car :

- une room est **invisible sans son PIN** (pas d'annuaire public, pas de
  contenu indexable) ;
- tout **expire** automatiquement (TTL, §7) ;
- l'URL du quizz multi n'est pas une capacité : elle ne permet que de créer
  *d'autres* rooms ; le contrôle d'une room est lié au `clientId` du
  navigateur créateur.

### Mesures obligatoires

1. **Preuve de travail (hashcash) à `createGame`** : `manager:getChallenge`
   → le serveur émet un défi **signé HMAC + horodaté** (clé secrète
   **serveur** `QUIZZ_POW_SECRET`, stockée en variable d'environnement cPanel
   de préférence, sinon `.configQuizz.json` — mêmes règles : 600, gitignoré,
   exclu de rsync, jamais dans le webroot). Le client calcule un nonce tel que
   `sha256(défi + ':' + nonce)` ait `QUIZZ_POW_DIFFICULTY` bits de tête à zéro
   (défaut 20 bits ≈ 1-3 s de CPU navigateur), puis envoie
   `createGame { défi, nonce, … }`. Vérification stateless (signature +
   fraîcheur 60 s + hash).
2. **Quotas** : création ≤ 10 rooms/h/IP et ≤ 40 rooms/j/IP ; ≤ 30 rooms
   actives au global (refus propre) ; joins ≤ 300/h/IP.
3. **Kill switch** : variable d'environnement `QUIZZ_DISABLE_CREATE=1` →
   `createGame` refusé sans redéploiement.
4. **CORS** : `origin: ['https://coopmaths.fr', 'http://localhost:5173']`.
5. **Validation zod** de tout le contenu reçu (le quiz vient du navigateur de
   l'enseignant : jamais de confiance aveugle) — bornes au §6.
6. **Monitoring** : métriques `/health` + journal des créations de rooms.

Variante possible à la preuve de travail maison : **Cloudflare Turnstile**
(captcha invisible, vérifiable côté serveur) — écartée par défaut pour éviter
la dépendance externe, à réévaluer si le PoW montrait ses limites.

---

## 4. Le moteur de jeu (snapshot vendored)

Le moteur vit dans le dépôt MathALÉA (`src/modules/quizz/`, source de vérité).
Pour ce dépôt : **copie vendored datée** dans
`vendor/mathalea-quizz/` (engine + types + transports), avec un en-tête
indiquant la date du snapshot. Resynchronisation manuelle pendant la phase de
test ; unification ultérieure (monorepo ou paquet interne) à la mise en
production.

Contenu du snapshot :

```
vendor/mathalea-quizz/
  types.ts                        # statuts, événements, payloads, Quizz, Player…
  engine/
    QuizzEngine.ts                # machine à états (port du RoundManager Razzia)
    CooldownTimer.ts              # minuteur de phase (promesse + abort + ticks 1 s)
    QuizzPlayerManager.ts         # registre des joueurs d'une room
    scoring.ts                    # timeToPoint, orderToPoint, ratios single/multi
  transport/
    QuizzTransport.ts             # interface broadcast/send/emit
    LocalTransport.ts             # bus en mémoire (utile pour les tests serveur)
```

### API du moteur

```ts
new QuizzEngine({
  quizz,            // Quizz complet (voir §5)
  players,          // QuizzPlayerManager pré-rempli ou rempli au fil des joins
  transport,        // implémentation serveur de QuizzTransport (Socket.IO)
  mode,             // 'solo' | 'projection' | 'multi' (cosmétique, moteur agnostique)
  scoring,          // 'full' | 'simple' | 'none'
  multiScoringMode, // optionnel : 'strict' | 'balanced' (défaut) | 'lenient'
})

engine.start()                    // lance la séquence (async)
engine.selectAnswer(playerId, answerIds)  // 1ʳᵉ réponse seule compte, phase 'select' uniquement
engine.nextQuestion()
engine.showLeaderboard()          // → SHOW_LEADERBOARD, ou FINISHED si dernière question
engine.abortQuestion()            // interrompt le chrono → révèle les résultats
engine.finish()                   // termine immédiatement (FINISHED)
engine.destroy()                  // nettoie les minuteurs
engine.getProgress()              // { current, total }
engine.getPhase()                 // 'idle'|'start'|'prepared'|'question'|'select'|'results'|'leaderboard'|'finished'
```

### Séquence émise (identique à Razzia)

```
SHOW_START (3 s + compte à rebours 3-2-1)
└─ par question :
   SHOW_PREPARED (2 s ; nb de réponses et n° de question)
   SHOW_QUESTION (cooldown s ; énoncé seul)
   SELECT_ANSWER (time s ; énoncé + réponses ; fermeture anticipée dès que
                  tous les joueurs ont répondu)
   SHOW_RESULT (envoyé à CHAQUE joueur : verdict, points, total, rang,
                aheadOfMe, correction, solutions, answers, selected)
   SHOW_RESPONSES (diffusé : histogramme, solutions, correction — écran manager)
   [SHOW_LEADERBOARD] (sur commande manager ; top 5 ancien → nouveau)
FINISHED (podium top 3 + rang/points par joueur)
```

### Événements annexes émis via `transport.emit`

`game:cooldown` (tick 1 s pendant les phases chronométrées),
`game:startCooldown`, `game:updateQuestion {current, total}`,
`game:playerAnswer` (nombre de joueurs ayant répondu).

### Adaptations moteur prévues (à appliquer lors de la resync ou en patch)

1. `start()` : refuser si `players.count() === 0` (émettre
   `game:errorMessage` au lieu de démarrer).
2. `showLeaderboard()` : si `opts.managerId` fourni → `send(managerId, …)`
   au lieu de `broadcast` (comportement Razzia).
3. Exposer les derniers statuts par joueur pour la reconnexion en phase
   `results` (ou les mémoriser dans la classe `Game` du serveur — voir §7).

---

## 5. Types partagés (contrat exact)

```ts
const QUIZZ_STATUS = {
  SHOW_START: 'SHOW_START', SHOW_PREPARED: 'SHOW_PREPARED',
  SHOW_QUESTION: 'SHOW_QUESTION', SELECT_ANSWER: 'SELECT_ANSWER',
  SHOW_RESULT: 'SHOW_RESULT', SHOW_RESPONSES: 'SHOW_RESPONSES',
  SHOW_LEADERBOARD: 'SHOW_LEADERBOARD', FINISHED: 'FINISHED', WAIT: 'WAIT',
  // EXTENSION V2 (à ajouter au snapshot) :
  SHOW_ROOM: 'SHOW_ROOM',     // lobby manager : PIN + liste des joueurs
} as const

interface QuizzQuestion {
  type: 'single' | 'multi'
  question: string            // HTML (KaTeX)
  answers: string[]           // HTML, 2 à 4, ordre d'affichage final
  solutions: number[]         // indices 0-based
  correction: string          // HTML — révélée seulement après la question
  cooldown: number            // 3–15 s
  time: number                // 5–120 s (ou -1 = sans limite)
  maxPoints?: number          // défaut 1000
  penalty?: number
  sourceRef?: string          // réf. exercice MathALÉA (ex. '1A-C01-3')
}
interface Quizz { subject: string, questions: QuizzQuestion[] }
interface QuizzPlayer { id: string, username: string, points: number, streak: number }
interface QuizzAnswer { playerId: string, answerIds: number[], points: number }
```

Payloads par statut (`game:status { name, data }`) — **déjà figés côté
client MathALÉA, ne pas renommer** :

- `SHOW_START` `{ time, subject }`
- `SHOW_PREPARED` `{ totalAnswers, questionNumber }`
- `SHOW_QUESTION` `{ question, cooldown }` — **sans solutions**
- `SELECT_ANSWER` `{ question, answers, time, totalPlayer, questionType }` — **sans solutions ni correction**
- `SHOW_RESULT` `{ correct, message, points, myPoints, rank, aheadOfMe, correction, solutions, answers, selected, scoring }`
- `SHOW_RESPONSES` `{ question, responses: Record<number, number>, solutions, answers, correction, selected, scoring }`
- `SHOW_LEADERBOARD` `{ oldLeaderboard: QuizzPlayer[], leaderboard: QuizzPlayer[] }`
- `FINISHED` `{ subject, top: QuizzPlayer[], rank?, myPoints?, scoring }`
- `WAIT` `{ text }`
- `SHOW_ROOM` (V2) `{ text, inviteCode, players: QuizzPlayer[] }`

Scoring (calculé par le moteur, côté serveur) : `timeToPoint` = décroissance
linéaire de `maxPoints` (défaut 1000) vers 0 sur `time` ; ratio `single` 0/1 ;
`multi` : `strict` (tout ou rien), `balanced` ((bonnes − mauvaises)/solutions,
plancher 0 — défaut), `lenient` (bonnes/solutions). Mode `full` : points ×
ratio ; `simple` : 1 point si ratio = 1 ; `none` : pas de points (verdict
conservé). Pénalité optionnelle par question, total planché à 0. `streak`
incrémenté sur bonne réponse, sinon remis à 0.

---

## 6. Protocole d'événements (noms alignés sur Razzia)

### Client → serveur

| Événement | Payload | Réponse / effet |
|---|---|---|
| `manager:getChallenge` | — | `manager:challenge { défi, difficulté, expire }` (HMAC horodaté) |
| `manager:createGame` | `{ défi, nonce, quizz, scoring, multiScoringMode? }` | vérif PoW + quotas + validation zod → `manager:gameCreated { gameId, inviteCode }` + statut `SHOW_ROOM` ; sinon `game:errorMessage` (défi invalide/expiré, quota dépassé, création désactivée) |
| `manager:startGame` | `{ gameId }` | `engine.start()` (refus si 0 joueur) |
| `manager:nextQuestion` | `{ gameId }` | question suivante |
| `manager:showLeaderboard` | `{ gameId }` | `SHOW_LEADERBOARD` ou `FINISHED` |
| `manager:abortQuiz` | `{ gameId }` | révèle les résultats immédiatement |
| `manager:kickPlayer` | `{ gameId, playerId }` | `game:reset` au joueur + `manager:playerKicked` + `game:totalPlayers` |
| `manager:closeGame` | `{ gameId }` | `game:reset` à tous, sockets fermées, room détruite |
| `manager:reconnect` | `{ gameId }` | `manager:successReconnect { status, players, currentQuestion }` |
| `player:checkPin` | `pin` | `player:checkPinResult { valid }` |
| `player:join` | `pin` | `game:successRoom { gameId }`, ou reconnexion auto si `clientId` déjà assis, ou `game:errorMessage` (PIN inconnu / room pleine / quiz déjà démarré sans siège) |
| `player:login` | `{ gameId, data: { username } }` | username 1–20 car., unique dans la room → `game:successJoin` + `manager:newPlayer` + `game:totalPlayers` + statut `WAIT` |
| `player:selectedAnswer` | `{ gameId, data: { answerKeys: number[] } }` | première réponse seule compte, phase `select` seulement ; → `WAIT` au joueur + `game:playerAnswer` aux autres |
| `player:reconnect` | `{ gameId }` | `player:successReconnect { gameId, status, player, currentQuestion }` ou `game:reset` |
| `player:leave` | `{ gameId }` | siège libéré (avant début) ou marqué déconnecté (en cours) |

### Serveur → client

`game:status { name, data }` (cf. §5) • `game:totalPlayers <count>` •
`game:updateQuestion { current, total }` • `game:playerAnswer <count>` •
`game:cooldown <secondes>` • `game:startCooldown` • `game:errorMessage <clé>` •
`game:reset <raison>` (kicked / room fermée / expirée — le client retourne à
l'écran de jointure) • `manager:challenge`, `manager:gameCreated`,
`manager:newPlayer`, `manager:playerKicked`,
`manager:successReconnect` • `player:checkPinResult`, `player:successReconnect` •
`game:successRoom`, `game:successJoin`.

### Validation zod du quiz à `createGame`

`subject` 1–120 car. ; 1–50 questions ; `question` ≤ 4000 car. ;
`answers` 2–4 (chaque ≤ 2000 car.) ; `solutions` indices valides non vides ;
`cooldown` entier 3–15 ; `time` entier 5–120 ou −1 ; `correction` ≤ 8000 car. ;
`type` ∈ {single, multi} (cohérent avec `solutions.length`).

### Reconnexions

`clientId` (uuid persistant par navigateur) transmis au handshake :
`io(url, { auth: { clientId } })`. Le serveur l'utilise pour restituer le
siège (points conservés) et le dernier statut. La classe `Game` mémorise
`lastBroadcastStatus`, `lastManagerStatus` et `lastPlayerStatus[playerId]`
(pattern de la classe `Game` de Razzia).

---

## 7. Cycle de vie des rooms (aucune persistance)

| État | Durée de vie |
|---|---|
| Lobby (`SHOW_ROOM`, non démarrée) | **30 min** |
| Partie en cours | plafond dur **4 h** |
| Partie terminée (`FINISHED`) | **15 min** |
| Manager + tous les joueurs déconnectés | grâce **10 min** puis fermeture |
| `manager:closeGame` | fermeture immédiate (`game:reset` diffusé, sockets libérées) |

Balayage périodique toutes les 60 s. Métriques exposées par `/health` :
`{ status, rooms, connections, uptime }`.

Option (décidée côté produit) : à `FINISHED`, envoyer au manager
`game:results` (classement complet + réponses par question) — le client
MathALÉA génère un CSV côté navigateur ; le serveur ne stocke rien.

---

## 8. Structure cible du dépôt

```
quizz-ws/
  CONTEXT.md                    # ce fichier
  NOTICE                        # attribution Razzia (MIT)
  package.json
  tsconfig.json
  .gitignore                    # node_modules, dist, .configQuizz.json
  .configQuizz.example.json     # gabarit (champs vides) — si option fichier
  src/
    index.ts                    # http server + Socket.IO (allowUpgrades:false) + /health
    config.ts                   # lecture env / .configQuizz.json (scrypt verify)
    registry.ts                 # rooms : PIN, création, expiration, limites, balayage
    game.ts                     # wrapper : engine + transport + joueurs + derniers statuts
    socketTransport.ts          # implémentation serveur de QuizzTransport
    validation.ts               # schémas zod (quiz, username, payloads)
    challenge.ts                # preuve de travail : émission (HMAC) + vérification
    rateLimit.ts                # quotas création/join par IP + kill switch
    handlers/
      manager.ts
      player.ts
  vendor/mathalea-quizz/        # snapshot moteur (voir §4)
  tests/
    registry.test.ts
    validation.test.ts
    integration.test.ts         # vrais socket.io-client : partie complète
  scripts/
    deploy.sh                   # rsync (exclut .configQuizz.json) + npm install --omit=dev
    load.js                     # ~150 clients simulés sur 3 rooms
```

`package.json` — deps : `socket.io`, `zod` ; dev : `typescript`, `vitest`,
`socket.io-client`, `@types/node`. Scripts : `build` → `tsc`,
`start` → `node dist/index.js`, `test` → `vitest run`.

Déploiement (Procédure conservée, validée) : `scripts/deploy.sh` → rsync vers
`/home/taxu3800/nodevenv/quizz-ws` → `npm install --omit=dev` sur le serveur
→ startup file Passenger `dist/index.js` → `touch tmp/restart.txt` → vérifier
`/health`. Cron de chauffe toutes les 5 min.

---

## 9. Plan d'implémentation (ordre conseillé)

1. **Squelette** : `index.ts` (health enrichi + Socket.IO polling) porté en
   TS, build `tsc`, redéploiement — non régression de `/health` et
   `/ws/socket.io.js`.
2. **Vendor** du moteur + `socketTransport.ts` (broadcast/send/emit →
   `io.to(gameId)` / socket ciblée).
3. **`registry.ts` + `game.ts`** : création/destruction de rooms, PIN unique,
   TTL et balayage, limites, mémorisation des derniers statuts.
4. **`challenge.ts` + `rateLimit.ts` + `handlers/manager.ts`** : émission et
   vérification des défis de preuve de travail, quotas par IP, createGame
   (validation zod), commandes (start/next/leaderboard/abort/kick/close/
   reconnect) avec contrôle créateur↔room.
5. **`handlers/player.ts`** : checkPin/join/login/selectedAnswer/
   reconnect/leave.
6. **Tests** : unitaires (registry, validation, scoring déjà couvert côté
   moteur) puis **intégration** : serveur de test sur port local + vrais
   clients — partie complète à 4 joueurs, reconnexions, kick, close.
7. **Charge** : `scripts/load.js` (~150 clients polling, 3 rooms) — observer
   mémoire/latence et l'unicité du processus Passenger.
8. **Durcissement** : revue des limites, logs de cycle de vie des rooms,
   runbook (redémarrage, lecture des logs cPanel « Errors », métriques).

Jalon de sortie : une partie réelle pilotée depuis deux navigateurs (1
manager + joueurs) **avant** le branchement du client MathALÉA (qui arrivera
ensuite : `SocketTransport` navigateur + écrans de jointure — les layouts du
quiz existent déjà et consomment `game:status` tel quel).

---

## 10. Références

**Important — accès aux références MathALÉA.** Les chemins ci-dessous sont
**relatifs à la racine du dépôt MathALÉA** (branche `sylvain_quizz`), qui
n'est **pas publié en ligne** à ce stade : ils ne sont exploitables que si ce
dépôt est cloné sur la machine de travail (chemin absolu type :
`/home/<user>/projets/coopmaths/mathalea/`). Ce document est par conception
**auto-suffisant** : tout ce qui est indispensable (API du moteur, types,
protocole) est déjà recopié dans les sections 4 à 6 — les références sont un
approfondissement, pas un prérequis. Si l'approfondissement est souhaité,
copier dans ce dépôt, à côté de `CONTEXT.md` :
`documentation/developpement/maintenance-moteur/exports/quizz.md`
(depuis le dépôt MathALÉA) vers `docs/quizz-mathalea.md`.

- Razzia (MIT, Copyright (c) 2024 Ralex) :
  https://github.com/Ralex91/Razzia — notamment `docs/websocket-protocol.md`
  (protocole joueur quasi identique au nôtre) et `packages/socket/`
  (`services/game/round-manager.ts`, `services/registry.ts`).
- Dépôt MathALÉA (local, voir note ci-dessus) :
  `documentation/developpement/maintenance-moteur/exports/quizz.md`
  (vue d'ensemble), `src/modules/quizz/` (moteur, source de vérité du snapshot).
- FAQ o2switch Node.js :
  https://faq.o2switch.fr/cpanel/logiciels/hebergement-nodejs-multi-version/

