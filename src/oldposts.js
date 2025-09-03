import React from 'react';
import './oldposts.css';

class OldPosts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      oldposts: [],
      isLoading: false,
      error: ''
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

  render() {
    const { oldposts, isLoading, error } = this.state;

    return (
      <div className="user-posts-container">
        {isLoading && (
          <div className="loading-indicator">
            <div className="mini-spinner"></div>
            <span>Loading posts...</span>
          </div>
        )}

        {error && (
          <div className="no-posts-message">
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && oldposts.length === 0 && (
          <div className="no-posts-message">
            <p>No previous posts yet. Start writing your first blog post!</p>
          </div>
        )}

        {!isLoading && !error && oldposts.length > 0 && (
          <div className="user-posts-list">
            {oldposts.map((post, index) => (
              <div key={post.id || index} className="user-post-item">
                <div className="user-post-header">
                  <h4 className="user-post-title">
                    {post.posttitle || 'Untitled Post'}
                  </h4>
                  {post.created_at && (
                    <span className="user-post-date">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="user-post-preview">
                  <p>{post.postbody ? 
                    (post.postbody.length > 100 ? 
                      post.postbody.substring(0, 100) + '...' : 
                      post.postbody
                    ) : 
                    'No content available'
                  }</p>
                </div>
              </div>
            ))}
          </div>
        )}

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