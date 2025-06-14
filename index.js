const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('cron');
const fs = require('fs');
const path = require('path');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { getTorAgent, isTorAvailable } = require('./tor-proxy');
require('dotenv').config();

class GitReleaseTracker {
    constructor(testMode = false) {
        this.testMode = testMode; // Mode test pour éviter les notifications
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.DirectMessages
            ]
        }); this.repositories = [
            {
                name: 'Eden Emu',
                url: 'https://git.eden-emu.dev/eden-emu/eden/releases',
                type: 'forgejo', // Forgejo (fork de Gitea)
                apiUrl: 'https://git.eden-emu.dev/api/v1/repos/eden-emu/eden/releases'
            },
            {
                name: 'Citron Emu',
                url: 'https://git.citron-emu.org/citron/emu/-/releases',
                type: 'gitlab',
                apiUrl: 'https://git.citron-emu.org/api/v4/projects/citron%2Femu/releases'
            },
            {
                name: 'Sudachi',
                url: 'https://github.com/emuplace/sudachi.emuplace.app/releases',
                type: 'github'
            }, {
                name: 'Torzu',
                url: 'http://vub63vv26q6v27xzv2dtcd25xumubshogm67yrpaz2rculqxs7jlfqad.onion/torzu-emu/torzu/releases',
                type: 'forgejo',
                apiUrl: 'http://vub63vv26q6v27xzv2dtcd25xumubshogm67yrpaz2rculqxs7jlfqad.onion/api/v1/repos/torzu-emu/torzu/releases',
                useTor: true
            }
        ];

        this.dataFile = path.join(__dirname, 'last_releases.json');
        this.lastReleases = this.loadLastReleases();

        this.setupBot();
    }

    setupBot() {
        this.client.once('ready', () => {
            console.log(`✅ Bot connecté en tant que ${this.client.user.tag}`);
            this.startScheduler();
        }); this.client.on('error', console.error);
    }

    createHttpAgent(useTor = false) {
        if (useTor) {
            // Créer un agent SOCKS pour Tor (port par défaut 9050)
            const torProxy = process.env.TOR_PROXY || 'socks5://127.0.0.1:9050';
            return new SocksProxyAgent(torProxy);
        }
        return undefined; // Utiliser l'agent par défaut
    }

    loadLastReleases() {
        try {
            if (fs.existsSync(this.dataFile)) {
                return JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
            }
        } catch (error) {
            console.error('Erreur lors du chargement des dernières releases:', error);
        }
        return {};
    }

    saveLastReleases() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.lastReleases, null, 2));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        }
    } async checkGitHubReleases(repo) {
        try {
            const apiUrl = repo.url.replace('github.com', 'api.github.com/repos').replace('/releases', '/releases/latest');
            const headers = {
                'User-Agent': 'Git-Release-Tracker'
            };

            // Ajouter le token d'authentification si disponible
            if (process.env.GITHUB_TOKEN) {
                headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
            }

            const response = await axios.get(apiUrl, {
                headers,
                timeout: 10000
            });

            const release = response.data;
            return {
                name: release.name || release.tag_name,
                tag: release.tag_name,
                url: release.html_url,
                published_at: release.published_at,
                body: release.body
            };
        } catch (error) {
            console.error(`Erreur GitHub pour ${repo.name}:`, error.message);
            return null;
        }
    } async checkGitLabReleases(repo) {
        try {
            // Essayer d'abord l'API GitLab
            if (repo.apiUrl) {
                const headers = {
                    'User-Agent': 'Git-Release-Tracker',
                    'Accept': 'application/json'
                };

                // Ajouter le token d'authentification si disponible
                if (process.env.GITLAB_TOKEN) {
                    headers['Authorization'] = `Bearer ${process.env.GITLAB_TOKEN}`;
                }

                const response = await axios.get(repo.apiUrl, {
                    headers,
                    timeout: 10000
                });

                if (response.data && response.data.length > 0) {
                    const release = response.data[0]; // Premier élément = dernière release
                    return {
                        name: release.name,
                        tag: release.tag_name,
                        url: release._links.self,
                        published_at: release.released_at || release.created_at,
                        body: release.description
                    };
                }
            }
        } catch (apiError) {
            console.log(`API GitLab échouée pour ${repo.name}, tentative de scraping HTML...`);
        }

        // Fallback: scraping HTML
        try {
            const response = await axios.get(repo.url, {
                headers: {
                    'User-Agent': 'Git-Release-Tracker'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);

            // Sélecteurs mis à jour pour GitLab moderne
            const firstRelease = $('.releases-container .release, .release-entry, .release-item').first();

            if (firstRelease.length > 0) {
                const titleElement = firstRelease.find('.release-title a, .release-header a, h2 a').first();
                const title = titleElement.text().trim();
                const link = titleElement.attr('href');

                // Chercher le tag
                let tag = firstRelease.find('.release-tag .tag-name, .badge, .gl-badge').first().text().trim();
                if (!tag && link && link.includes('/tags/')) {
                    tag = link.split('/tags/')[1];
                }

                const fullUrl = link ? new URL(link, repo.url).href : repo.url;

                return {
                    name: title || tag,
                    tag: tag,
                    url: fullUrl,
                    published_at: new Date().toISOString()
                };
            }
        } catch (error) {
            console.error(`Erreur GitLab pour ${repo.name}:`, error.message);
        }
        return null;
    } async checkForgejoReleases(repo) {
        try {
            // Essayer d'abord l'API Forgejo/Gitea
            if (repo.apiUrl) {
                const axiosConfig = {
                    headers: {
                        'User-Agent': 'Git-Release-Tracker',
                        'Accept': 'application/json'
                    },
                    timeout: 10000
                };
                if (repo.useTor) {
                    axiosConfig.httpAgent = getTorAgent();
                    axiosConfig.httpsAgent = getTorAgent();
                }
                const response = await axios.get(repo.apiUrl, axiosConfig);

                if (response.data && response.data.length > 0) {
                    const release = response.data[0]; // Premier élément = dernière release
                    return {
                        name: release.name || release.tag_name,
                        tag: release.tag_name,
                        url: release.html_url || `${repo.url.replace('/releases', '')}/releases/tag/${release.tag_name}`,
                        published_at: release.published_at || release.created_at,
                        body: release.body
                    };
                }
            }
        } catch (apiError) {
            console.log(`API Forgejo échouée pour ${repo.name}, tentative de scraping HTML...`);
        }

        // Fallback: scraping HTML
        try {
            const axiosConfig = {
                headers: {
                    'User-Agent': 'Git-Release-Tracker'
                },
                timeout: 10000
            };
            if (repo.useTor) {
                axiosConfig.httpAgent = getTorAgent();
                axiosConfig.httpsAgent = getTorAgent();
            }
            const response = await axios.get(repo.url, axiosConfig);

            const $ = cheerio.load(response.data);

            // Sélecteurs pour Forgejo/Gitea
            const releaseItem = $('.release-list .release-item, .repository.releases .ui.divided.list .item').first();

            if (releaseItem.length > 0) {
                const titleElement = releaseItem.find('.release-list-title a, .header a').first();
                const title = titleElement.text().trim();
                const link = titleElement.attr('href');

                // Extraire le tag depuis le titre ou l'URL
                let tag = title;
                if (link && link.includes('/tag/')) {
                    tag = link.split('/tag/')[1];
                }

                const baseUrl = repo.url.replace('/releases', '');
                const fullUrl = link ? new URL(link, baseUrl).href : repo.url;

                console.log(`✅ ${repo.useTor ? '[TOR]' : ''} Scraping HTML réussi pour ${repo.name}`);
                return {
                    name: title || tag,
                    tag: tag,
                    url: fullUrl,
                    published_at: new Date().toISOString()
                };
            }
        } catch (error) {
            console.error(`❌ ${repo.useTor ? '[TOR]' : ''} Erreur Forgejo pour ${repo.name}:`, error.message);
        }
        return null;
    } async checkNotabugReleases(repo) {
        const maxRetries = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Tentative ${attempt}/${maxRetries} pour ${repo.name}`);

                const response = await axios.get(repo.url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Accept-Encoding': 'gzip, deflate',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1'
                    },
                    timeout: 15000,
                    maxRedirects: 5
                });

                const $ = cheerio.load(response.data);

                // NotaBug utilise une structure similaire à GitHub/GitLab - essayons plusieurs sélecteurs
                const releaseSelectors = [
                    '.release-list .release-item',
                    '.releases .release',
                    '.Box-row',
                    '.repository-releases .release-entry',
                    '.release-item',
                    '.release',
                    '[data-release]',
                    '.Box .Box-row'
                ];

                let firstRelease = null;
                for (const selector of releaseSelectors) {
                    firstRelease = $(selector).first();
                    if (firstRelease.length > 0) {
                        console.log(`✅ Trouvé release avec sélecteur: ${selector}`);
                        break;
                    }
                }

                // Si aucun sélecteur ne fonctionne, chercher directement les liens de tags
                if (!firstRelease || firstRelease.length === 0) {
                    const tagLinks = $('a[href*="/releases/tag/"]');
                    if (tagLinks.length > 0) {
                        const firstTagLink = tagLinks.first();
                        const href = firstTagLink.attr('href');
                        const text = firstTagLink.text().trim();

                        if (href && text) {
                            const tag = href.split('/tag/')[1].split('?')[0];
                            const baseUrl = repo.url.replace('/releases', '');
                            const fullUrl = new URL(href, baseUrl).href;

                            console.log(`✅ Trouvé via lien tag: ${tag}`);
                            return {
                                name: text || tag,
                                tag: tag,
                                url: fullUrl,
                                published_at: new Date().toISOString()
                            };
                        }
                    }
                } else {
                    // Traitement du release trouvé avec les sélecteurs
                    const titleSelectors = [
                        'a[href*="/releases/tag/"]',
                        '.release-header a',
                        '.release-title a',
                        'h3 a',
                        'h2 a',
                        '.Box-row-link'
                    ];

                    let titleElement = null;
                    for (const selector of titleSelectors) {
                        titleElement = firstRelease.find(selector).first();
                        if (titleElement.length > 0) break;
                    }

                    if (titleElement && titleElement.length > 0) {
                        const title = titleElement.text().trim();
                        const link = titleElement.attr('href');

                        if (link && link.includes('/tag/')) {
                            const tag = link.split('/tag/')[1].split('?')[0];
                            const baseUrl = repo.url.replace('/releases', '');
                            const fullUrl = new URL(link, baseUrl).href;

                            return {
                                name: title || tag,
                                tag: tag,
                                url: fullUrl,
                                published_at: new Date().toISOString()
                            };
                        }
                    }
                }

                console.log(`⚠️ Aucune release trouvée pour ${repo.name} (tentative ${attempt})`);

            } catch (error) {
                lastError = error;
                console.error(`❌ Erreur NotaBug tentative ${attempt} pour ${repo.name}:`, error.message);

                if (attempt < maxRetries) {
                    const delay = attempt * 2000; // Délai progressif: 2s, 4s, 6s
                    console.log(`⏳ Attente de ${delay}ms avant nouvelle tentative...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        console.error(`❌ Échec après ${maxRetries} tentatives pour ${repo.name}:`, lastError?.message);
        return null;
    } async checkReleases(repo) {
        switch (repo.type) {
            case 'github':
                return await this.checkGitHubReleases(repo);
            case 'gitlab':
                return await this.checkGitLabReleases(repo);
            case 'forgejo':
            case 'gitea':
                return await this.checkForgejoReleases(repo);
            case 'notabug':
                return await this.checkNotabugReleases(repo);
            default:
                console.error(`Type de dépôt non supporté: ${repo.type}`);
                return null;
        }
    }

    async sendNotification(repo, release) {
        try {
            const user = await this.client.users.fetch(process.env.TARGET_USER_ID);

            const embed = {
                color: 0x00ff00,
                title: `🎉 Nouvelle release détectée !`,
                fields: [
                    {
                        name: 'Projet',
                        value: repo.name,
                        inline: true
                    },
                    {
                        name: 'Version',
                        value: release.tag,
                        inline: true
                    },
                    {
                        name: 'Nom de la release',
                        value: release.name || 'Non spécifié',
                        inline: false
                    },
                    {
                        name: 'Lien',
                        value: `[Voir la release](${release.url})`,
                        inline: false
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Git Release Tracker'
                }
            };

            await user.send({ embeds: [embed] });
            console.log(`✅ Notification envoyée pour ${repo.name} - ${release.tag}`);
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification:', error);
        }
    } async checkAllRepositories() {
        console.log('🔍 Vérification des repositories...');

        for (const repo of this.repositories) {
            try {
                const release = await this.checkReleases(repo);

                if (release) {
                    const lastKnownRelease = this.lastReleases[repo.name];

                    if (!lastKnownRelease || lastKnownRelease.tag !== release.tag) {
                        console.log(`🆕 Nouvelle release trouvée pour ${repo.name}: ${release.tag}`);

                        if (!this.testMode) {
                            await this.sendNotification(repo, release);
                        } else {
                            console.log(`📧 [MODE TEST] Notification simulée pour ${repo.name}`);
                        }

                        this.lastReleases[repo.name] = release;
                    } else {
                        console.log(`✅ ${repo.name}: Pas de nouvelle release (dernière: ${release.tag})`);
                    }
                } else {
                    console.log(`❌ Impossible de récupérer les releases pour ${repo.name}`);
                }
            } catch (error) {
                console.error(`Erreur pour ${repo.name}:`, error);
            }

            // Attendre un peu entre chaque requête pour éviter le rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (!this.testMode) {
            this.saveLastReleases();
        }
        console.log('✅ Vérification terminée');
    }

    startScheduler() {
        const intervalMinutes = process.env.CHECK_INTERVAL_MINUTES || 30;
        console.log(`⏰ Scheduler démarré - vérification toutes les ${intervalMinutes} minutes`);

        // Vérification initiale
        this.checkAllRepositories();

        // Programmer les vérifications périodiques
        const job = new cron.CronJob(`*/${intervalMinutes} * * * *`, () => {
            this.checkAllRepositories();
        });

        job.start();
    }

    async start() {
        try {
            await this.client.login(process.env.DISCORD_TOKEN);
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
        }
    }
}

// Démarrage du bot
if (require.main === module) {
    if (!process.env.DISCORD_TOKEN || !process.env.TARGET_USER_ID) {
        console.error('❌ Veuillez configurer DISCORD_TOKEN et TARGET_USER_ID dans le fichier .env');
        process.exit(1);
    }

    const tracker = new GitReleaseTracker();
    tracker.start();
}

module.exports = GitReleaseTracker;
