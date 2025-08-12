import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { currentUser } = useAuth();
  
  return (
    <div className="container mt-4">
      <h2>User Profile</h2>
      {currentUser && (
        <div>
          <p><strong>Email:</strong> {currentUser.email}</p>
        </div>
      )}
    </div>
  );
};

export default Profile;