const Driver = require('../models/driver.model');

// Get all drivers with optional filtering
const getDrivers = async (req, res) => {
  try {
    const { status, name, sortBy, limit = 20, page = 1 } = req.query;
    const query = {};
    
    // Apply filters if provided
    if (status) query.status = status;
    if (name) query.name = { $regex: name, $options: 'i' };
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort options
    let sortOptions = {};
    if (sortBy) {
      const [field, order] = sortBy.split(':');
      sortOptions[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions = { name: 1 }; // Default sort by name ascending
    }
    
    // Execute query with pagination and sorting
    const drivers = await Driver.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalDrivers = await Driver.countDocuments(query);
    
    res.status(200).json({
      drivers,
      pagination: {
        total: totalDrivers,
        page: parseInt(page),
        pages: Math.ceil(totalDrivers / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific driver by ID
const getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    res.status(200).json({ driver });
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new driver
const createDriver = async (req, res) => {
  try {
    const { 
      name, 
      contactNumber, 
      email, 
      licenseNumber,
      maxHoursPerDay = 8,
      preferredRoutes = [],
      status = 'available'
    } = req.body;
    
    // Validate required fields
    if (!name || !contactNumber) {
      return res.status(400).json({ message: 'Name and contact number are required' });
    }
    
    // Check if driver with same license number already exists
    if (licenseNumber) {
      const existingDriver = await Driver.findOne({ licenseNumber });
      if (existingDriver) {
        return res.status(400).json({ message: 'Driver with this license number already exists' });
      }
    }
    
    // Create new driver
    const newDriver = new Driver({
      name,
      contactNumber,
      email,
      licenseNumber,
      maxHoursPerDay,
      preferredRoutes,
      status,
      shiftHours: {
        start: null,
        end: null,
        totalHoursToday: 0
      },
      workHistory: [],
      fatigueStatus: {
        level: 'normal',
        lastUpdated: new Date()
      }
    });
    
    await newDriver.save();
    
    res.status(201).json({ 
      message: 'Driver created successfully', 
      driver: newDriver 
    });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a driver
const updateDriver = async (req, res) => {
  try {
    const { 
      name, 
      contactNumber, 
      email, 
      licenseNumber,
      maxHoursPerDay,
      preferredRoutes,
      status
    } = req.body;
    
    // Find driver
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Check if license number is being changed and already exists
    if (licenseNumber && licenseNumber !== driver.licenseNumber) {
      const existingDriver = await Driver.findOne({ licenseNumber });
      if (existingDriver && existingDriver._id.toString() !== req.params.id) {
        return res.status(400).json({ message: 'Driver with this license number already exists' });
      }
    }
    
    // Update fields
    if (name) driver.name = name;
    if (contactNumber) driver.contactNumber = contactNumber;
    if (email) driver.email = email;
    if (licenseNumber) driver.licenseNumber = licenseNumber;
    if (maxHoursPerDay) driver.maxHoursPerDay = maxHoursPerDay;
    if (preferredRoutes) driver.preferredRoutes = preferredRoutes;
    if (status) driver.status = status;
    
    await driver.save();
    
    res.status(200).json({ 
      message: 'Driver updated successfully', 
      driver 
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a driver
const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Check if driver has active assignments before deletion
    // This would require checking the Order model for active assignments
    // For simplicity, we'll just delete the driver here
    
    await Driver.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update driver fatigue status
const updateFatigueStatus = async (req, res) => {
  try {
    const { level } = req.body;
    
    if (!['normal', 'moderate', 'high'].includes(level)) {
      return res.status(400).json({ message: 'Invalid fatigue level' });
    }
    
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    driver.fatigueStatus = {
      level,
      lastUpdated: new Date()
    };
    
    await driver.save();
    
    res.status(200).json({ 
      message: 'Fatigue status updated successfully', 
      fatigueStatus: driver.fatigueStatus 
    });
  } catch (error) {
    console.error('Error updating fatigue status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// End driver shift
const endShift = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Check if driver has an active shift
    if (!driver.shiftHours.start) {
      return res.status(400).json({ message: 'Driver does not have an active shift' });
    }
    
    // End shift and update work history
    const now = new Date();
    const shiftStart = new Date(driver.shiftHours.start);
    const hoursWorked = (now - shiftStart) / (1000 * 60 * 60); // Convert ms to hours
    
    driver.shiftHours.end = now;
    driver.shiftHours.totalHoursToday += hoursWorked;
    
    // Add to work history
    driver.workHistory.push({
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      hoursWorked,
      shiftStart,
      shiftEnd: now
    });
    
    // Update status
    driver.status = 'off-duty';
    
    await driver.save();
    
    res.status(200).json({ 
      message: 'Shift ended successfully', 
      hoursWorked,
      totalHoursToday: driver.shiftHours.totalHoursToday
    });
  } catch (error) {
    console.error('Error ending shift:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Start new day for driver
const startNewDay = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Reset shift hours for new day
    driver.shiftHours = {
      start: null,
      end: null,
      totalHoursToday: 0
    };
    
    // Reset fatigue to normal for new day
    driver.fatigueStatus = {
      level: 'normal',
      lastUpdated: new Date()
    };
    
    // Set status to available
    driver.status = 'available';
    
    await driver.save();
    
    res.status(200).json({ 
      message: 'New day started successfully', 
      driver 
    });
  } catch (error) {
    console.error('Error starting new day:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  updateFatigueStatus,
  endShift,
  startNewDay
};