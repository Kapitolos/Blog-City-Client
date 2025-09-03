import React from 'react';
import './allblogs.css';
import BlogPostModal from './BlogPostModal.js';
import UserProfile from './UserProfile.js';

class AllBlogs extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        allblogs: [],
        isLoading: false,
        error: '',
        selectedPost: null,
        isModalOpen: false,
        selectedUser: null,
        showUserProfile: false,
        searchResults: [],
        isSearchMode: false,
        searchTerm: ''
      }
    }

    allblogview = () => {
        this.setState({isLoading: true, error: ''});
        
        fetch('http://localhost:3001/allblogs', {
          method: 'post',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            name: "",
            postbody: "",
            posttitle: "",
            id: 1,
          })
        })
          .then(response => response.json())
          .then(blogs => {
            if (blogs && Array.isArray(blogs)) {
              this.setState({
                allblogs: blogs,
                isLoading: false
              });
              console.log('Blogs loaded:', blogs);
              console.log('First blog structure:', blogs[0]);
            } else {
              this.setState({
                error: 'No blogs found',
                isLoading: false
              });
            }
          })
          .catch(err => {
            console.error('Error loading blogs:', err);
            this.setState({
              error: 'Failed to load blogs. Please try again.',
              isLoading: false
            });
          });
    }

    openBlogModal = (post) => {
      this.setState({
        selectedPost: post,
        isModalOpen: true
      });
    };

    closeBlogModal = () => {
      this.setState({
        selectedPost: null,
        isModalOpen: false
      });
    };

    handleUserClick = (userName, userId) => {
      console.log('User clicked:', { userName, userId });
      this.setState({
        selectedUser: { name: userName, id: userId },
        showUserProfile: true
      });
    };

    closeUserProfile = () => {
      this.setState({
        selectedUser: null,
        showUserProfile: false
      });
    };

    // Method to handle search results from parent component
    handleSearchResults = (results, searchTerm) => {
      this.setState({
        searchResults: results,
        isSearchMode: true,
        searchTerm: searchTerm
      });
    };

    // Method to clear search and return to all blogs
    clearSearch = () => {
      this.setState({
        searchResults: [],
        isSearchMode: false,
        searchTerm: ''
      });
    };

    componentDidMount() {
        this.allblogview();
    }

    render() {
        const { allblogs, isLoading, error, selectedPost, isModalOpen, selectedUser, showUserProfile, searchResults, isSearchMode, searchTerm } = this.state;
        
        // Determine which posts to display
        const displayPosts = isSearchMode ? searchResults : allblogs;

        return (
            <div className="all-blogs-container">
                <div className="all-blogs-header">
                    {isSearchMode ? (
                        <>
                            <h2>Search Results</h2>
                            <p>Found {searchResults.length} posts for "{searchTerm}"</p>
                            <button onClick={this.clearSearch} className="clear-search-btn">
                                ← Back to All Posts
                            </button>
                        </>
                    ) : (
                        <>
                            <h2>All Blog Posts</h2>
                            <p>Discover what others are writing about</p>
                        </>
                    )}
                </div>

                {isLoading && (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading blogs...</p>
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {!isLoading && !error && displayPosts.length === 0 && (
                    <div className="no-blogs-message">
                        {isSearchMode ? (
                            <p>No posts found for "{searchTerm}". Try a different search term.</p>
                        ) : (
                            <p>No blog posts yet. Be the first to write one!</p>
                        )}
                    </div>
                )}

                {!isLoading && !error && displayPosts.length > 0 && (
                    <div className="blogs-grid">
                        {displayPosts.map((blog, index) => (
                            <div 
                                key={blog.id || index} 
                                className="blog-card clickable"
                                onClick={() => this.openBlogModal(blog)}
                            >
                                <div className="blog-card-header">
                                    <h3 className="blog-title">{blog.posttitle || 'Untitled'}</h3>
                                    <span 
                                        className="blog-author clickable-author"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (blog.user_id) {
                                                this.handleUserClick(blog.name, blog.user_id);
                                            } else {
                                                console.log('No user_id available for blog:', blog);
                                            }
                                        }}
                                    >
                                        by {blog.name || 'Anonymous'}
                                    </span>
                                </div>
                                <div className="blog-content">
                                    <p>{blog.postbody || 'No content available'}</p>
                                </div>
                                <div className="blog-card-footer">
                                    <span className="blog-date">
                                        {blog.created_at ? new Date(blog.created_at).toLocaleDateString() : 'Recently'}
                                    </span>
                                    <span className="click-hint">Click to read full post</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="refresh-section">
                    <button 
                        onClick={this.allblogview}
                        className="refresh-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Refreshing...' : '🔄 Refresh Blogs'}
                    </button>
                </div>

                {/* Blog Post Modal */}
                {isModalOpen && selectedPost && (
                    <div className="blog-modal-overlay" onClick={this.closeBlogModal}>
                        <div className="blog-modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="blog-modal-header">
                                <h2 className="blog-modal-title">{selectedPost.posttitle || 'Untitled'}</h2>
                                <button className="blog-modal-close" onClick={this.closeBlogModal}>
                                    ✕
                                </button>
                            </div>
                            
                            <div className="blog-modal-meta">
                                <span className="blog-modal-author">by {selectedPost.name || 'Anonymous'}</span>
                                {selectedPost.created_at && (
                                    <span className="blog-modal-date">
                                        {new Date(selectedPost.created_at).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            
                            <div className="blog-modal-body">
                                <p>{selectedPost.postbody}</p>
                            </div>
                            
                            <div className="blog-modal-footer">
                                <button className="blog-modal-close-btn" onClick={this.closeBlogModal}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* User Profile Component */}
                {showUserProfile && selectedUser && (
                    <UserProfile 
                        userId={selectedUser.id}
                        userName={selectedUser.name}
                        onClose={this.closeUserProfile}
                    />
                )}
            </div>
        );
    }
}

export default AllBlogs;