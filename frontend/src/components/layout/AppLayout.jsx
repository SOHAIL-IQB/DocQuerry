import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AppLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
