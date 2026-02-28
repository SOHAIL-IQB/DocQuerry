import React from 'react';
import './Topbar.css';

const Topbar = () => {
  return (
    <header className="topbar">
      <div className="topbar-content">
        <h1 className="page-title">Workspace</h1>
        
        <div className="topbar-actions">
          <div className="user-profile-btn">
            <div className="avatar">U</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
