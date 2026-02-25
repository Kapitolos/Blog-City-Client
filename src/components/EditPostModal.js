import React from 'react';
import './EditPostModal.css';
import { API_BASE_URL } from '../config.js';
import RichTextEditor from './RichTextEditor.js';

class EditPostModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      posttitle: props.post.posttitle || '',
      postbody: props.post.postbody || '',
      isSaving: false,
      error: ''
    };
  }

  onTitleChange = (event) => {
    this.setState({ posttitle: event.target.value, error: '' });
  }

  onBodyChange = (content) => {
    // Get plain text for validation
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    if (plainText.length <= 5000) {
      this.setState({ postbody: content, error: '' });
    }
  }

  validateForm = () => {
    if (!this.state.posttitle.trim()) {
      this.setState({ error: 'Please enter a title for your blog post' });
      return false;
    }
    // Get plain text from HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.state.postbody || '';
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    if (!plainText.trim()) {
      this.setState({ error: 'Please write some content for your blog post' });
      return false;
    }
    if (this.state.posttitle.trim().length < 3) {
      this.setState({ error: 'Title must be at least 3 characters long' });
      return false;
    }
    if (plainText.trim().length < 10) {
      this.setState({ error: 'Blog post must be at least 10 characters long' });
      return false;
    }
    return true;
  }

  handleSave = (status = 'published') => {
    // For drafts, only require title or content (not both)
    if (status === 'published' && !this.validateForm()) {
      return;
    }
    
    // For drafts, at least require a title
    if (status === 'draft') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = this.state.postbody || '';
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      if (!this.state.posttitle.trim() && !plainText.trim()) {
        this.setState({ error: 'Please enter a title or content for your draft' });
        return;
      }
    }

    this.setState({ isSaving: true, error: '' });

    fetch(`${API_BASE_URL}/blogpost/${this.props.post.id}`, {
      method: 'put',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        posttitle: this.state.posttitle.trim(),
        postbody: this.state.postbody.trim(),
        user_id: this.props.userId,
        status: status
      })
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Failed to update post');
          });
        }
        return response.json();
      })
      .then(updatedPost => {
        this.setState({ isSaving: false });
        this.props.onSave(updatedPost);
        if (this.props.showToast) {
          const statusMsg = updatedPost.status === 'draft' ? 'Draft saved successfully!' : 'Post updated successfully!';
          this.props.showToast(statusMsg, 'success');
        }
      })
      .catch(err => {
        console.error('Error updating post:', err);
        this.setState({
          isSaving: false,
          error: err.message || 'Failed to update post. Please try again.'
        });
        if (this.props.showToast) {
          this.props.showToast(err.message || 'Failed to update post', 'error');
        }
      });
  }

  render() {
    const { post, onClose } = this.props;
    const { posttitle, postbody, isSaving, error } = this.state;
    const titleCharCount = posttitle.length;
    // Get plain text length for character count
    const tempDiv = document.createElement('div');
    if (postbody) {
      tempDiv.innerHTML = postbody;
    }
    const bodyCharCount = tempDiv.textContent?.length || tempDiv.innerText?.length || 0;

    return (
      <div className="edit-modal-overlay" onClick={onClose}>
        <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="edit-modal-header">
            <h2>Edit Post</h2>
            <button className="edit-modal-close" onClick={onClose}>
              ✕
            </button>
          </div>

          {error && (
            <div className="edit-error-message">
              {error}
            </div>
          )}

          <div className="edit-form">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-title">
                Blog Title
                <span className="char-count">{titleCharCount}/100</span>
              </label>
              <input
                className="edit-title-input"
                type="text"
                id="edit-title"
                placeholder="Enter your blog post title..."
                value={posttitle}
                onChange={this.onTitleChange}
                maxLength={100}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-body">
                Blog Content
              </label>
              <RichTextEditor
                value={postbody}
                onChange={this.onBodyChange}
                placeholder="Write your blog post content here... Use the toolbar to format your text."
                maxLength={5000}
                rows={12}
              />
              <div className="char-count-info">
                <span className="char-count">{bodyCharCount}/5000 characters</span>
              </div>
            </div>

            <div className="edit-modal-actions">
              <button
                onClick={() => {
                  // Save as draft
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = postbody || '';
                  const plainText = tempDiv.textContent || tempDiv.innerText || '';
                  if (posttitle.trim() || plainText.trim()) {
                    this.handleSave('draft');
                  }
                }}
                className={`draft-button ${isSaving ? 'saving' : ''}`}
                disabled={isSaving || (!posttitle.trim() && !postbody.trim())}
              >
                {isSaving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={() => this.handleSave('published')}
                className={`save-button ${isSaving ? 'saving' : ''}`}
                disabled={isSaving || !posttitle.trim() || !postbody.trim()}
              >
                {isSaving ? 'Saving...' : 'Publish'}
              </button>
              <button
                onClick={onClose}
                className="cancel-button"
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default EditPostModal;


