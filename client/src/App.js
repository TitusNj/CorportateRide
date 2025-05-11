import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import PrivateRoute from "./components/PrivateRoute"
import Login from "./pages/Login"
import EmployeeDashboard from "./pages/EmployeeDashboard"
import DriverDashboard from "./pages/DriverDashboard"
import AdminDashboard from "./pages/AdminDashboard"
import CompanyRegister from "./pages/CompanyRegister"
import Navbar from "./components/Navbar"
import "./styling.css"

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/company-register" element={<CompanyRegister />} />
              <Route
                path="/employee-dashboard"
                element={
                  <PrivateRoute allowedRoles={["employee", "admin"]}>
                    <EmployeeDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/driver-dashboard"
                element={
                  <PrivateRoute allowedRoles={["driver"]}>
                    <DriverDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin-dashboard/*"
                element={
                  <PrivateRoute allowedRoles={["admin"]}>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
