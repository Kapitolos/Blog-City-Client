import React from 'react';
import Register from './register.js';
import SignIn from './signin.js';
import "./SignButton.css";

class SignButton extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        showsign: false,
        user: {
            id: '',
            name: '',
            email: '',
            joined: '',
            postbody: '',
            oldposts: '',
            posttitle: ''},
      }
    }

    loadUser = (data) => {
      this.setState({user: {
        id: data.id,
        name: data.name,
        email: data.email,
        joined: data.joined,
        postbody: data.postbody,
        posttitle: data.posttitle
      }})
    }

    changeshowsign = () => {
      this.setState({showsign: true})
    }

    hideSignIn = () => {
      this.setState({showsign: false})
    }

    render() {
        return (
            <div className="sign-button-container">
                {this.state.showsign === true ? (
                    <div className="auth-overlay">
                        <div className="auth-modal">
                            <button className="close-button" onClick={this.hideSignIn}>×</button>
                            <SignIn 
                                loadUser={this.props.loadUser} 
                                onRouteChange={this.props.onRouteChange}
                            />
                        </div>
                    </div>
                ) : (
                    <button className="btn btn-primary" onClick={this.changeshowsign}>
                        Sign In
                    </button>
                )}
            </div>
        );
    }
}

export default SignButton;
