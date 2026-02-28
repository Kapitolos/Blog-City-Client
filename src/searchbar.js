import React, { useState, useEffect, useRef } from "react";
import "./searchbar.css";
import { API_BASE_URL } from './config.js';

const MOBILE_BREAKPOINT = 768;

const SearchBar = ({ onSearchResults }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);

  const searchBoxRef = useRef(null);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const handleChange = (e) => {
      setIsMobile(e.matches);
      if (!e.matches) setMobileDropdownOpen(false);
    };
    handleChange(mql);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target)
      ) {
        setError("");
        if (isMobile) setMobileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile]);

  const handleSearchTermChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (!searchTerm.trim()) {
      setError("Please enter a search term");
      return;
    }

    setIsLoading(true);
    setError("");

    fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(searchTerm.trim())}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Search failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setIsLoading(false);
        // Pass results to parent component
        if (onSearchResults) {
          onSearchResults(data, searchTerm.trim());
        }
        if (data.length === 0) {
          setError(`No blog posts found for "${searchTerm}"`);
        }
      })
      .catch((err) => {
        console.error('Search error:', err);
        setError("Search failed. Please try again.");
        setIsLoading(false);
      });
  };

  const searchIcon = (
    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.35-4.35"></path>
    </svg>
  );

  if (isMobile) {
    return (
      <div ref={searchBoxRef} className="search-container search-container--mobile">
        <button
          type="button"
          className="search-mobile-icon-trigger"
          onClick={() => setMobileDropdownOpen((o) => !o)}
          aria-label="Open search"
          aria-expanded={mobileDropdownOpen}
        >
          {searchIcon}
        </button>
        {mobileDropdownOpen && (
          <div className="search-mobile-dropdown">
            <form onSubmit={handleSubmit} className="search-form">
              <div className="search-input-container">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchTermChange}
                  placeholder="Search blog posts..."
                  className="search-input"
                  autoFocus
                />
                <button type="submit" disabled={isLoading} className="search-icon-button">
                  {isLoading ? (
                    <div className="search-spinner"></div>
                  ) : (
                    searchIcon
                  )}
                </button>
              </div>
            </form>
            {error && (
              <div className="search-error">
                {error}
              </div>
            )}
            {isLoading && (
              <div className="search-loading">
                <div className="spinner"></div>
                <p>Searching blog posts...</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={searchBoxRef} className="search-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchTermChange}
            placeholder="Search blog posts..."
            className="search-input"
          />
          <button type="submit" disabled={isLoading} className="search-icon-button">
            {isLoading ? (
              <div className="search-spinner"></div>
            ) : (
              searchIcon
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="search-error">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="search-loading">
          <div className="spinner"></div>
          <p>Searching blog posts...</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;