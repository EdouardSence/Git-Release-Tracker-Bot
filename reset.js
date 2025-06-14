const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'last_releases.json');

function resetStorage() {
    console.log('🔄 Réinitialisation du stockage des releases...');

    if (fs.existsSync(dataFile)) {
        // Faire une sauvegarde
        const backupFile = path.join(__dirname, `last_releases_backup_${Date.now()}.json`);
        fs.copyFileSync(dataFile, backupFile);
        console.log(`📦 Sauvegarde créée: ${backupFile}`);

        // Supprimer le fichier actuel
        fs.unlinkSync(dataFile);
        console.log('🗑️ Fichier de stockage supprimé');
    } else {
        console.log('ℹ️ Aucun fichier de stockage à supprimer');
    }

    console.log('✅ Réinitialisation terminée');
    console.log('💡 Au prochain lancement, toutes les releases seront considérées comme nouvelles');
}

if (require.main === module) {
    resetStorage();
}

module.exports = { resetStorage };
