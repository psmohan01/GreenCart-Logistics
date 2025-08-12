const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeId: {
    type: String,
    required: [true, 'Route ID is required'],
    unique: true,
    trim: true
  },
  distanceKm: {
    type: Number,
    required: [true, 'Distance in kilometers is required'],
    min: 0
  },
  trafficLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
    required: true
  },
  baseTimeMinutes: {
    type: Number,
    required: [true, 'Base time in minutes is required'],
    min: 0
  },
  // Additional fields for management
  startLocation: {
    type: String,
    trim: true
  },
  endLocation: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to calculate fuel cost based on company rules
routeSchema.methods.calculateFuelCost = function() {
  // Base cost: ₹5/km per route
  let fuelCost = this.distanceKm * 5;
  
  // If traffic level is "High" → +₹2/km fuel surcharge
  if (this.trafficLevel === 'High') {
    fuelCost += this.distanceKm * 2;
  }
  
  return fuelCost;
};

// Method to calculate estimated delivery time
routeSchema.methods.calculateEstimatedDeliveryTime = function(driverFatigued = false) {
  let estimatedTime = this.baseTimeMinutes;
  
  // If driver is fatigued (worked >8 hours previous day), delivery time increases by 30%
  if (driverFatigued) {
    estimatedTime *= 1.3; // 30% slower
  }
  
  return Math.round(estimatedTime);
};

const Route = mongoose.model('Route', routeSchema);

module.exports = Route;