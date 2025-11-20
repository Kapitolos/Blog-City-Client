import React from 'react';
import './BlogPostModal.css';
import { formatRelativeTime, formatDate } from './utils/dateUtils.js';

class BlogPostModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      selectedPost: null
    };
  }

  openModal = (post) => {
    this.setState({
      isOpen: true,
      selectedPost: post
    });
  };

  closeModal = () => {
    this.setState({
      isOpen: false,
      selectedPost: null
    });
  };

  render() {
    const { isOpen, selectedPost } = this.state;

    if (!isOpen || !selectedPost) {
      return null;
    }

    return (
      <div className="blog-modal-overlay" onClick={this.closeModal}>
        <div className="blog-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="blog-modal-header">
            <h2 className="blog-modal-title">{selectedPost.posttitle || 'Untitled'}</h2>
            <button className="blog-modal-close" onClick={this.closeModal}>
              ✕
            </button>
          </div>
          
          <div className="blog-modal-meta">
            <span className="blog-modal-author">by {selectedPost.name || 'Anonymous'}</span>
            {selectedPost.created_at && (
              <span className="blog-modal-date" title={formatDate(selectedPost.created_at)}>
                {formatRelativeTime(selectedPost.created_at)}
              </span>
            )}
          </div>
          
          <div className="blog-modal-body">
            <p>{selectedPost.postbody}</p>
          </div>
          
          <div className="blog-modal-footer">
            <button className="blog-modal-close-btn" onClick={this.closeModal}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default BlogPostModal;


