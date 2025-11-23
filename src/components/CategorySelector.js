import React, { useState, useEffect } from 'react';
import './CategorySelector.css';

const CategorySelector = ({ selectedCategories = [], onChange, maxSelections = 3 }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/categories')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        return response.json();
      })
      .then(data => {
        // Ensure data is an array
        const categoriesArray = Array.isArray(data) ? data : [];
        setCategories(categoriesArray);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching categories:', err);
        setCategories([]); // Set empty array on error
        setIsLoading(false);
      });
  }, []);

  const handleCategoryToggle = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      // Remove category
      onChange(selectedCategories.filter(id => id !== categoryId));
    } else {
      // Add category (respect max selections)
      if (selectedCategories.length < maxSelections) {
        onChange([...selectedCategories, categoryId]);
      }
    }
  };

  if (isLoading) {
    return <div className="category-selector-loading">Loading categories...</div>;
  }

  return (
    <div className="category-selector">
      <label className="category-selector-label">
        Categories (select up to {maxSelections})
        {selectedCategories.length > 0 && (
          <span className="category-count">({selectedCategories.length}/{maxSelections})</span>
        )}
      </label>
      <div className="category-options">
        {Array.isArray(categories) && categories.length > 0 ? categories.map(category => {
          const isSelected = selectedCategories.includes(category.id);
          const isDisabled = !isSelected && selectedCategories.length >= maxSelections;
          
          return (
            <button
              key={category.id}
              type="button"
              className={`category-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => handleCategoryToggle(category.id)}
              disabled={isDisabled}
              style={{
                '--category-color': category.color || '#6a6a6a'
              }}
              title={isDisabled ? `Maximum ${maxSelections} categories allowed` : ''}
            >
              {category.name}
            </button>
          );
        }) : (
          <p className="category-empty">No categories available</p>
        )}
      </div>
      {selectedCategories.length === 0 && (
        <p className="category-hint">Select categories to help readers find your post</p>
      )}
    </div>
  );
};

export default CategorySelector;


