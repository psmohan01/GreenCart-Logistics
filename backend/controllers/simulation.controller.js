const { Driver, Route, Order, Simulation } = require('../models');

/**
 * Simulation Controller
 * Implements the company's proprietary rules for delivery optimization
 */

// Run a new simulation with the provided parameters
exports.runSimulation = async (req, res) => {
  try {
    // Validate simulation parameters
    const { availableDrivers, routeStartTime, maxHoursPerDriver } = req.body;
    
    if (!availableDrivers || !routeStartTime || !maxHoursPerDriver) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters',
        requiredParams: ['availableDrivers', 'routeStartTime', 'maxHoursPerDriver']
      });
    }
    
    if (availableDrivers <= 0 || maxHoursPerDriver <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Parameters must be positive values',
        invalidParams: availableDrivers <= 0 ? ['availableDrivers'] : ['maxHoursPerDriver']
      });
    }
    
    // Parse route start time
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(routeStartTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route start time format. Use HH:MM format',
        example: '09:30'
      });
    }
    
    // Get available drivers
    const drivers = await Driver.find({ status: 'available' })
      .limit(availableDrivers)
      .sort({ currentShiftHours: 1 }); // Prioritize drivers with fewer hours
    
    if (drivers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No available drivers found'
      });
    }
    
    // Get pending orders
    const pendingOrders = await Order.find({ status: 'pending' })
      .populate('assignedRoute')
      .sort({ deliveryTimestamp: 1 }); // Prioritize earlier deliveries
    
    if (pendingOrders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending orders found'
      });
    }
    
    // Create a new simulation record
    const simulation = new Simulation({
      parameters: {
        availableDrivers,
        routeStartTime,
        maxHoursPerDriver
      },
      createdBy: req.user ? req.user._id : null
    });
    
    // Allocate orders to drivers based on simulation parameters
    const simulationResults = await allocateOrdersToDrivers(
      drivers,
      pendingOrders,
      routeStartTime,
      maxHoursPerDriver
    );
    
    // Update simulation with results
    simulation.results = simulationResults.kpis;
    simulation.driverAssignments = simulationResults.driverAssignments;
    simulation.fuelCostBreakdown = simulationResults.fuelCostBreakdown;
    
    // Save simulation results
    await simulation.save();
    
    // Return simulation results
    return res.status(200).json({
      success: true,
      message: 'Simulation completed successfully',
      simulation: {
        id: simulation._id,
        parameters: simulation.parameters,
        results: simulation.results,
        driverAssignments: simulation.driverAssignments.map(assignment => ({
          driverId: assignment.driver,
          orderCount: assignment.orders.length,
          totalHours: assignment.totalHours,
          totalDistance: assignment.totalDistance
        })),
        fuelCostBreakdown: simulation.fuelCostBreakdown,
        timestamp: simulation.timestamp
      }
    });
    
  } catch (error) {
    console.error('Simulation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error running simulation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all simulations
exports.getSimulations = async (req, res) => {
  try {
    const simulations = await Simulation.find({})
      .sort({ timestamp: -1 })
      .select('-__v');
    
    return res.status(200).json({
      success: true,
      count: simulations.length,
      simulations
    });
  } catch (error) {
    console.error('Error fetching simulations:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching simulations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get a single simulation by ID
exports.getSimulationById = async (req, res) => {
  try {
    const simulation = await Simulation.findById(req.params.id)
      .populate({
        path: 'driverAssignments.driver',
        select: 'name currentShiftHours isFatigued'
      })
      .populate({
        path: 'driverAssignments.orders',
        select: 'orderId valueRs status isDeliveredOnTime profit'
      });
    
    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      simulation
    });
  } catch (error) {
    console.error('Error fetching simulation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching simulation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Apply simulation results to actual orders and drivers
exports.applySimulation = async (req, res) => {
  try {
    const { simulationId } = req.params;
    
    const simulation = await Simulation.findById(simulationId)
      .populate({
        path: 'driverAssignments.driver',
        model: 'Driver'
      })
      .populate({
        path: 'driverAssignments.orders',
        model: 'Order'
      });
    
    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'Simulation not found'
      });
    }
    
    // Apply driver assignments from simulation
    for (const assignment of simulation.driverAssignments) {
      const driver = assignment.driver;
      
      // Update driver status and hours
      driver.status = 'on-route';
      driver.currentShiftHours += assignment.totalHours;
      await driver.save();
      
      // Update order assignments
      for (const order of assignment.orders) {
        order.assignedDriver = driver._id;
        order.status = 'assigned';
        await order.save();
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Simulation applied successfully',
      simulationId
    });
  } catch (error) {
    console.error('Error applying simulation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error applying simulation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to allocate orders to drivers based on simulation parameters
async function allocateOrdersToDrivers(drivers, orders, routeStartTime, maxHoursPerDriver) {
  // Initialize results
  const driverAssignments = [];
  const fuelCostBreakdown = {
    lowTraffic: 0,
    mediumTraffic: 0,
    highTraffic: 0
  };
  
  let totalProfit = 0;
  let onTimeDeliveries = 0;
  let lateDeliveries = 0;
  let totalDeliveries = 0;
  let totalFuelCosts = 0;
  let totalHighValueBonuses = 0;
  let totalLatePenalties = 0;
  
  // Parse route start time
  const [hours, minutes] = routeStartTime.split(':').map(Number);
  const startTime = new Date();
  startTime.setHours(hours, minutes, 0, 0);
  
  // Create a copy of drivers array to work with
  const availableDrivers = [...drivers];
  
  // Initialize driver assignments
  for (const driver of availableDrivers) {
    driverAssignments.push({
      driver: driver._id,
      orders: [],
      totalHours: 0,
      totalDistance: 0
    });
  }
  
  // Process each order
  for (const order of orders) {
    // Find the most suitable driver for this order
    const driverIndex = findSuitableDriver(availableDrivers, driverAssignments, order, maxHoursPerDriver);
    
    // If no suitable driver found, skip this order
    if (driverIndex === -1) continue;
    
    const driver = availableDrivers[driverIndex];
    const assignment = driverAssignments[driverIndex];
    const route = order.assignedRoute;
    
    // Calculate delivery time based on driver fatigue
    const deliveryTimeMinutes = route.calculateEstimatedDeliveryTime(driver.isFatigued);
    
    // Calculate fuel cost
    const fuelCost = route.calculateFuelCost();
    totalFuelCosts += fuelCost;
    
    // Update fuel cost breakdown
    if (route.trafficLevel === 'Low') {
      fuelCostBreakdown.lowTraffic += fuelCost;
    } else if (route.trafficLevel === 'Medium') {
      fuelCostBreakdown.mediumTraffic += fuelCost;
    } else {
      fuelCostBreakdown.highTraffic += fuelCost;
    }
    
    // Calculate actual delivery time
    const actualDeliveryTime = new Date(startTime.getTime() + (assignment.totalHours * 60 + deliveryTimeMinutes) * 60000);
    
    // Check if delivery is late
    const isLate = order.isLateDelivery(actualDeliveryTime, route.baseTimeMinutes);
    
    // Calculate penalties and bonuses
    const latePenalty = order.calculateLatePenalty(isLate);
    const highValueBonus = order.calculateHighValueBonus(!isLate);
    
    // Calculate profit for this order
    const profit = order.calculateProfit(fuelCost, latePenalty, highValueBonus);
    
    // Update totals
    totalProfit += profit;
    totalDeliveries++;
    totalHighValueBonuses += highValueBonus;
    totalLatePenalties += latePenalty;
    
    if (isLate) {
      lateDeliveries++;
    } else {
      onTimeDeliveries++;
    }
    
    // Update driver assignment
    assignment.orders.push(order._id);
    assignment.totalHours += deliveryTimeMinutes / 60; // Convert minutes to hours
    assignment.totalDistance += route.distanceKm;
  }
  
  // Calculate efficiency score
  const efficiencyScore = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;
  
  return {
    driverAssignments,
    fuelCostBreakdown,
    kpis: {
      totalProfit,
      efficiencyScore,
      onTimeDeliveries,
      lateDeliveries,
      totalDeliveries,
      fuelCosts: totalFuelCosts,
      highValueBonuses: totalHighValueBonuses,
      latePenalties: totalLatePenalties
    }
  };
}

// Helper function to find the most suitable driver for an order
function findSuitableDriver(drivers, driverAssignments, order, maxHoursPerDriver) {
  let bestDriverIndex = -1;
  let minCurrentHours = Infinity;
  
  for (let i = 0; i < drivers.length; i++) {
    const driver = drivers[i];
    const assignment = driverAssignments[i];
    const route = order.assignedRoute;
    
    // Calculate delivery time based on driver fatigue
    const deliveryTimeHours = route.calculateEstimatedDeliveryTime(driver.isFatigued) / 60;
    
    // Check if driver has enough hours left in their shift
    if (assignment.totalHours + deliveryTimeHours <= maxHoursPerDriver) {
      // Choose the driver with the least current hours
      if (assignment.totalHours < minCurrentHours) {
        minCurrentHours = assignment.totalHours;
        bestDriverIndex = i;
      }
    }
  }
  
  return bestDriverIndex;
}