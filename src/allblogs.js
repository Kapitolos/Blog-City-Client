import React from 'react';
import './allblogs.css';
import BlogPostModal from './BlogPostModal.js';
import UserProfile from './UserProfile.js';
import LoadingSkeleton from './components/LoadingSkeleton.js';
import Pagination from './components/Pagination.js';
import LikeButton from './components/LikeButton.js';
import CommentsSection from './components/CommentsSection.js';
import CategoryTag from './components/CategoryTag.js';
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
        categories: [] // Store all available categories
      }
    }

    allblogview = (page = this.state.currentPage) => {
        this.setState({isLoading: true, error: ''});
        
        fetch('http://localhost:3001/allblogs', {
          method: 'post',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            page: page,
            limit: this.state.postsPerPage,
            category_id: this.state.selectedCategory
          })
        })
          .then(response => response.json())
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
        this.fetchCategories();
    }

    fetchCategories = () => {
      fetch('http://localhost:3001/categories')
        .then(response => response.json())
        .then(data => {
          this.setState({ categories: data || [] });
        })
        .catch(err => {
          console.error('Error fetching categories:', err);
        });
    }

    handleCategoryFilter = (categoryId) => {
      if (this.state.selectedCategory === categoryId) {
        // Clear filter
        this.setState({ selectedCategory: null, currentPage: 1 }, () => {
          this.allblogview(1);
        });
      } else {
        // Apply filter
        this.setState({ selectedCategory: categoryId, currentPage: 1 }, () => {
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
                {!isSearchMode && this.state.categories.length > 0 && (
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
                                    className={`category-filter-btn ${this.state.selectedCategory === category.id ? 'active' : ''}`}
                                    onClick={() => this.handleCategoryFilter(category.id)}
                                    style={{
                                        '--category-color': category.color || '#6a6a6a'
                                    }}
                                >
                                    {category.name}
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
                                <div className="blog-content">
                                    <p>{blog.postbody || 'No content available'}</p>
                                </div>
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
                                    <span className="blog-modal-author">by {selectedPost.name || 'Anonymous'}</span>
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
                            
                            <div className="blog-modal-body">
                                <p>{selectedPost.postbody}</p>
                            </div>
                            
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