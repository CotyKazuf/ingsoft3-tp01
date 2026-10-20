import { useState, useEffect } from 'react'
import { CATEGORIAS, MEDIOS_PAGO, TIPOS_TARJETA } from '../lib/constantes'
import { construirDatosGasto } from '../lib/gastos'
import { guardarGastoEnApi } from '../lib/api'

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

        const datosGasto = construirDatosGasto({ descripcion, monto, categoria, fecha, medioPago, tarjeta, tipo })

        guardarGastoEnApi(datosGasto, gastoEditando)
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
            {error && <div className="mensaje-error" role="alert">{error}</div>}

            <div className="campo">
                <label htmlFor="descripcion">Descripción</label>
                <input
                    id="descripcion"
                    type="text"
                    placeholder="Ej: Supermercado"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    required
                />
            </div>

            <div className="campo">
                <label htmlFor="monto">Monto</label>
                <input
                    id="monto"
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
                <label htmlFor="categoria">Categoría</label>
                <select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                    {CATEGORIAS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            <div className="campo">
                <label htmlFor="fecha">Fecha</label>
                <input
                    id="fecha"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    min={primerDiaDelAnio()}
                    max={hoyISO()}
                    required
                />
            </div>

            <div className="campo">
                <label htmlFor="medio-pago">Medio de pago</label>
                <select id="medio-pago" value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
                    {MEDIOS_PAGO.map((m) => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>

            {medioPago === 'Tarjeta' && (
                <>
                    <div className="campo">
                        <label htmlFor="tarjeta">Nombre de la tarjeta</label>
                        <input
                            id="tarjeta"
                            type="text"
                            placeholder="Ej: Visa BNA"
                            value={tarjeta}
                            onChange={(e) => setTarjeta(e.target.value)}
                        />
                    </div>
                    <div className="campo">
                        <label htmlFor="tipo">Tipo</label>
                        <select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
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