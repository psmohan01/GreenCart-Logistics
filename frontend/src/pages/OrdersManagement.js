import React, { useState, useEffect } from 'react';
import axios from 'axios';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    orderId: '',
    valueRs: 0,
    assignedRoute: '',
    deliveryTimestamp: '',
    customerName: '',
    customerContact: '',
    deliveryAddress: '',
    notes: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchOrders();
    fetchRoutes();
    fetchDrivers();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data.orders);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('/api/routes?isActive=true');
      setRoutes(response.data.routes);
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await axios.get('/api/drivers?status=available');
      setDrivers(response.data.drivers);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'valueRs' ? parseFloat(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingOrder) {
        // Update existing order
        await axios.put(`/api/orders/${editingOrder._id}`, formData);
      } else {
        // Create new order
        await axios.post('/api/orders', formData);
      }
      
      // Reset form and refresh orders list
      resetForm();
      fetchOrders();
    } catch (err) {
      console.error('Error saving order:', err);
      setError(err.response?.data?.message || 'Failed to save order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    
    // Format date for datetime-local input
    const deliveryDate = new Date(order.deliveryTimestamp);
    const formattedDate = deliveryDate.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    
    setFormData({
      orderId: order.orderId,
      valueRs: order.valueRs,
      assignedRoute: order.assignedRoute._id || order.assignedRoute,
      deliveryTimestamp: formattedDate,
      customerName: order.customerName || '',
      customerContact: order.customerContact || '',
      deliveryAddress: order.deliveryAddress || '',
      notes: order.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`/api/orders/${orderId}`);
      fetchOrders();
    } catch (err) {
      console.error('Error deleting order:', err);
      setError(err.response?.data?.message || 'Failed to delete order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      orderId: '',
      valueRs: 0,
      assignedRoute: '',
      deliveryTimestamp: '',
      customerName: '',
      customerContact: '',
      deliveryAddress: '',
      notes: ''
    });
    setEditingOrder(null);
    setShowForm(false);
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'assigned': return 'status-assigned';
      case 'in-transit': return 'status-in-transit';
      case 'delivered': return 'status-delivered';
      case 'delayed': return 'status-delayed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading && orders.length === 0) {
    return <div className="loading">Loading orders...</div>;
  }

  return (
    <div className="orders-management">
      <div className="page-header">
        <h1>Orders Management</h1>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add New Order'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Order Form */}
      {showForm && (
        <div className="order-form-container">
          <h2>{editingOrder ? 'Edit Order' : 'Add New Order'}</h2>
          <form onSubmit={handleSubmit} className="order-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="orderId">Order ID</label>
                <input
                  type="text"
                  id="orderId"
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="valueRs">Order Value (₹)</label>
                <input
                  type="number"
                  id="valueRs"
                  name="valueRs"
                  min="1"
                  step="0.01"
                  value={formData.valueRs}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="assignedRoute">Assigned Route</label>
                <select
                  id="assignedRoute"
                  name="assignedRoute"
                  value={formData.assignedRoute}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a route</option>
                  {routes.map(route => (
                    <option key={route._id} value={route._id}>
                      {route.routeId} ({route.startLocation} → {route.endLocation})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="deliveryTimestamp">Delivery Time</label>
                <input
                  type="datetime-local"
                  id="deliveryTimestamp"
                  name="deliveryTimestamp"
                  value={formData.deliveryTimestamp}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="customerName">Customer Name</label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="customerContact">Customer Contact</label>
                <input
                  type="text"
                  id="customerContact"
                  name="customerContact"
                  value={formData.customerContact}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="deliveryAddress">Delivery Address</label>
              <textarea
                id="deliveryAddress"
                name="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={handleChange}
                rows="2"
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="2"
              ></textarea>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Order'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Orders List */}
      <div className="orders-list">
        {orders.length === 0 ? (
          <div className="no-data">No orders found. Add a new order to get started.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Value</th>
                <th>Route</th>
                <th>Delivery Time</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Profit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>{order.orderId}</td>
                  <td>₹{order.valueRs.toFixed(2)}</td>
                  <td>
                    {order.assignedRoute?.routeId || 'Unknown Route'}
                    {order.assignedDriver && (
                      <div className="driver-info">
                        <span className="driver-label">Driver:</span>
                        <span className="driver-name">{order.assignedDriver.name}</span>
                      </div>
                    )}
                  </td>
                  <td>{formatDate(order.deliveryTimestamp)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {order.status.replace('-', ' ')}
                    </span>
                    {order.isDeliveredOnTime !== null && (
                      <span className={`delivery-badge ${order.isDeliveredOnTime ? 'on-time' : 'late'}`}>
                        {order.isDeliveredOnTime ? 'On Time' : 'Late'}
                      </span>
                    )}
                  </td>
                  <td>
                    {order.customerName || 'Not specified'}
                    {order.customerContact && <div>{order.customerContact}</div>}
                  </td>
                  <td>
                    {order.profit ? (
                      <span className={order.profit >= 0 ? 'profit-positive' : 'profit-negative'}>
                        ₹{order.profit.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted">Pending</span>
                    )}
                  </td>
                  <td className="actions">
                    <button 
                      className="btn-icon edit" 
                      onClick={() => handleEdit(order)}
                      title="Edit Order"
                      disabled={order.status !== 'pending'}
                    >
                      <span className="material-icons">edit</span>
                    </button>
                    <button 
                      className="btn-icon delete" 
                      onClick={() => handleDelete(order._id)}
                      title="Delete Order"
                      disabled={order.status !== 'pending'}
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

export default OrdersManagement;