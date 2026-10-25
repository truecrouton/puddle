import BaseModal from './BaseModal';
import { DELETE_TOPIC, GET_TOPIC_STATUS, UPSERT_TOPIC } from '@/lib/queries';
import { useMutation, useQuery, skipToken } from '@apollo/client/react';
import ModalActions from './ModalActions';
import { InputFieldset } from './InputFieldset';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Topic, zodUpsertTopicInputSchema } from 'puddle-graphql';
import { useEffect } from 'react';

interface TopicModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    topic: Topic;
}

export default function TopicModal({ isOpen, onClose, onSuccess, topic }: TopicModalProps) {
    const { data: statusData } = useQuery(GET_TOPIC_STATUS, isOpen ? { variables: { id: topic.id }, fetchPolicy: 'cache-and-network' } : skipToken);

    const [deleteTopic, { loading: deletePending, error: deleteError, reset: resetDeleteMutation }] = useMutation(DELETE_TOPIC, {
        update(cache, { data }) {
            if (!data?.deleteTopic.valueOf) return;

            cache.modify({
                fields: {
                    topics(existingTopics = [], { readField }) {
                        return existingTopics.filter((t: Topic) => {
                            const topicId = readField('id', t);
                            return topicId != topic.id;
                        });
                    },
                },
            });
        }
    });
    const [upsertTopic, { loading: updatePending, error: updateError, reset: resetUpsertMutation }] = useMutation(UPSERT_TOPIC, {
        update(cache, { data }) {
            if (topic.id || !data?.upsertTopic) return;

            cache.modify({
                fields: {
                    topics(existingTopics = [], { toReference }) {
                        return [...existingTopics, toReference(data.upsertTopic)];
                    },
                },
            });
        }
    });

    type TopicData = z.infer<typeof zodUpsertTopicInputSchema>;
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(zodUpsertTopicInputSchema),
        values: topic ? {
            id: topic.id,
            topic: topic.topic,
        } : {
            id: 0,
            topic: '',
        }
    });

    useEffect(() => {
        resetDeleteMutation();
        resetUpsertMutation();
    }, [isOpen]);

    const onSubmit = async (data: TopicData) => {
        await upsertTopic({
            variables: {
                input: data
            }
        });
        reset();
        onSuccess();
    };

    const onDelete = async (topicId: number) => {
        await deleteTopic({
            variables: {
                input: {
                    id: topicId,
                }
            }
        });
        reset();
        onSuccess();
    };

    const status = statusData?.topic?.status || [];
    let trKey = 1;
    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={`${topic.id ? 'Edit' : 'Add'} Topic`} alertErrors={[deleteError?.message, updateError?.message]}>
            <form onSubmit={handleSubmit(onSubmit)} key={topic.id ?? 'new'}>
                <fieldset>
                    <input type="hidden" {...register('id')} />
                    <InputFieldset label='Topic' error={errors.topic} {...register("topic")} />
                    <ModalActions isPending={updatePending || deletePending} onClose={onClose} onDelete={topic.id ? () => onDelete(topic.id) : undefined} />
                </fieldset>
            </form>

            {status.length > 0 && <table className="table table-zebra mt-6">
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    {status.map((s) => (
                        <tr className='font-mono text-secondary' key={trKey++}>
                            <td>{s.name}</td>
                            <td>{s.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>}
        </BaseModal>
    );
}