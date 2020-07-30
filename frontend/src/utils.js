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
                alert('an unexpected error occured');
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
                alert('An unexpected error occured');
                console.log(err);
            }
        });
    }).catch(err => {
        alert('An unexpected error occured');
        console.log(err);
    });
});

const putData = path => data => new Promise(resolve => {
    getToken().then(token => {
        axios.put(window.API_GATEWAY_ENDPOINT + path, data, {
            headers: { Authorization: token }
        }).then(resolve).catch(err => {
            alert('An unexpected error occured');
            console.log(err);
        });
    }).catch(err => {
        alert('An unexpected error occured');
        console.log(err);
    })
});

const postData = (path, action) => data => new Promise(resolve => {
    getToken().then(token => {
        axios.post(window.API_GATEWAY_ENDPOINT + path + '?action=' + action, data, {
            headers: { Authorization: token }
        }).then(resolve).catch(err => {
            alert('An unexpected error occured');
            console.log(err);
        });
    }).catch(err => {
        alert('An unexpected error occured');
        console.log(err);
    })
});

const deleteData = path => (key, dayId) => new Promise(resolve => {
    getToken().then(token => {
        axios.delete(window.API_GATEWAY_ENDPOINT + path + '?id=' + key +
            (path === '/day' ? ('&dayId=' + dayId) : ''), { headers: {Authorization: token }
        }).then(resolve).catch(err => {
            alert('An unexpected error occured');
            console.log(err);
        });
    }).catch(err => {
        alert('An unexpected error occured');
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

    encodeStr: rawStr => rawStr.replace(/[\u00A0-\u9999<>\&]/gim, i => ('&#' + i.charCodeAt(0) + ';')),
    decodeStr: encodedStr => window.jQuery("<div/>").html(encodedStr).text()
}
