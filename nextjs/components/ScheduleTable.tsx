'use client';

import { QueryRef, useReadQuery } from '@apollo/client/react';
import Link from 'next/link';
import { iconMap as automationIconMap } from './AutomationPill';
import { Schedule } from 'puddle-graphql';
import { CircleQuestionMark } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { sortArray } from '@/lib/utilities';

interface ScheduleTableProps {
    queryRef: QueryRef<any>;
}

export default function ScheduleTable({ queryRef }: ScheduleTableProps) {
    const { data } = useReadQuery(queryRef);
    const schedule = data.schedule as Schedule[];

    const sortedSchedule = useMemo(() => {
        return sortArray(schedule, 'name');
    }, [schedule]);

    return (
        <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
            <table className="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Runs At</th>
                        <th>Automations</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedSchedule.map((s) => (
                        <tr key={s.name} >
                            <th className="font-semibold">{s.name}</th>
                            <td className="whitespace-nowrap">
                                {s.runsAt ? format(parseISO(s.runsAt), "h:mm aa") : "Elapsed"}
                            </td>
                            <td>
                                <div className="inline-flex items-center gap-2 flex-wrap">
                                    {s.automations?.map((automation) => {
                                        const IconComponent = automationIconMap[automation.trigger] || CircleQuestionMark;

                                        return (
                                            <Link className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" href={`/automations/${automation.id}`} key={automation.id}>
                                                <IconComponent className="w-5 h-5 mr-2" />
                                                <div className="text-left">
                                                    <h3 className="font-bold">{automation.name}</h3>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}