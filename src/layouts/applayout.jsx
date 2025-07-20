import React from 'react';
import Sidebar from '../components/sidebar';
import { Outlet } from 'react-router-dom';

const AppLayout = () => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '230px', padding: '20px', width: '100%' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
