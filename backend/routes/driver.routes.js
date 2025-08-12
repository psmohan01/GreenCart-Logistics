const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All driver routes are protected
router.use(verifyToken);

// Get all drivers with optional filtering
router.get('/', driverController.getDrivers);

// Get a specific driver by ID
router.get('/:id', driverController.getDriverById);

// Create a new driver
router.post('/', driverController.createDriver);

// Update a driver
router.put('/:id', driverController.updateDriver);

// Delete a driver
router.delete('/:id', driverController.deleteDriver);

// Update driver fatigue status
router.put('/:id/fatigue', driverController.updateFatigueStatus);

// End driver shift
router.put('/:id/end-shift', driverController.endShift);

// Start new day for driver
router.put('/:id/start-day', driverController.startNewDay);

module.exports = router;