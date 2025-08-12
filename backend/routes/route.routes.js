const express = require('express');
const router = express.Router();
const routeController = require('../controllers/route.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All route endpoints are protected
router.use(verifyToken);

// Get all routes with optional filtering
router.get('/', routeController.getRoutes);

// Get a specific route by ID
router.get('/:id', routeController.getRouteById);

// Create a new route
router.post('/', routeController.createRoute);

// Update a route
router.put('/:id', routeController.updateRoute);

// Delete a route
router.delete('/:id', routeController.deleteRoute);

// Update traffic level for a route
router.put('/:id/traffic', routeController.updateTrafficLevel);

// Calculate fuel cost for a route
router.get('/:id/fuel-cost', routeController.calculateFuelCost);

module.exports = router;