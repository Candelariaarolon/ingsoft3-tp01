Pregunta 1. Por qué Git no pudo resolver el conflicto solo?

Git resuelve automáticamente cuando los cambios están en líneas distintas del archivo. 
El conflicto que fabricamos fue justo lo contrario: dos ramas (feature/titulo-b y main) modificaron la misma línea (el título del README) con contenido distinto 
Ahí Git no tiene forma de saber cuál de las dos versiones es la que yo quiero conservar, y se están "pisando". Decidir cuál queda es una decisión que debemos tomar 
nosotros porque es sobre el contenido que queremos que quede definitivo. si queríamos evitarlo deberíamos haber hecho pull/rebase de main antes de tocar esa misma línea.
O también a la hora de trabajar un equipo se puede acordar no trabajar en la misma linea al mismo tiempo.

Pregunta 2. Qué problemas encontraste y cómo los solucionaste

Hice un commit de prueba directo en main (para probar la protección de rama) y quedó pisado en mi historial local aunque el push fue rechazado. 
Lo saqué con git reset --hard origin/main y al principio probé con HEAD~1 y no funcionó porque no había contado bien los commits; origin/main fue más seguro porque no depende de contar,
apunta directo al estado real del remoto.

Se me creó una rama con nombre automático (Candelariaarolon-patch-1) en vez de seguir la convención feature/<descripcion> y aprendí a fijarme en ese campo antes de confirmar.

Dejé un placeholder sin reemplazar (<url-del-repo>) en el primer commit del README. Como el PR todavía estaba abierto, lo arreglé con un commit nuevo directo sobre la misma rama
entonces no hizo falta abrir otro PR, porque cualquier commit a la rama de origen se suma automáticamente al PR abierto.

Terminé con ramas sueltas sin usar (de intentos de PR que cancelé a mitad de camino). No afectaban nada, pero las borré desde el listado de branches para mantener el repo prolijo.


Pregunta 3. Declaración de uso de IA

Usé Claude como asistente para entender qué hacía cada comando de Git antes de correrlo, para interpretar mensajes de error de la terminal y
de GitHub y para guiarme paso a paso en la resolución del conflicto de merge. Por ahi dudaba de algo de la consigna yt le mstraba a claude con
un screenshot de lo que estaba pasando en mi pantalla asi me daba un double check y me indicaba si estaba bien la próxima acción que iba a hacer
o si era correcto tocar el botón que queria tocar como siguiente paso.me dejaba tranquila porque se que capaz toco algo mal y tengo que volver a
hacer todo de nuevo por no chequear doble. No le pedí que tomara decisiones de contenido por mí, el título elegido en el conflicto, los nombres 
de rama y los mensajes de commit los decidí yo. 


## TP2 — Elección de la app

### Qué elegí y por qué

Adapté un proyecto propio (Curatta, una app de moda que tenía armada de antes) en un
marketplace de ropa entre usuarios: cada usuario publica prendas y puede buscar prendas
parecidas subiendo una foto, comparando contra las publicaciones de otros usuarios con
Azure OpenAI Vision.

Elegí adaptar un proyecto mío en vez de arrancar de cero porque ya conocía el código de
memoria y no partía de cero en nada — pero tuve que sacarle todas las integraciones
externas que no aportaban a la materia (Tiendanube, Mercado Libre, Pinterest) y construir
de cero el CRUD de publicaciones, que es lo que hoy sostiene las reglas de negocio del TP5.

### Contra los criterios de elección

- **¿Buildea y corre localmente hoy?** Sí — lo probé clonando el repo en una carpeta
  aislada y levantándolo solo con `docker-compose.yml` + un `.env` nuevo, sin tocar código
  ni pasos manuales.
- **¿Tiene o le puedo escribir tests?** Todavía no tiene tests escritos, pero
  tiene las reglas para poder escribirlos con comodidad.
- **Tamaño:** CRUD completo de publicaciones + 3 pantallas (buscar por foto, mis
  publicaciones, nueva publicación).

### Arquitectura

`backend/` (API, Node/Next.js) y `frontend/` (páginas, Node/Next.js) son dos servicios
independientes, cada uno con su Dockerfile, orquestados con `docker-compose.yml` junto a
Postgres. El frontend nunca le pega directo a la base — todo pasa por el backend.

Para que el browser nunca necesite conocer la ubicación del backend (y así no hacer falta
CORS), el frontend usa `rewrites()` de Next.js para reenviar `/api/*` al backend del lado
del servidor — el mismo problema y la misma solución que resolvería un `proxy_pass` de
nginx delante de una SPA, pero con el mecanismo propio de Next.js. La diferencia real que
quiero dejar anotada: nginx resuelve el destino del proxy en cada request (en runtime), así
que la misma imagen sirve en cualquier entorno solo cambiando variables de entorno. El
`rewrites()` de Next.js resuelve el destino una sola vez, en el build de la imagen — así
que para apuntar el mismo frontend a un backend distinto (QA vs prod) hace falta
rebuildear la imagen con un build arg distinto, no alcanza con cambiar una variable de
entorno al arrancar el contenedor. Sigue sin haber CORS ni URL absoluta en el código del
browser, pero la portabilidad entre entornos no es tan directa como con nginx.

### Dependencia externa: Azure OpenAI

El matching por foto depende de Azure OpenAI Vision, una API paga de terceros — ya lo
hablé con el profesor. El resto de la app (publicar, editar, borrar, marcar como vendida)
no depende de esto: si las credenciales no están configuradas, esas funciones siguen
andando normal y solo la búsqueda por foto muestra un error en vez de resultados.
