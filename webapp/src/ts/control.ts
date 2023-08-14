import bootstrap = require('bootstrap');
import { autoResetModals, callApi, sort } from './helper';
import { kindIcon } from './formatters';
import { render } from 'mustache';

import templateDevices from 'bundle-text:../templates/badge_controls.mustache';
import templateStatus from 'bundle-text:../templates/table_status.mustache';

const buttonAutomationRun = <HTMLButtonElement>document.getElementById('buttonAutomationRun');
const divDevices = <HTMLElement>document.getElementById('divDevices');
const divOtherStatus = <HTMLElement>document.getElementById('divOtherStatus');
const divRangeState = <HTMLElement>document.getElementById('divRangeState');
const divSwitchState = <HTMLElement>document.getElementById('divSwitchState');
const pAutomationDescription = <HTMLElement>document.getElementById('pAutomationDescription');
const pControlDescription = <HTMLElement>document.getElementById('pControlDescription');
const rangeState = <HTMLInputElement>document.getElementById('rangeState');
const smallSwitchState = <HTMLElement>document.getElementById('smallSwitchState');
const smallRangeState = <HTMLElement>document.getElementById('smallRangeState');
const switchState = <HTMLInputElement>document.getElementById('switchState');
const modalAutomation = <HTMLElement>document.getElementById("modalAutomation");
const modalControl = <HTMLElement>document.getElementById("modalControl");

autoResetModals();

async function setDeviceState() {
    const switchValue = switchState.checked ? 1 : 0;
    const command = {
        device_id: modalControl.getAttribute('data-device-id'),
        state: modalControl.getAttribute('data-kind') === 'toggleable' ? switchValue : rangeState.value
    };

    await callApi('/device/set', command);

    modalControl.querySelector('.spinner-border').classList.add('d-none');
}

callApi('/controls/get', {}).then((res: any) => {
    divDevices.innerHTML = render(templateDevices, { controls: sort(res.controls, 'name'), kindIcon });
});

buttonAutomationRun.addEventListener('click', () => {
    const automationId = modalAutomation.getAttribute('data-automation-id');

    buttonAutomationRun.disabled = true;

    callApi('/automation/run', { automation_id: automationId }).then(() => {
        buttonAutomationRun.disabled = false;

        bootstrap.Modal.getInstance(modalAutomation).hide();
    });
});

modalAutomation.addEventListener('show.bs.modal', async (ev) => {
    const modalEvent = <bootstrap.Modal.Event>ev;
    if (!modalEvent.relatedTarget) return;
    const button = <HTMLElement>modalEvent.relatedTarget;

    const automationId = button.getAttribute('data-automation-id');
    modalAutomation.setAttribute('data-automation-id', automationId);

    callApi('/automation/get', { automation_id: automationId, with_details: false }).then((res: any) => {
        pAutomationDescription.innerHTML = `This controls the automation named <strong>${res.name}</strong>.`;
    });

});

modalControl.addEventListener('show.bs.modal', async (ev) => {
    const modalEvent = <bootstrap.Modal.Event>ev;
    if (!modalEvent.relatedTarget) return;
    const button = <HTMLElement>modalEvent.relatedTarget;

    const deviceId = button.getAttribute('data-device-id');
    modalControl.setAttribute('data-device-id', deviceId);

    callApi('/device/get', { device_id: deviceId }).then((res: any) => {
        modalControl.setAttribute('data-kind', res.kind);
        pControlDescription.innerHTML = `This controls the device named <strong>${res.name}</strong>, which is ${res.kind}.`;

        divOtherStatus.classList.add('d-none');

        const shownStatus = res.status.filter((s) => s.is_shown === 1);
        if (shownStatus.length) {
            divOtherStatus.innerHTML = render(templateStatus, { status: shownStatus });
            divOtherStatus.classList.remove('d-none');
        }

        const status = res.status.find((s) => s.status_key === res.state_key);
        if (res.kind === 'toggleable') {
            divSwitchState.classList.remove('d-none');
            divRangeState.classList.add('d-none');
            switchState.checked = status?.value === res.value_on;
            smallSwitchState.innerText = switchState.checked ? 'On' : 'Off';
        }
        else {
            divSwitchState.classList.add('d-none');
            divRangeState.classList.remove('d-none');
            rangeState.value = status?.value ?? 0;
            smallRangeState.innerHTML = `${rangeState.value} of 100`;
        }
    });
});

switchState.addEventListener('change', async () => {
    smallSwitchState.innerText = switchState.checked ? 'On' : 'Off';

    switchState.disabled = true;
    await setDeviceState();
    switchState.disabled = false;

    bootstrap.Modal.getInstance(modalControl).hide();
});

rangeState.addEventListener('change', async () => {
    smallRangeState.innerHTML = `${rangeState.value} of 100`;

    rangeState.disabled = true;
    await setDeviceState();
    rangeState.disabled = false;

    bootstrap.Modal.getInstance(modalControl).hide();
});