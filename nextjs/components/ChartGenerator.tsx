'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { zodPairsInput } from 'puddle-graphql';
import { FormProvider, useForm } from 'react-hook-form';
import { CartesianGrid, Line, LineChart, Tooltip, TooltipContentProps, XAxis, YAxis } from 'recharts';
import { TopicSelectFieldset } from './TopicsSelectFieldset';
import DateRangePicker from './DateRangePicker';
import z from 'zod';
import { GET_PAIRS } from '@/lib/queries';
import { useSuspenseQuery } from '@apollo/client/react';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { LTTB } from 'downsample';
import { differenceInHours, format } from 'date-fns';
import { capitalize, celsiusToFahrenheit } from '@/lib/utilities';
import { stateMap } from './FavoritePill';
import { ChartKeySelectFieldset } from './ChartKeySelectFieldset';

type zodChartInputSchema = z.infer<typeof zodPairsInput>;

function ChartSkeleton() {
    return (
        <div className="w-full flex items-center justify-center" style={{ aspectRatio: '1.618' }} >
            <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
    );
}

interface ChartGeneratorProps {
    onChange: (name: string, topicId: number) => void;
    chartRequest: zodChartInputSchema;
}

export default function ChartGenerator({ onChange, chartRequest }: ChartGeneratorProps) {
    const [topicId, setTopicId] = useState(0);
    const chartInput = useRef({
        startDate: '',
        endDate: ''
    });

    const formMethods = useForm({
        resolver: zodResolver(zodPairsInput),
        values: {
            name: chartRequest.name,
            topicId: chartRequest.topicId,
            startDate: chartInput.current.startDate,
            endDate: chartInput.current.endDate
        }
    });

    const {
        getValues,
        control,
        formState: { errors },
    } = formMethods;

    useEffect(() => {
        setTopicId(chartRequest?.topicId || 0);
    }, [chartRequest?.topicId]);

    function handleDateChange(startDate: string, endDate: string) {
        chartInput.current.startDate = startDate;
        chartInput.current.endDate = endDate;
    }

    const validationResult = zodPairsInput.safeParse({ ...getValues(), topicId: Number(getValues('topicId')) });

    return (
        <>
            <form className='mb-6' onChange={() => onChange(getValues('name'), Number(getValues('topicId')))}>
                <fieldset>
                    <div className="grid grid-cols-1 md:grid-cols-16 gap-2">
                        <div className='md:col-span-6'>
                            <TopicSelectFieldset label='Topic' error={errors.topicId?.message} control={control} name="topicId" />
                        </div>
                        <ChartKeySelectFieldset className='md:col-span-4' label='Key' error={errors.name?.message} control={control} name="name" topicId={topicId} />
                        <FormProvider {...formMethods}>
                            <DateRangePicker className='md:col-span-6' error={errors.endDate} onDateChange={handleDateChange} />
                        </FormProvider>
                    </div>
                </fieldset>
            </form>

            {validationResult.success && <Suspense fallback={<ChartSkeleton />}>
                <PairChart chart={{ ...getValues(), topicId: Number(getValues('topicId')) } as zodChartInputSchema} />
            </Suspense>}
        </>
    );
}

interface PairChartProps {
    chart: zodChartInputSchema;
}

function PairChart({ chart }: PairChartProps) {
    const { data } = useSuspenseQuery(GET_PAIRS, { variables: chart });

    const pairs = useMemo(() => {
        if (!data?.pairs) return [];

        // Map to LTTB format
        const valueMap: Record<string, number> = { ON: 1, OFF: 0 };
        const formatted = data.pairs.map((item) => ({
            x: new Date(item.createdAt).getTime(),
            y: valueMap[item.value] ?? Number(item.value),
            originalDate: item.createdAt,
        }));

        const downsampled = LTTB(formatted, 100);

        // Map it back and add simple moving average
        const windowSize = 12;
        const toF = chart.name == 'temperature';
        const hoursDiff = differenceInHours(chart.endDate, chart.startDate);
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
        <LineChart style={{ width: '100%', aspectRatio: 1.618, margin: 'auto', marginBottom: 30 }} responsive data={pairs}>
            <CartesianGrid strokeDasharray="5 5" opacity={0.5} />
            <XAxis dataKey="createdAt" fontSize={12} />
            <YAxis width="auto" fontSize={12} />
            <Tooltip content={PairTooltip} />
            <Line type="monotone"
                dataKey="value"
                unit={stateMap[chart.name] || ''}
                name={capitalize(chart.name)}
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