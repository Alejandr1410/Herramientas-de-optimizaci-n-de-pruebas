# Reporte Técnico — Automatización de Pruebas de Software
**Ingeniería en Tecnología y Soluciones de Negocio · Ingeniería de Software**

---

## 1. Justificación de herramientas

### Frontend — Playwright
Playwright es desarrollado y mantenido por Microsoft. Se eligió sobre Cypress y Selenium por las siguientes razones:

- **Instalación simple:** un solo comando (`npx playwright install`) configura el navegador y el entorno sin dependencias externas adicionales.
- **Multi-navegador nativo:** soporta Chromium, Firefox y WebKit desde la misma API.
- **API moderna:** usa `async/await` de forma nativa, lo que hace el código legible y fácil de mantener.
- **Reportes incluidos:** genera reportes HTML detallados con capturas y videos de fallos sin plugins adicionales.
- **Adopción industrial:** usado en producción por empresas como GitHub, Adobe y VS Code.

**Sitio sujeto de prueba:** `https://books.toscrape.com`  
Sitio diseñado explícitamente para práctica de scraping y testing automatizado. Tiene estructura HTML semántica, categorías navegables, paginación y páginas de detalle; cubre todos los escenarios de prueba requeridos sin riesgo de bloqueos o captchas.

### Backend — Jest + Supertest
- **Jest** es el framework de testing de JavaScript más usado en el ecosistema Node.js. Ofrece afirmaciones (`expect`), suite organización (`describe`/`test`), y reporte detallado con pass/fail en consola.
- **Supertest** permite hacer peticiones HTTP reales al servidor Express sin necesitar que el servidor esté corriendo en un puerto externo. Esto hace las pruebas deterministas, rápidas y sin dependencias de red.
- La combinación Jest + Supertest es el estándar de facto para pruebas de API REST en Node.js.

**API sujeto de prueba:** Servidor Express local (`api-server.js`)  
Se construyó un servidor REST propio con el patrón de JSONPlaceholder para garantizar que las pruebas corran en cualquier entorno (sin internet, sin tokens externos, sin límites de rate).

---

## 2. Descripción de casos de prueba

### Suite Frontend (Playwright)

#### TC-F01 — Carga correcta de la página principal
**Qué valida:** Que el sitio carga correctamente en condiciones normales.  
**Por qué es relevante:** Es la prueba de humo (*smoke test*) fundamental. Si la página no carga, ninguna otra prueba tiene sentido. Verifica el título del documento, la presencia del banner y que la grilla de productos existe.

#### TC-F02 — Navegación a categoría "Travel"
**Qué valida:** Que la navegación por el sidebar de categorías funciona y carga la página correcta.  
**Por qué es relevante:** La navegación es la función central de un e-commerce. Verifica que el enlace cambia la URL y que el encabezado del filtro es correcto.

#### TC-F03 — Paginación: 20 libros por página
**Qué valida:** Que la grilla de productos tiene exactamente 20 ítems en la primera página.  
**Por qué es relevante:** El conteo de elementos por página es un requerimiento de negocio explícito. Una regresión en la paginación afectaría la experiencia del usuario directamente.

#### TC-F04 — Página de detalle de libro
**Qué valida:** Que al hacer clic en un libro, la página de detalle muestra el botón de compra y el precio en formato correcto (£X.XX).  
**Por qué es relevante:** El flujo de compra comienza aquí. Un precio mal formateado o un botón ausente bloquearían la conversión.

#### TC-F05 — Navegar a la segunda página de resultados
**Qué valida:** Que el botón "next" funciona, la URL refleja la página correcta y la segunda página tiene nuevos productos.  
**Por qué es relevante:** La paginación de resultados es esencial en catálogos grandes. Verifica tanto la navegación como que no se repiten productos.

#### TC-F06 — Libros muestran calificación de estrellas
**Qué valida:** Que el elemento de rating (CSS clase `star-rating One/Two/Three/Four/Five`) está presente en los libros.  
**Por qué es relevante:** Los ratings influyen directamente en decisiones de compra. Verifica que el componente de UI se renderiza correctamente.

---

### Suite Backend (Jest + Supertest)

#### TC-B01 — Health check del servidor
**Qué valida:** Que el endpoint `/health` responde 200 con `status: "ok"` y un timestamp ISO válido.  
**Por qué es relevante:** Los health checks son el primer monitoreo de cualquier servicio en producción. Si falla, el orquestador (Kubernetes, AWS ECS) marcará el servicio como caído.

#### TC-B02 — Estructura del JSON de respuesta
**Qué valida:** Que `GET /posts` devuelve un objeto con los campos `data`, `total`, `page`, `limit` y que `data` es un arreglo con objetos que tienen `id`, `userId`, `title`, `body` con los tipos correctos.  
**Por qué es relevante:** Los contratos de API son críticos en arquitecturas de microservicios. Un campo faltante o con tipo incorrecto rompe a todos los consumidores.

#### TC-B03 — Obtener post por ID (éxito y 404)
**Qué valida:** Que un ID válido retorna el recurso correcto y que un ID inexistente retorna 404 con un campo `error`.  
**Por qué es relevante:** Prueba el camino feliz y el camino de error del mismo endpoint. El 404 apropiado permite a los clientes distinguir "no existe" de "error del servidor" (500).

#### TC-B04 — Manejo de parámetros inválidos
**Qué valida:** Que `userId=abc` (no numérico) retorna 400, y que un POST sin campos obligatorios retorna 422.  
**Por qué es relevante:** La validación de inputs es la primera línea de defensa contra errores. Los códigos 400 y 422 son semánticamente distintos y los clientes deben poder reaccionar diferente ante cada uno.

#### TC-B05 — Autenticación y control de acceso
**Qué valida:** Tres escenarios: sin token → 401, token inválido → 401, token válido → 200 con datos.  
**Por qué es relevante:** Es la prueba de seguridad más fundamental. Verifica que los recursos protegidos no son accesibles sin credenciales y que el servidor distingue tokens válidos de inválidos.

#### TC-B06 — Crear recurso (POST) y respuesta 201
**Qué valida:** Que `POST /posts` con datos válidos crea el recurso, retorna código 201 (Created), asigna un ID numérico y refleja los campos enviados.  
**Por qué es relevante:** Verifica la creación de recursos, que es uno de los casos de uso principales de cualquier API REST. El código 201 (no 200) es el comportamiento correcto según HTTP semántico.

#### TC-B07 — Paginación y filtrado de resultados
**Qué valida:** Tres sub-casos: `_limit` limita resultados, `userId` filtra correctamente, y `_page` produce páginas disjuntas.  
**Por qué es relevante:** Las APIs sin paginación correcta son inutilizables con datasets grandes. Este test verifica que los parámetros de query producen subconjuntos correctos y que las páginas no se solapan.

---

## 3. Resultados obtenidos

### Backend — Jest + Supertest
```
PASS backend-tests/api.test.js

  TC-B01 · Health check del servidor
    ✓ GET /health responde 200 con status "ok" (23 ms)

  TC-B02 · Estructura del JSON de respuesta
    ✓ GET /posts devuelve estructura paginada correcta (6 ms)

  TC-B03 · Obtener post por ID
    ✓ GET /posts/1 retorna el post correcto (4 ms)
    ✓ GET /posts/999 retorna 404 con mensaje de error (4 ms)

  TC-B04 · Manejo de parámetros inválidos
    ✓ GET /posts?userId=abc retorna 400 (userId no numérico) (4 ms)
    ✓ POST /posts sin campos requeridos retorna 422 (23 ms)

  TC-B05 · Autenticación y control de acceso
    ✓ GET /users sin token retorna 401 (4 ms)
    ✓ GET /users con token inválido retorna 401 (3 ms)
    ✓ GET /users con token válido retorna 200 y lista de usuarios (6 ms)

  TC-B06 · Crear nuevo post (POST)
    ✓ POST /posts crea un recurso y retorna 201 (4 ms)

  TC-B07 · Paginación y filtrado
    ✓ GET /posts?_limit=2 retorna máximo 2 resultados (3 ms)
    ✓ GET /posts?userId=1 filtra solo posts del usuario 1 (2 ms)
    ✓ GET /posts?_page=2&_limit=2 retorna la segunda página (4 ms)

Tests: 13 passed, 13 total
Time:  1.02 s
```

### Frontend — Playwright
Las pruebas fueron diseñadas y validadas contra `books.toscrape.com`. Para ejecutarlas, instala las dependencias y corre `npm run test:frontend`. El reporte HTML en `reports/playwright-report/index.html` mostrará los resultados con capturas de pantalla de cualquier fallo.

---

## 4. Lecciones aprendidas

**Playwright vs Selenium:** Playwright resultó significativamente más fácil de configurar. Selenium requiere descargar y gestionar WebDrivers por separado; Playwright lo hace todo con un comando.

**Supertest elimina la dependencia de red:** Al usar Supertest directamente contra la instancia de Express, las pruebas de backend corren en ~1 segundo sin necesitar servidor levantado ni internet. Esto las hace ideales para CI/CD.

**Diseñar para independencia:** Cada prueba debe poder correr sola, sin depender del estado que dejó otra prueba. Esto nos obligó a pensar cuidadosamente el orden de `POST` vs `GET` en los tests de backend.

**Pruebas de contrato antes de pruebas de negocio:** Verificar la estructura del JSON (TC-B02) antes de hacer afirmaciones de valores concretos (TC-B03) hace que los errores sean más fáciles de diagnosticar.

**Sitios de práctica públicos:** `books.toscrape.com` y `jsonplaceholder.typicode.com` son recursos diseñados para testing que no bloquean ni tienen captchas. Son preferibles a sitios de producción reales para evitar fallos intermitentes.
