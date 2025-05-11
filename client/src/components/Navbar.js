"use client"

import { useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  if (!isAuthenticated()) {
    return (
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/">Cabrix</Link>
        </div>
        <div className="navbar-menu">
          <Link to="/login" className="navbar-item">
            Login
          </Link>
          <Link to="/company-register" className="navbar-item">
            Register Company
          </Link>
        </div>
      </nav>
    )
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Cabrix</Link>
      </div>
      <div className="navbar-menu">
        {user && user.role === "employee" && (
          <Link to="/employee-dashboard" className="navbar-item">
            Dashboard
          </Link>
        )}
        {user && user.role === "driver" && (
          <Link to="/driver-dashboard" className="navbar-item">
            Dashboard
          </Link>
        )}
        {user && user.role === "admin" && (
          <Link to="/admin-dashboard" className="navbar-item">
            Dashboard
          </Link>
        )}
        <div className="navbar-user">
          <span className="user-name">{user && `${user.first_name} ${user.last_name}`}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
