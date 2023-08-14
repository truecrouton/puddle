import bootstrap = require('bootstrap');
import { render } from 'mustache';
import { autoResetModals, callApi, sort } from './helper';
import { unitLabel } from './formatters';

import templateStates from 'bundle-text:../templates/badge_favorite_states.mustache';

const divFavoriteStates = <HTMLElement>document.getElementById('divFavoriteStates');
const formPasswordReset = <HTMLFormElement>document.getElementById('formPasswordReset');
const formSignIn = <HTMLFormElement>document.getElementById('formSignIn');
const formUserAdd = <HTMLFormElement>document.getElementById('formUserAdd');
const inputUsername = <HTMLInputElement>document.getElementById('inputUsername');
const inputPassword = <HTMLInputElement>document.getElementById('inputPassword');
const inputAddUsername = <HTMLInputElement>document.getElementById('inputAddUsername');
const inputAddPassword = <HTMLInputElement>document.getElementById('inputAddPassword');
const inputAddName = <HTMLInputElement>document.getElementById('inputAddName');
const inputAddAuthPhrase = <HTMLInputElement>document.getElementById('inputAddAuthPhrase');
const inputResetAuthPhrase = <HTMLInputElement>document.getElementById('inputResetAuthPhrase');
const inputResetPassword = <HTMLInputElement>document.getElementById('inputResetPassword');
const inputResetUsername = <HTMLInputElement>document.getElementById('inputResetUsername');
const modalPasswordReset = <HTMLElement>document.getElementById('modalPasswordReset');
const modalUserAdd = <HTMLElement>document.getElementById('modalUserAdd');
const selectAdmin = <HTMLSelectElement>document.getElementById('selectAdmin');

autoResetModals();

callApi('', {}).then((res: any) => {
    if (res.authenticated) window.location.href = './index.html';

    callApi('/favorite/states/get', {}).then((res: any) => {
        divFavoriteStates.innerHTML = render(templateStates, { states: sort(res.states, 'name'), unitLabel });
    });
});

formSignIn.addEventListener('submit', (ev) => {
    ev.preventDefault();

    callApi('/user/login', {
        username: inputUsername.value,
        password: inputPassword.value
    }).then(() => {
        window.location.href = './';
    });
});

formPasswordReset.addEventListener('submit', (ev) => {
    ev.preventDefault();

    callApi('/password/reset', {
        username: inputResetUsername.value,
        new_password: inputResetPassword.value,
        auth_phrase: inputResetAuthPhrase.value
    }).then(() => {
        bootstrap.Modal.getInstance(modalPasswordReset).hide();
    });
});

formUserAdd.addEventListener('submit', (ev) => {
    ev.preventDefault();

    callApi('/user/setup', {
        username: inputAddUsername.value,
        password: inputAddPassword.value,
        is_admin: selectAdmin.value === "1",
        name: inputAddName.value,
        auth_phrase: inputAddAuthPhrase.value
    }).then(() => {
        bootstrap.Modal.getInstance(modalUserAdd).hide();
    });
});
