// Utilidades para hablar con el backend.

// Mensaje que se muestra cuando el backend responde con error: el que mando el backend
// ({ error: "..." }) o, si no mando ninguno, uno por defecto.
export function mensajeDeError(data, mensajePorDefecto) {
    return data.error || mensajePorDefecto
}
