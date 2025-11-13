/**
 * VectorDBAdminPage
 * 
 * Admin page for Vector DB access request management
 */

import React from 'react';
import VectorDBAdminDashboard from '../components/VectorDBAdminDashboard';

const VectorDBAdminPage: React.FC = () => {
  return (
    <div className="vector-db-admin-page">
      <VectorDBAdminDashboard />
    </div>
  );
};

export default VectorDBAdminPage;
