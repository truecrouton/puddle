'use client';

import { GET_AUTOMATIONS } from "@/lib/queries";
import { ResultOf } from '@graphql-typed-document-node/core';
import AutomationPill from './AutomationPill';
import { QueryRef, useReadQuery } from '@apollo/client/react';

type GetAutomationsResult = ResultOf<typeof GET_AUTOMATIONS>;
type Automation = GetAutomationsResult['automations'][number];

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