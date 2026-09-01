import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Principal from './pages/Principal'
import FormularioGastoPage from './pages/FormularioGastoPage'
import ResumenAnual from './pages/ResumenAnual'
import './App.css'

function App() {
  const [gastos, setGastos] = useState([])
  const [gastoEditando, setGastoEditando] = useState(null)
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [mesFiltro, setMesFiltro] = useState('')

  const cargarGastos = () => {
    fetch('/api/gastos')
      .then((res) => res.json())
      .then((data) => setGastos(data))
      .catch((err) => console.error('Error al pedir gastos:', err))
  }

  const eliminarGasto = (id) => {
    fetch(`/api/gastos/${id}`, { method: 'DELETE' })
      .then((res) => {
        if (res.ok) {
          cargarGastos()
          return
        }
        return res.json().then((data) => {
          throw new Error(data.error || 'No se pudo eliminar el gasto')
        })
      })
      .catch((err) => {
        console.error('Error al eliminar gasto:', err)
        alert(err.message)
      })
  }

  const guardarGasto = () => {
    setGastoEditando(null)
    cargarGastos()
  }

  useEffect(() => {
    cargarGastos()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Principal
              gastos={gastos}
              categoriaFiltro={categoriaFiltro}
              setCategoriaFiltro={setCategoriaFiltro}
              mesFiltro={mesFiltro}
              setMesFiltro={setMesFiltro}
              setGastoEditando={setGastoEditando}
              eliminarGasto={eliminarGasto}
            />
          }
        />
        <Route
          path="/agregar"
          element={
            <FormularioGastoPage
              gastoEditando={gastoEditando}
              onGastoGuardado={guardarGasto}
              onCancelarEdicion={() => setGastoEditando(null)}
            />
          }
        />
        <Route path="/resumen" element={<ResumenAnual gastos={gastos} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App