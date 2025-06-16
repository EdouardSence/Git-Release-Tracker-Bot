# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-06-16

### ✨ Ajouté
- **Bot Discord complet** pour la surveillance des releases Git
- **Support multi-plateformes** : GitHub, GitLab, Forgejo/Gitea
- **Support réseau Tor** pour les dépôts .onion (Torzu)
- **Détection automatique du port Tor** (9050, 9150, 9051, 9151)
- **API et scraping HTML** avec fallback intelligent
- **Notifications Discord** en message privé avec embeds riches
- **Système de stockage** pour éviter les doublons (`last_releases.json`)
- **Vérifications périodiques** configurables (défaut: 30 minutes)
- **Scripts de diagnostic** et de test complets
- **Mode test** pour éviter les notifications lors des tests

### 🔧 Fonctionnalités techniques
- **Authentification optionnelle** pour GitHub et GitLab (tokens)
- **Gestion d'erreurs robuste** avec retry automatique
- **Timeouts configurables** pour les requêtes réseau
- **Support SOCKS5** via socks-proxy-agent pour Tor
- **Configuration automatique** du fichier .env

### 📦 Dépôts surveillés
- **Eden Emu** (Forgejo) - https://git.eden-emu.dev/eden-emu/eden/releases
- **Citron Emu** (GitLab) - https://git.citron-emu.org/citron/emu/-/releases  
- **Sudachi** (GitHub) - https://github.com/emuplace/sudachi.emuplace.app/releases
- **Torzu** (Forgejo via Tor) - http://vub63vv26q6v27xzv2dtcd25xumubshogm67yrpaz2rculqxs7jlfqad.onion/torzu-emu/torzu/releases

### 🛠️ Scripts disponibles
- `npm start` - Démarrage en production
- `npm run dev` - Développement avec auto-reload
- `npm test` - Test de tous les scrapers
- `npm run diagnose` - Diagnostic complet Tor
- `npm run test:tor` - Test connectivité Tor uniquement
- `npm run reset` - Réinitialisation du stockage

### 📚 Documentation
- README principal avec guide complet d'installation
- README_TOR.md pour la configuration Tor détaillée
- Fichiers d'exemple (.env.example)
- Scripts de diagnostic automatique

### 🔒 Sécurité
- Connexions sécurisées via Tor pour les sites .onion
- Gestion sécurisée des tokens d'API
- Validation des données récupérées
- Logs détaillés pour le debugging

## [Unreleased]
### À venir
- Interface web pour la configuration
- Support d'autres plateformes Git
- Notifications via webhook
- Métriques et monitoring
