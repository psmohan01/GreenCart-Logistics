import React from 'react';
import { useParams } from 'react-router-dom';

const SimulationDetail = () => {
  const { id } = useParams();
  
  return (
    <div className="container mt-4">
      <h2>Simulation Detail</h2>
      <p>Viewing details for simulation ID: {id}</p>
    </div>
  );
};

export default SimulationDetail;