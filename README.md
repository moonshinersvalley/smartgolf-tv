# Smart Golf Party — app TV Hisense (VIDAA OS)

Adresse fixe de l'app : **https://moonshinersvalley.github.io/smartgolf-tv/**

Cette page lit l'adresse du serveur de jeu du moment (`tunnel.json`, mis à jour automatiquement à chaque démarrage du serveur) et y redirige la TV.

## Installer l'app sur la TV (une seule fois)

Il faut un ordinateur **connecté au même Wi-Fi que la TV**, avec [Node.js](https://nodejs.org) 18 ou plus.

1. Télécharge [`install-vidaa.js`](https://moonshinersvalley.github.io/smartgolf-tv/install-vidaa.js) (clic droit → Enregistrer sous).
2. Ouvre un terminal **en administrateur** dans le dossier du fichier, puis lance :
   ```
   node install-vidaa.js
   ```
   (Windows : autorise l'accès réseau si le pare-feu le demande.)
3. Sur la TV : **Paramètres → Réseau → Configuration réseau → DNS manuel** = l'adresse IP affichée par le terminal.
4. Ouvre le **navigateur de la TV** sur l'**adresse exacte affichée par le terminal** : `https://vidaahub.com`, ou `https://vidaahub.com:8443` si un autre logiciel (Apache, XAMPP, IIS…) occupe déjà le port 443. Accepte l'avertissement de certificat.
5. Appuie sur **« Installer l'app ⛳ »**.
6. Remets le **DNS de la TV en automatique**, puis **redémarre la TV**. Ferme le terminal (Ctrl+C).

L'app **Smart Golf Party** apparaît dans la liste des apps. La même page permet de la désinstaller.

## Bon à savoir

- La méthode utilise une fonction non documentée de VIDAA (`Hisense_installApp`), accessible uniquement depuis `vidaahub.com`. Certains firmwares récents peuvent la bloquer.
- Pendant l'installation, la TV utilise ton ordinateur comme DNS : à faire uniquement sur ton propre réseau. Toutes les autres adresses sont transmises normalement (1.1.1.1).
- Le certificat accepté ne sert qu'à cette page d'installation.
