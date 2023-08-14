export const formatChecked = function () {
    return function (text, render) {
        return ["1", "true"].includes(render(text)) ? '<i class="bi bi-check2-circle"></i>' : '<i class="bi bi-circle"></i>';
    };
};

export const conditionKind = function () {
    return function (text, render) {
        const kindMap = {
            and: "&",
            eq: "=",
            or: "∥",
            gt: ">",
            gte: "≥",
            lt: "<",
            lte: "≤",
            neq: "≠",
            inc: "⋰",
            dec: "⋱",
            lgt: "Δ >",
            llt: "Δ <",
            leq: "Δ =",
            lneq: "Δ ≠"
        };
        const kind = render(text);
        return kindMap[kind];
    };
};

export const kindIcon = function () {
    return function (text, render) {
        const iconMap = {
            // Device kinds
            dimmable: "arrow-right",
            toggleable: "arrow-repeat",
            positionable: "arrow-right",

            // Automation triggers
            sun: 'brightness-high',
            time: 'clock',
            topic: 'card-text',
            user: 'hand-index',

            // Control state
            low: 'circle',
            middle: 'circle-half',
            high: 'record-circle',
            unknown: 'question-circle'
        };

        const kind = render(text);
        return iconMap[kind];
    };
};

export const unitLabel = function () {
    return function (text, render) {
        const stateMap = {
            battery: '%',
            humidity: '%',
            illuminance: '',
            illuminance_lux: 'lx',
            position: '%',
            power: 'w',
            temperature: '°F',
        };

        const state = render(text);
        return stateMap[state];
    };
};