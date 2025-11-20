import React from 'react';
import './CategoryTag.css';

const CategoryTag = ({ category, onClick, clickable = false }) => {
  const handleClick = (e) => {
    if (clickable && onClick) {
      e.stopPropagation();
      onClick(category.id);
    }
  };

  return (
    <span
      className={`category-tag ${clickable ? 'clickable' : ''}`}
      onClick={handleClick}
      style={{
        '--category-color': category.color || '#6a6a6a'
      }}
      title={clickable ? `Filter by ${category.name}` : category.name}
    >
      {category.name}
    </span>
  );
};

export default CategoryTag;


