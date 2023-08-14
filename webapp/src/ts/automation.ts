import bootstrap = require('bootstrap');
import { render } from 'mustache';
import { autoResetModals, callApi } from './helper';
import { getAutomations, upsertAutomationStep, deleteCondition, upsertCondition, getCondition, upsertConditionalStep, Automation, Condition, ConditionPreset, getConditionalStep, getAutomationStep, deleteAutomationStep, deleteConditionalStep } from '../helpers/model_automations';
import { conditionKind } from './formatters';

import templateAutomationStep from 'bundle-text:../templates/card_automation_step.mustache';
import templateConditions from 'bundle-text:../templates/button_conditions.mustache';
import templateElseSteps from 'bundle-text:../templates/li_else_steps.mustache';
import templateSteps from 'bundle-text:../templates/li_steps.mustache';
import templateTopics from 'bundle-text:../templates/option_topics.mustache';

const buttonAutomationDelete = <HTMLElement>document.getElementById('buttonAutomationDelete');
const buttonAutomationStepDelete = <HTMLElement>document.getElementById('buttonAutomationStepDelete');
const buttonConditionDelete = <HTMLElement>document.getElementById('buttonConditionDelete');
const buttonConditionalStepDelete = <HTMLElement>document.getElementById('buttonConditionalStepDelete');
const divAutomationPublish = <HTMLElement>document.getElementById('divAutomationPublish');
const divConditionalPublish = <HTMLElement>document.getElementById('divConditionalPublish');
const divSteps = <HTMLElement>document.getElementById('divSteps');
const formCondition = <HTMLFormElement>document.getElementById('formCondition');
const formSettings = <HTMLFormElement>document.getElementById('formSettings');
const formAutomationStep = <HTMLFormElement>document.getElementById('formAutomationStep');
const formConditionalStep = <HTMLFormElement>document.getElementById('formConditionalStep');
const inputLeftTopicKey = <HTMLInputElement>document.getElementById('inputLeftTopicKey');
const inputLeftValue = <HTMLInputElement>document.getElementById('inputLeftValue');
const inputName = <HTMLInputElement>document.getElementById('inputName');
const inputAutomationStepMessage = <HTMLInputElement>document.getElementById('inputAutomationStepMessage');
const inputConditionalStepMessage = <HTMLInputElement>document.getElementById('inputConditionalStepMessage');
const inputRightTopicKey = <HTMLInputElement>document.getElementById('inputRightTopicKey');
const inputRightValue = <HTMLInputElement>document.getElementById('inputRightValue');
const inputTriggerKey = <HTMLInputElement>document.getElementById('inputTriggerKey');
const inputTriggerTime = <HTMLInputElement>document.getElementById('inputTriggerTime');
const inputTriggerValue = <HTMLInputElement>document.getElementById('inputTriggerValue');
const modalCondition = <HTMLElement>document.getElementById("modalCondition");
const modalSettings = <HTMLElement>document.getElementById("modalSettings");
const modalAutomationStep = <HTMLElement>document.getElementById("modalAutomationStep");
const modalConditionalStep = <HTMLElement>document.getElementById("modalConditionalStep");
const selectAutomationStepKind = <HTMLSelectElement>document.getElementById('selectAutomationStepKind');
const selectConditionKind = <HTMLSelectElement>document.getElementById('selectConditionKind');
const selectConditionalStepKind = <HTMLSelectElement>document.getElementById('selectConditionalStepKind');
const selectLeftOperandKind = <HTMLSelectElement>document.getElementById('selectLeftOperandKind');
const selectLeftPreset = <HTMLSelectElement>document.getElementById('selectLeftPreset');
const selectLeftTopic = <HTMLSelectElement>document.getElementById('selectLeftTopic');
const selectRightOperandKind = <HTMLSelectElement>document.getElementById('selectRightOperandKind');
const selectRightPreset = <HTMLSelectElement>document.getElementById('selectRightPreset');
const selectRightTopic = <HTMLSelectElement>document.getElementById('selectRightTopic');
const selectAutomationStepTopic = <HTMLSelectElement>document.getElementById('selectAutomationStepTopic');
const selectConditionalStepTopic = <HTMLSelectElement>document.getElementById('selectConditionalStepTopic');
const selectTriggerPosition = <HTMLSelectElement>document.getElementById('selectTriggerPosition');
const selectTriggerTopic = <HTMLSelectElement>document.getElementById('selectTriggerTopic');
const selectTriggerType = <HTMLSelectElement>document.getElementById('selectTriggerType');
const selectUserControlShown = <HTMLSelectElement>document.getElementById('selectUserControlShown');
const strongName = <HTMLElement>document.getElementById('strongName');

let automationId = Number(new URLSearchParams(window.location.search).get("automation_id"));
automationId = isNaN(automationId) ? 0 : automationId;

autoResetModals();

function changeConditionType(conditionType: string = "", side: "left" | "right") {
    const elementSide = side === "left" ? "Left" : "Right";
    const divPreset = document.getElementById(`div${elementSide}ConditionPreset`);
    const divTopic = document.getElementById(`div${elementSide}ConditionTopic`);
    const divValue = document.getElementById(`div${elementSide}ConditionValue`);

    switch (conditionType) {
        case "preset":
            divPreset.classList.remove('d-none');
            divTopic.classList.add('d-none');
            divValue.classList.add('d-none');
            break;
        case "topic":
            divPreset.classList.add('d-none');
            divTopic.classList.remove('d-none');
            divValue.classList.add('d-none');
            break;
        case "value":
            divPreset.classList.add('d-none');
            divTopic.classList.add('d-none');
            divValue.classList.remove('d-none');
            break;
        default:
            divPreset.classList.add('d-none');
            divTopic.classList.add('d-none');
            divValue.classList.add('d-none');
            break;
    }
}

function changeTriggerType(triggerType: string = "") {
    const divTriggerPosition = document.getElementById('divTriggerPosition');
    const divTriggerTime = document.getElementById('divTriggerTime');
    const divTriggerTopic = document.getElementById('divTriggerTopic');
    const divUserControlShown = document.getElementById('divUserControlShown');

    divTriggerPosition.classList.add('d-none');
    divTriggerTime.classList.add('d-none');
    divTriggerTopic.classList.add('d-none');
    divUserControlShown.classList.add('d-none');

    switch (triggerType) {
        case "sun":
            divTriggerPosition.classList.remove('d-none');
            break;
        case "time":
            divTriggerTime.classList.remove('d-none');
            break;
        case "topic":
            divTriggerTopic.classList.remove('d-none');
            break;
        case "user":
            divUserControlShown.classList.remove('d-none');
            break;
        default:
            divTriggerPosition.classList.add('d-none');
            divTriggerTime.classList.add('d-none');
            divTriggerTopic.classList.add('d-none');
            divUserControlShown.classList.add('d-none');
            break;
    }
}

function changeAutomationStepKind(kind: string) {
    if (kind === 'publish') {
        divAutomationPublish.classList.remove('d-none');
    }
    else {
        divAutomationPublish.classList.add('d-none');
    }
}

function changeConditionalStepKind(kind: string) {
    if (kind === 'publish') {
        divConditionalPublish.classList.remove('d-none');
    }
    else {
        divConditionalPublish.classList.add('d-none');
    }
}

function renderAutomations() {
    divSteps.innerHTML = render(templateAutomationStep, { automations: getAutomations(), conditionKind }, { conditions: templateConditions, conditional_steps: templateSteps, else_steps: templateElseSteps });
}

function saveAutomationSteps() {
    const automation = {
        automation_id: automationId,
        steps: getAutomations(true)
    };

    callApi('/automation/steps/setup', automation);
}

if (automationId > 0) {
    callApi('/automation/get', { automation_id: automationId }).then((res: any) => {
        strongName.innerText = res.name;

        res.steps.forEach((step) => {
            const conditionalSteps = step.steps.map((step) => ({
                ...step,
                [`kind_is_${step.kind}`]: true
            }));
            const automation: Automation = {
                ...step,
                automation_id: 0,
                [`kind_is_${step.kind}`]: true,
                steps: conditionalSteps,
                else_steps: []
            };

            upsertAutomationStep(automation);
        });

        renderAutomations();
    });
} else {
    callApi('/topics/get', {}).then((res) => {
        selectTriggerTopic.innerHTML = render(templateTopics, res);
    });
    changeTriggerType();
    bootstrap.Modal.getOrCreateInstance(modalSettings).show();
}

buttonAutomationDelete.addEventListener('click', () => {
    callApi('/automation/delete', { automation_id: automationId }).then(() => {
        window.location.href = './automations.html';
    });
});

buttonAutomationStepDelete.addEventListener('click', () => {
    const stepId = Number(modalAutomationStep.getAttribute('data-automation-step-id'));

    deleteAutomationStep(stepId);
    renderAutomations();
    saveAutomationSteps();

    bootstrap.Modal.getInstance(modalAutomationStep).hide();
});

buttonConditionDelete.addEventListener('click', () => {
    const stepId = Number(modalCondition.getAttribute('data-condition-id'));

    deleteCondition(stepId);
    renderAutomations();
    saveAutomationSteps();

    bootstrap.Modal.getInstance(modalCondition).hide();
});

buttonConditionalStepDelete.addEventListener('click', () => {
    const stepId = Number(modalConditionalStep.getAttribute('data-conditional-step-id'));

    deleteConditionalStep(stepId);
    renderAutomations();
    saveAutomationSteps();

    bootstrap.Modal.getInstance(modalConditionalStep).hide();
});

formAutomationStep.addEventListener('submit', (ev) => {
    ev.preventDefault();

    const stepId = Number(modalAutomationStep.getAttribute('data-automation-step-id'));
    const existingStep = stepId > 0 ? getAutomationStep(stepId) : {};

    const kind = selectAutomationStepKind.value;
    let newValues: Partial<Automation>;
    switch (kind) {
        case 'if':
            newValues = {
                kind: 'if',
                kind_is_if: true,
            };
            break;
        case 'notify':
            newValues = {
                kind: "notify",
                kind_is_notify: true
            };
            break;
        case 'publish':
            newValues = {
                kind: "publish",
                kind_is_publish: true,
                topic_id: Number(selectAutomationStepTopic.value),
                topic: selectAutomationStepTopic.selectedOptions[0].text,
                message: inputAutomationStepMessage.value
            };
            break;
        case 'wait':
            newValues = {
                kind: "wait",
                kind_is_wait: true
            };
            break;
    }

    upsertAutomationStep(<Automation>{ ...existingStep, ...newValues, step_id: stepId });
    renderAutomations();

    saveAutomationSteps();

    bootstrap.Modal.getInstance(modalAutomationStep).hide();
});

formCondition.addEventListener('submit', (ev) => {
    ev.preventDefault();

    const conditionId = Number(modalCondition.getAttribute('data-condition-id'));
    const condition = <Condition>{
        condition_id: conditionId,
        kind: selectConditionKind.value,
        left_operand_kind: selectLeftOperandKind.value,
        right_operand_kind: selectRightOperandKind.value
    };

    switch (selectLeftOperandKind.value) {
        case "preset":
            condition.left_preset = <ConditionPreset>selectLeftPreset.value;
            break;
        case "topic":
            condition.left_topic_id = Number(selectLeftTopic.value);
            condition.left_topic_key = inputLeftTopicKey.value;
            break;
        case "value":
            condition.left_value = inputLeftValue.value;
            break;
    }

    switch (selectRightOperandKind.value) {
        case "preset":
            condition.right_preset = <ConditionPreset>selectRightPreset.value;
            break;
        case "topic":
            condition.right_topic_id = Number(selectRightTopic.value);
            condition.right_topic_key = inputRightTopicKey.value;
            break;
        case "value":
            condition.right_value = inputRightValue.value;
            break;
    }

    const automationStepId = Number(modalCondition.getAttribute('data-automation-step-id'));

    upsertCondition(automationStepId, condition);
    renderAutomations();

    saveAutomationSteps();

    bootstrap.Modal.getInstance(modalCondition).hide();
});

formConditionalStep.addEventListener('submit', (ev) => {
    ev.preventDefault();

    const kind = selectConditionalStepKind.value;
    const conditionalStepId = Number(modalConditionalStep.getAttribute('data-conditional-step-id'));
    let automation: Partial<Automation> = {
        step_id: conditionalStepId,
        is_else_step: modalConditionalStep.getAttribute('data-is-else-step') === "1"
    };

    switch (kind) {
        case 'notify':
            automation = {
                kind: "notify",
                kind_is_notify: true
            };
            break;
        case 'publish':
            automation = {
                kind: "publish",
                kind_is_publish: true,
                topic_id: Number(selectConditionalStepTopic.value),
                topic: selectConditionalStepTopic.selectedOptions[0].text,
                message: inputConditionalStepMessage.value
            };
            break;
        case 'wait':
            automation = {
                kind: "wait",
                kind_is_wait: true
            };
            break;
    }

    const automationStepId = Number(modalConditionalStep.getAttribute('data-automation-step-id'));

    upsertConditionalStep(automationStepId, {
        ...automation,
        step_id: conditionalStepId,
        is_else_step: modalConditionalStep.getAttribute('data-is-else-step') === "1"
    });
    renderAutomations();

    saveAutomationSteps();

    bootstrap.Modal.getInstance(modalConditionalStep).hide();
});

formSettings.addEventListener('submit', (ev) => {
    ev.preventDefault();

    const rootAutomation = {
        automation_id: Number(automationId),
        name: inputName.value,
        trigger: selectTriggerType.value,
    };

    let automation;
    switch (rootAutomation.trigger) {
        case "sun":
            automation = { ...rootAutomation, position: selectTriggerPosition.value };
            break;
        case "time":
            automation = { ...rootAutomation, trigger_at: inputTriggerTime.value };
            break;
        case "topic":
            automation = {
                ...rootAutomation,
                topic_id: Number(selectTriggerTopic.value),
                trigger_key: inputTriggerKey.value,
                trigger_value: inputTriggerValue.value
            };
            break;
        case "user":
            automation = { ...rootAutomation, is_control_shown: selectUserControlShown.value == "1" };
    }

    callApi('/automation/setup', automation).then((res: { automation_id: number; }) => {
        if (automationId !== res.automation_id) {
            automationId = res.automation_id;
            renderAutomations();
        }

        strongName.innerText = automation.name;
        history.replaceState(null, '', `automation.html?automation_id=${automationId}`);

        bootstrap.Modal.getInstance(modalSettings).hide();
    });
});

modalAutomationStep.addEventListener('show.bs.modal', async (ev) => {
    const modalEvent = <bootstrap.Modal.Event>ev;
    if (!modalEvent.relatedTarget) return;
    const button = <HTMLElement>modalEvent.relatedTarget;

    const automationStepId = Number(button.getAttribute('data-automation-step-id'));
    modalAutomationStep.setAttribute('data-automation-step-id', String(automationStepId));
    modalAutomationStep.setAttribute('data-is-else-step', button.getAttribute('data-is-else-step') === "1" ? "1" : "0");

    divAutomationPublish.classList.add('d-none');
    selectAutomationStepKind.disabled = automationStepId > 0;
    buttonAutomationStepDelete.classList.add('d-none');

    const topics = await callApi('/topics/get', {});
    selectAutomationStepTopic.innerHTML = render(templateTopics, topics);

    if (automationStepId > 0) {
        buttonAutomationStepDelete.classList.remove('d-none');

        const step = getAutomationStep(automationStepId);

        selectAutomationStepKind.value = step.kind;
        selectAutomationStepTopic.value = String(step.topic_id);
        inputAutomationStepMessage.value = step.message;

        changeAutomationStepKind(step.kind);
    }
});

modalCondition.addEventListener('show.bs.modal', async (ev) => {
    const modalEvent = <bootstrap.Modal.Event>ev;
    if (!modalEvent.relatedTarget) return;
    const button = <HTMLElement>modalEvent.relatedTarget;

    const automationStepId = button.getAttribute('data-automation-step-id');
    const conditionId = button.getAttribute('data-condition-id');
    modalCondition.setAttribute('data-automation-step-id', automationStepId);
    modalCondition.setAttribute('data-condition-id', conditionId);

    buttonConditionDelete.classList.add('d-none');

    const topics = await callApi('/topics/get', {});
    selectLeftTopic.innerHTML = render(templateTopics, topics);
    selectRightTopic.innerHTML = render(templateTopics, topics);

    const condition = getCondition(Number(conditionId));
    if (condition) {
        buttonConditionDelete.classList.remove('d-none');
        selectConditionKind.value = condition.kind;
        selectLeftOperandKind.value = condition.left_operand_kind;
        selectRightOperandKind.value = condition.right_operand_kind;

        selectLeftPreset.value = condition.left_preset;
        selectLeftTopic.value = String(condition.left_topic_id);
        inputLeftTopicKey.value = condition.left_topic_key;
        inputLeftValue.value = condition.left_value;

        selectRightPreset.value = condition.right_preset;
        selectRightTopic.value = String(condition.right_topic_id);
        inputRightTopicKey.value = condition.right_topic_key;
        inputRightValue.value = condition.right_value;
    }

    changeConditionType(selectLeftOperandKind.value, "left");
    changeConditionType(selectRightOperandKind.value, "right");
});

modalConditionalStep.addEventListener('show.bs.modal', async (ev) => {
    const modalEvent = <bootstrap.Modal.Event>ev;
    if (!modalEvent.relatedTarget) return;
    const button = <HTMLElement>modalEvent.relatedTarget;

    const automationStepId = button.getAttribute('data-automation-step-id');
    modalConditionalStep.setAttribute('data-automation-step-id', automationStepId);
    modalConditionalStep.setAttribute('data-is-else-step', button.getAttribute('data-is-else-step') === "1" ? "1" : "0");

    divConditionalPublish.classList.add('d-none');
    buttonConditionalStepDelete.classList.add('d-none');

    const topics = await callApi('/topics/get', {});
    selectConditionalStepTopic.innerHTML = render(templateTopics, topics);

    const conditionalStepId = Number(button.getAttribute('data-conditional-step-id'));
    modalConditionalStep.setAttribute('data-conditional-step-id', String(conditionalStepId));
    selectConditionalStepKind.disabled = conditionalStepId > 0;

    if (conditionalStepId > 0) {
        buttonConditionalStepDelete.classList.remove('d-none');

        const step = getConditionalStep(conditionalStepId);

        selectConditionalStepKind.value = step.kind;
        selectConditionalStepTopic.value = String(step.topic_id);
        inputConditionalStepMessage.value = step.message;

        changeConditionalStepKind(step.kind);
    }
});

modalSettings.addEventListener('show.bs.modal', async (ev) => {
    const topics = await callApi('/topics/get', {});
    selectTriggerTopic.innerHTML = render(templateTopics, topics);

    if (automationId > 0) {
        callApi('/automation/get', { automation_id: automationId, with_details: false }).then((res: any) => {
            inputName.value = res.name;
            selectTriggerType.value = res.trigger;
            selectTriggerPosition.value = res.position;
            inputTriggerTime.value = res.trigger_at;
            selectTriggerTopic.value = res.topic_id;
            inputTriggerKey.value = res.trigger_key;
            inputTriggerValue.value = res.trigger_value;

            changeTriggerType(res.trigger);
        });
    }
    else {
        changeTriggerType();
    }

});

selectAutomationStepKind.addEventListener('change', () => {
    changeAutomationStepKind(selectAutomationStepKind.value);
});

selectConditionalStepKind.addEventListener('change', () => {
    changeConditionalStepKind(selectConditionalStepKind.value);
});

[selectLeftOperandKind, selectRightOperandKind].forEach((select) => select.addEventListener('change', () => {
    const side = select.id === 'selectLeftOperandKind' ? 'left' : 'right';

    changeConditionType(select.value, side);
}));

selectTriggerType.addEventListener('change', () => {
    changeTriggerType(selectTriggerType.value);
});