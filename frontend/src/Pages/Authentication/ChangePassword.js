import React from 'react';

import '../../assets/scss/style.scss';
import Aux from "../../hoc/_Aux";
import Breadcrumb from "../../App/layout/AdminLayout/Breadcrumb";
import logoDark from '../../assets/images/logo-dark.png';
import {NavLink} from "react-router-dom";
import {Auth} from 'aws-amplify';
import utils from "../../utils";

class ChangePassword extends React.Component {
    state = {
        changingPassword: false,
        currentPassword: '',
        newPassword: '',
        repeatPassword: '',
        formVerification: {
            currentPassword: true,
            newPassword: true,
            repeatPassword: true
        }
    };

    modify = element => event => {
        let toChange = {};
        toChange[element] = event.target.value;
        this.setState(toChange);
    };

    checkEnter = event => {
        if (event.keyCode === 13) this.changePasswordHandler();
    };

    verifyForm = () => {
        let toChange = {
            newPassword: true,
            repeatPassword: true,
            currentPassword: true
        };
        if (!(((/[a-z].*[A-Z]/.test(this.state.newPassword) || /[A-Z].*[a-z]/.test(this.state.newPassword))) && this.state.newPassword.length >= 8)) {
            toChange.newPassword = false;
        }
        if (this.state.repeatPassword !== this.state.newPassword || this.state.repeatPassword === '') {
            toChange.repeatPassword = false;
        }
        this.setState({
            ...this.state,
            formVerification: toChange
        });
        return (toChange.repeatPassword && toChange.newPassword);
    };

    changePasswordHandler = () => {
        if (this.verifyForm()) {
            this.setState({ changingPassword: true }, () => {
                Auth.changePassword(Auth.user, this.state.currentPassword, this.state.newPassword).then(() => {
                    utils.notify.success({
                        title: 'Votre mot de passe a été modifié avec succès.',
                        stack: window.stackBottomRight,
                        delay: 2500
                    });
                    this.props.history.push('/workdays');
                }).catch(err => {
                    if (err.hasOwnProperty('code') && (err.code === 'NotAuthorizedException' || err.code === 'InvalidParameterException')) {
                        this.setState({
                            changingPassword: false,
                            formVerification: {
                                ...this.state.formVerification,
                                currentPassword: false
                            }
                        });
                    } else if (err.hasOwnProperty('code') && err.code === 'LimitExceededException') {
                        utils.notify.error({
                            title: 'Vous avez entré un mot de passe erroné à plusieurs raprises. Votre requête est donc actuellement bloquée. Merci de réessayer plus tard.',
                            stack: window.stackBottomRight,
                            delay: 2500
                        });
                        this.setState({changingPassword: false});
                    } else {
                        alert('Une erreur inconnue est survenue.');
                        console.log(err);
                        this.setState({changingPassword: false});
                    }
                })
            });
        }
    };

    render () {
        return(
            <Aux>
                <Breadcrumb/>
                <div className="auth-wrapper">
                    <div className="blur-bg-images"/>
                    <div className="auth-content">
                        <div className="card">
                            <div className="row align-items-center">
                                <div className="col-md-12">
                                    <div className="card-body">
                                        <img src={logoDark} alt="" className="img-fluid mb-4" />
                                        <h4 className="mb-4 f-w-400">Change your password</h4>
                                        <div className="input-group mb-2">
                                            <input type="password" disabled={this.state.changingPassword}
                                                   className={'form-control' + (this.state.formVerification.currentPassword ? '':' is-invalid')}
                                                   onChange={this.modify('currentPassword')}
                                                   value={this.state.currentPassword}
                                                   placeholder="Mot de passe actuel"/>
                                            { this.state.formVerification.currentPassword ? null: (
                                                <div className="invalid-feedback">Your password is invalid</div>
                                            )}
                                        </div>
                                        <div className="input-group mb-2">
                                            <input type="password" disabled={this.state.changingPassword}
                                                   className={'form-control' + (this.state.formVerification.newPassword ? '':' is-invalid')}
                                                   onChange={this.modify('newPassword')}
                                                   value={this.state.newPassword}
                                                   placeholder="Nouveau mot de passe"/>
                                            { this.state.formVerification.newPassword ? null: (
                                                <div className="invalid-feedback">Votre mot de passe doit contenir au moins 8 caractères, dont au moins un en majuscule.</div>
                                            )}
                                        </div>
                                        <div className="input-group mb-4">
                                            <input type="password" disabled={this.state.changingPassword}
                                                   className={'form-control' + (this.state.formVerification.repeatPassword ? '':' is-invalid')}
                                                   onChange={this.modify('repeatPassword')}
                                                   value={this.state.repeatPassword}
                                                   onKeyDown={this.checkEnter}
                                                   placeholder="Répéter le nouveau mot de passe"/>
                                            { this.state.formVerification.repeatPassword ? null: (
                                                <div className="invalid-feedback">Les deux mots de passe entrés ne correspondent pas.</div>
                                            )}
                                        </div>
                                        <button className="btn btn-block btn-primary mb-4" disabled={this.state.changingPassword} onClick={this.changePasswordHandler}>Changer le mot de passe</button>
                                        <p className="mb-0 text-muted text-center">
                                            <NavLink to="/workdays" className="f-w-400">Retour à la page principale</NavLink>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Aux>
        );
    }
}

export default ChangePassword;
