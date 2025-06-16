# Git Release Tracker v1.0.0 🎉

**Bot Discord avancé pour la surveillance automatique des releases Git avec support Tor**

## 🌟 Fonctionnalités principales

### ✅ Surveillance multi-plateformes
- **GitHub** - API REST officielle avec authentification optionnelle
- **GitLab** - API REST + fallback scraping HTML 
- **Forgejo/Gitea** - API REST + fallback scraping HTML
- **Sites .onion** - Connexion sécurisée via réseau Tor

### 🧅 Innovation : Support Tor intégré
- **Détection automatique** du port Tor (9050, 9150, 9051, 9151)
- **Diagnostic complet** avec scripts dédiés
- **Accès aux dépôts .onion** comme Torzu via le réseau Tor
- **Configuration automatique** du proxy SOCKS5

### 🔔 Notifications intelligentes
- **Messages privés Discord** avec embeds riches
- **Évite les doublons** grâce au système de stockage
- **Informations complètes** : nom, version, lien, description
- **Mode test** pour valider sans spammer

### ⚙️ Configuration simplifiée
- **Scripts npm** pour toutes les opérations
- **Diagnostic automatique** des problèmes
- **Configuration .env** avec détection auto
- **Documentation complète** incluse

## 🚀 Installation rapide

```bash
# 1. Cloner et installer
git clone https://github.com/username/git-release-tracker.git
cd git-release-tracker
npm install

# 2. Configurer
cp .env.example .env
# Éditer .env avec vos tokens Discord

# 3. Diagnostic (optionnel pour Tor)
npm run diagnose

# 4. Tester
npm test

# 5. Démarrer
npm start
```

## 📊 Dépôts surveillés par défaut

| Projet | Plateforme | Méthode |
|--------|------------|---------|
| **Eden Emu** | Forgejo | API + HTML |
| **Citron Emu** | GitLab | API + HTML |
| **Sudachi** | GitHub | API officielle |
| **Torzu** | Forgejo via Tor | API + HTML (.onion) |

## 🛠️ Commandes disponibles

```bash
npm start           # Démarrage en production
npm run dev         # Développement avec auto-reload
npm test            # Test de tous les scrapers
npm run diagnose    # Diagnostic complet Tor
npm run test:tor    # Test connectivité Tor uniquement
npm run reset       # Réinitialisation du stockage
```

## 🔧 Technologies utilisées

- **Node.js** - Runtime JavaScript
- **Discord.js v14** - Interaction avec Discord
- **Axios** - Requêtes HTTP/HTTPS
- **Cheerio** - Web scraping
- **socks-proxy-agent** - Support Tor/SOCKS5
- **Cron** - Tâches périodiques
- **dotenv** - Variables d'environnement

## 📋 Prérequis

- **Node.js 18+**
- **Discord Bot Token** (créé sur Discord Developer Portal)
- **Tor Browser ou service Tor** (pour accéder aux sites .onion)

## 🔒 Sécurité et confidentialité

- ✅ **Aucune donnée sensible** stockée en clair
- ✅ **Connexions Tor chiffrées** pour l'anonymat
- ✅ **Tokens optionnels** pour éviter le rate limiting
- ✅ **Validation des données** récupérées
- ✅ **Logs détaillés** pour le debugging

## 📈 Performance

- **Vérifications toutes les 30 minutes** par défaut (configurable)
- **Requêtes espacées** pour éviter le spam
- **Fallback intelligent** en cas d'échec API
- **Cache local** des dernières releases
- **Timeouts optimisés** pour chaque plateforme

## 🤝 Contribution

Le projet est ouvert aux contributions ! Consultez le fichier `CHANGELOG.md` pour voir l'historique des modifications.

## 📞 Support

- 📖 **Documentation** : README.md et README_TOR.md
- 🔧 **Diagnostic** : `npm run diagnose`
- 🧪 **Tests** : `npm test`
- 💬 **Issues** : GitHub Issues

---

**Développé avec ❤️ par GitHub Copilot**
