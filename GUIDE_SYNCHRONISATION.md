# 📚 Guide : Synchronisation de GED Plaisance — Du Local au Cloud

## 🎯 Votre Situation Actuelle

Vous avez une application GED qui :
- ✅ Fonctionne **en local** avec IndexedDB (très rapide)
- ✅ Dispose d'un **serveur Node.js/Express** (port 3000)
- ❌ **Mais** : les données ne sont pas synchronisées entre navigateurs/sessions

**Problème** : IndexedDB est *local uniquement* — chaque navigateur/session a ses propres données.

---

## 🔍 Options pour un Backend — Comparatif

### 1️⃣ **Node.js + Express + JSON/SQLite** ← ✅ VOTRE CHOIX ACTUEL

**Vous l'utilisez déjà !**

| Aspect | Détail |
|--------|--------|
| **Facilité** | ⭐⭐⭐⭐ Très simple pour débuter |
| **Coût** | Gratuit (hébergement gratuit possible : Render, Railway, Fly.io) |
| **Performance** | Excellente pour PME |
| **Données** | JSON (db.json) ou SQLite |
| **Déploiement** | Simple : copier le dossier sur un serveur |

**Votre serveur actuel :**
```
ged-serveur/
  server.js         ← API REST
  db.json           ← Base de données (l'arbre TREE)
  uploads/          ← Fichiers binaires
```

**API actuelle :**
```
GET  /api/ping                → test
GET  /api/tree                → charge l'arbre
POST /api/tree                → sauvegarde l'arbre
POST /api/files               → upload un fichier
GET  /api/files/:id           → télécharge un fichier
DELETE /api/files/:id         → supprime un fichier
```

---

### 2️⃣ **Firebase / Firestore** ← Idéal si vous ne voulez pas gérer un serveur

| Aspect | Détail |
|--------|--------|
| **Facilité** | ⭐⭐⭐ Facile, mais plus complexe que Node.js |
| **Coût** | Gratuit jusqu'à ~1M d'opérations/mois, puis payant |
| **Sécurité** | Intégrée (authentification, permissions) |
| **Scalabilité** | Automatique (Google gère tout) |

**Avantages :** Vous n'avez pas besoin d'un serveur physique.  
**Inconvénients :** Moins de contrôle, peuvent coûter cher à grande échelle.

---

### 3️⃣ **Supabase** ← Alternative moderne à Firebase

| Aspect | Détail |
|--------|--------|
| **Facilité** | ⭐⭐⭐⭐ Firebase-like mais plus simple |
| **Coût** | Gratuit jusqu'à certaines limites, puis payant |
| **Base de données** | PostgreSQL (plus puissant) |
| **Déploiement** | Cloud (Supabase gère les serveurs) |

---

## ✅ RECOMMANDATION POUR VOUS

**Restez avec Node.js + Express !** Voici pourquoi :
1. ✅ Vous l'avez **déjà configuré**
2. ✅ C'est **gratuit** et totalement sous votre contrôle
3. ✅ Parfait pour une PME
4. ✅ Très facile à déployer

---

## 🚀 Comment Ça Fonctionne Actuellement

### Architecture Actuelle

```
┌─────────────────────┐
│   Navigateur 1      │
│  (IndexedDB local)  │
└──────────┬──────────┘
           │ fetch() + JSON
           ▼
┌─────────────────────────────────────────┐
│   Serveur Node.js/Express (port 3000)   │
│  ├── /api/tree (charger/sauvegarder)   │
│  ├── /api/files (upload/download)      │
│  └── db.json (base de données)          │
└─────────────────────────────────────────┘
           △
           │ fetch() + JSON
           │
┌─────────────────────┐
│   Navigateur 2      │
│  (IndexedDB local)  │
└─────────────────────┘
```

### Ce Qui Fonctionne Déjà

1. **Arbre TREE** → Synchronisé entre navigateurs ✅
   - Sauvegardé dans `db.json` sur le serveur
   - Chargé au démarrage via `fbLoadTree()`

2. **Fichiers** → Stockés sur le serveur ✅
   - Upload via `fbUploadFile()`
   - Téléchargement via `fbDownloadFile()`

### Ce Qui Ne Fonctionne PAS

❌ **IndexedDB n'est pas synchronisé** entre navigateurs
- Navigateur 1 : 5 fichiers en cache
- Navigateur 2 : 0 fichier en cache
- → Besoin de re-télécharger les fichiers

---

## 🔧 SOLUTIONS

### Solution 1 : Améliorer la Synchronisation du Cache (Recommandé)

**Objectif :** Quand vous naviguez d'un navigateur à l'autre, les fichiers sont pré-cachés automatiquement.

#### Modification du serveur (ged-serveur/server.js)

Ajouter une nouvelle route qui liste les fichiers du serveur :

```javascript
/* ──────────────────────────────────────────────
   ROUTE : Lister les fichiers disponibles
   GET /api/files/list
   Retourne : { files: ["file_1", "file_2", ...] }
────────────────────────────────────────────── */
app.get('/api/files/list', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    res.json({ files });
  } catch (e) {
    res.status(500).json({ error: 'Impossible de lister les fichiers' });
  }
});
```

#### Modification du frontend HTML

Ajouter cette fonction pour pré-charger les fichiers :

```javascript
/**
 * Pré-cache tous les fichiers du serveur dans IndexedDB
 * (appelé au démarrage et périodiquement)
 */
async function preCacheServerFiles() {
  if (!window.fbUploadFile) return;
  try {
    const resp = await fetch(`${SERVER_URL}/api/files/list`);
    if (!resp.ok) return;
    const { files } = await resp.json();
    
    console.log(`📥 Pré-cache : ${files.length} fichiers`);
    
    for (const fileId of files) {
      // Vérifie si le fichier est déjà en cache
      const cached = await idbGet(fileId);
      if (cached) continue; // Déjà en cache
      
      // Télécharge et met en cache
      const blob = await window.fbDownloadFile(`${SERVER_URL}/api/files/${fileId}`);
      if (blob) {
        await idbPut(fileId, blob);
        console.log(`  ✓ ${fileId} pré-cachéisé`);
      }
    }
    
    updateSizeBar();
    toast(`✅ ${files.length} fichiers pré-cachés`, 'good');
  } catch (e) {
    console.warn('Pré-cache échoué :', e);
  }
}
```

Appeler cette fonction au démarrage :

```javascript
// Dans la section INIT (à la fin du HTML)
initDB()
  .then(async () => {
    document.getElementById('db-chip').className='ok';
    logIt('🚀','Application GED v5 démarrée');
    navTo('root');
    
    // 🆕 Pré-cache les fichiers
    if (window.fbUploadFile) {
      setTimeout(() => preCacheServerFiles(), 2000);
    }
  })
  .catch(() => { /*...*/ });
```

---

### Solution 2 : Stockage Centralisé (Plus Complet)

**Objectif :** Stocker TOUT (arbre + fichiers + métadonnées) sur le serveur. IndexedDB = cache de lecture seulement.

#### Nouvelle architecture du serveur

```javascript
// db.json — structure complète
{
  "tree": { /* arbre TREE */ },
  "files": {
    "file_123": {
      "originalName": "photo.jpg",
      "size": 2048,
      "uploadedAt": "2024-05-14T10:00:00Z",
      "storedPath": "uploads/file_123"
    }
  },
  "metadata": {
    "lastSync": "2024-05-14T10:05:00Z",
    "version": 1
  }
}
```

---

## 📝 Étape par Étape : Configurer le Serveur

### Étape 1 : Vérifier que le serveur fonctionne

```bash
cd ged-serveur
npm install
node server.js
```

Vous devriez voir :
```
✅ Serveur démarré sur le port 3000
```

### Étape 2 : Tester les routes

```bash
# Test 1 : Ping
curl http://localhost:3000/api/ping

# Résultat attendu :
# {"ok":true,"message":"GED Serveur opérationnel"}
```

### Étape 3 : Charger l'arbre

```bash
# Test 2 : Charger l'arbre
curl http://localhost:3000/api/tree

# Résultat attendu :
# {"tree": { ... structure complète ... }}
```

---

## 🌐 Déploiement en Production

### Option A : Serveur Local Perso (Gratuit)
- Laissez tourner en permanence sur votre PC
- Accessible partout si vous ouvrez le port 3000
- **Inconvénient :** Votre PC doit être allumé

### Option B : Cloud Gratuit (Recommandé)

**Render.com** (très facile) :
1. Allez sur https://render.com
2. Créez un compte gratuit
3. Cliquez "New" → "Web Service"
4. Connectez votre repo GitHub (ou upload le zip)
5. Configuration :
   - Build command: `npm install`
   - Start command: `node server.js`
6. Deploy !

**Coût :** $0/mois (limite : peut s'éteindre si inactif 15 min)

---

## 📊 Résumé des Modifications Nécessaires

| Élément | Status | Action |
|---------|--------|--------|
| Serveur Node.js | ✅ Déjà fait | Ajouter route `/api/files/list` |
| Frontend HTML | ✅ Déjà fait | Ajouter fonction `preCacheServerFiles()` |
| Synchronisation TREE | ✅ Déjà fait | Rien à faire — fonctionne ! |
| IndexedDB sync | ❌ Pas fait | Implémenter le pré-cache |

---

## ✨ Exemple : Flux Complet

### Scenario : Vous uploadez un fichier

```
1. Cliquez "Ajouter fichier" dans GED
2. Sélectionnez photo.jpg
3. Frontend :
   ├─ Sauvegarde en IndexedDB (instantané)
   ├─ Ajoute au TREE
   ├─ POST /api/files (upload au serveur)
   └─ Sync TREE au serveur
4. Serveur :
   ├─ Reçoit le fichier
   ├─ Stocke dans uploads/
   └─ Met à jour db.json
5. Autre navigateur :
   ├─ Charge le TREE au démarrage
   ├─ Voit le nouveau fichier
   ├─ Pré-cache les fichiers du serveur
   └─ Peut télécharger immédiatement (même offline après)
```

---

## 🆘 Troubleshooting

### "Impossible de se connecter au serveur"

**Cause :** `SERVER_URL` incorrect dans le HTML

**Vérifier :**
- Serveur lancé ? `node server.js`
- URL correcte ? (dans GED_Plaisance_v6.html, ligne 17)
  ```javascript
  const SERVER_URL = 'http://192.168.100.1:3000'; // Adapté à votre réseau
  ```
- Port 3000 accessible ? (firewall)

---

### "Fichiers n'apparaissent pas dans l'autre navigateur"

**Cause :** IndexedDB n'est pas synchronisé

**Solution :** Implémenter le pré-cache (Solution 1 ci-dessus)

---

### "Serveur plein / erreur de stockage"

**Cause :** Disque plein ou permissions incorrectes

**Solution :**
```bash
# Vérifier l'espace disque
du -sh ged-serveur/uploads/

# Nettoyer les anciens fichiers
rm -rf ged-serveur/uploads/*
```

---

## 🎓 Pour Aller Plus Loin

- **SQLite** : Remplacer db.json par une vraie base de données
  - `npm install better-sqlite3`
  - Plus rapide et robuste
  
- **Authentication** : Ajouter login/password
  - `npm install jsonwebtoken bcrypt`
  - Chaque utilisateur a ses propres fichiers

- **Versioning** : Garder historique des fichiers
  - Archiver les versions supprimées
  - Possibilité de "rollback"

---

## 📞 Support

Si vous avez des questions :
1. Consultez le README du serveur (ged-serveur/)
2. Vérifiez la console du navigateur (F12)
3. Vérifiez les logs du serveur (terminal)

---

**🎉 Vous avez tout ce qu'il faut pour déployer une GED distribuée !**

