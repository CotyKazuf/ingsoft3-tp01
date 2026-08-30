const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const CATEGORIAS = ['Comida', 'Transporte', 'Vivienda', 'Entretenimiento', 'Salud', 'Otros'];
const TIPOS_TARJETA = ['Débito', 'Crédito'];

let gastos = [];
let nextId = 1;

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/api/gastos', (req, res) => {
    const { categoria } = req.query;
    let resultado = gastos;
    if (categoria) {
        resultado = gastos.filter((g) => g.categoria === categoria);
    }
    res.json(resultado);
});

app.post('/api/gastos', (req, res) => {
    const { descripcion, monto, categoria, fecha, tarjeta, tipo } = req.body;

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
    if (tipo && !TIPOS_TARJETA.includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de tarjeta inválido' });
    }

    const nuevoGasto = {
        id: nextId++,
        descripcion,
        monto,
        categoria,
        fecha,
        tarjeta: tarjeta || null,
        tipo: tipo || null,
    };

    gastos.push(nuevoGasto);
    res.status(201).json(nuevoGasto);
});

app.put('/api/gastos/:id', (req, res) => {
    const id = Number(req.params.id);
    const gasto = gastos.find((g) => g.id === id);

    if (!gasto) {
        return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    const { descripcion, monto, categoria, fecha, tarjeta, tipo } = req.body;
    if (descripcion !== undefined) gasto.descripcion = descripcion;
    if (monto !== undefined) gasto.monto = monto;
    if (categoria !== undefined) gasto.categoria = categoria;
    if (fecha !== undefined) gasto.fecha = fecha;
    if (tarjeta !== undefined) gasto.tarjeta = tarjeta;
    if (tipo !== undefined) gasto.tipo = tipo;

    res.json(gasto);
});

app.delete('/api/gastos/:id', (req, res) => {
    const id = Number(req.params.id);
    const index = gastos.findIndex((g) => g.id === id);

    if (index === -1) {
        return res.status(404).json({ error: 'Gasto no encontrado' });
    }

    gastos.splice(index, 1);
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Backend escuchando en el puerto ${PORT}`);
});