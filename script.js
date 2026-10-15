// ------------------ CONFIGURACIÓN ------------------
const TOTAL_EQUIPOS = 10; // NB - 001 hasta NB - 010

// Cursos válidos: del 1 al 7, con A o B
const OPCIONES_CURSOS = [];
for (let i = 1; i <= 7; i++) {
  OPCIONES_CURSOS.push(i + " A", i + " B");
}

// ------------------ DATOS ------------------
let equipos = JSON.parse(localStorage.getItem("equipos_v2")) || crearEquipos();
let historial = JSON.parse(localStorage.getItem("historial_v2")) || [];

function crearEquipos() {
  const lista = [];
  for (let i = 1; i <= TOTAL_EQUIPOS; i++) {
    lista.push({
      numero: "NB - " + String(i).padStart(3, "0"),
      estado: "Disponible",
      alumno: "",
      curso: ""
    });
  }
  return lista;
}

function guardarDatos() {
  localStorage.setItem("equipos_v2", JSON.stringify(equipos));
  localStorage.setItem("historial_v2", JSON.stringify(historial));
}

// ------------------ ELEMENTOS ------------------
const navItems = document.querySelectorAll(".nav-item");
const secciones = document.querySelectorAll(".seccion");

const prestamoAlumno = document.getElementById("prestamo-alumno");
const prestamoCurso = document.getElementById("prestamo-curso");
const prestamoEquipo = document.getElementById("prestamo-equipo");
const mensajePrestamo = document.getElementById("mensaje-prestamo");

const devolucionEquipo = document.getElementById("devolucion-equipo");
const devolucionAlumno = document.getElementById("devolucion-alumno");
const mensajeDevolucion = document.getElementById("mensaje-devolucion");

const tablaHistorial = document.getElementById("tabla-historial");
const tablaEquipos = document.getElementById("tabla-equipos");

let temporizadorMensaje;

// ------------------ NAVEGACIÓN ------------------
function irASeccion(destino) {
  secciones.forEach(s => s.classList.remove("visible"));
  document.getElementById(destino).classList.add("visible");

  navItems.forEach(item => {
    item.classList.toggle("activo", item.dataset.target === destino);
  });

  limpiarFormularios();

  if (destino === "historial") mostrarHistorial();
  if (destino === "equipos") mostrarEquipos();
}

navItems.forEach(item => {
  item.addEventListener("click", () => irASeccion(item.dataset.target));
});

// ------------------ FUNCIONES AUXILIARES ------------------
function mostrarMensaje(elemento, texto, tipo) {
  clearTimeout(temporizadorMensaje);
  elemento.textContent = texto;
  elemento.className = "mensaje " + tipo;

  if (tipo === "exito") {
    temporizadorMensaje = setTimeout(() => {
      elemento.textContent = "";
      elemento.className = "mensaje";
    }, 3000);
  }
}

function limpiarFormularios() {
  clearTimeout(temporizadorMensaje);
  [mensajePrestamo, mensajeDevolucion].forEach(m => {
    m.textContent = "";
    m.className = "mensaje";
  });
  document.querySelectorAll("input").forEach(i => {
    i.value = "";
    i.classList.remove("error");
  });
}

// Acepta "1", "NB-001", "NB - 001", "nb1"... y lo convierte a "NB - 001"
function formatearEquipo(texto) {
  const numeros = texto.replace(/\D/g, "");
  if (numeros === "") return null;
  const n = parseInt(numeros, 10);
  if (n < 1 || n > TOTAL_EQUIPOS) return null;
  return "NB - " + String(n).padStart(3, "0");
}

// Acepta "5 A", "5A", "5 a"... y lo convierte a "5 A". Devuelve null si no es válido
function formatearCurso(texto) {
  const coincidencia = texto.trim().match(/^([1-7])\s*([abAB])$/);
  if (!coincidencia) return null;
  return coincidencia[1] + " " + coincidencia[2].toUpperCase();
}

function normalizar(texto) {
  return texto.trim().toLowerCase().replace(/\s+/g, " ");
}

function marcarVacios(inputs) {
  let hayVacios = false;
  inputs.forEach(input => {
    if (input.value.trim() === "") {
      input.classList.add("error");
      hayVacios = true;
    } else {
      input.classList.remove("error");
    }
  });
  return hayVacios;
}

function fechaActual() {
  return new Date().toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

// ------------------ REGISTRAR PRÉSTAMO ------------------
document.getElementById("btn-registrar").addEventListener("click", () => {
  if (marcarVacios([prestamoAlumno, prestamoCurso, prestamoEquipo])) {
    mostrarMensaje(mensajePrestamo, "⚠️ Por favor, completá todos los datos.", "error");
    return;
  }

  const alumno = prestamoAlumno.value.trim();

  const curso = formatearCurso(prestamoCurso.value);
  if (!curso) {
    prestamoCurso.classList.add("error");
    mostrarMensaje(mensajePrestamo, "⚠️ El curso no es válido. Las opciones son: " + OPCIONES_CURSOS.join(", ") + ".", "error");
    return;
  }

  const numero = formatearEquipo(prestamoEquipo.value);
  if (!numero) {
    prestamoEquipo.classList.add("error");
    mostrarMensaje(mensajePrestamo, "⚠️ El equipo no existe. Ingresá un número del 001 al 010.", "error");
    return;
  }

  const equipo = equipos.find(e => e.numero === numero);

  if (equipo.estado === "En uso") {
    prestamoEquipo.classList.add("error");
    mostrarMensaje(mensajePrestamo, "⚠️ El equipo " + numero + " ya está en uso.", "error");
    return;
  }

  // 1) Cambia el estado en "Equipos disponibles"
  equipo.estado = "En uso";
  equipo.alumno = alumno;
  equipo.curso = curso;

  // 2) Se guarda en "Historial de préstamos"
  historial.unshift({
    alumno: alumno,
    curso: curso,
    equipo: numero,
    fecha: fechaActual(),
    estado: "Préstamo"
  });

  guardarDatos();

  // 3) El formulario queda vacío
  prestamoAlumno.value = "";
  prestamoCurso.value = "";
  prestamoEquipo.value = "";
  mostrarMensaje(mensajePrestamo, "✅ Préstamo registrado: " + numero + " para " + alumno + ".", "exito");
});

// ------------------ DEVOLVER EQUIPO ------------------
document.getElementById("btn-devolver").addEventListener("click", () => {
  if (marcarVacios([devolucionEquipo, devolucionAlumno])) {
    mostrarMensaje(mensajeDevolucion, "⚠️ Por favor, completá todos los datos.", "error");
    return;
  }

  const alumno = devolucionAlumno.value.trim();

  const numero = formatearEquipo(devolucionEquipo.value);
  if (!numero) {
    devolucionEquipo.classList.add("error");
    mostrarMensaje(mensajeDevolucion, "⚠️ El equipo no existe. Ingresá un número del 001 al 010.", "error");
    return;
  }

  const equipo = equipos.find(e => e.numero === numero);

  if (equipo.estado === "Disponible") {
    devolucionEquipo.classList.add("error");
    mostrarMensaje(mensajeDevolucion, "⚠️ El equipo " + numero + " ya está disponible, no tiene un préstamo activo.", "error");
    return;
  }

  if (normalizar(equipo.alumno) !== normalizar(alumno)) {
    devolucionAlumno.classList.add("error");
    mostrarMensaje(mensajeDevolucion, "⚠️ El equipo " + numero + " fue prestado a otro alumno. Revisá el nombre.", "error");
    return;
  }

  // 1) Se guarda en el historial que fue devuelto
  historial.unshift({
    alumno: equipo.alumno,
    curso: equipo.curso,
    equipo: numero,
    fecha: fechaActual(),
    estado: "Devuelto"
  });

  // 2) El equipo pasa de "En uso" a "Disponible"
  equipo.estado = "Disponible";
  equipo.alumno = "";
  equipo.curso = "";

  guardarDatos();

  devolucionEquipo.value = "";
  devolucionAlumno.value = "";
  mostrarMensaje(mensajeDevolucion, "✅ Devolución registrada: " + numero + " ya está disponible.", "exito");
});

// ------------------ MOSTRAR TABLAS ------------------
function mostrarHistorial() {
  if (historial.length === 0) {
    tablaHistorial.innerHTML = '<tr><td colspan="5" class="vacio">Todavía no hay registros.</td></tr>';
    return;
  }

  tablaHistorial.innerHTML = historial.map(registro => {
    const clase = registro.estado === "Devuelto" ? "estado-disponible" : "estado-uso";
    return `
      <tr>
        <td>${escapar(registro.alumno)}</td>
        <td>${escapar(registro.curso)}</td>
        <td>${registro.equipo}</td>
        <td>${registro.fecha}</td>
        <td class="${clase}">${registro.estado}</td>
      </tr>`;
  }).join("");
}

function mostrarEquipos() {
  tablaEquipos.innerHTML = equipos.map(equipo => {
    const clase = equipo.estado === "Disponible" ? "estado-disponible" : "estado-uso";
    return `
      <tr>
        <td>${equipo.numero}</td>
        <td class="${clase}">${equipo.estado}</td>
      </tr>`;
  }).join("");
}

// ------------------ INICIO ------------------
irASeccion("inicio");
