const express = require('express');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const CATEGORIAS = ['Comida', 'Transporte', 'Vivienda', 'Entretenimiento', 'Salud', 'Otros'];
const MEDIOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta'];
const TIPOS_TARJETA = ['Débito', 'Crédito'];

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

    if (!descripcion || descripcion.trim() === '') {
        return res.status(400).json({ error: 'La descripción es obligatoria' });
    }
    if (typeof monto !== 'number' || monto <= 0) {
        return res.status(400).json({ error: 'El monto debe ser un número mayor a 0' });
    }
    if (!CATEGORIAS.includes(categoria)) {
        return res.status(400).json({ error: 'Categoría inválida' });
    }
    if (!fecha || isNaN(Date.parse(fecha))) {
        return res.status(400).json({ error: 'Fecha inválida' });
    }
    if (!MEDIOS_PAGO.includes(medioPago)) {
        return res.status(400).json({ error: 'Medio de pago inválido' });
    }
    if (tipo && !TIPOS_TARJETA.includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de tarjeta inválido' });
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