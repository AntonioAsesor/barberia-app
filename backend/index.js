const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const corsOptions = {
  origin: 'https://barberia-frontend.onrender.com',
  methods: 'GET,POST,PUT,DELETE',
  credentials: true
};

app.use(cors(corsOptions));
const app = express();
app.use(express.json());

// 👉 ID de la hoja de cálculo (pegado directamente)
const SPREADSHEET_ID = '1NJIdowqiNKeH0aupbysbkJto9AODk6lQAPgjdRQ6wkg';

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const path = require('path');

// ✅ Servir archivos estáticos de la carpeta frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));
// 👉 Función auxiliar para obtener cliente de Sheets
async function getGoogleSheetsClient() {
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}
// 👉 Ruta para obtener los clientes
app.get('/clientes', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Clientes!A1:Z',
    });

    res.json(result.data.values); // <-- Esta línea debe estar antes de cerrar la ruta
  } catch (err) {
    console.error('Error /clientes:', err);
    res.status(500).json('Error obteniendo clientes');
  }
}); // ✅ ← ESTA llave debe cerrar justo aquí

// ------------------------------------------------------------------------------------------//
// Crear nuevo cliente
app.post('/clientes', async (req, res) => {
  const nuevoCliente = req.body;

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Clientes!A2:A',
    });

    const ids = result.data.values?.map(row => parseInt(row[0])) || [];
    const nuevoId = (Math.max(0, ...ids) || 0) + 1;

    const fila = [
      nuevoId,
      nuevoCliente.Nombre,
      nuevoCliente.Teléfono,
      nuevoCliente.Email,
      nuevoCliente.Dirección,
      nuevoCliente["Fecha Registro"],
      nuevoCliente.Sexo,
      nuevoCliente.Grupo
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Clientes!A:H',
      valueInputOption: 'RAW',
      requestBody: { values: [fila] },
    });

    res.status(201).json({ id: nuevoId });
  } catch (err) {
    console.error('Error POST /clientes:', err);
    res.status(500).json('Error al crear cliente');
  }
});
// Editar cliente
app.put('/clientes/:id', async (req, res) => {
  const id = req.params.id;
  const clienteEditado = req.body;

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Clientes!A2:H',
    });

    const valores = result.data.values || [];
    const rowIndex = valores.findIndex(row => row[0] == id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const filaEditada = [
      id,
      clienteEditado.Nombre,
      clienteEditado.Teléfono,
      clienteEditado.Email,
      clienteEditado.Dirección,
      clienteEditado["Fecha Registro"],
      clienteEditado.Sexo,
      clienteEditado.Grupo
    ];

    const range = `Clientes!A${rowIndex + 2}:H${rowIndex + 2}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [filaEditada],
      },
    });

    res.json({ message: 'Cliente actualizado correctamente' });
  } catch (err) {
    console.error('Error PUT /clientes:', err);
    res.status(500).json({ error: 'Error editando cliente' });
  }
});
// Eliminar cliente
app.delete('/clientes/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Clientes!A2:H',
    });

    const filas = result.data.values;
    const index = filas.findIndex(row => row[0] == id);

    if (index === -1) return res.status(404).send("Cliente no encontrado");

    // Borrar fila (usando batchUpdate)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0, // Asegúrate que es el ID correcto de la hoja "Clientes"
              dimension: 'ROWS',
              startIndex: index + 1,
              endIndex: index + 2,
            }
          }
        }]
      }
    });

    res.sendStatus(200);
  } catch (err) {
    console.error('Error DELETE /clientes:', err);
    res.status(500).json('Error al eliminar cliente');
  }
});
// -------------------------------------------------------------------------------
// 👉 Nueva ruta para leer los grupos de clientes desde el sheet "Grupos"
app.get('/grupos', async (req, res) => {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,   // arriba está definido el Id, no neesitamos el .env
      range: 'Grupos!A2:A', // empieza desde la fila 2 para evitar encabezado
    });

    const grupos = result.data.values.flat();
    res.json(grupos);
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    res.status(500).json({ error: 'No se pudieron obtener los grupos' });
  }
});

// ✅ Nueva ruta para obtener los datos del negocio
app.get('/datos-negocio', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'DatosNegocio!A2:B',
    });

    res.json(result.data.values); // Array de pares [campo, valor]
  } catch (err) {
    console.error('Error /datos-negocio:', err);
    res.status(500).json('Error obteniendo datos del negocio');
  }
});
/////////////////  ----------------------------------------------------------------------------------- ///////////
// 👉 Obtener lista de Servicios
app.get('/servicios', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Servicios!A1:E',
    });

    res.json(result.data.values);
  } catch (err) {
    console.error('Error GET /servicios:', err);
    res.status(500).json('Error obteniendo servicios');
  }
});

// 👉 Crear nuevo servicio
app.post('/servicios', async (req, res) => {
  const nuevo = req.body;

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Servicios!A2:A',
    });

    const ids = result.data.values?.map(row => parseInt(row[0])) || [];
    const nuevoId = (Math.max(0, ...ids) || 0) + 1;

    const fila = [
      nuevoId,
      nuevo["Nombre Servicio"],
      nuevo.Precio,
      nuevo.Categoría,
      nuevo.CostoUnitario
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Servicios!A:E',
      valueInputOption: 'RAW',
      requestBody: { values: [fila] },
    });

    res.status(201).json({ id: nuevoId });
  } catch (err) {
    console.error('Error POST /servicios:', err);
    res.status(500).json('Error al crear servicio');
  }
});

// ✅ FUNCIÓN: Editar un servicio por ID en la hoja "Servicios"
app.put('/servicios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { NombreServicio, Precio, Categoria, CostoUnitario } = req.body;

    const sheets = await getGoogleSheetsClient();
    const sheet = sheets.spreadsheets.values;

    // Obtener todos los servicios (sin encabezado)
    const response = await sheet.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Servicios!A2:E',
    });

    const rows = response.data.values;
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Reemplazar la fila encontrada
    const updatedRow = [
      id,
      NombreServicio,
      Precio,
      Categoria,
      CostoUnitario
    ];

    await sheet.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Servicios!A${rowIndex + 2}:E${rowIndex + 2}`, // +2 por encabezado
      valueInputOption: 'RAW',
      requestBody: { values: [updatedRow] },
    });

    res.json({ message: 'Servicio actualizado correctamente' });
  } catch (error) {
    console.error('❌ Error al actualizar servicio:', error);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
});

// ✅ FUNCIÓN: Eliminar un servicio por ID de la hoja "Servicios"
app.delete('/servicios/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sheets = await getGoogleSheetsClient();
    const sheet = sheets.spreadsheets.values;

    // Leer todas las filas de la hoja "Servicios"
    const response = await sheet.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Servicios!A2:E',
    });

    const rows = response.data.values;
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    // Borrar la fila completa con el índice correcto
    const sheetsApi = sheets.spreadsheets;
    await sheetsApi.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 3, // ✅ IMPORTANTE: "Servicios" es la hoja N° 4 → sheetId = 3
                dimension: 'ROWS',
                startIndex: rowIndex + 1, // +1 porque A2 corresponde al índice 1
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      },
    });

    res.json({ message: 'Servicio eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar servicio:', error);
    res.status(500).json({ error: 'Error al eliminar servicio' });
  }
});

 ///// ----------------------------------------------------------------------------//////

// ✅ Ruta: Obtener todas las ventas
app.get('/ventas', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Ventas!A1:H',
    });

    res.json(result.data.values); // incluye encabezado
  } catch (err) {
    console.error('❌ Error GET /ventas:', err);
    res.status(500).json('Error al obtener ventas');
  }
});

// ✅ Ruta: Crear nueva venta
app.post('/ventas', async (req, res) => {
  const venta = req.body;

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Obtener IDs actuales
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Ventas!A2:A',
    });

    const ids = result.data.values?.map(row => parseInt(row[0])) || [];
    const nuevoId = (Math.max(0, ...ids) || 0) + 1;

    const fila = [
    nuevoId,
    venta["Cliente ID"],
    venta["Cliente Nombre"],
    venta["Servicio ID"],
    venta["Servicio Nombre"],
    venta.Fecha,
    venta.Monto,
    venta.Observaciones
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Ventas!A:H',
      valueInputOption: 'RAW',
      requestBody: { values: [fila] },
    });

    res.status(201).json({ id: nuevoId });
  } catch (err) {
    console.error('❌ Error POST /ventas:', err);
    res.status(500).json('Error al registrar la venta');
  }
});

// ✅ Ruta: Editar una venta existente
app.put('/ventas/:id', async (req, res) => {
  const id = req.params.id;
  const v = req.body;

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const getResult = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Ventas!A2:H',
    });

    const filas = getResult.data.values;
    const index = filas.findIndex(row => row[0] == id);

    if (index === -1) return res.status(404).send("Venta no encontrada");

    const fila = [
      id,
      v["Cliente ID"],
      v["Cliente Nombre"],
      v["Servicio ID"],
      v["Servicio Nombre"],
      v.Fecha,
      v.Monto,
      v.Observaciones
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Ventas!A${index + 2}:H${index + 2}`,
      valueInputOption: 'RAW',
      requestBody: { values: [fila] },
    });

    res.send("Venta actualizada");
  } catch (err) {
    console.error('Error PUT /ventas:', err);
    res.status(500).json('Error al actualizar venta');
  }
});

// ✅ Ruta: Eliminar una venta
app.delete('/ventas/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Ventas!A2:H',
    });

    const filas = result.data.values;
//    const index = filas.findIndex(row => row[0] == id);
    const index = filas.findIndex(row => String(row[0]) === String(id));


    if (index === -1) return res.status(404).send("Venta no encontrada");
console.log("Venta a eliminar: ID:", id, "Fila encontrada (índice):", index);

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 482336591, // 🟢 IMPORTANTE: "Ventas" es la hoja 5 → sheetId = 4
              dimension: 'ROWS',
              startIndex: index + 1, // A2 = index 1
              endIndex: index + 2
            }
          }
        }]
      }
    });

    res.send("Venta eliminada");
  } catch (err) {
  console.error('❌ Error DELETE /ventas:', JSON.stringify(err, null, 2));
  res.status(500).json('Error al eliminar venta');
}
});

// 🔍 Ruta temporal para obtener nombre e ID de todas las hojas del Spreadsheet
//app.get('/debug/sheet-ids', async (req, res) => {
  //try {
  //  const client = await auth.getClient();
  //  const sheets = google.sheets({ version: 'v4', auth: client });

  //  const metadata = await sheets.spreadsheets.get({
  //    spreadsheetId: SPREADSHEET_ID,
  //  });

  //  const sheetsInfo = metadata.data.sheets.map(sheet => ({
  //    title: sheet.properties.title,
  //    sheetId: sheet.properties.sheetId,
  //  }));

  //  res.json(sheetsInfo);
  //} catch (err) {
  //  console.error("Error al obtener sheetIds:", err);
  //  res.status(500).json("Error al obtener IDs de las hojas");
  //}
//});

// 👉 Iniciar el servidor, ahora es localhost

app.get('/gastos', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Gastos!A1:F',
    });

    const rows = result.data.values || [];
    res.json(rows);
  } catch (err) {
    console.error('❌ Error GET /gastos:', err);
    res.status(500).json('Error al obtener gastos');
  }
});

app.post('/gastos', async (req, res) => {
  const gasto = req.body;

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Gastos!A2:A',
    });

    const ids = result.data.values?.map(row => parseInt(row[0])) || [];
    const nuevoId = (Math.max(0, ...ids) || 0) + 1;

    const fila = [
      nuevoId,
      gasto.Proveedor,
      gasto.TipoGasto,
      gasto.Fecha,
      gasto.Monto,
      gasto.Observaciones
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Gastos!A:F',
      valueInputOption: 'RAW',
      requestBody: { values: [fila] },
    });

    res.status(201).json({ id: nuevoId });
  } catch (err) {
    console.error('❌ Error POST /gastos:', err);
    res.status(500).json('Error al registrar el gasto');
  }
});

app.put('/gastos/:id', async (req, res) => {
  const id = req.params.id;
  const gasto = req.body;

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Gastos!A2:F',
    });

    const filas = result.data.values || [];
    const index = filas.findIndex(row => row[0] == id);

    if (index === -1) return res.status(404).send("Gasto no encontrado");

    const fila = [
      id,
      gasto.Proveedor,
      gasto.TipoGasto,
      gasto.Fecha,
      gasto.Monto,
      gasto.Observaciones
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Gastos!A${index + 2}:F${index + 2}`,
      valueInputOption: 'RAW',
      requestBody: { values: [fila] },
    });

    res.send("Gasto actualizado");
  } catch (err) {
    console.error('❌ Error PUT /gastos:', err);
    res.status(500).json('Error al actualizar gasto');
  }
});

app.delete('/gastos/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Gastos!A2:F',
    });

    const filas = result.data.values || [];
    const index = filas.findIndex(row => row[0] == id);
    if (index === -1) return res.status(404).send("Gasto no encontrado");

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 171220046, // 🟢 ID real de la hoja "Gastos"
              dimension: 'ROWS',
              startIndex: index + 1, // A2 = index 1
              endIndex: index + 2
            }
          }
        }]
      }
    });

    res.send("Gasto eliminado");
  } catch (err) {
    console.error('❌ Error DELETE /gastos:', JSON.stringify(err, null, 2));
    res.status(500).json('Error al eliminar gasto');
  }
});

// Ruta POST /caja/saldo-inicial  ------ESTA ES LA QUE COMENTAMOS
//app.post('/caja/saldo-inicial', async (req, res) => {
//  const { fecha, valor } = req.body;

//  try {
//    const client = await auth.getClient();
//    const sheets = google.sheets({ version: 'v4', auth: client });

    // Leer las filas actuales para calcular nuevo ID
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Caja!A2:G',
    });

    const filas = result.data.values || [];
    const ids = filas.map(f => parseInt(f[0])).filter(n => !isNaN(n));
    const nuevoId = (Math.max(...ids, 0) || 0) + 1;

    const fila = [
      nuevoId,
      fecha,
      "Entrada",
      "Saldo Inicial",
      "-",
      valor,
      valor // Saldo inicial igual al valor ingresado
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Caja!A:G',
      valueInputOption: 'RAW',
      requestBody: { values: [fila] },
    });

    res.status(201).json({ message: "Saldo inicial agregado" });
  } catch (err) {
    console.error('❌ Error POST /caja/saldo-inicial:', err);
    res.status(500).json('Error al guardar saldo inicial');
  }
});
// ✅ Ruta: Agregar saldo inicial
app.post('/caja/saldo-inicial', async (req, res) => {
  const { Fecha, Movimiento, Descripción, ClienteProveedor, Valor } = req.body;

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Caja!A2:A',
    });

    const ids = result.data.values?.map(row => parseInt(row[0])) || [];
    const nuevoId = (Math.max(...ids, 0) || 0) + 1;

    const fila = [
      nuevoId,
      Fecha,
      Movimiento,
      Descripción,
      ClienteProveedor,
      Valor,
      "" // El saldo se calcula en el Sheet
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Caja!A:G',
      valueInputOption: 'RAW',
      requestBody: { values: [fila] },
    });

    res.status(201).send("Saldo inicial guardado");
  } catch (err) {
    console.error("❌ Error POST /caja/saldo-inicial:", err);
    res.status(500).json("Error al guardar saldo inicial");
  }
});

// ✅ Ruta: Actualizar Caja desde Ventas y Gastos
app.post('/caja/actualizar', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const ventasData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Ventas!A2:H',
    });

    const ventas = ventasData.data.values || [];
    const movimientosVentas = ventas.map(v => [
      null,
      v[5], // Fecha
      "Entrada",
      v[4], // Servicio Nombre
      v[2], // Cliente Nombre
      parseFloat(v[6]) || 0,
      ""
    ]);

    const gastosData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Gastos!A2:F',
    });

    const gastos = gastosData.data.values || [];
    const movimientosGastos = gastos.map(g => [
      null,
      g[3], // Fecha
      "Salida",
      g[2], // TipoGasto
      g[1], // Proveedor
      parseFloat(g[4]) || 0,
      ""
    ]);

    const movimientos = [...movimientosVentas, ...movimientosGastos];
    movimientos.sort((a, b) => new Date(a[1]) - new Date(b[1]));

    const cajaData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Caja!A2:A',
    });

    const ids = cajaData.data.values?.map(r => parseInt(r[0])) || [];
    let nextId = (Math.max(0, ...ids) || 0) + 1;

    const filasFinales = movimientos.map(m => [nextId++, ...m.slice(1)]);

// ✅ Leer datos existentes en Caja
const cajaExistente = await sheets.spreadsheets.values.get({
  spreadsheetId: SPREADSHEET_ID,
  range: 'Caja!A2:G',
});

const existentes = cajaExistente.data.values || [];

// ✅ Leer último saldo anterior (Saldo Inicial)
const cajaAnterior = existentes.filter(f => f[3] === "Saldo Inicial");
let saldo = 0;
if (cajaAnterior.length > 0) {
  const ultima = cajaAnterior[cajaAnterior.length - 1];
  saldo = parseFloat(ultima[6]) || 0;
}

// ✅ Recalcular saldo acumulado y rellenar columna
for (let fila of filasFinales) {
  const tipo = fila[2]; // Ingreso o Salida
  const valor = parseFloat(fila[5]) || 0;
  saldo += tipo === "Entrada" ? valor : -valor; // Suma Saldo inicial + Entrada - Salida
  fila[6] = saldo.toFixed(2); // columna G
}

// ✅ Eliminar filas anteriores (excepto Saldo Inicial)
const filasAEliminar = existentes.filter(f => f[3] !== "Saldo Inicial");

if (filasAEliminar.length > 0) {
  const indexInicio = existentes.findIndex(f => f[3] !== "Saldo Inicial");
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: 1885996116, // ID de hoja Caja
            dimension: 'ROWS',
            startIndex: indexInicio + 1,
            endIndex: indexInicio + 1 + filasAEliminar.length
          }
        }
      }]
    }
  });
}

// ✅ Agregar filas nuevas a Caja
await sheets.spreadsheets.values.append({
  spreadsheetId: SPREADSHEET_ID,
  range: 'Caja!A:G',
  valueInputOption: 'RAW',
  requestBody: { values: filasFinales },
});

res.send("Caja actualizada");

  } catch (err) {
    console.error("❌ Error POST /caja/actualizar:", err);
    res.status(500).json("Error al actualizar caja");
  }
});
// ✅ Ruta: Obtener todos los movimientos de Caja
app.get('/sheet/Caja', async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Caja!A1:G',
    });
    res.json(result.data.values);
  } catch (error) {
    console.error("❌ Error GET /sheet/Caja:", error);
    res.status(500).json("Error obteniendo datos de Caja");
  }
});
     //////// ----------------- DASHBOARD ----------- /////////

app.post('/dashboard/metrics', async (req, res) => {
  try {
    const { desde, hasta } = req.body;

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const ventasRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Ventas!A2:H',
    });
    const ventas = ventasRes.data.values || [];

    const gastosRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Gastos!A2:F',
    });
    const gastos = gastosRes.data.values || [];

    const hoy = new Date().toISOString().slice(0, 10);
    const desdeFecha = new Date(desde || hoy);
    const hastaFecha = new Date(hasta || hoy);

    // 🔍 Función para filtrar por fecha
    const enRango = (fecha) => {
      const f = new Date(fecha);
      return f >= desdeFecha && f <= hastaFecha;
    };

    // 📊 Procesar Ventas
    const ventasFiltradas = ventas.filter(v => v[5] && enRango(v[5]));
    const totalVentas = ventasFiltradas.reduce((sum, v) => sum + (parseFloat(v[6]) || 0), 0);
    const clientesUnicos = new Set(ventasFiltradas.map(v => v[2]));
    const promedioVenta = ventasFiltradas.length ? totalVentas / ventasFiltradas.length : 0;

    // 📉 Procesar Gastos
    const gastosFiltrados = gastos.filter(g => g[3] && enRango(g[3]));
    const totalGastos = gastosFiltrados.reduce((sum, g) => sum + (parseFloat(g[4]) || 0), 0);

    // 📅 Ventas y gastos por día
    const ventasPorDia = {};
    const gastosPorDia = {};

    ventasFiltradas.forEach(v => {
      const fecha = v[5];
      const monto = parseFloat(v[6]) || 0;
      ventasPorDia[fecha] = (ventasPorDia[fecha] || 0) + monto;
    });

    gastosFiltrados.forEach(g => {
      const fecha = g[3];
      const monto = parseFloat(g[4]) || 0;
      gastosPorDia[fecha] = (gastosPorDia[fecha] || 0) + monto;
    });
    // ✅ Leer nombre del negocio y moneda desde hoja DatosNegocio
const datosRes = await sheets.spreadsheets.values.get({
  spreadsheetId: SPREADSHEET_ID,
  range: 'DatosNegocio!A1:B10',
});
const datos = Object.fromEntries(datosRes.data.values || []);
const moneda = datos.Moneda || "$";
const nombreNegocio = datos["Nombre del Negocio"] || "Mi Negocio";

// ✅ respuesta JSON en backend
res.json({
  ventasHoy: totalVentas.toFixed(2),
  gastosHoy: totalGastos.toFixed(2),
  resultadoHoy: (totalVentas - totalGastos).toFixed(2),
  numVentasHoy: ventasFiltradas.length,
  numClientesHoy: clientesUnicos.size,
  ventaPromedio: promedioVenta.toFixed(2),
  ventasPorDia,
  gastosPorDia,
  hoy, // 👈 agrega esta línea
  moneda,
  nombreNegocio // ✅ nuevo campo
});

  } catch (err) {
    console.error("❌ Error en /dashboard/metrics:", err);
    res.status(500).json("Error calculando métricas del dashboard");
  }
});

// ✅ Ruta para servir index.html al abrir la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
