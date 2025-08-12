const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// All order endpoints are protected
router.use(verifyToken);

// Get all orders with optional filtering
router.get('/', orderController.getOrders);

// Get order statistics
router.get('/stats', orderController.getOrderStats);

// Get a specific order by ID
router.get('/:id', orderController.getOrderById);

// Create a new order
router.post('/', orderController.createOrder);

// Update an order
router.put('/:id', orderController.updateOrder);

// Delete an order
router.delete('/:id', orderController.deleteOrder);

// Assign driver to an order
router.put('/:id/assign-driver', orderController.assignDriver);

// Update order status
router.put('/:id/status', orderController.updateStatus);

module.exports = router;