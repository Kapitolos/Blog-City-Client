import React, { useState, useEffect } from 'react';
import './LikeButton.css';

const LikeButton = ({ postId, userId, initialLikeCount = 0, initialIsLiked = false, onLikeChange }) => {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch initial like status if userId is provided
  useEffect(() => {
    if (postId && userId && !isInitialized) {
      fetch(`http://localhost:3001/likes/${postId}?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
          setLikeCount(data.likeCount || 0);
          setIsLiked(data.isLiked || false);
          setIsInitialized(true);
        })
        .catch(err => {
          console.error('Error fetching like status:', err);
          setIsInitialized(true);
        });
    } else if (postId && !userId) {
      // If no user, just fetch count
      fetch(`http://localhost:3001/likes/${postId}`)
        .then(response => response.json())
        .then(data => {
          setLikeCount(data.likeCount || 0);
          setIsInitialized(true);
        })
        .catch(err => {
          console.error('Error fetching like count:', err);
          setIsInitialized(true);
        });
    } else {
      setIsInitialized(true);
    }
  }, [postId, userId, isInitialized]);

  const handleLikeToggle = (e) => {
    e.stopPropagation(); // Prevent triggering parent click events
    
    if (!userId) {
      // User not signed in - could show a toast or redirect to sign in
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    
    fetch(`http://localhost:3001/like/${postId}`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    })
      .then(response => response.json())
      .then(data => {
        setLikeCount(data.likeCount || 0);
        setIsLiked(data.liked);
        setIsLoading(false);
        
        // Notify parent component if callback provided
        if (onLikeChange) {
          onLikeChange(data.liked, data.likeCount);
        }
      })
      .catch(err => {
        console.error('Error toggling like:', err);
        setIsLoading(false);
      });
  };

  return (
    <button
      className={`like-button ${isLiked ? 'liked' : ''} ${isLoading ? 'loading' : ''}`}
      onClick={handleLikeToggle}
      disabled={isLoading || !userId}
      title={!userId ? 'Sign in to like posts' : isLiked ? 'Unlike this post' : 'Like this post'}
      aria-label={isLiked ? 'Unlike this post' : 'Like this post'}
    >
      <span className="like-icon">
        {isLiked ? '❤️' : '🤍'}
      </span>
      <span className="like-count">{likeCount}</span>
    </button>
  );
};

export default LikeButton;


