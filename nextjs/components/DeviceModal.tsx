import { Suspense, useEffect } from 'react';
import BaseModal from './BaseModal';
import { DELETE_DEVICE, GET_DEVICE, UPSERT_DEVICE } from '@/lib/queries';
import { skipToken, useMutation, useQuery } from '@apollo/client/react';
import ModalActions from './ModalActions';
import { InputFieldset } from './InputFieldset';
import { EmptySelectFieldset, SelectFieldset } from './SelectFieldset';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TopicSelectFieldset } from './TopicsSelectFieldset';
import { Device, zodUpsertDeviceSchema } from 'puddle-graphql';

interface DeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    deviceId: number;
}

export default function DeviceModal({ isOpen, onClose, onSuccess, deviceId }: DeviceModalProps) {
    const { data, loading, error: getDeviceError } = useQuery(GET_DEVICE, isOpen && deviceId ? { variables: { id: deviceId }, fetchPolicy: 'cache-and-network' } : skipToken);
    const [deleteDevice, { loading: deletePending, error: deleteError, reset: resetDeleteMutation }] = useMutation(DELETE_DEVICE, {
        update(cache, { data }) {
            if (!data?.deleteDevice.valueOf) return;

            cache.modify({
                fields: {
                    devices(existingDevices = [], { readField }) {
                        return existingDevices.filter((d: Device) => {
                            const existingDeviceId = readField('id', d);
                            return existingDeviceId != deviceId;
                        });
                    },
                },
            });
        }
    });
    const [upsertDevice, { loading: updatePending, error: updateError, reset: resetUpsertMutation }] = useMutation(UPSERT_DEVICE, {
        update(cache, { data }) {
            if (deviceId || !data?.upsertDevice) return;

            cache.modify({
                fields: {
                    devices(existingDevices = [], { toReference }) {
                        return [...existingDevices, toReference(data.upsertDevice)];
                    },
                },
            });
        }
    });

    const device = data?.device;

    type DeviceData = z.infer<typeof zodUpsertDeviceSchema>;
    const {
        register,
        handleSubmit,
        control,
        reset,
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
            id: 0,
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

    useEffect(() => {
        resetDeleteMutation();
        resetUpsertMutation();
    }, [isOpen]);

    const onSubmit = async (data: DeviceData) => {
        await upsertDevice({
            variables: {
                input: data
            }
        });
        reset();
        onSuccess();
    };

    const onDelete = async (deviceId: number) => {
        await deleteDevice({
            variables: {
                input: {
                    id: deviceId,
                }
            }
        });
        reset();
        onSuccess();
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title={`${deviceId ? 'Edit' : 'Add'} Device`} alertErrors={[getDeviceError?.message, deleteError?.message, updateError?.message]}>
            <form onSubmit={handleSubmit(onSubmit)} key={deviceId ?? 'new'}>
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
                    <ModalActions isPending={updatePending || deletePending} onClose={onClose} onDelete={deviceId ? () => onDelete(deviceId) : undefined} />
                </fieldset>
            </form>
        </BaseModal>
    );
}