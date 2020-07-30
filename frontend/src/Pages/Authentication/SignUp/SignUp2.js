import React from 'react';
import { withRouter } from 'react-router';
import { NavLink } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import utils from '../../../utils';

import './../../../assets/scss/style.scss';
import Aux from "../../../hoc/_Aux";
import Breadcrumb from "../../../App/layout/AdminLayout/Breadcrumb";

import authLogo from '../../../assets/images/auth/auth-logo.png';
import authLogoDark from '../../../assets/images/auth/auth-logo-dark.png';
import DEMO from "../../../store/constant";

class SignUp2 extends React.Component {
    state = {
        signingUp: false,
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        repeatPassword: '',
        formVerification: {
            firstname: true,
            lastname: true,
            email: true,
            nonExistingEmail: true,
            password: true,
            repeatPassword: true
        }
    };

    emailsExceptions = [];

    modify = element => event => {
        let toChange = {};
        toChange[element] = event.target.value;
        this.setState(toChange);
    };

    checkEnter = event => {
        if (event.keyCode === 13) this.signUpHandler();
    };

    verifyForm = () => {
        let toChange = {
            firstname: true,
            lastname: true,
            email: true,
            nonExistingEmail: true,
            password: true,
            repeatPassword: true
        };
        if (this.state.firstname === '') {
            toChange.firstname = false;
        }
        if (this.state.lastname === '') {
            toChange.lastname = false;
        }
        // eslint-disable-next-line
        if (!(/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,8})$/.test(this.state.email))) {
            toChange.email = false;
        }
        if (this.emailsExceptions.includes(this.state.email)) {
            toChange.nonExistingEmail = false;
        }
        if (!(((/[a-z].*[A-Z]/.test(this.state.password) || /[A-Z].*[a-z]/.test(this.state.password))) && this.state.password.length >= 8)) {
            toChange.password = false;
        }
        if (this.state.repeatPassword !== this.state.password || this.state.repeatPassword === '') {
            toChange.repeatPassword = false;
        }
        this.setState({
            ...this.state,
            formVerification: toChange
        });
        return (toChange.firstname && toChange.lastname && toChange.email && toChange.password && toChange.repeatPassword && toChange.nonExistingEmail);
    };

    signUpHandler = () => {
        if (this.verifyForm()) {
            this.setState({ signingUp: true }, () => {
                Auth.signUp({
                    username: this.state.email,
                    password: this.state.password,
                    attributes: {
                        'custom:firstname': this.state.firstname,
                        'custom:lastname': this.state.lastname
                    }
                }).then(() => {
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
                                this.setState({ signingUp: false });
                            }
                        });
                    }).catch(err => {
                        alert('An unexpected error occured');
                        console.log(err);
                        this.setState({ signingUp: false });
                    });
                }).catch(err => {
                    if (err.hasOwnProperty('code') && err.code === 'UsernameExistsException') {
                        this.emailsExceptions.push(this.state.email);
                        this.verifyForm();
                        this.setState({ signingUp: false });
                    } else {
                        alert('An unexpected error occured');
                        console.log(err);
                        this.setState({ signingUp: false });
                    }
                });
            });
        }
    };

    render () {
        return(
            <Aux>
                <Breadcrumb/>
                <div className="auth-wrapper align-items-stretch aut-bg-img">
                    <div className="flex-grow-1">
                        <div className="h-100 d-md-flex align-items-center auth-side-img">
                            <div className="col-sm-10 auth-content w-auto">
                                <img src={authLogo} alt="" className="img-fluid"/>
                                <h1 className="text-white my-4">Bienvenue !</h1>
                                <h4 className="text-white font-weight-normal">Créer un compte pour gérer vos heures de travail.</h4>
                            </div>
                        </div>
                        <div className="auth-side-form">
                            <div className=" auth-content">
                                <img src={authLogoDark} alt="" className="img-fluid mb-4 d-block d-xl-none d-lg-none" />
                                <h4 className="mb-3 f-w-400">Créer un compte</h4>
                                <div className="input-group mb-3">
                                    <input type="text" disabled={this.state.signingUp}
                                           className={'form-control' + (this.state.formVerification.firstname ? '':' is-invalid')}
                                           onChange={this.modify('firstname')}
                                           value={this.state.firstname}
                                           placeholder="Prénom"/>
                                    { this.state.formVerification.firstname ? null: (
                                        <div className="invalid-feedback">Ce champs est requis.</div>
                                    )}
                                </div>
                                <div className="input-group mb-3">
                                    <input type="text" disabled={this.state.signingUp}
                                           className={'form-control' + (this.state.formVerification.lastname ? '':' is-invalid')}
                                           onChange={this.modify('lastname')}
                                           value={this.state.lastname}
                                           placeholder="Nom de famille"/>
                                    { this.state.formVerification.lastname ? null: (
                                        <div className="invalid-feedback">Ce champs est requis.</div>
                                    )}
                                </div>
                                <div className="input-group mb-3">
                                    <input type="email" disabled={this.state.signingUp}
                                           className={'form-control' + ((this.state.formVerification.email && this.state.formVerification.nonExistingEmail) ? '':' is-invalid')}
                                           onChange={this.modify('email')}
                                           value={this.state.email}
                                           placeholder="Adresse email"/>
                                    { this.state.formVerification.email ? (this.state.formVerification.nonExistingEmail ? null:(
                                        <div className="invalid-feedback">Cet email est déjà utilisé.</div>
                                    )): (
                                        <div className="invalid-feedback">Cet email est invalide.</div>
                                    )}
                                </div>
                                <div className="input-group mb-4">
                                    <input type="password" disabled={this.state.signingUp}
                                           className={'form-control' + (this.state.formVerification.password ? '':' is-invalid')}
                                           onChange={this.modify('password')}
                                           value={this.state.password}
                                           placeholder="Mot de passe"/>
                                    { this.state.formVerification.password ? null: (
                                        <div className="invalid-feedback">Votre mot de passe doit contenir au moins 8 caractères, dont au moins un en majuscule.</div>
                                    )}
                                </div>
                                <div className="input-group mb-4">
                                    <input type="password" disabled={this.state.signingUp}
                                           className={'form-control' + (this.state.formVerification.repeatPassword ? '':' is-invalid')}
                                           onChange={this.modify('repeatPassword')}
                                           onKeyDown={this.checkEnter}
                                           value={this.state.repeatPassword}
                                           placeholder="Répéter le mot de passe"/>
                                    { this.state.formVerification.repeatPassword ? null: (
                                        <div className="invalid-feedback">Les deux mots de passe entrés ne correspondent pas.</div>
                                    )}
                                </div>
                                <div className="form-group text-left mt-2">
                                    <div className="checkbox checkbox-primary d-none">
                                        <input type="checkbox" name="checkbox-fill-2" id="checkbox-fill-2" />
                                        <label htmlFor="checkbox-fill-2" className="cr">Send me the <a href={DEMO.BLANK_LINK}> Newsletter</a> weekly.</label>
                                    </div>
                                </div>
                                <button className="btn btn-primary btn-block mb-0" disabled={this.state.signingUp} onClick={this.signUpHandler}>Créer un compte</button>
                                <div className="text-center">
                                    <p className="mb-0 mt-3 text-muted">Vous avez déjà un compte? <NavLink to="/auth/signin" className="f-w-400">Se connecter</NavLink></p>
                                </div>
                                {/*<div className="text-center">
                                    <div className="saprator my-4"><span>OR</span></div>
                                    <button className="btn text-white bg-facebook mb-2 mr-2  wid-40 px-0 hei-40 rounded-circle">
                                        <i className="fab fa-facebook-f"/>
                                    </button>
                                    <button className="btn text-white bg-googleplus mb-2 mr-2 wid-40 px-0 hei-40 rounded-circle">
                                        <i className="fab fa-google-plus-g"/>
                                    </button>
                                    <button className="btn text-white bg-twitter mb-2  wid-40 px-0 hei-40 rounded-circle">
                                        <i className="fab fa-twitter"/>
                                    </button>
                                    <p className="mt-4">Already have an account?
                                        <NavLink to="/auth/signin" className='f-w-400'>Signin</NavLink>
                                    </p>
                                </div>*/}
                            </div>
                        </div>
                    </div>
                </div>
            </Aux>
        );
    }
}

export default withRouter(SignUp2);
