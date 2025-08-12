const Route = require('../models/route.model');

// Get all routes with optional filtering
const getRoutes = async (req, res) => {
  try {
    const { isActive, trafficLevel, minDistance, maxDistance, sortBy, limit = 20, page = 1 } = req.query;
    const query = {};
    
    // Apply filters if provided
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (trafficLevel) query.trafficLevel = trafficLevel;
    if (minDistance) query.distance = { $gte: parseFloat(minDistance) };
    if (maxDistance) query.distance = { ...query.distance, $lte: parseFloat(maxDistance) };
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort options
    let sortOptions = {};
    if (sortBy) {
      const [field, order] = sortBy.split(':');
      sortOptions[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions = { routeId: 1 }; // Default sort by routeId ascending
    }
    
    // Execute query with pagination and sorting
    const routes = await Route.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalRoutes = await Route.countDocuments(query);
    
    res.status(200).json({
      routes,
      pagination: {
        total: totalRoutes,
        page: parseInt(page),
        pages: Math.ceil(totalRoutes / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific route by ID
const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    
    res.status(200).json({ route });
  } catch (error) {
    console.error('Error fetching route:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new route
const createRoute = async (req, res) => {
  try {
    const { 
      routeId, 
      startLocation,
      endLocation,
      distance,
      trafficLevel = 'medium',
      baseTimeMinutes,
      fuelCostPerKm = 5, // Default fuel cost in Rs per km
      isActive = true
    } = req.body;
    
    // Validate required fields
    if (!routeId || !startLocation || !endLocation || !distance || !baseTimeMinutes) {
      return res.status(400).json({ 
        message: 'Route ID, start location, end location, distance, and base time are required' 
      });
    }
    
    // Check if route with same ID already exists
    const existingRoute = await Route.findOne({ routeId });
    if (existingRoute) {
      return res.status(400).json({ message: 'Route with this ID already exists' });
    }
    
    // Create new route
    const newRoute = new Route({
      routeId,
      startLocation,
      endLocation,
      distance,
      trafficLevel,
      baseTimeMinutes,
      fuelCostPerKm,
      isActive
    });
    
    await newRoute.save();
    
    res.status(201).json({ 
      message: 'Route created successfully', 
      route: newRoute 
    });
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a route
const updateRoute = async (req, res) => {
  try {
    const { 
      routeId, 
      startLocation,
      endLocation,
      distance,
      trafficLevel,
      baseTimeMinutes,
      fuelCostPerKm,
      isActive
    } = req.body;
    
    // Find route
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    
    // Check if routeId is being changed and already exists
    if (routeId && routeId !== route.routeId) {
      const existingRoute = await Route.findOne({ routeId });
      if (existingRoute && existingRoute._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'Route with this ID already exists' });
      }
    }
    
    // Update fields
    if (routeId) route.routeId = routeId;
    if (startLocation) route.startLocation = startLocation;
    if (endLocation) route.endLocation = endLocation;
    if (distance) route.distance = distance;
    if (trafficLevel) route.trafficLevel = trafficLevel;
    if (baseTimeMinutes) route.baseTimeMinutes = baseTimeMinutes;
    if (fuelCostPerKm) route.fuelCostPerKm = fuelCostPerKm;
    if (isActive !== undefined) route.isActive = isActive;
    
    await route.save();
    
    res.status(200).json({ 
      message: 'Route updated successfully', 
      route 
    });
  } catch (error) {
    console.error('Error updating route:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a route
const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    
    // Check if route has active orders before deletion
    // This would require checking the Order model for active assignments
    // For simplicity, we'll just delete the route here
    
    await Route.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update traffic level for a route
const updateTrafficLevel = async (req, res) => {
  try {
    const { trafficLevel } = req.body;
    
    if (!['low', 'medium', 'high'].includes(trafficLevel)) {
      return res.status(400).json({ message: 'Invalid traffic level' });
    }
    
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    
    route.trafficLevel = trafficLevel;
    await route.save();
    
    // Calculate updated delivery time based on new traffic level
    const estimatedTime = route.calculateEstimatedTime();
    
    res.status(200).json({ 
      message: 'Traffic level updated successfully', 
      trafficLevel: route.trafficLevel,
      estimatedTimeMinutes: estimatedTime
    });
  } catch (error) {
    console.error('Error updating traffic level:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Calculate fuel cost for a route
const calculateFuelCost = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    
    const fuelCost = route.calculateFuelCost();
    
    res.status(200).json({ 
      routeId: route.routeId,
      distance: route.distance,
      fuelCostPerKm: route.fuelCostPerKm,
      totalFuelCost: fuelCost
    });
  } catch (error) {
    console.error('Error calculating fuel cost:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  updateTrafficLevel,
  calculateFuelCost
};