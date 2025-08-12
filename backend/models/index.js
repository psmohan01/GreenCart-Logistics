// Export all models for easier imports elsewhere
const User = require('./user.model');
const Driver = require('./driver.model');
const Route = require('./route.model');
const Order = require('./order.model');
const Simulation = require('./simulation.model');

module.exports = {
  User,
  Driver,
  Route,
  Order,
  Simulation
};