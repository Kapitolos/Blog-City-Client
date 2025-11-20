import React from 'react';
import './signin.css';

class Signin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      signInEmail: '',
      signInPassword: '',
      showreg: false,
      isLoading: false,
      error: ''
    }
  }

  changeshowreg = () => {
    this.props.onRouteChange('register');
  }

  onEmailChange = (event) => {
    this.setState({signInEmail: event.target.value, error: ''})
  }

  onPasswordChange = (event) => {
    this.setState({signInPassword: event.target.value, error: ''})
  }

  onSubmitSignIn = () => {
    if (!this.state.signInEmail || !this.state.signInPassword) {
      this.setState({error: 'Please fill in all fields'});
      return;
    }

    this.setState({isLoading: true, error: ''});
    
    fetch('http://localhost:3001/signin', {
      method: 'post',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: this.state.signInEmail,
        password: this.state.signInPassword
      })
    })
      .then(response => {
        // Check if response is ok before parsing JSON
        if (!response.ok) {
          // Try to parse error message from response
          return response.json().then(data => {
            throw new Error(data.error || 'Invalid email or password');
          }).catch(() => {
            // If JSON parsing fails, throw a generic error
            throw new Error(`Sign in failed: ${response.status} ${response.statusText}`);
          });
        }
        // Response is ok, parse JSON
        return response.json();
      })
      .then(user => {
        this.setState({isLoading: false});
        if (user && user.id) {
          this.props.loadUser(user);
          this.props.onRouteChange('home');
          console.log("This is from Sign In");
          console.log(user);
        } else {
          const errorMsg = 'Invalid email or password';
          this.setState({error: errorMsg});
          if (this.props.showToast) {
            this.props.showToast(errorMsg, 'error');
          }
        }
      })
      .catch(err => {
        this.setState({isLoading: false});
        const errorMsg = err.message || 'Connection error. Please try again.';
        this.setState({error: errorMsg});
        if (this.props.showToast) {
          this.props.showToast(errorMsg, 'error');
        }
        console.error('Sign in error:', err);
      })
  }

  render() {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {this.state.error && (
            <div className="message message-error">
              {this.state.error}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); this.onSubmitSignIn(); }}>
            <div className="form-group">
              <label className="form-label" htmlFor="email-address">Email Address</label>
              <input
                className="form-input"
                type="email"
                name="email-address"
                id="email-address"
                placeholder="Enter your email"
                value={this.state.signInEmail}
                onChange={this.onEmailChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                className="form-input"
                type="password"
                name="password"
                id="password"
                placeholder="Enter your password"
                value={this.state.signInPassword}
                onChange={this.onPasswordChange}
                required
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary auth-button ${this.state.isLoading ? 'loading' : ''}`}
              disabled={this.state.isLoading}
            >
              {this.state.isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Don't have an account? 
              <button 
                className="link-button" 
                onClick={this.changeshowreg}
              >
                Register here
              </button>
            </p>
            <p>Just want to browse? 
              <button 
                className="link-button" 
                onClick={() => this.props.onRouteChange('blogs')}
              >
                View all posts
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default Signin;