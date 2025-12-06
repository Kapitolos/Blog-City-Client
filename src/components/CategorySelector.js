import React, { useState, useEffect } from 'react';
import './CategorySelector.css';

const CategorySelector = ({ selectedCategories = [], onChange, maxSelections = 3, userId }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6a6a6a');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  useEffect(() => {
    // All categories are public, so no need to pass userId
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
  }, [userId]);

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

  const handleCreateCategory = () => {
    if (!userId) {
      alert('Please sign in to create custom categories');
      return;
    }
    
    if (!newCategoryName || !newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }
    
    setIsCreatingCategory(true);
    
    fetch('http://localhost:3001/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newCategoryName.trim(),
        color: newCategoryColor,
        user_id: userId,
        is_public: true // Public so all users can see and use it
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        setIsCreatingCategory(false);
      } else {
        // Refresh categories list
        fetch('http://localhost:3001/categories')
          .then(response => response.json())
          .then(data => {
            setCategories(Array.isArray(data) ? data : []);
          })
          .catch(err => {
            console.error('Error refreshing categories:', err);
          });
        
        // Reset form
        setShowCreateCategory(false);
        setNewCategoryName('');
        setNewCategoryColor('#6a6a6a');
        setIsCreatingCategory(false);
      }
    })
    .catch(err => {
      console.error('Error creating category:', err);
      alert('Failed to create category. Please try again.');
      setIsCreatingCategory(false);
    });
  };

  if (isLoading) {
    return <div className="category-selector-loading">Loading categories...</div>;
  }

  return (
    <div className="category-selector">
      <div className="category-selector-header">
        <label className="category-selector-label">
          Categories (select up to {maxSelections})
          {selectedCategories.length > 0 && (
            <span className="category-count">({selectedCategories.length}/{maxSelections})</span>
          )}
        </label>
        {userId && (
          <button 
            className="create-category-btn"
            onClick={() => setShowCreateCategory(!showCreateCategory)}
            title="Create custom category"
            type="button"
          >
            {showCreateCategory ? '✕ Cancel' : '+ Create Category'}
          </button>
        )}
      </div>
      
      {/* Create Category Form */}
      {showCreateCategory && userId && (
        <div className="create-category-form">
          <input
            type="text"
            placeholder="Category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="create-category-input"
            maxLength={50}
          />
          <input
            type="color"
            value={newCategoryColor}
            onChange={(e) => setNewCategoryColor(e.target.value)}
            className="create-category-color"
            title="Choose color"
          />
          <button
            onClick={handleCreateCategory}
            disabled={isCreatingCategory || !newCategoryName.trim()}
            className="create-category-submit"
            type="button"
          >
            {isCreatingCategory ? 'Creating...' : 'Create'}
          </button>
        </div>
      )}
      
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
              title={isDisabled ? `Maximum ${maxSelections} categories allowed` : category.user_id ? 'Community-created category' : ''}
            >
              {category.name}
              {category.user_id && <span style={{ marginLeft: '0.25rem', fontSize: '0.7rem', opacity: 0.8 }}>★</span>}
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


