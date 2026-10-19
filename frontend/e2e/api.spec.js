import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

// La api tiene su propia dirección: NO es la del front. Sin barra al final.
const API = process.env.API_BASE_URL || 'http://localhost:4001'

// Una foto chica de verdad, como data URL: es lo que el front le manda a la api.
const FOTO = 'data:image/jpeg;base64,' +
  readFileSync(path.join(__dirname, 'fixtures', 'prenda.jpg')).toString('base64')

// Publicar exige sesión: el usuario de prueba de QA, que viene por variables
// de entorno (secrets en el pipeline), nunca escrito en el código.
async function login (request) {
  const r = await request.post(`${API}/api/auth/login`, {
    data: { email: process.env.E2E_EMAIL, password: process.env.E2E_PASSWORD },
  })
  expect(r.status()).toBe(200)
}

// una ayuda, para no repetir: pide la lista y la devuelve ya convertida
async function listar (request) {
  const r = await request.get(`${API}/api/publicaciones`)
  expect(r.status()).toBe(200)
  return (await r.json()).publicaciones
}

test('el alta guarda en la base de verdad, y el borrado la saca', async ({ request }) => {
  await login(request)
  const nombre = `api ${Date.now()}`                       // único: no choca con otra corrida
  const alta = await request.post(`${API}/api/publicaciones`, {
    data: { nombre, precio: 1500, foto: FOTO },
  })
  expect(alta.status()).toBe(200)                          // mi api contesta 200 al crear
  const { publicacion: creada } = await alta.json()

  const lista = await listar(request)                      // y la BASE la devuelve: no es un doble
  expect(lista.some(p => p.nombre === nombre)).toBe(true)

  const borrado = await request.delete(`${API}/api/publicaciones/${creada.id}`)
  expect(borrado.status()).toBe(200)

  const despues = await listar(request)                    // y el borrado, comprobado
  expect(despues.some(p => p.nombre === nombre)).toBe(false)
})

test('un nombre vacío lo rechaza la api, y no crea nada', async ({ request }) => {
  await login(request)
  const antes = await listar(request)

  const alta = await request.post(`${API}/api/publicaciones`, {
    data: { nombre: '', precio: 1500, foto: FOTO },
  })
  expect(alta.status()).toBe(400)                          // el contrato del error

  const despues = await listar(request)
  expect(despues.length).toBe(antes.length)                // y de verdad no se creó nada
})

test('una publicación vendida ya no se puede modificar', async ({ request }) => {
  await login(request)
  const nombre = `api ${Date.now()}`
  const alta = await request.post(`${API}/api/publicaciones`, {
    data: { nombre, precio: 1500, foto: FOTO },
  })
  expect(alta.status()).toBe(200)
  const { publicacion: creada } = await alta.json()

  const vendida = await request.patch(`${API}/api/publicaciones/${creada.id}`, {
    data: { estado: 'vendida' },
  })
  expect(vendida.status()).toBe(200)                       // la base guardó el estado nuevo

  const cambio = await request.patch(`${API}/api/publicaciones/${creada.id}`, {
    data: { precio: 1 },
  })
  expect(cambio.status()).toBe(409)                        // y la regla la aplica sobre lo guardado

  const borrado = await request.delete(`${API}/api/publicaciones/${creada.id}`)
  expect(borrado.status()).toBe(200)                       // limpia lo que creó…
  const despues = await listar(request)
  expect(despues.some(p => p.nombre === nombre)).toBe(false)   // …y lo comprueba
})
