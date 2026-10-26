'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Chart, zodPairsInput } from 'puddle-graphql';
import { FormProvider, useForm } from 'react-hook-form';
import { CartesianGrid, Line, LineChart, Tooltip, TooltipContentProps, XAxis, YAxis } from 'recharts';
import { TopicSelectFieldset } from './TopicsSelectFieldset';
import { InputFieldset } from './InputFieldset';
import DateRangePicker from './DateRangePicker';
import z from 'zod';
import { GET_PAIRS } from '@/lib/queries';
import { useSuspenseQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import { LTTB } from 'downsample';
import { differenceInDays, differenceInHours, format } from 'date-fns';
import { Play } from 'lucide-react';
import { capitalize, celsiusToFahrenheit } from '@/lib/utilities';
import { stateMap } from './FavoritePill';

interface DeviceChartProps {
    selectedChart: Chart | null;
}

export default function ChartGenerator({ selectedChart }: DeviceChartProps) {
    const [isChartOpen, setIsChartOpen] = useState({ open: false, startDate: '', endDate: '' });

    type ChartData = z.infer<typeof zodPairsInput>;
    const formMethods = useForm({
        resolver: zodResolver(zodPairsInput),
        values: selectedChart ? {
            name: selectedChart.key || '',
            topicId: selectedChart.topicId || 0,
            startDate: isChartOpen.startDate,
            endDate: isChartOpen.endDate
        } : {
            name: '',
            topicId: 0,
            startDate: isChartOpen.startDate,
            endDate: isChartOpen.endDate
        }
    });

    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        formState: { errors },
    } = formMethods;

    const onSubmit = async (data: ChartData) => {
        setIsChartOpen({ open: true, startDate: data.startDate, endDate: data.endDate });
    };

    return (
        <>
            <form className='mb-6' onSubmit={handleSubmit(onSubmit)}>
                <fieldset>
                    <div className="grid grid-cols-1 md:grid-cols-16 gap-2">
                        <div className='md:col-span-6'>
                            <TopicSelectFieldset label='Topic' error={errors.topicId?.message} control={control} name="topicId" />
                        </div>
                        <InputFieldset className='md:col-span-3' label='Key' error={errors.name} {...register("name")} />
                        <FormProvider {...formMethods}>
                            <DateRangePicker className='md:col-span-6' error={errors.endDate} />
                        </FormProvider>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">Run</legend>
                            <button type="submit" className="btn btn-primary"><Play /></button>
                            <p className="label"></p>
                        </fieldset>
                    </div>
                </fieldset>
            </form>

            {isChartOpen.open && selectedChart && <PairChart selectedChart={selectedChart} startDate={isChartOpen.startDate} endDate={isChartOpen.endDate} />}
        </>

    );
}

interface PairChartProps {
    selectedChart: Chart;
    startDate: string;
    endDate: string;
}

function PairChart({ selectedChart, startDate, endDate }: PairChartProps) {
    const { data } = useSuspenseQuery(GET_PAIRS, { variables: { topicId: selectedChart.topicId, name: selectedChart.key, startDate, endDate } });

    const chartData = useMemo(() => {
        if (!data?.pairs) return [];

        // Map to LTTB format
        const formatted = data.pairs.map((item) => ({
            x: new Date(item.createdAt).getTime(),
            y: Number(item.value),
            originalDate: item.createdAt,
        }));

        const downsampled = LTTB(formatted, 100);

        // Map it back and add simple moving average
        const windowSize = 12;
        const toF = selectedChart.key == 'temperature';
        const hoursDiff = differenceInHours(endDate, startDate);
        return (downsampled as any[]).map((point, index, arr) => {
            // Get a slice of points around the current index
            const start = Math.max(0, index - Math.floor(windowSize / 2));
            const end = Math.min(arr.length, start + windowSize);
            const windowSlice = arr.slice(start, end);

            // Calculate the average value for this window
            const sum = windowSlice.reduce((acc, curr) => acc + curr.y, 0);
            const movingAverage = sum / windowSlice.length;

            return {
                createdAt: format(new Date(point.x), hoursDiff > 30 ? 'M/d/yy h:ma' : 'h:mma'),
                value: toF ? celsiusToFahrenheit(point.y) : point.y,
                sma: toF ? celsiusToFahrenheit(movingAverage) : movingAverage,
                timestamp: format(point.x, 'MM/dd/yyyy hh:mma')
            };
        });
    }, [data]);

    return (
        <LineChart style={{ width: '100%', aspectRatio: 1.618, margin: 'auto', marginBottom: 30 }} responsive data={chartData}>
            <CartesianGrid strokeDasharray="5 5" opacity={0.5} />
            <XAxis dataKey="createdAt" fontSize={12} />
            <YAxis width="auto" fontSize={12} />
            <Tooltip content={PairTooltip} />
            <Line type="monotone"
                dataKey="value"
                unit={stateMap[selectedChart.key] || ''}
                name={capitalize(selectedChart.key)}
            />
            <Line
                type="natural"
                dataKey="sma"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={false}
            />
        </LineChart>
    );
}

function PairTooltip({ active, payload }: TooltipContentProps) {
    const firstPayload = payload?.[0];
    const isVisible = active && firstPayload != null;
    if (!isVisible) return null;
    return (
        <div className="text-sm font-mono">
            <p>
                <strong className='font-semibold'>{firstPayload.name}:</strong>
                {` ${firstPayload.value}${firstPayload.unit}`}
            </p>
            <p>
                <strong className='font-semibold'>SMA:</strong>
                {` ${Number(firstPayload.payload.sma).toFixed(2)}${firstPayload.unit}`}
            </p>
            <p>{firstPayload.payload.timestamp}</p>
        </div>
    );
};