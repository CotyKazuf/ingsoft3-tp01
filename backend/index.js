const express = require('express');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const CATEGORIAS = ['Comida', 'Transporte', 'Vivienda', 'Entretenimiento', 'Salud', 'Otros'];
const MEDIOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta'];
const TIPOS_TARJETA = ['Débito', 'Crédito'];

// Fecha de hoy en formato YYYY-MM-DD, en horario local del servidor.
function hoyISO() {
    const ahora = new Date();
    const sinOffset = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
    return sinOffset.toISOString().slice(0, 10);
}

// Valida los campos de un gasto. Con parcial=true (usado en PUT), un campo
// undefined se omite (se conserva el valor actual); si viene presente, igual
// se valida con las mismas reglas que en la creación.
function validarCamposGasto({ descripcion, monto, categoria, fecha, medioPago, tipo }, { parcial = false } = {}) {
    if ((!parcial || descripcion !== undefined) && (!descripcion || descripcion.trim() === '')) {
        return 'La descripción es obligatoria';
    }
    if ((!parcial || monto !== undefined) && (typeof monto !== 'number' || monto <= 0)) {
        return 'El monto debe ser un número mayor a 0';
    }
    if ((!parcial || categoria !== undefined) && !CATEGORIAS.includes(categoria)) {
        return 'Categoría inválida';
    }
    if (!parcial || fecha !== undefined) {
        if (!fecha || isNaN(Date.parse(fecha))) {
            return 'Fecha inválida';
        }
        const fechaStr = String(fecha).slice(0, 10);
        if (fechaStr > hoyISO()) {
            return 'La fecha no puede ser futura';
        }
        const anioActual = new Date().getFullYear();
        if (fechaStr.slice(0, 4) !== String(anioActual)) {
            return `La fecha debe ser del año ${anioActual}`;
        }
    }
    if ((!parcial || medioPago !== undefined) && !MEDIOS_PAGO.includes(medioPago)) {
        return 'Medio de pago inválido';
    }
    if (tipo && !TIPOS_TARJETA.includes(tipo)) {
        return 'Tipo de tarjeta inválido';
    }
    return null;
}

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/gastos', async (req, res) => {
    try {
        const { categoria } = req.query;
        const result = categoria
            ? await pool.query('SELECT * FROM gastos WHERE categoria = $1 ORDER BY id', [categoria])
            : await pool.query('SELECT * FROM gastos ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al consultar los gastos' });
    }
});

app.post('/api/gastos', async (req, res) => {
    const { descripcion, monto, categoria, fecha, medioPago, tarjeta, tipo } = req.body;

    const errorValidacion = validarCamposGasto({ descripcion, monto, categoria, fecha, medioPago, tipo });
    if (errorValidacion) {
        return res.status(400).json({ error: errorValidacion });
    }

    try {
        const result = await pool.query(
            `INSERT INTO gastos (descripcion, monto, categoria, fecha, medio_pago, tarjeta, tipo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [descripcion, monto, categoria, fecha, medioPago, tarjeta || null, tipo || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear el gasto' });
    }
});

app.put('/api/gastos/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
        const existente = await pool.query('SELECT * FROM gastos WHERE id = $1', [id]);
        if (existente.rows.length === 0) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }
        const actual = existente.rows[0];
        const { descripcion, monto, categoria, fecha, medioPago, tarjeta, tipo } = req.body;

        const errorValidacion = validarCamposGasto({ descripcion, monto, categoria, fecha, medioPago, tipo }, { parcial: true });
        if (errorValidacion) {
            return res.status(400).json({ error: errorValidacion });
        }

        const result = await pool.query(
            `UPDATE gastos SET descripcion = $1, monto = $2, categoria = $3, fecha = $4,
       medio_pago = $5, tarjeta = $6, tipo = $7 WHERE id = $8 RETURNING *`,
            [
                descripcion ?? actual.descripcion,
                monto ?? actual.monto,
                categoria ?? actual.categoria,
                fecha ?? actual.fecha,
                medioPago ?? actual.medio_pago,
                tarjeta !== undefined ? tarjeta : actual.tarjeta,
                tipo !== undefined ? tipo : actual.tipo,
                id,
            ]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar el gasto' });
    }
});

app.delete('/api/gastos/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
        const result = await pool.query('DELETE FROM gastos WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar el gasto' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend escuchando en el puerto ${PORT}`);
});