const GitReleaseTracker = require('./index');

async function testRepositories() {
    console.log('🧪 Test des repositories...\n');

    // Créer le tracker en mode test pour éviter les notifications et modifications du fichier de stockage
    const tracker = new GitReleaseTracker(true);

    // Test de chaque repository individuellement
    for (const repo of tracker.repositories) {
        console.log(`📍 Test de ${repo.name} (${repo.type})...`);
        try {
            const release = await tracker.checkReleases(repo);
            if (release) {
                console.log(`✅ Succès: ${release.name || release.tag}`);
                console.log(`   Tag: ${release.tag}`);
                console.log(`   URL: ${release.url}`);

                // Vérifier si c'est une nouvelle release
                const lastKnown = tracker.lastReleases[repo.name];
                if (lastKnown && lastKnown.tag === release.tag) {
                    console.log(`   📝 Déjà connue (pas de notification nécessaire)`);
                } else {
                    console.log(`   🆕 Nouvelle release détectée !`);
                }
                console.log('');
            } else {
                console.log(`❌ Aucune release trouvée\n`);
            }
        } catch (error) {
            console.error(`❌ Erreur: ${error.message}\n`);
        }

        // Attendre entre chaque test
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('🏁 Test terminé');

    // Afficher un résumé des releases stockées
    console.log('\n📊 Résumé des dernières releases connues:');
    for (const [name, release] of Object.entries(tracker.lastReleases)) {
        console.log(`   ${name}: ${release.tag} (${release.name})`);
    }
}

if (require.main === module) {
    testRepositories().catch(console.error);
}
