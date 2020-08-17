import { Auth } from 'aws-amplify';
import PNotify from "pnotify/dist/es/PNotify";
import "pnotify/dist/es/PNotifyButtons";
import "pnotify/dist/es/PNotifyConfirm";
import "pnotify/dist/es/PNotifyCallbacks";
import axios from "axios";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import $ from 'jquery';
window.jQuery = $;
window.$ = $;
global.jQuery = $;

// https://stackoverflow.com/questions/105034/
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

if (typeof window.stackBottomRight === 'undefined') {
    window.stackBottomRight = {
        'dir1': 'up',
        'dir2': 'left',
        'firstpos1': 25,
        'firstpos2': 25
    };
}

const getToken = () => new Promise((resolve, reject) => {
    Auth.currentAuthenticatedUser().then(user => {
        user.getSession((err, session) => {
            if (err) {
                alert('Une erreur inconnue est survenue.');
                console.log(err);
            } else {
                resolve(session.getIdToken().getJwtToken());
            }
        });
    }).catch(reject);
});

const getData = path => new Promise( resolve => {
    getToken().then(token => {
        axios.get(window.API_GATEWAY_ENDPOINT + path, {
            headers: { Authorization: token }
        }).then(resolve).catch(err => {
            if (path.startsWith('/day')) {
                resolve({}); // handled in component
            } else {
                alert('Une erreur inconnue est survenue.');
                console.log(err);
            }
        });
    }).catch(err => {
        alert('Une erreur inconnue est survenue.');
        console.log(err);
    });
});

const putData = path => data => new Promise(resolve => {
    getToken().then(token => {
        axios.put(window.API_GATEWAY_ENDPOINT + path, data, {
            headers: { Authorization: token }
        }).then(resolve).catch(err => {
            alert('Une erreur inconnue est survenue.');
            console.log(err);
        });
    }).catch(err => {
        alert('Une erreur inconnue est survenue.');
        console.log(err);
    })
});

const postData = (path, action) => data => new Promise(resolve => {
    getToken().then(token => {
        axios.post(window.API_GATEWAY_ENDPOINT + path + '?action=' + action, data, {
            headers: { Authorization: token }
        }).then(resolve).catch(err => {
            alert('Une erreur inconnue est survenue.');
            console.log(err);
        });
    }).catch(err => {
        alert('Une erreur inconnue est survenue.');
        console.log(err);
    })
});

const deleteData = path => (key, dayId) => new Promise(resolve => {
    getToken().then(token => {
        axios.delete(window.API_GATEWAY_ENDPOINT + path + '?id=' + key +
            (path === '/day' ? ('&dayId=' + dayId) : ''), { headers: {Authorization: token }
        }).then(resolve).catch(err => {
            alert('Une erreur inconnue est survenue.');
            console.log(err);
        });
    }).catch(err => {
        alert('Une erreur inconnue est survenue.');
        console.log(err);
    })
});

export default {
    getToken: getToken,
    getData: getData,
    postData: postData,
    deleteData: deleteData,
    capitalizeFirstLetter: s => s.charAt(0).toUpperCase() + s.slice(1),

    isAuthenticated: () => new Promise(resolve => {
        Auth.currentAuthenticatedUser().then(user => resolve(true)).catch(err => resolve(false));
    }),

    getFirstname: () => Auth.user.attributes['custom:firstname'],
    getLastname: () => Auth.user.attributes['custom:lastname'],
    getEmail: () => Auth.user.attributes.email,
    getUserId: () => Auth.user.attributes.sub,
    notify: PNotify,

    logout: () => new Promise(resolve => {
        Auth.signOut().then(resolve).catch(err => console.log(err));
    }),

    signIn: (email, password) => Auth.signIn({
        username: email,
        password: password
    }),

    randomUUID: uuidv4,

    deleteConfirm: callback => {
        let MySwal = withReactContent(Swal);
        MySwal.fire({
            title: 'Êtes-vous sûr?',
            text: 'Cette action ne peut pas être annulée',
            type: 'error',
            showCloseButton: true,
            showCancelButton: true
        }).then((willDelete) => {
            callback(willDelete.value);
        });
    },

    getHoursDone: item => {
        let begin = window.moment(item.begin, 'HH:mm');
        let end = window.moment(item.end, 'HH:mm');
        if (begin.format() === "Invalid date" || end.format() === "Invalid date") {
            return { hoursDone: '00:00', minDone: 0 };
        }
        let diff = begin.diff(end, 'minutes');
        let minutes = diff % 60;
        let hours = (diff - minutes) / 60;
        minutes = Math.abs(minutes);
        hours = Math.abs(hours);
        let hoursStr = hours <= 10 ? ('0' + hours).slice(-2) : ('' + hours);
        let minutesStr = ('0' + minutes).slice(-2);
        return {
            hoursDone: hoursStr + ':' + minutesStr,
            minDone: Math.abs(diff)
        };
    },

    encodeStr: rawStr => rawStr.replace(/[\u00A0-\u9999<>\&]/gim, i => ('&#' + i.charCodeAt(0) + ';')),
    decodeStr: encodedStr => window.jQuery("<div/>").html(encodedStr).text(),

    wrapHtml: (html, title) => {
        return `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
            <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
            <title>${title}</title>
          </head>
          <body>
            ${html}
            <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
            <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
          </body>
        </html>`
    }
}
