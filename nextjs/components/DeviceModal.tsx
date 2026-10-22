import { Suspense, useState } from 'react';
import BaseModal from './BaseModal';
import { GET_DEVICE, UPSERT_DEVICE } from '@/lib/queries';
import { skipToken, useMutation, useQuery } from '@apollo/client/react';
import ModalActions from './ModalActions';
import { InputFieldset } from './InputFieldset';
import { EmptySelectFieldset, SelectFieldset } from './SelectFieldset';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TopicSelectFieldset } from './TopicsSelectFieldset';
import { zodUpsertDeviceSchema } from 'puddle-graphql';

interface DeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    deviceId: number;
}

export default function DeviceModal({ isOpen, onClose, onSuccess, deviceId }: DeviceModalProps) {
    const [alertError, setAlertError] = useState('');

    const { data, loading, error: getDeviceError } = useQuery(GET_DEVICE,
        isOpen && deviceId ? { variables: { id: deviceId }, fetchPolicy: 'cache-and-network' } : skipToken);
    const [upsertDevice, { loading: updatePending, error: updateError }] = useMutation(UPSERT_DEVICE);

    const device = data?.device;

    type DeviceData = z.infer<typeof zodUpsertDeviceSchema>;
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(zodUpsertDeviceSchema),
        values: device ? {
            id: deviceId,
            topicId: device.topicId,
            name: device.name,
            kind: device.kind,
            stateKey: device.stateKey ?? '',
            setKey: device.setKey ?? '',
            setSuffix: device.setSuffix ?? '',
            valueOn: device.valueOn ?? '',
            valueOff: device.valueOff ?? ''
        } : {
            id: deviceId,
            topicId: 0,
            name: '',
            kind: '',
            stateKey: '',
            setKey: '',
            setSuffix: '',
            valueOn: '',
            valueOff: ''
        }
    });

    const onSubmit = async (data: DeviceData) => {
        setAlertError('');
        try {
            await upsertDevice({
                variables: {
                    input: data
                }
            });
            onSuccess();
        }
        catch (error) {
            console.error(error);
            setAlertError((error as Error).message);
        }
    };

    // ALL HOOKS ABOVE Early Return (unconditional)
    if (!device) return null;

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={"Device"} alertError={alertError}>
            <form onSubmit={handleSubmit(onSubmit)} onChange={() => setAlertError('')} key={deviceId ?? 'new'}>
                <fieldset disabled={loading} >
                    <input type="hidden" name="id" value={deviceId} />
                    <Suspense fallback={<EmptySelectFieldset label="Topic" />}>
                        <TopicSelectFieldset label='Topic' error={errors.topicId?.message} control={control} name="topicId" />
                    </Suspense>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputFieldset label='Name' error={errors.name} {...register("name")} />
                        <SelectFieldset label='Kind' error={errors.kind} {...register("kind")} >
                            <option value="">Select a Type</option>
                            <option value="controlling">Control</option>
                            <option value="dimmable">Dimmable</option>
                            <option value="informational">Informational</option>
                            <option value="positionable">Positionable</option>
                            <option value="toggleable">Toggleable</option>
                        </SelectFieldset>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputFieldset label='State Key' error={errors.stateKey} {...register("stateKey")} />
                        <InputFieldset label='Set Key' error={errors.setKey} {...register("setKey")} />
                        <InputFieldset label='Set Suffix' error={errors.setSuffix} {...register("setSuffix")} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputFieldset label='Value On' error={errors.valueOn} {...register("valueOn")} />
                        <InputFieldset label='Value Off' error={errors.valueOn} {...register("valueOff")} />
                    </div>
                    <ModalActions isPending={updatePending} onClose={onClose} />
                </fieldset>
            </form>
        </BaseModal>
    );
}