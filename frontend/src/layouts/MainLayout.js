import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MainLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Helper function to check if a path is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="main-layout">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <span className="material-icons">{isSidebarOpen ? 'menu_open' : 'menu'}</span>
          </button>
          <h1 className="app-title">GreenCart Logistics</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{currentUser?.name}</span>
            <div className="user-dropdown">
              <Link to="/profile">Profile</Link>
              <button onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      </header>

      <div className="content-container">
        {/* Sidebar */}
        <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            <ul>
              <li className={isActive('/') ? 'active' : ''}>
                <Link to="/">
                  <span className="material-icons">dashboard</span>
                  <span className="nav-text">Dashboard</span>
                </Link>
              </li>
              <li className={isActive('/simulation') ? 'active' : ''}>
                <Link to="/simulation">
                  <span className="material-icons">science</span>
                  <span className="nav-text">Run Simulation</span>
                </Link>
              </li>
              <li className={isActive('/simulation/history') ? 'active' : ''}>
                <Link to="/simulation/history">
                  <span className="material-icons">history</span>
                  <span className="nav-text">Simulation History</span>
                </Link>
              </li>
              <li className={isActive('/drivers') ? 'active' : ''}>
                <Link to="/drivers">
                  <span className="material-icons">person</span>
                  <span className="nav-text">Drivers</span>
                </Link>
              </li>
              <li className={isActive('/routes') ? 'active' : ''}>
                <Link to="/routes">
                  <span className="material-icons">route</span>
                  <span className="nav-text">Routes</span>
                </Link>
              </li>
              <li className={isActive('/orders') ? 'active' : ''}>
                <Link to="/orders">
                  <span className="material-icons">local_shipping</span>
                  <span className="nav-text">Orders</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;