import React from 'react';
import './register.css';

class Register extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      name: '',
      isLoading: false,
      error: '',
      validationErrors: {}
    }
  }

  onNameChange = (event) => {
    this.setState({name: event.target.value, error: '', validationErrors: {}})
  }

  onEmailChange = (event) => {
    this.setState({email: event.target.value, error: '', validationErrors: {}})
  }

  onPasswordChange = (event) => {
    this.setState({password: event.target.value, error: '', validationErrors: {}})
  }

  validateForm = () => {
    const errors = {};
    
    if (!this.state.name.trim()) {
      errors.name = 'Name is required';
    } else if (this.state.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }
    
    if (!this.state.email.trim()) {
      errors.email = 'Email is required';
    } else if (!this.state.email.includes('@') || !this.state.email.includes('.')) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!this.state.password) {
      errors.password = 'Password is required';
    } else if (this.state.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    
    this.setState({ validationErrors: errors });
    return Object.keys(errors).length === 0;
  }

  onSubmitRegister = () => {
    if (!this.validateForm()) {
      return;
    }

    this.setState({isLoading: true, error: ''});
    
    fetch('http://localhost:3001/register', {
      method: 'post',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: this.state.email.trim(),
        password: this.state.password,
        name: this.state.name.trim()
      })
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Registration failed');
          });
        }
        return response.json();
      })
      .then(data => {
        this.setState({isLoading: false});
        if (data && data.id) {
          this.props.loadUser(data);
          this.props.onRouteChange('home');
          console.log('Registration successful:', data);
          if (this.props.showToast) {
            this.props.showToast(`Welcome, ${data.name}! Account created successfully.`, 'success');
          }
        } else {
          const errorMsg = 'Registration failed. Please try again.';
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
        console.error('Registration error:', err);
      })
  }

  render() {
    const { validationErrors } = this.state;
    
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Create Account</h2>
            <p>Join our community and start blogging</p>
          </div>

          {this.state.error && (
            <div className="message message-error">
              {this.state.error}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); this.onSubmitRegister(); }}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                className={`form-input ${validationErrors.name ? 'form-input-error' : ''}`}
                type="text"
                name="name"
                id="name"
                placeholder="Enter your full name"
                value={this.state.name}
                onChange={this.onNameChange}
                required
              />
              {validationErrors.name && (
                <div className="validation-error">{validationErrors.name}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email-address">Email Address</label>
              <input
                className={`form-input ${validationErrors.email ? 'form-input-error' : ''}`}
                type="email"
                name="email-address"
                id="email-address"
                placeholder="Enter your email address"
                value={this.state.email}
                onChange={this.onEmailChange}
                required
              />
              {validationErrors.email && (
                <div className="validation-error">{validationErrors.email}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                className={`form-input ${validationErrors.password ? 'form-input-error' : ''}`}
                type="password"
                name="password"
                id="password"
                placeholder="Create a password (min 6 characters)"
                value={this.state.password}
                onChange={this.onPasswordChange}
                required
              />
              {validationErrors.password && (
                <div className="validation-error">{validationErrors.password}</div>
              )}
              <div className="password-requirements">
                Password must be at least 6 characters long
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary auth-button ${this.state.isLoading ? 'loading' : ''}`}
              disabled={this.state.isLoading}
            >
              {this.state.isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? 
              <button 
                className="link-button" 
                onClick={() => this.props.onRouteChange('signin')}
              >
                Sign in here
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

export default Register;