# GED_PLAISANCE
Gestion Electronique des Documents
# GED Plaisance — Système d'Upload Réel

## Architecture

```
ged-plaisance-frontend.html   ← Votre interface (ouvrir dans navigateur)
ged-backend/
  ├── server.js               ← Backend Node.js (Express + Multer)
  ├── package.json
  ├── uploads/                ← Fichiers uploadés (créé automatiquement)
  └── db.json                 ← Base de données JSON (créée automatiquement)
```

---

## Démarrage rapide

### Étape 1 — Installer Node.js
Téléchargez Node.js 18+ sur https://nodejs.org

### Étape 2 — Installer les dépendances backend
```bash
cd ged-backend
npm install
```

### Étape 3 — Démarrer le backend
```bash
node server.js
# Ou en mode développement (redémarrage auto) :
npx nodemon server.js
```

Le serveur démarre sur **http://localhost:3001**

### Étape 4 — Ouvrir le frontend
Ouvrez `ged-plaisance-frontend.html` dans votre navigateur.
L'indicateur en haut à droite passera au vert 🟢 si le backend est détecté.

---

## Fonctionnalités

### Upload côté client (sans backend)
- Drag & drop ou clic sur la zone d'upload
- Lecture du contenu des fichiers .txt et .csv
- Aperçu des images PNG/JPG (< 500 Ko)
- Sauvegarde dans localStorage (persiste entre sessions)
- Ajout automatique de métadonnées (auteur, statut, tags)

### Upload serveur (avec backend Node.js)
- Upload HTTP multipart/form-data vers `/api/upload`
- Barre de progression en temps réel (XHR)
- Stockage sur disque dans `/uploads/` avec noms UUID sécurisés
- Base de données JSON avec métadonnées complètes
- Téléchargement depuis le serveur (`/api/download/:id`)
- Liens de partage temporaires (7 jours) via `/api/share/:id`
- Suppression serveur + locale synchronisées

---

## API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/status` | Santé du serveur + statistiques |
| POST | `/api/upload` | Upload d'un fichier (multipart) |
| GET | `/api/files/:folderId` | Fichiers d'un dossier |
| GET | `/api/files?search=&ext=` | Recherche globale |
| GET | `/api/download/:id` | Téléchargement par ID |
| DELETE | `/api/delete/:id` | Suppression fichier + DB |
| GET | `/api/share/:id` | Générer lien de partage (7j) |
| GET | `/shared/:token` | Accès via lien partagé |
| GET | `/api/stats` | Statistiques globales |

---

## Formats acceptés

| Format | MIME Type | Taille max |
|--------|-----------|-----------|
| PDF | application/pdf | 50 Mo |
| DOCX | application/vnd.openxmlformats... | 50 Mo |
| XLSX | application/vnd.openxmlformats... | 50 Mo |
| TXT | text/plain | 50 Mo |
| CSV | text/csv | 50 Mo |
| PNG | image/png | 50 Mo |
| JPG/JPEG | image/jpeg | 50 Mo |

---

## Migration vers une vraie base de données

Le fichier `db.json` peut être remplacé par SQLite (simple) ou PostgreSQL (production).

### Avec SQLite (recommandé pour démarrer)
```bash
npm install better-sqlite3
```

Remplacez les fonctions `loadDB()` et `saveDB()` dans `server.js` par des requêtes SQL.

### Avec PostgreSQL (production)
```bash
npm install pg
```

---

## Déploiement en production

1. Choisir un hébergeur : Railway, Render, VPS OVH/DigitalOcean
2. Configurer les variables d'environnement :
   ```
   PORT=3001
   NODE_ENV=production
   ```
3. Utiliser un stockage cloud pour les fichiers (AWS S3, Cloudflare R2)
4. Mettre l'URL du serveur dans le champ "Backend API" du frontend

---

## Sécurité (à ajouter en production)

- Authentification JWT sur toutes les routes
- Vérification MIME type côté serveur (déjà implémenté)
- Rate limiting (`npm install express-rate-limit`)
- HTTPS obligatoire
- Validation des noms de fichiers contre les path traversal
- Logs avec Winston ou Pino
