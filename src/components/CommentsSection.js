import React, { useState, useEffect } from 'react';
import './CommentsSection.css';
import { API_BASE_URL } from '../config.js';
import CommentForm from './CommentForm.js';
import CommentList from './CommentList.js';

const CommentsSection = ({ postId, userId, userName, onCommentCountChange }) => {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComments = () => {
    if (!postId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');

    fetch(`${API_BASE_URL}/comments/${postId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }
        return response.text();
      })
      .then(text => {
        let data = [];
        if (text && text.trim()) {
          try {
            const parsed = JSON.parse(text);
            data = Array.isArray(parsed) ? parsed : [];
          } catch {
            data = [];
          }
        }
        setComments(data);
        setError('');
        setIsLoading(false);
        if (onCommentCountChange) {
          onCommentCountChange(data.length);
        }
      })
      .catch(err => {
        console.error('Error fetching comments:', err);
        setError('Failed to load comments');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!postId) {
      setComments([]);
      setError('');
      setIsLoading(false);
      return;
    }
    fetchComments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleCommentSubmit = (newComment) => {
    // Add new comment to the list
    setComments(prevComments => [...prevComments, newComment]);
    
    // Notify parent of comment count change
    if (onCommentCountChange) {
      onCommentCountChange(comments.length + 1);
    }
  };

  const handleCommentDelete = (commentId) => {
    // Remove deleted comment from the list
    setComments(prevComments => prevComments.filter(c => c.id !== commentId));
    
    // Notify parent of comment count change
    if (onCommentCountChange) {
      onCommentCountChange(comments.length - 1);
    }
  };

  return (
    <div className="comments-section">
      <div className="comments-section-header">
        <h3 className="comments-title">
          Comments ({comments.length})
        </h3>
      </div>

      {error && (
        <div className="comments-error">
          {error}
        </div>
      )}

      <CommentForm
        postId={postId}
        userId={userId}
        userName={userName}
        onSubmit={handleCommentSubmit}
      />

      {isLoading ? (
        <div className="comments-loading">
          <p>Loading comments...</p>
        </div>
      ) : (
        <CommentList
          comments={comments}
          currentUserId={userId}
          onDelete={handleCommentDelete}
        />
      )}
    </div>
  );
};

export default CommentsSection;




