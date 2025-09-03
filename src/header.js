import React from 'react';
import './header.css';

const Header = ({ headeruser, headeruserinfo }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <h1>🏙️ Blog City</h1>
          <p className="header-tagline">Share your thoughts with the world</p>
        </div>
        
        {headeruser ? (
          <div className="header-user">
            <div className="user-avatar">
              <span className="avatar-text">{headeruser.charAt(0).toUpperCase()}</span>
            </div>
            <div className="user-info">
              <div className="user-name">{headeruser}</div>
              <div className="user-id">ID: {headeruserinfo}</div>
            </div>
          </div>
        ) : (
          <div className="header-guest">
            <span className="guest-text">Welcome! Please sign in to continue</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 