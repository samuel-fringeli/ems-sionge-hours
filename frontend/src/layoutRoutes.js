import React from 'react';
import $ from 'jquery';
import utils from "./utils";

window.jQuery = $;
window.$ = $;
global.jQuery = $;

// all these routes are automatically redirected to /auth/signin if user is not authenticated (/App/index.js, line 14)
export default ['Workdays', 'Day'].map(item => ({
    path: '/' + item.toLowerCase(),
    exact: true,
    name: item,
    component: React.lazy(() => new Promise(async resolve => {
        if (item === 'Workdays' && window.WORKDAYS === false) {
            let { data } = await utils.getData('/workdays');
            let items;
            try {
                items = data.dbData.success.Items;
            } catch (e) {
                alert('Une erreur inconnue est survenue.');
                return console.log(e);
            }
            window.WORKDAYS = items;
        }

        resolve(await import('./Pages/' + item));
    }))
}));
