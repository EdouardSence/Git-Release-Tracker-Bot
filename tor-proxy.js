// Utilitaire pour créer un agent HTTP(S) compatible Tor
const { SocksProxyAgent } = require('socks-proxy-agent');

function getTorAgent() {
    // Par défaut, Tor écoute sur 9050 (Linux) ou 9150 (Windows/Tor Browser)
    // Utiliser la variable d'environnement si définie, sinon port 9050 détecté
    const proxy = process.env.TOR_PROXY || 'socks5h://127.0.0.1:9050';
    return new SocksProxyAgent(proxy);
}

// Fonction pour vérifier si Tor est disponible
async function isTorAvailable() {
    try {
        const axios = require('axios');
        await axios.get('http://httpbin.org/ip', {
            httpAgent: getTorAgent(),
            httpsAgent: getTorAgent(),
            timeout: 5000
        });
        return true;
    } catch (error) {
        return false;
    }
}

// Fonction pour détecter automatiquement le port Tor
async function detectTorPort() {
    const commonPorts = [9150, 9050, 9051, 9151];
    const axios = require('axios');

    for (const port of commonPorts) {
        try {
            console.log(`🔍 Test du port Tor ${port}...`);
            const proxy = `socks5h://127.0.0.1:${port}`;
            const agent = new SocksProxyAgent(proxy);

            // Test simple de connexion
            await axios.get('http://httpbin.org/ip', {
                httpAgent: agent,
                httpsAgent: agent,
                timeout: 5000
            });

            console.log(`✅ Tor trouvé sur le port ${port}`);
            return port;

        } catch (error) {
            console.log(`❌ Port ${port}: ${error.code || 'non disponible'}`);
        }
    }

    return null;
}

module.exports = { getTorAgent, isTorAvailable, detectTorPort };
