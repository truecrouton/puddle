'use client';

import { Automation } from 'puddle-graphql';
import AutomationPill from './AutomationPill';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import { Plus } from 'lucide-react';
import IconPill from './IconPill';
import { useMemo, useState } from 'react';
import AutomationModal from './AutomationModal';
import { sortArray } from '@/lib/utilities';

interface AutomationPillsProps {
    queryRef: QueryRef<any>;
}

export default function AutomationPills({ queryRef }: AutomationPillsProps) {
    const { data } = useReadQuery(queryRef);
    const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);

    const automations = data.automations as Automation[];

    async function handleAddClick() {
        setIsAutomationModalOpen(true);
    }

    const sortedAutomations = useMemo(() => {
        return sortArray(automations, 'name');
    }, [automations]);

    return (
        <>
            <div className="bg-base-100 pb-8">
                <div className="flex flex-wrap gap-3">
                    <IconPill icon={Plus} onClick={() => handleAddClick()} />
                    {sortedAutomations.map((automation) => (
                        <AutomationPill automation={automation} key={automation.id} />
                    ))}
                </div>
            </div>

            <AutomationModal isOpen={isAutomationModalOpen} onClose={() => setIsAutomationModalOpen(false)} onSuccess={() => setIsAutomationModalOpen(false)} automation={{ id: 0, name: '', trigger: '', expressions: [] }} />
        </>
    );
}