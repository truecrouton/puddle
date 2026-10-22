'use client';

import { Automation } from 'puddle-graphql';
import AutomationPill from './AutomationPill';
import { QueryRef, useReadQuery } from '@apollo/client/react';

interface AutomationPillsProps {
    queryRef: QueryRef<any>;
}

export default function AutomationPills({ queryRef }: AutomationPillsProps) {
    const { data } = useReadQuery(queryRef);
    const automations = data.automations as Automation[];

    return (
        <>
            <div className="bg-base-100 pb-8">
                <div className="flex flex-wrap gap-3">
                    {automations.map((automation) => (
                        <AutomationPill automation={automation} key={automation.id} />
                    ))}
                </div>
            </div>

        </>
    );
}