import { scheduleJob, scheduledJobs } from "node-schedule";
import { getTimes, addTime, getPosition } from "suncalc";
import { savedAutomations, triggerSunAutomations, triggerTimeAutomations } from "./automation";
import { addMinutes, max, startOfDay } from "date-fns";

export const dailySchedulerJob = "puddle_daily";

function cancelElapsedJobs() {
    Object.keys(scheduledJobs).forEach((k) => {
        if (k !== dailySchedulerJob && !scheduledJobs[k].nextInvocation()) {
            scheduledJobs[k].cancel();
        }
    });
}

export function scheduleSunAutomation(position: string) {
    let today = startOfDay(new Date());
    today = addMinutes(today, today.getTimezoneOffset());

    if (!scheduledJobs[position]) {
        let sun: { [key: string]: Date; } = <any>getTimes(today, Number(process.env.LOCATION_LATITUDE), Number(process.env.LOCATION_LONGITUDE));
        const noonPosition = getPosition(sun['solarNoon'], Number(process.env.LOCATION_LATITUDE), Number(process.env.LOCATION_LONGITUDE));
        const maxAngle = noonPosition.altitude * 180 / Math.PI;

        addTime(maxAngle - 6.0, 'lateMorning', 'afternoon');
        addTime(15, 'morning', 'evening');
        sun = <any>getTimes(today, Number(process.env.LOCATION_LATITUDE), Number(process.env.LOCATION_LONGITUDE));

        if (!isNaN(sun[position].getTime())) {
            scheduleJob(position, sun[position], async () => triggerSunAutomations(position));
        }
    }
}

export function scheduleTimeAutomation(time: string) {
    if (!scheduledJobs[time]) {
        const [hours, minutes] = time.split(':');
        const triggerAt = startOfDay(new Date());
        triggerAt.setHours(Number(hours));
        triggerAt.setMinutes(Number(minutes));

        scheduleJob(time, triggerAt, async () => triggerTimeAutomations(time));
    }
}

function scheduleAutomations() {
    scheduleSunAutomation('afternoon');
    const automations = savedAutomations().reduce((autos, a) => {
        const key = a.trigger === 'time' ? a.trigger_at : a.position;
        autos[key] = autos[key] ? [...autos[key], a.id] : [a.id];
        return autos;
    }, <{ [key: string]: number[]; }>{});

    for (const trigger of Object.keys(automations)) {
        if (trigger.includes(':')) {
            scheduleTimeAutomation(trigger);
        }
        else {
            scheduleSunAutomation(trigger);
        }
    }
}

export function startScheduler() {
    cancelElapsedJobs();
    scheduleAutomations();

    if (!scheduledJobs[dailySchedulerJob]) {
        console.info('Scheduling daily job');
        scheduleJob(dailySchedulerJob, { hour: 0, minute: 1 }, () => {
            cancelElapsedJobs();
            scheduleAutomations();
        });
    }
}
