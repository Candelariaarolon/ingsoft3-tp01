# TP1: Git colaborativo

## 1. Por qué Git no pudo resolver el conflicto solo

Git resuelve automáticamente cuando los cambios están en líneas distintas del archivo, o no se "pisan" entre sí. El conflicto que fabricamos fue lo contrario: dos ramas (`feature/título-b` y `feature/título-a`) modificaron la misma línea (el título del README) con contenido distinto. Ahí, Git no tiene forma de saber cuál de las dos versiones es la que quiero conservar, porque los dos cambios se quieren hacer en el mismo lugar. Por eso Git avisa y el usuario decide cuál queda (puedo elegir una, la otra, o crear un mix nuevo de ambas).

**¿Qué habría tenido que pasar para que nunca apareciera?** Debería haber hecho pull/rebase de `main` en el momento de la segunda modificación, antes de tocar esa misma línea. Pull o rebase son formas de traer esos cambios nuevos de `main` a mi rama antes de terminar mi trabajo, para revisar si hay problemas en vez de enterarme del conflicto recién al momento de mergear. En el caso de trabajar en equipo, también se puede acordar no tocar la misma línea al mismo tiempo.

## 2. Problemas encontrados y cómo los solucioné

- **Hice un commit en `main` para probar que la protección de rama me frenae, pero me olvide de deshacerlo.** Efectivamente me frenó pero el commit se guarda local y recién con `push` se manda al remoto. Entonces aunque el push falló, seguía teniendo ese commit de prueba colgado en mi `main` local, y al principio no me di cuenta que necesitaba sacarlo para que quedara igual al de GitHub. 

- **Se me creó una rama con nombre automático (`Candelariaarolon-patch-1`)** en vez de seguir la convención `feature/`, porque edité el archivo directo desde la interfaz web de GitHub y, como la rama estaba protegida, GitHub me ofreció crear una rama nueva sola con ese nombre genérico. Aprendí a fijarme en ese campo antes de confirmar y podía haberlo cambiado a algo tipo `feature/descripciondeloqueestabahaciendo` antes de crear el PR.

- **Dejé un placeholder sin reemplazar en el primer commit del README.** Al principio pensé que tenía que deshacer todo y volver a armar el PR de cero, como si haber dejado ese error en el primer commit ya lo hubiera arruinado. Pero después me di cuenta de que no hacía falta, porque un PR no es una foto fija de ese primer commit: es un puntero a toda la rama completa. Cualquier commit nuevo que pusheara a esa misma rama se iba a sumar automáticamente al mismo PR ya abierto, como un commit más en la conversación. Por eso, en vez de rehacer todo, solo corregí el placeholder y hice un commit nuevo:

```bash
  git add README.md
  git commit -m "fix: reemplazar placeholder"
  git push
```

  Con eso alcanzó: el PR se actualizó solo, mostrando el commit nuevo arriba del anterior, sin necesidad de cerrar nada ni abrir otro PR desde cero.

- **Terminé con ramas sueltas de intentos de PR cancelados a mitad de camino.** Esto pasa porque cuando abrís un PR, en realidad estás creando dos cosas separadas: la rama en sí, y el PR que la referencia. Si cancelás o cerrás el PR sin mergearlo, GitHub cierra la conversación del PR, pero la rama no se borra sola, queda viva en el repo. Terminé con varias ramas de prueba dando vueltas en el listado de branches. No rompían nada ni afectaban al resto del código, solo quedaban ahí ocupando lugar visualmente. Las borré a mano desde el listado de branches en GitHub, más que nada por prolijidad.

## 3. Declaración de uso de IA

Usé Claude y Claude Code dentro de mi repo como asistente para:

- Preguntar por comandos que no había terminado de entender, para saber qué hacía cada uno antes de correrlo.
- Preguntar por mensajes de error o inesperados en la terminal (como cuando se quedó el commit dando vueltas).
- Guiarme paso a paso en la resolución del conflicto de merge.

Cuando dudaba de algo de la consigna, le mostraba un screenshot de lo que estaba pasando en pantalla para que me diera un double-check antes de confirmar el próximo paso. No le pedí que tomara decisiones de contenido por mí: el título elegido en el conflicto, los nombres de rama y los mensajes de commit los decidí yo.

---

# TP2: Contenedores

## 1. Qué elegí y por qué

Adapté un proyecto propio (Curatta, una app de moda que ya tenía armada) en un marketplace de ropa entre usuarios: inicialmente conectabas tu cuenta de Pinterest y te recomendaba en base a tus tableros de inspiración, pero para evitar usar esa conexión y complicar el proyecto, sin perder el mecanismo de búsqueda de ropa útil, le di una vuelta de rosca que también había pensado para la app original: cada usuario publica prendas y puede buscar prendas parecidas subiendo una foto, comparando contra las publicaciones de otros usuarios con Azure OpenAI Vision.

Elegí adaptar un proyecto mío en vez de arrancar de cero porque ya conocía el código y no partía de cero en nada, pero tuve que sacarle todas las integraciones externas que no aportaban a la materia (Tiendanube, Mercado Libre, Pinterest) y construir de cero el CRUD de publicaciones. Además, me interesa seguir trabajando sobre este proyecto a futuro.

### Contra los cinco criterios de la guía

- **¿Puedo ejecutarla hoy?** Sí, la probé clonando el repo en una carpeta aislada y levantándola solo con `docker-compose.yml` y el `.env`.

- **¿Conozco los comandos de compilación y ejecución?** Sí, y son los mismos para los dos servicios porque ambos son Next.js: se compila con `npm run build` (corre `next build`) y se arranca con `npm start` (`next start -p 4000` en el backend, `-p 3000` en el frontend, definidos en el `package.json` de cada uno). El backend además corre `prisma generate` en el postinstall y `prisma migrate deploy` al arrancar el contenedor, para que el schema quede al día antes de aceptar tráfico.

- **¿Sé dónde se configura la conexión a la base, y es parametrizable por variable de entorno?** Sí: vive en `backend/prisma/schema.prisma`: `url = env("DATABASE_URL")`. Dice `env` porque no está hardcodeada en ningún lado: para apuntar a otra base (dev, QA, la del contenedor) alcanza con cambiar la variable de entorno, sin tocar código ni recompilar.

- **¿Tiene lógica para testear (TP5)?** 
  **Backend:**
  - Email único por usuario.
  - El precio debe ser mayor a 0, validado tanto al crear como al editar una publicación.
  - Una publicación vendida no se puede modificar.
  - Autorización: un usuario solo puede editar/eliminar sus propias publicaciones 
  - La búsqueda por foto excluye las publicaciones propias de quien busca y solo compara contra publicaciones disponibles
  - Umbral de match: un score no cuenta como coincidencia salvo que supere 60/100 
  - Compatibilidad por formalidad: una prenda "deportiva" nunca compite en el matching con prendas de calle, aunque compartan corte/color/patrón
  - Límite de tamaño de foto al crear una publicación (rechaza fotos de más de ~7MB en base64)

  **Frontend:**
  - El formulario de nueva publicación no deja enviar sin nombre, sin precio válido (>0) o sin foto
  - La tarjeta de una publicación cambia sus acciones según el estado: disponible o no disponible
  - La edición inline repite la misma validación de nombre/precio que la creación, antes de guardar

- **¿La entiendo lo suficiente para modificarla?** Sí, la adapté yo misma partiendo de un proyecto propio.

### Consideraciones adicionales

- **Dependencias externas:** la única dependencia no trivial es Azure OpenAI Vision para el matching por foto, ya hablada y autorizada con el profesor. El resto de la app (publicar, editar, borrar, marcar como vendida) no depende de ella: si las credenciales no están configuradas, esas funciones andan normal y solo la búsqueda por foto muestra un error en vez de resultados.

## 2. Decisiones de contenerización

- **Imágenes base:** `node:20-slim` en las dos etapas de los dos Dockerfiles, en vez de `alpine`. Prisma necesita `openssl` disponible en runtime para su motor de queries, y `alpine` complica esto por usar una libc distinta (musl).

- **Multi-stage:** cada Dockerfile tiene una etapa `build` (código fuente completo y dependencias de compilación) y una etapa `final` que solo copia lo necesario para correr (`COPY --from=build ...`), así el código crudo y las herramientas de build no viajan a la imagen que termina corriendo. En el frontend esto se nota más porque usa `output: "standalone"` de Next.js (ni siquiera copia `node_modules` completo); en el backend sí se copia entero porque el `CMD` corre `prisma migrate deploy` al arrancar.

- **Qué persiste y qué no:** solo la base de datos tiene estado, en un volumen nombrado `db_data:/var/lib/postgresql/data`. Backend y frontend son *stateless*, sin volúmenes propios. Lo confirmé con `docker compose down` (sin `-v`) seguido de `up`: los datos seguían ahí. Con `down -v` sí se borraron, confirmando que ese flag es el que limpia el volumen.

## 3. Problemas encontrados

- **Después de hacer el push de las imágenes al registry, quise confirmar que habían quedado públicas haciendo un `docker pull`.** Docker me contestó "Image is up to date" sin bajar nada. Al toque pensé que estaba todo bien, pero en realidad esa prueba no servía para nada: yo ya tenía esa imagen guardada en mi disco porque la acababa de construir ahí mismo, así que Docker ni se molestó en ir a buscar nada al registry, solo miró que ya la tenía y cortó ahí. O sea que ese pull hubiera dado el mismo resultado estando la imagen pública o privada, porque nunca llegó a probar el permiso real.
Para hacer la prueba de verdad, primero me deslogueé del registry con `docker logout`, después borré la copia local de la imagen con `docker rmi` (usando los dos nombres que tenía, porque si no me quedaba una copia con otro tag), y recién ahí repetí el pull. Esa vez sí bajó capa por capa, sin que yo tuviera ninguna sesión iniciada, y eso sí confirma que la imagen es pública de verdad: cualquiera sin credenciales la puede bajar.

## 4. Declaración de uso de IA

Usé Claude para entender la diferencia entre el puerto publicado y la conexión interna de Docker. También, ya que el profe nos daba los Dockerfiles de base pero los teníamos que ajustar usando las tablas a nuestro stack, lo usé para hacer double check y revisar los Dockerfiles multi-stage y el `docker-compose.yml`. También lo usé para diagnosticar el problema del remoto desconectado antes de tocar el repositorio, y para verificar paso a paso (con `docker logout` + `rmi` + `pull`) que las imágenes en GHCR quedaran realmente públicas y no solo en caché local.

En los pasos con riesgo real (borrar imágenes, tocar el remoto de git, hacer push) confirmé cada uno antes de que se ejecutara. Las decisiones de contenido —qué imagen base usar, qué sacar del compose, qué texto va en este documento— las tomé yo.

---

# TP3: Planificación y trazabilidad

## 1. Duración del sprint

1 semana. En clase hacemos un TP nuevo cada semana, así que ese es mi ciclo de trabajo: cada sprint tiene como Sprint Goal completar (o avanzar sustancialmente) el TP de esa semana. La entrega formal a la cátedra ocurre cada 5 clases (5 semanas). Cada TP se cierra con su propio tag y release. Mi sprint de una semana coincide exactamente con ese ciclo: 1 sprint = 1 TP = 1 release.

No hice el sprint del tamaño de la cantidad de semanas hasta la evaluación de P1 (que agrupa varios TPs para la nota) porque esa es una instancia de calificación, no una unidad de entrega de software, y no tiene un release propio. Igualar el sprint a esa cantidad de semanas habría disminuido o eliminado la oportunidad de obtener el feedback semanal que necesito para no llegar a cada entrega con problemas o errores acumulados.

## 2. Límite de trabajo en progreso

2. Sigo la regla de arranque de la guía: cantidad de personas + 1. Trabajando sola, eso da 2. El "+1" es la válvula para cuando algo queda esperando (una revisión, una respuesta) y necesito avanzar en otra cosa mientras tanto, sin que el límite deje de limitar.

Elegí no ir más alto (3 o 4) porque un número mayor diluye el propósito del límite: terminaría con varias cosas a medio hacer en simultáneo, que es exactamente el "inventario" que la guía advierte evitar.

**Señal para ajustarlo en el futuro:** si nunca llego a alcanzar el límite de 2, está demasiado alto; si me quedo bloqueada esperando poder empezar algo nuevo con frecuencia, lo subiría a 3.

## 3. Diagnóstico de la historia mal escrita (#15)

> "Como desarrollador quiero crear la tabla usuarios"

**¿Por qué está mal escrita? ¿Cómo la reescribirías?**

Está mal escrita porque habla desde el punto de vista del desarrollador, no del de alguien que usa el sistema. No tiene ningún criterio de aceptación verificable, y está escrita como una tarea técnica. La reescribiría desde el punto de vista del usuario: "Como usuario quiero registrarme con mi email para poder acceder a la plataforma", y "crear la tabla usuarios" sería una de las tareas técnicas que necesito completar para cumplir con esa HU.

## 4. Problemas encontrados

- **Freeze de VS Code al clonar el repo.** El proceso responsable no era una extensión sino un servicio nativo de macOS ("Open and Save Panel Service"), bloqueado por la sincronización de iCloud Drive: tenía el repo clonado dentro de `~/Desktop`, y macOS intenta sincronizar cada archivo nuevo apenas se crea. Se resolvió moviendo el proyecto a `~/Developer`, una carpeta que iCloud no sincroniza.

- **`gh project list` fallaba con `missing required scopes [read:project]`.** El token de `gh auth login` no pedía scope de proyectos por default. Se resolvió con `gh auth refresh -s project`, que reautentica agregando ese permiso sin perder la sesión existente.

## 5. Declaración de uso de IA

Usé Claude sobre todo para verificar, no para generar. El TP lo hice de forma manual, siguiendo paso a paso los mismos comandos que dio el profesor en la guía. A diferencia del TP2 (Docker), acá los comandos con `gh` no dependen del stack de mi aplicación sino que son genéricos a cualquier repositorio de GitHub, así que no tenía sentido pedirle ayuda "a medida" como en el TP2. Lo usé para mostrarle capturas de mi board en GitHub y, más que nada, si no encontraba alguna opción a la vista, para que me ayude a saber dónde estaba cierto botón.

---

# TP4: Integración continua

## 1. Estructura elegida del pipeline

Dos jobs, `build-backend` y `build-frontend`, sin `needs:` entre ellos, así que GitHub Actions los agenda en paralelo en dos runners distintos. Elegí esa separación porque refleja la separación real de mi app: `backend/` y `frontend/` son dos servicios independientes en `docker-compose.yml`, cada uno con su propio Dockerfile y su propio build context, que ya venían desacoplados desde el TP2. No tenía sentido meterlos en un solo job secuencial: no hay ninguna dependencia real entre construir la imagen del backend y construir la del frontend, así que hacerlo en serie solo sumaría tiempo de espera sin ganar nada.
La otra razón para separarlos en dos jobs (y no un solo job con dos steps) es la señal que da el PR: cada job es un check independiente y requerido. Si algo rompe, veo de entrada cuál de las dos imágenes falló (`CI / build-backend` o `CI / build-frontend`) sin tener que abrir el log. Con un solo job monolítico, un fallo del frontend hubiera dejado en rojo un check que dice "build" a secas, y tendría que entrar igual a leer el log para saber cuál de los dos componentes rompió.

## 2. Qué cachea el pipeline y qué pasa si el cache desaparece

Cada job usa `docker/build-push-action` con `cache-from`/`cache-to: type=gha`, y un `scope` distinto por servicio (`scope: backend`, `scope: frontend`). Esto usa el cache de GitHub Actions como backend de cache de BuildKit, separado por scope para que el cache del backend y el del frontend no se pisen entre sí (son capas completamente distintas, de Dockerfiles distintos).

Lo que se reutiliza en la práctica son las capas de BuildKit anteriores al `COPY . .`: el pull de la imagen base (`node:20-slim`) y, sobre todo, la capa de `RUN npm install`, porque el Dockerfile (heredado del TP2) copia `package.json`/`package-lock.json` (y `prisma/` en el backend) *antes* de copiar el resto del código. Mientras no cambien las dependencias, esa capa se reutiliza intacta aunque cambie código de la app. Lo que **no** se cachea de forma útil es todo lo que viene después: `COPY . .`, `RUN npm run build` y el copiado a la etapa final se vuelven a ejecutar en cada build, porque dependen del contenido del código fuente, que cambia en cada commit.

Si el cache desapareciera (primera corrida del pipeline, cache expirado por falta de uso, o un cambio de `scope`), el pipeline no se rompe: `cache-from` simplemente no encuentra nada que reusar y Buildx hace el build completo desde cero (pull de la imagen base, `npm install` entero, `npm run build` entero). Es más lento, pero sigue siendo correcto — el cache es una optimización de velocidad, no algo de lo que dependa la corrección del build.

## 3. Por qué el pipeline construye con mi Dockerfile en vez de compilar por su cuenta

Mi app ya se construye de una manera: el Dockerfile de cada servicio (backend y frontend), armado en el TP2. El pipeline no inventa otra forma de construir la app sino que usa ese mismo Dockerfile porque si el pipeline compilara por su cuenta con `npm` directamente, tendría dos definiciones de build para lo mismo, y esas dos definiciones tarde o temprano divergen lo que significa que alguien cambia la versión de Node o agrega una dependencia del sistema en el Dockerfile (como el `openssl` que necesita Prisma) y se olvida de reflejarlo en el CI y terminaría verificando una compilación distinta de la que después despliego.

Esto no es solo teórico porque cuando rompí a propósito un import inexistente en `backend/lib/prisma.ts`, el check que se puso en rojo fue exactamente `CI / build-backend`, porque ese job corre `docker build ./backend` de verdad, el mismo comando que hubiera fallado si yo intentaba buildear esa imagen para deployarla.

## 4. Problemas encontrados

- **Comentarios `#` al final de línea en zsh y confusion porque seguia roto despues del fix para los comentarios** Usé varios comandos que copiaba y pegaba con comentarios inline (`echo '...' >> archivo   # explicación`) asumiendo el comportamiento de bash, donde `#` descarta el resto de la línea. Tenia abierta la terminal zsh, que no trata `#` como comentario entonces el texto del comentario quedo como contenido real dentro de `backend/lib/prisma.ts`. Se resuelve evitando comentarios `#` al final de línea en zsh, o activando esa opción en el `.zshrc`. Por eso es que hay un fix de mas. Después de sacar el texto que estaba de mas, hice un commit `fix: saco basura que se coló por comentarios de zsh` y ese commit solo limpiaba el accidente de shell, no arreglaba la rotura intencional del pipeline. me asuste porque el check seguía en rojo después de ese commit y pensé que algo andaba mal, cuando en realidad era el comportamiento esperado: todavía no había hecho el commit que saca el `import` roto de verdad.

- **Confundí dos cosas distintas que comparten la palabra "outdated".** GitHub le puso la etiqueta "Outdated" a un comentario de revisión automática de Copilot en el PR de la rotura, porque el código que comentaba ya no existía (lo había borrado en un commit posterior). Yo lo interpreté como si fuera el banner que mencionaba el profe en el tp, el de "esta rama está desactualizada respecto a `main`" (la regla *Require branches to be up to date*) que estaba buscando en el otro PR (el de relleno). Son features completamente distintas de GitHub que casualmente comparten la palabra "outdated": una es sobre un comentario de revisión quedando obsoleto, la otra es sobre una rama quedando desactualizada respecto a la base. El banner real de rama desactualizada solo aparece *después* de mergear el PR que mueve `main`, como lo aclaraba el pdf del profe, no antes.

## 5. ACLARACIÓN MÍA: Baja de Tienda Nube y contacto por WhatsApp

Le saqué a la app la integración con Tienda Nube por lo recomendado para la eleccion de la app, para no depender de una integración de terceros que no aportaba a la materia (mismo criterio que ya había aplicado en el TP2 al sacar Pinterest y Mercado Libre). Al sacarla me quedó un gap real: sin ella, no había ninguna forma de que quien quiere comprar una prenda se contacte con quien la publicó.

Lo resolví agregando el teléfono como dato obligatorio del registro (`backend/app/api/auth/signup/route.ts`), normalizado a solo dígitos con código de país y sin "+" (`normalizarTelefono` en `backend/lib/telefono.ts`) y validado contra un rango de 8 a 15 dígitos antes de crear el usuario. Con ese dato, cada resultado de búsqueda por foto muestra un botón que arma un link `wa.me` directo a esa conversación (`linkWhatsapp` en `frontend/lib/whatsapp.ts`, usado en `BuscarPorFotoForm.tsx`), con un mensaje pre-cargado que menciona la prenda puntual que el comprador estaba mirando.

Elegí el link `wa.me` ("click to chat") en vez de la API de WhatsApp Business a propósito: es un link plano, no requiere cuenta de negocio ni credenciales ni costo — mismo principio que ya venía aplicando de evitar dependencias de terceros pagas o innecesarias para lo que pide la materia.

Como este cambio tocaba algo ya entregado y documentado en el TP2 (las imágenes en GHCR bajo `v0.1.0`), antes de avanzar le pedí el visto bueno al profesor por privado, mismo criterio que usé para Azure OpenAI Vision en el TP2. Confirmó que el razonamiento era correcto y dio el ok para avanzar.

### Actualización de las imágenes publicadas

Construí y pusheé las imágenes de backend y frontend a GHCR bajo el tag `v4.0.0`, sin tocar `v0.1.0` (los tags de un mismo repositorio en GHCR son inmutables mientras no se vuelva a pushear a ese tag puntual, así que `v0.1.0` — la evidencia del TP2 — queda intacta). Actualicé `docker-compose.registry.yml` para que apunte a `v4.0.0` en vez de `v0.1.0`, y repetí la misma prueba de visibilidad pública que había hecho en el TP2: deslogueada de GHCR (`docker logout`), sin la imagen en el disco local (`docker rmi`), un `docker pull` de `curatta-backend:v4.0.0` bajó la imagen completa sin pedir credenciales.

Los tags de git de este repo van `v1.0.0` → `v3.0.0` → `v4.0.0`: salteé `v2.0.0` a propósito, ya indicado así por el profesor con anterioridad.

## Declaración de uso de IA

Usé Claude principalmente para traducir los comandos de ejemplo del profesor (pensados para .NET/`Program.cs`) a mi stack (Next.js/TypeScript, `backend/lib/prisma.ts`).

Problema que tuve con uso de IA, el chat de claude code en visual studio: en un momento del TP le pedí a Claude una revisión/verificación del estado del repo, y en respuesta ejecutó por su cuenta un comando en la parte de cache que yo no le había pedido, cambiando de rama en mi checkout local sin que se lo indicara. Lo interrumpí con un "NO HAGAS NADA" apenas lo vi. Ya le había pedido explícitamente antes que no ejecutara acciones y se limitara a darme los comandos para correr yo misma, y en ese momento no lo respetó. Después de eso volvió a comportarse como se le pidió: solo research de lectura (`git status`, `grep`, leer archivos) para poder darme comandos correctos, sin volver a ejecutar nada que cambiara el estado del repo.

# TP5: Calidad automatizada

## 1. Mi stack frente a la tabla de la guía

La guía está escrita en .NET. Mi app es Next.js con TypeScript en backend y frontend, así que usé la columna JS/TS de la tabla «Tu stack, de un vistazo», con vitest en los dos lados:

| Lo que pide la guía | .NET (ejemplos) | Lo que usé yo |
|---|---|---|
| Dónde viven los tests | Proyecto aparte | Al lado del código: `telefono.ts` → `telefono.test.ts` |
| Test parametrizado | `[Theory]` + `[InlineData]` | `it.each` |
| Que la dependencia entre desde afuera | Interfaz + constructor | Parámetro de la función |
| Fabricar el doble | Moq | `vi.fn()` |
| Medir la cobertura | coverlet | `@vitest/coverage-v8` (`vitest run --coverage`) |
| Umbral que rompe el build | `coverlet.msbuild` + `/p:Threshold` | `coverage.thresholds` en `vitest.config.mts` |
| Qué entra en la cuenta | `/p:Exclude` | `coverage.include` / `coverage.exclude` |
| Reporte legible | ReportGenerator | reporters `html` y `json-summary` de vitest |
| Herramientas de test en la etapa de tests | El SDK ya las trae | `npm ci` sin `--omit=dev` |

Tres decisiones de herramienta:

- **vitest 4 y no 5**: vitest 5 requiere Node 22 y mis imágenes usan `node:20-slim`.
- **`vitest.config.mts` y no `vite.config.js`**: mi app no usa Vite. El contenido (provider, reporters, include, thresholds) es el mismo de la guía.
- **No usé ReportGenerator para el Summary**: lo probé leyendo la salida de vitest y daba otro porcentaje (cuenta líneas y ramas distinto). Como el número que frena el build lo calcula vitest, la tabla del Summary sale del `coverage-summary.json` del mismo vitest. Así el Summary, el reporte y el umbral muestran el mismo número, que es lo que la guía pide en el §3.4.

## 2. Qué lógica elegí testear y por qué esa

Elegí la lógica donde un error le duele directamente a quien usa Curatta:

| Regla | Si se rompe, la usuaria... |
|---|---|
| Teléfono (8 a 15 dígitos, normalizado) | No puede contactar a la vendedora: con ese número se arma el link de WhatsApp |
| Matching: qué se le pide a la base (disponibles, tipos compatibles, sin las propias) | Ve su propia ropa en venta como resultado, o prendas ya vendidas |
| Matching: umbral de 60 puntos, deportivo no se mezcla con calle, orden por parecido | Ve resultados que no se parecen a lo que buscó, o la mejor coincidencia al final |
| Validaciones de publicar y editar (precio > 0, nombre, foto) y de registro (email, contraseña ≥ 8) | Publica una prenda gratis o se registra con datos inválidos |
| "Una publicación vendida es definitiva" | Una prenda vendida vuelve a aparecer como disponible |
| Sesión (firma del token, vencimiento, cookie `httpOnly`, logout) | Alguien entra a páginas privadas sin permiso, o una usuaria logueada queda afuera |
| Análisis de Azure (extraer el JSON, exigir los 6 atributos, normalizar) | El matching compara mal, porque compara por igualdad exacta |
| Frontend: edición, link de WhatsApp, formato de precios, antigüedad de la publicación | Los botones Editar y Marcar vendida fallan sin aviso, o el link de contacto se rompe |

Resultado: 79 tests en el backend y 37 en el frontend, con parametrizados (`it.each`), casos de error y bordes (7/8 dígitos, 59,99/60 puntos, 7/8 caracteres, precio 0/1, 1/7/30 días).

Para comprobar que los tests verifican de verdad y no solo ejecutan código, rompí a propósito cada regla (mutantes, §2.4): borrar el `excludeUserId`, cambiar `>=` por `>`, sacar la verificación de la firma del token, una cookie sin `httpOnly`, un logout que no borra, entre otras. En todos los casos se puso en rojo el test que corresponde.

## 3. Refactors para poder testear y mockear

Antes del TP5 varias reglas no se podían testear sin levantar la base, Azure o Next, porque la dependencia estaba escrita adentro de la función. El arreglo fue siempre el mismo: separar la regla de la infraestructura, y que la infraestructura entre por parámetro.

- **Reglas metidas en las rutas** (`app/api/`): las pasé a `lib/validaciones.ts`. Las rutas ahora solo piden, delegan y responden. Además de poder testearlas, esto evitó la trampa del §2.4: después dejé las rutas afuera de la cobertura, y eso solo es honesto si ya no tienen reglas adentro.
- **Matching** (`matchContraAnalisis`): tenía `prisma` adentro. Ahora recibe `buscarCandidatos`; la app le pasa `buscarCandidatosEnBase` y el test le pasa un `vi.fn()`. **Este es el test con mock**: verifica con `toHaveBeenCalledWith` qué le pide a la base (solo disponibles, de tipos compatibles y sin las publicaciones de quien busca). Las reglas no se movieron de la función.
- **Sesión** (backend y frontend): leía las cookies de Next adentro. Separé la regla (`sesionDesdeToken`: firma, vencimiento, datos) y las cookies entran desde afuera. Las rutas y páginas siguen llamando `auth()` igual.
- **Análisis de Azure**: separé `interpretarRespuestaModa` (la regla) de la llamada a Azure, que entra por parámetro.
- **Frontend**: la edición de publicaciones tenía un `fetch` adentro del componente. Ahora `actualizarPublicacion` recibe el cliente HTTP y el cliente real vive en un solo lugar (`frontend/api/cliente.ts`).

En todos los casos la dependencia real se pasa en un solo lugar, y si faltara TypeScript no compila. Lo verifiqué además con la app levantada en Docker: las respuestas de la API son las mismas que antes, `/api/publicaciones/buscar` respondió 200 contra la base real, y el login, el logout y las páginas privadas funcionan igual.

## 4. Qué dejé afuera de la cuenta de cobertura

Se mide solo `lib/` en los dos lados. Antes de escribir más tests revisé qué estaba entrando en la cuenta:

| Qué | Decisión | Por qué |
|---|---|---|
| `backend/lib/prisma.ts` | Excluido | Es arranque: solo crea la conexión a la base, no tiene reglas |
| Rutas de `app/api/` | Afuera | Ya no tienen reglas: las saqué a `lib/` |
| Componentes y páginas del frontend | Afuera | Son pegamento de UI; su lógica está en `lib/` |
| Clases de datos | No hay en `lib/` | Los modelos los genera Prisma en `node_modules` |
| Código muerto de `azure-openai.ts` y del `session.ts` del frontend | **Borrado**, no excluido | Nadie lo usaba. Excluirlo hubiera sido esconderlo |

Uso `include` de una carpeta y no una lista de archivos: con vitest 4, sin `include` solo se mide lo que los tests importan, y un archivo nuevo sin tests no entraría a la cuenta. Con `include: ["lib/**"]`, cualquier archivo nuevo en `lib/` entra solo, aunque nadie lo testee. Es lo que hizo que los PRs del §3.5 frenaran.

## 5. Cómo llegué a la cobertura actual

Así cambió la cobertura desde la primera medición hasta el cierre del TP:

| | Primera medición | Final |
|---|---|---|
| Frontend | 30,76 % líneas / 50 % ramas | **95,55 % / 100 %** |
| Backend | 50,69 % líneas / 41,81 % ramas | **87,09 % / 88,76 %** |

En el §3.0 había hecho lo justo y necesario: los tests que pedía la Tarea 1. Cuando en el §3.1 y el §3.2 medí la cobertura, el frontend me dio 30,76 %, y al llegar al §3.3, donde aparece el umbral que rompe el build, me di cuenta de que poner el umbral sobre esa medición iba a ser un freno muy flojo. Antes de seguir se lo consulté al profesor: le conté que quería subir la cobertura testeando lo que faltaba antes de fijar el umbral, en vez de poner un umbral bajo sobre la primera medición.

### Consulta al profesor

Me contestó que lo había encarado mejor que si hubiera puesto un umbral bajo sobre la primera medición, que lo que más valía no era el número sino haber mirado el reporte, visto que `session.ts` estaba en 0 % y decidido que ahí un error duele, y que el 90 % para líneas y ramas estaba bien porque sale de mi medición y deja un margen chico. Me pidió tres cosas para cerrarlo:

**1. Contar el recorrido del frontend y qué es lo que quedó sin cubrir.**

- **Al principio, 30,76 % de líneas (12 de 39) y 50 % de ramas.** Solo tenían tests las reglas de edición de publicaciones del §3.0. Lo que más bajaba el número era `session.ts`, el `auth()` que decide si alguien está logueado, en 0 % porque leía la cookie de Next adentro de la función y no se podía testear sin un pedido real. `whatsapp.ts` y `format.ts` tampoco tenían tests.
- **Qué testeé y por qué eso.** La sesión, porque si falla alguien entra a páginas privadas sin permiso o una usuaria logueada queda afuera: la abrí para que la cookie entre desde afuera y testeé la regla (token válido, firmado con otro secreto, vencido, sin email). También el link de WhatsApp, porque es la única forma de contactar a la vendedora, y el formato de precios. De paso borré el código muerto del `session.ts` del frontend (crear y borrar la cookie es trabajo del backend).
- **Al final, 93,33 % de líneas (28 de 30) y 100 % de ramas**, con 27 tests.
- **Qué es el 6,67 % sin cubrir: 2 líneas de 30**, las de `leerTokenDeCookie`, que solo le piden la cookie a Next. No tienen ninguna regla propia; lo verifiqué con la app levantada: con sesión las páginas privadas abren y sin sesión redirigen al login.

Después, en el §3.5, el frontend subió a 95,55 % (43 de 45) porque `antiguedadDePublicacion` entró con un test por cada camino. Las 2 líneas sin cubrir siguen siendo las mismas.

**2. En el backend, mirar primero qué entra en la cuenta, sacar el arranque y las clases de datos, y después testear.**

Eso es lo que hice, en ese orden:

- **Primera medición: 50,69 % de líneas y 41,81 % de ramas.** Antes de escribir más tests miré qué estaba entrando: `prisma.ts`, que es arranque (solo crea la conexión a la base), y bastante código muerto en `azure-openai.ts` que nadie importaba. Clases de datos no había en `lib/`: los modelos los genera Prisma en `node_modules`. Las rutas de `app/api/` ya quedaban afuera porque les había sacado las reglas a `lib/validaciones.ts`.
- **Qué saqué y por qué**: excluí `prisma.ts` por ser arranque, y el código muerto lo borré en vez de excluirlo, porque excluirlo hubiera sido esconderlo (detalle en la sección 4). Con eso y los tests de `password.ts` y `esEstadoValido`, quedó en **57,62 % / 52,87 %**.
- **Después testeé las reglas que importan**: la sesión (firma, vencimiento, cookie `httpOnly`, logout) y el análisis de Azure (extraer el JSON, exigir los 6 atributos, normalizar), con el mismo refactor que en el frontend, y el aviso de `createClient` cuando falta una variable de Azure. Quedó en **87,09 % de líneas y 88,76 % de ramas**.
- No llega a 90 como el frontend, y el profesor aclaró que no hace falta: el número sale de lo que mido. Lo que falta es infraestructura: la consulta de Prisma (`buscarCandidatosEnBase`), la llamada a Azure (`pedirAlModeloAzure`) y la lectura de cookies de Next. Por eso el umbral del backend es 85 % (sección 6).

**3. Para el §3.5, hacer la cuenta antes.**

El porcentaje es de todo lo medido, así que el código nuevo sin tests tiene que alcanzar para bajar de mi número a menos del umbral:

- **PR #32**: el frontend tenía 28 líneas cubiertas de 30. Para quedar debajo del 90 % alcanzaban 2 líneas sin cubrir (28/32 = 87,5 %), pero la guía pide código de verdad y no dos líneas, así que agregué una función de unas 12 líneas con varios caminos. Esperaba quedar cerca del 67 %, y dio 66,66 % de líneas y 63,33 % de ramas.
- **PR #33**: después del merge del #32, el frontend tenía 43 de 45 líneas. Hacían falta al menos 3 líneas sin cubrir (43/48 = 89,6 %); agregué un archivo nuevo (`lib/ventas.ts`) de unas 20 líneas, y quedó en 74,13 % de líneas y 78,94 % de ramas.

## 6. Umbrales

| | Umbral | Métrica | Medición al fijarlo |
|---|---|---|---|
| Frontend | **90 %** | Líneas y ramas | 93,33 % líneas / 100 % ramas |
| Backend | **85 %** | Líneas y ramas | 87,09 % líneas / 88,76 % ramas |

Los dos salen de mi medición real y quedan unos puntos por debajo, para que pasen hoy y frenen si entra código sin tests. Pongo umbral en las dos métricas porque la de líneas es la que más puede mentir: un `if` recorrido por un solo camino da 100 % de líneas y 50 % de ramas.

Antes de fijarlos verifiqué que frenan de verdad: en el frontend, apagar los tests de WhatsApp lo baja a 86,66 %; en el backend, apagar los de azure-openai lo baja a 81,45 % de líneas y 82,02 % de ramas. El backend no llega a 90 como el frontend porque lo que falta cubrir es infraestructura; para subirlo tendría que agregar tests de integración contra la base y Azure, y tests end-to-end para las cookies (TP7).

## 7. El ejercicio de la rama sin cubrir

1. **Qué línea**: `backend/lib/matching-publicaciones.ts`, línea 38, el `?? [tipoPrenda]` de `tiposCompatibles`. No había ningún `if` a la vista: la rama la abría el `??`. Es el camino que toma el matching cuando el tipo de prenda no está en ningún grupo de compatibles.
2. **Qué entrada la recorre**: un análisis con `tipo_prenda: "blazer"`. Todos mis tests usaban `"jean"`, que sí tiene grupo.
3. **Qué decidí**: agregar el test ("si el tipo de prenda no tiene compatibles, le pide a la base solo ese tipo"). La mayoría de los tipos (blazer, falda, sweater, cardigan, abrigo, zapatos, jogger) no tienen grupo y pasan siempre por esa rama, así que la rama sin cubrir era la que usan casi todas las búsquedas. Si alguien cambia `[tipoPrenda]` por `[]`, buscar un blazer devuelve siempre "No encontramos prendas parecidas"; lo comprobé rompiéndolo a propósito y el test nuevo se puso en rojo.

La cobertura me mostró dónde mirar, pero la decisión salió de entender el código: el 80 % de ramas de ese archivo no decía que el camino sin cubrir era el más usado.

## 8. Por qué cobertura alta no garantiza calidad

Si mi test de `setSessionCookie` solo llamara a la función sin mirar qué guardó, la cobertura sería exactamente la misma: todas las líneas se ejecutan igual. Pero si alguien sacara el `httpOnly` de la cookie de sesión, nadie se enteraría y el token quedaría expuesto a JavaScript. Como mi test sí verifica las opciones con las que se guardó la cookie, al sacarle el `httpOnly` a propósito se puso en rojo. El número de cobertura es igual en los dos casos: lo que cambia es el `expect`. Por eso además de medir cobertura corrí mutantes: la cobertura dice qué se ejecutó, no qué se verificó.

## 9. El freno funcionando

El freno no necesitó configuración nueva: la cobertura corre adentro de los mismos jobs `build-backend` y `build-frontend`, que son required checks de `main` desde el TP4. La diferencia con el TP4 es que antes esos jobs solo se ponían en rojo si el código no compilaba; ahora también si la cobertura queda debajo del umbral, aunque todo compile y todos los tests pasen.

- **Resumen de cobertura y reporte descargable (backend y frontend)**: [corrida](https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/37714391219)
- **Rojo por umbral en el frontend** (§3.3, tests de WhatsApp apagados): [corrida](https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/37764515231). 24 tests pasaron y frenó por **líneas** (86,66 % contra 90 %). Las ramas siguieron en 100 % porque `linkWhatsapp` no tiene ningún `if`.
- **Rojo por umbral en el backend** (§3.4, tests de azure-openai apagados): [corrida](https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/37859813967). 74 tests pasaron y frenó por **líneas y ramas** (81,45 % y 82,02 % contra 85 %), porque `createClient` sí tiene un `if`.
- **PR bloqueado, secuencia completa** (§3.5): [PR #32](https://github.com/Candelariaarolon/ingsoft3-tp01/pull/32). Agregué `antiguedadDePublicacion` sin tests: compilaba y los 27 tests pasaban, pero `build-frontend` quedó rojo ([corrida](https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/38083650719)) por **líneas y ramas** (66,66 % y 63,33 % contra 90 %), con vitest 4.1.11, que desde la versión 4 cuenta las ramas de una función que nunca se ejecuta. Lo arreglé con un test por cada camino de la función, incluidos los bordes de 1, 7 y 30 días; volvió a verde y lo mergeé.
- **El freno vigente** (§3.5): [PR #33](https://github.com/Candelariaarolon/ingsoft3-tp01/pull/33), abierto y en rojo hasta la defensa. Agrega `lib/ventas.ts` sin tests y queda en 74,13 % de líneas y 78,94 % de ramas.

Lo que este freno deja pasar igual: código con tests que ejecutan pero no verifican, y reglas que entendí mal, porque mis tests congelan lo que yo entendí del requisito. Eso solo lo detecta quien sabe qué se quiso pedir, mirando el PR.

## 10. Problemas encontrados

- **vitest 5 necesita Node 22** y mis imágenes usan Node 20, así que usé vitest 4.
- **ReportGenerator daba otro número que vitest** para la misma corrida; lo resolví armando el Summary desde el `coverage-summary.json` de vitest (sección 1).
- **No pude crear la rama `fix/puertos`** porque ya existía una rama local llamada `fix`, y Git no deja tener `fix` y `fix/algo` al mismo tiempo. Como el `checkout -b` falló, el commit quedó en `main` local; lo moví a una rama `fix-puertos` y devolví `main` a como estaba en GitHub antes de pushear.
- **Hice un commit con el mensaje "tu mensaje"** al copiar un comando de ejemplo sin reemplazarlo; lo corregí con `git commit --amend` antes del push.
- **Mis commits aparecían con otra cuenta de GitHub.** El email que uso en la terminal está asociado a mi segunda cuenta (`candelariarolon`), así que GitHub le adjudicaba los commits a esa cuenta y no a la dueña del repo (`Candelariaarolon`). Configuré el email de `Candelariaarolon` solo para este repo; los commits anteriores quedaron como estaban.
- **Nombres de tests confusos**: en un `it.each`, el segundo `%s` del nombre tomaba el dato de entrada y no el resultado esperado ("ok es aaaaaaaa"). Los reescribí, porque el nombre del test es el diagnóstico cuando falla.

## 11. Declaración de uso de IA

Usé Claude Code (en VS Code) durante el TP5. Esta vez le permití editar archivos y correr comandos (instalar dependencias, correr tests, levantar la app con Docker), pero todos los commits, pushes, PRs y merges los hice yo, con mis mensajes.

Lo usé para traducir la guía de .NET a mi stack, escribir tests conmigo y armar los pasos del pipeline. Las decisiones las tomé yo: qué reglas testear, testear la sesión en vez de excluirla, los dos umbrales (se los consulté al profesor) y agregar el test de la rama sin cubrir.

Cómo verifiqué lo que produjo: leí qué comprueba cada `expect`; rompí a propósito cada regla (mutantes) para confirmar que algún test se pusiera en rojo; simulé el pipeline en mi máquina (la etapa de tests del Dockerfile con el volumen montado) antes de pushear; y levanté la app con Docker para confirmar con `curl` y en el navegador que los refactors no cambiaron el comportamiento.


---

# TP6: Entrega continua: entornos, aprobación y despliegue

## Enlaces de este TP

**El artefacto (Tarea 1)**

- Paquete público del backend: [ingsoft3-tp01-backend](https://github.com/Candelariaarolon/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend), etiquetado `sha-486fac823a7249fc94d6584f0faa8241ca9c61ff` (el merge del PR #35).
- Paquete público del frontend: [ingsoft3-tp01-frontend](https://github.com/Candelariaarolon/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend), mismo tag.
- Eslabón 2, sólo `main` publica: [job del PR #35](https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/38296933814/job/114970156619). Tests en verde y «Entrar al registry» salteado.
- Eslabón 3, publicar es lo último: [job de la corrida de `main`](https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/38298894032/job/114976659969). «Construir y publicar la imagen» es el último paso, después de los tests.

**Los entornos (Tareas 2 a 4)**, vivos hasta la defensa (el plan gratis los duerme: el primer pedido tarda ~30 s):

| Entorno | Front | API |
|---|---|---|
| QA | https://curatta-front-qa.onrender.com | https://curatta-api-qa.onrender.com/api/health |
| PROD | https://curatta-front-prod.onrender.com | https://curatta-api-prod.onrender.com/api/health |

`/api/health` (en la api) y `/health` (en el front) devuelven el commit que corre cada servicio.

**El gate (Tarea 4)**, como referencia rápida (todo se ve también en *Actions* y *Deployments*):

- Rechazo con motivo: [corrida del commit `0f5e555`](https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/38502351304).
- Aprobación con un cambio visible y el smoke de PROD en verde: [corrida del commit `ec41210`](https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/38626563413).

## 1. El artefacto: por qué se publica sólo con la verificación en verde

Hasta el TP5 el pipeline verificaba y no dejaba nada: la imagen nacía y moría en el runner. Ahora cada merge a `main` publica las dos imágenes en `ghcr.io`, etiquetadas con el commit que las produjo (`sha-<commit>`).

Que en el registry sólo haya imágenes verificadas no depende de un control nuevo, sino de tres cosas encadenadas:

1. **Nada entra a `main` sin verde**: `build-backend` y `build-frontend` son required checks desde el TP4, y desde el TP5 incluyen el umbral de cobertura.
2. **Sólo `main` publica**: el `push:` del paso que publica vale `github.event_name == 'push' && github.ref == 'refs/heads/main'`. En un PR el paso construye la imagen (eso verifica que la imagen final compila), pero no la sube. Puse la condición en el paso que publica y no sólo en el disparador del workflow: si un día agrego otra rama al `on:`, no publica igual.
3. **Publicar es el último paso del mismo job que corre los tests.** No hay ningún `if` que diga «si los tests pasaron»: los pasos corren en orden y el job se corta en el primer error, así que si los tests fallan, el paso de publicar nunca llega a ejecutarse. Por eso moví el build de la imagen final del principio del job (donde estaba en el TP4) al final, y los pasos que publican no llevan `!cancelled()` (el reporte de cobertura sí, a propósito).

Si se publicara igual con los tests en rojo, estar en el registry dejaría de significar «esto pasó la verificación», y el registry sería un depósito de cosas que alguien construyó alguna vez.

**Lo que la cadena no garantiza**: protege lo que publica *el pipeline*, no lo que físicamente puede entrar. Yo podría hacer `docker push` a mano desde mi máquina con mi token y pisar un tag `sha-…`, porque un tag es un nombre que se puede mover. Lo que identifica una imagen de forma inmutable es su **digest** (`sha256:…`, el hash del contenido).

`permissions: packages: write` está declarado **por job** y no a nivel workflow: a nivel workflow reemplazaría el default de todos los jobs, y sólo el que publica necesita escribir paquetes (mínimo privilegio). No hizo falta ningún secret: el `GITHUB_TOKEN` lo crea GitHub para cada corrida y vence con el job.

## 2. Cómo me adapté al registry

- **El nombre va en minúsculas y escrito a mano.** `${{ github.repository }}` devuelve `Candelariaarolon/ingsoft3-tp01`, con mayúscula, y `ghcr.io` la rechaza.
- **Paquetes nuevos (`ingsoft3-tp01-*`) en vez de los `curatta-*` del TP2.** Aquellos los subí a mano con mi token personal y no están vinculados al repo, así que el `GITHUB_TOKEN` del pipeline no puede escribir en ellos. Los nuevos los creó el primer push del pipeline, ya vinculados.
- **Paquetes públicos**, para que cualquiera los baje sin credenciales. Lo comprobé con `docker pull` usando una configuración de Docker vacía (sin login).
- **La fecha de creación de la imagen es anterior al merge.** `docker image inspect` dice 10/10 para el tag del 12/10 porque el pipeline reusó la caché (`cache-from: type=gha`): el código de las imágenes no cambió desde el TP5 y el resultado es la misma imagen. La etiqueta sigue diciendo de qué commit salió.

## 3. La base de datos: Neon

- **Un proyecto nuevo (`curatta-tp6`) con dos bases, `app_qa` y `app_prod`**, en el mismo servidor. No reusé mis proyectos anteriores de Neon: uno tiene datos que no quiero que pisen las migraciones del TP6, y el otro está en São Paulo, donde Render no tiene servidores.
- **Región AWS US East 2 (Ohio)**, la misma que elijo para los servicios en Render, para que cada consulta no cruce el continente.
- **Postgres 16**, la misma versión que mi `docker-compose.yml` (`postgres:16-alpine`), donde están probadas las migraciones.
- **Por qué no el Postgres de Render**: su plan gratuito expira a los 30 días, antes de la defensa. El de Neon es permanente (con límites: 0,5 GB, y el cómputo se suspende a los ~5 minutos sin uso).
- **Conexión directa, sin pooler.** El backend corre `prisma migrate deploy` al arrancar, y las migraciones necesitan la conexión directa. Le saqué a la URI el `channel_binding=require` y dejé `sslmode=require`.
- **El esquema lo crea la app**: el `CMD` del backend corre `prisma migrate deploy` antes de `npm start`, así que las tablas aparecen solas la primera vez que el servicio arranca en cada entorno. Antes del primer deploy, `select count(*) from "User";` en `app_qa` contesta *relation "User" does not exist*, como corresponde a una base vacía.
- **Limitación honesta**: las dos bases tienen el mismo dueño (`app_qa_owner`), es decir, el mismo usuario y contraseña; sólo cambia el nombre de la base. Con la cadena de conexión de QA alguien podría conectarse a PROD cambiando una palabra. En una empresa real cada entorno tendría su propio usuario.

## 4. Preparar la app para desplegarla

La guía asume .NET y un front servido por nginx. Mi app es Next.js en los dos lados, y hubo que cambiar tres cosas antes de desplegar:

| La guía asume | Mi app tenía | Qué hice |
|---|---|---|
| `/health` existe | Nada parecido. `/api/auth/me` contesta 200 siempre, pero no toca la base | `/api/health` (el proceso está vivo, y devuelve el commit que corre) y `/api/health/db` (hace `SELECT 1`; si la base no responde, 503) |
| La plantilla de nginx lee `${BACKEND_URL}` al arrancar | `rewrites()` de Next: la dirección del backend se resolvía en `next build` y quedaba **horneada en la imagen** (`ARG BACKEND_URL`) | Saqué `rewrites()` y el `ARG`. Un route handler (`app/api/[...ruta]/route.ts`) reenvía `/api/*` al backend leyendo `BACKEND_URL` **en cada pedido**. La lógica (armar la URL, filtrar encabezados) está en `lib/proxy.ts`, con tests |
| El backend escucha en `0.0.0.0` | El back sí (`next start`). El front standalone escucha en `HOSTNAME`, y Docker y Render ponen ahí el nombre del contenedor | `ENV HOSTNAME=0.0.0.0` en el Dockerfile del front |

**Qué queda en la imagen y qué entra por variable de entorno**:
- **Adentro de la imagen:** el código compilado, las dependencias y las migraciones.
- **Por variable:**
  - en el front, `BACKEND_URL` (con `http://backend:4000` por defecto, que es lo que usa compose);
  - en el back, `DATABASE_URL`, `JWT_SECRET` y las credenciales de Azure OpenAI.

Por eso la misma imagen del front sirve en QA y en PROD, y cada una habla con su api. Es lo que va a permitir el TP7.

El navegador sigue hablándole sólo al front (mismo origen), así que la cookie de sesión `httpOnly` funciona sin CORS. Probé con `docker compose` el registro, el login (la cookie llega al navegador), `/api/auth/me`, las publicaciones, una página protegida, el logout y un cuerpo de 3 MB, todo pasando por el proxy. Los 44 tests del front pasan y la cobertura subió a 96,36 % de líneas y 100 % de ramas.

## 5. Proveedor y contrato

Usé **Render** para los cuatro servicios (api y front, en QA y en PROD) y **Neon** para las bases. Cumplo los cinco puntos del contrato del TP así:

1. **Dos entornos separados con URL pública**: `curatta-api-qa` / `curatta-front-qa` y `curatta-api-prod` / `curatta-front-prod`, en Render.
2. **Una base por entorno**: `app_qa` y `app_prod` en Neon. Lo comprobé desde la app: un usuario creado en PROD no puede loguearse en QA (401), y una cookie de sesión de QA no vale en PROD (los `JWT_SECRET` son distintos). En el SQL Editor, cada base tiene sólo sus usuarios.
3. **Front y back como contenedores**: los cuatro servicios usan el runtime Docker con mis Dockerfiles.
4. **El deploy lo dispara el pipeline con el commit verificado**: Auto-Deploy en Off en los cuatro servicios, y los jobs llaman al deploy hook con `&ref=$GITHUB_SHA`.
5. **PROD detrás de la aprobación**: el environment `production` tiene un required reviewer (yo).

## 6. Continuous Delivery, no Continuous Deployment

Implementé **Continuous Delivery**: todo cambio que entra a `main` y pasa la verificación llega solo a QA y queda listo para PROD, pero a PROD sólo llega si una persona lo aprueba. Para **Continuous Deployment** (que llegue solo a PROD) me falta red de seguridad: mis tests son unitarios (no tengo tests de integración ni end-to-end, que llegan en el TP7) y no tengo monitoreo que avise si PROD empieza a fallar después de un deploy (TP9). Con eso, automatizar la llegada a PROD sería automatizar la propagación de errores. Hoy no la querría.

## 7. La cadena: `needs`, `if`, environments y secrets

```
build-backend ─┐
               ├─> deploy-qa (if: main, environment: qa) ─> deploy-prod (environment: production, concurrency)
build-frontend ┘
```

- **`needs`** arma la cadena: sin los dos builds en verde no hay deploy a QA, y sin QA corriendo el commit nuevo no hay deploy a PROD.
- **`if: github.ref == 'refs/heads/main'`** en `deploy-qa`: los PR verifican pero no despliegan. `deploy-prod` no repite el `if`: depende de `deploy-qa`, así que en un PR tampoco corre (en los PR los dos salen *skipped*).
- **`environment`**: cada job de deploy declara su entorno, y con eso hereda sus secrets, sus reglas de protección y queda en el historial de Deployments.
- **`&ref=$GITHUB_SHA`** en cada hook: se despliega el commit que el pipeline verificó, no la punta de `main`. En PROD importa más todavía: entre que la corrida queda esperando y yo apruebo pueden pasar horas, y `main` se puede mover.
- **`concurrency: deploy-prod`**: nunca dos deploys a PROD a la vez. No ordena la cola de aprobaciones: si quedaran dos corridas esperando, la vieja la rechazo a mano, porque aprobarla haría retroceder a PROD.

**Alcance de los secrets**: los deploy hooks son secrets **de environment**, no del repo. `RENDER_HOOK_*_QA` sólo los ve un job con `environment: qa`, y `RENDER_HOOK_*_PROD` sólo un job con `environment: production`, que además está pausado hasta que alguien lo aprueba: sin aprobación, nadie los lee. Si estuvieran en el repo, cualquier job (incluido uno de un PR) podría desplegar a producción. Los cargué con `gh secret set` sin `--body`, para que la URL no quede en el historial de la terminal. Las cadenas de conexión a Neon y los `JWT_SECRET` viven sólo en las variables de cada servicio de Render.

## 8. Qué miro antes de aprobar un deploy a PROD

Antes de aprobar miro:
1. Que en **esa** corrida los tests y el umbral de cobertura pasaron.
2. Que el smoke de QA dio verde **con ese mismo commit** (el log lo muestra en la api y en el front).
3. El cambio en sí (el PR): qué toca y cuánto cuesta volver atrás. Un texto no es lo mismo que la conexión a la base o una migración.
4. El cambio funcionando en QA, mirándolo yo en la URL.
5. Si hay una corrida más nueva esperando: en ese caso rechazo la vieja.

**Lo que mi aprobador no puede ver**: si los usuarios de PROD están teniendo errores ahora (no tengo métricas ni logs centralizados), si el cambio funciona con datos reales (QA tiene datos de prueba), y si la configuración de PROD (variables, hooks) está bien cargada. Eso último me pasó: ver la sección de problemas.

**El rechazo**: rechacé la corrida del commit `0f5e555` porque todavía no había un deploy a PROD completo y verificado y no había comprobado que los hooks de PROD apuntaran a los servicios de PROD. Después de rechazar, comparé el `srv-` de cada hook con el de su servicio.

## 9. Qué prueba el smoke y qué no

El smoke reintenta hasta 45 veces cada 20 segundos (unos 15 minutos), porque Render tarda en construir y el plan gratis duerme los servicios: un `curl` seco daría falsos rojos. En cada vuelta exige todo esto a la vez, y si en 15 minutos no lo consigue, el job queda rojo:

- que la **api** corra el commit verificado (`/api/health` devuelve `RENDER_GIT_COMMIT`);
- que el **front** corra el commit verificado (`/health` del front, fuera de `/api` para que no lo conteste el proxy);
- que la api llegue a la base (`/api/health/db`);
- que el front sirva la página y llegue a la api y a la base a través del proxy.

Exigir el commit no está en el smoke de la guía (que lo marca como opcional en el TP6 y obligatorio en el TP7). Lo agregué porque mientras Render construye sigue sirviendo la versión anterior con 200, y un smoke que sólo mira que conteste da verde contra la versión vieja. Primero lo hice sólo en la api, y lo extendí al front cuando un hook mal cargado dejó el front de PROD sin actualizar con el job en verde.

**Lo que no prueba**: que la funcionalidad ande (no hace un login ni una búsqueda), que la sesión funcione (un `JWT_SECRET` distinto entre front y back deja el health en 200 y el login roto, me pasó en QA), que Azure OpenAI responda, ni que el entorno siga sano después del smoke.

## 10. Qué garantía pierdo porque Render reconstruye

El pipeline publica en `ghcr.io` la imagen que pasó los tests, pero Render no la usa: **vuelve a construir** el commit desde el repositorio. Despliego el commit verificado, no la imagen verificada. Entre una construcción y otra puede cambiar algo que no está fijado: la imagen base `node:20-slim` (es un tag que se mueve), los paquetes de `apt-get` (`openssl`), o el entorno de build de Render. Si el bug aparece sólo en la construcción de Render, lo que probé y lo que corre son cosas distintas. El TP7 lo cierra haciendo que Render ejecute la imagen del registry.

## 11. La letra chica del plan gratis

- **Render duerme los servicios** a los 15 minutos sin tráfico; el primer pedido tarda ~30 segundos (lo medí: 32 s). El smoke reintenta por eso.
- **750 horas de instancia por mes, por workspace**, compartidas entre los cuatro servicios. Al momento llevo 11 horas: como duermen, alcanza. No uso nada que los mantenga despiertos.
- **Minutos de build**: cada promoción completa reconstruye hasta cuatro servicios. Si se acaban, Render deja de construir y el hook responde igual; mi smoke lo detectaría, porque el commit no cambiaría.
- **Neon suspende el cómputo** a los ~5 minutos sin uso; por eso `connect_timeout=15` en las URIs.
- **El proveedor puede fallar**: un incidente de Render (*«Builds are not starting in all regions»*) dejó un deploy de QA más de 25 minutos en *Building*. El smoke cortó a los 15 minutos, el job quedó rojo y PROD no se tocó. Los servicios ya desplegados siguieron funcionando. Render también anuncia mantenimientos en los que no se puede desplegar.

## 12. Problemas encontrados

- **Pegué la cadena de conexión con la contraseña en el chat con la IA.** La traté como expuesta: reseteé la contraseña del rol en Neon y cargué la nueva en los dos servicios. La cadena de conexión sólo vive en las variables de Render.
- **La api de PROD no arrancaba (`P1001: Can't reach database server`).** Había un carácter de más en la contraseña de la `DATABASE_URL` de PROD. El error aparecía un segundo después de intentar conectarse, así que no era Neon tardando en despertar, sino la conexión rechazada. Además agregué `connect_timeout=15` a las dos URIs: Neon suspende el cómputo a los ~5 minutos sin uso, y Prisma espera sólo 5 segundos por defecto.
- **El front de QA no reconocía la sesión.** El login andaba, pero las páginas protegidas me mandaban al login. Mi front verifica la cookie del lado del servidor, así que necesita el mismo `JWT_SECRET` que el backend de su entorno. Lo había editado en Render sin redesplegar, y con Auto-Deploy en Off una variable nueva no se aplica hasta el próximo deploy. Es un caso de «el build en verde, el servicio Live y el entorno roto»: `/api/health` daba 200.
- **502 del front a través del proxy.** Las api estaban dormidas (el plan gratis las duerme a los 15 minutos) y tardaron ~32 s en despertar; mientras tanto el proxy devolvía 502. Es la razón por la que el smoke reintenta.
- **El primer smoke de QA cortó en la primera vuelta.** GitHub Actions corre los scripts con `bash -e -o pipefail`, y yo había dejado el primer `curl` fuera del `if`: el timeout del cold start abortaba el paso en vez de dejar que el loop reintentara. Lo corregí poniendo todos los chequeos dentro de la condición, como en la guía, y lo verifiqué corriendo el script con esas mismas opciones contra un servicio que no contesta, uno que corre otro commit y uno que corre el esperado.
- **Aprobé por error el primer deploy a PROD y cancelé el workflow.** Cancelar no deshizo nada: el hook ya había llegado a Render y PROD quedó con el commit nuevo. Una vez disparado el hook, la única vuelta atrás es el rollback (disparar el hook con el sha anterior). No hizo falta, porque ese commit sólo cambiaba `ci.yml` y la app era la misma.

- **El front de PROD no se actualizaba y el job daba verde.** El secret `RENDER_HOOK_FRONT_PROD` tenía cargado el hook de la api (al usar `gh secret set` de a uno, el portapapeles todavía tenía el anterior). El pipeline llamaba dos veces a la api y ninguna al front, y el smoke, que en ese momento sólo comparaba el commit de la api, daba verde. Lo noté abriendo PROD y viendo el texto viejo. Es exactamente el riesgo que había escrito en el motivo del rechazo. Lo corregí recargando el secret y haciendo que el smoke exija el commit también en el front.
- **Las fotos de la landing nunca se habían subido al repo.** La página pedía siete imágenes de `/productos/` que estaban sólo en mi carpeta original del proyecto: cuando armé la app en el TP1 se copiaron las texturas de `public/` pero no los productos, y en local, en compose y en los dos entornos se veían rotas. Lo noté recién cuando la landing quedó pública en PROD. Subí sólo las siete que usa la página.
- **Render tuvo un incidente propio** («Builds are not starting in all regions») y el build de QA quedó trabado. Cancelé el build en Render y volví a correr el job desde GitHub (*Re-run failed jobs*): mismo commit, mismo pipeline.

## 13. Qué deployment pattern usaría en una producción real

Hoy cada deploy es un **recreate**: el plan gratis tiene una sola instancia por servicio, y mientras Render cambia la versión hay un rato en que el servicio no atiende (lo vi como 502 en el front).

Para Curatta con usuarios reales usaría **blue-green con feature flags**:

- **Blue-green** para la infraestructura: dos entornos de PROD completos, y el tráfico pasa del viejo al nuevo de una vez, cuando el nuevo ya pasó el smoke. El rollback es volver el switch: segundos, en vez del minuto que tarda hoy reconstruir. Cuesta el doble de infraestructura, pero Curatta es chica y el beneficio es no cortar a nadie mientras compra o publica.
- **Feature flags** para lo riesgoso del producto, sobre todo el matching con Azure OpenAI: un cambio en cómo se comparan las prendas lo desplegaría apagado, lo prendería primero para mí y después para un porcentaje de usuarias, y lo apagaría en segundos si los resultados empeoran, sin redesplegar.

**Por qué no canary**: para decidir si el canario «sangra» hacen falta métricas por versión (errores, latencia, cuántas búsquedas terminan en un contacto por WhatsApp). Hoy no tengo nada de eso: es lo que me falta, y llega con el TP9. Sin esa observabilidad, un canary es ruleta.

**Cuidado con la base**: en blue-green las dos versiones comparten la base, así que las migraciones tienen que ser compatibles hacia atrás (agregar columnas sí, borrar o renombrar no, hasta que la versión vieja ya no exista).

## 14. Plan de rollback, medido

Como cada deploy se dispara con el commit explícito (`&ref=<sha>`), volver atrás es **el mismo mecanismo con el sha anterior**:

1. Ver en *Deployments* → `production` (o en Render → *Deploys*) cuál fue el último deploy bueno, y su sha.
2. Copiar de Render los deploy hooks de `curatta-api-prod` y `curatta-front-prod` (el secret de GitHub no se puede volver a leer). Los cargo con `read -rs` para que no queden en el historial.
3. Llamar a los dos hooks con `&ref=<sha anterior>`.
4. Esperar a que Render muestre ese commit como *Live* en los dos servicios, y comprobar `/api/health` y `/health`, que tienen que devolver el sha anterior.

**Lo hice una vez de verdad** (el 14/10): tomé como «deploy malo» el de las fotos de la landing (`3907483`) y volví PROD a `ec41210`. El efecto se veía: PROD quedó sin las fotos. Disparé los hooks a las **20:03:05**, y en Render → *Deploys* los dos servicios quedaron *Live* en `ec41210`: la api en **45,8 s** y el front en **51,6 s**. El rollback completo tardó **menos de un minuto**. Es mi tiempo de recuperación (MTTR, la cuarta métrica DORA), medido con el servicio despierto y la caché de build de Render disponible. Con la caché fría o Render lento (como en su incidente de ese mismo día) tardaría varios minutos más.

La otra vía es re-correr el job `deploy-prod` de la corrida vieja desde *Actions*: vuelve a pedir la aprobación y GitHub sólo deja hacerlo hasta 30 días después. El hook con el sha funciona siempre.

**Lo que el rollback no deshace: los datos.** Volver el código no vuelve la base. Si una versión hubiera corrido una migración que borra una columna, o hubiera escrito datos con un formato nuevo, el rollback dejaría código viejo contra una base nueva. Para eso harían falta migraciones compatibles hacia atrás (la regla de la sección anterior) y poder restaurar la base: Neon tiene *point-in-time restore*, pero en el plan gratis la ventana es corta. Además, después de un rollback a mano, `main` sigue teniendo el commit malo: el próximo merge lo volvería a llevar a PROD si no se revierte también en el código.

## 15. Declaración de uso de IA

Usé Claude Code (en VS Code) durante todo el TP6. Le permití editar archivos y correr comandos de verificación (tests, `docker compose`, `curl` contra QA y PROD, `gh` para leer el estado de las corridas), pero todos los commits, pushes, PRs, merges, aprobaciones, rechazos, el rollback y el tag los hice yo, con mis mensajes. Las credenciales (cadenas de conexión, `JWT_SECRET`, deploy hooks) las cargué yo en Render y en GitHub.

Lo usé para traducir la guía (.NET + nginx) a mi stack (Next.js en los dos lados), escribir el proxy del front, los endpoints de salud, los jobs de deploy y el smoke, y diagnosticar los problemas de la sección 12. El motivo del rechazo y los criterios de aprobación los escribí yo.

Cómo verifiqué lo que produjo: probé cada cambio de la app con `docker compose` antes de subirlo (login, sesión, proxy, un cuerpo de 3 MB); corrí el smoke en mi máquina con las mismas opciones de bash que usa GitHub (`-e -o pipefail`), contra un servicio que no contesta, uno que corre otro commit y uno que corre el esperado; comprobé con datos que las dos bases y los dos `JWT_SECRET` estuvieran separados; comparé el `srv-` de cada hook con el de su servicio; y miré PROD con mis ojos después de cada aprobación. Así encontré el hook del front mal cargado, que el pipeline no detectaba. Dos veces la primera versión de la IA estuvo mal (el smoke que cortaba en el primer timeout, y un smoke que no miraba el front), y las dos las encontré probando, no leyendo.

---

# TP7: Contenedores en el pipeline, integración y e2e

## Enlaces del TP7

**Los dos paquetes públicos**, con la etiqueta del commit que está en PROD (`sha-196b4030ea8f1bdeb3881541d951306b89c85f54`):

- [ingsoft3-tp01-backend](https://github.com/Candelariaarolon/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-backend)
- [ingsoft3-tp01-frontend](https://github.com/Candelariaarolon/ingsoft3-tp01/pkgs/container/ingsoft3-tp01-frontend)

**La corrida donde la integración quedó VERDE y la e2e ROJA** (Tarea 4):

- Commit que rompió la app: [`4e98317`](https://github.com/Candelariaarolon/ingsoft3-tp01/commit/4e98317), el botón «Publicar» pasa a decir «Subir prenda». Toca sólo `NuevaPublicacionForm.tsx`, nada de `e2e/`.
- Corrida: [39325200411](https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/39325200411). El smoke en verde, `integracion` en verde, `e2e` en rojo y `deploy-prod` salteado: ni llegó a pedir aprobación.
- Reporte de integración (verde, 3 passed): [playwright-report-integracion](https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/39325200411/artifacts/12221908359)
- Reporte e2e (rojo, 3 failed, con screenshot y traza): [playwright-report-e2e](https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/39325200411/artifacts/12222531464)

**La corrida completa en verde posterior, hasta PROD** (el arreglo, `196b403`): [39491690688](https://github.com/Candelariaarolon/ingsoft3-tp01/actions/runs/39491690688)

**Los entornos**, vivos hasta la defensa (el plan gratis los duerme: el primer pedido tarda ~30-45 s):

| Entorno | Front | API |
|---|---|---|
| QA | https://curatta-front-qa.onrender.com | https://curatta-api-qa.onrender.com/api/health |
| PROD | https://curatta-front-prod.onrender.com | https://curatta-api-prod.onrender.com/api/health |

## 1. Build once, deploy many: qué problema del TP6 resuelve

En el TP6 el pipeline publicaba la imagen verificada, pero Render no la usaba: reconstruía la app desde el repositorio en cada entorno. Lo que corría en QA y en PROD eran dos construcciones del mismo commit, no la imagen que pasó los tests. En mi app eso no es teórico: el `Dockerfile` arranca de `node:20-slim`, que es una etiqueta que se mueve, e instala `openssl` con `apt-get` sin versión fija. Si entre el build de QA y el de PROD sale un parche de cualquiera de los dos, PROD corre algo que nadie probó, con el mismo código.

Ahora el pipeline construye cada imagen **una sola vez**, en el job que corre los tests, y los cuatro servicios de Render la **ejecutan** (fuente *Existing Image*). El deploy le dice a Render qué imagen correr con `imgURL=…:sha-<commit>`, y a PROD va la **misma** etiqueta que se probó en QA. Se ve en el log: el mismo `imgURL` en `deploy-qa` y en `deploy-prod`.

## 2. Etiquetas: qué garantiza cada una

- **`sha-<commit>` en el registry**: dice de qué commit salió cada imagen, con los 40 caracteres (el registry no completa abreviaturas como git: con el sha corto contesta `manifest unknown`). Es la etiqueta con la que se promueve.
- **`v7.0.0` en git**: el nombre de la versión que cerró el práctico, puesto sobre el commit que *Deployments* dice que está en `production`, no sobre la punta de `main`. Desde el tag se llega a la imagen en un paso: `git rev-list -n1 v7.0.0` da el commit, y `sha-<ese commit>` es la etiqueta de las dos imágenes.
- **No publico `latest`**: no dice qué hay detrás, y cualquier deploy que lo nombrara correría «lo último que se publicó», haya pasado las pruebas o no. Con una sola etiqueta por imagen, no hay forma de desplegar algo sin decir exactamente qué es.
- **Lo que no garantiza**: una etiqueta se puede volver a publicar (por ejemplo, re-corriendo la corrida de ese commit). Lo inmutable es el digest (`sha256:…`); el hook de Render lo acepta en lugar del tag, pero no lo usé porque se conoce recién después del build y habría que pasarlo de un job a otro.

**Con qué imagen configuré los servicios**: a los cuatro les cambié la fuente (no los creé de nuevo, así conservaron URL, variables, hook e historial) con la imagen `sha-095c07d…`, la del último merge del TP6. Es sólo el punto de partida: Render necesita una imagen para cambiar la fuente. La que corre es la que nombró el último deploy del pipeline, y se ve en *Events*, no en *Settings*. Por eso nunca uso *Manual Deploy*: desplegaría la imagen de *Settings* y llevaría el entorno para atrás.

## 3. Cómo se comprueba desde afuera que un entorno ejecuta la imagen

En los *Events* de cada servicio, el deploy dice «Triggered via Deploy Hook» y nombra la etiqueta `sha-<commit>` de esa corrida; donde antes Render mostraba un commit construido, ahora muestra una imagen. Esa misma etiqueta está en los dos paquetes. Lo muestro en vivo en la defensa, porque los *Events* no son públicos.

**Lo que el smoke no prueba**: sólo pregunta si el entorno responde (`/api/health`, `/api/health/db` y el front). Si un deploy falla, Render sigue sirviendo la versión anterior y el smoke da verde igual. Cerrarlo sería hornear el commit en la imagen (un `ARG` en el `Dockerfile` que el pipeline pasa con `build-args`) y que el smoke lo compare con el de la corrida. La guía lo deja como concepto, y no lo implementé.

En el TP6 había agregado esa comparación usando `RENDER_GIT_COMMIT`, porque la guía del TP6 la anunciaba como obligatoria en el TP7, y me sirvió para detectar un hook mal cargado. Los servicios de imagen ya no tienen esa variable, así que en este TP volví al smoke de la guía y saqué el `/health` del front.

## 4. Las dos suites: qué probé, qué no, y por qué

**Integración** (`frontend/e2e/api.spec.js`, sin navegador, contra la api de QA):
1. Alta + verificación en la base + borrado + verificación.
2. Nombre vacío → `400`, y la cantidad de publicaciones no cambia.
3. **Elegida por mí: una publicación vendida no se puede modificar** (crear → marcar vendida → cambiar el precio → `409` → borrar). Si se rompe, una vendedora podría «revender» una prenda ya vendida. Es una regla que se aplica sobre lo que quedó guardado en la base, que es justo lo que un unitario con doble no ve.

**E2E** (`frontend/e2e/publicaciones.spec.js`, con Chromium, contra el front de QA):
1. Publicar una prenda (foto, nombre y precio) → aparece en «Mis publicaciones» → eliminarla → ya no está.
2. Precio en cero → el usuario ve el error → la prenda no aparece en su lista.
3. **Elegido por mí: editar el precio y que siga al recargar.** Es lo que hace una vendedora seguido, y si no anda, me escribe. Toca la base: después de guardar, recargo la página y busco el precio nuevo.

Las seis crean su dato con un nombre que no se repite (con la hora adentro) y lo borran, comprobándolo, porque QA es uno solo y lo comparten todas las corridas.

**Qué no puse en cada suite (pirámide)**: las validaciones de email, contraseña, teléfono y precio, y la lógica del matching, ya están en los unitarios del TP5 (milisegundos, sin red). En integración no repito lo que la e2e ya recorre, y en e2e no pongo la búsqueda por foto: depende de Azure OpenAI, tarda y cuesta, y daría tests frágiles por motivos ajenos a mi código. Tampoco pongo el registro: crearía un usuario nuevo en cada corrida, y la app no tiene forma de borrarlo.

**Cómo se loguean**: a diferencia de la app de la cátedra, en Curatta hay que tener sesión para publicar. Las dos suites usan un usuario de prueba que existe sólo en QA, y su email y contraseña entran por secrets del repositorio (`E2E_EMAIL` y `E2E_PASSWORD`), nunca escritos en el código. Límite: el reporte de Playwright muestra en texto lo que se escribe en el campo de contraseña, y los artefactos los puede bajar cualquiera con cuenta de GitHub. Es aceptable porque ese usuario es sólo de QA, sin datos reales, y la contraseña no se usa en otro lado.

## 5. Integración y e2e no son lo mismo: el par verde/rojo

La integración le habla a la api directo, con su base de verdad; la e2e usa la pantalla como una persona. Juntas no sólo avisan que algo se rompió: dicen **quién**.

En la corrida roja, alguien cambió el texto del botón «Publicar» por «Subir prenda», un cambio de estética que compila y pasa los 44 unitarios. El smoke dio verde porque el sistema respondía, la integración dio verde (3/3) y la e2e dio rojo (3/3). Es la fila 1 de la tabla del §2.5: **la api y la base están sanas, el que se rompió es el front**. Lo diagnostiqué con los reportes, sin abrir el código: en el de e2e, todos los pasos pasan (login, foto, nombre, precio) hasta el click en «Publicar»; el error dice `waiting for getByRole('button', { name: 'Publicar' })`, y el `error-context` muestra la página entera con un `button "Subir prenda"` y ningún botón «Publicar». El de integración, de la misma corrida, está en verde. `deploy-prod` no corrió, así que ese front roto nunca llegó a PROD.

Si hubiera roto la api, la integración habría quedado roja y la e2e ni habría corrido (su `needs` no se cumple): fila 2, también información.

**Qué no ataja mi gate**: lo que no recorren mis seis pruebas (la búsqueda por foto, el link de WhatsApp, el logout), los errores visuales que no cambian el nombre accesible de nada, lo que sólo pasa con los datos o el tráfico de producción, y los problemas de rendimiento.

## 6. Por qué la integración amplia y no la estrecha

Mi integración le habla a la api **ya desplegada** en QA. La alternativa es la estrecha: levantar la api en el propio job, con un Postgres descartable como `services:`.

- **Gano**: prueba además que el deploy quedó bien (la imagen que corre en QA, con su base y sus variables), y no tengo que levantar una base ni configurar nada nuevo en el pipeline.
- **Pierdo**: llega más tarde (necesita el deploy a QA), depende de que QA esté despierto y de la red, y comparte la base de QA con todas las corridas, así que las pruebas tienen que limpiar lo que crean.

## 7. Cold start y tests flaky

El plan gratis duerme los servicios de QA, y despertar la api tardó entre 32 y 44 s en mis pruebas. Cuando corren las suites, QA ya lo despertaron el smoke y la integración. Igual, la configuración de Playwright tiene tiempos largos (60 s por test, 15 s por aserción) y **un** reintento, y nunca uso `sleep`: Playwright espera a que lo que busca aparezca.

Un test **flaky** es uno que a veces pasa y a veces falla sin que cambie nada; en el reporte aparece así cuando pasa recién en el reintento. Es peor que no tener test, porque entrena al equipo a ignorar el rojo. Por eso abro el reporte aunque la corrida esté verde: un flaky aislado puede ser la red, pero el mismo test flaky dos corridas seguidas hay que arreglarlo. En mis corridas no hubo ninguno.

## 8. La misma imagen del front en QA y en PROD

La imagen del front tiene adentro el código compilado y sus dependencias. Lo que cambia entre entornos va por variables del servicio de Render: `BACKEND_URL` (la api de su entorno, que el proxy del front lee en cada pedido desde el TP6) y `JWT_SECRET` (el mismo que el backend de su entorno, distinto entre QA y PROD). Por eso la misma imagen `…-frontend:sha-<commit>` corre en los dos y cada una habla con su api.

## 9. Límite conocido: QA es uno solo

Las dos suites usan la base de QA, y la corrida de un merge nuevo puede redesplegar QA mientras las pruebas de la anterior todavía corren. Se vería como un rojo que no es de mi código, o peor, como un verde que en parte probó otra imagen. Lo reconocería mirando en *Events* de QA qué imagen corría y a qué hora corrió cada `deploy-qa`. En ese caso rechazaría la corrida vieja con su motivo, no re-correría sus pruebas (QA ya tiene la otra imagen), y me quedaría con la nueva, que trae los dos cambios. La regla que sigo: un merge por vez mientras la cadena corre. Un equipo real lo resuelve con un entorno por corrida.

## 10. Adaptaciones a mi stack

- El nombre de la imagen va escrito a mano y en minúsculas, porque mi usuario de GitHub tiene mayúscula.
- Mis endpoints de vida y de base son `/api/health` y `/api/health/db`, en lugar de `/health` y `/api/tareas`.
- El spec de navegador se llama `publicaciones.spec.js`, porque mi dato principal son publicaciones.
- Mi api contesta `200` (no `201`/`204`) al crear y al borrar: las pruebas afirman lo que contesta mi api.
- El `exclude` de vitest va en `vitest.config.mts`, porque no uso Vite.
- Los specs usan `__dirname` en vez de `import.meta`, porque el `package.json` del front (Next.js) no es de tipo módulo.
- Para correr la integración local publiqué el puerto de la api en `docker-compose.yml`, en el **4001** de mi máquina (el 4000 lo ocupa otro proyecto mío).
- **Accesibilidad**: los `<label>` del formulario de nueva publicación no estaban asociados a sus campos y el error no tenía `role="alert"`. Agregué `htmlFor`/`id`, el `role="alert"` y nombres accesibles por fila en los botones Eliminar, Editar y Guardar (`aria-label="Eliminar <nombre>"`). La e2e lo señalaba: si no encuentra un campo por su nombre, tampoco lo encuentra un lector de pantalla.

## 11. Problemas encontrados

- **Subí incompleto el primer PR del `imgURL`.** El commit tenía sólo el borrado del `/health` del front: el `ci.yml` no entró, porque se hizo el commit sin que el `git add` hubiera corrido. La corrida de `main` mandó `&ref=` a servicios que ya ejecutaban imágenes, Render contestó `400`, el `curl -f` puso `deploy-qa` en rojo y PROD no se tocó. Lo corregí con un segundo PR con los dos archivos que faltaban, y desde entonces miro el `git status` antes de cada commit.
- **El puerto 4000 de mi máquina estaba ocupado** por otro proyecto: publiqué la api local en el 4001.
- **Los specs no cargaban** (`Cannot use 'import.meta' outside a module`): mi `package.json` no es de tipo módulo. Usé `__dirname`.
- **El registro del usuario de prueba se colgó**: la api de QA estaba dormida y tardó 44 s en despertar. Reintenté con la api despierta.
- **Un build de GitHub tardó 7 minutos** en lugar de uno, sin error: lentitud de los runners.

## 12. Declaración de uso de IA

Usé Claude Code (en VS Code) durante todo el TP7. Le permití editar archivos y correr comandos de verificación (`docker compose`, las suites de Playwright contra mi compose, `curl` y `gh` para leer las corridas), pero los commits, pushes, PRs, merges, aprobaciones, el cambio de fuente de los servicios en Render, el usuario de prueba de QA, los secrets y el tag los hice yo.

Lo usé para traducir la guía (.NET + Vite, app de tareas sin login) a mi app (Next.js, publicaciones con sesión), escribir los jobs, los specs y los cambios de accesibilidad. Las terceras pruebas de cada suite y la rotura del front (el texto del botón, porque es el tipo de cambio de estética que puede pasar en cualquier equipo) las elegí yo.

Cómo verifiqué lo que produjo: corrí las seis pruebas contra mi compose antes de subirlas y abrí el reporte y una traza; comprobé que vitest siguiera corriendo los 44 unitarios con el `exclude`; probé el hook con `imgURL` a mano en un solo servicio antes de tocar los otros tres; revisé en *Events* de los cuatro servicios que el deploy nombrara la etiqueta de la corrida; y para la corrida roja leí los dos reportes yo misma. Sé qué verifica cada test, contra qué entorno corre y qué pasa si falla: si falla la integración, la e2e no corre; si falla la e2e, `deploy-prod` no pide aprobación.
