const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://books.toscrape.com';

test('TC-F01 · Carga correcta de la página principal', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page).toHaveTitle(/Books to Scrape/i);
  const banner = page.locator('div.page-header');
  await expect(banner).toBeVisible();
  const primerLibro = page.locator('article.product_pod').first();
  await expect(primerLibro).toBeVisible();
});

test('TC-F02 · Navegación a categoría "Travel"', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.click('a[href="catalogue/category/books/travel_2/index.html"]');
  await expect(page).toHaveURL(/travel_2/i);
  const heading = page.locator('div.page-header h1');
  await expect(heading).toHaveText('Travel');
});

test('TC-F03 · Paginación: 20 libros por página', async ({ page }) => {
  await page.goto(BASE_URL);
  const libros = page.locator('article.product_pod');
  await expect(libros).toHaveCount(20);
});

test('TC-F04 · Página de detalle de libro', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.locator('article.product_pod h3 a').first().click();
  const precio = page.locator('p.price_color');
  await expect(precio).toBeVisible();
  const textoPrecio = await precio.textContent();
  expect(textoPrecio).toMatch(/£\d+\.\d{2}/);
  const descripcion = page.locator('div#product_description');
  await expect(descripcion).toBeVisible();
});

test('TC-F05 · Navegar a la segunda página de resultados', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.click('li.next a');
  await expect(page).toHaveURL(/catalogue\/page-2\.html/i);
  const libros = page.locator('article.product_pod');
  await expect(libros).toHaveCount(20);
});

test('TC-F06 · Libros muestran calificación de estrellas', async ({ page }) => {
  await page.goto(BASE_URL);
  const ratingsValidos = ['One', 'Two', 'Three', 'Four', 'Five'];
  const libros = page.locator('article.product_pod').first();
  const starElement = libros.locator('p.star-rating');
  await expect(starElement).toBeVisible();
  const clase = await starElement.getAttribute('class');
  const tieneRating = ratingsValidos.some(r => clase.includes(r));
  expect(tieneRating).toBe(true);
});