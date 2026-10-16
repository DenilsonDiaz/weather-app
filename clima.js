const formularioBusqueda = document.getElementById("formulario-busqueda");
const campoCiudad = document.getElementById("campo-ciudad");
const botonBuscar = document.getElementById("boton-buscar");
const mensajeEstado = document.getElementById("mensaje-estado");
const resultadosBusqueda = document.getElementById("resultados-busqueda");
const listaCiudades = document.getElementById("lista-ciudades");
const climaActual = document.getElementById("clima-actual");
const ubicacionCiudad = document.getElementById("ubicacion-ciudad");
const temperaturaActual = document.getElementById("temperatura-actual");
const sensacionTermica = document.getElementById("sensacion-termica");
const condicionCielo = document.getElementById("condicion-cielo");
const velocidadViento = document.getElementById("velocidad-viento");
const humedadActual = document.getElementById("humedad-actual");

const condicionesCielo = {
  0: "Cielo despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla con escarcha",
  51: "Llovizna ligera",
  53: "Llovizna moderada",
  55: "Llovizna intensa",
  56: "Llovizna helada ligera",
  57: "Llovizna helada intensa",
  61: "Lluvia ligera",
  63: "Lluvia moderada",
  65: "Lluvia intensa",
  66: "Lluvia helada ligera",
  67: "Lluvia helada intensa",
  71: "Nevada ligera",
  73: "Nevada moderada",
  75: "Nevada intensa",
  77: "Granos de nieve",
  80: "Chubascos ligeros",
  81: "Chubascos moderados",
  82: "Chubascos violentos",
  85: "Chubascos de nieve ligeros",
  86: "Chubascos de nieve intensos",
  95: "Tormenta",
  96: "Tormenta con granizo ligero",
  99: "Tormenta con granizo intenso"
};

let ciudadSeleccionada = null;
let buscando = false;

// La validación propia permite mostrar también los errores en español y sin espacios.
formularioBusqueda.noValidate = true;
formularioBusqueda.addEventListener("submit", buscarCiudades);

function mostrarMensaje(texto, esError = false) {
  mensajeEstado.textContent = texto;
  mensajeEstado.classList.toggle("mensaje-error", esError);
}

function establecerCarga(enCarga, textoCarga = "Buscando…") {
  buscando = enCarga;
  campoCiudad.disabled = enCarga;
  botonBuscar.disabled = enCarga;
  formularioBusqueda.setAttribute("aria-busy", String(enCarga));
  botonBuscar.textContent = enCarga ? textoCarga : "Buscar";
  resultadosBusqueda.setAttribute("aria-busy", String(enCarga));
  for (const boton of listaCiudades.querySelectorAll("button")) {
    boton.disabled = enCarga;
  }
}

async function consultarJson(url) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), 10000);

  try {
    const respuesta = await fetch(url, { signal: controlador.signal });

    if (!respuesta.ok) {
      throw new Error("No se pudo consultar el servicio de Open-Meteo.");
    }

    return await respuesta.json();
  } catch (error) {
    if (controlador.signal.aborted) {
      throw new DOMException("La consulta superó el límite de 10 segundos. Vuelve a intentarlo.", "TimeoutError");
    }

    throw error;
  } finally {
    clearTimeout(temporizador);
  }
}

async function consultarCiudades(nombre) {
  const parametros = new URLSearchParams({
    name: nombre,
    count: "5",
    language: "es",
    format: "json"
  });
  const datos = await consultarJson(`https://geocoding-api.open-meteo.com/v1/search?${parametros}`);
  return (datos.results ?? []).slice(0, 5);
}

async function obtenerClima(ciudad) {
  const parametros = new URLSearchParams({
    latitude: ciudad.latitude,
    longitude: ciudad.longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    timezone: "auto",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh"
  });
  return await consultarJson(`https://api.open-meteo.com/v1/forecast?${parametros}`);
}

function formatearValor(valor, unidad) {
  if (valor == null) {
    return "No disponible";
  }

  return `${valor} ${unidad ?? ""}`.trim();
}

function mostrarClima(datos, ciudad) {
  const actual = datos.current ?? {};
  const unidades = datos.current_units ?? {};
  ubicacionCiudad.textContent = ciudad.nombre;
  temperaturaActual.textContent = formatearValor(actual.temperature_2m, unidades.temperature_2m);
  sensacionTermica.textContent = formatearValor(actual.apparent_temperature, unidades.apparent_temperature);
  condicionCielo.textContent = condicionesCielo[actual.weather_code] ?? "No disponible";
  velocidadViento.textContent = formatearValor(actual.wind_speed_10m, unidades.wind_speed_10m);
  humedadActual.textContent = formatearValor(actual.relative_humidity_2m, unidades.relative_humidity_2m);
  climaActual.hidden = false;
}

function obtenerNombreCiudad(ciudad) {
  return [ciudad.name, ciudad.admin1, ciudad.country].filter(Boolean).join(", ");
}

async function seleccionarCiudad(ciudad, botonSeleccionado) {
  if (buscando) {
    return;
  }

  climaActual.hidden = true;
  ciudadSeleccionada = {
    nombre: obtenerNombreCiudad(ciudad),
    latitude: ciudad.latitude,
    longitude: ciudad.longitude
  };

  for (const boton of listaCiudades.querySelectorAll("button")) {
    boton.setAttribute("aria-pressed", String(boton === botonSeleccionado));
  }

  establecerCarga(true, "Consultando clima…");
  mostrarMensaje(`Consultando el clima de ${ciudadSeleccionada.nombre}…`);

  try {
    const datos = await obtenerClima(ciudadSeleccionada);
    mostrarClima(datos, ciudadSeleccionada);
    mostrarMensaje(`Clima actual de ${ciudadSeleccionada.nombre}.`);
  } catch (error) {
    const detalle = error.name === "TimeoutError"
      ? error.message
      : "No se pudo consultar el clima. Comprueba tu conexión y vuelve a intentarlo.";
    mostrarMensaje(`${ciudadSeleccionada.nombre}: ${detalle} Selecciona la ciudad de nuevo para reintentar.`, true);
  } finally {
    establecerCarga(false);
    botonSeleccionado.focus();
  }
}

function mostrarCiudades(ciudades) {
  for (const ciudad of ciudades) {
    const elemento = document.createElement("li");
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = obtenerNombreCiudad(ciudad);
    boton.setAttribute("aria-pressed", "false");
    boton.addEventListener("click", () => seleccionarCiudad(ciudad, boton));
    elemento.append(boton);
    listaCiudades.append(elemento);
  }

  resultadosBusqueda.hidden = false;
}

async function buscarCiudades(evento) {
  evento.preventDefault();

  if (buscando) {
    return;
  }

  const nombre = campoCiudad.value.trim();
  campoCiudad.value = nombre;
  listaCiudades.replaceChildren();
  resultadosBusqueda.hidden = true;
  ciudadSeleccionada = null;
  climaActual.hidden = true;

  if (nombre.length < 2) {
    mostrarMensaje("Introduce al menos dos caracteres para buscar una ciudad.", true);
    campoCiudad.focus();
    return;
  }

  establecerCarga(true);
  mostrarMensaje("Buscando ciudades…");

  try {
    const ciudades = await consultarCiudades(nombre);

    if (ciudades.length === 0) {
      mostrarMensaje("No se encontraron ciudades. Prueba con otro nombre.");
      return;
    }

    mostrarCiudades(ciudades);
    mostrarMensaje("Búsqueda completada. Selecciona una ciudad de la lista.");
  } catch (error) {
    const texto = error.name === "TimeoutError"
      ? error.message
      : "No se pudo completar la búsqueda. Comprueba tu conexión y vuelve a intentarlo.";
    mostrarMensaje(texto, true);
  } finally {
    establecerCarga(false);
    campoCiudad.focus();
  }
}
