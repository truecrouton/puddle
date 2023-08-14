import bootstrap = require('bootstrap');
import { callApi } from "./helper";

const buttonSignOut = document.getElementById("buttonSignOut");

buttonSignOut.addEventListener('click', () => {
    callApi('/user/logout', {}).then(() => {
        window.location.href = '/index.html';
    });
});