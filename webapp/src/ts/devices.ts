import bootstrap = require('bootstrap');
import { autoResetModals, callApi, sort } from './helper';
import { formatChecked, kindIcon } from './formatters';

import templateDevices from 'bundle-text:../templates/badge_devices.mustache';
import templateOtherState from 'bundle-text:../templates/table_status_setup.mustache';
import templateTopics from 'bundle-text:../templates/option_topics.mustache';
import { render } from 'mustache';

const divDevices = <HTMLElement>document.getElementById('divDevices');
const divOtherStatus = <HTMLElement>document.getElementById('divOtherStatus');
const formSettings = <HTMLFormElement>document.getElementById('formSettings');
const formStatus = <HTMLFormElement>document.getElementById('formStatus');
const inputName = <HTMLInputElement>document.getElementById('inputName');
const inputSetKey = <HTMLInputElement>document.getElementById('inputSetKey');
const inputSetSuffix = <HTMLInputElement>document.getElementById('inputSetSuffix');
const inputStateKey = <HTMLInputElement>document.getElementById('inputStateKey');
const inputStatusKey = <HTMLInputElement>document.getElementById('inputStatusKey');
const inputStatusName = <HTMLInputElement>document.getElementById('inputStatusName');
const inputValueOff = <HTMLInputElement>document.getElementById('inputValueOff');
const inputValueOn = <HTMLInputElement>document.getElementById('inputValueOn');
const selectKind = <HTMLSelectElement>document.getElementById('selectKind');
const selectStatusShown = <HTMLSelectElement>document.getElementById('selectStatusShown');
const selectTopic = <HTMLSelectElement>document.getElementById('selectTopic');
const modalSettings = <HTMLElement>document.getElementById("modalSettings");
const modalStatus = <HTMLElement>document.getElementById("modalStatus");

function loadDevices() {
    callApi('/devices/get', {}).then((res: any) => {
        divDevices.innerHTML = render(templateDevices, { devices: sort(res.devices, 'name'), kindIcon });

        let deviceId = Number(new URLSearchParams(window.location.search).get("device_id"));
        deviceId = isNaN(deviceId) ? 0 : deviceId;
        if (deviceId > 0) {
            const a = document.createElement('a');
            a.setAttribute('data-device-id', String(deviceId));
            bootstrap.Modal.getOrCreateInstance(modalSettings).show(a);
            history.replaceState(null, '', 'devices.html');
        }
    });
}

autoResetModals();
loadDevices();

formSettings.addEventListener('submit', (ev) => {
    ev.preventDefault();

    const topic = {
        device_id: modalSettings.getAttribute('data-device-id'),
        topic_id: selectTopic.value,
        kind: selectKind.value,
        name: inputName.value,
        set_key: inputSetKey.value,
        state_key: inputStateKey.value,
        set_suffix: inputSetSuffix.value,
        value_on: inputValueOn.value,
        value_off: inputValueOff.value
    };

    callApi('/device/setup', topic).then(() => {
        bootstrap.Modal.getInstance(modalSettings).hide();
        loadDevices();
    });
});

formStatus.addEventListener('submit', (ev) => {
    ev.preventDefault();

    const status = {
        status_key_id: 0,
        device_id: modalStatus.getAttribute('data-device-id'),
        name: inputStatusName.value,
        status_key: inputStatusKey.value,
        is_shown: selectStatusShown.value === "1"
    };

    callApi('/device/status/setup', status).then(() => {
        const a = document.createElement('a');
        a.setAttribute('data-device-id', status.device_id);
        bootstrap.Modal.getInstance(modalStatus).hide();
        bootstrap.Modal.getInstance(modalSettings).show(a);
    });
});

modalSettings.addEventListener('show.bs.modal', async (ev) => {
    const modalEvent = <bootstrap.Modal.Event>ev;
    if (!modalEvent.relatedTarget) return;
    const button = <HTMLElement>modalEvent.relatedTarget;

    const deviceId = button.getAttribute('data-device-id');
    modalSettings.setAttribute('data-device-id', deviceId);

    const topics = await callApi('/topics/get', {});
    selectTopic.innerHTML = render(templateTopics, topics);

    divOtherStatus.classList.add('d-none');

    if (Number(deviceId) === 0) return;

    callApi('/device/get', { device_id: deviceId }).then((res: any) => {
        inputName.value = res.name;
        selectKind.value = res.kind;
        inputSetKey.value = res.set_key;
        selectTopic.value = res.topic_id;
        inputStateKey.value = res.state_key;
        inputSetSuffix.value = res.set_suffix;
        inputValueOn.value = res.value_on;
        inputValueOff.value = res.value_off;

        if (res.status?.length > 0) {
            const status = Object.assign([], res.status);
            divOtherStatus.innerHTML = render(templateOtherState, { device_id: deviceId, status, formatChecked });
            divOtherStatus.classList.remove('d-none');

            divOtherStatus.querySelectorAll('a.stretched-link').forEach((a: HTMLElement) => a.addEventListener('click', (ev) => {
                bootstrap.Modal.getInstance(modalSettings).hide();
                bootstrap.Modal.getOrCreateInstance(modalStatus).show(a);
            }));
        }
    });
});

modalStatus.addEventListener('show.bs.modal', async (ev) => {
    const modalEvent = <bootstrap.Modal.Event>ev;
    if (!modalEvent.relatedTarget) return;
    const button = <HTMLElement>modalEvent.relatedTarget;

    modalStatus.setAttribute('data-device-id', button.getAttribute('data-device-id'));
    let statusId = Number(button.getAttribute('data-status-key-id'));
    statusId = isNaN(statusId) ? 0 : statusId;

    if (statusId > 0) {

    }
    else {
        inputStatusKey.value = button.getAttribute('data-status-key');
        selectStatusShown.value = "0";
    }
});