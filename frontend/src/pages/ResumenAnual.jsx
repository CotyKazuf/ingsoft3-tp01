import { useNavigate } from 'react-router-dom'
import { totalesPorMes } from '../lib/gastos'

function ResumenAnual({ gastos }) {
    const navigate = useNavigate()
    const anioActual = new Date().getFullYear()

    const totalesMensuales = totalesPorMes(gastos, anioActual)

    return (
        <div>
            <header>
                <h1>Gastos por mes — {anioActual}</h1>
                <button className="btn-agregar" onClick={() => navigate('/')}>Volver</button>
            </header>

            <div className="grid-meses">
                {totalesMensuales.map((item) => (
                    <div key={item.nombre} className="tarjeta-mes">
                        <small>{item.nombre}</small>
                        <div className="monto">${item.total}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ResumenAnual
