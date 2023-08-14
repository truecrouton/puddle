import bootstrap = require('bootstrap');
import { render } from 'mustache';
import { callApi, sort } from './helper';
import { unitLabel } from './formatters';

import templateStates from 'bundle-text:../templates/badge_favorite_states.mustache';

const divFavoriteStates = <HTMLElement>document.getElementById('divFavoriteStates');

callApi('', {}).then((res: any) => {
    if (!res.authenticated) window.location.href = './login.html';

    callApi('/favorite/states/get', {}).then((res: any) => {
        divFavoriteStates.innerHTML = render(templateStates, { states: sort(res.states, 'name'), unitLabel });
    });
});
