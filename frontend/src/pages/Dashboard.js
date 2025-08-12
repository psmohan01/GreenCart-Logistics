import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalProfit: 0,
    efficiencyScore: 0,
    onTimeDeliveries: 0,
    lateDeliveries: 0,
    totalDeliveries: 0,
    fuelCosts: 0,
    highValueBonuses: 0,
    latePenalties: 0,
    fuelCostBreakdown: {
      lowTraffic: 0,
      mediumTraffic: 0,
      highTraffic: 0
    },
    recentSimulations: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch the most recent simulation for KPIs
        const simulationsResponse = await axios.get('/api/simulations?limit=5');
        
        if (simulationsResponse.data.simulations.length > 0) {
          const latestSimulation = simulationsResponse.data.simulations[0];
          
          setDashboardData({
            totalProfit: latestSimulation.results.totalProfit,
            efficiencyScore: latestSimulation.results.efficiencyScore,
            onTimeDeliveries: latestSimulation.results.onTimeDeliveries,
            lateDeliveries: latestSimulation.results.lateDeliveries,
            totalDeliveries: latestSimulation.results.totalDeliveries,
            fuelCosts: latestSimulation.results.fuelCosts,
            highValueBonuses: latestSimulation.results.highValueBonuses,
            latePenalties: latestSimulation.results.latePenalties,
            fuelCostBreakdown: latestSimulation.fuelCostBreakdown,
            recentSimulations: simulationsResponse.data.simulations
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Prepare chart data
  const deliveryStatusData = {
    labels: ['On Time', 'Late'],
    datasets: [
      {
        data: [dashboardData.onTimeDeliveries, dashboardData.lateDeliveries],
        backgroundColor: ['#4CAF50', '#F44336'],
        hoverBackgroundColor: ['#45a049', '#e53935']
      }
    ]
  };

  const fuelCostData = {
    labels: ['Low Traffic', 'Medium Traffic', 'High Traffic'],
    datasets: [
      {
        label: 'Fuel Cost by Traffic Level',
        data: [
          dashboardData.fuelCostBreakdown.lowTraffic,
          dashboardData.fuelCostBreakdown.mediumTraffic,
          dashboardData.fuelCostBreakdown.highTraffic
        ],
        backgroundColor: ['#2196F3', '#FFC107', '#F44336']
      }
    ]
  };

  const profitBreakdownData = {
    labels: ['Order Value', 'High Value Bonuses', 'Late Penalties', 'Fuel Costs'],
    datasets: [
      {
        label: 'Profit Breakdown',
        data: [
          dashboardData.totalProfit + dashboardData.latePenalties + dashboardData.fuelCosts - dashboardData.highValueBonuses,
          dashboardData.highValueBonuses,
          -dashboardData.latePenalties,
          -dashboardData.fuelCosts
        ],
        backgroundColor: ['#4CAF50', '#2196F3', '#F44336', '#FFC107']
      }
    ]
  };

  const efficiencyTrendData = {
    labels: dashboardData.recentSimulations.map((sim, index) => `Sim ${index + 1}`),
    datasets: [
      {
        label: 'Efficiency Score (%)',
        data: dashboardData.recentSimulations.map(sim => sim.results.efficiencyScore),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        tension: 0.4
      }
    ]
  };

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard</ h1>
      
      {/* KPI Cards */}
      <div className="kpi-cards">
        <div className="kpi-card">
          <h3>Total Profit</h3>
          <p className="kpi-value">₹{dashboardData.totalProfit.toFixed(2)}</p>
        </div>
        
        <div className="kpi-card">
          <h3>Efficiency Score</h3>
          <p className="kpi-value">{dashboardData.efficiencyScore.toFixed(1)}%</p>
        </div>
        
        <div className="kpi-card">
          <h3>Deliveries</h3>
          <p className="kpi-value">{dashboardData.totalDeliveries}</p>
          <div className="kpi-subtext">
            <span className="on-time">{dashboardData.onTimeDeliveries} on time</span>
            <span className="late">{dashboardData.lateDeliveries} late</span>
          </div>
        </div>
        
        <div className="kpi-card">
          <h3>Fuel Costs</h3>
          <p className="kpi-value">₹{dashboardData.fuelCosts.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>Delivery Status</h3>
          <Pie data={deliveryStatusData} options={{ responsive: true }} />
        </div>
        
        <div className="chart-container">
          <h3>Fuel Cost by Traffic Level</h3>
          <Bar data={fuelCostData} options={{ responsive: true }} />
        </div>
        
        <div className="chart-container">
          <h3>Profit Breakdown</h3>
          <Bar data={profitBreakdownData} options={{ 
            responsive: true,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }} />
        </div>
        
        <div className="chart-container">
          <h3>Efficiency Trend</h3>
          <Line data={efficiencyTrendData} options={{ 
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                max: 100
              }
            }
          }} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;