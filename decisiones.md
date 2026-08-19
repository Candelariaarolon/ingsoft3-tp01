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
