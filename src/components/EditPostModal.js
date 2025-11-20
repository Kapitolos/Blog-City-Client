import React from 'react';
import './EditPostModal.css';

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

  onBodyChange = (event) => {
    this.setState({ postbody: event.target.value, error: '' });
  }

  validateForm = () => {
    if (!this.state.posttitle.trim()) {
      this.setState({ error: 'Please enter a title for your blog post' });
      return false;
    }
    if (!this.state.postbody.trim()) {
      this.setState({ error: 'Please write some content for your blog post' });
      return false;
    }
    if (this.state.posttitle.trim().length < 3) {
      this.setState({ error: 'Title must be at least 3 characters long' });
      return false;
    }
    if (this.state.postbody.trim().length < 10) {
      this.setState({ error: 'Blog post must be at least 10 characters long' });
      return false;
    }
    return true;
  }

  handleSave = () => {
    if (!this.validateForm()) {
      return;
    }

    this.setState({ isSaving: true, error: '' });

    fetch(`http://localhost:3001/blogpost/${this.props.post.id}`, {
      method: 'put',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        posttitle: this.state.posttitle.trim(),
        postbody: this.state.postbody.trim(),
        user_id: this.props.userId
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
          this.props.showToast('Post updated successfully!', 'success');
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
    const bodyCharCount = postbody.length;

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
                <span className="char-count">{bodyCharCount}/5000</span>
              </label>
              <textarea
                className="edit-body-textarea"
                id="edit-body"
                placeholder="Write your blog post content here..."
                value={postbody}
                onChange={this.onBodyChange}
                maxLength={5000}
                rows={12}
                required
              />
            </div>

            <div className="edit-modal-actions">
              <button
                onClick={this.handleSave}
                className={`save-button ${isSaving ? 'saving' : ''}`}
                disabled={isSaving || !posttitle.trim() || !postbody.trim()}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
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


