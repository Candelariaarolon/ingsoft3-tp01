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


