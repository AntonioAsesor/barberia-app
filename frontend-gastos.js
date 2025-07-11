// ✅ frontend-gastos.js: módulo frontend para Gastos

async function mostrarGastos() {
  const contenedor = document.getElementById("modulo-contenido");
  contenedor.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-1">
      <h2>Gastos</h2>
      <button id="btnNuevoGasto" class="btn btn-danger">+ Nuevo Gasto</button>
    </div>
        <div class="d-flex justify-content-between align-items-center mb-1">
<p>Gestiona los Gastos del negocio. </p>
    </div>
    <input type="text" id="filtroGastos" class="form-control mb-3" placeholder="Buscar gasto..." />
    <div class="table-responsive">
      <table class="table table-striped table-bordered" id="tablaGastos">
        <thead class="table-primary"><tr id="headerGastos"></tr></thead>
        <tbody id="bodyGastos"></tbody>
      </table>
    </div>
    <nav><ul class="pagination" id="paginacionGastos"></ul></nav>

    <div class="modal fade" id="modalGasto" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form id="formGasto">
            <div class="modal-header">
              <h5 class="modal-title">Gasto</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="modalBodyGasto"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-danger" id="btnEliminarGasto">Eliminar</button>
              <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  const API_URL = "http://localhost:3000";
  const res = await fetch(`${API_URL}/gastos`);
  const data = await res.json();

  const headers = [...data[0], "Acciones"];
  let rows = data.slice(1);

  const headerRow = document.getElementById("headerGastos");
  headerRow.innerHTML = headers.map(h => `<th>${h}</th>`).join("");

  const body = document.getElementById("bodyGastos");
  const pagination = document.getElementById("paginacionGastos");
  const filtroInput = document.getElementById("filtroGastos");
  const modal = new bootstrap.Modal(document.getElementById("modalGasto"));
  const form = document.getElementById("formGasto");
  const btnNuevo = document.getElementById("btnNuevoGasto");
  const btnEliminar = document.getElementById("btnEliminarGasto");

  let modoEdicion = false;
  let idEditando = null;
  const rowsPorPagina = 10;
  let paginaActual = 1;

  const opcionesTipoGasto = [
    "Salarios",
    "Transporte y viáticos",
    "Telefonía e internet",
    "Agua",
    "Electricidad",
    "Insumos y materiales",
    "Aseo y limpieza",
    "Cafetería",
    "Impuestos municipales",
    "Impuestos nacionales",
    "Otros gastos",
    "Consumo personal"
  ];

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

    document.querySelectorAll("#paginacionGastos a").forEach(link => {
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
    generarFormulario(["Auto", "", "", "", "", ""]);
    btnEliminar.style.display = "none";
    modal.show();
  }

  function abrirModalEditar(id) {
    const fila = rows.find(r => r[0] == id);
    if (!fila) return alert("Gasto no encontrado");
    modoEdicion = true;
    idEditando = id;
    generarFormulario(fila);
    btnEliminar.style.display = "inline-block";
    modal.show();
  }

  function generarFormulario(valores) {
    const cuerpo = document.getElementById("modalBodyGasto");
    cuerpo.innerHTML = "";

    cuerpo.innerHTML += `<div class="mb-3"><label>ID Gasto</label><input class="form-control" name="ID Gasto" value="${valores[0] || "Auto"}" readonly /></div>`;
    cuerpo.innerHTML += `<div class="mb-3"><label>Proveedor</label><input class="form-control" name="Proveedor" value="${valores[1] || ""}" required /></div>`;

    cuerpo.innerHTML += `<div class="mb-3"><label>Tipo de Gasto</label><select class="form-select" name="TipoGasto">${opcionesTipoGasto.map(op => `<option value="${op}" ${valores[2] === op ? "selected" : ""}>${op}</option>`).join("")}</select></div>`;

    cuerpo.innerHTML += `<div class="mb-3"><label>Fecha</label><input type="date" class="form-control" name="Fecha" value="${valores[3] || ""}" required /></div>`;
    cuerpo.innerHTML += `<div class="mb-3"><label>Monto</label><input type="number" step="0.01" class="form-control" name="Monto" value="${valores[4] || ""}" required /></div>`;
    cuerpo.innerHTML += `<div class="mb-3"><label>Observaciones</label><input class="form-control" name="Observaciones" value="${valores[5] || ""}" /></div>`;
  }

  form.onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const gasto = Object.fromEntries(fd.entries());

    try {
      if (modoEdicion) {
        await fetch(`${API_URL}/gastos/${idEditando}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: idEditando, ...gasto })
        });
        const i = rows.findIndex(r => r[0] == idEditando);
        if (i >= 0) rows[i] = [idEditando, gasto.Proveedor, gasto.TipoGasto, gasto.Fecha, gasto.Monto, gasto.Observaciones];
        alert("Gasto actualizado");
      } else {
        const res = await fetch(`${API_URL}/gastos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gasto)
        });
        const json = await res.json();
        rows.push([json.id, gasto.Proveedor, gasto.TipoGasto, gasto.Fecha, gasto.Monto, gasto.Observaciones]);
        alert("Gasto registrado");
      }
      modal.hide();
      mostrarPagina(paginaActual, filtroInput.value);
    } catch (err) {
      console.error("Error al guardar gasto", err);
      alert("Error al guardar gasto");
    }
  };

  btnEliminar.onclick = async () => {
    if (!confirm("¿Desea eliminar este gasto?")) return;
    await fetch(`${API_URL}/gastos/${idEditando}`, { method: "DELETE" });
    rows = rows.filter(r => r[0] != idEditando);
    alert("Gasto eliminado");
    modal.hide();
    mostrarPagina(1);
  };

  mostrarPagina(1);
}
