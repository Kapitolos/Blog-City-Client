import React, { useState, useEffect } from 'react';
import './UserProfile.css';
import LoadingSkeleton from './components/LoadingSkeleton.js';
import Avatar from './components/Avatar.js';
import { formatRelativeTime, formatDate } from './utils/dateUtils.js';
import { fixPostBodyImageUrls } from './utils/postBodyHtml.js';
import { API_BASE_URL } from './config.js';

const UserProfile = ({ userId, userName, onClose, currentUserId, onUserHidden }) => {
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserPosts();
      if (currentUserId && parseInt(userId) !== parseInt(currentUserId)) {
        checkFollowStatus();
      }
    }
  }, [userId, currentUserId]);

  const checkFollowStatus = () => {
    if (!currentUserId) return;
    
    setIsLoadingStatus(true);
    fetch(`${API_BASE_URL}/follow-status/${userId}?currentUserId=${currentUserId}`)
      .then(response => response.json())
      .then(data => {
        setIsFollowing(data.isFollowing || false);
        setIsHidden(data.isHidden || false);
        setIsLoadingStatus(false);
      })
      .catch(err => {
        console.error('Error checking follow status:', err);
        setIsLoadingStatus(false);
      });
  };

  const fetchUserPosts = () => {
    setIsLoading(true);
    setError('');
    
    fetch(`${API_BASE_URL}/user-posts/${userId}`)
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

  const handleFollow = () => {
    if (!currentUserId) return;
    
    fetch(`${API_BASE_URL}/follow/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setIsFollowing(true);
        }
      })
      .catch(err => {
        console.error('Error following user:', err);
      });
  };

  const handleUnfollow = () => {
    if (!currentUserId) return;
    
    fetch(`${API_BASE_URL}/follow/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setIsFollowing(false);
        }
      })
      .catch(err => {
        console.error('Error unfollowing user:', err);
      });
  };

  const handleHide = () => {
    if (!currentUserId) return;
    
    fetch(`${API_BASE_URL}/hide-user/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setIsHidden(true);
          if (onUserHidden) {
            onUserHidden(userId);
          }
        }
      })
      .catch(err => {
        console.error('Error hiding user:', err);
      });
  };

  const handleUnhide = () => {
    if (!currentUserId) return;
    
    fetch(`${API_BASE_URL}/hide-user/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUserId })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setIsHidden(false);
        }
      })
      .catch(err => {
        console.error('Error unhiding user:', err);
      });
  };

  const isOwnProfile = currentUserId && parseInt(userId) === parseInt(currentUserId);

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
          <div className="user-profile-actions">
            {!isOwnProfile && currentUserId && (
              <>
                {isFollowing ? (
                  <button 
                    className="btn-unfollow"
                    onClick={handleUnfollow}
                    disabled={isLoadingStatus}
                  >
                    ✓ Following
                  </button>
                ) : (
                  <button 
                    className="btn-follow"
                    onClick={handleFollow}
                    disabled={isLoadingStatus}
                  >
                    + Follow
                  </button>
                )}
                {isHidden ? (
                  <button 
                    className="btn-unhide"
                    onClick={handleUnhide}
                    disabled={isLoadingStatus}
                  >
                    👁️ Unhide
                  </button>
                ) : (
                  <button 
                    className="btn-hide"
                    onClick={handleHide}
                    disabled={isLoadingStatus}
                  >
                    🚫 Hide
                  </button>
                )}
              </>
            )}
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>
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
                    __html: fixPostBodyImageUrls(post.postbody ? 
                      (post.postbody.length > 120 ? `${post.postbody.substring(0, 120)}...` : post.postbody) 
                      : '<p>No content available</p>')
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
              dangerouslySetInnerHTML={{ __html: fixPostBodyImageUrls(selectedPost.postbody) }}
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
