import bootstrap = require('bootstrap');
import { autoResetModals, callApi, sort } from './helper';
import { kindIcon } from './formatters';

import templateAutomations from 'bundle-text:../templates/badge_automations.mustache';
import templateTopics from 'bundle-text:../templates/option_topics.mustache';
import { render } from 'mustache';

const buttonSettingsSave = <HTMLElement>document.getElementById('buttonSettingsSave');
const divDevices = <HTMLElement>document.getElementById('divDevices');
const inputName = <HTMLInputElement>document.getElementById('inputName');
const inputSetKey = <HTMLInputElement>document.getElementById('inputSetKey');
const inputSetSuffix = <HTMLInputElement>document.getElementById('inputSetSuffix');
const inputStateKey = <HTMLInputElement>document.getElementById('inputStateKey');
const inputValueOff = <HTMLInputElement>document.getElementById('inputValueOff');
const inputValueOn = <HTMLInputElement>document.getElementById('inputValueOn');
const selectKind = <HTMLSelectElement>document.getElementById('selectKind');
const selectTopic = <HTMLSelectElement>document.getElementById('selectTopic');
const modalSettings = <HTMLElement>document.getElementById("modalSettings");

autoResetModals();

callApi('/automations/get', {}).then((res: any) => {
    divDevices.innerHTML = render(templateAutomations, { automations: sort(res.automations, 'name'), kindIcon });
});

buttonSettingsSave.addEventListener('click', () => {
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

    callApi('/device/get', { device_id: deviceId }).then((res: any) => {
        inputName.value = res.name;
        selectKind.value = res.kind;
        inputSetKey.value = res.set_key;
        selectTopic.value = res.topic_id;
        inputStateKey.value = res.state_key;
        inputSetSuffix.value = res.set_suffix;
        inputValueOn.value = res.value_on;
        inputValueOff.value = res.value_off;
    });
});