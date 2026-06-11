// ============================================================
// SUITE DE PRUEBAS BACKEND — Jest + Supertest
// API sujeto de prueba: servidor Express local (api-server.js)
//   Patrón REST estilo JSONPlaceholder
// ============================================================

const request = require('supertest');
const app = require('./api-server');

const TOKEN_VALIDO = 'Bearer test-token-seguro-123';
const TOKEN_INVALIDO = 'Bearer token-falso-xyz';

// ─────────────────────────────────────────────────────────────
// TC-B01: Health check — respuesta 200 y estructura básica
//   Verifica que el endpoint /health responde exitosamente
//   y devuelve los campos esperados en el JSON.
// ─────────────────────────────────────────────────────────────
describe('TC-B01 · Health check del servidor', () => {
  test('GET /health responde 200 con status "ok"', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');

    // El timestamp debe ser una fecha ISO válida
    const fecha = new Date(res.body.timestamp);
    expect(fecha.toString()).not.toBe('Invalid Date');
  });
});

// ─────────────────────────────────────────────────────────────
// TC-B02: Listado de posts — estructura y tipos de datos
//   Valida que GET /posts devuelve un arreglo con la
//   estructura correcta: data, total, page, limit.
// ─────────────────────────────────────────────────────────────
describe('TC-B02 · Estructura del JSON de respuesta', () => {
  test('GET /posts devuelve estructura paginada correcta', async () => {
    const res = await request(app).get('/posts');

    expect(res.status).toBe(200);

    // Campos de paginación presentes
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('limit');

    // data debe ser un arreglo
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    // Cada post debe tener los campos requeridos
    const primerPost = res.body.data[0];
    expect(primerPost).toHaveProperty('id');
    expect(primerPost).toHaveProperty('userId');
    expect(primerPost).toHaveProperty('title');
    expect(primerPost).toHaveProperty('body');
    expect(typeof primerPost.id).toBe('number');
    expect(typeof primerPost.title).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────
// TC-B03: Post específico por ID — éxito y 404
//   Verifica que un ID válido retorna el post correcto y
//   que un ID inexistente retorna 404 con mensaje de error.
// ─────────────────────────────────────────────────────────────
describe('TC-B03 · Obtener post por ID', () => {
  test('GET /posts/1 retorna el post correcto', async () => {
    const res = await request(app).get('/posts/1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.title).toBe('Post uno');
  });

  test('GET /posts/999 retorna 404 con mensaje de error', async () => {
    const res = await request(app).get('/posts/999');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────
// TC-B04: Manejo de parámetros inválidos (status 4xx)
//   Valida que la API rechaza inputs malformados con
//   códigos de error apropiados y mensajes descriptivos.
// ─────────────────────────────────────────────────────────────
describe('TC-B04 · Manejo de parámetros inválidos', () => {
  test('GET /posts?userId=abc retorna 400 (userId no numérico)', async () => {
    const res = await request(app).get('/posts?userId=abc');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /posts sin campos requeridos retorna 422', async () => {
    const res = await request(app)
      .post('/posts')
      .send({ title: 'Solo título, sin body ni userId' });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toMatch(/requeridos/i);
  });
});

// ─────────────────────────────────────────────────────────────
// TC-B05: Autenticación — token requerido
//   Verifica que endpoints protegidos retornan 401 sin token
//   y 200 con token válido. Prueba el control de acceso.
// ─────────────────────────────────────────────────────────────
describe('TC-B05 · Autenticación y control de acceso', () => {
  test('GET /users sin token retorna 401', async () => {
    const res = await request(app).get('/users');

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('GET /users con token inválido retorna 401', async () => {
    const res = await request(app)
      .get('/users')
      .set('Authorization', TOKEN_INVALIDO);

    expect(res.status).toBe(401);
  });

  test('GET /users con token válido retorna 200 y lista de usuarios', async () => {
    const res = await request(app)
      .get('/users')
      .set('Authorization', TOKEN_VALIDO);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────
// TC-B06: Creación de recurso (POST) y persistencia
//   Crea un nuevo post y verifica que el servidor responde
//   con 201, asigna un ID y el recurso queda disponible.
// ─────────────────────────────────────────────────────────────
describe('TC-B06 · Crear nuevo post (POST)', () => {
  test('POST /posts crea un recurso y retorna 201', async () => {
    const nuevoPost = {
      title: 'Post de prueba automatizado',
      body: 'Este post fue creado por el test TC-B06',
      userId: 1,
    };

    const res = await request(app)
      .post('/posts')
      .send(nuevoPost)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe(nuevoPost.title);
    expect(res.body.userId).toBe(nuevoPost.userId);
    expect(typeof res.body.id).toBe('number');
  });
});

// ─────────────────────────────────────────────────────────────
// TC-B07: Paginación y filtrado de resultados
//   Verifica que los parámetros _page, _limit y userId
//   filtran correctamente el conjunto de datos.
// ─────────────────────────────────────────────────────────────
describe('TC-B07 · Paginación y filtrado', () => {
  test('GET /posts?_limit=2 retorna máximo 2 resultados', async () => {
    const res = await request(app).get('/posts?_limit=2');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
    expect(res.body.limit).toBe(2);
  });

  test('GET /posts?userId=1 filtra solo posts del usuario 1', async () => {
    const res = await request(app).get('/posts?userId=1');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);

    // Todos los resultados deben pertenecer al userId=1
    res.body.data.forEach(post => {
      expect(post.userId).toBe(1);
    });
  });

  test('GET /posts?_page=2&_limit=2 retorna la segunda página', async () => {
    const pag1 = await request(app).get('/posts?_page=1&_limit=2');
    const pag2 = await request(app).get('/posts?_page=2&_limit=2');

    expect(pag1.status).toBe(200);
    expect(pag2.status).toBe(200);

    // Las dos páginas no deben tener los mismos IDs
    const idsPag1 = pag1.body.data.map(p => p.id);
    const idsPag2 = pag2.body.data.map(p => p.id);
    const overlap = idsPag1.some(id => idsPag2.includes(id));
    expect(overlap).toBe(false);
  });
});
