import { Suspense, useState } from 'react';
import BaseModal from './BaseModal';
import { DELETE_AUTOMATION, UPSERT_AUTOMATION } from '@/lib/queries';
import { useMutation, } from '@apollo/client/react';
import ModalActions from './ModalActions';
import { InputFieldset } from './InputFieldset';
import { EmptySelectFieldset, SelectFieldset } from './SelectFieldset';
import { z } from 'zod';
import { FieldErrors, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Automation, zodUpsertAutomationSchema } from 'puddle-graphql';
import { TopicSelectFieldset } from './TopicsSelectFieldset';
import { useRouter } from 'next/navigation';

interface AutomationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    automation: Automation;
}

export default function AutomationModal({ isOpen, onClose, onSuccess, automation }: AutomationModalProps) {
    const [alertError, setAlertError] = useState('');
    const router = useRouter();
    const [deleteAutomation, { loading: deletePending, error: deleteError }] = useMutation(DELETE_AUTOMATION, {
        onCompleted: () => {
            router.refresh();
            router.push('/automations');
        }
    });
    const [upsertAutomation, { loading: updatePending, error: updateError }] = useMutation(UPSERT_AUTOMATION, {
        update(cache, { data }) {
            if (automation.id || !data?.upsertAutomation) return;

            cache.modify({
                fields: {
                    automations(existingAutomations = [], { toReference }) {
                        return [...existingAutomations, toReference(data.upsertAutomation)];
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
        resolver: zodResolver(zodUpsertAutomationSchema),
        values: automation.id ? {
            id: automation.id,
            name: automation.name,
            trigger: automation.trigger,
            triggerAt: automation.triggerAt || null,
            triggerKey: automation.triggerKey || null,
            triggerValue: automation.triggerValue || null,
            position: automation.position || null,
            topicId: automation.topicId || 0,
            isControlShown: true,
        } : {
            id: 0,
            name: '',
            trigger: '',
            triggerAt: null,
            triggerKey: null,
            triggerValue: null,
            position: null,
            topicId: 0,
            isControlShown: true,
        }
    });

    const selectedTrigger = watch("trigger");

    type AutomationData = z.infer<typeof zodUpsertAutomationSchema>;
    const onSubmit = async (data: AutomationData) => {
        await upsertAutomation({
            variables: {
                input: data
            }
        });
        reset();
        onSuccess();
    };

    const onDelete = async (automationId: number) => {
        await deleteAutomation({
            variables: {
                input: {
                    id: automationId,
                }
            }
        });
        onSuccess();
    };

    const onError = (errors: FieldErrors) => {
        setAlertError(`Validation failed for: ${Object.keys(errors).join(', ')}.`);
        console.log("Validation failed:", errors);
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Automation Settings" alertErrors={[updateError?.message, deleteError?.message, alertError]} >
            <form onSubmit={handleSubmit(onSubmit, onError)} onChange={() => setAlertError('')} key={automation.id}>
                <fieldset>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputFieldset label='Name' error={errors.name} {...register("name")} />
                        <SelectFieldset label='Trigger' error={errors.trigger} {...register("trigger")} key="trigger">
                            <option value="" key="no_trigger">Select Trigger Type</option>
                            <option value="sun" key="sun">Sun Position</option>
                            <option value="time" key="time">Time</option>
                            <option value="topic" key="topic">Topic</option>
                            <option value="user" key="user">User</option>
                        </SelectFieldset>
                    </div>
                    {selectedTrigger == 'sun' && <SelectFieldset label='Sun Position' error={errors.position} {...register("position")} key="position">
                        <option value="" key="no_position">Select Sun Position</option>
                        <option value="afternoon" key="afternoon">Afternoon</option>
                        <option value="dawn" key="dawn">Dawn</option>
                        <option value="dusk" key="dusk">Dusk</option>
                        <option value="evening" key="evening">Evening</option>
                        <option value="goldenHour" key="goldenHour">Golden Hour</option>
                        <option value="goldenHourEnd" key="goldenHourEnd">Golden Hour End</option>
                        <option value="nadir" key="nadir">Nadir</option>
                        <option value="morning" key="morning">Morning</option>
                        <option value="lateMorning" key="lateMorning">Late Morning</option>
                        <option value="nauticalDawn" key="nauticalDawn">Nautical Dawn</option>
                        <option value="nauticalDusk" key="nauticalDusk">Nautical Dusk</option>
                        <option value="night" key="night">Night</option>
                        <option value="nightEnd" key="nightEnd">Night End</option>
                        <option value="solarNoon" key="solarNoon">Solar Noon</option>
                        <option value="sunrise" key="sunrise">Sunrise</option>
                        <option value="sunriseEnd" key="sunriseEnd">Sunrise End</option>
                        <option value="sunset" key="sunset">Sunset</option>
                        <option value="sunsetStart" key="sunsetStart">Sunset Start</option>
                    </SelectFieldset>}
                    {selectedTrigger == 'time' && <InputFieldset label='Trigger At' error={errors.triggerAt} {...register("triggerAt")} />}
                    {selectedTrigger == 'topic' && <Suspense fallback={<EmptySelectFieldset label="Topic" />}>
                        <TopicSelectFieldset label='Topic' error={errors.topicId?.message} control={control} name="topicId" />
                    </Suspense>}
                    {selectedTrigger == 'topic' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputFieldset label='Trigger Key' error={errors.triggerKey} {...register("triggerKey")} />
                        <InputFieldset label='Trigger Value' error={errors.triggerValue} {...register("triggerValue")} />
                    </div>}

                    <ModalActions isPending={updatePending || deletePending} onClose={onClose} onDelete={automation.id ? () => onDelete(automation.id) : undefined} />
                </fieldset>
            </form>
        </BaseModal>
    );
}