import React, { useState, useEffect } from 'react';
import './UserProfile.css';

const UserProfile = ({ userId, userName, onClose }) => {
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserPosts();
    }
  }, [userId]);

  const fetchUserPosts = () => {
    setIsLoading(true);
    setError('');
    
    fetch(`http://localhost:3001/user-posts/${userId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setUserPosts(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching user posts:', err);
        setError('Failed to load user posts');
        setIsLoading(false);
      });
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedPost(null);
    setIsModalOpen(false);
  };

  return (
    <div className="user-profile-container">
      <div className="user-profile-header">
        <div className="user-info">
          <div className="user-avatar">
            <span className="avatar-text">{userName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="user-details">
            <h3>{userName}</h3>
            <p>Blog Author</p>
          </div>
        </div>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>
      
      <div className="user-posts-section">
        <h4>Posts by {userName}</h4>
        
        {isLoading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading posts...</p>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {!isLoading && !error && userPosts.length === 0 && (
          <div className="no-posts-message">
            <p>No posts found for this user.</p>
          </div>
        )}
        
        {!isLoading && !error && userPosts.length > 0 && (
          <div className="user-posts-grid">
            {userPosts.map((post, index) => (
              <div 
                key={post.id || index} 
                className="user-post-card"
                onClick={() => handlePostClick(post)}
              >
                <div className="post-header">
                  <h5 className="post-title">{post.posttitle || 'Untitled'}</h5>
                  <span className="post-date">
                    {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
                <div className="post-preview">
                  <p>{post.postbody ? 
                    (post.postbody.length > 120 ? `${post.postbody.substring(0, 120)}...` : post.postbody) 
                    : 'No content available'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Modal */}
      {isModalOpen && selectedPost && (
        <div className="post-modal-overlay" onClick={closeModal}>
          <div className="post-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="post-modal-header">
              <h2 className="post-modal-title">{selectedPost.posttitle || 'Untitled'}</h2>
              <button className="post-modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>
            
            <div className="post-modal-meta">
              <span className="post-modal-author">by {selectedPost.name || 'Anonymous'}</span>
              {selectedPost.created_at && (
                <span className="post-modal-date">
                  {new Date(selectedPost.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
            
            <div className="post-modal-body">
              <p>{selectedPost.postbody}</p>
            </div>
            
            <div className="post-modal-footer">
              <button className="post-modal-close-btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
