# 🎯 Guide de Configuration et Tests

## ✅ Étape 1 : Vérifier que Tout Fonctionne

### Avant de faire quoi que ce soit

```bash
# 1. Ouvrir un terminal dans le dossier ged-serveur
cd ged-serveur

# 2. Vérifier que Node.js est installé
node --version
# Résultat attendu : v16.0.0 ou plus

# 3. Vérifier que les dépendances sont installées
npm list
# Résultat attendu : express, multer, cors, etc.

# 4. Si NPM manque des dépendances
npm install

# 5. Lancer le serveur
node server.js
```

**Vous devriez voir :**
```
╔══════════════════════════════════════════╗
║       GED Plaisance — Serveur v1.0       ║
╠══════════════════════════════════════════╣
║  ✅ Serveur démarré sur le port 3000      ║
║  🌐 URL locale : http://localhost:3000   ║
║                                          ║
║  Routes disponibles :                    ║
║   GET    /api/ping                       ║
│   ... [autres routes] ...                │
║   GET    /api/files/list         [NOUVEAU]║
╚══════════════════════════════════════════╝
```

---

## 🧪 Étape 2 : Tester les Endpoints

**Ouvrir un AUTRE terminal** (ne pas arrêter le serveur) et tester :

### Test 1 : Ping

```bash
curl http://localhost:3000/api/ping
```

**Résultat attendu :**
```json
{"ok":true,"message":"GED Serveur opérationnel","time":"2024-05-14T10:00:00.000Z"}
```

### Test 2 : Lister les fichiers (NOUVEAU)

```bash
curl http://localhost:3000/api/files/list
```

**Résultat attendu :**
```json
{
  "files": ["file_123", "photo.jpg", "document.pdf"],
  "count": 3,
  "timestamp": "2024-05-14T10:00:00.000Z"
}
```

Si aucun fichier : `"files": [], "count": 0`

### Test 3 : Charger l'arbre TREE

```bash
curl http://localhost:3000/api/tree
```

**Résultat attendu :**
```json
{
  "tree": {
    "id": "root",
    "name": "DOSSIER ARCHIVES",
    "children": [ ... ]
  }
}
```

---

## 🖥️ Étape 3 : Configurer le Frontend

### Modifier l'URL du serveur

Dans **ged-serveur/GED_Plaisance_v6.html**, ligne ~17 :

```javascript
const SERVER_URL = 'http://192.168.100.1:3000';
```

**Adapter selon votre situation :**

| Situation | URL |
|-----------|-----|
| Local (même ordinateur) | `http://localhost:3000` |
| Autre ordinateur sur le Wi-Fi | `http://192.168.1.42:3000` (IP locale) |
| Production cloud (ex: Render) | `https://ged-plaisance.onrender.com` |

**Comment trouver votre IP locale :**

**Windows :**
```bash
ipconfig
```
Cherchez "Adresse IPv4" (ex: `192.168.1.42`)

**Mac / Linux :**
```bash
ifconfig
```

---

## 📱 Étape 4 : Tester depuis Navigateur

### Ouvrir l'application

1. Allez dans le navigateur
2. Ouvrez le fichier HTML :
   - `file:///C:/Users/SONIA/Desktop/PLAISANCE DOC/PERSONNEL/MON PROJET/GED PLAISANCE/ged-serveur/GED_Plaisance_v6.html`
   - OU servez-le via Node.js (voir plus bas)

### Vérifier la Console (F12)

Appuyez sur **F12** → Onglet **Console** et cherchez :

```
✅ Serveur démarré sur le port 3000
Lancement du pré-cache...
📥 Démarrage pré-cache des fichiers...
✓ 12 fichiers pré-cachés...
✅ Pré-cache terminé : 42 cachés, 0 déjà en cache, 0 erreurs
```

---

## 📤 Étape 5 : Tester le Upload de Fichier

### Dans l'application GED

1. Cliquez sur "Ajouter fichier"
2. Sélectionnez un fichier
3. Vérifiez la console (F12 → Console) :

```
☁ Fichier uploadé : http://localhost:3000/api/files/file_xyz
💾 Arbre sauvegardé dans db.json
```

### Vérifier sur le serveur

Terminal du serveur :
```
📤 Fichier reçu : photo.jpg → uploads/file_xyz (2048000 octets)
💾 Arbre sauvegardé dans db.json
```

---

## 🔄 Étape 6 : Tester la Synchronisation Multi-Navigateur

### Scénario A : Deux navigateurs sur le même ordinateur

```
1. Ouvrir Chrome + Firefox
2. Les deux sur http://localhost:3000/GED_Plaisance_v6.html

3. Dans Chrome :
   - Ajouter un fichier
   - Attendre 2s
   - Vérifier la console : "pré-cache" commence
   
4. Dans Firefox :
   - Rafraîchir la page
   - Vérifier que le fichier apparaît
   - Console : "pré-cache" télécharge le fichier
   
5. Fermer le serveur (Ctrl+C)
6. Dans Firefox : actualiser
   - Le fichier devrait TOUJOURS être disponible (depuis IndexedDB) ✅
```

### Scénario B : Deux ordinateurs sur le même Wi-Fi

**Ordinateur 1 (Serveur):**
```bash
cd ged-serveur
node server.js
# Note l'IP : 192.168.1.42 (exemple)
```

**Ordinateur 2 (Client):**
1. Modifier l'URL du serveur : `http://192.168.1.42:3000`
2. Ouvrir le HTML
3. Tester comme Scénario A

---

## 🌐 Étape 7 : Serving via Express

Actuellement, vous ouvrez le HTML directement (file://). Pour une meilleure expérience, servez-le via Express :

### Modifier server.js

Ajouter cette ligne AVANT les routes API :

```javascript
// Serve les fichiers statiques (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..')));
```

### Recharger le serveur

```bash
node server.js
```

### Accéder via navigateur

```
http://localhost:3000/ged-serveur/GED_Plaisance_v6.html
```

---

## 📊 Étape 8 : Vérifier IndexedDB

### Ouvrir DevTools

1. Appuyez sur **F12**
2. Onglet **Application** (ou **Storage** dans Firefox)
3. **IndexedDB** → **gédplaisance**
4. Vous devriez voir :

```
Object Store: "ged-files"
├─ file_123 : Blob (2.5 MB)
├─ photo.jpg : Blob (1.2 MB)
├─ document.pdf : Blob (500 KB)
...
```

### Taille Totale

```javascript
// Dans la console :
idbSize().then(s => console.log('Total :', (s / 1024 / 1024).toFixed(1) + ' MB'));
```

---

## ⚙️ Étape 9 : Configuration Avancée

### Limiter la Taille du Pré-cache

Si vous ne voulez cacher que les fichiers récents :

**Dans GED_Plaisance_v6.html, fonction `preCacheServerFiles()` :**

```javascript
async function preCacheServerFiles() {
  const serverFiles = await getServerFilesList();
  
  // Limiter à 100 fichiers max
  const MAX_FILES = 100;
  if (serverFiles.length > MAX_FILES) {
    toast(`⚠ ${serverFiles.length} fichiers — cachage des ${MAX_FILES} plus récents`, 'warn');
    serverFiles.length = MAX_FILES;
  }
  
  // ... reste du code ...
}
```

### Ignorer les Gros Fichiers

```javascript
// Sauter les fichiers > 50 MB
for (const fileId of serverFiles) {
  const headers = await fetch(`${SERVER_URL}/api/files/${fileId}`, { method: 'HEAD' });
  const size = headers.headers.get('content-length');
  
  if (size > 50 * 1024 * 1024) {
    console.log(`⏭ ${fileId} trop volumineux (${size}), ignoré`);
    continue;
  }
  
  // ... télécharger ...
}
```

---

## 🚀 Étape 10 : Déploiement Cloud

### Option A : Render.com (Recommandé pour débuter)

1. Allez sur https://render.com
2. Sign up gratuit
3. Créez un "Web Service"
4. Connectez votre dépôt GitHub (ou uploadez le ZIP)
5. Configuration :
   - **Build Command** : `npm install`
   - **Start Command** : `node server.js`
   - **Environment** : Production
6. Cliquez "Create Web Service"
7. Attendez ~2 min
8. Copiez l'URL : `https://ged-plaisance-xyz.onrender.com`
9. Mettez à jour `SERVER_URL` dans le HTML

### Option B : Railway (Très facile)

1. Allez sur https://railway.app
2. GitHub login
3. "Deploy from GitHub"
4. Sélectionnez le repo
5. Railway détecte automatiquement Node.js
6. Cliquez "Deploy"
7. Copiez l'URL générée

### Option C : Fly.io (Pour Production)

1. `curl -L https://fly.io/install.sh | sh`
2. `fly auth login`
3. `cd ged-serveur && fly launch`
4. `fly deploy`

---

## 📋 Checklist Final

- [ ] Serveur lancé : `node server.js`
- [ ] Route `/api/files/list` répond
- [ ] HTML modifié avec `SERVER_URL` correcte
- [ ] Fonction `preCacheServerFiles()` existe dans le HTML
- [ ] Fichiers uploadés → apparaissent dans `ged-serveur/uploads/`
- [ ] Navigateur 1 + 2 : synchronisation fonctionne
- [ ] IndexedDB se remplit après 2s
- [ ] Serveur arrêté : fichiers toujours accessibles
- [ ] Console sans erreurs (F12)
- [ ] Production : URL cloud configurée

---

## 🎯 Résultat Attendu

```
✅ Mon application GED fonctionne en local
✅ Les données sont synchronisées entre navigateurs
✅ Les fichiers sont mis en cache dans IndexedDB
✅ Je peux accéder offline après la première visite
✅ Je peux déployer en production sur le cloud
```

---

## 🆘 Support Rapide

### Erreur courante : "CORS error"

```javascript
// MAUVAIS
const SERVER_URL = 'http://localhost:3001'; // Port incorrect

// BON
const SERVER_URL = 'http://localhost:3000'; // Port du serveur
```

### Erreur : "Cannot read property 'transaction' of undefined"

IndexedDB n'est pas encore initialisé. Attendre que `initDB()` soit terminé.

### Erreur : "Failed to fetch"

Vérifier :
1. Serveur lancé ?
2. URL correcte ?
3. Firewall bloque le port 3000 ?
4. Pas de typo dans `SERVER_URL` ?

---

**🎉 Vous êtes prêt à déployer votre GED distribuée !**

