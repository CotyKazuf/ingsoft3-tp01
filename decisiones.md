# Decisiones — TP1

## 1. Conflicto de merge

Git no pudo resolver el conflicto automáticamente porque las ramas `feature/titulo-a` y `feature/titulo-b` modificaron de manera diferente la misma línea del archivo `README.md`.

El conflicto no habría aparecido si las ramas hubieran modificado líneas distintas o si una de las ramas se hubiera actualizado con los cambios de `main` antes de realizar su modificación.

Para resolverlo, revisé las dos versiones que Git mostraba mediante los marcadores de conflicto y decidí conservar la versión B del título.

## 2. Problemas encontrados

Durante el trabajo tuve un problema al ejecutar `git pull` porque estaba ubicada en una carpeta que correspondía a otro repositorio. El comando intentaba conectarse a un remoto incorrecto.

Lo solucioné entrando a la carpeta correcta del repositorio `ingsoft3-tp01` y ejecutando nuevamente `git pull`.

También fue necesario configurar correctamente la protección de la rama `main` para impedir los pushes directos y permitir que los cambios ingresaran únicamente mediante Pull Requests.

## 3. Uso de inteligencia artificial

Utilicé ChatGPT como apoyo para interpretar la consigna del trabajo práctico, comprender el significado de los comandos de Git y seguir el procedimiento paso a paso.

Verifiqué las indicaciones observando los resultados de cada comando en la terminal y comprobando en GitHub que las ramas, Pull Requests, protecciones, conflictos, tags y releases se comportaran de acuerdo con lo indicado en la guía de la cátedra.



## TP2

### Problemas y cómo se resolvieron

Al probar los endpoints del backend localmente en Windows con PowerShell, tanto `curl` (que en PowerShell es en realidad un alias de `Invoke-WebRequest`) como `curl.exe` con comillas escapadas fallaron: PowerShell no maneja bien el escapado de comillas dobles al pasarle argumentos a un programa externo, lo que hacía llegar el JSON roto al backend.

Se resolvió usando el cmdlet nativo de PowerShell `Invoke-RestMethod`, armando el body como un objeto de PowerShell y convirtiéndolo con `ConvertTo-Json` antes de enviarlo — así se evita depender del escapado de comillas en la línea de comandos.