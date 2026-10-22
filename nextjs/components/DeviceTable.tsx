'use client';

import { useState } from 'react';
import DeviceModal from './DeviceModal';
import DevicePill from './DevicePill';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import { Device } from 'puddle-graphql';

interface DeviceTableProps {
    queryRef: QueryRef<any>;
}

export default function DeviceTable({ queryRef }: DeviceTableProps) {
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    //const { data } = useSuspenseQuery(GET_DEVICE_STUBS);
    const { data } = useReadQuery(queryRef);
    const devices = data.devices as Device[];

    const handleRowClick = (device: Device) => {
        setSelectedDevice(device);
        setIsModalOpen(true);
    };

    return (
        <>
            <div className="bg-base-100 pb-8">
                <div className="flex flex-wrap gap-3">
                    {devices.map((device) => (
                        <DevicePill device={device} onClick={() => handleRowClick(device)} key={device.id} />
                    ))}
                </div>
            </div>
            {/*
            <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Kind</th>
                            <th>Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {devices.map((device) => (
                            <tr
                                key={device.id}
                                onClick={() => handleRowClick(device)}
                                className="hover:bg-base-300 cursor-pointer"
                            >
                                <th className="flex items-center gap-2">{iconMap[device.kind]}</th>
                                <td className="font-semibold">{device.name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            */}

            {selectedDevice && <DeviceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => setIsModalOpen(false)} deviceId={selectedDevice.id} />}
        </>
    );
}