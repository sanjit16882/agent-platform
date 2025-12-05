/**
 * VectorDBPage
 * 
 * Demo page for Vector DB Management
 * Navigate to /vector-db to see the UI
 */

import React from 'react';
import VectorDBManagement from '../components/VectorDBManagement';

const VectorDBPage: React.FC = () => {
  return (
    <div className="vector-db-page">
      <VectorDBManagement />
    </div>
  );
};

export default VectorDBPage;
