import bootstrap = require('bootstrap');
import { Chart } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { addMinutes, endOfDay, startOfDay } from 'date-fns';
import { DateRangePicker } from 'vanillajs-datepicker';
import { DateRangePickerOptions } from 'vanillajs-datepicker/DateRangePicker';
import { render } from 'mustache';
import { autoResetModals, callApi, sort } from './helper';

import templateCharts from 'bundle-text:../templates/badge_charts.mustache';
import templateTopics from 'bundle-text:../templates/option_topics.mustache';
import templateKeys from 'bundle-text:../templates/option_keys.mustache';

const buttonChartDelete = <HTMLElement>document.getElementById('buttonChartDelete');
const canvasChart = <HTMLCanvasElement>document.getElementById('canvasChart');
const divCharts = <HTMLElement>document.getElementById('divCharts');
const formSettings = <HTMLFormElement>document.getElementById('formSettings');
const inputSettingsName = <HTMLInputElement>document.getElementById('inputSettingsName');
const inputStartDate = <HTMLInputElement>document.getElementById('inputStartDate');
const inputEndDate = <HTMLInputElement>document.getElementById('inputEndDate');
const inputGroupDateRange = new DateRangePicker(document.getElementById('inputGroupDateRange'), <DateRangePickerOptions>{
    buttonClass: 'btn',
    format: 'mm/dd/yyyy',
    todayHighlight: true,
    maxDate: new Date()
});
const inputSettingsKey = <HTMLSelectElement>document.getElementById('inputSettingsKey');
const modalSettings = <HTMLElement>document.getElementById('modalSettings');
const radioHoursAll = <HTMLInputElement>document.getElementById('radioHoursAll');
const selectKey = <HTMLSelectElement>document.getElementById('selectKey');
const selectSettingsFavorite = <HTMLSelectElement>document.getElementById('selectSettingsFavorite');
const selectSettingsTopic = <HTMLSelectElement>document.getElementById('selectSettingsTopic');
const selectTopic = <HTMLSelectElement>document.getElementById('selectTopic');

let chart: Chart;

function disableHoursRange(disable: boolean) {
    radioHoursAll.checked = true;

    document.querySelectorAll('input[name="radioHoursRange"]').forEach((radio: HTMLInputElement) => radio.disabled = disable);
}

function generateChart() {
    const topicId = Number(selectTopic.value);
    const name = selectKey.value;

    if (isNaN(topicId) || topicId === 0 || name.length === 0) return;

    history.replaceState(null, '', `charts.html?topic_id=${topicId}&key=${name}`);

    if (chart) chart.destroy();

    const startDate = startOfDay(inputGroupDateRange.getDates()[0]);
    const endDate = endOfDay(inputGroupDateRange.getDates()[1]);
    if (inputStartDate.value === inputEndDate.value) {
        const radioChecked = <HTMLInputElement>document.querySelector('input[name="radioHoursRange"]:checked');

        switch (radioChecked.value) {
            case '0':
                endDate.setHours(11);
                break;
            case '12':
                startDate.setHours(12);
                break;
        }
    }

    const offset = new Date().getTimezoneOffset();
    const req = {
        topic_id: selectTopic.value,
        name: selectKey.value,
        start_date: addMinutes(startDate, offset).toISOString(),
        end_date: addMinutes(endDate, offset).toISOString()
    };

    callApi('/pairs/get', req).then((res: any) => {
        const pairs = res.pairs.map(p => ({ x: `${p.created_at}Z`, y: p.value }));

        chart = new Chart(canvasChart, {
            type: 'line',
            data: {
                datasets: [{
                    label: `${name} over time`,
                    data: pairs
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour'
                        },
                        title: {
                            display: true,
                            text: 'time'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: name
                        },
                    }
                }
            }
        });

        canvasChart.classList.remove('d-none');
    });
}

function loadCharts() {
    callApi('/charts/get', {}).then((res: any) => {
        divCharts.innerHTML = render(templateCharts, { charts: sort(res.charts, 'name') });

        divCharts.querySelectorAll('a[data-chart-id]').forEach((a: HTMLElement) => a.addEventListener('click', async () => {
            const chart = <{ topic_id: number, key: string; }>await callApi('/chart/get', { chart_id: a.getAttribute('data-chart-id') });

            selectTopic.value = String(chart.topic_id);
            await loadKeys(chart.key);

            generateChart();
        }));
    });
}

async function loadKeys(set?: string) {
    if (!selectTopic.value) return;

    const res: any = await callApi('/topic/get', { topic_id: selectTopic.value });
    selectKey.innerHTML = render(templateKeys, res);

    if (set) selectKey.value = set;
}

autoResetModals();
inputGroupDateRange.setDates(new Date(), new Date());

loadCharts();

callApi('/topics/get', {}).then(async (res) => {
    selectTopic.innerHTML = render(templateTopics, res);

    const topicId = Number(new URLSearchParams(window.location.search).get("topic_id"));
    selectTopic.value = isNaN(topicId) || !topicId ? '' : String(topicId);

    const name = new URLSearchParams(window.location.search).get("key");
    await loadKeys(name ?? '');

    generateChart();
});

buttonChartDelete.addEventListener('click', () => {
    callApi('/chart/delete', { chart_id: modalSettings.getAttribute('data-chart-id') }).then(() => {
        bootstrap.Modal.getInstance(modalSettings).hide();
        loadCharts();
    });
});

formSettings.addEventListener('submit', (ev) => {
    ev.preventDefault();

    const chart = {
        chart_id: modalSettings.getAttribute('data-chart-id'),
        topic_id: selectSettingsTopic.value,
        name: inputSettingsName.value,
        key: inputSettingsKey.value,
        is_favorite: selectSettingsFavorite.value === "1"
    };

    callApi('/chart/setup', chart).then(() => {
        bootstrap.Modal.getInstance(modalSettings).hide();
        loadCharts();
    });
});

[inputStartDate, inputEndDate].forEach((input) => input.addEventListener('changeDate', () => {
    if (inputStartDate.value === inputEndDate.value) disableHoursRange(false);
    else disableHoursRange(true);

    generateChart();
}));

modalSettings.addEventListener('show.bs.modal', async (ev) => {
    const modalEvent = <bootstrap.Modal.Event>ev;
    if (!modalEvent.relatedTarget) return;
    const button = <HTMLElement>modalEvent.relatedTarget;

    const chartId = Number(button.getAttribute('data-update-chart-id'));
    modalSettings.setAttribute('data-chart-id', String(chartId));

    const topics = await callApi('/topics/get', {});
    selectSettingsTopic.innerHTML = render(templateTopics, topics);

    buttonChartDelete.classList.add('d-none');

    if (chartId > 0) {
        callApi('/chart/get', { chart_id: chartId }).then((res: any) => {
            inputSettingsName.value = res.name;
            selectSettingsTopic.value = res.topic_id;
            inputSettingsKey.value = res.key;
            selectSettingsFavorite.value = res.is_favorite;

            buttonChartDelete.classList.remove('d-none');
        });
    }
});

document.querySelectorAll('input[name="radioHoursRange"]').forEach((radio: HTMLInputElement) => radio.addEventListener('change', () => generateChart()));


selectTopic.addEventListener('change', () => {
    loadKeys();
});

selectKey.addEventListener('change', () => {
    generateChart();
})

