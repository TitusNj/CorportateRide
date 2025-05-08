"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
} from "@mui/material"
import {
  Add as AddIcon,
  DirectionsCar as CarIcon,
  Receipt as ReceiptIcon,
  LocalTaxi as TaxiIcon,
} from "@mui/icons-material"

function Dashboard() {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRides: 0,
    upcomingRides: 0,
    completedRides: 0,
    vehicles: 0,
    drivers: 0,
  })
  const [recentRides, setRecentRides] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)

        // Fetch rides
        const ridesResponse = await api.get("/rides")
        const rides = ridesResponse.data

        // Calculate stats
        const upcoming = rides.filter((ride) => ride.status === "scheduled").length
        const completed = rides.filter((ride) => ride.status === "completed").length

        // Get recent rides (last 5)
        const recent = rides.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

        let vehiclesCount = 0
        let driversCount = 0

        // Only fetch vehicles and drivers if user is admin
        if (currentUser.role === "admin") {
          const vehiclesResponse = await api.get("/vehicles")
          vehiclesCount = vehiclesResponse.data.length

          const driversResponse = await api.get("/drivers")
          driversCount = driversResponse.data.length
        }

        setStats({
          totalRides: rides.length,
          upcomingRides: upcoming,
          completedRides: completed,
          vehicles: vehiclesCount,
          drivers: driversCount,
        })

        setRecentRides(recent)
        setLoading(false)
      } catch (err) {
        setError("Failed to load dashboard data")
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [currentUser])

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
          Dashboard
        </Typography>
        <Button component={Link} to="/rides/new" variant="contained" startIcon={<AddIcon />}>
          New Ride
        </Button>
      </Box>

      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: "error.light", color: "error.contrastText" }}>
          <Typography>{error}</Typography>
        </Paper>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              bgcolor: "primary.light",
              color: "primary.contrastText",
            }}
          >
            <TaxiIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h5">{stats.totalRides}</Typography>
            <Typography variant="body1">Total Rides</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              bgcolor: "warning.light",
              color: "warning.contrastText",
            }}
          >
            <TaxiIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h5">{stats.upcomingRides}</Typography>
            <Typography variant="body1">Upcoming Rides</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              bgcolor: "success.light",
              color: "success.contrastText",
            }}
          >
            <TaxiIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h5">{stats.completedRides}</Typography>
            <Typography variant="body1">Completed Rides</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              bgcolor: "info.light",
              color: "info.contrastText",
            }}
          >
            <CarIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h5">{stats.vehicles}</Typography>
            <Typography variant="body1">Vehicles</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Rides
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {recentRides.length > 0 ? (
                <List>
                  {recentRides.map((ride) => (
                    <ListItem key={ride.id} divider>
                      <ListItemText
                        primary={`${ride.pickup_location} → ${ride.destination}`}
                        secondary={`Scheduled: ${new Date(ride.scheduled_time).toLocaleString()}`}
                      />
                      <Chip label={ride.status} color={getStatusColor(ride.status)} size="small" />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No rides found
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button component={Link} to="/rides" size="small">
                View All Rides
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {currentUser.role === "admin" && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      component={Link}
                      to="/rides/new"
                      variant="outlined"
                      fullWidth
                      startIcon={<AddIcon />}
                      sx={{ mb: 2 }}
                    >
                      New Ride
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      component={Link}
                      to="/vehicles"
                      variant="outlined"
                      fullWidth
                      startIcon={<CarIcon />}
                      sx={{ mb: 2 }}
                    >
                      Manage Vehicles
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      component={Link}
                      to="/billing"
                      variant="outlined"
                      fullWidth
                      startIcon={<ReceiptIcon />}
                      sx={{ mb: 2 }}
                    >
                      View Billing
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default Dashboard
