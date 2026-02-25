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
import { fixPostBodyImageUrls } from './utils/postBodyHtml.js';
import { API_BASE_URL } from './config.js';

class AllBlogs extends React.Component {
    constructor(props) {
      super(props);
      this.filterPanelRef = React.createRef();
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
        selectedCategories: [], // Array of selected category IDs for filtering
        categories: [], // Store all available categories
        showEditModal: false,
        postToEdit: null,
        sortOrder: 'newest', // 'newest' or 'oldest'
        dateFilter: null, // Date string (YYYY-MM-DD) or null
        minLikes: null, // Minimum number of likes (number or null)
        showOnlyFollowed: false, // Show only posts from followed users
        showFilters: false // Collapsible filter panel state
      }
    }

    allblogview = (page = this.state.currentPage) => {
        this.setState({isLoading: true, error: ''});
        
        // Handle selectedCategories as an array
        const selectedCategories = Array.isArray(this.state.selectedCategories) 
          ? this.state.selectedCategories.filter(id => id != null && !isNaN(parseInt(id, 10)))
          : [];
        
        // Build request body with only primitive values
        const requestBody = {
          page: typeof page === 'number' ? page : 1,
          limit: typeof this.state.postsPerPage === 'number' ? this.state.postsPerPage : 10,
          category_ids: selectedCategories.length > 0 ? selectedCategories : null,
          sort_order: this.state.sortOrder || 'newest',
          date_filter: this.state.dateFilter || null,
          min_likes: this.state.minLikes !== null && this.state.minLikes !== '' ? parseInt(this.state.minLikes, 10) : null,
          show_only_followed: this.state.showOnlyFollowed || false,
          current_user_id: this.props.userId || null
        };
        
        console.log('Fetching blogs with request body:', requestBody);
        
        fetch(`${API_BASE_URL}/allblogs`, {
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
        fetch(`${API_BASE_URL}/comments/${blog.id}/count`)
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
        // Expose toggle method to parent
        if (this.props.onToggleFiltersReady) {
            this.props.onToggleFiltersReady(this.toggleFilters);
        }
        // Add click outside listener to close filter panel
        document.addEventListener('mousedown', this.handleClickOutside);
    }

    componentWillUnmount() {
        // Remove click outside listener
        document.removeEventListener('mousedown', this.handleClickOutside);
    }

    handleClickOutside = (event) => {
        // Check if click is outside the filter panel and filter button
        if (this.filterPanelRef.current && 
            !this.filterPanelRef.current.contains(event.target) &&
            !event.target.closest('.btn-filter') &&
            !event.target.closest('.navbar-actions')) {
            // Close filter panel if it's open
            if (this.state.showFilters) {
                this.setState({ showFilters: false });
            }
        }
    }

    componentDidUpdate(prevProps) {
        // Expose toggle method to parent if it wasn't available before
        if (this.props.onToggleFiltersReady && !prevProps.onToggleFiltersReady) {
            this.props.onToggleFiltersReady(this.toggleFilters);
        }
        // If userId changed, reload categories and preference
        if (prevProps.userId !== this.props.userId) {
            // If user signed out (userId is now null/undefined), clear the selected category
            if (!this.props.userId) {
                this.setState({ selectedCategories: [] }, () => {
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
            fetch(`${API_BASE_URL}/user-preference/${userId}`, {
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
            return fetch(`${API_BASE_URL}/user-preference/${userId}`)
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
      fetch(`${API_BASE_URL}/categories`)
        .then(response => response.json())
        .then(data => {
          const list = Array.isArray(data) ? data : [];
          this.setState({ categories: list }, () => {
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
          this.setState({ categories: [] });
        });
    }

    handleCategoryFilter = (categoryId) => {
      // Ensure categoryId is a primitive number
      let id = null;
      
      if (categoryId === null || categoryId === undefined) {
        id = null;
      } else if (typeof categoryId === 'number') {
        id = categoryId;
      } else if (typeof categoryId === 'string') {
        const parsed = parseInt(categoryId, 10);
        id = isNaN(parsed) ? null : parsed;
      } else {
        console.warn('Invalid categoryId type in handleCategoryFilter:', typeof categoryId);
        return;
      }
      
      if (id === null) {
        // Clear all filters
        this.saveCategoryPreference([]);
        this.setState({ selectedCategories: [], currentPage: 1 }, () => {
          this.allblogview(1);
        });
        return;
      }
      
      // Toggle category selection
      const currentSelected = this.state.selectedCategories || [];
      let newSelected;
      
      if (currentSelected.includes(id)) {
        // Remove category
        newSelected = currentSelected.filter(cid => cid !== id);
      } else {
        // Add category
        newSelected = [...currentSelected, id];
      }
      
      this.saveCategoryPreference(newSelected);
      this.setState({ selectedCategories: newSelected, currentPage: 1 }, () => {
        this.allblogview(1);
      });
    }

    handleSortOrderChange = (sortOrder) => {
      this.setState({ sortOrder, currentPage: 1 }, () => {
        this.allblogview(1);
      });
    }

    handleDateFilterChange = (dateFilter) => {
      this.setState({ dateFilter, currentPage: 1 }, () => {
        this.allblogview(1);
      });
    }

    clearDateFilter = () => {
      this.setState({ dateFilter: null, currentPage: 1 }, () => {
        this.allblogview(1);
      });
    }

    handleMinLikesChange = (minLikes) => {
      const value = minLikes === '' ? null : parseInt(minLikes, 10);
      this.setState({ minLikes: value, currentPage: 1 }, () => {
        this.allblogview(1);
      });
    }

    clearLikesFilter = () => {
      this.setState({ minLikes: null, currentPage: 1 }, () => {
        this.allblogview(1);
      });
    }

    handleShowOnlyFollowedChange = (event) => {
      const checked = event.target.checked;
      console.log('Show only followed changed:', checked);
      this.setState({ showOnlyFollowed: checked, currentPage: 1 }, () => {
        console.log('State updated, calling allblogview with showOnlyFollowed:', this.state.showOnlyFollowed);
        this.allblogview(1);
      });
    }

    toggleFilters = () => {
        this.setState(prevState => ({
            showFilters: !prevState.showFilters
        }));
    }

    render() {
        const { allblogs, isLoading, error, selectedPost, isModalOpen, selectedUser, showUserProfile, searchResults, isSearchMode, searchTerm, currentPage, totalPages, totalPosts } = this.state;
        
        // Determine which posts to display
        const displayPosts = isSearchMode ? searchResults : allblogs;

        return (
            <div className="all-blogs-container">
                {/* Search Results Header (only show when searching) */}
                {isSearchMode && (
                    <div className="search-results-header">
                        <h2>Search Results</h2>
                        <p>Found {searchResults.length} posts for "{searchTerm}"</p>
                        <button onClick={this.clearSearch} className="clear-search-btn">
                            ← Back to All Posts
                        </button>
                    </div>
                )}

                {/* Collapsible Filter Panel */}
                <div 
                    ref={this.filterPanelRef}
                    className={`filter-panel ${this.state.showFilters ? 'open' : ''}`}
                >
                    <div className="filter-panel-content">
                        {/* Sort and Filter Controls */}
                        {!isSearchMode && (
                            <>
                                <div className="filter-panel-section">
                                    <h3 className="filter-panel-title">Sort & Filter</h3>
                                    <div className="filter-controls-section">
                        {/* Sort Order */}
                        <div className="sort-controls">
                            <label className="sort-label">Sort by:</label>
                            <div className="sort-buttons">
                                <button
                                    className={`sort-btn ${this.state.sortOrder === 'newest' ? 'active' : ''}`}
                                    onClick={() => this.handleSortOrderChange('newest')}
                                >
                                    Newest First
                                </button>
                                <button
                                    className={`sort-btn ${this.state.sortOrder === 'oldest' ? 'active' : ''}`}
                                    onClick={() => this.handleSortOrderChange('oldest')}
                                >
                                    Oldest First
                                </button>
                            </div>
                        </div>

                        {/* Date Filter */}
                        <div className="date-filter-controls">
                            <label className="date-filter-label" htmlFor="date-filter">
                                Filter by date:
                            </label>
                            <div className="date-input-group">
                                <input
                                    type="date"
                                    id="date-filter"
                                    className="date-filter-input"
                                    value={this.state.dateFilter || ''}
                                    onChange={(e) => this.handleDateFilterChange(e.target.value || null)}
                                    max={new Date().toISOString().split('T')[0]} // Can't select future dates
                                />
                                {this.state.dateFilter && (
                                    <button
                                        className="clear-date-filter-btn"
                                        onClick={this.clearDateFilter}
                                        title="Clear date filter"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Likes Filter */}
                        <div className="likes-filter-controls">
                            <label className="likes-filter-label" htmlFor="likes-filter">
                                Minimum likes:
                            </label>
                            <div className="likes-input-group">
                                <input
                                    type="number"
                                    id="likes-filter"
                                    className="likes-filter-input"
                                    min="0"
                                    value={this.state.minLikes !== null ? this.state.minLikes : ''}
                                    onChange={(e) => this.handleMinLikesChange(e.target.value)}
                                    placeholder="0"
                                />
                                {this.state.minLikes !== null && this.state.minLikes !== '' && (
                                    <button
                                        className="clear-likes-filter-btn"
                                        onClick={this.clearLikesFilter}
                                        title="Clear likes filter"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Show Only Followed Users Filter */}
                        {this.props.userId && (
                          <div className="followed-filter-controls">
                            <label className="followed-filter-label" htmlFor="followed-filter">
                              <input
                                type="checkbox"
                                id="followed-filter"
                                className="followed-filter-checkbox"
                                checked={this.state.showOnlyFollowed}
                                onChange={this.handleShowOnlyFollowedChange}
                              />
                              <span>Show only posts from users I follow</span>
                            </label>
                          </div>
                        )}
                                    </div>
                                </div>

                                {/* Category Filter */}
                                <div className="filter-panel-section">
                                    <h3 className="filter-panel-title">Categories</h3>
                                    <div className="category-filter-section">
                                        <div className="category-filter-header">
                                            <span className="category-filter-label">Filter by category (select multiple):</span>
                                            {this.state.selectedCategories && this.state.selectedCategories.length > 0 && (
                                                <button 
                                                    className="clear-category-filter"
                                                    onClick={() => this.handleCategoryFilter(null)}
                                                >
                                                    Clear all filters
                                                </button>
                                            )}
                                        </div>
                                        <div className="category-filter-options">
                                            {(Array.isArray(this.state.categories) ? this.state.categories : []).map(category => {
                                                const isSelected = this.state.selectedCategories && this.state.selectedCategories.includes(category.id);
                                                return (
                                                    <button
                                                        key={category.id}
                                                        className={`category-filter-btn ${isSelected ? 'active' : ''} ${category.user_id ? 'custom-category' : ''}`}
                                                        onClick={() => this.handleCategoryFilter(category.id)}
                                                        style={{
                                                            '--category-color': category.color || '#6a6a6a'
                                                        }}
                                                        title={category.user_id ? 'Community-created category' : ''}
                                                    >
                                                        {isSelected && <span className="filter-checkmark">✓</span>}
                                                        {category.name}
                                                        {category.user_id && <span className="custom-badge">★</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

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
                                  dangerouslySetInnerHTML={{ __html: fixPostBodyImageUrls(blog.postbody) || '<p>No content available</p>' }}
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
                              dangerouslySetInnerHTML={{ __html: fixPostBodyImageUrls(selectedPost.postbody) }}
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
                        currentUserId={this.props.userId}
                        onUserHidden={(hiddenUserId) => {
                            // Refresh the blog list to exclude hidden user
                            this.allblogview(this.state.currentPage);
                        }}
                    />
                )}
            </div>
        );
    }
}

export default AllBlogs;