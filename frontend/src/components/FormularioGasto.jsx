import { useState, useEffect } from 'react'

export const CATEGORIAS = ['Comida', 'Transporte', 'Vivienda', 'Entretenimiento', 'Salud', 'Otros']

export const CATEGORIA_SLUG = {
    Comida: 'comida',
    Transporte: 'transporte',
    Vivienda: 'vivienda',
    Entretenimiento: 'entretenimiento',
    Salud: 'salud',
    Otros: 'otros',
}

const MEDIOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta']
const TIPOS_TARJETA = ['Débito', 'Crédito']

export const MESES = [
    { valor: '01', nombre: 'Enero' },
    { valor: '02', nombre: 'Febrero' },
    { valor: '03', nombre: 'Marzo' },
    { valor: '04', nombre: 'Abril' },
    { valor: '05', nombre: 'Mayo' },
    { valor: '06', nombre: 'Junio' },
    { valor: '07', nombre: 'Julio' },
    { valor: '08', nombre: 'Agosto' },
    { valor: '09', nombre: 'Septiembre' },
    { valor: '10', nombre: 'Octubre' },
    { valor: '11', nombre: 'Noviembre' },
    { valor: '12', nombre: 'Diciembre' },
]

const hoyISO = () => new Date().toLocaleDateString('sv-SE') // formato YYYY-MM-DD en horario local
const primerDiaDelAnio = () => `${new Date().getFullYear()}-01-01`

function FormularioGasto({ onGastoGuardado, gastoEditando }) {
    const [descripcion, setDescripcion] = useState('')
    const [monto, setMonto] = useState('')
    const [categoria, setCategoria] = useState(CATEGORIAS[0])
    const [fecha, setFecha] = useState('')
    const [medioPago, setMedioPago] = useState(MEDIOS_PAGO[0])
    const [tarjeta, setTarjeta] = useState('')
    const [tipo, setTipo] = useState('')
    const [error, setError] = useState('')

    useEffect(() => {
        if (gastoEditando) {
            setDescripcion(gastoEditando.descripcion)
            setMonto(gastoEditando.monto)
            setCategoria(gastoEditando.categoria)
            setFecha(gastoEditando.fecha)
            setMedioPago(gastoEditando.medio_pago)
            setTarjeta(gastoEditando.tarjeta || '')
            setTipo(gastoEditando.tipo || '')
        }
    }, [gastoEditando])

    const limpiarFormulario = () => {
        setDescripcion('')
        setMonto('')
        setCategoria(CATEGORIAS[0])
        setFecha('')
        setMedioPago(MEDIOS_PAGO[0])
        setTarjeta('')
        setTipo('')
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setError('')

        const datosGasto = {
            descripcion,
            monto: Number(monto),
            categoria,
            fecha,
            medioPago,
            tarjeta: medioPago === 'Tarjeta' ? tarjeta : null,
            tipo: medioPago === 'Tarjeta' ? tipo : null,
        }

        const esEdicion = Boolean(gastoEditando)
        const url = esEdicion ? `/api/gastos/${gastoEditando.id}` : '/api/gastos'
        const metodo = esEdicion ? 'PUT' : 'POST'

        fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosGasto),
        })
            .then((res) =>
                res.json().then((data) => {
                    if (!res.ok) {
                        throw new Error(data.error || 'No se pudo guardar el gasto')
                    }
                    return data
                })
            )
            .then(() => {
                onGastoGuardado()
                limpiarFormulario()
            })
            .catch((err) => {
                console.error('Error al guardar gasto:', err)
                setError(err.message)
            })
    }

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="mensaje-error">{error}</div>}

            <div className="campo">
                <label>Descripción</label>
                <input
                    type="text"
                    placeholder="Ej: Supermercado"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    required
                />
            </div>

            <div className="campo">
                <label>Monto</label>
                <input
                    type="number"
                    placeholder="0"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    min="0.01"
                    step="0.01"
                    required
                />
            </div>

            <div className="campo">
                <label>Categoría</label>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                    {CATEGORIAS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            <div className="campo">
                <label>Fecha</label>
                <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    min={primerDiaDelAnio()}
                    max={hoyISO()}
                    required
                />
            </div>

            <div className="campo">
                <label>Medio de pago</label>
                <select value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
                    {MEDIOS_PAGO.map((m) => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>

            {medioPago === 'Tarjeta' && (
                <>
                    <div className="campo">
                        <label>Nombre de la tarjeta</label>
                        <input
                            type="text"
                            placeholder="Ej: Visa BNA"
                            value={tarjeta}
                            onChange={(e) => setTarjeta(e.target.value)}
                        />
                    </div>
                    <div className="campo">
                        <label>Tipo</label>
                        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                            <option value="">Tipo...</option>
                            {TIPOS_TARJETA.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            <button type="submit" className="btn-guardar">
                {gastoEditando ? 'Guardar cambios' : 'Agregar gasto'}
            </button>
        </form>
    )
}

export default FormularioGasto