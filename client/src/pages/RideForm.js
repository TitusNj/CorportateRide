"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from "@mui/material"

function RideForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const isEditMode = !!id

  const [formData, setFormData] = useState({
    pickup_location: "",
    destination: "",
    passenger_count: 1,
    scheduled_time: "",
    vehicle_id: "",
    driver_id: "",
    status: "scheduled",
  })

  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch vehicles
        const vehiclesResponse = await api.get("/vehicles")
        setVehicles(vehiclesResponse.data)

        // Fetch drivers if user is admin
        if (currentUser.role === "admin") {
          const driversResponse = await api.get("/drivers")
          setDrivers(driversResponse.data)
        }

        // If edit mode, fetch ride data
        if (isEditMode) {
          const rideResponse = await api.get(`/rides/${id}`)
          const ride = rideResponse.data

          // Format scheduled_time for the datetime-local input
          const scheduledTime = new Date(ride.scheduled_time)
          const formattedTime = scheduledTime.toISOString().slice(0, 16)

          setFormData({
            pickup_location: ride.pickup_location,
            destination: ride.destination,
            passenger_count: ride.passenger_count,
            scheduled_time: formattedTime,
            vehicle_id: ride.vehicle_id,
            driver_id: ride.driver_id || "",
            status: ride.status,
          })
        }

        setLoading(false)
      } catch (err) {
        setError("Failed to load data")
        setLoading(false)
      }
    }

    fetchData()
  }, [id, isEditMode, currentUser.role])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear validation error when field is changed
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.pickup_location) {
      errors.pickup_location = "Pickup location is required"
    }

    if (!formData.destination) {
      errors.destination = "Destination is required"
    }

    if (!formData.passenger_count || formData.passenger_count < 1) {
      errors.passenger_count = "Passenger count must be at least 1"
    }

    if (!formData.scheduled_time) {
      errors.scheduled_time = "Scheduled time is required"
    }

    if (!formData.vehicle_id) {
      errors.vehicle_id = "Vehicle is required"
    }

    // Check if selected vehicle has enough capacity
    const selectedVehicle = vehicles.find((v) => v.id === Number.parseInt(formData.vehicle_id))
    if (selectedVehicle && formData.passenger_count > selectedVehicle.capacity) {
      errors.passenger_count = `Passenger count exceeds vehicle capacity of ${selectedVehicle.capacity}`
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      // Format data for API
      const apiData = {
        ...formData,
        passenger_count: Number.parseInt(formData.passenger_count),
        vehicle_id: Number.parseInt(formData.vehicle_id),
        driver_id: formData.driver_id ? Number.parseInt(formData.driver_id) : null,
      }

      if (isEditMode) {
        await api.put(`/rides/${id}`, apiData)
      } else {
        await api.post("/rides", apiData)
      }

      navigate("/rides")
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save ride")
      setLoading(false)
    }
  }

  if (loading && !formData.pickup_location) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditMode ? "Edit Ride" : "New Ride"}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pickup Location"
                name="pickup_location"
                value={formData.pickup_location}
                onChange={handleChange}
                error={!!formErrors.pickup_location}
                helperText={formErrors.pickup_location}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Destination"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                error={!!formErrors.destination}
                helperText={formErrors.destination}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Passenger Count"
                name="passenger_count"
                type="number"
                InputProps={{ inputProps: { min: 1 } }}
                value={formData.passenger_count}
                onChange={handleChange}
                error={!!formErrors.passenger_count}
                helperText={formErrors.passenger_count}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Scheduled Time"
                name="scheduled_time"
                type="datetime-local"
                value={formData.scheduled_time}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
                error={!!formErrors.scheduled_time}
                helperText={formErrors.scheduled_time}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.vehicle_id} required>
                <InputLabel>Vehicle</InputLabel>
                <Select name="vehicle_id" value={formData.vehicle_id} onChange={handleChange} label="Vehicle">
                  <MenuItem value="">
                    <em>Select a vehicle</em>
                  </MenuItem>
                  {vehicles.map((vehicle) => (
                    <MenuItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.type} - {vehicle.license_plate} (Capacity: {vehicle.capacity})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.vehicle_id && <FormHelperText>{formErrors.vehicle_id}</FormHelperText>}
              </FormControl>
            </Grid>
            {currentUser.role === "admin" && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Driver</InputLabel>
                  <Select name="driver_id" value={formData.driver_id} onChange={handleChange} label="Driver">
                    <MenuItem value="">
                      <em>Assign later</em>
                    </MenuItem>
                    {drivers.map((driver) => (
                      <MenuItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {isEditMode && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select name="status" value={formData.status} onChange={handleChange} label="Status">
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="in-progress">In Progress</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button variant="outlined" onClick={() => navigate("/rides")} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? "Saving..." : isEditMode ? "Update" : "Create"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  )
}

export default RideForm
