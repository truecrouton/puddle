import { useState } from 'react';
import BaseModal from './BaseModal';
import { SET_DEVICE } from '@/lib/queries';
import { useMutation } from '@apollo/client/react';
import ModalActions from './ModalActions';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Control, SetDeviceInput } from 'puddle-graphql';

interface ControlModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    control: Control;
}

function transformState(control: Control) {
    const middleDevices = ['dimmable', 'positionable'];

    if (middleDevices.includes(control.kind) && !isNaN(Number(control.state))) return Number(control.state);
    else if (control.state == control.valueOn) return true;
    else if (control.state == control.valueOff) return false;
    else return 0;
}

export const localInputSchema = z.object({
    deviceId: z.coerce.number().int().nonnegative(),
    kind: z.string(),
    positionableState: z.coerce.number().int().min(0).max(100),
    toggleableState: z.boolean()
});

export default function ControlModal({ isOpen, onClose, onSuccess, control }: ControlModalProps) {
    const [setDevice, { loading: updatePending, error: setError }] = useMutation(SET_DEVICE);

    type DeviceSetData = z.infer<typeof localInputSchema>;
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(localInputSchema),
        values: {
            deviceId: control.deviceId,
            positionableState: transformState(control),
            toggleableState: Boolean(transformState(control)),
            kind: control.kind
        }
    });

    const onSubmit = async (data: DeviceSetData) => {
        const payload: SetDeviceInput = {
            deviceId: data.deviceId,
            state: data.kind == 'toggleable' ? (data.toggleableState ? 1 : 0) : data.positionableState
        };

        await setDevice({
            variables: {
                input: payload
            }
        });
        onSuccess();
        reset(data);
    };

    if (!control) return null;
    else {
        return (
            <BaseModal isOpen={isOpen} onClose={onClose} title={`Control ${control.name}`} alertErrors={[setError?.message]}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <fieldset disabled={updatePending} >
                        <input type="hidden" {...register("deviceId")} />
                        <input type="hidden" {...register("kind")} />
                        <input type="range" min={0} max="100" className={`range w-full ${control.kind == 'toggleable' ? 'hidden' : ''}`} {...register("positionableState")} />
                        <p className="label text-error-content">{errors.positionableState?.message}</p>
                        <input type="checkbox" className={`toggle ${control.kind != 'toggleable' ? 'hidden' : ''}`} {...register("toggleableState")} />
                        <p className="label text-error-content">{errors.toggleableState?.message}</p>
                        <ModalActions isPending={updatePending} onClose={onClose} />
                    </fieldset>
                </form>
            </BaseModal>
        );
    }

}