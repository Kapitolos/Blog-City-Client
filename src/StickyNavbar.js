import React from 'react';
import './StickyNavbar.css';
import SearchBar from './searchbar';

const StickyNavbar = ({ isSignedIn, user, onRouteChange, loadUser, signout, onSearchResults }) => {
  return (
    <nav className="sticky-navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <h2 
            className="navbar-title"
            onClick={() => onRouteChange('blogs')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onRouteChange('blogs');
              }
            }}
            aria-label="Go to home page"
          >
            🏙️ Blog City
          </h2>
        </div>
        
        <div className="navbar-search">
          <SearchBar onSearchResults={onSearchResults} />
        </div>
        
        <div className="navbar-actions">
          {isSignedIn ? (
            <div className="user-section">
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-id">ID: {user.id}</span>
              </div>
              <button onClick={signout} className="btn btn-outline">
                Sign Out
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button 
                onClick={() => onRouteChange('signin')} 
                className="btn btn-primary"
              >
                Sign In
              </button>
              <button 
                onClick={() => onRouteChange('register')} 
                className="btn btn-secondary"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default StickyNavbar;
