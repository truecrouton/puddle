'use client';

import { useState } from 'react';
import ChartPill from './ChartPill';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import { Chart } from '@/generated/resolvers-types';

interface ChartPillsProps {
    queryRef: QueryRef<any>;
}

export default function ChartPills({ queryRef }: ChartPillsProps) {
    const [selectedControl, setSelectedControl] = useState<Chart | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data } = useReadQuery(queryRef);
    const charts = data.charts as Chart[];

    const handleRowClick = (chart: Chart) => {
        setSelectedControl(chart);
        setIsModalOpen(true);
    };

    const onClose = () => setIsModalOpen(false);

    return (
        <>
            <div className="bg-base-100 pb-8">
                <div className="flex flex-wrap gap-3">
                    {charts.map((chart) => (
                        <ChartPill chart={chart} onClick={() => handleRowClick(chart)} key={chart.id} />
                    ))}
                </div>
            </div>
        </>
    );
}