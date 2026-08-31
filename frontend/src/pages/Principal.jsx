import { useNavigate } from 'react-router-dom'
import { CATEGORIAS, CATEGORIA_SLUG, MESES } from '../components/FormularioGasto'

function Principal({ gastos, categoriaFiltro, setCategoriaFiltro, mesFiltro, setMesFiltro, setGastoEditando, eliminarGasto }) {
    const navigate = useNavigate()
    const anioActual = new Date().getFullYear()

    const total = gastos.reduce((acumulado, g) => acumulado + Number(g.monto), 0)

    const totalPorCategoria = CATEGORIAS.map((cat) => ({
        categoria: cat,
        total: gastos
            .filter((g) => g.categoria === cat)
            .reduce((acumulado, g) => acumulado + Number(g.monto), 0),
    })).filter((item) => item.total > 0)

    const gastosFiltrados = gastos.filter((g) => {
        const coincideCategoria = !categoriaFiltro || g.categoria === categoriaFiltro
        const coincideMes = !mesFiltro || g.fecha.slice(5, 7) === mesFiltro
        return coincideCategoria && coincideMes
    })

    const irAAgregar = () => {
        setGastoEditando(null)
        navigate('/agregar')
    }

    const irAEditar = (gasto) => {
        setGastoEditando(gasto)
        navigate('/agregar')
    }

    const formatearFecha = (fecha) => {
        const [anio, mes, dia] = fecha.split('-')
        return `${dia}/${mes}/${anio}`
    }

    return (
        <div>
            <header>
                <h1>Mis Gastos {anioActual}</h1>
                <div className="acciones-header">
                    <button className="btn-agregar" onClick={() => navigate('/resumen')}>Ver por mes</button>
                    <button className="btn-agregar" onClick={irAAgregar}>Agregar gasto</button>
                </div>
            </header>

            <div className="fila-totales">
                <div className="tarjeta-total">
                    <small>Total gastado</small>
                    <div className="monto">${total}</div>
                </div>
                <div className="grid-categorias">
                    {totalPorCategoria.map((item) => (
                        <div key={item.categoria} className={`tarjeta-cat cat-${CATEGORIA_SLUG[item.categoria]}`}>
                            <small>{item.categoria}</small>
                            <div className="monto">${item.total}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="filtro">
                <label>
                    Filtrar por categoría:{' '}
                    <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
                        <option value="">Todas</option>
                        {CATEGORIAS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </label>
                <label>
                    Filtrar por mes:{' '}
                    <select value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)}>
                        <option value="">Todos</option>
                        {MESES.map((m) => (
                            <option key={m.valor} value={m.valor}>{m.nombre}</option>
                        ))}
                    </select>
                </label>
            </div>

            <ul className="lista">
                {gastosFiltrados.map((g) => (
                    <li key={g.id} className={`fila-gasto b-${CATEGORIA_SLUG[g.categoria]}`}>
                        <div className="info-gasto">
                            <span className={`chip-categoria chip-${CATEGORIA_SLUG[g.categoria]}`}>{g.categoria}</span>
                            <div>
                                <div className="desc">{g.descripcion}</div>
                                <div className="medio">{g.medio_pago} &middot; {formatearFecha(g.fecha)}</div>
                            </div>
                        </div>
                        <div>
                            <span className="monto-fila">${g.monto}</span>
                            <span className="acciones">
                                <button className="btn-editar" onClick={() => irAEditar(g)}>Editar</button>
                                <button className="btn-eliminar" onClick={() => eliminarGasto(g.id)}>Eliminar</button>
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default Principal