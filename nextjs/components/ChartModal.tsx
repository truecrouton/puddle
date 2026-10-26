import BaseModal from './BaseModal';
import { DELETE_CHART, UPSERT_CHART } from '@/lib/queries';
import { useMutation } from '@apollo/client/react';
import ModalActions from './ModalActions';
import { InputFieldset } from './InputFieldset';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Chart, zodUpsertChartInputSchema } from 'puddle-graphql';
import { useEffect } from 'react';
import { TopicSelectFieldset } from './TopicsSelectFieldset';

interface ChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    chart: Chart;
}

export default function ChartModal({ isOpen, onClose, onSuccess, chart }: ChartModalProps) {
    const [deleteChart, { loading: deletePending, error: deleteError, reset: resetDeleteMutation }] = useMutation(DELETE_CHART, {
        update(cache, { data }) {
            if (!data?.deleteChart.valueOf) return;

            cache.modify({
                fields: {
                    charts(existingCharts = [], { readField }) {
                        return existingCharts.filter((c: Chart) => {
                            const chartId = readField('id', c);
                            return chartId != chart.id;
                        });
                    },
                },
            });
        }
    });
    const [upsertChart, { loading: updatePending, error: updateError, reset: resetUpsertMutation }] = useMutation(UPSERT_CHART, {
        update(cache, { data }) {
            if (chart.id || !data?.upsertChart) return;

            cache.modify({
                fields: {
                    topics(existingCharts = [], { toReference }) {
                        return [...existingCharts, toReference(data.upsertChart)];
                    },
                },
            });
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
        values: chart ? {
            id: chart.id,
            name: chart.name || '',
            topicId: chart.topicId || 0,
            key: chart.key || '',
            isFavorite: chart.isFavorite || false
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
        await upsertChart({
            variables: {
                input: data
            }
        });
        onSuccess();
    };

    const onDelete = async (chartId: number) => {
        await deleteChart({
            variables: {
                input: {
                    id: chartId,
                }
            }
        });
        onSuccess();
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={`${chart.id ? 'Edit' : 'Add'} Chart`} alertErrors={[deleteError?.message, updateError?.message]}>
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
                    <ModalActions isPending={updatePending || deletePending} onClose={onClose} onDelete={chart.id ? () => onDelete(chart.id) : undefined} />
                </fieldset>
            </form>
        </BaseModal>
    );
}