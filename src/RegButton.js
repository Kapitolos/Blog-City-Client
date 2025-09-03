import React from 'react';
import Register from './register.js';

class RegButton extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        showreg: false,
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

    changeshowreg = () => {
      this.setState({showreg: true})
    }

    hideRegister = () => {
      this.setState({showreg: false})
    }

    render() {
        return (
            <div className="reg-button-container">
                {this.state.showreg === true ? (
                    <div className="auth-overlay">
                        <div className="auth-modal">
                            <button className="close-button" onClick={this.hideRegister}>×</button>
                            <Register 
                                loadUser={this.props.loadUser} 
                                onRouteChange={this.props.onRouteChange}
                            />
                        </div>
                    </div>
                ) : (
                    <button className="btn btn-secondary" onClick={this.changeshowreg}>
                        Register
                    </button>
                )}
            </div>
        );
    }
}

export default RegButton;
