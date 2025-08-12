import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Simulation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    availableDrivers: 5,
    routeStartTime: '09:00',
    maxHoursPerDriver: 8
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'availableDrivers' || name === 'maxHoursPerDriver' ? parseInt(value, 10) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setSimulationResult(null);

    try {
      const response = await axios.post('/api/simulations', formData);
      setSuccess(true);
      setSimulationResult(response.data.simulation);
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err.response?.data?.message || 'Failed to run simulation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySimulation = async () => {
    if (!simulationResult?.id) return;
    
    setLoading(true);
    try {
      await axios.post(`/api/simulations/${simulationResult.id}/apply`);
      navigate('/simulation/history');
    } catch (err) {
      console.error('Error applying simulation:', err);
      setError(err.response?.data?.message || 'Failed to apply simulation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    if (!simulationResult?.id) return;
    navigate(`/simulation/detail/${simulationResult.id}`);
  };

  return (
    <div className="simulation-page">
      <h1>Run Delivery Simulation</h1>
      
      <div className="simulation-container">
        <div className="simulation-form-container">
          <h2>Simulation Parameters</h2>
          <form onSubmit={handleSubmit} className="simulation-form">
            <div className="form-group">
              <label htmlFor="availableDrivers">Available Drivers</label>
              <input
                type="number"
                id="availableDrivers"
                name="availableDrivers"
                min="1"
                max="20"
                value={formData.availableDrivers}
                onChange={handleChange}
                required
              />
              <p className="form-help">Number of drivers available for delivery assignments</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="routeStartTime">Route Start Time</label>
              <input
                type="time"
                id="routeStartTime"
                name="routeStartTime"
                value={formData.routeStartTime}
                onChange={handleChange}
                required
              />
              <p className="form-help">Time when drivers begin their routes (24-hour format)</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="maxHoursPerDriver">Max Hours Per Driver</label>
              <input
                type="number"
                id="maxHoursPerDriver"
                name="maxHoursPerDriver"
                min="1"
                max="12"
                step="0.5"
                value={formData.maxHoursPerDriver}
                onChange={handleChange}
                required
              />
              <p className="form-help">Maximum working hours allowed per driver (1-12 hours)</p>
            </div>
            
            <div className="simulation-rules">
              <h3>Simulation Rules</h3>
              <ul>
                <li><strong>Late Delivery:</strong> If delivery time > (base route time + 10 minutes), it's considered late</li>
                <li><strong>Late Penalty:</strong> ₹50 penalty for late deliveries</li>
                <li><strong>Driver Fatigue:</strong> If a driver worked >8 hours yesterday, delivery time increases by 30%</li>
                <li><strong>High-Value Bonus:</strong> 10% bonus for on-time deliveries of orders >₹1000</li>
                <li><strong>Fuel Cost:</strong> ₹5/km base + ₹2/km surcharge for high traffic</li>
              </ul>
            </div>
            
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Running Simulation...' : 'Run Simulation'}
            </button>
            
            {error && <div className="error-message">{error}</div>}
          </form>
        </div>
        
        {simulationResult && (
          <div className="simulation-results">
            <h2>Simulation Results</h2>
            <div className="result-summary">
              <div className="result-card">
                <h3>Total Profit</h3>
                <p className="result-value">₹{simulationResult.results.totalProfit.toFixed(2)}</p>
              </div>
              
              <div className="result-card">
                <h3>Efficiency Score</h3>
                <p className="result-value">{simulationResult.results.efficiencyScore.toFixed(1)}%</p>
              </div>
              
              <div className="result-card">
                <h3>Deliveries</h3>
                <p className="result-value">{simulationResult.results.totalDeliveries}</p>
                <div className="result-subtext">
                  <span className="on-time">{simulationResult.results.onTimeDeliveries} on time</span>
                  <span className="late">{simulationResult.results.lateDeliveries} late</span>
                </div>
              </div>
              
              <div className="result-card">
                <h3>Fuel Costs</h3>
                <p className="result-value">₹{simulationResult.results.fuelCosts.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="driver-assignments">
              <h3>Driver Assignments</h3>
              <table className="assignments-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Orders</th>
                    <th>Hours</th>
                    <th>Distance (km)</th>
                  </tr>
                </thead>
                <tbody>
                  {simulationResult.driverAssignments.map((assignment, index) => (
                    <tr key={index}>
                      <td>Driver {index + 1}</td>
                      <td>{assignment.orderCount}</td>
                      <td>{assignment.totalHours.toFixed(1)}</td>
                      <td>{assignment.totalDistance.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="simulation-actions">
              <button 
                className="btn-primary" 
                onClick={handleApplySimulation} 
                disabled={loading}
              >
                Apply Simulation
              </button>
              <button 
                className="btn-secondary" 
                onClick={handleViewDetails}
              >
                View Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Simulation;