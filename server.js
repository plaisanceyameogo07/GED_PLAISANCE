// ══════════════════════════════════════════════════════════════════
// GED PLAISANCE — BACKEND NODE.JS
// ══════════════════════════════════════════════════════════════════
// Installation : npm install
// Démarrage   : node server.js
// Port        : 3001 (configurable via PORT env)
// ══════════════════════════════════════════════════════════════════

const express    = require('express');
const multer     = require('multer');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');
const crypto     = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Dossiers ──────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DB_FILE    = path.join(__dirname, 'db.json');   // "base de données" JSON simple

[UPLOAD_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── DB JSON (remplacez par SQLite/PostgreSQL en production) ───────
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {}
  return { documents: [], shares: [] };
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

let DB = loadDB();

// ── Middlewares ───────────────────────────────────────────────────
app.use(cors({
  origin: '*',    // En production : mettez l'URL exacte de votre frontend
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger de requêtes
app.use((req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ── Multer (gestion upload) ───────────────────────────────────────
const ALLOWED_TYPES = {
  'application/pdf'                                                          : 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'  : 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'        : 'xlsx',
  'text/plain'                                                               : 'txt',
  'text/csv'                                                                 : 'csv',
  'image/png'                                                                : 'png',
  'image/jpeg'                                                               : 'jpg',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Nom de fichier : UUID + extension originale (sécurisé)
    const ext = path.extname(file.originalname).toLowerCase();
    const id  = crypto.randomUUID();
    cb(null, `${id}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé : ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize : 50 * 1024 * 1024,   // 50 Mo max
    files    : 10,                  // 10 fichiers simultanés max
  }
});

// ══════════════════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════════════════

// ── GET /api/status ── Santé du serveur ──────────────────────────
app.get('/api/status', (req, res) => {
  const { documents, shares } = DB;
  res.json({
    status       : 'ok',
    version      : '1.0.0',
    mode         : 'local',
    uploadDir    : 'uploads/',
    stats: {
      totalDocuments : documents.length,
      activeShares   : shares.filter(s => new Date(s.expiresAt) > new Date()).length,
      diskUsage      : getDiskUsage(),
    },
    timestamp: new Date().toISOString(),
  });
});

// ── POST /api/upload ── Upload d'un fichier ──────────────────────
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucun fichier reçu' });
    }

    // Parsing des métadonnées
    let meta = {};
    try { meta = JSON.parse(req.body.meta || '{}'); } catch(e) {}

    const folderId = req.body.folder || 'root';
    const ext      = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const docId    = path.basename(req.file.filename, path.extname(req.file.filename));

    // Enregistrement en DB
    const document = {
      id          : docId,
      name        : req.file.originalname,
      filename    : req.file.filename,     // Nom sur disque (UUID.ext)
      path        : req.file.path,
      ext         ,
      size        : req.file.size,
      mimetype    : req.file.mimetype,
      folder      : folderId,
      uploadedAt  : new Date().toISOString(),
      uploadedBy  : meta.uploadedBy || 'Sonia',
      meta: {
        auteur  : meta.auteur  || '',
        statut  : meta.statut  || 'Brouillon',
        version : 'v1',
        tags    : meta.tags    || [],
        description: meta.description || '',
      }
    };

    DB.documents.push(document);
    saveDB(DB);

    console.log(`✅ Upload : ${document.name} (${formatBytes(document.size)}) → ${document.folder}`);

    res.json({
      success  : true,
      document : {
        id       : document.id,
        name     : document.name,
        path     : `uploads/${document.filename}`,
        size     : document.size,
        ext      : document.ext,
        folder   : document.folder,
        uploadedAt: document.uploadedAt,
        meta     : document.meta,
      }
    });

  } catch (err) {
    console.error('Erreur upload:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/files/:folderId ── Liste les fichiers d'un dossier ──
app.get('/api/files/:folderId', (req, res) => {
  const { folderId } = req.params;
  const files = DB.documents
    .filter(d => d.folder === folderId)
    .map(d => ({
      id        : d.id,
      name      : d.name,
      ext       : d.ext,
      size      : d.size,
      folder    : d.folder,
      uploadedAt: d.uploadedAt,
      meta      : d.meta,
    }));
  res.json({ folderId, count: files.length, files });
});

// ── GET /api/files ── Tous les fichiers ──────────────────────────
app.get('/api/files', (req, res) => {
  const { folder, ext, search } = req.query;
  let files = [...DB.documents];

  if (folder) files = files.filter(d => d.folder === folder);
  if (ext)    files = files.filter(d => d.ext === ext);
  if (search) {
    const q = search.toLowerCase();
    files = files.filter(d =>
      d.name.toLowerCase().includes(q) ||
      (d.meta.description || '').toLowerCase().includes(q) ||
      (d.meta.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  res.json({
    count: files.length,
    files: files.map(d => ({ id: d.id, name: d.name, ext: d.ext, size: d.size, folder: d.folder, uploadedAt: d.uploadedAt, meta: d.meta }))
  });
});

// ── GET /api/download/:id ── Télécharger un fichier ─────────────
app.get('/api/download/:id', (req, res) => {
  const doc = DB.documents.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Fichier introuvable' });

  const filePath = path.join(UPLOAD_DIR, doc.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier manquant sur le disque' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.name)}"`);
  res.setHeader('Content-Type', doc.mimetype || 'application/octet-stream');
  res.setHeader('Content-Length', doc.size);
  res.sendFile(filePath);

  console.log(`⬇ Download : ${doc.name}`);
});

// ── DELETE /api/delete/:id ── Supprimer un fichier ───────────────
app.delete('/api/delete/:id', (req, res) => {
  const idx = DB.documents.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Document introuvable' });

  const doc = DB.documents[idx];

  // Supprimer le fichier physique
  const filePath = path.join(UPLOAD_DIR, doc.filename);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {
    console.warn(`⚠ Impossible de supprimer le fichier : ${filePath}`, e.message);
  }

  // Supprimer de la DB
  DB.documents.splice(idx, 1);
  // Invalider les partages liés
  DB.shares = DB.shares.filter(s => s.docId !== req.params.id);
  saveDB(DB);

  console.log(`🗑 Supprimé : ${doc.name}`);
  res.json({ success: true, deleted: req.params.id, name: doc.name });
});

// ── GET /api/share/:id ── Générer un lien de partage ─────────────
app.get('/api/share/:id', (req, res) => {
  const doc = DB.documents.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document introuvable' });

  const token     = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 jours

  DB.shares.push({ token, docId: req.params.id, createdAt: new Date().toISOString(), expiresAt });
  saveDB(DB);

  const link = `http://localhost:${PORT}/shared/${token}`;
  console.log(`🔗 Partage généré : ${doc.name} → ${link}`);
  res.json({ success: true, link, expiresAt, filename: doc.name });
});

// ── GET /shared/:token ── Accès via lien partagé ─────────────────
app.get('/shared/:token', (req, res) => {
  const share = DB.shares.find(s => s.token === req.params.token);
  if (!share) return res.status(404).send('<h2>Lien invalide ou expiré</h2>');
  if (new Date(share.expiresAt) < new Date()) return res.status(410).send('<h2>Ce lien a expiré</h2>');

  const doc = DB.documents.find(d => d.id === share.docId);
  if (!doc) return res.status(404).send('<h2>Fichier introuvable</h2>');

  const filePath = path.join(UPLOAD_DIR, doc.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send('<h2>Fichier manquant</h2>');

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.name)}"`);
  res.setHeader('Content-Type', doc.mimetype || 'application/octet-stream');
  res.sendFile(filePath);
});

// ── GET /api/stats ── Statistiques globales ──────────────────────
app.get('/api/stats', (req, res) => {
  const byFolder = {};
  const byExt    = {};
  let   totalSize = 0;

  DB.documents.forEach(d => {
    byFolder[d.folder] = (byFolder[d.folder] || 0) + 1;
    byExt[d.ext]       = (byExt[d.ext]       || 0) + 1;
    totalSize += d.size || 0;
  });

  res.json({
    totalDocuments : DB.documents.length,
    totalSize      : formatBytes(totalSize),
    totalSizeBytes : totalSize,
    byFolder,
    byExt,
    activeShares   : DB.shares.filter(s => new Date(s.expiresAt) > new Date()).length,
  });
});

// ── Servir les fichiers uploadés directement (optionnel) ──────────
app.use('/uploads', express.static(UPLOAD_DIR));

// ══════════════════════════════════════════════════════════════════
// GESTION D'ERREURS
// ══════════════════════════════════════════════════════════════════

// Erreurs Multer
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, error: 'Fichier trop volumineux (max 50 Mo)' });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ success: false, error: 'Trop de fichiers simultanés (max 10)' });
  }
  if (err.message && err.message.includes('non autorisé')) {
    return res.status(415).json({ success: false, error: err.message });
  }
  console.error('Erreur serveur:', err);
  res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({ error: `Route introuvable : ${req.method} ${req.path}` });
});

// ══════════════════════════════════════════════════════════════════
// UTILITAIRES
// ══════════════════════════════════════════════════════════════════
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 o';
  if (bytes < 1024)       return `${bytes} o`;
  if (bytes < 1024**2)    return `${(bytes/1024).toFixed(1)} Ko`;
  if (bytes < 1024**3)    return `${(bytes/1024**2).toFixed(1)} Mo`;
  return `${(bytes/1024**3).toFixed(2)} Go`;
}

function getDiskUsage() {
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const total = files.reduce((acc, f) => {
      try { return acc + fs.statSync(path.join(UPLOAD_DIR, f)).size; } catch(e) { return acc; }
    }, 0);
    return formatBytes(total);
  } catch(e) { return '–'; }
}

// ══════════════════════════════════════════════════════════════════
// DÉMARRAGE
// ══════════════════════════════════════════════════════════════════
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║        GED PLAISANCE — BACKEND v1.0          ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  🚀 Serveur     : http://localhost:${PORT}        ║`);
  console.log(`║  📁 Upload dir  : ${UPLOAD_DIR.slice(-30).padEnd(30)} ║`);
  console.log(`║  🗄 Base de données : db.json                 ║`);
  console.log(`║  📦 Documents   : ${String(DB.documents.length).padEnd(3)} enregistrés           ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  Endpoints disponibles :                      ║');
  console.log('║  GET    /api/status                           ║');
  console.log('║  POST   /api/upload                           ║');
  console.log('║  GET    /api/files/:folderId                  ║');
  console.log('║  GET    /api/download/:id                     ║');
  console.log('║  DELETE /api/delete/:id                       ║');
  console.log('║  GET    /api/share/:id                        ║');
  console.log('║  GET    /api/stats                            ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});
