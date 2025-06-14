const { detectTorPort, getTorAgent } = require('./tor-proxy');
const axios = require('axios');

async function diagnoseTor() {
    console.log('🔧 Diagnostic Tor pour Torzu\n');

    // Étape 1: Détecter le port Tor
    console.log('📡 Recherche du service Tor...');
    const torPort = await detectTorPort();

    if (!torPort) {
        console.log('\n❌ Aucun service Tor trouvé');
        console.log('💡 Solutions:');
        console.log('   1. Téléchargez et lancez Tor Browser: https://www.torproject.org/download/');
        console.log('   2. Ou installez Tor en tant que service');
        console.log('   3. Assurez-vous qu\'un des ports 9050, 9150, 9051, 9151 est ouvert');
        return false;
    }

    // Étape 2: Mettre à jour le .env si nécessaire
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env');

    if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (!envContent.includes('TOR_PROXY')) {
            envContent += `\n# Configuration Tor\nTOR_PROXY=socks5h://127.0.0.1:${torPort}\n`;
            fs.writeFileSync(envPath, envContent);
            console.log(`📝 Configuration Tor ajoutée au .env (port ${torPort})`);
        }
    }

    // Étape 3: Tester la connexion à Torzu
    console.log('\n🎮 Test de connexion à Torzu...');
    try {
        const agent = getTorAgent();
        const torzuUrl = 'http://vub63vv26q6v27xzv2dtcd25xumubshogm67yrpaz2rculqxs7jlfqad.onion/torzu-emu/torzu/releases';

        const response = await axios.get(torzuUrl, {
            httpAgent: agent,
            httpsAgent: agent,
            timeout: 20000,
            headers: {
                'User-Agent': 'Git-Release-Tracker'
            }
        });

        console.log(`✅ Connexion réussie à Torzu ! (Status: ${response.status})`);
        console.log(`📄 Taille: ${response.data.length} caractères`);

        // Essayer de parser pour voir si on trouve des releases
        const cheerio = require('cheerio');
        const $ = cheerio.load(response.data);
        const releaseLinks = $('a[href*="/releases/tag/"]');

        if (releaseLinks.length > 0) {
            console.log(`🎯 ${releaseLinks.length} releases trouvées !`);
            const firstRelease = releaseLinks.first();
            const tag = firstRelease.attr('href').split('/tag/')[1];
            console.log(`   Dernière release: ${tag}`);
        }

        return true;

    } catch (error) {
        console.log(`❌ Erreur de connexion à Torzu: ${error.message}`);
        console.log('💡 Vérifiez que Tor Browser est bien démarré');
        return false;
    }
}

if (require.main === module) {
    diagnoseTor().then(success => {
        if (success) {
            console.log('\n🎉 Tor est configuré correctement pour Torzu !');
            console.log('Vous pouvez maintenant lancer: node test.js');
        } else {
            console.log('\n⚠️ Configuration Tor incomplète');
        }
    }).catch(console.error);
}

module.exports = { diagnoseTor };
