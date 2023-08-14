import bootstrap = require('bootstrap');
import { format, parseISO } from 'date-fns';
import { render } from 'mustache';
import { callApi, sort } from './helper';
import { kindIcon } from './formatters';

import templateSchedule from 'bundle-text:../templates/table_schedule.mustache';

const divSchedule = <HTMLElement>document.getElementById('divSchedule');

callApi('/schedule/get', {}).then((res: any) => {
    const today = new Date();

    res.schedule = res.schedule.map((s) => ({
        ...s,
        runs_at: s.runs_at ? format(parseISO(s.runs_at), "h:mm aa") : "Elapsed"
    }));
    res["today"] = format(today, "MMMM d, yyyy");

    divSchedule.innerHTML = render(templateSchedule, { schedule: sort(res.schedule, 'name'), kindIcon });
});