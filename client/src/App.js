import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import RidesList from "./pages/RidesList"
import RideForm from "./pages/RideForm"
import VehiclesList from "./pages/VehiclesList"
import BillingList from "./pages/BillingList"
import Layout from "./components/Layout"
import "./App.css"

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="rides" element={<RidesList />} />
            <Route path="rides/new" element={<RideForm />} />
            <Route path="rides/:id" element={<RideForm />} />
            <Route path="vehicles" element={<VehiclesList />} />
            <Route path="billing" element={<BillingList />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
