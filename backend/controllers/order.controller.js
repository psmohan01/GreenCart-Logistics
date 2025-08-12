const Order = require('../models/order.model');
const Route = require('../models/route.model');
const Driver = require('../models/driver.model');

// Get all orders with optional filtering
const getOrders = async (req, res) => {
  try {
    const { status, routeId, driverId, minValue, maxValue, sortBy, limit = 20, page = 1 } = req.query;
    const query = {};
    
    // Apply filters if provided
    if (status) query.status = status;
    if (routeId) query['assignedRoute.routeId'] = routeId;
    if (driverId) query['assignedDriver'] = driverId;
    if (minValue) query.valueRs = { $gte: parseFloat(minValue) };
    if (maxValue) query.valueRs = { ...query.valueRs, $lte: parseFloat(maxValue) };
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort options
    let sortOptions = {};
    if (sortBy) {
      const [field, order] = sortBy.split(':');
      sortOptions[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions = { deliveryTimestamp: 1 }; // Default sort by delivery time ascending
    }
    
    // Execute query with pagination and sorting
    const orders = await Order.find(query)
      .populate('assignedRoute')
      .populate('assignedDriver', 'name contactNumber status fatigueStatus')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);
    
    res.status(200).json({
      orders,
      pagination: {
        total: totalOrders,
        page: parseInt(page),
        pages: Math.ceil(totalOrders / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific order by ID
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('assignedRoute')
      .populate('assignedDriver', 'name contactNumber status fatigueStatus');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(200).json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new order
const createOrder = async (req, res) => {
  try {
    const { 
      orderId, 
      valueRs,
      assignedRoute,
      deliveryTimestamp,
      customerName,
      customerContact,
      deliveryAddress,
      notes
    } = req.body;
    
    // Validate required fields
    if (!orderId || !valueRs || !assignedRoute || !deliveryTimestamp) {
      return res.status(400).json({ 
        message: 'Order ID, value, assigned route, and delivery timestamp are required' 
      });
    }
    
    // Check if order with same ID already exists
    const existingOrder = await Order.findOne({ orderId });
    if (existingOrder) {
      return res.status(400).json({ message: 'Order with this ID already exists' });
    }
    
    // Verify route exists
    const route = await Route.findById(assignedRoute);
    if (!route) {
      return res.status(400).json({ message: 'Invalid route ID' });
    }
    
    // Create new order
    const newOrder = new Order({
      orderId,
      valueRs,
      assignedRoute,
      deliveryTimestamp,
      customerName,
      customerContact,
      deliveryAddress,
      notes,
      status: 'pending'
    });
    
    await newOrder.save();
    
    res.status(201).json({ 
      message: 'Order created successfully', 
      order: newOrder 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an order
const updateOrder = async (req, res) => {
  try {
    const { 
      orderId, 
      valueRs,
      assignedRoute,
      deliveryTimestamp,
      customerName,
      customerContact,
      deliveryAddress,
      notes
    } = req.body;
    
    // Find order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order is already completed or cancelled
    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ 
        message: `Cannot update order with status: ${order.status}` 
      });
    }
    
    // Check if orderId is being changed and already exists
    if (orderId && orderId !== order.orderId) {
      const existingOrder = await Order.findOne({ orderId });
      if (existingOrder && existingOrder._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'Order with this ID already exists' });
      }
    }
    
    // Verify route exists if being updated
    if (assignedRoute && assignedRoute !== order.assignedRoute.toString()) {
      const route = await Route.findById(assignedRoute);
      if (!route) {
        return res.status(400).json({ message: 'Invalid route ID' });
      }
    }
    
    // Update fields
    if (orderId) order.orderId = orderId;
    if (valueRs) order.valueRs = valueRs;
    if (assignedRoute) order.assignedRoute = assignedRoute;
    if (deliveryTimestamp) order.deliveryTimestamp = deliveryTimestamp;
    if (customerName !== undefined) order.customerName = customerName;
    if (customerContact !== undefined) order.customerContact = customerContact;
    if (deliveryAddress !== undefined) order.deliveryAddress = deliveryAddress;
    if (notes !== undefined) order.notes = notes;
    
    await order.save();
    
    res.status(200).json({ 
      message: 'Order updated successfully', 
      order 
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete an order
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Only allow deletion of pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot delete order with status: ${order.status}` 
      });
    }
    
    await Order.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign driver to an order
const assignDriver = async (req, res) => {
  try {
    const { driverId } = req.body;
    
    if (!driverId) {
      return res.status(400).json({ message: 'Driver ID is required' });
    }
    
    // Find order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order can be assigned
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        message: `Cannot assign driver to order with status: ${order.status}` 
      });
    }
    
    // Verify driver exists and is available
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(400).json({ message: 'Invalid driver ID' });
    }
    
    if (driver.status !== 'available') {
      return res.status(400).json({ 
        message: `Driver is not available (current status: ${driver.status})` 
      });
    }
    
    // Check driver fatigue level
    if (driver.fatigueStatus.level === 'high') {
      return res.status(400).json({ 
        message: 'Driver fatigue level is too high for new assignments' 
      });
    }
    
    // Assign driver to order
    order.assignedDriver = driverId;
    order.status = 'assigned';
    
    // Update driver status
    driver.status = 'on-delivery';
    
    // If driver doesn't have an active shift, start one
    if (!driver.shiftHours.start) {
      driver.shiftHours.start = new Date();
    }
    
    // Save both documents
    await Promise.all([
      order.save(),
      driver.save()
    ]);
    
    res.status(200).json({ 
      message: 'Driver assigned successfully', 
      order,
      driver: {
        _id: driver._id,
        name: driver.name,
        status: driver.status
      }
    });
  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'assigned', 'in-transit', 'delivered', 'delayed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const order = await Order.findById(req.params.id)
      .populate('assignedDriver');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Handle status transitions
    const oldStatus = order.status;
    
    // Prevent certain status changes
    if (oldStatus === 'delivered' && status !== 'delivered') {
      return res.status(400).json({ message: 'Cannot change status of delivered orders' });
    }
    
    if (oldStatus === 'cancelled' && status !== 'cancelled') {
      return res.status(400).json({ message: 'Cannot change status of cancelled orders' });
    }
    
    // Special handling for delivered status
    if (status === 'delivered' && oldStatus !== 'delivered') {
      // Complete the delivery
      order.actualDeliveryTimestamp = new Date();
      order.isDeliveredOnTime = order.calculateIsLateDelivery() === false;
      
      // Calculate profit
      order.profit = order.calculateProfit();
      
      // If driver exists, update their status
      if (order.assignedDriver) {
        const driver = order.assignedDriver;
        
        // Update driver fatigue based on delivery
        await driver.updateFatigueStatus();
        
        // Check if driver has more deliveries
        const pendingDeliveries = await Order.countDocuments({
          assignedDriver: driver._id,
          status: { $in: ['assigned', 'in-transit'] }
        });
        
        if (pendingDeliveries === 0) {
          driver.status = 'available';
          await driver.save();
        }
      }
    }
    
    // Update order status
    order.status = status;
    await order.save();
    
    res.status(200).json({ 
      message: 'Order status updated successfully', 
      order 
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get order statistics
const getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.deliveryTimestamp = { $gte: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.deliveryTimestamp = { 
        ...dateFilter.deliveryTimestamp, 
        $lte: new Date(endDate) 
      };
    }
    
    // Get counts by status
    const statusCounts = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Get on-time vs late delivery stats
    const deliveryStats = await Order.aggregate([
      { 
        $match: { 
          ...dateFilter,
          status: 'delivered',
          isDeliveredOnTime: { $ne: null }
        } 
      },
      { $group: { _id: '$isDeliveredOnTime', count: { $sum: 1 } } }
    ]);
    
    // Get total value and profit
    const financialStats = await Order.aggregate([
      { $match: { ...dateFilter, status: 'delivered' } },
      { 
        $group: { 
          _id: null, 
          totalValue: { $sum: '$valueRs' },
          totalProfit: { $sum: '$profit' },
          count: { $sum: 1 }
        } 
      }
    ]);
    
    // Format the results
    const formattedStatusCounts = {};
    statusCounts.forEach(item => {
      formattedStatusCounts[item._id] = item.count;
    });
    
    const formattedDeliveryStats = {
      onTime: 0,
      late: 0
    };
    deliveryStats.forEach(item => {
      if (item._id === true) formattedDeliveryStats.onTime = item.count;
      if (item._id === false) formattedDeliveryStats.late = item.count;
    });
    
    const formattedFinancialStats = financialStats.length > 0 ? {
      totalValue: financialStats[0].totalValue,
      totalProfit: financialStats[0].totalProfit,
      averageProfit: financialStats[0].totalProfit / financialStats[0].count
    } : {
      totalValue: 0,
      totalProfit: 0,
      averageProfit: 0
    };
    
    res.status(200).json({
      statusCounts: formattedStatusCounts,
      deliveryStats: formattedDeliveryStats,
      financialStats: formattedFinancialStats
    });
  } catch (error) {
    console.error('Error getting order statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  assignDriver,
  updateStatus,
  getOrderStats
};