// Logica pura de Mis Gastos: calculos, filtros y transformaciones sobre la lista de gastos.
// No usa React, ni el DOM, ni fetch: recibe datos y devuelve datos.
import { CATEGORIAS, MESES } from './constantes'

// Suma de todos los montos. PostgreSQL devuelve "monto" como texto ("100.50"),
// por eso cada monto se convierte con Number antes de sumar.
export function calcularTotal(gastos) {
    return gastos.reduce((acumulado, g) => acumulado + Number(g.monto), 0)
}

// Total por categoria, en el orden de CATEGORIAS, mostrando solo las que tienen gastos.
export function totalesPorCategoria(gastos) {
    return CATEGORIAS.map((cat) => ({
        categoria: cat,
        total: gastos
            .filter((g) => g.categoria === cat)
            .reduce((acumulado, g) => acumulado + Number(g.monto), 0),
    })).filter((item) => item.total > 0)
}

// Filtra por categoria y por mes ("01".."12"). Un filtro vacio significa "todos".
export function filtrarGastos(gastos, { categoria, mes }) {
    return gastos.filter((g) => {
        const coincideCategoria = !categoria || g.categoria === categoria
        const coincideMes = !mes || g.fecha.slice(5, 7) === mes
        return coincideCategoria && coincideMes
    })
}

// Total de cada uno de los 12 meses del anio indicado (los gastos de otros anios se ignoran).
export function totalesPorMes(gastos, anio) {
    return MESES.map(({ valor, nombre }) => {
        const total = gastos
            .filter((g) => g.fecha.slice(0, 4) === String(anio) && g.fecha.slice(5, 7) === valor)
            .reduce((acumulado, g) => acumulado + Number(g.monto), 0)
        return { nombre, total }
    })
}

// "2026-03-05" -> "05/03/2026"
export function formatearFecha(fecha) {
    const [anio, mes, dia] = fecha.split('-')
    return `${dia}/${mes}/${anio}`
}

// Arma el cuerpo que se envia al backend a partir de lo que cargo el usuario en el formulario.
// El monto viaja como numero, y la tarjeta y su tipo solo viajan si el medio de pago es "Tarjeta".
export function construirDatosGasto({ descripcion, monto, categoria, fecha, medioPago, tarjeta, tipo }) {
    return {
        descripcion,
        monto: Number(monto),
        categoria,
        fecha,
        medioPago,
        tarjeta: medioPago === 'Tarjeta' ? tarjeta : null,
        tipo: medioPago === 'Tarjeta' ? tipo : null,
    }
}

// Que porcentaje del gasto total representa cada categoria (solo las que tienen gastos),
// de mayor a menor y redondeado a 1 decimal. Sin gastos devuelve una lista vacia
// (asi no se divide por cero).
export function porcentajesPorCategoria(gastos) {
    const total = calcularTotal(gastos)
    if (total <= 0) {
        return []
    }
    return totalesPorCategoria(gastos)
        .map(({ categoria, total: parcial }) => ({
            categoria,
            porcentaje: Math.round((parcial / total) * 1000) / 10,
        }))
        .sort((a, b) => b.porcentaje - a.porcentaje)
}
