# Enlaces del TP6 (borrador de trabajo)

## Tarea 1: el artefacto

| # | Qué | Enlace | Estado |
|---|---|---|---|
| 1 | Job de la corrida del PR: tests en verde, «Entrar al registry» **salteado** (eslabón 2: sólo `main` publica) | https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/38296933814/job/114970156619 | ✅ |
| 2 | Job de la corrida de `main`: «Construir y publicar la imagen» es el **último** paso (eslabón 3: publicar va después de los tests) | https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/38298894032/job/114976659969 (commit `486fac8`, merge del PR #35) | ✅ |
| 3 | Paquete público del backend, etiquetado con el commit del merge | https://github.com/Candelariaarolon/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend (tag `sha-486fac823a7249fc94d6584f0faa8241ca9c61ff`) | ✅ |
| 4 | Paquete público del frontend, etiquetado con el commit del merge | https://github.com/Candelariaarolon/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend (tag `sha-486fac823a7249fc94d6584f0faa8241ca9c61ff`) | ✅ |

Comprobación sin credenciales (`docker pull` con una config de Docker vacía, sin login): ✅ las dos imágenes bajan (2026-10-12).

## Tareas 2 a 4: los entornos (vivos hasta la defensa)

| # | Qué | Enlace | Estado |
|---|---|---|---|
| 5 | Front de QA | https://curatta-front-qa.onrender.com | ✅ |
| 6 | API de QA (`/api/health`) | https://curatta-api-qa.onrender.com/api/health | ✅ |
| 7 | Front de PROD | https://curatta-front-prod.onrender.com | ✅ |
| 8 | API de PROD (`/api/health`) | https://curatta-api-prod.onrender.com/api/health | ✅ |

## Para la defensa (no los pide la entrega)

| Qué | Enlace |
|---|---|
| Deploy a QA desde el pipeline, smoke en verde. Muestra el cold start, la versión vieja contestando 200 y después el commit nuevo (`fec9075`) | https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/38497352579/job/115636374140 |
| Primer intento de `deploy-qa`, rojo: el smoke cortaba en el primer timeout por `bash -e` (problema encontrado). El hook sí desplegó `d0b0c27` | https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/38494536121 |
| PR #36: preparar la app (health, proxy del front) | https://github.com/Candelariaarolon/ingsoft3-tp01/pull/36 |
| PR #37: job `deploy-qa`, con `deploy-qa` *skipped* en el PR (los PRs no despliegan) | https://github.com/Candelariaarolon/ingsoft3-tp01/pull/37 |
| PR #38: arreglo del smoke | https://github.com/Candelariaarolon/ingsoft3-tp01/pull/38 |

## Tarea 4: el gate humano

| Qué | Enlace | Estado |
|---|---|---|
| **Rechazo con motivo** (obligatorio): corrida del commit `0f5e555` (PR de docs), `deploy-prod` rechazado por mí. Motivo: todavía no había un deploy a PROD completo y verificado, y no había comprobado que los hooks de PROD apuntaran a los servicios de PROD | https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/38502351304 | ✅ |
| Verificación prometida en el rechazo: el `srv-` de cada hook de PROD coincide con el de su servicio (api-prod `srv-db6nbie7bikc73alb5pg`, front-prod `srv-db72jnu7bikc739vn5tg`) | Render → Settings → Deploy Hook | ✅ |
| **Aprobación** con cambio visible (landing: «ropa de segunda mano») → smoke de PROD verde con api y front en `ec41210`. Corrida completa: QA automático → Waiting for review → aprobado por mí → PROD | https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/38626563413 (job `deploy-prod`: https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/38626563413/job/116142878993) | ✅ |
| Corrida aprobada con el hook del front cruzado (`cfbc418`): job verde, pero el front de PROD no se actualizó (problema encontrado) | https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/38503805832 | — |
| Aprobación por error, cancelada (`9822303`): cancelar no deshizo el deploy (problema encontrado) | https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/38499151710 | — |

## Lo que NO va acá (se ve navegando el repo)

Deploy a QA tras el merge, smoke, «Waiting for review», aprobación, rechazo con
motivo (*Actions*); qué commit está en cada entorno (*Deployments*); la `v6.0.0`
(*Releases*).

---

# TP7 

## La cadena (Tarea 1)
- Primera corrida con imgURL hasta PROD (`ea2acfd`): https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/38981289295
- Primera corrida con las dos suites verdes hasta PROD (`d99988f`): https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/39321916346

## Integración VERDE + e2e ROJA frenando la promoción (Tarea 4)
- Commit que rompió la app (texto del botón «Publicar» → «Subir prenda»): https://github.com/Candelariaarolon/ingsoft3-tp01/commit/4e98317
- Corrida: https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/39325200411 (smoke verde, integracion 3/3 verde, e2e 3/3 roja, deploy-prod skipped)
- Reporte integración (verde): https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/39325200411/artifacts/12221908359
- Reporte e2e (rojo): https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/39325200411/artifacts/12222531464
- Corrida completa en verde posterior, hasta PROD (`196b403`, el arreglo): https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/39491690688
