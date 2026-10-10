// Resumen de una lista de gastos (con la forma que devuelve GET /api/gastos):
// cuantos son, cuanto suman, el promedio, el gasto mas grande y la categoria
// en la que mas se gasto. Con `mes` ("01" a "12") se resume solo ese mes.
function resumirGastos(gastos, mes) {
    if (!Array.isArray(gastos)) {
        throw new Error('Los gastos deben ser una lista');
    }
    if (mes !== undefined && !/^(0[1-9]|1[0-2])$/.test(mes)) {
        throw new Error('El mes debe ser un texto entre 01 y 12');
    }

    // La fecha viene como "YYYY-MM-DD": el mes son los caracteres 5 y 6.
    const elegidos = mes === undefined ? gastos : gastos.filter((g) => g.fecha.slice(5, 7) === mes);
    if (elegidos.length === 0) {
        return { cantidad: 0, total: 0, promedio: 0, mayor: null, categoriaTop: null };
    }

    const totalPorCategoria = {};
    let total = 0;
    let mayor = elegidos[0];
    for (const gasto of elegidos) {
        // El monto de PostgreSQL (NUMERIC) llega como texto: se pasa a numero.
        const monto = Number(gasto.monto);
        total += monto;
        totalPorCategoria[gasto.categoria] = (totalPorCategoria[gasto.categoria] ?? 0) + monto;
        if (monto > Number(mayor.monto)) {
            mayor = gasto;
        }
    }

    const categoriaTop = Object.keys(totalPorCategoria).reduce((a, b) =>
        totalPorCategoria[b] > totalPorCategoria[a] ? b : a
    );

    return {
        cantidad: elegidos.length,
        total: Number(total.toFixed(2)),
        promedio: Number((total / elegidos.length).toFixed(2)),
        mayor,
        categoriaTop,
    };
}

module.exports = { resumirGastos };
