'use client';

import { useMemo, useState } from 'react';
import ControlModal from './ControlModal';
import ControlPill from './ControlPill';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import { Control } from 'puddle-graphql';
import { sortArray } from '@/lib/utilities';

interface ControlPillsProps {
    queryRef: QueryRef<any>;
}

export default function ControlPills({ queryRef }: ControlPillsProps) {
    const [selectedControl, setSelectedControl] = useState<Control | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data } = useReadQuery(queryRef);
    const controls = data.controls as Control[];

    const handleRowClick = (control: Control) => {
        setSelectedControl(control);
        setIsModalOpen(true);
    };

    const onClose = () => setIsModalOpen(false);

    const sortedControls = useMemo(() => {
        return sortArray(controls, 'name');
    }, [controls]);

    return (
        <>
            <div className="bg-base-100 pb-8">
                <div className="flex flex-wrap gap-3">
                    {sortedControls.map((control) => (
                        <ControlPill control={control} onClick={() => handleRowClick(control)} key={control.deviceId} />
                    ))}
                </div>
            </div>


            {selectedControl && <ControlModal isOpen={isModalOpen} onClose={onClose} onSuccess={onClose} control={selectedControl} />}
        </>
    );
}