// components/DateRangePicker.jsx
import { useEffect, useRef, useState } from 'react';
import { FieldError, useFormContext } from 'react-hook-form';
import VanillaCalendar from './VanillaCalendar';
import { addDays, format, subDays } from 'date-fns';

interface DateRangePickerProps {
    className?: string;
    error?: FieldError;
}

export default function DateRangePicker({ className = '', error }: DateRangePickerProps) {
    const [isStartOpen, setIsStartOpen] = useState(false);
    const [isEndOpen, setIsEndOpen] = useState(false);
    const startContainerRef = useRef<HTMLDivElement>(null);
    const endContainerRef = useRef<HTMLDivElement>(null);

    const { register, getValues, setValue, watch } = useFormContext();

    const displayStartDate = watch('startDate');
    const displayEndDate = watch('endDate');

    function formatDate(date: Date) {
        if (!date) return '';
        return format(date, 'MM/dd/yyyy hh:mma');
    }

    function setStartDate(selectedDate: Date) {
        setValue('startDate', selectedDate.toISOString());
        if (!displayEndDate) setValue('endDate', addDays(selectedDate, 1).toISOString());
    }

    function setEndDate(selectedDate: Date) {
        setValue('endDate', selectedDate.toISOString());
        if (!displayStartDate) setValue('startDate', subDays(selectedDate, 1).toISOString());
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (startContainerRef.current && event.target instanceof Node && !startContainerRef.current.contains(event.target)) {
                setIsStartOpen(false);
            }
            if (endContainerRef.current && event.target instanceof Node && !endContainerRef.current.contains(event.target)) {
                setIsEndOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <fieldset className={`${className} fieldset`}>
            <legend className="fieldset-legend">Date Range</legend>
            <div className="join">
                <div ref={startContainerRef} className={`dropdown w-full ${isStartOpen ? 'dropdown-open' : ''}`}>
                    <input type="hidden" {...register('startDate')} />
                    <input type="text" className="input join-item" value={formatDate(displayStartDate)} onFocus={() => setIsStartOpen(true)} readOnly />
                    {isStartOpen && (<div className="dropdown-content w-full shadow-md">
                        <VanillaCalendar selectedDateString={getValues('startDate')} onSelectDate={setStartDate} />
                    </div>)}
                </div>
                <div ref={endContainerRef} className={`dropdown w-full ${isEndOpen ? 'dropdown-open' : ''}`}>
                    <input type="hidden" {...register('endDate')} />
                    <input type="text" className="input join-item" value={formatDate(displayEndDate)} onFocus={() => setIsEndOpen(true)} readOnly />
                    {isEndOpen && (<div className="dropdown-content w-full shadow-md">
                        <VanillaCalendar selectedDateString={getValues('endDate')} onSelectDate={setEndDate} />
                    </div>)}
                </div>
            </div>

            <p className="label">{error?.message}</p>
        </fieldset>
    );
}