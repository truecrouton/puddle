import { Suspense, useState } from 'react';
import BaseModal from './BaseModal';
import { DELETE_EXPRESSION, UPSERT_EXPRESSION } from '@/lib/queries';
import { useMutation, } from '@apollo/client/react';
import ModalActions from './ModalActions';
import { InputFieldset } from './InputFieldset';
import { EmptySelectFieldset, SelectFieldset } from './SelectFieldset';
import { z } from 'zod';
import { FieldErrors, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Expression, zodUpsertExpressionSchema } from 'puddle-graphql';
import { DeviceSelectFieldset } from './DeviceSelectFieldset';
import { TopicSelectFieldset } from './TopicsSelectFieldset';

function getOptions(conditionalExpressionId: number) {
    if (conditionalExpressionId) return [
        { label: 'Device', value: 'device' },
        { label: 'Notify', value: 'notify' },
        { label: 'Publish', value: 'publish' },
        { label: 'Wait', value: 'wait' },
    ];
    else return [
        { label: 'If', value: 'if' },
        { label: 'Device', value: 'device' },
        { label: 'Notify', value: 'notify' },
        { label: 'Publish', value: 'publish' },
        { label: 'Wait', value: 'wait' },
    ];
}

interface ExpressionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    expression: Expression;
}

export default function ExpressionModal({ isOpen, onClose, onSuccess, expression }: ExpressionModalProps) {
    const [alertError, setAlertError] = useState('');
    const [deleteExpression, { loading: deletePending, error: deleteError }] = useMutation(DELETE_EXPRESSION, {
        update(cache, { data }) {
            if (!data?.deleteExpression.valueOf) return;

            const expressionCacheId = cache.identify({
                __typename: "Expression",
                id: expression.id,
            });

            cache.evict({ id: expressionCacheId });
        }
    });
    const [upsertExpression, { loading: updatePending, error: updateError }] = useMutation(UPSERT_EXPRESSION, {
        update(cache, { data }) {
            if (expression.id || !data?.upsertExpression) return;
            const automationCacheId = cache.identify({
                __typename: "Automation",
                id: data?.upsertExpression.automationId,
            });

            cache.modify({
                id: automationCacheId,
                fields: {
                    expressions(existingExpressions = [], { toReference }) {
                        return [...existingExpressions, toReference(data.upsertExpression)];
                    },
                },
            });
        }
    });

    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(zodUpsertExpressionSchema),
        values: expression.id ? {
            id: expression.id,
            automationId: expression.automationId,
            kind: expression.kind,
            isElseStep: expression.isElseStep,
            expression: expression.expression ?? null,
            conditionalExpressionId: expression.conditionalExpressionId,
            topicId: expression.topicId,
            message: expression.message ?? null,
            deviceId: expression.deviceId ?? 0,
            state: expression.state ?? '',
        } : {
            id: 0,
            automationId: expression.automationId,
            kind: '',
            isElseStep: expression.isElseStep,
            expression: null,
            conditionalExpressionId: expression.conditionalExpressionId,
            topicId: 0,
            message: null,
            deviceId: 0,
            state: null,
        }
    });

    const selectedKind = watch("kind");

    type ExpressionData = z.infer<typeof zodUpsertExpressionSchema>;
    const onSubmit = async (data: ExpressionData) => {
        await upsertExpression({
            variables: {
                input: {
                    ...data,
                    automationId: expression.automationId,
                }
            }
        });
        reset();
        onSuccess();
    };

    const onDelete = async (expressionId: number) => {
        await deleteExpression({
            variables: {
                input: {
                    id: expressionId,
                }
            }
        });
        reset();
        onSuccess();
    };

    const onError = (errors: FieldErrors) => {
        setAlertError(`Validation failed for: ${Object.keys(errors).join(', ')}.`);
        console.log("Validation failed:", errors);
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={"Device Expression"} alertErrors={[updateError?.message, deleteError?.message, alertError]} >
            <form onSubmit={handleSubmit(onSubmit, onError)} onChange={() => setAlertError('')} key={expression.id}>
                <fieldset>
                    <SelectFieldset label='Kind' error={errors.kind} {...register("kind")} disabled={expression.id > 0} key="kind">
                        <option value="" key="">Select a Type</option>
                        {getOptions(expression.conditionalExpressionId || 0).map((option) => (
                            <option value={option.value} key={option.value}>{option.label}</option>
                        ))}
                    </SelectFieldset>
                    {selectedKind == 'device' && <Suspense fallback={<EmptySelectFieldset label="Device" />}>
                        <DeviceSelectFieldset label='Device' error={errors.deviceId?.message} control={control} name="deviceId" />
                    </Suspense>}
                    {selectedKind == 'publish' && <Suspense fallback={<EmptySelectFieldset label="Topic" />}>
                        <TopicSelectFieldset label='Topic' error={errors.deviceId?.message} control={control} name="topicId" />
                    </Suspense>}
                    {selectedKind == 'device' && <InputFieldset label='State' error={errors.state} {...register("state")} />}
                    {['notify', 'publish'].includes(selectedKind) && <InputFieldset label='Message' error={errors.message} {...register("message")} />}
                    {selectedKind == 'if' && <InputFieldset label='Expression' error={errors.expression} {...register("expression")} />}
                    <ModalActions isPending={updatePending || deletePending} onClose={onClose} onDelete={expression.id ? () => onDelete(expression.id) : undefined} />
                </fieldset>
            </form>
        </BaseModal>
    );
}