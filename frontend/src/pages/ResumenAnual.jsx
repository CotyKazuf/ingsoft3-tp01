import { useNavigate } from 'react-router-dom'
import { MESES } from '../components/FormularioGasto'

function ResumenAnual({ gastos }) {
    const navigate = useNavigate()
    const anioActual = new Date().getFullYear()

    const totalesPorMes = MESES.map(({ valor, nombre }) => {
        const total = gastos
            .filter((g) => g.fecha.slice(0, 4) === String(anioActual) && g.fecha.slice(5, 7) === valor)
            .reduce((acumulado, g) => acumulado + Number(g.monto), 0)
        return { nombre, total }
    })

    return (
        <div>
            <header>
                <h1>Gastos por mes — {anioActual}</h1>
                <button className="btn-agregar" onClick={() => navigate('/')}>Volver</button>
            </header>

            <div className="grid-meses">
                {totalesPorMes.map((item) => (
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
