// ✅ frontend-ventas.js: módulo frontend para Ventas

async function mostrarVentas() {
  const contenedor = document.getElementById("modulo-contenido");
  contenedor.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-1">
      <h2>Módulo de Ventas</h2>
      <button id="btnNuevaVenta" class="btn btn-primary">+ Nueva Venta</button>
    </div>
        <div class="d-flex justify-content-between align-items-center mb-1">
<p>Gestiona las Ventas del negocio. </p>
    </div>
    <input type="text" id="filtroVentas" class="form-control mb-3" placeholder="Buscar venta..." />
    <div class="table-responsive">
      <table class="table table-striped table-bordered" id="tablaVentas">
        <thead class="table-primary"><tr id="headerVentas"></tr></thead>
        <tbody id="bodyVentas"></tbody>
      </table>
    </div>
    <nav><ul class="pagination" id="paginacionVentas"></ul></nav>

    <div class="modal fade" id="modalVenta" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form id="formVenta">
            <div class="modal-header">
              <h5 class="modal-title">Venta</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="modalBodyVenta"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-danger" id="btnEliminarVenta">Eliminar</button>
              <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  const API_URL = "http://localhost:3000";
  const [resVentas, resClientes, resServicios] = await Promise.all([
    fetch(`${API_URL}/ventas`),
    fetch(`${API_URL}/clientes`),
    fetch(`${API_URL}/servicios`)
  ]);

  const dataVentas = await resVentas.json();
  const dataClientes = await resClientes.json();
  const dataServicios = await resServicios.json();

  const headers = [...dataVentas[0], "Acciones"];
  let rows = dataVentas.slice(1);

  const clientes = Object.fromEntries(dataClientes.slice(1).map(row => [row[0], row[1]]));
  const servicios = Object.fromEntries(dataServicios.slice(1).map(row => [row[0], row[1]]));

  const headerRow = document.getElementById("headerVentas");
  headerRow.innerHTML = headers.map(h => `<th>${h}</th>`).join("");

  const body = document.getElementById("bodyVentas");
  const pagination = document.getElementById("paginacionVentas");
  const filtroInput = document.getElementById("filtroVentas");
  const modalVenta = new bootstrap.Modal(document.getElementById("modalVenta"));
  const formVenta = document.getElementById("formVenta");
  const btnNuevo = document.getElementById("btnNuevaVenta");
  const btnEliminar = document.getElementById("btnEliminarVenta");

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

    document.querySelectorAll("#paginacionVentas a").forEach(link => {
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
    generarFormulario(["Auto", "", "", "", "", "", ""]);
    btnEliminar.style.display = "none";
    modalVenta.show();
  }

  function abrirModalEditar(id) {
    const fila = rows.find(r => r[0] == id);
    if (!fila) return alert("Venta no encontrada");
    modoEdicion = true;
    idEditando = id;
    generarFormulario(fila);
    btnEliminar.style.display = "inline-block";
    modalVenta.show();
  }

  function generarFormulario(valores) {
    const cuerpo = document.getElementById("modalBodyVenta");
    cuerpo.innerHTML = "";
    cuerpo.innerHTML += `<div class="mb-3"><label>ID Venta</label><input class="form-control" name="ID Venta" value="${valores[0] || "Auto"}" readonly /></div>`;
    cuerpo.innerHTML += `<div class="mb-3"><label>Cliente</label><select class="form-select" name="Cliente ID">${Object.entries(clientes).map(([id, nombre]) => `<option value="${id}" ${valores[1] == id ? "selected" : ""}>${nombre}</option>`).join("")}</select></div>`;

// Servicio con select y listener para autocompletar monto
cuerpo.innerHTML += `<div class="mb-3">
  <label>Servicio</label>
  <select class="form-select" name="Servicio ID" id="selectServicio">
    ${Object.entries(servicios).map(([id, nombre]) => `<option value="${id}" ${valores[3] == id ? "selected" : ""}>${nombre}</option>`).join("")}
  </select>
</div>`;

cuerpo.innerHTML += `<div class="mb-3">
  <label>Fecha</label>
  <input type="date" class="form-control" name="Fecha" value="${valores[5] || ""}" required />
</div>`;

cuerpo.innerHTML += `<div class="mb-3">
  <label>Monto</label>
  <input type="number" step="0.01" class="form-control" name="Monto" id="inputMonto" value="${valores[6] || ""}" required />
</div>`;

setTimeout(() => {
  const servicioSelect = document.getElementById("selectServicio");
  const inputMonto = document.getElementById("inputMonto");

  servicioSelect.onchange = () => {
    const servicioId = servicioSelect.value;
    const servicio = dataServicios.find(s => s[0] == servicioId);
    if (servicio) inputMonto.value = servicio[2]; // Columna Precio del servicio
  };
}, 100);
    cuerpo.innerHTML += `<div class="mb-3"><label>Observaciones</label><input class="form-control" name="Observaciones" value="${valores[7] || ""}" /></div>`;
  }

  formVenta.onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(formVenta);
    const camposObligatorios = ["Cliente ID", "Servicio ID", "Fecha", "Monto"];
for (const campo of camposObligatorios) {
  if (!fd.get(campo)) {
    alert(`Por favor, completá el campo obligatorio: ${campo}`);
    return;
  }
}
    const clienteId = fd.get("Cliente ID");
    const clienteNombre = clientes[clienteId];
    const servicioId = fd.get("Servicio ID");
    const servicioNombre = servicios[servicioId];

    const venta = {
      "Cliente ID": clienteId,
      "Cliente Nombre": clienteNombre,
      "Servicio ID": servicioId,
      "Servicio Nombre": servicioNombre,
      Fecha: fd.get("Fecha"),
      Monto: fd.get("Monto"),
      Observaciones: fd.get("Observaciones")
    };

    try {
      if (modoEdicion) {
        await fetch(`${API_URL}/ventas/${idEditando}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: idEditando, ...venta })
        });
        const i = rows.findIndex(r => r[0] == idEditando);
        if (i >= 0) rows[i] = [idEditando, clienteId, clienteNombre, servicioId, servicioNombre, venta.Fecha, venta.Monto, venta.Observaciones];
        alert("Venta actualizada");
      } else {
        const res = await fetch(`${API_URL}/ventas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(venta)
        });
        const json = await res.json();
        rows.push([json.id, clienteId, clienteNombre, servicioId, servicioNombre, venta.Fecha, venta.Monto, venta.Observaciones]);
        alert("Venta registrada");
      }
      modalVenta.hide();
      mostrarPagina(paginaActual, filtroInput.value);
    } catch (err) {
      console.error("Error al guardar venta", err);
      alert("Error al guardar venta");
    }
  };

  btnEliminar.onclick = async () => {
    if (!confirm("¿Desea eliminar esta venta?")) return;
    await fetch(`${API_URL}/ventas/${idEditando}`, { method: "DELETE" });
    rows = rows.filter(r => r[0] != idEditando);
    alert("Venta eliminada");
    modalVenta.hide();
    mostrarPagina(1);
  };

  mostrarPagina(1);
}
