# Guía del proyecto

## Objetivo

Crear una aplicación del tiempo que permita buscar ciudades, consultar
el clima actual y ver un pronóstico de tres días: hoy y los dos días siguientes.

## Stack

- HTML5 para la estructura.
- CSS para los estilos y el diseño adaptable.
- JavaScript puro para la interacción y las consultas a la API.
- Sin frameworks, herramientas de compilación ni dependencias externas.

## Estructura de archivos

Mantener todos los archivos en la raíz para facilitar el desarrollo:

- `index.html`: estructura y contenido de la página.
- `estilos.css`: estilos de la aplicación.
- `clima.js`: búsqueda de ciudades, consultas del tiempo y actualización de la interfaz.
- `AGENTS.md`: instrucciones del proyecto.
- `.gitignore`: exclusiones del repositorio.

No crear carpetas adicionales hasta que sean necesarias.

## Ejecución local

- Abrir `index.html` directamente en un navegador moderno.
- Cargar `clima.js` con un script clásico y el atributo `defer`.
- No usar módulos de JavaScript ni cargar archivos locales mediante `fetch`,
  para mantener compatible la apertura directa de la página.
- Las consultas a Open-Meteo requieren conexión a Internet.
- No se necesita instalar paquetes ni ejecutar un proceso de compilación.

## API utilizada

Usar Open-Meteo mediante `fetch`, sin claves de API para su servicio público
de uso no comercial.

Documentación oficial consultada:
- https://open-meteo.com/en/docs
- https://open-meteo.com/en/docs/geocoding-api

### Búsqueda de ciudades

Endpoint:
`https://geocoding-api.open-meteo.com/v1/search`

Parámetros principales:
- `name`: texto introducido por la persona, sin espacios en los extremos.
- `count=5`: máximo de cinco resultados.
- `language=es`: nombres en español cuando estén disponibles; en caso contrario,
  la API puede devolver nombres en inglés o en el idioma local.
- `format=json`: respuesta en JSON.

Una búsqueda vacía o de un carácter no devuelve resultados. Dos caracteres
buscan un nombre exacto; tres o más permiten coincidencias por prefijo
normalizado. Validar al menos dos caracteres antes de consultar.

Mostrar el nombre, la región (`admin1`) y el país para distinguir ciudades con
nombres similares, omitiendo los campos ausentes. Tratar la ausencia de
`results` como una búsqueda sin resultados. Usar las coordenadas del resultado
elegido para consultar el tiempo. Construir los parámetros con `URLSearchParams`.

### Clima actual y pronóstico

Endpoint:
`https://api.open-meteo.com/v1/forecast`

Parámetros principales:
- `latitude` y `longitude`: coordenadas de la ciudad.
- `current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`.
- `daily=weather_code,temperature_2m_max,temperature_2m_min`.
- `forecast_days=3`: hoy y los dos días siguientes.
- `timezone=auto`: resolver la zona horaria a partir de las coordenadas;
  es necesario especificar una zona horaria al solicitar datos diarios.
- `temperature_unit=celsius`.
- `wind_speed_unit=kmh`.

Las condiciones actuales proceden de datos de modelos meteorológicos con
intervalos de 15 minutos. Interpretar los códigos meteorológicos WMO de
Open-Meteo con descripciones en español; el código diario representa la
condición más severa del día.

Mostrar las fechas de `daily.time` respetando el día devuelto por la API para
la ciudad, sin desplazarlas por la zona horaria del navegador. Mostrar las
unidades indicadas en la respuesta y tratar los valores nulos como no disponibles.
Incluir una atribución visible a Open-Meteo y a GeoNames para los datos de ubicación.

### Tiempo límite de las peticiones

- Todas las peticiones, tanto de ciudades como del tiempo, deben tener un
  límite de 10 segundos para evitar una carga indefinida.
- Usar `AbortController`, pasar su `signal` a `fetch` y programar la
  cancelación con `setTimeout`.
- Mantener el límite hasta terminar de leer la respuesta JSON.
- Limpiar el temporizador con `clearTimeout` en un bloque `finally` y
  finalizar siempre el estado de carga.
- Si se supera el límite, mostrar un mensaje en español que permita
  volver a intentar la consulta.

## Convenciones del código

- Usar nombres claros en español para archivos, variables, funciones,
  clases CSS e identificadores HTML.
- Usar `camelCase` en JavaScript: `buscarCiudades`, `obtenerClima`,
  `mostrarPronostico`.
- Usar `kebab-case` en CSS y en identificadores HTML:
  `tarjeta-clima`, `lista-ciudades`.
- Evitar tildes y la letra ñ en identificadores; usarlas normalmente
  en los textos de la interfaz.
- Mantener en inglés los nombres exigidos por las API y por el navegador.
- Usar `const` por defecto y `let` cuando sea necesario reasignar.
- Usar `async`/`await` y `try`/`catch` para las consultas.
- Comprobar `response.ok` antes de procesar la respuesta.
- Separar la consulta de datos de su presentación en funciones sencillas.
- Usar `textContent` para insertar textos procedentes de la API.
- Mantener una indentación de dos espacios.
- Añadir comentarios solo cuando expliquen una decisión no evidente.
- Usar HTML semántico, etiquetas en los campos y controles accesibles.
- Mostrar estados de carga, búsqueda sin resultados y errores en español.
- No guardar contraseñas ni credenciales en el repositorio.

## Forma de trabajo y comprobación

- Trabajar por etapas y explicar cómo comprobar cada cambio.
- Antes de crear archivos, proponer su estructura y esperar confirmación.
- No instalar dependencias sin autorización.
- Verificar manualmente la búsqueda, la selección de ciudad, el clima
  actual y los tres días del pronóstico.
- Comprobar búsquedas vacías, ciudades sin resultados y fallos de conexión.
- Simular una respuesta que tarde más de 10 segundos y comprobar que se
  cancela la petición, aparece el mensaje y termina el estado de carga.
- Revisar el diseño en pantallas pequeñas y grandes, la navegación
  con teclado y la consola del navegador.
