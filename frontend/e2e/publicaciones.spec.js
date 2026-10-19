import path from 'node:path'
import { expect, test } from '@playwright/test'

const FOTO = path.join(__dirname, 'fixtures', 'prenda.jpg')

// Publicar exige sesión: entra como lo hace una persona, con el usuario de
// prueba de QA (variables de entorno, secrets en el pipeline).
async function iniciarSesion (page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(process.env.E2E_EMAIL)
  await page.getByLabel('Contraseña').fill(process.env.E2E_PASSWORD)
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL(/\/buscar/)
}

test('publicar una prenda la muestra en Mis publicaciones, y eliminarla la saca', async ({ page }) => {
  await iniciarSesion(page)
  await page.goto('/publicaciones/nueva')
  const nombre = `e2e ${Date.now()}`                    // único: no choca con otra corrida
  await page.getByLabel('Foto').setInputFiles(FOTO)
  await page.getByLabel('Nombre').fill(nombre)
  await page.getByLabel('Precio').fill('1500')
  await page.getByRole('button', { name: 'Publicar' }).click()
  await expect(page).toHaveURL(/\/mis-publicaciones/)
  await expect(page.getByText(nombre)).toBeVisible()    // el dato que ESTE test creó, sin sleeps
  await page.getByRole('button', { name: `Eliminar ${nombre}` }).click()
  await expect(page.getByText(nombre)).toHaveCount(0)   // y el borrado, comprobado
})

test('un precio en cero muestra el error y no publica nada', async ({ page }) => {
  await iniciarSesion(page)
  await page.goto('/publicaciones/nueva')
  const nombre = `e2e ${Date.now()}`
  await page.getByLabel('Foto').setInputFiles(FOTO)
  await page.getByLabel('Nombre').fill(nombre)
  await page.getByLabel('Precio').fill('0')
  await page.getByRole('button', { name: 'Publicar' }).click()
  await expect(page.getByRole('alert')).toBeVisible()   // el usuario ve el error…
  await page.goto('/mis-publicaciones')
  await expect(page.getByText(nombre)).toHaveCount(0)   // …y en la lista no apareció nada
})

test('editar el precio de una publicación lo guarda: sigue ahí al recargar', async ({ page }) => {
  await iniciarSesion(page)
  await page.goto('/publicaciones/nueva')
  const nombre = `e2e ${Date.now()}`
  await page.getByLabel('Foto').setInputFiles(FOTO)
  await page.getByLabel('Nombre').fill(nombre)
  await page.getByLabel('Precio').fill('1500')
  await page.getByRole('button', { name: 'Publicar' }).click()
  await expect(page.getByText(nombre)).toBeVisible()

  await page.getByRole('button', { name: `Editar ${nombre}` }).click()
  await page.getByLabel(`Precio de ${nombre}`).fill('2750')
  await page.getByRole('button', { name: `Guardar ${nombre}` }).click()
  await page.reload()                                   // lo que importa es lo que quedó en la base
  const tarjeta = page.locator('article', { hasText: nombre })
  await expect(tarjeta.getByText('$2.750')).toBeVisible()

  await page.getByRole('button', { name: `Eliminar ${nombre}` }).click()
  await expect(page.getByText(nombre)).toHaveCount(0)
})
