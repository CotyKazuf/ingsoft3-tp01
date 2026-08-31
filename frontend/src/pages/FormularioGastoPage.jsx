import { useNavigate } from 'react-router-dom'
import FormularioGasto from '../components/FormularioGasto'

function FormularioGastoPage({ gastoEditando, onGastoGuardado, onCancelarEdicion }) {
    const navigate = useNavigate()

    const handleGuardado = () => {
        onGastoGuardado()
        navigate('/')
    }

    const handleVolver = () => {
        onCancelarEdicion()
        navigate('/')
    }

    return (
        <div className="contenedor-form">
            <div className="card-form">
                <h2>{gastoEditando ? 'Editar gasto' : 'Agregar gasto'}</h2>
                <FormularioGasto
                    gastoEditando={gastoEditando}
                    onGastoGuardado={handleGuardado}
                />
                <button className="btn-volver" onClick={handleVolver}>Volver</button>
            </div>
        </div>
    )
}

export default FormularioGastoPage