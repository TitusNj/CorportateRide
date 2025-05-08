"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
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
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
} from "@mui/material"
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, FilterList as FilterIcon } from "@mui/icons-material"

function RidesList() {
  const { currentUser } = useAuth()
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filters, setFilters] = useState({
    status: "",
    date: "",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [rideToDelete, setRideToDelete] = useState(null)

  useEffect(() => {
    fetchRides()
  }, [filters])

  const fetchRides = async () => {
    try {
      setLoading(true)

      // Build query params
      const params = new URLSearchParams()
      if (filters.status) params.append("status", filters.status)
      if (filters.date) params.append("date", filters.date)

      const response = await api.get(`/rides?${params.toString()}`)
      setRides(response.data)
      setLoading(false)
    } catch (err) {
      setError("Failed to load rides")
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleDeleteClick = (ride) => {
    setRideToDelete(ride)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!rideToDelete) return

    try {
      await api.delete(`/rides/${rideToDelete.id}`)
      setRides(rides.filter((ride) => ride.id !== rideToDelete.id))
      setDeleteDialogOpen(false)
      setRideToDelete(null)
    } catch (err) {
      setError("Failed to delete ride")
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setRideToDelete(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "primary"
      case "in-progress":
        return "warning"
      case "completed":
        return "success"
      case "cancelled":
        return "error"
      default:
        return "default"
    }
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Rides
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ mr: 1 }}
          >
            Filters
          </Button>
          <Button component={Link} to="/rides/new" variant="contained" startIcon={<AddIcon />}>
            New Ride
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                fullWidth
                label="Status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Date"
                name="date"
                type="date"
                value={filters.date}
                onChange={handleFilterChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Pickup</TableCell>
                <TableCell>Destination</TableCell>
                <TableCell>Passengers</TableCell>
                <TableCell>Scheduled Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rides.length > 0 ? (
                rides.map((ride) => (
                  <TableRow key={ride.id}>
                    <TableCell>{ride.pickup_location}</TableCell>
                    <TableCell>{ride.destination}</TableCell>
                    <TableCell>{ride.passenger_count}</TableCell>
                    <TableCell>{new Date(ride.scheduled_time).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={ride.status} color={getStatusColor(ride.status)} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton component={Link} to={`/rides/${ride.id}`} color="primary" size="small">
                        <EditIcon />
                      </IconButton>
                      {currentUser.role === "admin" && (
                        <IconButton color="error" size="small" onClick={() => handleDeleteClick(ride)}>
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No rides found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this ride? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default RidesList
