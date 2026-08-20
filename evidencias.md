# Evidencias — TP1

## 1. Push directo a main rechazado

![Push rechazado](img/push-rechazado.jpeg)

GitHub rechaza el push directo a la rama main porque está protegida y los cambios deben ingresar mediante Pull Request.

## 2. Conflicto de merge en el Pull Request

![Conflicto en PR](img/conflicto-pr.jpeg)

Luego de mergear la rama `feature/titulo-a`, el Pull Request de `feature/titulo-b` entra en conflicto porque ambas ramas modificaron la misma línea del README.

## 3. Marcadores del conflicto

![Marcadores del conflicto](img/marcadores-conflicto.jpeg)

Git muestra los marcadores `<<<<<<<`, `=======` y `>>>>>>>` para indicar las dos versiones que no puede combinar automáticamente.

## 4. Release v1.0.0 publicada

![Release v1.0.0](img/release-v1.0.0.jpeg)

Se publica la primera versión estable del TP mediante el tag y la release `v1.0.0`.