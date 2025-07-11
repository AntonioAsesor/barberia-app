// main.js ✅ Versión funcional con Sexo y Grupo corregidos
const API_URL = "http://localhost:3000";

// Cargar info del negocio
function cargarDatosNegocio() {
  fetch(`${API_URL}/datos-negocio`)
    .then(res => res.json())
    .then(data => {
      const info = Object.fromEntries(data);
      document.getElementById("nombreNegocio").textContent = info["Nombre del Negocio"] || "Mi Negocio";
      document.getElementById("contactoNegocio").textContent = `${info["Teléfono"] || "-"} | ${info["Email"] || "-"} | ${info["RUC/NIT"] || "-"} | ${info["Moneda"] || "-"}`;
    })
    .catch(err => console.error("Error cargando datos del negocio:", err));
}
cargarDatosNegocio();

// Mostrar módulo Clientes
async function mostrarClientes() {
  const contenedor = document.getElementById("modulo-contenido");
  contenedor.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-1">
      <h2>Módulo Clientes</h2>
      <button id="btnNuevoCliente" class="btn btn-primary">+ Nuevo Cliente</button>
    </div>
    <div class="d-flex justify-content-between align-items-center mb-1">
<p>Gestiona la cartera de Clientes del negocio. </p>
    </div>
    <input type="text" id="filtroClientes" class="form-control mb-3" placeholder="Buscar cliente..." />
    <div class="table-responsive">
      <table class="table table-striped table-bordered" id="tablaClientes">
        <thead class="table-primary"><tr id="headerClientes"></tr></thead>
        <tbody id="bodyClientes"></tbody>
      </table>
    </div>
    <nav><ul class="pagination" id="paginacionClientes"></ul></nav>

    <div class="modal fade" id="modalCliente" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form id="formCliente">
            <div class="modal-header">
              <h5 class="modal-title" id="modalClienteLabel">Cliente</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="modalBodyCliente"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-danger" id="btnEliminarCliente">Eliminar</button>
              <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  const res = await fetch(`${API_URL}/clientes`);
  const data = await res.json();
  let headers = [...data[0]];
  headers.push("Acciones");
  let rows = data.slice(1);

  const grupos = await fetch(`${API_URL}/grupos`).then(r => r.json()).catch(() => []);

  const headerRow = document.getElementById("headerClientes");
  headerRow.innerHTML = headers.map(h => `<th>${h}</th>`).join("");

  const body = document.getElementById("bodyClientes");
  const pagination = document.getElementById("paginacionClientes");
  const filtroInput = document.getElementById("filtroClientes");
  const modalCliente = new bootstrap.Modal(document.getElementById("modalCliente"));
  const formCliente = document.getElementById("formCliente");
  const btnNuevo = document.getElementById("btnNuevoCliente");
  const btnEliminar = document.getElementById("btnEliminarCliente");

  let modoEdicion = false;
  let idEditando = null;

  const rowsPorPagina = 10;
  let paginaActual = 1;

  function mostrarPagina(pagina, filtro = "") {
    filtro = filtro.toLowerCase();
    const filtrados = rows.filter(row => row.some(cell => cell.toLowerCase?.().includes(filtro)));
    const totalPaginas = Math.ceil(filtrados.length / rowsPorPagina);
    paginaActual = Math.max(1, Math.min(pagina, totalPaginas || 1));

    const inicio = (paginaActual - 1) * rowsPorPagina;
    const pageRows = filtrados.slice(inicio, inicio + rowsPorPagina);

    body.innerHTML = pageRows.map(row => {
      const id = row[0];
      const fila = headers.slice(0, -1).map((_, i) => `<td>${row[i] || ""}</td>`).join("");
      return `<tr data-id="${id}">${fila}<td><button class="btn btn-sm btn-warning btn-editar" data-id="${id}">Editar</button></td></tr>`;
    }).join("");

    pagination.innerHTML = Array.from({ length: totalPaginas }, (_, i) => `
      <li class="page-item ${i + 1 === paginaActual ? "active" : ""}">
        <a class="page-link" href="#" data-page="${i + 1}">${i + 1}</a>
      </li>`).join("");

    document.querySelectorAll("#paginacionClientes a").forEach(link => {
      link.onclick = e => {
        e.preventDefault();
        mostrarPagina(parseInt(e.target.dataset.page), filtroInput.value);
      };
    });

    document.querySelectorAll(".btn-editar").forEach(btn => {
      btn.onclick = () => abrirModalEditar(btn.dataset.id);
    });
  }

  filtroInput.oninput = () => mostrarPagina(1, filtroInput.value);
  btnNuevo.onclick = () => abrirModalNuevo();

  function abrirModalNuevo() {
    modoEdicion = false;
    idEditando = null;
    document.getElementById("modalClienteLabel").innerText = "Nuevo Cliente";
    generarFormulario(headers.slice(0, -1), ["Auto", "", "", "", "", "", "", ""]);
    btnEliminar.style.display = "none";
    modalCliente.show();
  }

  function abrirModalEditar(id) {
    const fila = rows.find(r => r[0] == id);
    if (!fila) return alert("Cliente no encontrado");
    modoEdicion = true;
    idEditando = id;
    document.getElementById("modalClienteLabel").innerText = "Editar Cliente";
    generarFormulario(headers.slice(0, -1), fila);
    btnEliminar.style.display = "inline-block";
    modalCliente.show();
  }

  function generarFormulario(campos, valores) {
    const cuerpo = document.getElementById("modalBodyCliente");
    cuerpo.innerHTML = "";
    campos.forEach((campo, i) => {
      const valor = valores[i] || "";
      let input = "";

      if (campo.toLowerCase() === "sexo") {
        input = `
          <select class="form-select" name="Sexo" required>
            <option value="">Seleccionar</option>
            <option value="Hombre" ${valor === "Hombre" ? "selected" : ""}>Hombre</option>
            <option value="Mujer" ${valor === "Mujer" ? "selected" : ""}>Mujer</option>
            <option value="Gobierno" ${valor === "Gobierno" ? "selected" : ""}>Gobierno</option>
            <option value="Empresa" ${valor === "Empresa" ? "selected" : ""}>Empresa</option>
            <option value="No gubernamental" ${valor === "No gubernamental" ? "selected" : ""}>No gubernamental</option>
          </select>`;
      } else if (campo.toLowerCase() === "grupos" || campo.toLowerCase() === "grupo") {      /////////// -------------- //////////
        input = `
          <select class="form-select" name="Grupos" required>
            <option value="">Seleccionar grupo</option>
            ${grupos.map(g => `<option ${g === valor ? "selected" : ""}>${g}</option>`).join("")}
          </select>`;
      } else if (campo.toLowerCase() === "id") {
        input = `<input type="text" class="form-control" name="ID" value="${valor}" readonly />`;
      } else if (campo.toLowerCase() === "fecha registro") {
        input = `<input type="date" class="form-control" name="Fecha Registro" value="${valor}" required />`;
      } else {
        input = `<input type="text" class="form-control" name="${campo}" value="${valor}" required />`;
      }

      cuerpo.innerHTML += `
        <div class="mb-3">
          <label class="form-label">${campo}</label>
          ${input}
        </div>`;
    });
  }

  formCliente.onsubmit = async e => {
    e.preventDefault();
    const formData = new FormData(formCliente);
    const cliente = headers.slice(0, -1).map(c => formData.get(c));

    try {
      if (modoEdicion) {
        await fetch(`${API_URL}/clientes/${idEditando}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Nombre: cliente[1],
            Teléfono: cliente[2],
            Email: cliente[3],
            Dirección: cliente[4],
            "Fecha Registro": cliente[5],
            Sexo: cliente[6],
            Grupo: cliente[7]
          })
        });
        const i = rows.findIndex(r => r[0] == idEditando);
        if (i >= 0) rows[i] = cliente;
        alert("Cliente actualizado.");
      } else {
        const res = await fetch(`${API_URL}/clientes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Nombre: cliente[1],
            Teléfono: cliente[2],
            Email: cliente[3],
            Dirección: cliente[4],
            "Fecha Registro": cliente[5],
            Sexo: cliente[6],
            Grupo: cliente[7]
          })
        });
        const json = await res.json();
        cliente[0] = json.id;
        rows.push(cliente);
        alert("Cliente creado.");
      }

      modalCliente.hide();
      mostrarPagina(paginaActual, filtroInput.value);
    } catch (err) {
      alert("Error guardando cliente.");
      console.error(err);
    }
  };

  btnEliminar.onclick = async () => {
    if (confirm("¿Está seguro que desea eliminar este cliente?")) {
      await fetch(`${API_URL}/clientes/${idEditando}`, { method: "DELETE" });
      rows = rows.filter(r => r[0] != idEditando);
      alert("Cliente eliminado.");
      modalCliente.hide();
      mostrarPagina(1);
    }
  };

  mostrarPagina(1);
}

// ✅ frontend-servicios.js: módulo frontend para Servicios (similar a Clientes)

// Esta función se importa y se llama desde el menú cuando se selecciona "Servicios"
async function mostrarServicios() {
  const contenedor = document.getElementById("modulo-contenido");
  contenedor.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-1">
      <h2>Módulo Servicios del negocio</h2>
      <button id="btnNuevoServicio" class="btn btn-primary">+ Nuevo Servicio</button>
    </div>
    <div class="d-flex justify-content-between align-items-center mb-1">
      <p>Gestiona el portafolio de Servicios o Productos de tu negocio. </p>
    </div> 
    <input type="text" id="filtroServicios" class="form-control mb-3" placeholder="Buscar servicio..." />
    <div class="table-responsive">
      <table class="table table-striped table-bordered" id="tablaServicios">
        <thead class="table-primary"><tr id="headerServicios"></tr></thead>
        <tbody id="bodyServicios"></tbody>
      </table>
    </div>
    <nav><ul class="pagination" id="paginacionServicios"></ul></nav>

    <div class="modal fade" id="modalServicio" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form id="formServicio">
            <div class="modal-header">
              <h5 class="modal-title" id="modalServicioLabel">Servicio</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="modalBodyServicio"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-danger" id="btnEliminarServicio">Eliminar</button>
              <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  const API_URL = "http://localhost:3000";
  const res = await fetch(`${API_URL}/servicios`);
  const data = await res.json();
  let headers = [...data[0]];
  headers.push("Acciones");
  let rows = data.slice(1);

  const headerRow = document.getElementById("headerServicios");
  headerRow.innerHTML = headers.map(h => `<th>${h}</th>`).join("");

  const body = document.getElementById("bodyServicios");
  const pagination = document.getElementById("paginacionServicios");
  const filtroInput = document.getElementById("filtroServicios");
  const modalServicio = new bootstrap.Modal(document.getElementById("modalServicio"));
  const formServicio = document.getElementById("formServicio");
  const btnNuevo = document.getElementById("btnNuevoServicio");
  const btnEliminar = document.getElementById("btnEliminarServicio");

  let modoEdicion = false;
  let idEditando = null;

  const rowsPorPagina = 10;
  let paginaActual = 1;

  function mostrarPagina(pagina, filtro = "") {
    filtro = filtro.toLowerCase();
    const filtrados = rows.filter(row => row.some(cell => cell.toLowerCase?.().includes(filtro)));
    const totalPaginas = Math.ceil(filtrados.length / rowsPorPagina);
    paginaActual = Math.max(1, Math.min(pagina, totalPaginas || 1));

    const inicio = (paginaActual - 1) * rowsPorPagina;
    const pageRows = filtrados.slice(inicio, inicio + rowsPorPagina);

    body.innerHTML = pageRows.map(row => {
      const id = row[0];
      const fila = headers.slice(0, -1).map((_, i) => `<td>${row[i] || ""}</td>`).join("");
      return `<tr data-id="${id}">${fila}<td><button class="btn btn-sm btn-warning btn-editar" data-id="${id}">Editar</button></td></tr>`;
    }).join("");

    pagination.innerHTML = Array.from({ length: totalPaginas }, (_, i) => `
      <li class="page-item ${i + 1 === paginaActual ? "active" : ""}">
        <a class="page-link" href="#" data-page="${i + 1}">${i + 1}</a>
      </li>`).join("");

    document.querySelectorAll("#paginacionServicios a").forEach(link => {
      link.onclick = e => {
        e.preventDefault();
        mostrarPagina(parseInt(e.target.dataset.page), filtroInput.value);
      };
    });

    document.querySelectorAll(".btn-editar").forEach(btn => {
      btn.onclick = () => abrirModalEditar(btn.dataset.id);
    });
  }

  filtroInput.oninput = () => mostrarPagina(1, filtroInput.value);
  btnNuevo.onclick = () => abrirModalNuevo();

  function abrirModalNuevo() {
    modoEdicion = false;
    idEditando = null;
    document.getElementById("modalServicioLabel").innerText = "Nuevo Servicio";
    generarFormulario(headers.slice(0, -1), ["Auto", "", "", "", ""]);
    btnEliminar.style.display = "none";
    modalServicio.show();
  }

  function abrirModalEditar(id) {
    const fila = rows.find(r => r[0] == id);
    if (!fila) return alert("Servicio no encontrado");
    modoEdicion = true;
    idEditando = id;
    document.getElementById("modalServicioLabel").innerText = "Editar Servicio";
    generarFormulario(headers.slice(0, -1), fila);
    btnEliminar.style.display = "inline-block";
    modalServicio.show();
  }

  function generarFormulario(campos, valores) {
    const cuerpo = document.getElementById("modalBodyServicio");
    cuerpo.innerHTML = "";
    campos.forEach((campo, i) => {
      const valor = valores[i] || "";
      let input = "";

      if (campo.toLowerCase() === "id") {
        input = `<input type="text" class="form-control" name="ID" value="${valor}" readonly />`;
      } else if (campo.toLowerCase() === "precio" || campo.toLowerCase() === "costounitario") {
        input = `<input type="number" step="0.01" class="form-control" name="${campo}" value="${valor}" required />`;
      } else {
        input = `<input type="text" class="form-control" name="${campo}" value="${valor}" required />`;
      }

      cuerpo.innerHTML += `
        <div class="mb-3">
          <label class="form-label">${campo}</label>
          ${input}
        </div>`;
    });
  }

  formServicio.onsubmit = async e => {
    e.preventDefault();
    const formData = new FormData(formServicio);
    const servicio = headers.slice(0, -1).map(c => formData.get(c));

    try {
      if (modoEdicion) {
        await fetch(`${API_URL}/servicios/${idEditando}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "Nombre Servicio": servicio[1],
            Precio: servicio[2],
            Categoría: servicio[3],
            CostoUnitario: servicio[4]
          })
        });
        const i = rows.findIndex(r => r[0] == idEditando);
        if (i >= 0) rows[i] = servicio;
        alert("Servicio actualizado.");
      } else {
        const res = await fetch(`${API_URL}/servicios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "Nombre Servicio": servicio[1],
            Precio: servicio[2],
            Categoría: servicio[3],
            CostoUnitario: servicio[4]
          })
        });
        const json = await res.json();
        servicio[0] = json.id;
        rows.push(servicio);
        alert("Servicio creado.");
      }

      modalServicio.hide();
      mostrarPagina(paginaActual, filtroInput.value);
    } catch (err) {
      alert("Error guardando servicio.");
      console.error(err);
    }
  };

  btnEliminar.onclick = async () => {
    if (confirm("¿Está seguro que desea eliminar este servicio?")) {
      await fetch(`${API_URL}/servicios/${idEditando}`, { method: "DELETE" });
      rows = rows.filter(r => r[0] != idEditando);
      alert("Servicio eliminado.");
      modalServicio.hide();
      mostrarPagina(1);
    }
  };

  mostrarPagina(1);
}

// ✅ Llamar esta función desde tu menú cuando se seleccione "Servicios" (igual que con Clientes)
// mostrarModulo("servicios") => mostrarServicios()

///// --------------------------------------------------------------------  ///////////////////////
    // Función universdal para convocar los Módulos de la App
    // ✅ Ruta: Agregar Saldo Inicial a Caja
function mostrarModulo(modulo) {
  const contenedor = document.getElementById("modulo-contenido");
  contenedor.innerHTML = `<p>Cargando ${modulo}...</p>`;

  switch (modulo) {
    case "clientes":
      mostrarClientes();
      break;
    case "servicios":
      mostrarServicios();
      break;
    case "ventas":
      mostrarVentas();
      break;
    case "gastos":
      mostrarGastos();
      break;
    case "caja":
      mostrarCaja();
      break;
    case "dashboard":
      mostrarDashboard();
      break;
    default:
      contenedor.innerHTML = `<h2>${modulo}</h2><p>Aquí irá el contenido.</p>`;
  }
}
