'use client';

import { useState } from 'react';
import DeviceModal from './DeviceModal';
import { iconMap as deviceIconMap } from './DevicePill';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import { Topic } from 'puddle-graphql';
import Link from 'next/link';
import { iconMap as automationIconMap } from './AutomationPill';
import { CircleQuestionMark } from 'lucide-react';

interface TopicsTableProps {
    queryRef: QueryRef<any>;
}

export default function TopicsTable({ queryRef }: TopicsTableProps) {
    const [selectedDevice, setSelectedDevice] = useState<Topic | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data } = useReadQuery(queryRef);
    const topics = data.topics as Topic[];

    return (
        <>
            {
                <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Topics</th>
                                <th>Devices</th>
                                <th>Automations</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topics.map((topic) => (
                                <tr key={topic.id} >
                                    <th className="font-semibold">{topic.topic}</th>
                                    <td>
                                        <div className="inline-flex items-center gap-2 flex-wrap">{topic.devices?.map((device) => {
                                            const IconComponent = deviceIconMap[device.kind] || CircleQuestionMark;
                                            return (
                                                <Link className="inline-flex items-center rounded-full w-fit bg-warning text-warning-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" href={`/devices/${device.id}`} key={device.id}>
                                                    <IconComponent className="w-5 h-5 mr-2" />
                                                    <div className="text-left">
                                                        <h3 className="font-bold">{device.name}</h3>
                                                    </div>
                                                </Link>
                                            );
                                        })}</div>
                                    </td>
                                    <td>
                                        <div className="inline-flex items-center gap-2 flex-wrap">
                                            {topic.automations?.map((automation) => {
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
                                            {topic.usedInAutomations?.map((automation) => {
                                                const IconComponent = automationIconMap[automation.trigger] || CircleQuestionMark;

                                                return (
                                                    <Link className="inline-flex items-center rounded-full w-fit bg-base-300 text-base-content hover:bg-accent hover:text-accent-content transition-colors duration-200 cursor-pointer px-5 py-2" href={`/automations/${automation.id}`} key={automation.id}>
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
            }

            {selectedDevice && <DeviceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => setIsModalOpen(false)} deviceId={selectedDevice.id} />}
        </>
    );
}