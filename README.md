# QA Automation Suite
**Automatización de Pruebas de Software — Frontend + Backend**
Ingeniería en Tecnología y Soluciones de Negocio · Ingeniería de Software

---

## Herramientas elegidas

| Capa | Herramienta | Versión | Sitio/API bajo prueba |
|------|------------|---------|----------------------|
| **Frontend** | [Playwright](https://playwright.dev) | ^1.44 | https://books.toscrape.com |
| **Backend** | [Jest](https://jestjs.io) + [Supertest](https://github.com/ladjs/supertest) | ^29 / ^7 | Servidor Express local (`api-server.js`) |

---

## Requisitos previos

- **Node.js** v18 o superior
- **npm** v8 o superior

Verifica con:
```bash
node --version
npm --version
```

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/qa-automation-suite.git
cd qa-automation-suite

# 2. Instalar dependencias de Node
npm install

# 3. Instalar el navegador Chromium para Playwright (solo primera vez)
npx playwright install chromium
```

---

## Ejecutar pruebas

### Backend (Jest + Supertest) — sin navegador, solo Node.js
```bash
npm run test:backend
```
Genera reporte de resultados en consola con pass/fail por cada caso.

### Frontend (Playwright + Chromium)
```bash
npm run test:frontend
```
Genera reporte HTML en `reports/playwright-report/index.html`.  
Ábrete con:
```bash
npx playwright show-report reports/playwright-report
```

### Ambas suites en secuencia
```bash
npm run test:all
```

---

## Estructura del proyecto

```
qa-automation-suite/
├── frontend-tests/
│   └── suite.spec.js        # 6 pruebas E2E con Playwright
├── backend-tests/
│   ├── api-server.js        # Servidor Express local (sujeto de prueba)
│   └── api.test.js          # 13 pruebas de API con Jest + Supertest
├── reports/                 # Reportes generados (gitignored)
├── playwright.config.js     # Configuración de Playwright
├── jest.config.js           # Configuración de Jest
├── package.json
└── README.md
```

---

## Casos de prueba — Frontend (Playwright)

| ID | Descripción | Qué valida |
|----|-------------|-----------|
| TC-F01 | Carga correcta de página principal | Título, banner y grilla de productos visibles |
| TC-F02 | Navegación a categoría "Travel" | Clic en sidebar + cambio de URL + encabezado correcto |
| TC-F03 | Paginación: 20 libros por página | `article.product_pod` count = 20 |
| TC-F04 | Página de detalle de libro | Botón "Add to basket" visible, precio en formato £X.XX |
| TC-F05 | Navegar a segunda página | Clic en "next" + URL page-2 + 20 libros nuevos |
| TC-F06 | Rating de estrellas | Clase CSS de rating (One–Five) presente en cada libro |

## Casos de prueba — Backend (Jest + Supertest)

| ID | Descripción | Qué valida |
|----|-------------|-----------|
| TC-B01 | Health check | GET /health → 200, campo `status: "ok"`, timestamp ISO válido |
| TC-B02 | Estructura JSON | GET /posts → campos `data[]`, `total`, `page`, `limit` con tipos correctos |
| TC-B03 | Post por ID | GET /posts/1 → datos correctos; GET /posts/999 → 404 con `error` |
| TC-B04 | Parámetros inválidos | userId no numérico → 400; POST sin campos → 422 con mensaje |
| TC-B05 | Autenticación | Sin token → 401; token malo → 401; token válido → 200 |
| TC-B06 | Crear recurso (POST) | POST /posts → 201, ID asignado, campos reflejados |
| TC-B07 | Paginación y filtrado | `_limit`, `userId`, `_page` producen subconjuntos correctos y disjuntos |
