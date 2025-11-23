import React from 'react';
import './LoadingSkeleton.css';

const LoadingSkeleton = ({ count = 3, type = 'blog-card' }) => {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div key={i} className={`skeleton skeleton-${type}`}>
      {type === 'blog-card' && (
        <>
          <div className="skeleton-header">
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line skeleton-author"></div>
          </div>
          <div className="skeleton-content">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line skeleton-short"></div>
          </div>
          <div className="skeleton-footer">
            <div className="skeleton-line skeleton-date"></div>
          </div>
        </>
      )}
      {type === 'post-item' && (
        <>
          <div className="skeleton-header">
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line skeleton-date"></div>
          </div>
          <div className="skeleton-content">
            <div className="skeleton-line"></div>
            <div className="skeleton-line skeleton-short"></div>
          </div>
        </>
      )}
    </div>
  ));

  return <>{skeletons}</>;
};

export default LoadingSkeleton;




