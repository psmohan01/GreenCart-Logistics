const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulation.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All simulation routes are protected
router.use(verifyToken);

// Run a new simulation
router.post('/', simulationController.runSimulation);

// Get all simulations
router.get('/', simulationController.getSimulations);

// Get a specific simulation by ID
router.get('/:id', simulationController.getSimulationById);

// Apply a simulation to real-world operations
router.post('/:id/apply', simulationController.applySimulation);

module.exports = router;