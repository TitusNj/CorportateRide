"use client"

import { useContext } from "react"
import { Navigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, hasRole, loading } = useContext(AuthContext)

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    // Redirect based on role
    if (hasRole("employee")) {
      return <Navigate to="/employee-dashboard" replace />
    } else if (hasRole("driver")) {
      return <Navigate to="/driver-dashboard" replace />
    } else if (hasRole("admin")) {
      return <Navigate to="/admin-dashboard" replace />
    } else {
      return <Navigate to="/login" replace />
    }
  }

  return children
}

export default PrivateRoute
