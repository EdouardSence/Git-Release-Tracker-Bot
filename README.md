# Git Release Tracker Bot

Un bot Discord qui surveille automatiquement les releases de dépôts Git et envoie des notifications en message privé.

## Fonctionnalités

- ✅ Surveillance automatique de 4 types de dépôts Git :
  - **GitHub** (API officielle)
  - **GitLab** (API + scraping HTML)
  - **Forgejo/Gitea** (API + scraping HTML)
  - **Sites .onion via Tor** (API + scraping HTML)
- ✅ **Support réseau Tor** pour les dépôts .onion
- ✅ Notifications en message privé Discord avec embed riche
- ✅ Vérification périodique configurable
- ✅ Sauvegarde de l'état pour éviter les doublons
- ✅ Support de différentes plateformes Git avec fallback intelligent
- ✅ Détection automatique du port Tor

## Dépôts surveillés

- **Eden Emu** (Forgejo) : https://git.eden-emu.dev/eden-emu/eden/releases
- **Citron Emu** (GitLab) : https://git.citron-emu.org/citron/emu/-/releases
- **Sudachi** (GitHub) : https://github.com/emuplace/sudachi.emuplace.app/releases
- **Torzu** (Forgejo via Tor) : http://vub63vv26q6v27xzv2dtcd25xumubshogm67yrpaz2rculqxs7jlfqad.onion/torzu-emu/torzu/releases

## Installation

1. Clonez le projet et installez les dépendances :

```bash
npm install
```

2. Créez un fichier `.env` à partir de `.env.example` :

```bash
cp .env.example .env
```

3. Configurez votre fichier `.env` :

```env
DISCORD_TOKEN=votre_token_discord_ici
TARGET_USER_ID=votre_user_id_ici
CHECK_INTERVAL_MINUTES=30

# Tokens optionnels pour améliorer les performances
GITHUB_TOKEN=votre_token_github_optionnel
GITLAB_TOKEN=votre_token_gitlab_optionnel

# Configuration Tor (détectée automatiquement)
TOR_PROXY=socks5h://127.0.0.1:9050
```

## Configuration Tor (pour Torzu)

### 1. Installation de Tor

Pour accéder au dépôt Torzu via le réseau Tor :

1. **Téléchargez Tor Browser** : https://www.torproject.org/download/
2. **Ou installez Tor service** pour votre OS
3. **Démarrez Tor** (le service doit écouter sur un port SOCKS5)

### 2. Test de connectivité Tor

```bash
# Diagnostic automatique (détecte le port et teste la connexion)
node diagnose-tor.js

# Test manuel de Tor
node test-tor.js
```

### 3. Ports Tor supportés

Le bot détecte automatiquement Tor sur ces ports :

- **9050** : Service Tor standard (Linux/macOS)
- **9150** : Tor Browser (Windows)
- **9051, 9151** : Ports alternatifs

## Configuration du Bot Discord

### 1. Créer une application Discord

1. Rendez-vous sur https://discord.com/developers/applications
2. Cliquez sur "New Application"
3. Donnez un nom à votre application
4. Dans l'onglet "Bot", cliquez sur "Add Bot"
5. Copiez le token et ajoutez-le dans `.env`

### 2. Récupérer votre User ID

1. Activez le mode développeur dans Discord (Paramètres utilisateur > Avancé > Mode développeur)
2. Clic droit sur votre nom d'utilisateur > "Copier l'ID"
3. Ajoutez cet ID dans `.env` comme `TARGET_USER_ID`

### 3. Inviter le bot (optionnel)

Le bot fonctionne uniquement en messages privés, il n'a pas besoin d'être dans un serveur.

## Utilisation

```bash
# Démarrage normal
npm start

# Démarrage en mode développement (redémarrage automatique)
npm run dev

# Tests et diagnostics
node test.js              # Test tous les dépôts
node diagnose-tor.js      # Diagnostic Tor + test Torzu
node test-tor.js          # Test connectivité Tor uniquement
node reset.js             # Réinitialiser le stockage des releases
```

## Comment ça marche

1. **Détection des releases** : Le bot utilise différentes méthodes selon la plateforme :

   - **GitHub** : API REST officielle
   - **GitLab** : API REST + fallback scraping HTML
   - **Forgejo/Gitea** : API REST + fallback scraping HTML
   - **Sites .onion** : Connexion via Tor avec API/scraping

2. **Support Tor** : Détection automatique du port et connexion sécurisée aux sites .onion

3. **Vérification périodique** : Configurable via `CHECK_INTERVAL_MINUTES` (défaut: 30 minutes)

4. **Stockage de l'état** : Les dernières releases sont sauvegardées dans `last_releases.json`

5. **Notifications** : Messages privés Discord avec embed contenant :
   - Nom du projet
   - Version/tag de la release
   - Nom de la release
   - Lien vers la release

## Structure du projet

```
git-analyzer/
├── index.js              # Fichier principal du bot
├── package.json          # Dépendances et scripts
├── .env.example          # Exemple de configuration
├── .env                  # Configuration (à créer)
├── last_releases.json    # État sauvegardé (généré automatiquement)
├── tor-proxy.js          # Utilitaire de connexion Tor
├── test.js               # Tests des scrapers
├── test-tor.js           # Test connectivité Tor
├── diagnose-tor.js       # Diagnostic complet Tor
├── reset.js              # Réinitialisation du stockage
├── README_TOR.md         # Documentation Tor détaillée
└── README.md            # Ce fichier
```

## Dépendances

- **discord.js** : Interaction avec l'API Discord
- **axios** : Requêtes HTTP/HTTPS
- **cheerio** : Web scraping pour les plateformes sans API
- **cron** : Programmation des tâches périodiques
- **dotenv** : Gestion des variables d'environnement
- **socks-proxy-agent** : Support des connexions Tor via SOCKS5

## Personnalisation

Pour ajouter d'autres dépôts, modifiez le tableau `repositories` dans `index.js` :

```javascript
{
    name: 'Nom du projet',
    url: 'https://example.com/user/repo/releases',
    type: 'github', // ou 'gitlab', 'forgejo'
    apiUrl: 'https://api.example.com/repos/user/repo/releases', // optionnel
    useTor: false // true pour les sites .onion
}
```

### Exemple pour un site .onion :

```javascript
{
    name: 'Mon Projet Tor',
    url: 'http://example.onion/user/repo/releases',
    type: 'forgejo',
    apiUrl: 'http://example.onion/api/v1/repos/user/repo/releases',
    useTor: true
}
```

## Logs

Le bot affiche des logs dans la console :

- ✅ Statut de connexion Discord et Tor
- 🔍 Début des vérifications
- 🆕 Nouvelles releases détectées
- 🧅 Statut des connexions Tor
- ❌ Erreurs éventuelles

## Limitations

- Le web scraping peut être affecté par les changements de structure des sites
- Certaines plateformes peuvent avoir des limitations de taux de requêtes
- GitHub API a une limite de 60 requêtes/heure sans authentification
- **Les connexions Tor peuvent être plus lentes** (15-30 secondes par requête)
- **Tor doit être en cours d'exécution** pour accéder aux sites .onion

## Dépannage

### Problèmes Tor

1. **"Aucun service Tor trouvé"** :

   - Installez et démarrez Tor Browser ou le service Tor
   - Vérifiez que les ports 9050/9150 sont ouverts

2. **"Timeout" sur les sites .onion** :

   - Augmentez le timeout dans le code (actuellement 15-20s)
   - Vérifiez votre connexion Tor avec `node test-tor.js`

3. **Erreurs de connexion** :
   - Lancez `node diagnose-tor.js` pour un diagnostic complet
   - Vérifiez la configuration `TOR_PROXY` dans `.env`

### Support

Pour plus de détails sur la configuration Tor, consultez `README_TOR.md`.
