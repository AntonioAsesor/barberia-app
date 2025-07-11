// ✅ frontend-dashboard.js

async function mostrarDashboard() {
  const contenedor = document.getElementById("modulo-contenido");
  contenedor.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
    <h3 id="tituloDashboard">Tus números de hoy:</h3>
    <small id="infoFecha">($ / fecha)</small>
  <!-- Añadí el botón debajo -->
    <button id="btnExportarPDF" class="btn btn-danger">Exportar PDF</button>
    </div>
    <div class="row mb-4" id="tarjetasMetricas"></div>
    <div class="row mb-4">
      <div class="col">
        <label>Desde:</label>
        <input type="date" id="filtroDesde" class="form-control" />
      </div>
      <div class="col">
        <label>Hasta:</label>
        <input type="date" id="filtroHasta" class="form-control" />
      </div>
         <div class="col d-flex align-items-end">
        <button id="btnAplicarFiltros" class="btn btn-primary w-100">Aplicar filtros</button>
      </div>
    </div>

    <div class="row">
      <div class="col-md-6"><canvas id="graficoVentas"></canvas></div>
      <div class="col-md-6"><canvas id="graficoGastos"></canvas></div>
      
    </div>
  `;
document.getElementById("btnExportarPDF").onclick = exportarPDF;

  // ✅ Cargar métricas
  await cargarDatosDashboard();

  // 🎯 Eventos
  document.getElementById("btnAplicarFiltros").onclick = cargarDatosDashboard;
  document.getElementById("btnExportarPDF").onclick = exportarPDF;
}

async function cargarDatosDashboard() {
  const desde = document.getElementById("filtroDesde")?.value;
  const hasta = document.getElementById("filtroHasta")?.value;

  try {
    const res = await fetch("http://localhost:3000/dashboard/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ desde, hasta }),
    });

    const data = await res.json();
    mostrarTarjetas(data);
    mostrarGraficos(data);
    window.ultimoDashboardData = data; // 👈 ahora disponible en todo el archivo
document.getElementById("tituloDashboard").innerText = `Dashboard - ${data.nombreNegocio}`;
document.getElementById("infoFecha").innerText = `(${data.moneda} / ${data.hoy})`;
const desdeInput = document.getElementById("filtroDesde").value;
const hastaInput = document.getElementById("filtroHasta").value;

if (desdeInput && hastaInput && desdeInput !== data.hoy && hastaInput !== data.hoy) {
  infoFecha.innerText = `${data.moneda} / ${desdeInput} al ${hastaInput}`;
  document.getElementById("tituloDashboard").innerText = "Tus números del periodo:";
} else {
  infoFecha.innerText = `${data.moneda} / ${data.hoy}`;
  document.getElementById("tituloDashboard").innerText = "Tus números de hoy:";
}

  } catch (err) {
    console.error("❌ Error cargando dashboard:", err);
    alert("Error al cargar dashboard");
  }
}
// Datos que se muestran en tarjetas: Ventas, Gastos, numclientes, etc
function mostrarTarjetas(data) {  
  console.log("🔎 Dashboard data:", data); // log que se debe borrar luego o comentar
  const dv = data;
dv.numVentas = data.cantidadVentas;
dv.numClientes = data.cantidadClientes;
  const cont = document.getElementById("tarjetasMetricas");
  cont.innerHTML = `
    <div class="col"><div class="card text-white bg-success mb-3"><div class="card-body">
      <h5 class="card-title">Ventas</h5><p class="card-text">${data.moneda} ${data.ventasHoy}</p></div></div></div>
    <div class="col"><div class="card text-white bg-danger mb-3"><div class="card-body">
      <h5 class="card-title">Gastos</h5><p class="card-text">${data.moneda} ${data.gastosHoy}</p></div></div></div>
    <div class="col"><div class="card text-white ${data.resultadoHoy >= 0 ? 'bg-success' : 'bg-danger'} mb-3"><div class="card-body">
      <h5 class="card-title">Resultado</h5><p class="card-text">${data.moneda} ${data.resultadoHoy}</p></div></div></div>
    <div class="col"><div class="card bg-light mb-3"><div class="card-body">
      <h5 class="card-title"># Ventas</h5><p class="card-text">${data.numVentasHoy}</p></div></div></div>
    <div class="col"><div class="card bg-light mb-3"><div class="card-body">
      <h5 class="card-title"># Clientes</h5><p class="card-text">${data.numClientesHoy}</p></div></div></div>
    <div class="col"><div class="card bg-light mb-3"><div class="card-body">
      <h5 class="card-title">Venta Promedio</h5><p class="card-text">${data.moneda} ${data.ventaPromedio}</p></div></div></div>
  `;
}

let chartVentas, chartGastos;

function mostrarGraficos(data) {
  // Destruir gráficos previos si existen
  if (chartVentas) chartVentas.destroy();
  if (chartGastos) chartGastos.destroy();

  // 🔄 Si no hay datos, no mostrar gráficos
  if (!data.ventasPorDia || !data.gastosPorDia) return;

  const fechasVentas = Object.keys(data.ventasPorDia).sort();
  const valoresVentas = fechasVentas.map(f => data.ventasPorDia[f]);

  const fechasGastos = Object.keys(data.gastosPorDia).sort();
  const valoresGastos = fechasGastos.map(f => data.gastosPorDia[f]);

  const ctxVentas = document.getElementById("graficoVentas");
  chartVentas = new Chart(ctxVentas, {
    type: 'line',
    data: {
      labels: fechasVentas,
      datasets: [{
        label: "Ventas ($)",
        data: valoresVentas,
        borderColor: "#28a745",
        backgroundColor: "rgba(40, 167, 69, 0.2)",
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });

  const ctxGastos = document.getElementById("graficoGastos");
  chartGastos = new Chart(ctxGastos, {
    type: 'bar',
    data: {
      labels: fechasGastos,
      datasets: [{
        label: "Gastos ($)",
        data: valoresGastos,
        backgroundColor: "#dc3545"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function exportarPDF() {
  const desde = document.getElementById("filtroDesde")?.value || "No definido";
  const hasta = document.getElementById("filtroHasta")?.value || "No definido";
  const fechaHoy = new Date().toISOString().split("T")[0];

  const tituloPDF = document.createElement("div");
const nombreNegocio = window.ultimoDashboardData?.nombreNegocio || "Mi Negocio";
tituloPDF.innerHTML = `
  <h2 style="text-align:center;">Dashboard - ${nombreNegocio}</h2>
  <p style="text-align:center;">Rango de fechas: <strong>${desde}</strong> a <strong>${hasta}</strong></p>
  <p style="text-align:right;">Generado: ${fechaHoy}</p>
  <hr />
`;  
  const dashboard = document.getElementById("modulo-contenido");
  const clone = dashboard.cloneNode(true);
  clone.prepend(tituloPDF);
// 🔁 Convertir todos los canvas a imágenes antes del export
  // 🖼️ Reemplazar los gráficos <canvas> por imágenes generadas desde el DOM real
  const cloneCanvasImages = [];

  document.querySelectorAll("canvas").forEach(canvas => {
    const img = document.createElement("img");
    img.src = canvas.toDataURL("image/png");
    img.style.maxWidth = "100%";
    img.style.marginBottom = "20px";
    cloneCanvasImages.push(img);
  });

  // ✅ Reemplazamos todos los canvas del clon por las imágenes generadas
  const cloneCanvases = clone.querySelectorAll("canvas");
  cloneCanvases.forEach((canvas, index) => {
    if (cloneCanvasImages[index]) {
      canvas.replaceWith(cloneCanvasImages[index]);
    }
  });

  html2pdf()
    .set({
      margin: 10,
      filename: `dashboard-${fechaHoy}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    })
    
    .from(clone)
    .save();
}

// function exportarPDF() {
//  alert("🔧 Exportar a PDF se implementará pronto");
//}