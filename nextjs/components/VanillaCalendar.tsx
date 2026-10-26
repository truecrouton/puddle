import { format, parse } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { Options, Calendar, time } from 'vanilla-calendar-pro';

import 'vanilla-calendar-pro/styles/core.css';
import 'vanilla-calendar-pro/styles/time.css';

interface CalendarProps extends React.HTMLAttributes<HTMLDivElement> {
    onSelectDate: (selectedDate: Date,) => void;
    selectedDateString: string;
}

function toISOString(dateString: string) {
    const parsedDate = parse(dateString, 'yyyy-MM-dd hh:mm a', new Date());
    return parsedDate;
}

function VanillaCalendar({ onSelectDate, selectedDateString, ...attributes }: CalendarProps) {
    const ref = useRef(null);
    const [calendar, setCalendar] = useState<Calendar | null>(null);

    const selectedDate = new Date(selectedDateString);
    const selectOptions = selectedDateString ? {
        selectedMonth: selectedDate.getMonth() as any,
        selectedYear: selectedDate.getFullYear(),
        selectedDates: [format(selectedDate, 'yyyy-MM-dd')],
        selectedTime: format(selectedDate, 'HH:mm'),
    } : {};
    const options: Options = {
        ...selectOptions,
        extensions: [time],
        selectionTimeMode: 12,
        onClickDate(self) {
            onSelectDate(toISOString(`${self.context.selectedDates[0]} ${self.context.selectedTime}`));

        },
        onChangeTime(self) {
            onSelectDate(toISOString(`${self.context.selectedDates[0]} ${self.context.selectedTime}`));
        },
    };

    useEffect(() => {
        if (!ref.current) return;
        setCalendar(new Calendar(ref.current, options));
    }, [ref]);

    useEffect(() => {
        if (!calendar) return;
        calendar.init();

    }, [calendar]);

    return (
        <div {...attributes} ref={ref}></div>
    );
}

export default VanillaCalendar;
