import React from 'react';
import './post.css';

class Post extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: this.props.postbody
    }
  }

  render() {
    const { posttitle, postbody, name, created_at } = this.props;
    
    return (
      <div className="blog-post">
        <div className="blog-post-header">
          {posttitle && (
            <h1 className="blog-post-title">{posttitle}</h1>
          )}
          <div className="blog-post-meta">
            {name && (
              <span className="blog-post-author">by {name}</span>
            )}
            {created_at && (
              <span className="blog-post-date">
                {new Date(created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="blog-post-content">
          <p>{postbody}</p>
        </div>
      </div>
    );
  }
}

export default Post; 