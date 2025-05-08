"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material"
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Person as PersonIcon } from "@mui/icons-material"

function VehiclesList() {
  const { currentUser } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Dialog states
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [driverDialogOpen, setDriverDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [selectedDriver, setSelectedDriver] = useState("")

  // Form state
  const [vehicleForm, setVehicleForm] = useState({
    type: "",
    license_plate: "",
    capacity: 4,
    status: "available",
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    fetchVehicles()
    if (currentUser.role === "admin") {
      fetchDrivers()
    }
  }, [currentUser.role])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const response = await api.get("/vehicles")
      setVehicles(response.data)
      setLoading(false)
    } catch (err) {
      setError("Failed to load vehicles")
      setLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const response = await api.get("/drivers")
      setDrivers(response.data)
    } catch (err) {
      setError("Failed to load drivers")
    }
  }

  const handleVehicleDialogOpen = (vehicle = null) => {
    if (vehicle) {
      setVehicleForm({
        type: vehicle.type,
        license_plate: vehicle.license_plate,
        capacity: vehicle.capacity,
        status: vehicle.status,
      })
      setSelectedVehicle(vehicle)
    } else {
      setVehicleForm({
        type: "",
        license_plate: "",
        capacity: 4,
        status: "available",
      })
      setSelectedVehicle(null)
    }
    setFormErrors({})
    setVehicleDialogOpen(true)
  }

  const handleVehicleDialogClose = () => {
    setVehicleDialogOpen(false)
  }

  const handleDeleteDialogOpen = (vehicle) => {
    setSelectedVehicle(vehicle)
    setDeleteDialogOpen(true)
  }

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false)
    setSelectedVehicle(null)
  }

  const handleDriverDialogOpen = (vehicle) => {
    setSelectedVehicle(vehicle)
    setSelectedDriver("")
    setDriverDialogOpen(true)
  }

  const handleDriverDialogClose = () => {
    setDriverDialogOpen(false)
    setSelectedVehicle(null)
    setSelectedDriver("")
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setVehicleForm((prev) => ({
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

  const validateVehicleForm = () => {
    const errors = {}

    if (!vehicleForm.type) {
      errors.type = "Type is required"
    }

    if (!vehicleForm.license_plate) {
      errors.license_plate = "License plate is required"
    }

    if (!vehicleForm.capacity || vehicleForm.capacity < 1) {
      errors.capacity = "Capacity must be at least 1"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleVehicleSubmit = async () => {
    if (!validateVehicleForm()) {
      return
    }

    try {
      const apiData = {
        ...vehicleForm,
        capacity: Number.parseInt(vehicleForm.capacity),
      }

      if (selectedVehicle) {
        await api.put(`/vehicles/${selectedVehicle.id}`, apiData)
      } else {
        await api.post("/vehicles", apiData)
      }

      fetchVehicles()
      handleVehicleDialogClose()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save vehicle")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedVehicle) return

    try {
      await api.delete(`/vehicles/${selectedVehicle.id}`)
      setVehicles(vehicles.filter((v) => v.id !== selectedVehicle.id))
      handleDeleteDialogClose()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete vehicle")
      handleDeleteDialogClose()
    }
  }

  const handleDriverAssign = async () => {
    if (!selectedVehicle || !selectedDriver) return

    try {
      await api.post(`/vehicles/${selectedVehicle.id}/drivers`, {
        driver_id: selectedDriver,
      })
      fetchVehicles()
      handleDriverDialogClose()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to assign driver")
      handleDriverDialogClose()
    }
  }

  const handleDriverRemove = async (vehicleId, driverId) => {
    try {
      await api.delete(`/vehicles/${vehicleId}/drivers/${driverId}`)
      fetchVehicles()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to remove driver")
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "success"
      case "in-use":
        return "warning"
      case "maintenance":
        return "error"
      default:
        return "default"
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Vehicles
        </Typography>
        {currentUser.role === "admin" && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleVehicleDialogOpen()}>
            Add Vehicle
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>License Plate</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Assigned Drivers</TableCell>
              {currentUser.role === "admin" && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.length > 0 ? (
              vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>{vehicle.type}</TableCell>
                  <TableCell>{vehicle.license_plate}</TableCell>
                  <TableCell>{vehicle.capacity}</TableCell>
                  <TableCell>
                    <Chip label={vehicle.status} color={getStatusColor(vehicle.status)} size="small" />
                  </TableCell>
                  <TableCell>
                    {vehicle.drivers && vehicle.drivers.length > 0 ? (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {vehicle.drivers.map((driverId) => {
                          const driver = drivers.find((d) => d.id === driverId)
                          return (
                            <Chip
                              key={driverId}
                              label={driver ? driver.name : `Driver #${driverId}`}
                              size="small"
                              onDelete={
                                currentUser.role === "admin"
                                  ? () => handleDriverRemove(vehicle.id, driverId)
                                  : undefined
                              }
                            />
                          )
                        })}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No drivers assigned
                      </Typography>
                    )}
                  </TableCell>
                  {currentUser.role === "admin" && (
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleDriverDialogOpen(vehicle)}
                        sx={{ mr: 1 }}
                      >
                        <PersonIcon />
                      </IconButton>
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleVehicleDialogOpen(vehicle)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" size="small" onClick={() => handleDeleteDialogOpen(vehicle)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={currentUser.role === "admin" ? 6 : 5} align="center">
                  No vehicles found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Vehicle Form Dialog */}
      <Dialog open={vehicleDialogOpen} onClose={handleVehicleDialogClose}>
        <DialogTitle>{selectedVehicle ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Type"
                name="type"
                value={vehicleForm.type}
                onChange={handleFormChange}
                error={!!formErrors.type}
                helperText={formErrors.type}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="License Plate"
                name="license_plate"
                value={vehicleForm.license_plate}
                onChange={handleFormChange}
                error={!!formErrors.license_plate}
                helperText={formErrors.license_plate}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Capacity"
                name="capacity"
                type="number"
                InputProps={{ inputProps: { min: 1 } }}
                value={vehicleForm.capacity}
                onChange={handleFormChange}
                error={!!formErrors.capacity}
                helperText={formErrors.capacity}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select name="status" value={vehicleForm.status} onChange={handleFormChange} label="Status">
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="in-use">In Use</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleVehicleDialogClose}>Cancel</Button>
          <Button onClick={handleVehicleSubmit} variant="contained">
            {selectedVehicle ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this vehicle? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={driverDialogOpen} onClose={handleDriverDialogClose}>
        <DialogTitle>Assign Driver</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Driver</InputLabel>
            <Select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)} label="Driver">
              <MenuItem value="">
                <em>Select a driver</em>
              </MenuItem>
              {drivers.map((driver) => (
                <MenuItem key={driver.id} value={driver.id}>
                  {driver.name}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Select a driver to assign to this vehicle</FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDriverDialogClose}>Cancel</Button>
          <Button onClick={handleDriverAssign} variant="contained" disabled={!selectedDriver}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default VehiclesList
