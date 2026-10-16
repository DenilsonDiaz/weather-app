const formularioBusqueda = document.getElementById("formulario-busqueda");
const campoCiudad = document.getElementById("campo-ciudad");
const botonBuscar = document.getElementById("boton-buscar");
const mensajeEstado = document.getElementById("mensaje-estado");
const resultadosBusqueda = document.getElementById("resultados-busqueda");
const listaCiudades = document.getElementById("lista-ciudades");

let ciudadSeleccionada = null;
let buscando = false;

// La validación propia permite mostrar también los errores en español y sin espacios.
formularioBusqueda.noValidate = true;
formularioBusqueda.addEventListener("submit", buscarCiudades);

function mostrarMensaje(texto, esError = false) {
  mensajeEstado.textContent = texto;
  mensajeEstado.classList.toggle("mensaje-error", esError);
}

function establecerCarga(enCarga) {
  buscando = enCarga;
  campoCiudad.disabled = enCarga;
  botonBuscar.disabled = enCarga;
  formularioBusqueda.setAttribute("aria-busy", String(enCarga));
  botonBuscar.textContent = enCarga ? "Buscando…" : "Buscar";
}

async function consultarCiudades(nombre) {
  const parametros = new URLSearchParams({
    name: nombre,
    count: "5",
    language: "es",
    format: "json"
  });
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), 10000);

  try {
    const respuesta = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?${parametros}`,
      { signal: controlador.signal }
    );

    if (!respuesta.ok) {
      throw new Error("No se pudo consultar el servicio de ciudades.");
    }

    const datos = await respuesta.json();
    return (datos.results ?? []).slice(0, 5);
  } catch (error) {
    if (controlador.signal.aborted) {
      throw new DOMException("La búsqueda superó el límite de 10 segundos. Vuelve a intentarlo.", "TimeoutError");
    }

    throw error;
  } finally {
    clearTimeout(temporizador);
  }
}

function obtenerNombreCiudad(ciudad) {
  return [ciudad.name, ciudad.admin1, ciudad.country].filter(Boolean).join(", ");
}

function seleccionarCiudad(ciudad, botonSeleccionado) {
  ciudadSeleccionada = {
    nombre: obtenerNombreCiudad(ciudad),
    latitude: ciudad.latitude,
    longitude: ciudad.longitude
  };

  for (const boton of listaCiudades.querySelectorAll("button")) {
    boton.setAttribute("aria-pressed", String(boton === botonSeleccionado));
  }

  mostrarMensaje(`Ciudad seleccionada: ${ciudadSeleccionada.nombre}.`);
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
