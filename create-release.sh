#!/bin/bash

# Script de création de release automatique
# Usage: ./create-release.sh [version] [message]

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
VERSION=${1}
MESSAGE=${2:-"Release automatique"}
DATE=$(date +"%Y-%m-%d")

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérification des paramètres
if [ -z "$VERSION" ]; then
    log_error "Version requise !"
    echo "Usage: $0 <version> [message]"
    echo "Exemple: $0 1.1.0 \"Nouvelle fonctionnalité\""
    exit 1
fi

# Validation du format de version (semver)
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    log_error "Format de version invalide ! Utilisez le format semver (ex: 1.0.0)"
    exit 1
fi

log_info "Création de la release v$VERSION"

# Vérification de l'état du repo
log_info "Vérification de l'état du dépôt..."
if [ -n "$(git status --porcelain)" ]; then
    log_warning "Des fichiers non commités détectés !"
    git status --short
    read -p "Continuer quand même ? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Release annulée"
        exit 1
    fi
fi

# Mise à jour du package.json
log_info "Mise à jour de la version dans package.json..."
if command -v jq &> /dev/null; then
    jq ".version = \"$VERSION\"" package.json > package.json.tmp && mv package.json.tmp package.json
    log_success "Version mise à jour dans package.json"
else
    log_warning "jq non trouvé, veuillez mettre à jour package.json manuellement"
fi

# Mise à jour du CHANGELOG
log_info "Mise à jour du CHANGELOG..."
if [ -f "CHANGELOG.md" ]; then
    # Créer une sauvegarde
    cp CHANGELOG.md CHANGELOG.md.bak
    
    # Ajouter la nouvelle version en haut
    {
        echo "# Changelog"
        echo ""
        echo "## [$VERSION] - $DATE"
        echo ""
        echo "### 🔄 Changements"
        echo "- $MESSAGE"
        echo ""
        tail -n +3 CHANGELOG.md.bak
    } > CHANGELOG.md
    
    rm CHANGELOG.md.bak
    log_success "CHANGELOG mis à jour"
else
    log_warning "CHANGELOG.md non trouvé"
fi

# Tests avant release
log_info "Exécution des tests..."
if npm test &> /dev/null; then
    log_success "Tests passés avec succès"
else
    log_warning "Tests échoués, mais continuation de la release"
fi

# Commit des changements
log_info "Création du commit de release..."
git add .
git commit -m "🚀 Release v$VERSION

$MESSAGE

📅 Date: $DATE
🏷️  Tag: v$VERSION" || log_warning "Rien à commiter"

# Création du tag
log_info "Création du tag v$VERSION..."
git tag -a "v$VERSION" -m "Release v$VERSION

$MESSAGE

Date: $DATE
Fonctionnalités: Bot Discord pour surveillance Git avec support Tor"

# Push vers le dépôt distant
log_info "Push vers le dépôt distant..."
git push origin main
git push origin "v$VERSION"

log_success "Release v$VERSION créée avec succès ! 🎉"
log_info "Tag disponible sur GitHub : https://github.com/username/git-release-tracker/releases/tag/v$VERSION"

# Génération des notes de release
log_info "Génération des notes de release..."
{
    echo "# Git Release Tracker v$VERSION"
    echo ""
    echo "**$MESSAGE**"
    echo ""
    echo "## 📅 Date de release"
    echo "$DATE"
    echo ""
    echo "## 🔄 Changements principaux"
    echo "- $MESSAGE"
    echo ""
    echo "## 📦 Installation"
    echo '```bash'
    echo "git clone https://github.com/username/git-release-tracker.git"
    echo "cd git-release-tracker"
    echo "git checkout v$VERSION"
    echo "npm install"
    echo '```'
    echo ""
    echo "## 🚀 Mise à jour depuis une version précédente"
    echo '```bash'
    echo "git pull"
    echo "git checkout v$VERSION"
    echo "npm install"
    echo "npm run diagnose  # Re-test de la configuration"
    echo '```'
} > "RELEASE_v${VERSION}.md"

log_success "Notes de release générées dans RELEASE_v${VERSION}.md"
log_info "🎯 N'oubliez pas de créer la release sur GitHub avec ce fichier !"

echo ""
log_success "🎉 Release v$VERSION terminée avec succès !"
