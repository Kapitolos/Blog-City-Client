import React, { useState, useEffect } from 'react';
import './UserProfile.css';
import LoadingSkeleton from './components/LoadingSkeleton.js';
import Avatar from './components/Avatar.js';
import { formatRelativeTime, formatDate } from './utils/dateUtils.js';

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
    <div className="user-profile-modal-overlay" onClick={onClose}>
      <div className="user-profile-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="user-profile-header">
          <div className="user-info">
            <Avatar 
              userId={userId}
              userName={userName}
              size="large"
            />
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
          <div className="user-posts-grid">
            <LoadingSkeleton count={4} type="blog-card" />
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {!isLoading && !error && userPosts.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h4 className="empty-state-title">No Posts Yet</h4>
            <p className="empty-state-message">
              {userName} hasn't published any posts yet.
            </p>
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
                  <span className="post-date" title={post.created_at ? formatDate(post.created_at) : ''}>
                    {post.created_at ? formatRelativeTime(post.created_at) : 'Recently'}
                  </span>
                </div>
                <div 
                  className="post-preview"
                  dangerouslySetInnerHTML={{ 
                    __html: post.postbody ? 
                      (post.postbody.length > 120 ? `${post.postbody.substring(0, 120)}...` : post.postbody) 
                      : '<p>No content available</p>'
                  }}
                />
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
                <span className="post-modal-date" title={formatDate(selectedPost.created_at)}>
                  {formatRelativeTime(selectedPost.created_at)}
                </span>
              )}
            </div>
            
            <div 
              className="post-modal-body"
              dangerouslySetInnerHTML={{ __html: selectedPost.postbody }}
            />
            
            <div className="post-modal-footer">
              <button className="post-modal-close-btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default UserProfile;
