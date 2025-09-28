import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import './AccessDenied.css';

const AccessDenied = ({ onLogout }) => {
  return (
    <div className="access-denied-container">
      <div className="access-denied-card">
        <div className="access-denied-icon">
          <Shield size={80} />
        </div>
        
        <h1 className="access-denied-title">Access Denied</h1>
        
        <p className="access-denied-message">
          This portal is for administrators only. You don't have the required permissions to access this dashboard.
        </p>
        
        <div className="access-denied-details">
          <p>If you believe this is an error, please contact your system administrator.</p>
        </div>
        
        <button 
          className="access-denied-button"
          onClick={onLogout}
        >
          <ArrowLeft size={20} />
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;
