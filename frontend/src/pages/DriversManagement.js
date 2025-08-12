import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DriversManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    status: 'available'
  });

  // Fetch drivers on component mount
  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/drivers');
      setDrivers(response.data.drivers);
      setError(null);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Failed to load drivers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingDriver) {
        // Update existing driver
        await axios.put(`/api/drivers/${editingDriver._id}`, formData);
      } else {
        // Create new driver
        await axios.post('/api/drivers', formData);
      }
      
      // Reset form and refresh drivers list
      resetForm();
      fetchDrivers();
    } catch (err) {
      console.error('Error saving driver:', err);
      setError(err.response?.data?.message || 'Failed to save driver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phoneNumber: driver.phoneNumber || '',
      email: driver.email || '',
      status: driver.status
    });
    setShowForm(true);
  };

  const handleDelete = async (driverId) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`/api/drivers/${driverId}`);
      fetchDrivers();
    } catch (err) {
      console.error('Error deleting driver:', err);
      setError(err.response?.data?.message || 'Failed to delete driver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phoneNumber: '',
      email: '',
      status: 'available'
    });
    setEditingDriver(null);
    setShowForm(false);
  };

  // Helper function to display driver fatigue status
  const getFatigueStatus = (driver) => {
    if (driver.isFatigued) {
      return <span className="status-badge fatigue">Fatigued</span>;
    }
    return null;
  };

  // Helper function to format work hours
  const formatWorkHours = (hours) => {
    return hours.map((hour, index) => {
      const day = index === 0 ? 'Today' : 
                 index === 1 ? 'Yesterday' : 
                 `${index} days ago`;
      return (
        <div key={index} className="work-hour-item">
          <span className="day">{day}:</span>
          <span className="hours">{hour} hrs</span>
        </div>
      );
    });
  };

  if (loading && drivers.length === 0) {
    return <div className="loading">Loading drivers...</div>;
  }

  return (
    <div className="drivers-management">
      <div className="page-header">
        <h1>Drivers Management</h1>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add New Driver'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Driver Form */}
      {showForm && (
        <div className="driver-form-container">
          <h2>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h2>
          <form onSubmit={handleSubmit} className="driver-form">
            <div className="form-group">
              <label htmlFor="name">Driver Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="available">Available</option>
                <option value="on-route">On Route</option>
                <option value="off-duty">Off Duty</option>
              </select>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Driver'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Drivers List */}
      <div className="drivers-list">
        {drivers.length === 0 ? (
          <div className="no-data">No drivers found. Add a new driver to get started.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Current Shift</th>
                <th>Work History</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(driver => (
                <tr key={driver._id}>
                  <td>
                    {driver.name}
                    {getFatigueStatus(driver)}
                  </td>
                  <td>
                    <span className={`status-badge ${driver.status}`}>
                      {driver.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td>{driver.currentShiftHours} hours</td>
                  <td className="work-history">
                    {formatWorkHours(driver.pastWeekWorkHours)}
                  </td>
                  <td>
                    {driver.phoneNumber && <div>{driver.phoneNumber}</div>}
                    {driver.email && <div>{driver.email}</div>}
                  </td>
                  <td className="actions">
                    <button 
                      className="btn-icon edit" 
                      onClick={() => handleEdit(driver)}
                      title="Edit Driver"
                    >
                      <span className="material-icons">edit</span>
                    </button>
                    <button 
                      className="btn-icon delete" 
                      onClick={() => handleDelete(driver._id)}
                      title="Delete Driver"
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

export default DriversManagement;