
import OldPosts from './oldposts.js';
import Post from './post.js';
import SignIn from './signin.js';
import Register from './register.js';
import BlogWriter from './blogwriter.js';
import AllBlogs from './allblogs.js';
import SignButton from './SignButton.js';
import RegButton from './RegButton.js';
import SearchBar from './searchbar';
import StickyNavbar from './StickyNavbar.js';
import ToastContainer from './components/ToastContainer.js';
import BackToTop from './components/BackToTop.js';
import Avatar from './components/Avatar.js';
import './App.css';
import React from 'react';

class App extends React.Component {
  constructor() {
    super();
    this.allBlogsRef = React.createRef();
    this.state = {
      headerdiv: "hidden",
      input: '',
      imageUrl: '',
      box: {},
      route: 'blogs',
      isSignedIn: false,
      allblogs: [],
      user: {
        id: '',
        name: '',
        email: '',
        joined: '',
        postbody: '',
        oldposts: '',
        posttitle: ''
      },
      posttext: "",
      refreshUserPosts: false,
      toasts: []
    };
  }

  // Toast notification methods
  showToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    this.setState(prevState => ({
      toasts: [...prevState.toasts, { id, message, type, duration }]
    }));
    return id;
  };

  removeToast = (id) => {
    this.setState(prevState => ({
      toasts: prevState.toasts.filter(toast => toast.id !== id)
    }));
  };

  signout = () => {
    this.setState({
      route: 'blogs',
      isSignedIn: false,
      user: {
        name: '',
        email: '',
        id: ''
      }
    })
  }

  loadUser = (data) => {
    this.setState({
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        joined: data.joined,
        postbody: data.postbody,
        posttitle: data.posttitle
      },
      isSignedIn: true,
      route: 'home'
    });
    this.showToast(`Welcome back, ${data.name}!`, 'success');
  }

  loadBlog = (data) => {
    this.setState({
      user: {
        ...this.state.user, // Preserve existing user data
        postbody: data.postbody,
        posttitle: data.posttitle,
        name: data.name,
        // Keep the original user ID, don't overwrite with blog post ID
      },
      refreshUserPosts: true // Trigger refresh of user posts
    });
    
    // Reset the refresh flag after a short delay
    setTimeout(() => {
      this.setState({ refreshUserPosts: false });
    }, 100);
    
    this.showToast('Blog post published successfully!', 'success');
  }

  loadAllBlog = (data) => {
    this.setState({ allblogs: data.allblogs })
  }

  handleSearchResults = (results, searchTerm) => {
    // Pass search results to AllBlogs component
    if (this.allBlogsRef && this.allBlogsRef.current) {
      this.allBlogsRef.current.handleSearchResults(results, searchTerm);
    }
  }

  handlePostUpdated = (updatedPost) => {
    // Refresh all blogs when a post is updated
    if (this.allBlogsRef && this.allBlogsRef.current) {
      this.allBlogsRef.current.allblogview();
    }
  }

  handlePostDeleted = (postId) => {
    // Refresh all blogs when a post is deleted
    if (this.allBlogsRef && this.allBlogsRef.current) {
      this.allBlogsRef.current.allblogview();
    }
  }

  componentDidMount() {
    fetch('http://localhost:3001')
      .then(response => response.json())
      .then(console.log)
  }

  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState({ 
        isSignedIn: false,
        route: 'blogs',
        user: {
          name: '',
          email: '',
          id: ''
        }
      })
    } else if (route === 'home') {
      this.setState({ isSignedIn: true, route: 'home' })
    } else {
      this.setState({ route: route });
    }
  }

  render() {
    return (
      <div className="App">
        <ToastContainer 
          toasts={this.state.toasts}
          removeToast={this.removeToast}
        />
        
        <BackToTop />
        
        <StickyNavbar 
          isSignedIn={this.state.isSignedIn}
          user={this.state.user}
          onRouteChange={this.onRouteChange}
          loadUser={this.loadUser}
          signout={this.signout}
          onSearchResults={this.handleSearchResults}
        />
        
        <div className="container">
          {this.state.route === 'signin' ? (
            <div className="main-content centered">
              <div className="content-area">
                <SignIn 
                  loadUser={this.loadUser} 
                  onRouteChange={this.onRouteChange}
                  showToast={this.showToast}
                />
              </div>
            </div>
          ) : this.state.route === 'register' ? (
            <div className="main-content centered">
              <div className="content-area">
                <Register 
                  loadUser={this.loadUser} 
                  onRouteChange={this.onRouteChange}
                  showToast={this.showToast}
                />
              </div>
            </div>
          ) : this.state.route === 'home' ? (
            <div className="main-content">
              <div className="content-area">
                <BlogWriter 
                  loadBlog={this.loadBlog} 
                  name={this.state.user.name} 
                  id={this.state.user.id}
                  showToast={this.showToast}
                />
                
                {/* Show current post if exists */}
                {this.state.user.postbody && (
                  <Post 
                    postbody={this.state.user.postbody} 
                    posttitle={this.state.user.posttitle} 
                    id={this.state.user.id} 
                    name={this.state.user.name} 
                  />
                )}
              </div>
              
              <div className="sidebar">
                <div className="user-profile-section">
                  <h3>Your Profile</h3>
                  <div className="user-profile">
                    <div className="user-profile-avatar">
                      <Avatar 
                        userId={this.state.user.id}
                        userName={this.state.user.name}
                        size="large"
                        showUpload={true}
                        onUpload={(url) => {
                          this.showToast('Avatar updated successfully!', 'success');
                        }}
                      />
                    </div>
                    <p><strong>Name:</strong> {this.state.user.name}</p>
                    <p><strong>Email:</strong> {this.state.user.email}</p>
                    <p><strong>User ID:</strong> {this.state.user.id}</p>
                    {this.state.user.joined && (
                      <p><strong>Joined:</strong> {new Date(this.state.user.joined).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                
                <div className="user-posts-section">
                  <h3>Your Previous Posts</h3>
                  <OldPosts 
                    loadBlog={this.loadBlog} 
                    name={this.state.user.name} 
                    id={this.state.user.id}
                    refreshTrigger={this.state.refreshUserPosts}
                    showToast={this.showToast}
                    onPostUpdated={this.handlePostUpdated}
                    onPostDeleted={this.handlePostDeleted}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Default to showing all blogs for any other route
            <div className="main-content centered">
              <div className="content-area">
                <AllBlogs 
                  ref={this.allBlogsRef}
                  loadAllBlog={this.loadAllBlog} 
                  allblogs={this.state.allblogs}
                  userId={this.state.user.id}
                  userName={this.state.user.name}
                  showToast={this.showToast}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default App;
