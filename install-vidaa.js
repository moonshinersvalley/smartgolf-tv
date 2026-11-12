#!/usr/bin/env node
// ==========================================================
// INSTALLATEUR « SMART GOLF PARTY » POUR TV HISENSE VIDAA OS
// À lancer UNE fois sur un ordinateur du même Wi-Fi que la TV (droits administrateur requis : ports 53 et 443).
//   node install-vidaa.js
// Principe : VIDAA n'autorise l'ajout d'une app web que depuis vidaahub.com. Ce script fait le temps de
// l'installation office de serveur DNS pour la TV : vidaahub.com pointe vers cet ordinateur, qui sert une
// page avec un bouton « Installer ». Toutes les autres adresses sont transmises normalement (1.1.1.1).
// Aucune dépendance : Node.js 18+ suffit.
// ==========================================================
const dgram = require('dgram');
const https = require('https');
const http = require('http');
const os = require('os');

const APP = {
  id: 'smartgolfparty',             // identifiant dans le registre des apps (et 'smartgolfpartydebug' pour l'ancienne méthode)
  name: 'Smart Golf Party',
  url: process.argv[2] || 'https://moonshinersvalley.github.io/smartgolf-tv/',
  icon: (process.argv[2] || 'https://moonshinersvalley.github.io/smartgolf-tv/').replace(/\/?$/, '/') + 'icon.png'
};
const SPOOFED = ['vidaahub.com', 'www.vidaahub.com'];
const UPSTREAM_DNS = '1.1.1.1';

// Certificat auto-signé pour vidaahub.com : ne sert que sur ton réseau, pendant l'installation
const CERT = `-----BEGIN CERTIFICATE-----
MIIDOjCCAiKgAwIBAgIUMRsUfdKVM4/NHkNyNpQLOBBWvK4wDQYJKoZIhvcNAQEL
BQAwFzEVMBMGA1UEAwwMdmlkYWFodWIuY29tMB4XDTI2MTExMjAwMTcyMFoXDTM2
MTEwOTAwMTcyMFowFzEVMBMGA1UEAwwMdmlkYWFodWIuY29tMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEA++2ZNg+GoMSAdOCE0Wk7izyuYSg8HcgbY6ld
5cIAS8rpeCNJADRNRdj0pmI/I25fSzVOQX8vwjtxj6zW1YmJyIouXDkNM2i0HgNU
lzBUMAMMv91KbDqdyF7CraZqJWt6rNwamieIwyMcjU9/oBLXS8asJhNfJCG/7MMQ
N7e7c0jqOJdF0878OypyQamcRfZV9LV2hSyCh+xB/qQM/HviUTo5YzilHQpNJUTa
pkLOG3Z7hBFFgxnZ6q7pboWIRJLUc9KGOvGygjAtu6Znt7U3AySllLW9GqxUnJhm
t/c5/pDVmw6sJUPrK4sB2TvqJvTByQh+RbDbVraw5i4A/DH3DQIDAQABo34wfDAd
BgNVHQ4EFgQUIif8f61xSJUOpfO6J4I+GZVBstAwHwYDVR0jBBgwFoAUIif8f61x
SJUOpfO6J4I+GZVBstAwDwYDVR0TAQH/BAUwAwEB/zApBgNVHREEIjAgggx2aWRh
YWh1Yi5jb22CEHd3dy52aWRhYWh1Yi5jb20wDQYJKoZIhvcNAQELBQADggEBAO1j
cQbNSCE27G7EK7/gaiSGnRrzjty9uxTysyu6kJWVebO4gcAjfWE3XJTwwKw18uT1
dSpCM+fpiTFZ9dICsZh0EJoGPEihWlk6oDy+j7YGXgcTblEP12EH/wYPBaeNl/+p
Bhki+XMU6NSUtPEDwUj8RNnRs2JxH12hxN4X+Oh7w4f3ltABFM4cb7MTfwCpGHQK
f3LOJF0zhNFENdqcdarfawXpZPCQ8OdQCafK5kd1qRqbckW//kKMfO42xw0eGBvf
hOrrQqzHukFPTUWvBx3HAUAatQbZ7BI3Jl7vDrYVX2y0APO/bEE0hOwOrsASwnas
1R59uvmqh2GP4WYRPjc=
-----END CERTIFICATE-----`;
const KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD77Zk2D4agxIB0
4ITRaTuLPK5hKDwdyBtjqV3lwgBLyul4I0kANE1F2PSmYj8jbl9LNU5Bfy/CO3GP
rNbViYnIii5cOQ0zaLQeA1SXMFQwAwy/3UpsOp3IXsKtpmola3qs3BqaJ4jDIxyN
T3+gEtdLxqwmE18kIb/swxA3t7tzSOo4l0XTzvw7KnJBqZxF9lX0tXaFLIKH7EH+
pAz8e+JROjljOKUdCk0lRNqmQs4bdnuEEUWDGdnqruluhYhEktRz0oY68bKCMC27
pme3tTcDJKWUtb0arFScmGa39zn+kNWbDqwlQ+sriwHZO+om9MHJCH5FsNtWtrDm
LgD8MfcNAgMBAAECggEAGnZmtYsD9Tcu1xgOW4DWRFXna0Uyq14tolZUCqJKLavu
wjPSozbbNw8HA8MmJq6dS+UZhz+44Iol75WUK3H7CxmYrQ9BF7lT0iM/a3IkJbbs
S+sOujeeA0IQ6PSmCbA0fpvQH4kvkG/Lu/wxx7qy6r6/rnAyejUhV9lVhsTB5+X3
ekmuH93zYkpyTIiPnAx27gL2hlq9k0M9qC1XhiB9x3H9YZ/S5agbu2rhDNufuh6M
LeppOAWb9D007WZudEe1U08P/14UFdqdG1MbeiKv2ChqARNeUtJ+xFCmDqKLG7UG
CSL9VxItTpMp/Nq7xUf610B6yikZ9lXrdrV7VEnS8QKBgQD+fh/vhoNVlDzkY0Cy
thxSfK+x9TOAKExgxsB2YbORVwWPaU1l9lj9O54HnFOdXefsetiQ+FydV9fxDVqN
29U0YR/Lxb64Gp3Y7xr2s82ofbjIUw4kAl9MauYFCd9nxnTqkq8bb/aLz2TIMqM7
pv/WqEb6ePLXp46TepLVR5PlkwKBgQD9a5XQ0KO9QNEe8E1jXbhI/fn/HwYaGWJD
REXGX5RBzqFeuQTP+rMLp1xIabRpf5eMCzUq22faxo/S8jlDfmC+wJLF0j1pOfQZ
YBjyrf6wLoqTRZ6yAOqmEBnS5+9L0EaxiNsVw3OWXqka29KFvdimuy83io1eS1lu
6ZAWXkyU3wKBgBDUamw+qwTHztcTsT2gSXMzB7NvEb7R62si+atafrOH27hGMHYj
unLUtHiwX98yTJoY7aV4pzdIjeFFDs3+0bSrD508MIagS/wCo/fYoCsaVVP6Gh9L
gN3e2+NNadbFCwpQNQBNgTJxvqp2ntDdFGIvsrHxua2FSSp7mqY8G429AoGBAMyl
4OosUs42VaoibJxdxsBLOWOo7giNjyi7LY2xCczKzM3to9FApu42TPO9SRAZFYzm
UB036Xpm9yZmrY+vsvjYEq7lxOoA/vqu+/aeRBqKuyWLB0jALL3GKtSCsGAM5cng
tuuwVtuLvgwOkMeoNBkQ+GRl4xvOxX4n50/o/vcJAoGBAOaFi8DqTj/ofrgz8Hlx
46mx1uKdFOqkz7bpLDWTU/dahh3iZJD4bSl3RdaaHJwh7sCbQIJ+wZP/926MNabT
6G6NTS9u1SQe5Lq2rWP7sJR3YofBChWN2Nq4e1G+1RzlOGepUV3TQuugZ7LGeNYK
5sqEsd93fUSDWilJzJit9o3Q
-----END PRIVATE KEY-----`;

function lanIp() {
  const candidates = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    for (const n of list) {
      if (n.family !== 'IPv4' || n.internal) continue;
      const virtual = /vEthernet|VirtualBox|VMware|WSL|Hyper-V|docker|tailscale|zerotier|tun|tap/i.test(name);
      candidates.push({ ip: n.address, score: (virtual ? 0 : 2) + (/^192\.168\./.test(n.address) ? 2 : /^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(n.address) ? 1 : 0) });
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.ip;
}

// --- DNS : réponse locale pour vidaahub.com, relais vers 1.1.1.1 pour tout le reste ---
function startDns(ip) {
  const sock = dgram.createSocket('udp4');
  const pending = new Map();
  const upstream = dgram.createSocket('udp4');
  upstream.on('message', (msg) => {
    const id = msg.readUInt16BE(0);
    const p = pending.get(id);
    if (p) { pending.delete(id); sock.send(msg, p.port, p.address); }
  });
  sock.on('message', (msg, rinfo) => {
    try {
      // lecture du nom demandé (section question)
      let o = 12, labels = [];
      while (msg[o]) { labels.push(msg.toString('ascii', o + 1, o + 1 + msg[o])); o += msg[o] + 1; }
      const name = labels.join('.').toLowerCase();
      const qtype = msg.readUInt16BE(o + 1);
      if (SPOOFED.includes(name)) {
        const question = msg.subarray(12, o + 5);
        const header = Buffer.from(msg.subarray(0, 12));
        header.writeUInt16BE(0x8180, 2);               // réponse, récursion disponible, pas d'erreur
        header.writeUInt16BE(1, 4);                    // 1 question
        header.writeUInt16BE(qtype === 1 ? 1 : 0, 6);  // 1 réponse (A) ou 0 (AAAA…)
        header.writeUInt32BE(0, 8);
        const parts = [header, question];
        if (qtype === 1) parts.push(Buffer.from([0xc0, 0x0c, 0, 1, 0, 1, 0, 0, 0, 60, 0, 4, ...ip.split('.').map(Number)]));
        sock.send(Buffer.concat(parts), rinfo.port, rinfo.address);
        if (qtype === 1) console.log(`  ↪ la TV (${rinfo.address}) demande ${name} → ${ip}`);
        return;
      }
      pending.set(msg.readUInt16BE(0), rinfo);
      upstream.send(msg, 53, UPSTREAM_DNS);
    } catch (_) { /* paquet illisible : ignoré */ }
  });
  sock.on('error', (e) => { console.error(`❌ DNS (port 53) : ${e.message}\n   Lance le terminal en administrateur, et ferme tout autre serveur DNS.`); process.exit(1); });
  sock.bind(Number(process.env.DNS_PORT) || 53);
}

// --- Page d'installation servie en HTTPS sur vidaahub.com ---
// Page d'installation. Méthode inspirée des installateurs communautaires qui marchent sur les firmwares récents
// (github.com/NoobyGains/stremio-vidaa-tv, technique du registre documentée par github.com/weinzii/vidaa-edge) :
// 1) entrée ajoutée au registre des apps (websdk/Appinfo.json), lu d'abord et jamais réécrit à l'aveugle ;
// 2) en secours, l'ancien Hisense_installApp ; 3) message de rafraîchissement au menu de la TV.
const page = () => `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Installer Smart Golf Party</title>
<style>body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;background:#1f3a24;color:#fbf6e9;font-family:system-ui,sans-serif;text-align:center}
img{width:170px;height:170px;border-radius:38px}.row{display:flex;gap:16px}button{font-size:1.6rem;padding:14px 32px;border:none;border-radius:16px;background:#f4c430;color:#1f3a24;font-weight:800}
button.alt{background:#e9e2cf;font-size:1.2rem}button:focus{outline:6px solid #fbf6e9;outline-offset:5px}#out{font-size:1.4rem;min-height:2em;max-width:85vw}
#diag{font:0.95rem monospace;opacity:.75;max-width:85vw;white-space:pre-wrap;text-align:left}</style></head>
<body><img src="${APP.icon}" alt=""><h1 style="margin:0">Smart Golf Party</h1>
<div class="row"><button id="install" autofocus>Installer l'app ⛳</button><button id="verify" class="alt">Vérifier</button><button id="remove" class="alt">Désinstaller</button></div>
<div id="out"></div><div id="diag"></div>
<script>
var ID = ${JSON.stringify(APP.id)}, LEGACY_IDS = ['SmartGolfParty_debug'], NAME = ${JSON.stringify(APP.name)};
var URL_APP = ${JSON.stringify(APP.url)}, ICON = ${JSON.stringify(APP.icon)}, PATH = 'websdk/Appinfo.json', MODE = 6;
var out = document.getElementById('out'), diag = document.getElementById('diag');
function say(t) { out.textContent = t; }
function has(f) { return typeof window[f] === 'function'; }
function info() {
  var d = [];
  ['HiUtils_createRequest', 'Hisense_installApp', 'Hisense_uninstallApp', 'Hisense_AddInsecureDomain'].forEach(function (f) { d.push(f + ' : ' + (has(f) ? 'oui' : 'non')); });
  d.push('omi_platform : ' + (window.omi_platform || window.opera_omi ? 'oui' : 'non'));
  try { if (has('Hisense_GetModelName')) d.push('modèle : ' + Hisense_GetModelName()); } catch (e) {}
  try { if (has('Hisense_GetFirmWareVersion')) d.push('firmware : ' + Hisense_GetFirmWareVersion()); } catch (e) {}
  diag.textContent = d.join('\\n');
}
// autorise le domaine de l'app (facultatif selon les firmwares)
try { if (has('Hisense_AddInsecureDomain')) Hisense_AddInsecureDomain(new URL(URL_APP).hostname); } catch (e) {}
info();

function readReg() {
  if (!has('HiUtils_createRequest')) return null;
  try {
    var res = HiUtils_createRequest('fileRead', { path: PATH, mode: MODE });
    if (!res || !res.ret) return null;
    var p = JSON.parse(res.msg);
    return p && Array.isArray(p.AppInfo) ? p : null;
  } catch (e) { return null; }
}
function writeReg(apps) {
  var res = HiUtils_createRequest('fileWrite', { path: PATH, mode: MODE, writedata: JSON.stringify(apps) });
  return !!(res && res.ret);
}
function find(apps, id) { for (var i = 0; apps && i < apps.AppInfo.length; i++) if (apps.AppInfo[i] && apps.AppInfo[i].Id === id) return i; return -1; }
function refreshLauncher() {
  var msg = JSON.stringify({ type: 'APPMessage', MsgType: 'appControl', action: 'updateAppState', source: 'browser', startAppType: 0x2,
    param: { event: 'AllAppsUpdate', SubModuleName: 'AllApps', startFrom: '', appInfo: ID } });
  try {
    if (window.omi_platform && typeof omi_platform.sendPlatformMessage === 'function') { omi_platform.sendPlatformMessage(msg); return true; }
    if (window.opera_omi && typeof opera_omi.sendPlatformMessage === 'function') { opera_omi.sendPlatformMessage(msg); return true; }
  } catch (e) {}
  return false;
}

function installRegistry() {
  var apps = readReg();
  if (!apps) return false; // registre illisible : on n'écrit JAMAIS à l'aveugle (ça effacerait toutes les apps)
  var entry = { Id: ID, AppName: NAME, Title: NAME, URL: URL_APP, StartCommand: URL_APP, IconURL: ICON, Icon_96: ICON, Image: ICON, Thumb: ICON,
    Type: 'Browser', InstallTime: new Date().toISOString().split('T')[0], RunTimes: 0, StoreType: 'custom', PreInstall: false };
  var i = find(apps, ID);
  if (i >= 0) apps.AppInfo[i] = entry; else apps.AppInfo.push(entry);
  return writeReg(apps) && find(readReg(), ID) >= 0; // relu pour vérifier qu'elle est bien enregistrée
}

document.getElementById('install').onclick = function () {
  say('Installation…');
  if (installRegistry()) {
    var r = refreshLauncher();
    say('✅ App enregistrée dans la liste des apps de la TV' + (r ? ' (menu rafraîchi)' : '') + '. Remets le DNS en automatique puis débranche la TV 10 s.');
    return;
  }
  if (!has('Hisense_installApp')) { say('❌ Aucune méthode d\\u2019installation disponible sur ce firmware.'); return; }
  try {
    Hisense_installApp(ID + 'debug', NAME, ICON, ICON, ICON, URL_APP, 'store', function (status) {
      var ok = !status;
      var r = ok && refreshLauncher();
      say(ok ? '✅ App installée (méthode classique)' + (r ? ', menu rafraîchi' : '') + '. Remets le DNS en automatique puis débranche la TV 10 s.'
             : '❌ Échec (code ' + status + '). Ton firmware bloque peut-être l\\u2019installation.');
    });
  } catch (e) { say('❌ ' + e.message); }
};

document.getElementById('verify').onclick = function () {
  var apps = readReg();
  if (!apps) { say(has('HiUtils_createRequest') ? '⚠️ Registre des apps illisible.' : '⚠️ Vérification impossible sur ce firmware (méthode classique uniquement).'); return; }
  var i = find(apps, ID);
  say(i >= 0 ? '✅ Smart Golf Party est bien enregistrée (' + apps.AppInfo.length + ' apps dans la liste). Redémarre la TV (débranche 10 s) pour la voir.'
             : '❌ Smart Golf Party n\\u2019est pas dans la liste des apps (' + apps.AppInfo.length + ' apps).');
};

document.getElementById('remove').onclick = function () {
  var done = false, apps = readReg();
  if (apps) {
    var changed = false;
    [ID].concat(LEGACY_IDS).forEach(function (id) { var i = find(apps, id); if (i >= 0) { apps.AppInfo.splice(i, 1); changed = true; } });
    if (changed && writeReg(apps)) done = true;
  }
  if (has('Hisense_uninstallApp')) [ID + 'debug'].concat(LEGACY_IDS).forEach(function (id) { try { Hisense_uninstallApp(id, function () {}); } catch (e) {} });
  refreshLauncher();
  say(done ? '✅ App retirée de la liste.' : 'Désinstallation demandée.');
};
</script></body></html>`;

// Adresse à taper sur la TV : https://vidaahub.com, ou https://vidaahub.com:8443 si le port 443 est déjà pris
// (Apache/XAMPP/IIS…). VIDAA vérifie le nom de domaine, pas le port.
let tvAddress = 'https://vidaahub.com';

function startWeb() {
  return new Promise((resolve) => {
    const handler = (req, res) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(page()); };
    const ports = process.env.HTTPS_PORT ? [Number(process.env.HTTPS_PORT)] : [443, 8443, 9443];
    const tryPort = (i) => {
      https.createServer({ cert: CERT, key: KEY }, handler)
        .once('listening', () => {
          if (ports[i] !== 443) {
            tvAddress = `https://vidaahub.com:${ports[i]}`;
            console.log(`\n⚠️  Le port 443 est pris par un autre logiciel (Apache, XAMPP, IIS…) : la page est servie sur le port ${ports[i]}.`);
          }
          resolve();
        })
        .once('error', (e) => {
          if (i + 1 < ports.length) return tryPort(i + 1);
          console.error(`❌ HTTPS : ${e.message}\n   Lance le terminal en administrateur, ou arrête le logiciel qui occupe les ports 443/8443.`);
          process.exit(1);
        })
        .listen(ports[i]);
    };
    tryPort(0);
    // port 80 facultatif : redirige vers la page (sinon un autre logiciel y répond « Index of / »)
    http.createServer((req, res) => { res.writeHead(302, { Location: tvAddress + '/' }); res.end(); })
      .on('error', () => {})
      .listen(Number(process.env.HTTP_PORT) || 80);
  });
}

if (!APP.url.startsWith('https://')) {
  console.error('Usage : node install-vidaa.js https://<ton-pseudo>.github.io/smartgolf-tv/');
  process.exit(1);
}
const ip = lanIp();
if (!ip) { console.error('❌ Aucune adresse réseau locale trouvée. Connecte cet ordinateur au même Wi-Fi que la TV.'); process.exit(1); }
startDns(ip);
startWeb().then(() => console.log(`
⛳ Installateur Smart Golf Party prêt (app → ${APP.url})

  1. Sur la TV : Paramètres → Réseau → Configuration réseau → DNS manuel : ${ip}
  2. Ouvre le navigateur de la TV à l'adresse EXACTE :  ${tvAddress}
     (accepte l'avertissement de certificat : il ne concerne que cette page d'installation)
  3. Appuie sur « Installer l'app ⛳ »
  4. Remets le DNS de la TV en automatique, puis redémarre la TV
  5. Ferme cette fenêtre (Ctrl+C)

En attente de la TV…`));
