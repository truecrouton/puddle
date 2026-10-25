'use client';

import { useMemo, useState } from 'react';
import DeviceModal from './DeviceModal';
import DevicePill from './DevicePill';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import { Device } from 'puddle-graphql';
import IconPill from './IconPill';
import { Plus } from 'lucide-react';
import { sortArray } from '@/lib/utilities';

interface DevicePillsProps {
    queryRef: QueryRef<any>;
}

export default function DevicePills({ queryRef }: DevicePillsProps) {
    const [selectedDeviceId, setSelectedDeviceId] = useState(-1);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data } = useReadQuery(queryRef);
    const devices = data.devices as Device[];

    const handleDeviceClick = (devceId: number) => {
        setSelectedDeviceId(devceId);
        setIsModalOpen(true);
    };

    async function handleAddClick() {
        setSelectedDeviceId(0);
        setIsModalOpen(true);
    }

    const sortedDevices = useMemo(() => {
        return sortArray(devices, 'name');
    }, [devices]);

    return (
        <>
            <div className="bg-base-100 pb-8">
                <div className="flex flex-wrap gap-3">
                    <IconPill icon={Plus} onClick={() => handleAddClick()} />
                    {sortedDevices.map((device) => (
                        <DevicePill device={device} onClick={() => handleDeviceClick(device.id)} key={device.id} />
                    ))}
                </div>
            </div>

            {selectedDeviceId >= 0 && <DeviceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => setIsModalOpen(false)} deviceId={selectedDeviceId} />}
        </>
    );
}