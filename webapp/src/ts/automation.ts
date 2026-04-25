import bootstrap = require('bootstrap');
import { render } from 'mustache';
import { autoResetModals, callApi } from './helper';
import { getExpressions, upsertExpression, upsertConditional, Expression, getConditional, getExpression, deleteExpression, deleteConditional } from '../helpers/model_automations';

import templateAutomationStep from 'bundle-text:../templates/card_automation_step.mustache';
import templateElseSteps from 'bundle-text:../templates/li_else_steps.mustache';
import templateSteps from 'bundle-text:../templates/li_steps.mustache';
import templateTopics from 'bundle-text:../templates/option_topics.mustache';

const buttonAutomationDelete = <HTMLElement>document.getElementById('buttonAutomationDelete');
const buttonExpressionDelete = <HTMLElement>document.getElementById('buttonExpressionDelete');
const buttonConditionalDelete = <HTMLElement>document.getElementById('buttonConditionalDelete');
const divExpressionIf = <HTMLElement>document.getElementById('divExpressionIf');
const divExpressionPublish = <HTMLElement>document.getElementById('divExpressionPublish');
const divConditionalPublish = <HTMLElement>document.getElementById('divConditionalPublish');
const divAutomation = <HTMLElement>document.getElementById('divAutomation');
const formExpressionEdit = <HTMLFormElement>document.getElementById('formExpressionEdit');
const formSettings = <HTMLFormElement>document.getElementById('formSettings');
const formExpression = <HTMLFormElement>document.getElementById('formExpression');
const formConditional = <HTMLFormElement>document.getElementById('formConditional');
const inputName = <HTMLInputElement>document.getElementById('inputName');
const inputExpressionMessage = <HTMLInputElement>document.getElementById('inputExpressionMessage');
const inputConditionalMessage = <HTMLInputElement>document.getElementById('inputConditionalMessage');
const inputExpression = <HTMLInputElement>document.getElementById('inputExpression');
const inputExpressionIf = <HTMLInputElement>document.getElementById('inputExpressionIf');
const inputTriggerKey = <HTMLInputElement>document.getElementById('inputTriggerKey');
const inputTriggerTime = <HTMLInputElement>document.getElementById('inputTriggerTime');
const inputTriggerValue = <HTMLInputElement>document.getElementById('inputTriggerValue');
const modalExpressionEdit = <HTMLElement>document.getElementById("modalExpressionEdit");
const modalSettings = <HTMLElement>document.getElementById("modalSettings");
const modalExpression = <HTMLElement>document.getElementById("modalExpression");
const modalConditional = <HTMLElement>document.getElementById("modalConditional");
const selectExpressionKind = <HTMLSelectElement>document.getElementById('selectExpressionKind');
const selectConditionalKind = <HTMLSelectElement>document.getElementById('selectConditionalKind');
const selectExpressionTopic = <HTMLSelectElement>document.getElementById('selectExpressionTopic');
const selectConditionalTopic = <HTMLSelectElement>document.getElementById('selectConditionalTopic');
const selectTriggerPosition = <HTMLSelectElement>document.getElementById('selectTriggerPosition');
const selectTriggerTopic = <HTMLSelectElement>document.getElementById('selectTriggerTopic');
const selectTriggerType = <HTMLSelectElement>document.getElementById('selectTriggerType');
const selectUserControlShown = <HTMLSelectElement>document.getElementById('selectUserControlShown');
const strongName = <HTMLElement>document.getElementById('strongName');

let automationId = Number(new URLSearchParams(window.location.search).get("automation_id"));
automationId = isNaN(automationId) ? 0 : automationId;

autoResetModals();

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

function changeExpressionKind(kind: string) {
    divExpressionIf.classList.add('d-none');
    divExpressionPublish.classList.add('d-none');

    switch (kind) {
        case "publish":
            divExpressionPublish.classList.remove('d-none');
            break;
        case "if":
            divExpressionIf.classList.remove('d-none');
            break;
    }
}

function changeConditionalKind(kind: string) {
    if (kind === 'publish') {
        divConditionalPublish.classList.remove('d-none');
    }
    else {
        divConditionalPublish.classList.add('d-none');
    }
}

function renderAutomation() {
    divAutomation.innerHTML = render(templateAutomationStep, { automations: getExpressions() }, { conditional_steps: templateSteps, else_steps: templateElseSteps });
}

function saveAutomation() {
    const automation = {
        automation_id: automationId,
        expressions: getExpressions(true)
    };

    return callApi('/automation/expressions/setup', automation);
}

if (automationId > 0) {
    callApi('/automation/get', { automation_id: automationId }).then((res: any) => {
        strongName.innerText = res.name;

        res.sequence.forEach((expr) => {
            const automation: Expression = {
                ...expr,
                automation_id: 0,
                [`kind_is_${expr.kind}`]: true,
                nested_expressions: expr.nested_expressions.map((expr) => ({
                    ...expr,
                    expression_id: expr.id,
                    [`kind_is_${expr.kind}`]: true
                })),
                else_steps: []
            };
            upsertExpression(automation);
        });
        renderAutomation();
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

buttonExpressionDelete.addEventListener('click', () => {
    const stepId = Number(modalExpression.getAttribute('data-expression-id'));

    deleteExpression(stepId);
    renderAutomation();
    saveAutomation().then(() => {
        bootstrap.Modal.getInstance(modalExpression).hide();
    });
});

buttonConditionalDelete.addEventListener('click', () => {
    const stepId = Number(modalConditional.getAttribute('data-conditional-step-id'));

    deleteConditional(stepId);
    renderAutomation();
    saveAutomation().then(() => {
        bootstrap.Modal.getInstance(modalConditional).hide();
    });
});

formExpression.addEventListener('submit', (ev) => {
    ev.preventDefault();

    const expressionId = Number(modalExpression.getAttribute('data-expression-id'));
    const existingStep = expressionId > 0 ? getExpression(expressionId) : {};

    const kind = selectExpressionKind.value;
    let newValues: Partial<Expression>;
    switch (kind) {
        case 'if':
            newValues = {
                kind: 'if',
                kind_is_if: true,
                expression: inputExpressionIf.value
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
                topic_id: Number(selectExpressionTopic.value),
                topic: selectExpressionTopic.selectedOptions[0].text,
                message: inputExpressionMessage.value
            };
            break;
        case 'wait':
            newValues = {
                kind: "wait",
                kind_is_wait: true
            };
            break;
    }

    const newExpr = <Expression>{ ...existingStep, ...newValues, expression_id: expressionId };
    upsertExpression(newExpr);
    renderAutomation();

    saveAutomation().then(() => {
        bootstrap.Modal.getInstance(modalExpression).hide();
    });
});

formExpressionEdit.addEventListener('submit', (ev) => {
    ev.preventDefault();

    const expressionId = Number(modalExpressionEdit.getAttribute('data-expression-id'));
    const expr = getExpression(expressionId);
    upsertExpression(<Expression>{
        ...expr,
        expression: inputExpression.value
    });
    renderAutomation();

    saveAutomation().then(() => {
        bootstrap.Modal.getInstance(modalExpressionEdit).hide();
    });
});

formConditional.addEventListener('submit', (ev) => {
    ev.preventDefault();

    const kind = selectConditionalKind.value;
    const conditionalStepId = Number(modalConditional.getAttribute('data-conditional-step-id'));
    let automation: Partial<Expression> = {
        expression_id: conditionalStepId,
        is_else_step: modalConditional.getAttribute('data-is-else-step') === "1"
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
                topic_id: Number(selectConditionalTopic.value),
                topic: selectConditionalTopic.selectedOptions[0].text,
                message: inputConditionalMessage.value
            };
            break;
        case 'wait':
            automation = {
                kind: "wait",
                kind_is_wait: true
            };
            break;
    }

    const expressionId = Number(modalConditional.getAttribute('data-expression-id'));

    upsertConditional(expressionId, {
        ...automation,
        expression_id: conditionalStepId,
        is_else_step: modalConditional.getAttribute('data-is-else-step') === "1"
    });
    renderAutomation();

    saveAutomation().then(() => {
        bootstrap.Modal.getInstance(modalConditional).hide();
    });
});

formSettings.addEventListener('submit', (ev) => {
    ev.preventDefault();

    const rootAutomation = {
        id: Number(automationId),
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
            renderAutomation();
        }

        strongName.innerText = automation.name;
        history.replaceState(null, '', `automation.html?automation_id=${automationId}`);

        bootstrap.Modal.getInstance(modalSettings).hide();
    });
});

modalExpression.addEventListener('show.bs.modal', async (ev) => {
    const modalEvent = <bootstrap.Modal.Event>ev;
    if (!modalEvent.relatedTarget) return;
    const button = <HTMLElement>modalEvent.relatedTarget;

    const automationStepId = Number(button.getAttribute('data-expression-id'));
    modalExpression.setAttribute('data-expression-id', String(automationStepId));
    modalExpression.setAttribute('data-is-else-step', button.getAttribute('data-is-else-step') === "1" ? "1" : "0");

    divExpressionPublish.classList.add('d-none');
    divExpressionIf.classList.add('d-none');
    selectExpressionKind.disabled = automationStepId > 0;
    buttonExpressionDelete.classList.add('d-none');

    const topics = await callApi('/topics/get', {});
    selectExpressionTopic.innerHTML = render(templateTopics, topics);

    if (automationStepId > 0) {
        buttonExpressionDelete.classList.remove('d-none');

        const expr = getExpression(automationStepId);

        selectExpressionKind.value = expr.kind;
        selectExpressionTopic.value = String(expr.topic_id);
        inputExpressionMessage.value = expr.message;
        inputExpressionIf.value = expr.expression;

        changeExpressionKind(expr.kind);
    }
});

modalExpressionEdit.addEventListener('show.bs.modal', async (ev) => {
    const modalEvent = <bootstrap.Modal.Event>ev;
    if (!modalEvent.relatedTarget) return;
    const button = <HTMLElement>modalEvent.relatedTarget;

    const expressionId = button.getAttribute('data-expression-id');
    modalExpressionEdit.setAttribute('data-expression-id', expressionId);

    //const topics = await callApi('/topics/get', {});

    const expr = getExpression(Number(expressionId));
    if (expr) {
        inputExpression.value = expr.expression;
    }
});

modalConditional.addEventListener('show.bs.modal', async (ev) => {
    const modalEvent = <bootstrap.Modal.Event>ev;
    if (!modalEvent.relatedTarget) return;
    const button = <HTMLElement>modalEvent.relatedTarget;

    const automationStepId = button.getAttribute('data-expression-id');
    modalConditional.setAttribute('data-expression-id', automationStepId);
    modalConditional.setAttribute('data-is-else-step', button.getAttribute('data-is-else-step') === "1" ? "1" : "0");

    divConditionalPublish.classList.add('d-none');
    buttonConditionalDelete.classList.add('d-none');

    const topics = await callApi('/topics/get', {});
    selectConditionalTopic.innerHTML = render(templateTopics, topics);

    const conditionalStepId = Number(button.getAttribute('data-conditional-step-id'));
    modalConditional.setAttribute('data-conditional-step-id', String(conditionalStepId));
    selectConditionalKind.disabled = conditionalStepId > 0;

    if (conditionalStepId > 0) {
        buttonConditionalDelete.classList.remove('d-none');

        const step = getConditional(conditionalStepId);

        selectConditionalKind.value = step.kind;
        selectConditionalTopic.value = String(step.topic_id);
        inputConditionalMessage.value = step.message;

        changeConditionalKind(step.kind);
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

selectExpressionKind.addEventListener('change', () => {
    changeExpressionKind(selectExpressionKind.value);
});

selectConditionalKind.addEventListener('change', () => {
    changeConditionalKind(selectConditionalKind.value);
});

selectTriggerType.addEventListener('change', () => {
    changeTriggerType(selectTriggerType.value);
});