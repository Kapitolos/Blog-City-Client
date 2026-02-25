import React, { useState } from 'react';
import './CommentForm.css';
import { API_BASE_URL } from '../config.js';

const CommentForm = ({ postId, userId, userName, onSubmit, onCancel }) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      setError('Please enter a comment');
      return;
    }
    
    if (commentText.trim().length > 1000) {
      setError('Comment cannot exceed 1000 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    fetch(`${API_BASE_URL}/comment`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blog_id: postId,
        user_id: userId,
        user_name: userName,
        comment_text: commentText.trim()
      })
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Failed to post comment');
          });
        }
        return response.json();
      })
      .then(newComment => {
        setCommentText('');
        setIsSubmitting(false);
        if (onSubmit) {
          onSubmit(newComment);
        }
      })
      .catch(err => {
        console.error('Error posting comment:', err);
        setError(err.message || 'Failed to post comment. Please try again.');
        setIsSubmitting(false);
      });
  };

  if (!userId) {
    return (
      <div className="comment-form-signin-prompt">
        <p>Please sign in to leave a comment.</p>
      </div>
    );
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {error && (
        <div className="comment-form-error">
          {error}
        </div>
      )}
      
      <div className="comment-form-group">
        <textarea
          className="comment-textarea"
          placeholder="Write your comment here... (Press Ctrl+Enter to submit)"
          value={commentText}
          onChange={(e) => {
            setCommentText(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 'Enter') {
              e.preventDefault();
              if (!isSubmitting && commentText.trim()) {
                handleSubmit(e);
              }
            }
          }}
          maxLength={1000}
          rows={3}
          required
        />
        <div className="comment-form-footer">
          <span className="comment-char-count">
            {commentText.length}/1000
          </span>
          <div className="comment-form-actions">
            {onCancel && (
              <button
                type="button"
                className="comment-cancel-btn"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="comment-submit-btn"
              disabled={isSubmitting || !commentText.trim()}
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;


