import React, { useState, useEffect, useRef } from "react";
import "./searchbar.css";

const SearchBar = ({ onSearchResults }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const searchBoxRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(event.target)
      ) {
        setError("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

    fetch(`http://localhost:3001/search?q=${encodeURIComponent(searchTerm.trim())}`)
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
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
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