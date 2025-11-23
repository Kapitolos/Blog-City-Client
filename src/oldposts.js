import React from 'react';
import './oldposts.css';
import LoadingSkeleton from './components/LoadingSkeleton.js';
import EditPostModal from './components/EditPostModal.js';
import ConfirmDialog from './components/ConfirmDialog.js';
import { formatRelativeTime, formatDate } from './utils/dateUtils.js';

class OldPosts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      oldposts: [],
      isLoading: false,
      error: '',
      editingPost: null,
      deletingPost: null
    }
  }

  showoldposts = () => {
    this.setState({isLoading: true, error: ''});
    
    fetch('http://localhost:3001/getposts', {
      method: 'post',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        name: this.props.name,
        id: this.props.id
      })
    })
      .then(response => response.json())
      .then(posts => {
        if (posts && Array.isArray(posts)) {
          this.setState({
            oldposts: posts,
            isLoading: false
          });
          console.log('User posts loaded:', posts);
        } else {
          this.setState({
            error: 'No previous posts found',
            isLoading: false
          });
        }
      })
      .catch(err => {
        console.error('Error loading user posts:', err);
        this.setState({
          error: 'Failed to load posts',
          isLoading: false
        });
      });
  }

  componentDidMount() {
    this.showoldposts();
  }

  componentDidUpdate(prevProps) {
    // Refresh posts when user ID or name changes
    if (prevProps.id !== this.props.id || prevProps.name !== this.props.name) {
      this.showoldposts();
    }
    
    // Refresh posts when refreshTrigger changes (new post published)
    if (prevProps.refreshTrigger !== this.props.refreshTrigger && this.props.refreshTrigger) {
      console.log('Refreshing user posts due to new publication');
      this.showoldposts();
    }
  }

  handleEdit = (post) => {
    this.setState({ editingPost: post });
  }

  handleDelete = (post) => {
    this.setState({ deletingPost: post });
  }

  closeEditModal = () => {
    this.setState({ editingPost: null });
  }

  closeDeleteDialog = () => {
    this.setState({ deletingPost: null });
  }

  handleSaveEdit = (updatedPost) => {
    this.closeEditModal();
    // Refresh the posts list
    this.showoldposts();
    // Notify parent to refresh all blogs if needed
    if (this.props.onPostUpdated) {
      this.props.onPostUpdated(updatedPost);
    }
  }

  confirmDelete = () => {
    const { deletingPost } = this.state;
    if (!deletingPost) return;

    this.setState({ isLoading: true });

    fetch(`http://localhost:3001/blogpost/${deletingPost.id}?user_id=${this.props.id}`, {
      method: 'delete',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Failed to delete post');
          });
        }
        return response.json();
      })
      .then(result => {
        this.setState({ isLoading: false, deletingPost: null });
        // Refresh the posts list
        this.showoldposts();
        // Notify parent to refresh all blogs if needed
        if (this.props.onPostDeleted) {
          this.props.onPostDeleted(deletingPost.id);
        }
        if (this.props.showToast) {
          this.props.showToast('Post deleted successfully', 'success');
        }
      })
      .catch(err => {
        console.error('Error deleting post:', err);
        this.setState({ isLoading: false });
        if (this.props.showToast) {
          this.props.showToast(err.message || 'Failed to delete post', 'error');
        }
      });
  }

  render() {
    const { oldposts, isLoading, error } = this.state;

    return (
      <div className="user-posts-container">
        {isLoading && (
          <div className="user-posts-list">
            <LoadingSkeleton count={3} type="post-item" />
          </div>
        )}

        {error && (
          <div className="no-posts-message">
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && oldposts.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h4 className="empty-state-title">No Posts Yet</h4>
            <p className="empty-state-message">
              Start writing your first blog post to see it here!
            </p>
          </div>
        )}

        {!isLoading && !error && oldposts.length > 0 && (
          <div className="user-posts-list">
            {oldposts.map((post, index) => (
              <div key={post.id || index} className="user-post-item">
                <div className="user-post-header">
                  <div className="user-post-title-row">
                    <h4 className="user-post-title">
                      {post.posttitle || 'Untitled Post'}
                    </h4>
                    {post.status === 'draft' && (
                      <span className="draft-badge" title="This post is a draft">
                        📝 Draft
                      </span>
                    )}
                  </div>
                  {post.created_at && (
                    <span className="user-post-date" title={formatDate(post.created_at)}>
                      {formatRelativeTime(post.created_at)}
                    </span>
                  )}
                </div>
                <div 
                  className="user-post-preview"
                  dangerouslySetInnerHTML={{ 
                    __html: post.postbody ? 
                      (post.postbody.length > 100 ? 
                        post.postbody.substring(0, 100) + '...' : 
                        post.postbody
                      ) : 
                      '<p>No content available</p>'
                  }}
                />
                <div className="user-post-actions">
                  <button
                    className="edit-post-btn"
                    onClick={() => this.handleEdit(post)}
                    title="Edit post"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="delete-post-btn"
                    onClick={() => this.handleDelete(post)}
                    title="Delete post"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Post Modal */}
        {this.state.editingPost && (
          <EditPostModal
            post={this.state.editingPost}
            userId={this.props.id}
            onClose={this.closeEditModal}
            onSave={this.handleSaveEdit}
            showToast={this.props.showToast}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!this.state.deletingPost}
          title="Delete Post"
          message={`Are you sure you want to delete "${this.state.deletingPost?.posttitle || 'this post'}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={this.confirmDelete}
          onCancel={this.closeDeleteDialog}
          type="danger"
        />

        {!isLoading && oldposts.length > 0 && (
          <div className="refresh-posts">
            <button 
              onClick={this.showoldposts}
              className="refresh-posts-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : '🔄 Refresh Posts'}
            </button>
          </div>
        )}
      </div>
    );
  }
}

export default OldPosts; 