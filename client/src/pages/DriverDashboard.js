"use client"

import { useState, useEffect, useContext } from "react"
import { AuthContext } from "../context/AuthContext"

const DriverDashboard = () => {
  const { user, token } = useContext(AuthContext)
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [assignedVehicles, setAssignedVehicles] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch trips assigned to the driver
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

        // Fetch driver's assigned vehicles
        if (user && user.vehicles) {
          setAssignedVehicles(user.vehicles)
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

  const updateTripStatus = async (tripId, newStatus) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update trip")
      }

      // Update trip in state
      setTrips((prev) => prev.map((trip) => (trip.id === tripId ? { ...trip, status: newStatus } : trip)))
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
      <h1>Driver Dashboard</h1>
      <p>
        Welcome, {user.first_name} {user.last_name}!
      </p>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-section">
        <h2>Your Assigned Vehicles</h2>
        {assignedVehicles.length === 0 ? (
          <p>No vehicles assigned to you yet.</p>
        ) : (
          <div className="vehicles-grid">
            {assignedVehicles.map((vehicle) => (
              <div key={vehicle.id} className="vehicle-card">
                <h3>{vehicle.model}</h3>
                <p>
                  <strong>Type:</strong> {vehicle.capacity_type}
                </p>
                <p>
                  <strong>Capacity:</strong> {vehicle.capacity} passengers
                </p>
                <p>
                  <strong>Registration:</strong> {vehicle.registration_number}
                </p>
                <p className={`vehicle-status status-${vehicle.status}`}>
                  <strong>Status:</strong> {vehicle.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>Your Assigned Trips</h2>
        {trips.length === 0 ? (
          <p>No trips assigned to you yet.</p>
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
                    <strong>Passenger:</strong> {trip.passenger.first_name} {trip.passenger.last_name}
                  </p>
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
                  {trip.notes && (
                    <p>
                      <strong>Notes:</strong> {trip.notes}
                    </p>
                  )}
                </div>

                <div className="trip-actions">
                  {trip.status === "pending" && (
                    <button className="action-button" onClick={() => updateTripStatus(trip.id, "in_progress")}>
                      Start Trip
                    </button>
                  )}
                  {trip.status === "in_progress" && (
                    <button className="action-button" onClick={() => updateTripStatus(trip.id, "completed")}>
                      Complete Trip
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

export default DriverDashboard
