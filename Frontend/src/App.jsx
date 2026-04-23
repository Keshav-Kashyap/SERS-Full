import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Demo from './pages/Demo'
import Landing from './pages/Landing'
import MapPage from './pages/MapPage'

function App() {
  const location = useLocation()
  const hideNavbar = location.pathname === '/demo'

  return (
    <div className="min-h-screen bg-transparent">
      {!hideNavbar && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
