'use client';

import { useState } from 'react';
import { GET_CONTROLS } from "@/lib/queries";
import { ResultOf } from '@graphql-typed-document-node/core';
import ControlModal from './ControlModal';
import ControlPill from './ControlPill';
import { QueryRef, useReadQuery } from '@apollo/client/react';

type GetControlsResult = ResultOf<typeof GET_CONTROLS>;
type Control = GetControlsResult['controls'][number];

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

    return (
        <>
            <div className="bg-base-100 pb-8">
                <div className="flex flex-wrap gap-3">
                    {controls.map((control) => (
                        <ControlPill control={control} onClick={() => handleRowClick(control)} key={control.deviceId} />
                    ))}
                </div>
            </div>


            {selectedControl && <ControlModal isOpen={isModalOpen} onClose={onClose} onSuccess={onClose} control={selectedControl} />}
        </>
    );
}