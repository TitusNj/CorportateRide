"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"

const CompanyRegister = () => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact_email: "",
    contact_phone: "",
    admin_username: "",
    admin_email: "",
    admin_password: "",
    admin_confirm_password: "",
    admin_first_name: "",
    admin_last_name: "",
    admin_phone: "",
  })

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (formData.admin_password !== formData.admin_confirm_password) {
      setError("Passwords do not match")
      return false
    }

    if (formData.admin_password.length < 8) {
      setError("Password must be at least 8 characters long")
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!validateForm()) {
      return
    }

    setLoading(true)

    // Remove confirm password from data sent to server
    const { admin_confirm_password, ...dataToSend } = formData

    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      setSuccess("Company registered successfully! You can now login with your admin credentials.")

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate("/login")
      }, 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card company-register">
        <h2>Register Your Company</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <h3>Company Information</h3>
          <div className="form-group">
            <label htmlFor="name">Company Name</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="address">Company Address</label>
            <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="contact_email">Contact Email</label>
            <input
              type="email"
              id="contact_email"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact_phone">Contact Phone</label>
            <input
              type="tel"
              id="contact_phone"
              name="contact_phone"
              value={formData.contact_phone}
              onChange={handleChange}
              required
            />
          </div>

          <h3>Admin Account</h3>
          <div className="form-group">
            <label htmlFor="admin_username">Username</label>
            <input
              type="text"
              id="admin_username"
              name="admin_username"
              value={formData.admin_username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin_email">Email</label>
            <input
              type="email"
              id="admin_email"
              name="admin_email"
              value={formData.admin_email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin_first_name">First Name</label>
            <input
              type="text"
              id="admin_first_name"
              name="admin_first_name"
              value={formData.admin_first_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin_last_name">Last Name</label>
            <input
              type="text"
              id="admin_last_name"
              name="admin_last_name"
              value={formData.admin_last_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin_phone">Phone (Optional)</label>
            <input
              type="tel"
              id="admin_phone"
              name="admin_phone"
              value={formData.admin_phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin_password">Password</label>
            <input
              type="password"
              id="admin_password"
              name="admin_password"
              value={formData.admin_password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin_confirm_password">Confirm Password</label>
            <input
              type="password"
              id="admin_confirm_password"
              name="admin_confirm_password"
              value={formData.admin_confirm_password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Registering..." : "Register Company"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <a href="/login">Login</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default CompanyRegister
