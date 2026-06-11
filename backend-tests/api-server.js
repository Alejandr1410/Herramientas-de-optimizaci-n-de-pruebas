// ============================================================
// Servidor API local para pruebas de backend
// Simula un servicio REST estilo JSONPlaceholder
// Puerto: 3001
// ============================================================

const express = require('express');
const app = express();

app.use(express.json());

// ── Datos en memoria ────────────────────────────────────────
const posts = [
  { id: 1, userId: 1, title: 'Post uno', body: 'Contenido del primer post' },
  { id: 2, userId: 1, title: 'Post dos', body: 'Contenido del segundo post' },
  { id: 3, userId: 2, title: 'Post tres', body: 'Contenido del tercer post' },
  { id: 4, userId: 2, title: 'Post cuatro', body: 'Contenido del cuarto post' },
  { id: 5, userId: 3, title: 'Post cinco', body: 'Contenido del quinto post' },
];

const users = [
  { id: 1, name: 'Ana García',  email: 'ana@example.com',  role: 'admin' },
  { id: 2, name: 'Carlos López', email: 'carlos@example.com', role: 'user' },
  { id: 3, name: 'María Torres', email: 'maria@example.com', role: 'user' },
];

const VALID_TOKEN = 'Bearer test-token-seguro-123';

// ── Middleware de autenticación ──────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || auth !== VALID_TOKEN) {
    return res.status(401).json({ error: 'Token inválido o ausente' });
  }
  next();
}

// ── Rutas públicas ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/posts', (req, res) => {
  const { userId, _page = 1, _limit = 10 } = req.query;
  let resultado = [...posts];

  if (userId) {
    const uid = parseInt(userId);
    if (isNaN(uid)) return res.status(400).json({ error: 'userId debe ser número' });
    resultado = resultado.filter(p => p.userId === uid);
  }

  const inicio = (_page - 1) * _limit;
  const paginado = resultado.slice(inicio, inicio + parseInt(_limit));

  res.json({
    data: paginado,
    total: resultado.length,
    page: parseInt(_page),
    limit: parseInt(_limit),
  });
});

app.get('/posts/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  const post = posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ error: 'Post no encontrado' });

  res.json(post);
});

app.post('/posts', (req, res) => {
  const { title, body, userId } = req.body;
  if (!title || !body || !userId) {
    return res.status(422).json({ error: 'Campos requeridos: title, body, userId' });
  }
  const nuevo = { id: posts.length + 1, userId, title, body };
  posts.push(nuevo);
  res.status(201).json(nuevo);
});

// ── Rutas protegidas ─────────────────────────────────────────
app.get('/users', requireAuth, (req, res) => {
  res.json({ data: users, total: users.length });
});

app.get('/users/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

// ── 404 genérico ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;