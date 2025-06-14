# Utilisation du bot avec Tor pour accéder à un dépôt .onion

## Prérequis

- Tor Browser ou service Tor en arrière-plan (port SOCKS5 ouvert, généralement 9150 sur Windows, 9050 sur Linux)
- Dépendance : socks-proxy-agent

## Installation de la dépendance

```bash
npm install socks-proxy-agent
```

## Configuration

Ajoutez dans votre `.env` :

```
TOR_PROXY=socks5h://127.0.0.1:9150
```

## Exemple de configuration de repo dans `index.js`

```js
{
  name: 'Torzu',
  url: 'http://vub63vv26q6v27xzv2dtcd25xumubshogm67yrpaz2rculqxs7jlfqad.onion/torzu-emu/torzu/releases',
  type: 'forgejo',
  apiUrl: 'http://vub63vv26q6v27xzv2dtcd25xumubshogm67yrpaz2rculqxs7jlfqad.onion/api/v1/repos/torzu-emu/torzu/releases',
  useTor: true
}
```

## Fonctionnement

- Si `useTor: true` est présent dans le repo, le bot utilisera le proxy Tor pour toutes les requêtes HTTP/HTTPS sur ce dépôt.
- Le reste du fonctionnement du bot ne change pas.

---

**Astuce** : Pour tester la connectivité Tor, lancez :

```bash
curl --socks5-hostname 127.0.0.1:9150 http://vub63vv26q6v27xzv2dtcd25xumubshogm67yrpaz2rculqxs7jlfqad.onion/
```
