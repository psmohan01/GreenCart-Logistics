const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: [true, 'Order ID is required'],
    unique: true,
    trim: true
  },
  valueRs: {
    type: Number,
    required: [true, 'Order value in Rupees is required'],
    min: 0
  },
  assignedRoute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: [true, 'Assigned route is required']
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  deliveryTimestamp: {
    type: Date,
    required: [true, 'Delivery timestamp is required']
  },
  actualDeliveryTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-transit', 'delivered', 'delayed', 'cancelled'],
    default: 'pending'
  },
  isDeliveredOnTime: {
    type: Boolean,
    default: null
  },
  latePenalty: {
    type: Number,
    default: 0
  },
  highValueBonus: {
    type: Number,
    default: 0
  },
  fuelCost: {
    type: Number,
    default: 0
  },
  profit: {
    type: Number,
    default: 0
  },
  // Additional fields for management
  customerName: {
    type: String,
    trim: true
  },
  customerContact: {
    type: String,
    trim: true
  },
  deliveryAddress: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
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

// Method to calculate if delivery is late
orderSchema.methods.isLateDelivery = function(actualDeliveryTime, routeBaseTime) {
  // If delivery time > (base route time + 10 minutes), it's late
  const expectedDeliveryTime = new Date(this.deliveryTimestamp);
  expectedDeliveryTime.setMinutes(expectedDeliveryTime.getMinutes() + routeBaseTime + 10);
  
  return actualDeliveryTime > expectedDeliveryTime;
};

// Method to calculate late penalty
orderSchema.methods.calculateLatePenalty = function(isLate) {
  // If delivery is late, apply ₹50 penalty
  return isLate ? 50 : 0;
};

// Method to calculate high-value bonus
orderSchema.methods.calculateHighValueBonus = function(isOnTime) {
  // If order value > ₹1000 AND delivered on time → add 10% bonus to order profit
  return (this.valueRs > 1000 && isOnTime) ? this.valueRs * 0.1 : 0;
};

// Method to calculate order profit
orderSchema.methods.calculateProfit = function(fuelCost, latePenalty, highValueBonus) {
  // Profit = order value + bonus - penalties - fuel cost
  return this.valueRs + highValueBonus - latePenalty - fuelCost;
};

// Method to update order after delivery
orderSchema.methods.completeDelivery = function(actualDeliveryTime, routeBaseTime, fuelCost) {
  this.actualDeliveryTime = actualDeliveryTime;
  this.status = 'delivered';
  
  // Calculate if delivery was on time
  const isLate = this.isLateDelivery(actualDeliveryTime, routeBaseTime);
  this.isDeliveredOnTime = !isLate;
  
  // Calculate penalties and bonuses
  this.latePenalty = this.calculateLatePenalty(isLate);
  this.highValueBonus = this.calculateHighValueBonus(!isLate);
  this.fuelCost = fuelCost;
  
  // Calculate final profit
  this.profit = this.calculateProfit(fuelCost, this.latePenalty, this.highValueBonus);
  
  return this.save();
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;