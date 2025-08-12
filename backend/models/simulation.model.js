const mongoose = require('mongoose');

const simulationSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  parameters: {
    availableDrivers: {
      type: Number,
      required: true,
      min: 1
    },
    routeStartTime: {
      type: String,
      required: true,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/  // HH:MM format
    },
    maxHoursPerDriver: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    }
  },
  results: {
    totalProfit: {
      type: Number,
      default: 0
    },
    efficiencyScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    onTimeDeliveries: {
      type: Number,
      default: 0
    },
    lateDeliveries: {
      type: Number,
      default: 0
    },
    totalDeliveries: {
      type: Number,
      default: 0
    },
    fuelCosts: {
      type: Number,
      default: 0
    },
    highValueBonuses: {
      type: Number,
      default: 0
    },
    latePenalties: {
      type: Number,
      default: 0
    }
  },
  // Store the driver assignments for this simulation
  driverAssignments: [{
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver'
    },
    orders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }],
    totalHours: Number,
    totalDistance: Number
  }],
  // Store detailed breakdown of fuel costs by traffic level
  fuelCostBreakdown: {
    lowTraffic: {
      type: Number,
      default: 0
    },
    mediumTraffic: {
      type: Number,
      default: 0
    },
    highTraffic: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Method to calculate efficiency score
simulationSchema.methods.calculateEfficiencyScore = function() {
  if (this.results.totalDeliveries === 0) return 0;
  
  // Formula: Efficiency = (OnTime Deliveries / Total Deliveries) × 100
  return (this.results.onTimeDeliveries / this.results.totalDeliveries) * 100;
};

// Method to update simulation results
simulationSchema.methods.updateResults = function(results) {
  this.results = { ...this.results, ...results };
  
  // Recalculate efficiency score
  this.results.efficiencyScore = this.calculateEfficiencyScore();
  
  return this.save();
};

const Simulation = mongoose.model('Simulation', simulationSchema);

module.exports = Simulation;