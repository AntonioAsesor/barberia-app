// ✅ frontend-caja.js: módulo frontend para Caja

async function mostrarCaja() {
  const contenedor = document.getElementById("modulo-contenido");
  contenedor.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-1">
      <h2>Caja</h2>
      <div>
        <button id="btnAgregarSaldoInicial" class="btn btn-secondary me-2">Agregar Saldo Inicial</button>
        <button id="btnActualizarCaja" class="btn btn-primary">Actualizar Caja</button>
      </div>
    </div>
        <div class="d-flex justify-content-between align-items-center mb-0">
      <p>Consulta de movimientos de Caja del negocio (Entrada - Salida = Saldo). </p>
    </div> 
    <input type="text" id="filtroCaja" class="form-control mb-3" placeholder="Buscar movimiento..." />
    <div class="table-responsive">
      <table class="table table-striped table-bordered" id="tablaCaja">
        <thead class="table-primary">
          <tr><th>ID</th><th>Fecha</th><th>Movimiento</th><th>Descripción</th><th>Cliente/Proveedor</th><th>Valor</th><th>Saldo</th></tr>
        </thead>
        <tbody id="bodyCaja"></tbody>
      </table>
    </div>
    <nav><ul class="pagination" id="paginacionCaja"></ul></nav>

    <div class="modal fade" id="modalSaldo" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form id="formSaldo">
            <div class="modal-header">
              <h5 class="modal-title">Agregar Saldo Inicial</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label>Fecha</label>
                <input type="date" name="fecha" class="form-control" required />
              </div>
              <div class="mb-3">
                <label>Valor</label>
                <input type="number" name="valor" step="0.01" class="form-control" required />
              </div>
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  // 🧠 Aquí es donde conectamos los botones  Vinculación de botones
  document.getElementById("btnAgregarSaldoInicial").onclick = agregarSaldoInicial;
  document.getElementById("btnActualizarCaja").onclick = actualizarCaja;

  const API_URL = "http://localhost:3000";
  const res = await fetch(`${API_URL}/sheet/Caja`);
  const data = await res.json();
  const headers = data[0];
  let rows = data.slice(1);

  const body = document.getElementById("bodyCaja");
  const pagination = document.getElementById("paginacionCaja");
  const filtroInput = document.getElementById("filtroCaja");
  const modalSaldo = new bootstrap.Modal(document.getElementById("modalSaldo"));
  const formSaldo = document.getElementById("formSaldo");
  const btnActualizar = document.getElementById("btnActualizarCaja");
  const btnSaldoInicial = document.getElementById("btnAgregarSaldoInicial");

  const rowsPorPagina = 10;
  let paginaActual = 1;

  function mostrarPagina(pagina, filtro = "") {
    filtro = filtro.toLowerCase();
    const filtrados = rows.filter(row => row.some(cell => cell.toLowerCase?.().includes(filtro)));
    const totalPaginas = Math.ceil(filtrados.length / rowsPorPagina);
    paginaActual = Math.max(1, Math.min(pagina, totalPaginas || 1));

    const inicio = (paginaActual - 1) * rowsPorPagina;
    const pageRows = filtrados.slice(inicio, inicio + rowsPorPagina);

    body.innerHTML = pageRows.map(row => `<tr>${row.map(cell => `<td>${cell || ""}</td>`).join("")}</tr>`).join("");

    pagination.innerHTML = Array.from({ length: totalPaginas }, (_, i) => `
      <li class="page-item ${i + 1 === paginaActual ? "active" : ""}">
        <a class="page-link" href="#" data-page="${i + 1}">${i + 1}</a>
      </li>`).join("");

    document.querySelectorAll("#paginacionCaja a").forEach(link => {
      link.onclick = e => {
        e.preventDefault();
        mostrarPagina(parseInt(e.target.dataset.page), filtroInput.value);
      };
    });
  }

  filtroInput.oninput = () => mostrarPagina(1, filtroInput.value);
  mostrarPagina(1);

  btnActualizar.onclick = async () => {
    if (!confirm("¿Desea actualizar la Caja con ventas y gastos?")) return;
    try {
      await fetch(`${API_URL}/caja/actualizar`, { method: "POST" });
      alert("Caja actualizada correctamente");
      mostrarCaja();
    } catch (err) {
      console.error("Error al actualizar caja:", err);
      alert("Error al actualizar caja");
    }
  };

  btnSaldoInicial.onclick = () => modalSaldo.show();

  formSaldo.onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(formSaldo);
    const datos = {
      fecha: fd.get("fecha"),
      valor: fd.get("valor")
    };

    try {
      await fetch(`${API_URL}/caja/saldo-inicial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });
      alert("Saldo inicial agregado");
      modalSaldo.hide();
      mostrarCaja();
    } catch (err) {
      console.error("Error al guardar saldo inicial:", err);
      alert("Error al guardar saldo inicial");
    }
  };
} 
// ✅ Función para agregar saldo inicial
function agregarSaldoInicial() {
  const modal = new bootstrap.Modal(document.getElementById("modalSaldo"));
  modal.show();

  const form = document.getElementById("formSaldo");
  form.onsubmit = async (e) => {
    e.preventDefault();

    const datos = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch(`${API_URL}/caja/saldo-inicial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (!res.ok) throw new Error("Error al guardar saldo inicial");

      alert("Saldo inicial guardado correctamente");
      modal.hide();
      mostrarCaja(); // 👈 recarga la tabla después de guardar
    } catch (err) {
      console.error("❌ Error al guardar saldo:", err);
      alert("Error al guardar saldo inicial");
    }
  };
}

// ✅ Función para actualizar caja desde ventas y gastos
async function actualizarCaja() {
  try {
    const desde = prompt("Desde (yyyy-mm-dd):");
    const hasta = prompt("Hasta (yyyy-mm-dd):");
    if (!desde || !hasta) return alert("Fechas inválidas");

    const res = await fetch("http://localhost:3000/caja/actualizar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ desde, hasta }),
    });

    if (!res.ok) throw new Error("Error al actualizar caja");
    alert("Caja actualizada");
    mostrarCaja(); // recarga visual
  } catch (err) {
    console.error("❌ Error actualizar caja:", err);
    alert("Error al actualizar caja");
  }
}