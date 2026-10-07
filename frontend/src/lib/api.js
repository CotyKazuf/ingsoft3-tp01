// Utilidades para hablar con el backend.

// Mensaje que se muestra cuando el backend responde con error: el que mando el backend
// ({ error: "..." }) o, si no mando ninguno, uno por defecto.
export function mensajeDeError(data, mensajePorDefecto) {
    return data.error || mensajePorDefecto
}

// Cliente de la API de gastos. Reciben `fetchFn` por parametro: en la app real es el fetch
// del navegador (valor por defecto) y en los tests un doble (vi.fn()), asi no hay red real.

// Crea un gasto (POST /api/gastos) o, si se pasa gastoEditando, lo actualiza (PUT /api/gastos/:id).
// Devuelve el gasto que respondio el backend o lanza Error con el mensaje a mostrar.
export async function guardarGastoEnApi(datosGasto, gastoEditando, fetchFn = fetch) {
    const esEdicion = Boolean(gastoEditando)
    const url = esEdicion ? `/api/gastos/${gastoEditando.id}` : '/api/gastos'
    const metodo = esEdicion ? 'PUT' : 'POST'

    const res = await fetchFn(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosGasto),
    })
    const data = await res.json()
    if (!res.ok) {
        throw new Error(mensajeDeError(data, 'No se pudo guardar el gasto'))
    }
    return data
}

// Elimina un gasto (DELETE /api/gastos/:id). Si el backend responde con error, lanza Error.
export async function eliminarGastoEnApi(id, fetchFn = fetch) {
    const res = await fetchFn(`/api/gastos/${id}`, { method: 'DELETE' })
    if (res.ok) {
        return
    }
    const data = await res.json()
    throw new Error(mensajeDeError(data, 'No se pudo eliminar el gasto'))
}
