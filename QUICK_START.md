# ⚡ QUICK START — Démarrer en 5 Minutes

## 🎯 Objectif

Avoir votre GED **synchronisée et multi-navigateur** en 5 minutes.

---

## ✅ Étape 1 : Vérifier (30 sec)

```bash
# Terminal dans : c:\Users\SONIA\Desktop\PLAISANCE DOC\PERSONNEL\MON PROJET\GED PLAISANCE\ged-serveur

# 1. Vérifier Node.js
node --version
# Résultat : v16+ ✅

# 2. Vérifier NPM packages
npm list | head -5
# Vous devriez voir : express, multer, cors
```

---

## 🚀 Étape 2 : Lancer le Serveur (1 min)

```bash
cd ged-serveur
node server.js
```

**Vous devriez voir :**
```
╔══════════════════════════════════════════╗
║       GED Plaisance — Serveur v1.0       ║
╠══════════════════════════════════════════╣
║  ✅ Serveur démarré sur le port 3000      ║
```

✅ **Le serveur est prêt !** Gardez ce terminal ouvert.

---

## 💻 Étape 3 : Ouvrir l'Application (2 min)

**Option A : Depuis fichier (simple)**

```
Navigateur → Adresse
file:///C:/Users/SONIA/Desktop/PLAISANCE%20DOC/PERSONNEL/MON%20PROJET/GED%20PLAISANCE/ged-serveur/GED_Plaisance_v6.html
```

**Option B : Via Express (mieux)**

```
Navigateur → Adresse
http://localhost:3000/ged-serveur/GED_Plaisance_v6.html
```

---

## 🔍 Étape 4 : Vérifier que Tout Fonctionne (1 min 30 sec)

### Dans le navigateur, appuyez sur **F12** → **Console**

Vous devriez voir (en ordre) :

```
✅ 1. Application GED v5 démarrée — Bienvenue Sonia
✅ 2. 🚀 [vers le bas] Données chargées depuis le serveur Express
✅ 3. Lancement du pré-cache...
✅ 4. 📥 Démarrage pré-cache des fichiers...
✅ 5. ✅ Pré-cache terminé : 0 cachés...
```

---

## 🆕 Étape 5 : Tester le Upload (1 min)

### Ajouter un fichier à la GED

1. Bouton "➕ Ajouter fichier"
2. Choisissez un fichier (ex: photo.jpg)
3. Vérifiez la console :
   ```
   📤 Fichier reçu : photo.jpg → uploads/file_xyz
   💾 Arbre sauvegardé
   ```

---

## 🔄 Étape 6 : Tester la Synchronisation (30 sec)

### Ouvrir un DEUXIÈME navigateur

1. Firefox (si Chrome d'abord) ou Chrome privé
2. Allez sur `http://localhost:3000/ged-serveur/GED_Plaisance_v6.html`
3. Vous devriez voir le fichier uploadé ! ✅
4. Vérifiez la console : le pré-cache télécharge le fichier

---

## ✨ Résultat

```
Navigateur 1          Navigateur 2
├─ photo.jpg          ├─ photo.jpg ✅ (pré-cachée)
├─ rapport.pdf        ├─ rapport.pdf ✅
└─ ...                └─ ...
```

**Tous les fichiers sont synchronisés ! 🎉**

---

## 🆘 Ça ne Marche Pas ?

### Erreur 1 : "Cannot connect to server"

```bash
# Vérifier que le serveur tourne dans l'autre terminal
# Dans le terminal du serveur, vous devriez voir :
✅ Serveur démarré sur le port 3000
```

### Erreur 2 : "FILES list empty" (console)

```
✅ Normal ! Pas encore de fichiers uploadés.
Ajouter un fichier → il apparaîtra dans la liste.
```

### Erreur 3 : "localhost:3000 refused to connect"

```bash
# Firewall bloque le port
# Solution : Ouvrir port 3000 (Windows Defender)
# OU : Relancer avec IP 127.0.0.1
```

---

## 🔗 Liens Utiles

| Doc | Sujet |
|-----|-------|
| [GUIDE_SYNCHRONISATION.md](./GUIDE_SYNCHRONISATION.md) | Explique tout (Options Backend, Architecture) |
| [GUIDE_TECHNIQUE_IMPLEMENTATION.md](./GUIDE_TECHNIQUE_IMPLEMENTATION.md) | Détails du code |
| [GUIDE_CONFIGURATION_TESTS.md](./GUIDE_CONFIGURATION_TESTS.md) | Tests et déploiement cloud |
| [RESUME_MODIFICATIONS.md](./RESUME_MODIFICATIONS.md) | Résumé des changements |

---

## 📊 Structure des Fichiers

```
ged-serveur/
├─ server.js                     ← Backend (port 3000)
├─ GED_Plaisance_v6.html        ← Frontend (application)
├─ db.json                       ← Base de données (arbre TREE)
├─ uploads/                      ← Fichiers binaires
│  ├─ file_1
│  ├─ file_2
│  └─ ...
└─ package.json

GED_PLAISANCE_v6.html           ← Version alternative (même contenu)
data.json                        ← Données d'exemple
```

---

## 🎯 Prochaine Étape

Maintenant que vous avez testé localement, vous pouvez :

### Déployer sur le Cloud (5 min)

**Render.com :**
1. Allez sur https://render.com
2. "New Web Service"
3. Sélectionnez le dossier `ged-serveur`
4. Configuration : `npm install` + `node server.js`
5. Deploy ! ✅

**URL finale :** `https://ged-plaisance-xyz.onrender.com`

---

## 💡 Tips

| Conseil | Action |
|---------|--------|
| **Voir les logs du serveur** | Vérifier le terminal (ne pas fermer) |
| **Voir les logs du frontend** | F12 → Console |
| **Vider le cache** | F12 → Application → Cache Storage → Delete |
| **Quitter l'app** | Ctrl+C dans le terminal du serveur |

---

## 🚀 Résumé

| Étape | Temps | Action |
|-------|-------|--------|
| 1 | 30s | Vérifier Node.js |
| 2 | 1m | Lancer `node server.js` |
| 3 | 2m | Ouvrir l'app |
| 4 | 1m30s | Vérifier console (pré-cache) |
| 5 | 1m | Tester upload |
| 6 | 30s | Tester 2e navigateur |
| **Total** | **~5m** | **GED synchronisée !** |

---

**✨ C'est tout ! Votre GED fonctionne maintenant en mode distribué. 🎉**

Besoin d'aide ? Consultez les guides détaillés.

