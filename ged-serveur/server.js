/**
 * ═══════════════════════════════════════════════════
 *  GED Plaisance — Serveur Node.js / Express
 *  Version : 1.0
 * ═══════════════════════════════════════════════════
 *
 *  Démarrage : node server.js
 *  Le serveur écoute sur http://localhost:3000
 *
 *  API exposée :
 *    GET    /api/ping            → test de vie du serveur
 *    GET    /api/tree            → charge l'arbre TREE
 *    POST   /api/tree            → sauvegarde l'arbre TREE
 *    POST   /api/files           → upload d'un fichier binaire
 *    GET    /api/files/:id       → télécharge un fichier
 *    DELETE /api/files/:id       → supprime un fichier
 */

const express  = require('express');
const multer   = require('multer');
const cors     = require('cors');
const fs       = require('fs');
const path     = require('path');

/* ══════════════════════════════════════════════════
   CONFIGURATION
══════════════════════════════════════════════════ */
const PORT         = 3000;
const UPLOADS_DIR  = path.join(__dirname, 'uploads');  // dossier des fichiers binaires
const TREE_FILE    = path.join(__dirname, 'db.json');   // fichier JSON de l'arbre

// Crée le dossier uploads s'il n'existe pas
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('📁 Dossier uploads/ créé');
}

// Crée db.json vide s'il n'existe pas
if (!fs.existsSync(TREE_FILE)) {
  fs.writeFileSync(TREE_FILE, JSON.stringify({ tree: null }), 'utf8');
  console.log('📄 db.json créé');
}

/* ══════════════════════════════════════════════════
   MULTER — gestion de l'upload de fichiers
   Les fichiers sont stockés dans /uploads/ sous leur id unique
══════════════════════════════════════════════════ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    // Le nom du fichier sur le disque = l'id unique envoyé par le client
    const fileId = req.body.fileId || ('file_' + Date.now());
    cb(null, fileId);
  }
});
const upload = multer({ storage });

/* ══════════════════════════════════════════════════
   APPLICATION EXPRESS
══════════════════════════════════════════════════ */
const app = express();

// Autorise tous les navigateurs à appeler ce serveur (CORS)
app.use(cors());

// Parse le JSON dans le corps des requêtes POST
app.use(express.json({ limit: '10mb' }));

// Serve les fichiers statiques (HTML, CSS, JS, etc.)
app.use(express.static(__dirname));

/* ──────────────────────────────────────────────────
   ROUTE : Test de vie
   GET /api/ping
────────────────────────────────────────────────── */
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, message: 'GED Serveur opérationnel', time: new Date().toISOString() });
});

/* ──────────────────────────────────────────────────
   ROUTE : Charger l'arbre TREE
   GET /api/tree
   Retourne : { tree: { ... } }  ou  { tree: null }
────────────────────────────────────────────────── */
app.get('/api/tree', (req, res) => {
  try {
    const raw  = fs.readFileSync(TREE_FILE, 'utf8');
    const data = JSON.parse(raw);
    console.log('📖 Arbre chargé depuis db.json');
    res.json(data);
  } catch (e) {
    console.error('Erreur lecture db.json :', e.message);
    res.status(500).json({ error: 'Impossible de lire la base de données' });
  }
});

/* ──────────────────────────────────────────────────
   ROUTE : Sauvegarder l'arbre TREE
   POST /api/tree
   Corps attendu : { tree: { ... } }
   Retourne : { ok: true }
────────────────────────────────────────────────── */
app.post('/api/tree', (req, res) => {
  try {
    const { tree } = req.body;
    if (!tree) return res.status(400).json({ error: 'Champ "tree" manquant' });

    const payload = JSON.stringify({ tree, updatedAt: new Date().toISOString() }, null, 2);
    fs.writeFileSync(TREE_FILE, payload, 'utf8');
    console.log('💾 Arbre sauvegardé dans db.json');
    res.json({ ok: true });
  } catch (e) {
    console.error('Erreur écriture db.json :', e.message);
    res.status(500).json({ error: 'Impossible de sauvegarder la base de données' });
  }
});

/* ──────────────────────────────────────────────────
   ROUTE : Uploader un fichier binaire
   POST /api/files
   Corps : multipart/form-data avec les champs :
     - fileId  (string) : identifiant unique (ex: "up_42")
     - file    (binary) : le fichier lui-même
   Retourne : { ok: true, fileId: "up_42" }
────────────────────────────────────────────────── */
app.post('/api/files', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });
    const fileId = req.body.fileId || req.file.filename;
    console.log(`📤 Fichier reçu : ${req.file.originalname} → uploads/${fileId} (${req.file.size} octets)`);
    res.json({ ok: true, fileId });
  } catch (e) {
    console.error('Erreur upload :', e.message);
    res.status(500).json({ error: "Erreur lors de l'upload" });
  }
});

/* ──────────────────────────────────────────────────
   ROUTE : Lister tous les fichiers disponibles
   GET /api/files/list
   Retourne : { files: ["file_id_1", "file_id_2", ...], count: N }
   
   ⚠️ DOIT ÊTRE AVANT /api/files/:id (routes spécifiques en premier)
   Utilisé par le frontend pour pré-cacher les fichiers en IndexedDB
────────────────────────────────────────────────── */
app.get('/api/files/list', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    res.json({ 
      files: files, 
      count: files.length,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Erreur lecture uploads/ :', e.message);
    res.status(500).json({ error: 'Impossible de lister les fichiers' });
  }
});

/* ──────────────────────────────────────────────────
   ROUTE : Télécharger un fichier binaire
   GET /api/files/:id
   Retourne : le fichier brut
────────────────────────────────────────────────── */
app.get('/api/files/:id', (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.id);

  // Sécurité : empêche les attaques "path traversal" (ex: ../../etc/passwd)
  if (!filePath.startsWith(UPLOADS_DIR)) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠ Fichier introuvable : ${req.params.id}`);
    return res.status(404).json({ error: 'Fichier introuvable' });
  }

  console.log(`📥 Fichier servi : ${req.params.id}`);
  res.sendFile(filePath);
});

/* ──────────────────────────────────────────────────
   ROUTE : Supprimer un fichier
   DELETE /api/files/:id
   Retourne : { ok: true }
────────────────────────────────────────────────── */
app.delete('/api/files/:id', (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.id);

  if (!filePath.startsWith(UPLOADS_DIR)) {
    return res.status(403).json({ error: 'Accès refusé' });
  }

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑 Fichier supprimé : ${req.params.id}`);
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('Erreur suppression :', e.message);
    res.status(500).json({ error: 'Impossible de supprimer le fichier' });
  }
});

/* ══════════════════════════════════════════════════
   DÉMARRAGE
══════════════════════════════════════════════════ */
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║       GED Plaisance — Serveur v1.0       ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  ✅ Serveur démarré sur le port ${PORT}      ║`);
  console.log(`║  🌐 URL locale : http://localhost:${PORT}   ║`);
  console.log('║                                          ║');
  console.log('║  Routes disponibles :                    ║');
  console.log('║   GET    /api/ping                       ║');
  console.log('║   GET    /api/tree                       ║');
  console.log('║   POST   /api/tree                       ║');
  console.log('║   POST   /api/files                      ║');
  console.log('║   GET    /api/files/:id                  ║');
  console.log('║   GET    /api/files/list         [NOUVEAU]║');
  console.log('║   DELETE /api/files/:id                  ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});
