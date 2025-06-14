const { getTorAgent } = require('./tor-proxy');
const axios = require('axios');

async function testTorConnectivity() {
    console.log('🧅 Test de connectivité Tor...');

    try {
        // Test de base - check.torproject.org
        const response = await axios.get('https://check.torproject.org/api/ip', {
            httpAgent: getTorAgent(),
            httpsAgent: getTorAgent(),
            timeout: 15000
        });

        console.log('✅ Connexion Tor réussie !');
        console.log('📍 IP via Tor:', response.data);

        // Test de l'URL .onion de Torzu
        console.log('\n🎮 Test de l\'URL .onion Torzu...');
        const torzuResponse = await axios.get(
            'http://vub63vv26q6v27xzv2dtcd25xumubshogm67yrpaz2rculqxs7jlfqad.onion/',
            {
                httpAgent: getTorAgent(),
                httpsAgent: getTorAgent(),
                timeout: 30000,
                headers: {
                    'User-Agent': 'Git-Release-Tracker'
                }
            }
        );

        console.log('✅ Site .onion Torzu accessible !');
        console.log('📏 Taille de la réponse:', torzuResponse.data.length, 'caractères');

        return true;
    } catch (error) {
        console.error('❌ Erreur de connexion Tor:', error.message);
        console.log('\n💡 Solutions possibles:');
        console.log('   1. Lancez Tor Browser');
        console.log('   2. Ou installez Tor service et démarrez-le');
        console.log('   3. Vérifiez que le port 9150 (ou 9050) est ouvert');
        console.log('   4. Changez TOR_PROXY dans .env si nécessaire');

        return false;
    }
}

if (require.main === module) {
    testTorConnectivity();
}

module.exports = { testTorConnectivity };
