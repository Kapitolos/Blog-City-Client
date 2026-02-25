import React, { useState, useEffect } from 'react';
import './Avatar.css';
import { API_BASE_URL } from '../config.js';

const Avatar = ({ userId, userName, size = 'medium', showUpload = false, onUpload }) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      fetch(`${API_BASE_URL}/avatar/${userId}`)
        .then(response => response.json())
        .then(data => {
          if (data.avatar_url) {
            setAvatarUrl(`${API_BASE_URL}${data.avatar_url}`);
          }
        })
        .catch(err => {
          console.error('Error fetching avatar:', err);
        });
    }
  }, [userId]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('user_id', userId);

    fetch(`${API_BASE_URL}/upload-avatar`, {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Failed to upload avatar');
          });
        }
        return response.json();
      })
      .then(data => {
        setAvatarUrl(`${API_BASE_URL}${data.url}`);
        setIsUploading(false);
        if (onUpload) {
          onUpload(data.url);
        }
      })
      .catch(err => {
        console.error('Error uploading avatar:', err);
        setError(err.message || 'Failed to upload avatar');
        setIsUploading(false);
      });
  };

  const getInitials = () => {
    if (!userName) return '?';
    const names = userName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return userName[0].toUpperCase();
  };

  return (
    <div className="avatar-wrapper">
      <div className={`avatar-container avatar-${size}`}>
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={userName || 'User avatar'} 
            className="avatar-image"
            onError={() => setAvatarUrl(null)} // Fallback to initials if image fails to load
          />
        ) : (
          <div className="avatar-initials">
            {getInitials()}
          </div>
        )}
        
        {showUpload && userId && (
          <div className="avatar-upload-overlay">
            <label className="avatar-upload-label" title="Upload avatar">
              {isUploading ? (
                <span className="avatar-upload-spinner">⏳</span>
              ) : (
                <span className="avatar-upload-icon">📷</span>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="avatar-upload-input"
                disabled={isUploading}
              />
            </label>
          </div>
        )}
        
        {error && (
          <div className="avatar-error">
            {error}
          </div>
        )}
      </div>
      {showUpload && userId && (
        <div className="avatar-upload-info">
          <p className="avatar-info-text">
            Max size: 2MB • Recommended: Square image (e.g., 200x200px)
          </p>
        </div>
      )}
    </div>
  );
};

export default Avatar;



