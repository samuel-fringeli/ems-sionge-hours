import React from 'react';
import {NavLink} from 'react-router-dom';
import {Auth} from 'aws-amplify';

import '../../assets/scss/style.scss';
import Aux from "../../hoc/_Aux";
import Breadcrumb from "../../App/layout/AdminLayout/Breadcrumb";
import utils from '../../utils';

import avatar from '../../assets/images/user/avatar-3.jpg';
import logoDark from "../../assets/images/logo-dark.png";

class ProfileSettings extends React.Component {

    state = {
        modifyingProfile: false,
        email: utils.getEmail(),
        firstname: utils.getFirstname(),
        lastname: utils.getLastname(),
        formVerification: {
            firstname: true,
            lastname: true,
            email: true,
            nonExistingEmail: true
        }
    };

    emailsExceptions = [];

    modify = element => event => {
        let toChange = {};
        toChange[element] = event.target.value;
        this.setState(toChange);
    };

    checkEnter = event => {
        if (event.keyCode === 13) this.updateHandler();
    };

    verifyForm = () => {
        let toChange = {
            firstname: true,
            lastname: true,
            email: true,
            nonExistingEmail: true
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
        this.setState({
            ...this.state,
            formVerification: toChange
        });
        return (toChange.firstname && toChange.lastname && toChange.email && toChange.nonExistingEmail);
    };

    updateHandler = () => {
        if (this.verifyForm()) {
            this.setState({ modifyingProfile: true }, () => {
                Auth.updateUserAttributes(Auth.user, {
                    'email': this.state.email,
                    'custom:firstname': this.state.firstname,
                    'custom:lastname': this.state.lastname
                }).then(() => {
                    Auth.currentAuthenticatedUser({ bypassCache: true }).then(user => {
                        utils.notify.success({
                            title: 'Votre profil a été mis à jour avec succès',
                            stack: window.stackBottomRight,
                            delay: 2500
                        });
                        this.props.history.push('/workdays');
                    }).catch(err => {
                        alert('Une erreur inconnue est survenue.');
                        console.log(err);
                        this.setState({ modifyingProfile: false });
                    });
                }).catch(err => {
                    if (err.hasOwnProperty('code') && err.code === 'AliasExistsException') {
                        this.emailsExceptions.push(this.state.email);
                        this.verifyForm();
                        this.setState({ modifyingProfile: false });
                    } else {
                        alert('Une erreur inconnue est survenue.');
                        console.log(err);
                        this.setState({ modifyingProfile: false });
                    }
                });
            });
        }
    };

    render () {
        return(
            <Aux>
                <Breadcrumb/>
                <div className="auth-wrapper">
                    <div className="auth-content">
                        <div className="auth-bg">
                            <span className="r"/>
                            <span className="r s"/>
                            <span className="r s"/>
                            <span className="r"/>
                        </div>
                        <div className="card">
                            <div className="card-body text-center">
                                <img src={logoDark} alt="" className="img-fluid mb-4" />
                                <h4 className="mb-4 f-w-400">Paramètres de profil</h4>
                                <img src={avatar} className="img-radius mb-4 d-none" alt="User-Profile"/>
                                <div className="input-group mb-3">
                                    <input type="text" disabled={this.state.modifyingProfile}
                                           className={'form-control' + (this.state.formVerification.firstname ? '':' is-invalid')}
                                           onChange={this.modify('firstname')}
                                           value={this.state.firstname}
                                           placeholder="Prénom"/>
                                    { this.state.formVerification.firstname ? null: (
                                        <div className="invalid-feedback text-left">Ce champs est requis.</div>
                                    )}
                                </div>
                                <div className="input-group mb-3">
                                    <input type="text" disabled={this.state.modifyingProfile}
                                           className={'form-control' + (this.state.formVerification.lastname ? '':' is-invalid')}
                                           onChange={this.modify('lastname')}
                                           value={this.state.lastname}
                                           placeholder="Nom de famille"/>
                                    { this.state.formVerification.lastname ? null: (
                                        <div className="invalid-feedback text-left">Ce champs est requis.</div>
                                    )}
                                </div>
                                <div className="input-group mb-3">
                                    <input type="email" disabled={this.state.modifyingProfile}
                                           className={'form-control' + ((this.state.formVerification.email && this.state.formVerification.nonExistingEmail) ? '':' is-invalid')}
                                           onChange={this.modify('email')}
                                           onKeyDown={this.checkEnter}
                                           value={this.state.email}
                                           placeholder="Adresse email"/>
                                    { this.state.formVerification.email ? (this.state.formVerification.nonExistingEmail ? null:(
                                        <div className="invalid-feedback text-left">Cet email est déjà utilisé.</div>
                                    )): (
                                        <div className="invalid-feedback text-left">Cet email est invalide.</div>
                                    )}
                                </div>
                                <button className="btn btn-block btn-primary mb-4"
                                        disabled={this.state.modifyingProfile}
                                        onClick={this.updateHandler}>
                                    Mettre à jour
                                </button>
                                <p className="mb-0 text-muted text-center">
                                    <NavLink to="/workdays" className="f-w-400">Retour à la page principale</NavLink>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Aux>
        );
    }
}

export default ProfileSettings;
