'use client';

import { useMemo, useState } from 'react';
import ChartPill from './ChartPill';
import { QueryRef, useFragment, useReadQuery } from '@apollo/client/react';
import { sortArray } from '@/lib/utilities';
import { Chart, zodPairsInput } from 'puddle-graphql';
import ChartModal from './ChartModal';
import ChartGenerator from './ChartGenerator';
import { Plus, Settings } from 'lucide-react';
import IconPill from './IconPill';
import z from 'zod';
import { gql } from '@apollo/client';

type zodChartInputSchema = z.infer<typeof zodPairsInput>;

interface ChartPillsProps {
    queryRef: QueryRef<any>;
}

export default function ChartPills({ queryRef }: ChartPillsProps) {
    const [selectedChartId, setSelectedChartId] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [chartRequest, setChartRequest] = useState<zodChartInputSchema>({
        name: '',
        topicId: 0,
        startDate: '',
        endDate: ''
    });

    const { data } = useReadQuery(queryRef);
    const charts = data.charts as Chart[];

    const handleLoadClick = (id: number, name: string, topicId: number) => {
        setSelectedChartId(id);
        setChartRequest({ ...chartRequest, name, topicId });
    };

    const handleSettingsClick = () => {
        setIsModalOpen(true);
    };

    function handleAddClick() {
        setSelectedChartId(0);
        setIsModalOpen(true);
    }

    function handleDeleted() {
        setSelectedChartId(0);
        setIsModalOpen(false);
    }

    function handleUpserted(updatedChart: Chart) {
        setIsModalOpen(false);
    }

    function handleChartChange(name: string, topicId: number) {
        setSelectedChartId(0);
        setChartRequest({ ...chartRequest, name, topicId });
    }

    function ChartHeading() {
        const { data: selectedChart } = useFragment<Chart>({
            fragment: gql`
          fragment CurrentChart on Chart {
            id
            name
            topicId
            key
            isFavorite
          }
        `,
            from: selectedChartId ? { __typename: "Chart", id: selectedChartId } : null,
        });

        return (
            selectedChartId ?
                <h3 className="text-2xl font-normal mb-6">
                    Select a date range for the <strong className='font-semibold'>{selectedChart.name}</strong> chart.
                    <button className="btn btn-primary btn-sm btn-circle ml-3" onClick={() => handleSettingsClick()}>
                        <Settings />
                    </button>
                </h3>
                :
                <h3 className="text-2xl font-normal mb-6">Select a topic and a key to chart.</h3>
        );
    }

    const sortedCharts = useMemo(() => {
        return sortArray(charts, 'name');
    }, [charts]);

    return (
        <>
            <ChartHeading />
            <ChartGenerator chartRequest={chartRequest} onChange={handleChartChange} />

            <div className="bg-base-100 pb-8">
                <div className="flex flex-wrap gap-3">
                    <IconPill icon={Plus} onClick={() => handleAddClick()} />

                    {sortedCharts.map((chart) => (
                        <ChartPill chart={chart} onClick={() => handleLoadClick(chart.id, chart.key, chart.topicId)} key={chart.id} />
                    ))}
                </div>
            </div>

            <ChartModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUpserted={handleUpserted} onDeleted={handleDeleted} chartId={selectedChartId} />
        </>
    );
}

