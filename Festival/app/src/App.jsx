import { Navigate, Route, Routes } from 'react-router-dom'
import Register from './pages/Register'
import StaffLogin from './pages/StaffLogin'
import StaffPanel from './pages/StaffPanel'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/staff/login" element={<StaffLogin />} />
      <Route path="/staff" element={<StaffPanel />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
