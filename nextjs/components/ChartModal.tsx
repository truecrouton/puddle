import BaseModal from './BaseModal';
import { DELETE_CHART, GET_CHARTS, GET_TOPIC_DETAILS, UPSERT_CHART } from '@/lib/queries';
import { useFragment, useMutation } from '@apollo/client/react';
import ModalActions from './ModalActions';
import { InputFieldset } from './InputFieldset';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Chart, zodUpsertChartInputSchema } from 'puddle-graphql';
import { useEffect } from 'react';
import { TopicSelectFieldset } from './TopicsSelectFieldset';
import { gql } from '@apollo/client';

interface ChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpserted: (updatedChart: Chart) => void;
    onDeleted: () => void;
    chartId: number;
}

export default function ChartModal({ isOpen, onClose, onUpserted, onDeleted, chartId }: ChartModalProps) {
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
        from: chartId ? { __typename: "Chart", id: chartId } : null,
    });

    const [deleteChart, { loading: deletePending, error: deleteError, reset: resetDeleteMutation }] = useMutation(DELETE_CHART, {
        update(cache, { data }) {
            if (!selectedChart || !data?.deleteChart.valueOf) return;

            cache.modify({
                fields: {
                    charts(existingCharts = [], { readField }) {
                        return existingCharts.filter((c: Chart) => {
                            const chartId = readField('id', c);
                            return chartId != selectedChart.id;
                        });
                    },
                },
            });
        }
    });
    const [upsertChart, { loading: updatePending, error: updateError, reset: resetUpsertMutation }] = useMutation(UPSERT_CHART, {
        update(cache, { data }) {
            if (chartId || !data?.upsertChart) return;
            cache.updateQuery({
                query: GET_CHARTS,
            }, (existingCharts) => {
                if (!existingCharts) return existingCharts;

                const exists = existingCharts.charts.some(b => b.id === data.upsertChart.id);
                if (exists) return existingCharts;

                return {
                    ...existingCharts,
                    charts: [...existingCharts.charts, data.upsertChart],
                };
            });
        },
        onCompleted(data) {
            onUpserted(data.upsertChart);
        }
    });

    type ChartData = z.infer<typeof zodUpsertChartInputSchema>;
    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(zodUpsertChartInputSchema),
        values: selectedChart ? {
            id: selectedChart.id,
            name: selectedChart.name || '',
            topicId: selectedChart.topicId || 0,
            key: selectedChart.key || '',
            isFavorite: selectedChart.isFavorite || false
        } : {
            id: 0,
            name: '',
            topicId: 0,
            key: '',
            isFavorite: false
        }
    });

    useEffect(() => {
        resetDeleteMutation();
        resetUpsertMutation();
        reset();
    }, [isOpen]);

    const onSubmit = async (data: ChartData) => {
        const r = await upsertChart({
            variables: {
                input: data
            }
        });
    };

    const onDelete = async (chartId: number) => {
        await deleteChart({
            variables: {
                input: {
                    id: chartId,
                }
            }
        });
        onDeleted();
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={`${selectedChart?.id ? 'Edit' : 'Add'} Chart`} alertErrors={[deleteError?.message, updateError?.message]}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <fieldset>
                    <input type="hidden" {...register('id')} />
                    <InputFieldset label='Name' error={errors.name} {...register("name")} />
                    <TopicSelectFieldset label='Topic' error={errors.topicId?.message} control={control} name="topicId" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className='md:col-span-2'>
                            <InputFieldset label='Key' error={errors.key} {...register("key")} />
                        </div>
                        <fieldset className='fieldset'>
                            <legend className="fieldset-legend">Favorite</legend>
                            <input type='checkbox' className="toggle toggle-lg" {...register("isFavorite")} />
                            <p className="label text-error-content">{errors.isFavorite?.message}</p>
                        </fieldset>                    </div>
                    <ModalActions isPending={updatePending || deletePending} onClose={onClose} onDelete={selectedChart?.id ? () => onDelete(selectedChart?.id || 0) : undefined} />
                </fieldset>
            </form>
        </BaseModal>
    );
}