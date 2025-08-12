import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RoutesManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    routeId: '',
    distanceKm: 0,
    trafficLevel: 'Medium',
    baseTimeMinutes: 0,
    startLocation: '',
    endLocation: '',
    description: '',
    isActive: true
  });

  // Fetch routes on component mount
  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/routes');
      setRoutes(response.data.routes);
      setError(null);
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError('Failed to load routes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : 
              (name === 'distanceKm' || name === 'baseTimeMinutes') ? 
              parseFloat(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingRoute) {
        // Update existing route
        await axios.put(`/api/routes/${editingRoute._id}`, formData);
      } else {
        // Create new route
        await axios.post('/api/routes', formData);
      }
      
      // Reset form and refresh routes list
      resetForm();
      fetchRoutes();
    } catch (err) {
      console.error('Error saving route:', err);
      setError(err.response?.data?.message || 'Failed to save route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (route) => {
    setEditingRoute(route);
    setFormData({
      routeId: route.routeId,
      distanceKm: route.distanceKm,
      trafficLevel: route.trafficLevel,
      baseTimeMinutes: route.baseTimeMinutes,
      startLocation: route.startLocation || '',
      endLocation: route.endLocation || '',
      description: route.description || '',
      isActive: route.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`/api/routes/${routeId}`);
      fetchRoutes();
    } catch (err) {
      console.error('Error deleting route:', err);
      setError(err.response?.data?.message || 'Failed to delete route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      routeId: '',
      distanceKm: 0,
      trafficLevel: 'Medium',
      baseTimeMinutes: 0,
      startLocation: '',
      endLocation: '',
      description: '',
      isActive: true
    });
    setEditingRoute(null);
    setShowForm(false);
  };

  // Helper function to calculate fuel cost
  const calculateFuelCost = (distance, trafficLevel) => {
    let fuelCost = distance * 5; // Base cost: ₹5/km
    
    // If traffic level is "High" → +₹2/km fuel surcharge
    if (trafficLevel === 'High') {
      fuelCost += distance * 2;
    }
    
    return fuelCost.toFixed(2);
  };

  // Helper function to get traffic level badge class
  const getTrafficLevelClass = (level) => {
    switch (level) {
      case 'Low': return 'traffic-low';
      case 'Medium': return 'traffic-medium';
      case 'High': return 'traffic-high';
      default: return '';
    }
  };

  if (loading && routes.length === 0) {
    return <div className="loading">Loading routes...</div>;
  }

  return (
    <div className="routes-management">
      <div className="page-header">
        <h1>Routes Management</h1>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add New Route'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Route Form */}
      {showForm && (
        <div className="route-form-container">
          <h2>{editingRoute ? 'Edit Route' : 'Add New Route'}</h2>
          <form onSubmit={handleSubmit} className="route-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="routeId">Route ID</label>
                <input
                  type="text"
                  id="routeId"
                  name="routeId"
                  value={formData.routeId}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="distanceKm">Distance (km)</label>
                <input
                  type="number"
                  id="distanceKm"
                  name="distanceKm"
                  min="0.1"
                  step="0.1"
                  value={formData.distanceKm}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="trafficLevel">Traffic Level</label>
                <select
                  id="trafficLevel"
                  name="trafficLevel"
                  value={formData.trafficLevel}
                  onChange={handleChange}
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="baseTimeMinutes">Base Time (minutes)</label>
                <input
                  type="number"
                  id="baseTimeMinutes"
                  name="baseTimeMinutes"
                  min="1"
                  step="1"
                  value={formData.baseTimeMinutes}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startLocation">Start Location</label>
                <input
                  type="text"
                  id="startLocation"
                  name="startLocation"
                  value={formData.startLocation}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="endLocation">End Location</label>
                <input
                  type="text"
                  id="endLocation"
                  name="endLocation"
                  value={formData.endLocation}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
              ></textarea>
            </div>
            
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                Active Route
              </label>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Route'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Routes List */}
      <div className="routes-list">
        {routes.length === 0 ? (
          <div className="no-data">No routes found. Add a new route to get started.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Route ID</th>
                <th>Distance</th>
                <th>Traffic</th>
                <th>Base Time</th>
                <th>Locations</th>
                <th>Fuel Cost</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.map(route => (
                <tr key={route._id} className={route.isActive ? '' : 'inactive'}>
                  <td>{route.routeId}</td>
                  <td>{route.distanceKm} km</td>
                  <td>
                    <span className={`traffic-badge ${getTrafficLevelClass(route.trafficLevel)}`}>
                      {route.trafficLevel}
                    </span>
                  </td>
                  <td>{route.baseTimeMinutes} min</td>
                  <td>
                    {route.startLocation && route.endLocation ? (
                      <span>{route.startLocation} → {route.endLocation}</span>
                    ) : (
                      <span className="text-muted">Not specified</span>
                    )}
                  </td>
                  <td>₹{calculateFuelCost(route.distanceKm, route.trafficLevel)}</td>
                  <td>
                    <span className={`status-badge ${route.isActive ? 'active' : 'inactive'}`}>
                      {route.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="btn-icon edit" 
                      onClick={() => handleEdit(route)}
                      title="Edit Route"
                    >
                      <span className="material-icons">edit</span>
                    </button>
                    <button 
                      className="btn-icon delete" 
                      onClick={() => handleDelete(route._id)}
                      title="Delete Route"
                    >
                      <span className="material-icons">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RoutesManagement;