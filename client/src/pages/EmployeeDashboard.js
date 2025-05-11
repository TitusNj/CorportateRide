"use client"

import { useState, useEffect, useContext } from "react"
import { AuthContext } from "../context/AuthContext"

const EmployeeDashboard = () => {
  const { user, token } = useContext(AuthContext)
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showNewTripForm, setShowNewTripForm] = useState(false)
  const [tripFormData, setTripFormData] = useState({
    pickup_location: "",
    dropoff_location: "",
    pickup_time: "",
    notes: "",
    company_id: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch trips
        const tripsResponse = await fetch("/api/trips", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!tripsResponse.ok) {
          const errorData = await tripsResponse.json()
          throw new Error(errorData.error || "Failed to fetch trips")
        }

        const tripsData = await tripsResponse.json()
        setTrips(tripsData)

        // Set company ID for new trip form if user has companies
        if (user && user.companies && user.companies.length > 0) {
          setTripFormData((prev) => ({
            ...prev,
            company_id: user.companies[0].id,
          }))
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token, user])

  const handleTripFormChange = (e) => {
    const { name, value } = e.target
    setTripFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTripSubmit = async (e) => {
    e.preventDefault()
    setError("")

    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(tripFormData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create trip")
      }

      // Add new trip to state
      setTrips((prev) => [data.trip, ...prev])

      // Reset form and hide it
      setTripFormData({
        pickup_location: "",
        dropoff_location: "",
        pickup_time: "",
        notes: "",
        company_id: user.companies && user.companies.length > 0 ? user.companies[0].id : "",
      })
      setShowNewTripForm(false)
    } catch (err) {
      setError(err.message)
    }
  }

  const cancelTrip = async (tripId) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "cancelled" }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel trip")
      }

      // Update trip in state
      setTrips((prev) => prev.map((trip) => (trip.id === tripId ? { ...trip, status: "cancelled" } : trip)))
    } catch (err) {
      setError(err.message)
    }
  }

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr)
    return date.toLocaleString()
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="dashboard-container">
      <h1>Employee Dashboard</h1>
      <p>
        Welcome, {user.first_name} {user.last_name}!
      </p>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-actions">
        <button className="action-button" onClick={() => setShowNewTripForm(!showNewTripForm)}>
          {showNewTripForm ? "Cancel" : "Request New Trip"}
        </button>
      </div>

      {showNewTripForm && (
        <div className="form-container">
          <h2>Request New Trip</h2>
          <form onSubmit={handleTripSubmit} className="trip-form">
            <div className="form-group">
              <label htmlFor="pickup_location">Pickup Location</label>
              <input
                type="text"
                id="pickup_location"
                name="pickup_location"
                value={tripFormData.pickup_location}
                onChange={handleTripFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dropoff_location">Dropoff Location</label>
              <input
                type="text"
                id="dropoff_location"
                name="dropoff_location"
                value={tripFormData.dropoff_location}
                onChange={handleTripFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="pickup_time">Pickup Time</label>
              <input
                type="datetime-local"
                id="pickup_time"
                name="pickup_time"
                value={tripFormData.pickup_time}
                onChange={handleTripFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <textarea id="notes" name="notes" value={tripFormData.notes} onChange={handleTripFormChange} rows="3" />
            </div>

            <button type="submit" className="submit-button">
              Submit Trip Request
            </button>
          </form>
        </div>
      )}

      <div className="dashboard-section">
        <h2>Your Trips</h2>
        {trips.length === 0 ? (
          <p>No trips found. Request a new trip to get started.</p>
        ) : (
          <div className="trips-list">
            {trips.map((trip) => (
              <div key={trip.id} className={`trip-card status-${trip.status}`}>
                <div className="trip-header">
                  <h3>Trip #{trip.id}</h3>
                  <span className={`trip-status status-${trip.status}`}>
                    {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                  </span>
                </div>

                <div className="trip-details">
                  <p>
                    <strong>Pickup:</strong> {trip.pickup_location}
                  </p>
                  <p>
                    <strong>Dropoff:</strong> {trip.dropoff_location}
                  </p>
                  <p>
                    <strong>Pickup Time:</strong> {formatDateTime(trip.pickup_time)}
                  </p>
                  {trip.vehicle && (
                    <p>
                      <strong>Vehicle:</strong> {trip.vehicle.model} ({trip.vehicle.registration_number})
                    </p>
                  )}
                  {trip.driver && (
                    <p>
                      <strong>Driver:</strong> {trip.driver.first_name} {trip.driver.last_name}
                    </p>
                  )}
                  {trip.notes && (
                    <p>
                      <strong>Notes:</strong> {trip.notes}
                    </p>
                  )}
                </div>

                <div className="trip-actions">
                  {trip.status === "pending" && (
                    <button className="cancel-button" onClick={() => cancelTrip(trip.id)}>
                      Cancel Trip
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeDashboard
