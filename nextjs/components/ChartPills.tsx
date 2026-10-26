'use client';

import { Suspense, useMemo, useState } from 'react';
import ChartPill from './ChartPill';
import { QueryRef, useReadQuery } from '@apollo/client/react';
import { sortArray } from '@/lib/utilities';
import { Chart } from 'puddle-graphql';
import ChartModal from './ChartModal';
import DeviceChart from './ChartGenerator';
import { Plus, Settings } from 'lucide-react';
import IconPill from './IconPill';

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

    const handleLoadClick = (chart: Chart) => {
        setSelectedChart(chart);
    };

    const handleSettingsClick = () => {
        setIsModalOpen(true);
    };

    function handleAddClick() {
        setSelectedChart(null);
        setIsModalOpen(true);
    }

    function handleModalSuccess() {
        setSelectedChart(null);
        setIsModalOpen(false);
    }

    const sortedCharts = useMemo(() => {
        return sortArray(charts, 'name');
    }, [charts]);

    return (
        <>
            {selectedChart ? <>
                <h3 className="text-2xl font-normal mb-6">
                    Select a date range for the <strong className='font-semibold'>{selectedChart.name}</strong> chart.
                    <button className="btn btn-primary btn-sm btn-circle ml-3" onClick={() => handleSettingsClick()}>
                        <Settings />
                    </button>
                </h3>
            </> :
                <h3 className="text-2xl font-normal mb-6">Select a topic and a key to chart.</h3>
            }
            <Suspense fallback={<ChartSkeleton />}><DeviceChart selectedChart={selectedChart} /></Suspense>

            <div className="bg-base-100 pb-8">
                <div className="flex flex-wrap gap-3">
                    <IconPill icon={Plus} onClick={() => handleAddClick()} />

                    {sortedCharts.map((chart) => (
                        <ChartPill chart={chart} onClick={() => handleLoadClick(chart)} key={chart.id} />
                    ))}
                </div>
            </div>

            <ChartModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleModalSuccess} chart={selectedChart} />
        </>
    );
}