import React from 'react';
import utils from './utils';

const SignIn2 = React.lazy(() => new Promise(async resolve => {
    if (await utils.isAuthenticated()) await utils.logout();
    resolve(await import('./Pages/Authentication/SignIn/SignIn2'));
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
    { path: '/auth/change-password', exact: true, name: 'Change Password', component: ChangePassword },
    { path: '/auth/profile-settings', exact: true, name: 'Profile Settings', component: ProfileSettings }
];

export default mainRoutes;
