import bootstrap = require('bootstrap');
import { autoResetModals, callApi, sort } from './helper';
import { kindIcon } from './formatters';

import templateStatus from 'bundle-text:../templates/table_topic_status.mustache';
import templateTopics from 'bundle-text:../templates/table_topics.mustache';
import { render } from 'mustache';

const buttonTopicSave = <HTMLButtonElement>document.getElementById('buttonTopicSave');
const divStatus = <HTMLElement>document.getElementById('divStatus');
const divTopics = <HTMLElement>document.getElementById('divTopics');
const formTopic = <HTMLInputElement>document.getElementById('formTopic');
const inputTopic = <HTMLInputElement>document.getElementById('inputTopic');
const modalTopic = <HTMLElement>document.getElementById('modalTopic');

function loadTopics() {
    callApi('/topics/get', {}).then((res: any) => {
        divTopics.innerHTML = render(templateTopics, { topics: sort(res.topics, 'topic'), kindIcon });
    });
}

autoResetModals();
loadTopics();

formTopic.addEventListener('submit', (ev) => {
    ev.preventDefault();

    callApi('/topic/setup', { topic: inputTopic.value }).then(() => {
        bootstrap.Modal.getInstance(modalTopic).hide();
        loadTopics();
    });
});

modalTopic.addEventListener('show.bs.modal', async (ev) => {
    const modalEvent = <bootstrap.Modal.Event>ev;
    if (!modalEvent.relatedTarget) return;
    const button = <HTMLElement>modalEvent.relatedTarget;

    const topicId = Number(button.getAttribute('data-topic-id'));
    modalTopic.setAttribute('data-topic-id', String(topicId));

    divStatus.classList.add('d-none');
    inputTopic.disabled = false;

    const title = modalTopic.querySelector('.modal-title');
    if (topicId > 0) {
        title.innerHTML = 'Topic Information';
        buttonTopicSave.classList.add('d-none');
        inputTopic.disabled = true;

        callApi('/topic/get', { topic_id: topicId }).then((res: any) => {
            inputTopic.value = res.topic;

            if (res.status?.length > 0) {
                divStatus.innerHTML = render(templateStatus, res);
                divStatus.classList.remove('d-none');
            }
        });
    }
    else {
        title.innerHTML = 'Add Topic';

        buttonTopicSave.classList.remove('d-none');
    }
});
