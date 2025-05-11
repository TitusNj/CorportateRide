"use client"

import { useState, useEffect, useContext } from "react"
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"

// Admin Dashboard Components
const TripsManagement = ({ token }) => {
  const [trips, setTrips] = useState([])
  const [filteredTrips, setFilteredTrips] = useState([])
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [assignmentData, setAssignmentData] = useState({
    driver_id: "",
    vehicle_id: "",
  })
  const [filters, setFilters] = useState({
    status: "all",
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all trips
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
        setFilteredTrips(sortTrips(tripsData))

        // Fetch all drivers
        const usersResponse = await fetch("/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!usersResponse.ok) {
          throw new Error("Failed to fetch users")
        }

        const usersData = await usersResponse.json()
        setDrivers(usersData.filter((user) => user.role === "driver"))

        // Fetch all vehicles
        const vehiclesResponse = await fetch("/api/vehicles", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!vehiclesResponse.ok) {
          throw new Error("Failed to fetch vehicles")
        }

        const vehiclesData = await vehiclesResponse.json()
        setVehicles(vehiclesData)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  // Sort trips: unassigned pending trips first, then by creation date (newest first)
  const sortTrips = (tripsToSort) => {
    return [...tripsToSort].sort((a, b) => {
      // First priority: unassigned pending trips
      if (a.status === "pending" && !a.driver && b.status !== "pending") return -1
      if (b.status === "pending" && !b.driver && a.status !== "pending") return 1
      if (a.status === "pending" && !a.driver && b.status === "pending" && !b.driver) {
        // Both are unassigned pending trips, sort by creation date (newest first)
        return new Date(b.created_at) - new Date(a.created_at)
      }

      // Second priority: status (pending > in_progress > completed > cancelled)
      const statusOrder = { pending: 0, in_progress: 1, completed: 2, cancelled: 3 }
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status]
      }

      // Third priority: creation date (newest first)
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }

  // Apply filters to trips
  useEffect(() => {
    let result = [...trips]

    // Filter by status
    if (filters.status !== "all") {
      result = result.filter((trip) => trip.status === filters.status)
    }

    // Filter by search term (trip ID, passenger name, pickup or dropoff location)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      result = result.filter(
        (trip) =>
          trip.id.toString().includes(searchLower) ||
          (trip.passenger &&
            `${trip.passenger.first_name} ${trip.passenger.last_name}`.toLowerCase().includes(searchLower)) ||
          trip.pickup_location.toLowerCase().includes(searchLower) ||
          trip.dropoff_location.toLowerCase().includes(searchLower),
      )
    }

    // Filter by date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      result = result.filter((trip) => new Date(trip.created_at) >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      result = result.filter((trip) => new Date(trip.created_at) <= toDate)
    }

    // Sort the filtered results
    setFilteredTrips(sortTrips(result))
  }, [trips, filters])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetFilters = () => {
    setFilters({
      status: "all",
      searchTerm: "",
      dateFrom: "",
      dateTo: "",
    })
  }

  const handleAssignmentChange = (e) => {
    const { name, value } = e.target
    setAssignmentData((prev) => ({ ...prev, [name]: value }))
  }

  const assignDriverAndVehicle = async (e) => {
    e.preventDefault()

    if (!selectedTrip) return

    try {
      const response = await fetch(`/api/trips/${selectedTrip.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assignmentData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign driver and vehicle")
      }

      // Update trip in state
      setTrips((prev) => prev.map((trip) => (trip.id === selectedTrip.id ? data.trip : trip)))

      // Reset form
      setSelectedTrip(null)
      setAssignmentData({
        driver_id: "",
        vehicle_id: "",
      })
    } catch (err) {
      setError(err.message)
    }
  }

  const deleteTrip = async (tripId) => {
    if (!window.confirm("Are you sure you want to delete this trip?")) {
      return
    }

    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete trip")
      }

      // Remove trip from state
      setTrips((prev) => prev.filter((trip) => trip.id !== tripId))
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
    <div className="admin-section">
      <h2>Trips Management</h2>

      {error && <div className="error-message">{error}</div>}

      {/* Filter section */}
      <div className="filter-container">
        <div className="filter-group">
          <label htmlFor="status">Status:</label>
          <select id="status" name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="searchTerm">Search:</label>
          <input
            type="text"
            id="searchTerm"
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleFilterChange}
            placeholder="Trip ID, passenger, location..."
          />
        </div>

        <div className="filter-group">
          <label htmlFor="dateFrom">From:</label>
          <input type="date" id="dateFrom" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} />
        </div>

        <div className="filter-group">
          <label htmlFor="dateTo">To:</label>
          <input type="date" id="dateTo" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} />
        </div>

        <button className="action-button small" onClick={resetFilters}>
          Reset Filters
        </button>
      </div>

      {selectedTrip && (
        <div className="form-container">
          <h3>Assign Driver and Vehicle to Trip #{selectedTrip.id}</h3>
          <form onSubmit={assignDriverAndVehicle} className="assignment-form">
            <div className="form-group">
              <label htmlFor="driver_id">Driver</label>
              <select
                id="driver_id"
                name="driver_id"
                value={assignmentData.driver_id}
                onChange={handleAssignmentChange}
                required
              >
                <option value="">Select a driver</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.first_name} {driver.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="vehicle_id">Vehicle</label>
              <select
                id="vehicle_id"
                name="vehicle_id"
                value={assignmentData.vehicle_id}
                onChange={handleAssignmentChange}
                required
              >
                <option value="">Select a vehicle</option>
                {vehicles
                  .filter((v) => v.status === "available")
                  .map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.model} ({vehicle.registration_number})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-button">
                Assign
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setSelectedTrip(null)
                  setAssignmentData({
                    driver_id: "",
                    vehicle_id: "",
                  })
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="trips-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Passenger</th>
              <th>Pickup</th>
              <th>Dropoff</th>
              <th>Pickup Time</th>
              <th>Status</th>
              <th>Driver</th>
              <th>Vehicle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrips.map((trip) => (
              <tr key={trip.id} className={`status-${trip.status}`}>
                <td>{trip.id}</td>
                <td>
                  {trip.passenger.first_name} {trip.passenger.last_name}
                </td>
                <td>{trip.pickup_location}</td>
                <td>{trip.dropoff_location}</td>
                <td>{formatDateTime(trip.pickup_time)}</td>
                <td>
                  <span className={`status-badge status-${trip.status}`}>{trip.status}</span>
                </td>
                <td>{trip.driver ? `${trip.driver.first_name} ${trip.driver.last_name}` : "Not assigned"}</td>
                <td>{trip.vehicle ? `${trip.vehicle.model} (${trip.vehicle.registration_number})` : "Not assigned"}</td>
                <td>
                  <div className="table-actions">
                    {trip.status === "pending" && !trip.driver && (
                      <button className="action-button small" onClick={() => setSelectedTrip(trip)}>
                        Assign
                      </button>
                    )}
                    <button className="delete-button small" onClick={() => deleteTrip(trip.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Other admin components remain the same...
const UsersManagement = ({ token }) => {
  // Existing code...
}

const VehiclesManagement = ({ token }) => {
  // Existing code...
}

const ReportsManagement = ({ token }) => {
  // Existing code...
}

const AdminDashboard = () => {
  const { user, token } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()

  // Check if user is a Cabrix admin
  useEffect(() => {
    if (user && !user.email.includes("@cabrix.co.ke")) {
      navigate("/employee-dashboard", { replace: true })
    }
  }, [user, navigate])

  // Redirect to trips management by default
  useEffect(() => {
    if (location.pathname === "/admin-dashboard") {
      navigate("/admin-dashboard/trips")
    }
  }, [location, navigate])

  // Rest of the component remains the same
  return (
    <div className="dashboard-container admin-dashboard">
      <h1>Admin Dashboard</h1>
      <p>
        Welcome, {user.first_name} {user.last_name}!
      </p>

      <div className="admin-nav">
        <Link to="/admin-dashboard/trips" className={location.pathname === "/admin-dashboard/trips" ? "active" : ""}>
          Trips Management
        </Link>
        <Link to="/admin-dashboard/users" className={location.pathname === "/admin-dashboard/users" ? "active" : ""}>
          Users Management
        </Link>
        <Link
          to="/admin-dashboard/vehicles"
          className={location.pathname === "/admin-dashboard/vehicles" ? "active" : ""}
        >
          Vehicles Management
        </Link>
        <Link
          to="/admin-dashboard/reports"
          className={location.pathname === "/admin-dashboard/reports" ? "active" : ""}
        >
          Reports & Billing
        </Link>
      </div>

      <div className="admin-content">
        <Routes>
          <Route path="trips" element={<TripsManagement token={token} />} />
          <Route path="users" element={<UsersManagement token={token} />} />
          <Route path="vehicles" element={<VehiclesManagement token={token} />} />
          <Route path="reports" element={<ReportsManagement token={token} />} />
        </Routes>
      </div>
    </div>
  )
}

export default AdminDashboard
