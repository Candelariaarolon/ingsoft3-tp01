# Evidencias — TP1

## 1. Push directo a main rechazado
![push rechazado](push-rechazado.png)
GitHub rechaza el push porque `main` está protegida y la regla alcanza también a la administradora del repo (sin bypass).

## 2. Aviso de conflicto en el PR
![aviso de conflicto](conflicto-aviso-pr.png)
GitHub avisa que el PR de la rama `feature/titulo-b` no se puede mergear automáticamente porque hay un conflicto con `main`.

## 3. Marcadores del conflicto
![marcadores del conflicto](conflicto-marcadores.png)
El editor de GitHub muestra los marcadores `<<<<<<<`, `=======` y `>>>>>>>` delimitando la versión de cada rama sobre la misma línea del README.

## 4. Release publicada
![release publicada](release-publicada.png)
Tag `v1.0.0` publicado como release en el repositorio, con las notas de qué incluye la entrega.


