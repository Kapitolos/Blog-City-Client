import React from 'react';
import './blogwriter.css';

class BlogWriter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      postbody: '',
      posttitle: '',
      isPublishing: false,
      error: '',
      success: false
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

  onSubmitBlog = () => {
    if (!this.validateForm()) {
      return;
    }

    console.log('=== FRONTEND: Starting blog post submission ===');
    console.log('Props:', { name: this.props.name, id: this.props.id });
    console.log('State:', { 
      posttitle: this.state.posttitle, 
      postbody: this.state.postbody?.substring(0, 50) + '...' 
    });

    this.setState({isPublishing: true, error: ''});

    const requestBody = {
      name: this.props.name,
      postbody: this.state.postbody.trim(),
      posttitle: this.state.posttitle.trim(),
      id: this.props.id
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
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
            this.setState({
              success: true,
              postbody: '',
              posttitle: '',
              isPublishing: false
            });
            
            // Clear the form fields
            document.getElementById('posttitle').value = '';
            document.getElementById('postbody').value = '';
            
            this.props.loadBlog(data);
            console.log('✅ Blog published successfully:', data);
            
            // Clear success message after 5 seconds
            setTimeout(() => {
              this.setState({ success: false });
            }, 5000);
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
          isPublishing: false
        });
      });
  }

  render() {
    const { posttitle, postbody, isPublishing, error, success } = this.state;
    const charCount = postbody.length;
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

          {success && (
            <div className="blog-success-message">
              ✅ Blog post published successfully! Check your "Previous Posts" on the right.
            </div>
          )}

          <div className="blog-form">
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
                <span className="char-count">{charCount}/5000</span>
              </label>
              <textarea
                className="blog-content-textarea"
                name="postbody"
                id="postbody"
                placeholder="Write your blog post content here..."
                value={postbody}
                onChange={this.onTextChange}
                maxLength={5000}
                rows={12}
                required
              />
            </div>

            <div className="blog-actions">
              <button
                onClick={this.onSubmitBlog}
                className={`publish-button ${isPublishing ? 'publishing' : ''}`}
                disabled={isPublishing || !posttitle.trim() || !postbody.trim()}
                type="button"
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

              <div className="blog-requirements">
                <p>• Title: 3-100 characters</p>
                <p>• Content: 10-5000 characters</p>
                <p>• Current: {titleCharCount} + {charCount} = {titleCharCount + charCount} total</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default BlogWriter;