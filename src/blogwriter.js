import React from 'react';
import './blogwriter.css';
import CategorySelector from './components/CategorySelector.js';
import RichTextEditor from './components/RichTextEditor.js';

class BlogWriter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      postbody: '',
      posttitle: '',
      isPublishing: false,
      isSavingDraft: false,
      error: '',
      success: false,
      selectedCategories: []
    }
  }

  onTextChange = (event) => {
    this.setState({postbody: event.target.value, error: '', success: false});
  }

  onTitleChange = (event) => {
    this.setState({posttitle: event.target.value, error: '', success: false});
  }

  validateForm = () => {
    if (!this.state.posttitle.trim()) {
      this.setState({error: 'Please enter a title for your blog post'});
      return false;
    }
    if (!this.state.postbody.trim()) {
      this.setState({error: 'Please write some content for your blog post'});
      return false;
    }
    if (this.state.posttitle.trim().length < 3) {
      this.setState({error: 'Title must be at least 3 characters long'});
      return false;
    }
    if (this.state.postbody.trim().length < 10) {
      this.setState({error: 'Blog post must be at least 10 characters long'});
      return false;
    }
    return true;
  }

  onSubmitBlog = (status = 'published') => {
    // For drafts, only require title (content can be empty)
    if (status === 'published' && !this.validateForm()) {
      return;
    }
    
    // For drafts, at least require a title
    if (status === 'draft' && !this.state.posttitle.trim()) {
      this.setState({error: 'Please enter a title for your draft'});
      return;
    }

    console.log('=== FRONTEND: Starting blog post submission ===');
    console.log('Props:', { name: this.props.name, id: this.props.id });
    console.log('State:', { 
      posttitle: this.state.posttitle, 
      postbody: this.state.postbody?.substring(0, 50) + '...',
      status: status
    });

    if (status === 'published') {
      this.setState({isPublishing: true, error: ''});
    } else {
      this.setState({isSavingDraft: true, error: ''});
    }

    const requestBody = {
      name: this.props.name,
      postbody: (this.state.postbody || '').trim() || '',
      posttitle: (this.state.posttitle || '').trim(),
      id: this.props.id,
      category_ids: this.state.selectedCategories || [],
      status: status
    };

    console.log('Request body being sent:', requestBody);

    fetch('http://localhost:3001/blogpost', {
      method: 'post',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(requestBody)
    })
      .then(response => {
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
          // Try to get error details from response
          return response.json().then(data => {
            throw new Error(data.error || data.details || `HTTP ${response.status}: ${response.statusText}`);
          }).catch(() => {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          });
        }
        
        return response.json();
      })
      .then(data => {
        console.log('Response data:', data);
        
        if (data && (data.id || data.error)) {
          if (data.error) {
            // Server returned an error
            console.error('Server error:', data);
            this.setState({
              error: `Server error: ${data.error}${data.details ? ' - ' + data.details : ''}`,
              isPublishing: false
            });
          } else {
            // Success
            const isDraft = status === 'draft';
            this.setState({
              postbody: '',
              posttitle: '',
              isPublishing: false,
              isSavingDraft: false,
              selectedCategories: []
            });
            
            // Clear the form fields
            document.getElementById('posttitle').value = '';
            // Note: Rich text editor doesn't use getElementById, but clearing state handles it
            
            if (!isDraft) {
              this.props.loadBlog(data);
            }
            console.log(`✅ Blog ${isDraft ? 'saved as draft' : 'published'} successfully:`, data);
            
            // Show toast notification if available
            if (this.props.showToast) {
              this.props.showToast(
                isDraft ? 'Draft saved successfully!' : 'Blog post published successfully!', 
                'success'
              );
            }
            
            // Refresh user posts to show the new draft
            if (isDraft && this.props.onDraftSaved) {
              this.props.onDraftSaved();
            }
          }
        } else {
          console.error('Unexpected response format:', data);
          this.setState({
            error: 'Unexpected response from server. Please try again.',
            isPublishing: false
          });
        }
      })
      .catch(err => {
        console.error('❌ Blog publishing error:', err);
        this.setState({
          error: `Connection error: ${err.message}. Please check your internet and try again.`,
          isPublishing: false,
          isSavingDraft: false
        });
      });
  }

  onSaveDraft = () => {
    this.onSubmitBlog('draft');
  }

  render() {
    const { posttitle, postbody, isPublishing, isSavingDraft, error } = this.state;
    // Get plain text length for character count (strip HTML)
    const tempDiv = document.createElement('div');
    if (postbody) {
      tempDiv.innerHTML = postbody;
    }
    const charCount = tempDiv.textContent?.length || tempDiv.innerText?.length || 0;
    const titleCharCount = posttitle.length;

    return (
      <div className="blog-writer-container">
        <div className="blog-writer-card">
          <div className="blog-writer-header">
            <h2>Write Your Blog Post</h2>
            <p>Share your thoughts with the world</p>
          </div>

          {error && (
            <div className="blog-error-message">
              {error}
            </div>
          )}

          <form className="blog-form" onSubmit={(e) => { e.preventDefault(); this.onSubmitBlog(); }}>
            <div className="form-group">
              <label className="form-label" htmlFor="posttitle">
                Blog Title
                <span className="char-count">{titleCharCount}/100</span>
              </label>
              <input
                className="blog-title-input"
                type="text"
                name="posttitle"
                id="posttitle"
                placeholder="Enter your blog post title..."
                value={posttitle}
                onChange={this.onTitleChange}
                maxLength={100}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="postbody">
                Blog Content
              </label>
              <RichTextEditor
                value={postbody}
                onChange={(content) => {
                  // Always update state to allow typing
                  // Character count validation happens on submit
                  this.setState({ postbody: content, error: '', success: false });
                }}
                placeholder="Write your blog post content here... Use the toolbar to format your text."
                maxLength={5000}
                rows={12}
              />
              <div className="char-count-info">
                <span className="char-count">{charCount}/5000 characters</span>
              </div>
            </div>

            <div className="form-group">
              <CategorySelector
                selectedCategories={this.state.selectedCategories}
                onChange={(categories) => this.setState({ selectedCategories: categories })}
                maxSelections={3}
              />
            </div>

            <div className="blog-actions">
              <div className="blog-action-buttons">
                <button
                  onClick={this.onSaveDraft}
                  className={`draft-button ${isSavingDraft ? 'saving' : ''}`}
                  disabled={isSavingDraft || isPublishing || !posttitle.trim()}
                  type="button"
                >
                  {isSavingDraft ? (
                    <>
                      <span className="spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="draft-icon">💾</span>
                      Save as Draft
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => this.onSubmitBlog('published')}
                  className={`publish-button ${isPublishing ? 'publishing' : ''}`}
                  disabled={isPublishing || isSavingDraft || !posttitle.trim() || !postbody.trim()}
                  type="submit"
                >
                  {isPublishing ? (
                    <>
                      <span className="spinner"></span>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <span className="publish-icon">📝</span>
                      Publish Blog Post
                    </>
                  )}
                </button>
              </div>

              <div className="blog-requirements">
                <p>• Title: 3-100 characters</p>
                <p>• Content: 10-5000 characters</p>
                <p>• Current: {titleCharCount} + {charCount} = {titleCharCount + charCount} total</p>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default BlogWriter;