import React from 'react';
import './allblogs.css';
import BlogPostModal from './BlogPostModal.js';
import UserProfile from './UserProfile.js';
import LoadingSkeleton from './components/LoadingSkeleton.js';
import Pagination from './components/Pagination.js';
import LikeButton from './components/LikeButton.js';
import CommentsSection from './components/CommentsSection.js';
import CategoryTag from './components/CategoryTag.js';
import Avatar from './components/Avatar.js';
import EditPostModal from './components/EditPostModal.js';
import { formatRelativeTime, formatDate } from './utils/dateUtils.js';

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
        searchTerm: '',
        currentPage: 1,
        totalPages: 1,
        totalPosts: 0,
        postsPerPage: 10,
        commentCounts: {}, // Store comment counts for each post
        selectedCategory: null,
        categories: [], // Store all available categories
        showEditModal: false,
        postToEdit: null
      }
    }

    allblogview = (page = this.state.currentPage) => {
        this.setState({isLoading: true, error: ''});
        
        // Ensure selectedCategory is a primitive value (number or null)
        // Safely extract the value, handling any edge cases
        let categoryId = null;
        const selectedCategory = this.state.selectedCategory;
        
        if (selectedCategory === null || selectedCategory === undefined) {
          categoryId = null;
        } else if (typeof selectedCategory === 'number') {
          categoryId = selectedCategory;
        } else if (typeof selectedCategory === 'string') {
          // Try to parse string to number
          const parsed = parseInt(selectedCategory, 10);
          categoryId = isNaN(parsed) ? null : parsed;
        } else {
          // If it's anything else (object, DOM element, etc.), set to null
          console.warn('Invalid selectedCategory type, resetting to null:', typeof selectedCategory);
          categoryId = null;
          // Also reset the state to prevent future issues
          this.setState({ selectedCategory: null });
        }
        
        // Build request body with only primitive values
        const requestBody = {
          page: typeof page === 'number' ? page : 1,
          limit: typeof this.state.postsPerPage === 'number' ? this.state.postsPerPage : 10,
          category_id: categoryId
        };
        
        fetch('http://localhost:3001/allblogs', {
          method: 'post',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(requestBody)
        })
          .then(response => {
            if (!response.ok) {
              return response.json().then(errData => {
                throw new Error(errData.error || `HTTP ${response.status}: ${response.statusText}`);
              });
            }
            return response.json();
          })
          .then(data => {
            if (data && data.blogs && Array.isArray(data.blogs)) {
              this.setState({
                allblogs: data.blogs,
                currentPage: data.pagination.currentPage,
                totalPages: data.pagination.totalPages,
                totalPosts: data.pagination.totalPosts,
                isLoading: false
              });
              console.log('Blogs loaded:', data.blogs.length, 'of', data.pagination.totalPosts);
              
              // Fetch comment counts for all posts
              this.fetchCommentCounts(data.blogs);
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

    handlePageChange = (newPage) => {
      if (newPage >= 1 && newPage <= this.state.totalPages) {
        this.allblogview(newPage);
        // Scroll to top when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    fetchCommentCounts = (blogs) => {
      // Fetch comment counts for all posts in parallel
      const countPromises = blogs.map(blog => 
        fetch(`http://localhost:3001/comments/${blog.id}/count`)
          .then(response => response.json())
          .then(data => ({ postId: blog.id, count: data.commentCount || 0 }))
          .catch(() => ({ postId: blog.id, count: 0 }))
      );

      Promise.all(countPromises)
        .then(counts => {
          const commentCounts = {};
          counts.forEach(({ postId, count }) => {
            commentCounts[postId] = count;
          });
          this.setState({ commentCounts });
        })
        .catch(err => {
          console.error('Error fetching comment counts:', err);
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

    handleEditPost = (post) => {
      this.setState({
        showEditModal: true,
        postToEdit: post,
        isModalOpen: false // Close the view modal
      });
    };

    closeEditModal = () => {
      this.setState({
        showEditModal: false,
        postToEdit: null
      });
    };

    handlePostUpdated = (updatedPost) => {
      // Refresh the blog list
      this.allblogview(this.state.currentPage);
      // Close edit modal
      this.closeEditModal();
      // If this was the currently selected post, update it
      if (this.state.selectedPost && this.state.selectedPost.id === updatedPost.id) {
        this.setState({ selectedPost: updatedPost });
      }
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
        // Fetch categories first, then load preference and blogs
        this.fetchCategories();
        // Load blogs - preference will be applied after categories load
        this.allblogview();
    }

    componentDidUpdate(prevProps) {
        // If userId changed, reload categories and preference
        if (prevProps.userId !== this.props.userId) {
            // If user signed out (userId is now null/undefined), clear the selected category
            if (!this.props.userId) {
                this.setState({ selectedCategory: null }, () => {
                    // Clear the filter and reload
                    this.allblogview(1);
                });
            } else {
                // User signed in, load their preference
                this.fetchCategories();
                this.allblogview(1);
            }
        }
    }

    // Save category preference to database
    saveCategoryPreference = (categoryId) => {
        const { userId } = this.props;
        if (userId) {
            fetch(`http://localhost:3001/user-preference/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferred_category_id: categoryId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Error saving preference:', data.error);
                }
            })
            .catch(err => {
                console.error('Error saving category preference:', err);
            });
        }
    }

    // Load category preference from database
    loadCategoryPreference = () => {
        const { userId } = this.props;
        if (userId) {
            return fetch(`http://localhost:3001/user-preference/${userId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        console.error('Error loading preference:', data.error);
                        return null;
                    }
                    if (data.preferred_category_id !== null && data.preferred_category_id !== undefined) {
                        const categoryId = parseInt(data.preferred_category_id, 10);
                        if (!isNaN(categoryId)) {
                            this.setState({ selectedCategory: categoryId });
                            return categoryId;
                        }
                    }
                    return null;
                })
                .catch(err => {
                    console.error('Error loading category preference:', err);
                    return null;
                });
        }
        return Promise.resolve(null);
    }

    fetchCategories = () => {
      // All categories are public, so no need to pass userId
      fetch('http://localhost:3001/categories')
        .then(response => response.json())
        .then(data => {
          this.setState({ categories: data || [] }, () => {
            // After categories are loaded, load and apply saved preference
            if (this.props.userId) {
              this.loadCategoryPreference().then(() => {
                // Preference loaded, refresh view
                this.allblogview();
              });
            }
          });
        })
        .catch(err => {
          console.error('Error fetching categories:', err);
        });
    }

    handleCategoryFilter = (categoryId) => {
      // Ensure categoryId is a primitive number, not an event or DOM element
      let id = null;
      
      if (categoryId === null || categoryId === undefined) {
        id = null;
      } else if (typeof categoryId === 'number') {
        id = categoryId;
      } else if (typeof categoryId === 'string') {
        // Try to parse string to number
        const parsed = parseInt(categoryId, 10);
        id = isNaN(parsed) ? null : parsed;
      } else {
        // If it's anything else (object, DOM element, event, etc.), ignore it
        console.warn('Invalid categoryId type in handleCategoryFilter:', typeof categoryId);
        return;
      }
      
      if (this.state.selectedCategory === id) {
        // Clear filter
        this.saveCategoryPreference(null);
        this.setState({ selectedCategory: null, currentPage: 1 }, () => {
          this.allblogview(1);
        });
      } else {
        // Apply filter - ensure we're storing a primitive number
        this.saveCategoryPreference(id);
        this.setState({ selectedCategory: id, currentPage: 1 }, () => {
          this.allblogview(1);
        });
      }
    }

    render() {
        const { allblogs, isLoading, error, selectedPost, isModalOpen, selectedUser, showUserProfile, searchResults, isSearchMode, searchTerm, currentPage, totalPages, totalPosts } = this.state;
        
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
                            <p>
                                {totalPosts > 0 ? (
                                    <>Showing {allblogs.length} of {totalPosts} posts</>
                                ) : (
                                    <>Discover what others are writing about</>
                                )}
                            </p>
                        </>
                    )}
                </div>

                {/* Category Filter */}
                {!isSearchMode && (
                    <div className="category-filter-section">
                        <div className="category-filter-header">
                            <span className="category-filter-label">Filter by category:</span>
                            {this.state.selectedCategory && (
                                <button 
                                    className="clear-category-filter"
                                    onClick={() => this.handleCategoryFilter(null)}
                                >
                                    Clear filter
                                </button>
                            )}
                        </div>
                        <div className="category-filter-options">
                            {this.state.categories.map(category => (
                                <button
                                    key={category.id}
                                    className={`category-filter-btn ${this.state.selectedCategory === category.id ? 'active' : ''} ${category.user_id ? 'custom-category' : ''}`}
                                    onClick={() => this.handleCategoryFilter(category.id)}
                                    style={{
                                        '--category-color': category.color || '#6a6a6a'
                                    }}
                                    title={category.user_id ? 'Community-created category' : ''}
                                >
                                    {category.name}
                                    {category.user_id && <span className="custom-badge">★</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="blogs-grid">
                        <LoadingSkeleton count={6} type="blog-card" />
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {!isLoading && !error && displayPosts.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            {isSearchMode ? '🔍' : '📝'}
                        </div>
                        <h3 className="empty-state-title">
                            {isSearchMode ? 'No Results Found' : 'No Posts Yet'}
                        </h3>
                        <p className="empty-state-message">
                            {isSearchMode ? (
                                <>No posts found for "<strong>{searchTerm}</strong>". Try a different search term or browse all posts.</>
                            ) : (
                                <>Be the first to share your thoughts! Sign in to start writing.</>
                            )}
                        </p>
                        {isSearchMode && (
                            <button 
                                onClick={this.clearSearch} 
                                className="empty-state-action"
                            >
                                View All Posts
                            </button>
                        )}
                    </div>
                )}

                {!isLoading && !error && displayPosts.length > 0 && (
                    <>
                        <div className="blogs-grid">
                            {displayPosts.map((blog, index) => (
                            <div 
                                key={blog.id || index} 
                                className="blog-card clickable"
                                onClick={() => this.openBlogModal(blog)}
                            >
                                <div className="blog-card-header">
                                    <h3 className="blog-title">{blog.posttitle || 'Untitled'}</h3>
                                    <div 
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
                                        <Avatar 
                                          userId={blog.user_id}
                                          userName={blog.name}
                                          size="small"
                                        />
                                        <span>by {blog.name || 'Anonymous'}</span>
                                    </div>
                                </div>
                                {blog.categories && blog.categories.length > 0 && (
                                    <div className="blog-categories">
                                        {blog.categories.map(category => (
                                            <CategoryTag
                                                key={category.id}
                                                category={category}
                                                onClick={this.handleCategoryFilter}
                                                clickable={true}
                                            />
                                        ))}
                                    </div>
                                )}
                                <div 
                                  className="blog-content"
                                  dangerouslySetInnerHTML={{ __html: blog.postbody || '<p>No content available</p>' }}
                                />
                                <div className="blog-card-footer">
                                    <div className="blog-footer-left">
                                        <span 
                                            className="blog-date"
                                            title={blog.created_at ? formatDate(blog.created_at) : ''}
                                        >
                                            {blog.created_at ? formatRelativeTime(blog.created_at) : 'Recently'}
                                        </span>
                                        <div className="blog-stats">
                                            <span className="click-hint">Click to read full post</span>
                                            {this.state.commentCounts[blog.id] !== undefined && (
                                                <span className="comment-count-badge">
                                                    💬 {this.state.commentCounts[blog.id]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <LikeButton 
                                        postId={blog.id}
                                        userId={this.props.userId}
                                    />
                                </div>
                            </div>
                            ))}
                        </div>
                        
                        {/* Pagination - only show for all blogs, not search results */}
                        {!isSearchMode && totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={this.handlePageChange}
                                hasNextPage={currentPage < totalPages}
                                hasPrevPage={currentPage > 1}
                            />
                        )}
                    </>
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
                                <div className="blog-modal-meta-left">
                                    <div className="blog-modal-author">
                                        <Avatar 
                                          userId={selectedPost.user_id}
                                          userName={selectedPost.name}
                                          size="small"
                                        />
                                        <span>by {selectedPost.name || 'Anonymous'}</span>
                                    </div>
                                    {selectedPost.created_at && (
                                        <span className="blog-modal-date" title={formatDate(selectedPost.created_at)}>
                                            {formatRelativeTime(selectedPost.created_at)}
                                        </span>
                                    )}
                                </div>
                                <LikeButton 
                                    postId={selectedPost.id}
                                    userId={this.props.userId}
                                />
                            </div>
                            
                            {selectedPost.categories && selectedPost.categories.length > 0 && (
                                <div className="blog-modal-categories">
                                    {selectedPost.categories.map(category => (
                                        <CategoryTag
                                            key={category.id}
                                            category={category}
                                            onClick={this.handleCategoryFilter}
                                            clickable={true}
                                        />
                                    ))}
                                </div>
                            )}
                            
                            <div 
                              className="blog-modal-body"
                              dangerouslySetInnerHTML={{ __html: selectedPost.postbody }}
                            />
                            
                            <CommentsSection
                                postId={selectedPost.id}
                                userId={this.props.userId}
                                userName={this.props.userName}
                                onCommentCountChange={(count) => {
                                    this.setState(prevState => ({
                                        commentCounts: {
                                            ...prevState.commentCounts,
                                            [selectedPost.id]: count
                                        }
                                    }));
                                }}
                            />
                            
                            <div className="blog-modal-footer">
                                {this.props.userId && selectedPost.user_id === this.props.userId && (
                                    <button 
                                        className="blog-modal-edit-btn" 
                                        onClick={() => this.handleEditPost(selectedPost)}
                                    >
                                        ✏️ Edit Post
                                    </button>
                                )}
                                <button className="blog-modal-close-btn" onClick={this.closeBlogModal}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Post Modal */}
                {this.state.showEditModal && this.state.postToEdit && (
                    <EditPostModal
                        post={this.state.postToEdit}
                        userId={this.props.userId}
                        onClose={this.closeEditModal}
                        onSave={this.handlePostUpdated}
                        showToast={this.props.showToast}
                    />
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