const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Driver name is required'],
    trim: true
  },
  currentShiftHours: {
    type: Number,
    default: 0,
    min: 0
  },
  pastWeekWorkHours: {
    type: [Number],
    default: Array(7).fill(0),
    validate: {
      validator: function(arr) {
        return arr.length === 7;
      },
      message: 'Past week work hours must contain exactly 7 days'
    }
  },
  isFatigued: {
    type: Boolean,
    default: false
  },
  // Track if driver worked more than 8 hours yesterday
  workedOvertime: {
    type: Boolean,
    default: false
  },
  // Additional fields for management
  phoneNumber: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['available', 'on-route', 'off-duty'],
    default: 'available'
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

// Method to update driver fatigue status based on previous day's hours
driverSchema.methods.updateFatigueStatus = function() {
  // If driver worked more than 8 hours yesterday, mark as fatigued
  if (this.pastWeekWorkHours[0] > 8) {
    this.isFatigued = true;
    this.workedOvertime = true;
  } else {
    this.isFatigued = false;
    this.workedOvertime = false;
  }
  return this.save();
};

// Method to update work hours at the end of a shift
driverSchema.methods.endShift = function() {
  // Add current shift hours to today's total (first position in pastWeekWorkHours)
  this.pastWeekWorkHours[0] += this.currentShiftHours;
  
  // Reset current shift hours
  this.currentShiftHours = 0;
  
  // Update status
  this.status = 'off-duty';
  
  return this.save();
};

// Method to start a new day - shift the work hours array
driverSchema.methods.startNewDay = function() {
  // Shift array to make room for new day
  this.pastWeekWorkHours.pop(); // Remove oldest day
  this.pastWeekWorkHours.unshift(0); // Add new day with 0 hours
  
  // Update fatigue status based on previous day's hours
  this.updateFatigueStatus();
  
  return this.save();
};

const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver;