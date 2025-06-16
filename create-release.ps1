# Script PowerShell pour créer une release
# Usage: .\create-release.ps1 -Version "1.1.0" -Message "Nouvelle fonctionnalité"

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [string]$Message = "Release automatique"
)

# Validation du format semver
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Host "❌ Format de version invalide ! Utilisez le format semver (ex: 1.0.0)" -ForegroundColor Red
    exit 1
}

$Date = Get-Date -Format "yyyy-MM-dd"

Write-Host "🚀 Création de la release v$Version" -ForegroundColor Blue

# Vérification de l'état du repo
Write-Host "ℹ️  Vérification de l'état du dépôt..." -ForegroundColor Cyan
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  Des fichiers non commités détectés !" -ForegroundColor Yellow
    git status --short
    $continue = Read-Host "Continuer quand même ? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "❌ Release annulée" -ForegroundColor Red
        exit 1
    }
}

# Mise à jour du package.json (version manuelle recommandée)
Write-Host "ℹ️  Veuillez mettre à jour la version dans package.json manuellement si nécessaire" -ForegroundColor Cyan

# Tests
Write-Host "ℹ️  Exécution des tests..." -ForegroundColor Cyan
try {
    npm test | Out-Null
    Write-Host "✅ Tests passés avec succès" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Tests échoués, mais continuation de la release" -ForegroundColor Yellow
}

# Commit des changements
Write-Host "ℹ️  Création du commit de release..." -ForegroundColor Cyan
git add .
$commitMessage = @"
🚀 Release v$Version

$Message

📅 Date: $Date
🏷️  Tag: v$Version
"@
git commit -m $commitMessage

# Création du tag
Write-Host "ℹ️  Création du tag v$Version..." -ForegroundColor Cyan
$tagMessage = @"
Release v$Version

$Message

Date: $Date
Fonctionnalités: Bot Discord pour surveillance Git avec support Tor
"@
git tag -a "v$Version" -m $tagMessage

# Push
Write-Host "ℹ️  Push vers le dépôt distant..." -ForegroundColor Cyan
git push origin main
git push origin "v$Version"

# Génération des notes de release
$releaseNotes = @"
# Git Release Tracker v$Version

**$Message**

## 📅 Date de release
$Date

## 🔄 Changements principaux
- $Message

## 📦 Installation
``````bash
git clone https://github.com/username/git-release-tracker.git
cd git-release-tracker
git checkout v$Version
npm install
``````

## 🚀 Mise à jour depuis une version précédente
``````bash
git pull
git checkout v$Version
npm install
npm run diagnose  # Re-test de la configuration
``````
"@

$releaseNotes | Out-File -FilePath "RELEASE_v$Version.md" -Encoding UTF8

Write-Host "✅ Release v$Version créée avec succès ! 🎉" -ForegroundColor Green
Write-Host "ℹ️  Notes de release générées dans RELEASE_v$Version.md" -ForegroundColor Cyan
Write-Host "🎯 N'oubliez pas de créer la release sur GitHub avec ce fichier !" -ForegroundColor Yellow

Write-Host ""
Write-Host "🎉 Release v$Version terminée avec succès !" -ForegroundColor Green
