'use client';

import { Suspense, useMemo, useState } from 'react';
import ChartPill from './ChartPill';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import { sortArray } from '@/lib/utilities';
import { Chart, zodPairsInput } from 'puddle-graphql';
import ChartModal from './ChartModal';
import DeviceChart from './DeviceChart';

function ChartSkeleton() {
    return (
        <div className="w-full bg-white flex items-center justify-center" style={{ aspectRatio: '1.618' }} >
            <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
    );
}

interface ChartPillsProps {
    queryRef: QueryRef<any>;
}

export default function ChartPills({ queryRef }: ChartPillsProps) {
    const [selectedChart, setSelectedChart] = useState<Chart | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data } = useReadQuery(queryRef);
    const charts = data.charts as Chart[];

    const handleClick = (chart: Chart) => {
        setSelectedChart(chart);
        //setIsModalOpen(true);
    };

    const sortedCharts = useMemo(() => {
        return sortArray(charts, 'name');
    }, [charts]);

    return (
        <>
            <Suspense fallback={<ChartSkeleton />}><DeviceChart selectedChart={selectedChart} /></Suspense>

            <div className="bg-base-100 pb-8">
                <div className="flex flex-wrap gap-3">
                    {sortedCharts.map((chart) => (
                        <ChartPill chart={chart} onClick={() => handleClick(chart)} key={chart.id} />
                    ))}
                </div>
            </div>

            {selectedChart && <ChartModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => setIsModalOpen(false)} chart={selectedChart} />}
        </>
    );
}