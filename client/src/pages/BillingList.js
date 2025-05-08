"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"
import {
  Box,
  Paper,
  Typography,
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
  DialogTitle,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material"
import { Edit as EditIcon } from "@mui/icons-material"

function BillingList() {
  const { currentUser } = useAuth()
  const [billings, setBillings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedBilling, setSelectedBilling] = useState(null)

  // Form state
  const [billingForm, setBillingForm] = useState({
    status: "",
    amount: 0,
    due_date: "",
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    fetchBillings()
  }, [])

  const fetchBillings = async () => {
    try {
      setLoading(true)
      const response = await api.get("/billing")
      setBillings(response.data)
      setLoading(false)
    } catch (err) {
      setError("Failed to load billing data")
      setLoading(false)
    }
  }

  const handleEditDialogOpen = (billing) => {
    // Format due_date for the date input
    const dueDate = new Date(billing.due_date)
    const formattedDate = dueDate.toISOString().slice(0, 10)

    setBillingForm({
      status: billing.status,
      amount: billing.amount,
      due_date: formattedDate,
    })
    setSelectedBilling(billing)
    setFormErrors({})
    setEditDialogOpen(true)
  }

  const handleEditDialogClose = () => {
    setEditDialogOpen(false)
    setSelectedBilling(null)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setBillingForm((prev) => ({
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

  const validateBillingForm = () => {
    const errors = {}

    if (!billingForm.amount || billingForm.amount <= 0) {
      errors.amount = "Amount must be greater than 0"
    }

    if (!billingForm.due_date) {
      errors.due_date = "Due date is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleBillingSubmit = async () => {
    if (!validateBillingForm() || !selectedBilling) {
      return
    }

    try {
      const apiData = {
        ...billingForm,
        amount: Number.parseFloat(billingForm.amount),
      }

      await api.put(`/billing/${selectedBilling.id}`, apiData)

      fetchBillings()
      handleEditDialogClose()
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update billing")
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "success"
      case "pending":
        return "warning"
      case "overdue":
        return "error"
      default:
        return "default"
    }
  }

  // Only admins can access billing
  if (currentUser.role !== "admin") {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="warning">You don't have permission to access billing information.</Alert>
      </Box>
    )
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
          Billing
        </Typography>
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
              <TableCell>Invoice #</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Issue Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {billings.length > 0 ? (
              billings.map((billing) => (
                <TableRow key={billing.id}>
                  <TableCell>{billing.invoice_number}</TableCell>
                  <TableCell>${billing.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip label={billing.status} color={getStatusColor(billing.status)} size="small" />
                  </TableCell>
                  <TableCell>{new Date(billing.issue_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(billing.due_date).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" size="small" onClick={() => handleEditDialogOpen(billing)}>
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No billing records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Billing Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose}>
        <DialogTitle>Edit Invoice {selectedBilling?.invoice_number}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                value={billingForm.amount}
                onChange={handleFormChange}
                error={!!formErrors.amount}
                helperText={formErrors.amount}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select name="status" value={billingForm.status} onChange={handleFormChange} label="Status">
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Due Date"
                name="due_date"
                type="date"
                value={billingForm.due_date}
                onChange={handleFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
                error={!!formErrors.due_date}
                helperText={formErrors.due_date}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button onClick={handleBillingSubmit} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default BillingList
