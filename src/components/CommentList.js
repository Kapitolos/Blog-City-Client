import React, { useState } from 'react';
import './CommentList.css';
import ConfirmDialog from './ConfirmDialog.js';
import Avatar from './Avatar.js';
import { formatRelativeTime, formatDate } from '../utils/dateUtils.js';
import { API_BASE_URL } from '../config.js';

const CommentList = ({ comments, currentUserId, onDelete }) => {
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  if (!comments || comments.length === 0) {
    return (
      <div className="comment-list-empty">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  const handleDeleteClick = (commentId, e) => {
    e.stopPropagation();
    setDeletingCommentId(commentId);
  };

  const confirmDelete = () => {
    if (!deletingCommentId) return;

    fetch(`${API_BASE_URL}/comment/${deletingCommentId}?user_id=${currentUserId}`, {
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
          onDelete(deletingCommentId);
        }
        setDeletingCommentId(null);
      })
      .catch(err => {
        console.error('Error deleting comment:', err);
        alert(err.message || 'Failed to delete comment');
        setDeletingCommentId(null);
      });
  };

  const cancelDelete = () => {
    setDeletingCommentId(null);
  };

  return (
    <div className="comment-list">
      {comments.map((comment) => (
        <div key={comment.id} className="comment-item">
          <div className="comment-header">
            <div className="comment-author-info">
              <Avatar 
                userId={comment.user_id}
                userName={comment.user_name}
                size="small"
              />
              <div className="comment-author-details">
                <span className="comment-author-name">{comment.user_name}</span>
                <span 
                  className="comment-date"
                  title={formatDate(comment.created_at)}
                >
                  {formatRelativeTime(comment.created_at)}
                </span>
              </div>
            </div>
            {currentUserId && currentUserId === comment.user_id && (
              <button
                className="comment-delete-btn"
                onClick={(e) => handleDeleteClick(comment.id, e)}
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
      
      <ConfirmDialog
        isOpen={!!deletingCommentId}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        type="danger"
      />
    </div>
  );
};

export default CommentList;


