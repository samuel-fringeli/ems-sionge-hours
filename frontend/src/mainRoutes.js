import React from 'react';
import utils from './utils';
import axios from "axios";

const SignIn2 = React.lazy(() => new Promise(async resolve => {
    if (await utils.isAuthenticated()) await utils.logout();
    try {
        const { data } = await axios.get(window.API_GATEWAY_ENDPOINT + '/cognitoUsers');
        window.COGNITO_USERS = data.dbData.success.Users
            .map(user => user.Attributes
            .find(a => a.Name === 'email').Value)
            .filter(m => m.includes('@samf.me') || m.includes('@pyme.ch') || m === 'lnoth@lnoth.ch' || m === 'samuel.fringeli@me.com')
        resolve(await import('./Pages/Authentication/SignIn/SignIn2'));
    } catch (e) {
        alert('Une erreur inconnue est survenue.')
    }
}));

const SignUp2 = React.lazy(() => new Promise(async resolve => {
    if (await utils.isAuthenticated()) await utils.logout();
    resolve(await import('./Pages/Authentication/SignUp/SignUp2'));
}));

const ChangePassword = React.lazy(() => new Promise(async resolve => {
    if (await utils.isAuthenticated()) resolve(await import('./Pages/Authentication/ChangePassword'));
    else window.location.assign('/auth/signin');
}));

const ProfileSettings = React.lazy(() => new Promise(async resolve => {
    if (await utils.isAuthenticated()) resolve(await import('./Pages/Authentication/ProfileSettings'));
    else window.location.assign('/auth/signin');
}));

const mainRoutes = [
    { path: '/auth/signup', exact: true, name: 'SignUp', component: SignUp2 },
    { path: '/auth/signin', exact: true, name: 'SignIn', component: SignIn2 },
    { path: '/auth/change-password', exact: true, name: 'Changer le mot de passe', component: ChangePassword },
    { path: '/auth/profile-settings', exact: true, name: 'Paramètres de profil', component: ProfileSettings }
];

export default mainRoutes;
