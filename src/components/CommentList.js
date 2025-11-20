import React from 'react';
import './CommentList.css';
import { formatRelativeTime, formatDate } from '../utils/dateUtils.js';

const CommentList = ({ comments, currentUserId, onDelete }) => {
  if (!comments || comments.length === 0) {
    return (
      <div className="comment-list-empty">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  const handleDelete = (commentId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    fetch(`http://localhost:3001/comment/${commentId}?user_id=${currentUserId}`, {
      method: 'delete',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Failed to delete comment');
          });
        }
        return response.json();
      })
      .then(() => {
        if (onDelete) {
          onDelete(commentId);
        }
      })
      .catch(err => {
        console.error('Error deleting comment:', err);
        alert(err.message || 'Failed to delete comment');
      });
  };

  return (
    <div className="comment-list">
      {comments.map((comment) => (
        <div key={comment.id} className="comment-item">
          <div className="comment-header">
            <div className="comment-author-info">
              <span className="comment-author-name">{comment.user_name}</span>
              <span 
                className="comment-date"
                title={formatDate(comment.created_at)}
              >
                {formatRelativeTime(comment.created_at)}
              </span>
            </div>
            {currentUserId && currentUserId === comment.user_id && (
              <button
                className="comment-delete-btn"
                onClick={(e) => handleDelete(comment.id, e)}
                title="Delete comment"
                aria-label="Delete comment"
              >
                ✕
              </button>
            )}
          </div>
          <div className="comment-text">
            {comment.comment_text}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentList;


