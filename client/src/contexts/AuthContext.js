"use client"

import { createContext, useState, useContext, useEffect } from "react"
import api from "../services/api"

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token")
    const user = localStorage.getItem("user")

    if (token && user) {
      setCurrentUser(JSON.parse(user))
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    }

    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await api.post("/auth/login", { email, password })

      const { user, access_token } = response.data

      // Save user and token to localStorage
      localStorage.setItem("token", access_token)
      localStorage.setItem("user", JSON.stringify(user))

      // Set authorization header for future requests
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`

      setCurrentUser(user)
      return user
    } catch (err) {
      setError(err.response?.data?.error || "Failed to login")
      throw err
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      const response = await api.post("/auth/register", userData)

      const { user, access_token } = response.data

      // Save user and token to localStorage
      localStorage.setItem("token", access_token)
      localStorage.setItem("user", JSON.stringify(user))

      // Set authorization header for future requests
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`

      setCurrentUser(user)
      return user
    } catch (err) {
      setError(err.response?.data?.error || "Failed to register")
      throw err
    }
  }

  const logout = () => {
    // Remove user and token from localStorage
    localStorage.removeItem("token")
    localStorage.removeItem("user")

    // Remove authorization header
    delete api.defaults.headers.common["Authorization"]

    setCurrentUser(null)
  }

  const value = {
    currentUser,
    login,
    register,
    logout,
    error,
    setError,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
