# TP1: Git colaborativo

## 1. Por qué Git no pudo resolver el conflicto solo

Git resuelve automáticamente cuando los cambios están en líneas distintas del archivo, o no se "pisan" entre sí. El conflicto que fabricamos fue lo contrario: dos ramas (`feature/título-b` y `feature/título-a`) modificaron la misma línea (el título del README) con contenido distinto. Ahí, Git no tiene forma de saber cuál de las dos versiones es la que quiero conservar, porque los dos cambios se quieren hacer en el mismo lugar. Por eso Git avisa y el usuario decide cuál queda (puedo elegir una, la otra, o crear un mix nuevo de ambas).

**¿Qué habría tenido que pasar para que nunca apareciera?** Debería haber hecho pull/rebase de `main` en el momento de la segunda modificación, antes de tocar esa misma línea. Pull o rebase son formas de traer esos cambios nuevos de `main` a mi rama antes de terminar mi trabajo, para revisar si hay problemas en vez de enterarme del conflicto recién al momento de mergear. En el caso de trabajar en equipo, también se puede acordar no tocar la misma línea al mismo tiempo.

## 2. Problemas encontrados y cómo los solucioné

- **Hice un commit en `main` en mi compu para probar si la protección de rama me iba a frenar.** Efectivamente me frenó: intenté hacer push y GitHub lo rechazó. Pero el commit ya existía en mi compu igual, porque el commit se guarda local y recién con `push` se manda al remoto. Entonces aunque el push falló, seguía teniendo ese commit de prueba colgado en mi `main` local, y al principio no me di cuenta que necesitaba sacarlo para que quedara igual al de GitHub. Probé primero con `HEAD~1`, que significa "un commit antes de donde estoy parado", pero depende de contar bien cuántos commits hice de más, y como me confundí contando, me dejó mal. Después usé `git reset --hard origin/main`, que no depende de contar nada: directamente me lleva a donde está `main` en GitHub en ese momento. Por eso fue más segura. Eso sí, `--hard` borra cambios sin guardarlos en ningún lado, así que en mi caso estaba bien porque era un commit descartable, pero si hubiera tenido algo que quería conservar, lo perdía igual.

- **Se me creó una rama con nombre automático (`Candelariaarolon-patch-1`)** en vez de seguir la convención `feature/`, porque edité el archivo directo desde la interfaz web de GitHub y, como la rama estaba protegida, GitHub me ofreció crear una rama nueva sola con ese nombre genérico. Aprendí a fijarme en ese campo antes de confirmar, porque es editable en el momento y podía haberlo cambiado a algo tipo `feature/descripciondeloqueestabahaciendo` antes de crear el PR.

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

Elegí adaptar un proyecto mío en vez de arrancar de cero porque ya conocía el código y no partía de cero en nada, pero tuve que sacarle todas las integraciones externas que no aportaban a la materia (Tiendanube, Mercado Libre, Pinterest) y construir de cero el CRUD de publicaciones, que es lo que hoy sostiene las reglas de negocio del TP5. Además, me interesa seguir trabajando sobre este proyecto a futuro.

### Contra los cinco criterios de la guía

- **¿Puedo ejecutarla hoy?** Sí, la probé clonando el repo en una carpeta aislada y levantándola solo con `docker-compose.yml` y el `.env`.

- **¿Conozco los comandos de compilación y ejecución?** Sí, y son los mismos para los dos servicios porque ambos son Next.js: se compila con `npm run build` (corre `next build`) y se arranca con `npm start` (`next start -p 4000` en el backend, `-p 3000` en el frontend, definidos en el `package.json` de cada uno). El backend además corre `prisma generate` en el postinstall y `prisma migrate deploy` al arrancar el contenedor, para que el schema quede al día antes de aceptar tráfico.

- **¿Sé dónde se configura la conexión a la base, y es parametrizable por variable de entorno?** Sí: vive en `backend/prisma/schema.prisma`: `url = env("DATABASE_URL")`. Dice `env` porque no está hardcodeada en ningún lado: para apuntar a otra base (dev, QA, la del contenedor) alcanza con cambiar la variable de entorno, sin tocar código ni recompilar.

- **¿Tiene lógica para testear (TP5)?** Sí, y son reglas reales, no CRUD sin restricciones. Las conté sobre el código actual:

  **Backend (8, cuando la guía pide 4-6):**
  - Email único por usuario.
  - El precio debe ser mayor a 0, validado tanto al crear como al editar una publicación.
  - Una publicación vendida no se puede modificar.
  - Autorización: un usuario solo puede editar/eliminar sus propias publicaciones (404, no 403, para no revelar que la publicación existe).
  - La búsqueda por foto excluye las publicaciones propias de quien busca y solo compara contra publicaciones disponibles.
  - Umbral de match: un score no cuenta como coincidencia salvo que supere 60/100 (`UMBRAL_MATCH`) — regla fija y testeable con un score justo arriba/abajo del corte.
  - Compatibilidad por formalidad: una prenda "deportiva" nunca compite en el matching con prendas de calle, aunque compartan corte/color/patrón.
  - Límite de tamaño de foto al crear una publicación (rechaza fotos de más de ~7MB en base64).

  **Frontend (3, cuando la guía pide 2-3):**
  - El formulario de nueva publicación no deja enviar sin nombre, sin precio válido (>0) o sin foto.
  - La tarjeta de una publicación cambia sus acciones según el estado: si está vendida, solo se puede eliminar (se ocultan "Editar" y "Marcar vendida").
  - La edición inline repite la misma validación de nombre/precio que la creación, antes de guardar.

- **¿La entiendo lo suficiente para modificarla?** Sí, la adapté yo misma partiendo de un proyecto propio.

### Dos consideraciones adicionales

- **Tamaño:** CRUD completo de publicaciones + 3 pantallas (buscar por foto, mis publicaciones, nueva publicación) — dentro del rango que pide la guía.
- **Dependencias externas:** la única dependencia no trivial es Azure OpenAI Vision para el matching por foto, ya hablada y autorizada con el profesor. El resto de la app (publicar, editar, borrar, marcar como vendida) no depende de ella: si las credenciales no están configuradas, esas funciones andan normal y solo la búsqueda por foto muestra un error en vez de resultados.

## 2. Decisiones de contenerización

- **Arquitectura:** `backend/` (API, Node/Next.js) y `frontend/` (páginas, Node/Next.js) son dos servicios independientes, cada uno con su Dockerfile, orquestados con `docker-compose.yml` junto a Postgres. El frontend nunca le pega directo a la base: todo pasa por el backend.

- **Ruteo frontend a backend:** para que el browser nunca necesite conocer la ubicación del backend (y así no hacer falta CORS), el frontend usa `rewrites()` de Next.js para reenviar `/api/*` al backend del lado del servidor — el mismo problema y la misma solución que resolvería un `proxy_pass` de nginx delante de una SPA, pero con el mecanismo propio de Next.js.

- **Diferencia importante que quiero dejar anotada:** nginx resuelve el destino del proxy en cada request (runtime), así que la misma imagen sirve en cualquier entorno solo cambiando variables de entorno. El `rewrites()` de Next.js resuelve el destino una sola vez, en el build de la imagen, así que para apuntar el mismo frontend a un backend distinto (QA vs prod) hace falta rebuildear la imagen con un build arg distinto, no alcanza con cambiar una variable de entorno al arrancar el contenedor. Sigue sin haber CORS ni URL absoluta en el código del browser, pero la portabilidad entre entornos no es tan directa como con nginx.

- **Dependencia externa (Azure OpenAI):** el matching por foto depende de Azure OpenAI Vision, una API paga de terceros, hablado y autorizado con el profesor. El resto de la app no depende de esto: si las credenciales no están configuradas, esas funciones siguen andando normal y solo la búsqueda por foto muestra un error en vez de resultados.

- **Imágenes base:** `node:20-slim` en las dos etapas de los dos Dockerfiles, en vez de `alpine`. La razón puntual es del backend: Prisma necesita `openssl` disponible en runtime para su motor de queries (`apt-get install openssl` en el Dockerfile), y alpine complica esto por usar una libc distinta (musl). Mantuve la misma base en el frontend por consistencia, aunque ahí no hay esa dependencia puntual.

- **Qué persiste y qué no:** solo la base de datos tiene estado persistente, en un volumen nombrado `/var/lib/postgresql/data`, gestionado por Docker. Backend y frontend son completamente *stateless*: no tienen volúmenes ni bind mounts, y cualquier dato que necesite sobrevivir a un restart tiene que vivir en Postgres.

  Confirmé esto en la práctica: creé una publicación, hice `docker compose down` (sin `-v`) y `up` de nuevo, y la publicación seguía ahí — el volumen sobrevivió aunque el contenedor se destruyó y recreó. Después probé lo contrario con `down -v`, y ahí sí `GET /api/publicaciones` devolvió vacío, confirmando que ese flag es el que realmente borra los datos.

  Un detalle que vale la pena dejar anotado: después de ese `down -v`, mi sesión (cookie de login) siguió siendo válida, porque es un JWT autofirmado que se verifica solo con `JWT_SECRET`, sin consultar la base. La prueba real de persistencia no fue que me desloguee, sino que los datos desaparecieron y la sesión no dependía de ellos.

## 3. Problemas encontrados

- **Tenía el puerto de `db` publicado al host (`5433:5432`) sin usarlo para nada**, no tenía ningún cliente Postgres local corriendo. Lo saqué al revisar que la conexión real del backend viaja por la red interna de compose (`db:5432`), no por ese mapeo. Le pedí ayuda a Claude para pensar si el `docker-compose.yml` reflejaba bien mi stack, comparándolo contra un ejemplo del profesor pensado para .NET + nginx.

- **Cuando llegué al momento de subir todo y abrir el PR, corrí `git remote -v` para ver a qué repo de GitHub estaba conectada mi carpeta**, porque no estaba viendo los PRs aparecer después de mis commits, y no me devolvió nada. O sea que esta carpeta donde venía trabajando (`curatta-temp`) tenía commits míos reales, pero nunca había estado conectada al repo de verdad del semestre (`ingsoft3-tp01`). En algún momento debo haber hecho un `git init` suelto ahí sin enganchar el remoto, y seguí laburando sin darme cuenta. Antes de tocar nada me fijé que lo que ya estaba subido en `origin/main` (`backend`, `frontend`, `decisiones.md`, `evidencias.md`) fuera la app correcta y no algo viejo, y una vez confirmado eso, conecté el remoto y traje ese historial. El problema es que mi historial local y el de `origin/main` no compartían ningún commit en común: son como dos árboles genealógicos separados que nunca se tocaron, aunque el contenido se pareciera. Si intentaba mezclarlos derecho con un merge, Git no sabía cómo compaginarlos y tiraba conflictos por todos lados. Por eso, en vez de mezclar los dos historiales, armé una rama nueva partiendo de `origin/main` (el bueno) y le sumé encima mis archivos actualizados de Docker, sin pisar lo que ya estaba subido.

- **Después de hacer el push de las imágenes al registry, quise confirmar que habían quedado públicas haciendo un `docker pull`.** Docker me contestó "Image is up to date" sin bajar nada. Al toque pensé que estaba todo bien, pero en realidad esa prueba no servía para nada: yo ya tenía esa imagen guardada en mi disco porque la acababa de construir ahí mismo, así que Docker ni se molestó en ir a buscar nada al registry, solo miró que ya la tenía y cortó ahí. O sea que ese pull hubiera dado el mismo resultado estando la imagen pública o privada, porque nunca llegó a probar el permiso real. Para hacer la prueba de verdad, primero me deslogueé del registry con `docker logout`, después borré la copia local de la imagen con `docker rmi` (usando los dos nombres que tenía, porque si no me quedaba una copia con otro tag), y recién ahí repetí el pull. Esa vez sí bajó capa por capa, sin que yo tuviera ninguna sesión iniciada, y eso sí confirma que la imagen es pública de verdad: cualquiera sin credenciales la puede bajar.

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
