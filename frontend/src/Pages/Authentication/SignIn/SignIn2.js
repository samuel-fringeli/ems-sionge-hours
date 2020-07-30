import React from 'react';
import {NavLink} from 'react-router-dom';
import utils from '../../../utils';
import { withRouter } from 'react-router';

import './../../../assets/scss/style.scss';
import Aux from "../../../hoc/_Aux";
import Breadcrumb from "../../../App/layout/AdminLayout/Breadcrumb";

import authLogo from '../../../assets/images/auth/auth-logo.png';
import authLogoDark from '../../../assets/images/auth/auth-logo-dark.png';

class SignIn2 extends React.Component {
    state = {
        email: '',
        password: '',
        emailError: false,
        passwordError: false,
        emailEmpty: false,
        passwordEmpty: false
    };

    modify = element => event => {
        let toChange = {};
        toChange[element] = event.target.value;
        this.setState(toChange);
    };

    checkEnter = event => {
        if (event.keyCode === 13) this.signInHandler();
    };

    signInHandler = () => {
        if (this.state.email === '') this.setState({ emailEmpty: true });
        if (this.state.password === '') this.setState({ passwordEmpty: true });
        if (this.state.email === '' || this.state.password === '') return;

        this.setState({ signingIn: true }, () => {
            utils.signIn(this.state.email, this.state.password).then(user => {
                utils.isAuthenticated().then(isAuthenticated => {
                    if (isAuthenticated) {
                        utils.notify.success({
                            title: "Bienvenue, " + user.attributes['custom:firstname'],
                            stack: window.stackBottomRight,
                            delay: 2500
                        });
                        this.props.history.push('/workdays');
                    } else {
                        alert('An unexpected error occured');
                        this.setState({ signingIn: false });
                    }
                });
            }).catch(err => {
                if (err.hasOwnProperty('code') && err.code === 'NotAuthorizedException') {
                    this.setState({
                        emailEmpty: false,
                        passwordEmpty: false,
                        passwordError: true,
                        emailError: false,
                        signingIn: false
                    });
                } else if (err.hasOwnProperty('code') && err.code === 'UserNotFoundException') {
                    this.setState({
                        emailEmpty: false,
                        passwordEmpty: false,
                        passwordError: false,
                        emailError: true,
                        signingIn: false
                    });
                } else if (err.hasOwnProperty('code') && err.code === 'LimitExceededException') {
                    utils.notify.error({
                        title: 'Vous avez entré un mot de passe erroné à plusieurs raprises. Votre requête est donc actuellement bloquée. Merci de réessayer plus tard.',
                        stack: window.stackBottomRight,
                        delay: 2500
                    });
                    this.setState({ signingIn: false });
                } else {
                    alert('An unexpected error occured');
                    console.log(err);
                    this.setState({ signingIn: false });
                }
            });
        });
    };

    render () {
        return(
            <Aux>
                <Breadcrumb/>
                <div className="auth-wrapper align-items-stretch aut-bg-img">
                    <div className="flex-grow-1">
                        <div className="h-100 d-md-flex align-items-center auth-side-img">
                            <div className="col-sm-10 auth-content w-auto">
                                <img src={authLogo} alt="" className="img-fluid" />
                                <h1 className="text-white my-4">Bienvenue !</h1>
                                <h4 className="text-white font-weight-normal">Veuillez vous connecter pour gérer vos heures de travail.</h4>
                            </div>
                        </div>
                        <div className="auth-side-form">
                            <div className=" auth-content">
                                <img src={authLogoDark} alt="" className="img-fluid mb-4 d-block d-xl-none d-lg-none" />
                                <h3 className="mb-4 f-w-400">Se connecter</h3>
                                <div className="input-group mb-3">
                                    <input type="email" disabled={this.state.signingIn}
                                           className={'form-control' + (this.state.emailError || this.state.emailEmpty ? ' is-invalid':'')}
                                           placeholder="Adresse email"
                                           onChange={this.modify('email')}
                                           value={this.state.email}/>
                                    { this.state.emailEmpty ? (
                                        <div className="invalid-feedback">Ce champs est requis.</div>
                                    ): this.state.emailError ? (
                                        <div className="invalid-feedback">This email is not assigned to an account</div>
                                    ):null }
                                </div>
                                <div className="input-group mb-4">
                                    <input type="password" disabled={this.state.signingIn}
                                           className={'form-control' + (this.state.passwordError || this.state.passwordEmpty ?  ' is-invalid':'')}
                                           placeholder="Mot de passe"
                                           onKeyDown={this.checkEnter}
                                           onChange={this.modify('password')}
                                           value={this.state.password}/>
                                    { this.state.passwordEmpty ? (
                                        <div className="invalid-feedback">Ce champs est requis.</div>
                                    ): this.state.passwordError ? (
                                        <div className="invalid-feedback">Your password is incorrect</div>
                                    ):null }
                                </div>
                                {/*<div className="form-group text-left mt-2">
                                    <div className="checkbox checkbox-primary d-none">
                                        <input type="checkbox" name="checkbox-p-1" id="checkbox-p-1" checked="" />
                                        <label htmlFor="checkbox-p-1" className="cr">Save credentials</label>
                                    </div>
                                </div>*/}
                                <button className="btn btn-block btn-primary mb-0" disabled={this.state.signingIn} onClick={this.signInHandler}>Connexion</button>
                                <div className="text-center">
                                    <p className="mb-0 mt-3 text-muted">Vous n'avez pas de compte? <NavLink to="/auth/signup" className="f-w-400">Créez-en un !</NavLink></p>
                                </div>
                                <div className="text-center d-none">
                                    <div className="saprator my-4"><span>OR</span></div>
                                    <button className="btn text-white bg-facebook mb-2 mr-2  wid-40 px-0 hei-40 rounded-circle"><i className="fab fa-facebook-f"/></button>
                                    <button className="btn text-white bg-googleplus mb-2 mr-2 wid-40 px-0 hei-40 rounded-circle"><i className="fab fa-google-plus-g"/></button>
                                    <button className="btn text-white bg-twitter mb-2  wid-40 px-0 hei-40 rounded-circle"><i className="fab fa-twitter"/></button>
                                    <p className="mb-2 text-muted">Forgot password? <NavLink to="/auth/reset-password-2" className="f-w-400">Reset</NavLink></p>
                                    <p className="mb-0 text-muted">Don’t have an account? <NavLink to="/auth/signup" className="f-w-400">Signup</NavLink></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Aux>
        );
    }
}

export default withRouter(SignIn2);
