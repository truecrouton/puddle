import BaseModal from './BaseModal';
import { GET_CONTROLS, SET_DEVICE } from '@/lib/queries';
import { useMutation } from '@apollo/client/react';
import ModalActions from './ModalActions';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Control, zodSetDeviceInputSchema } from 'puddle-graphql';

interface ControlModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    control: Control;
}

function transformState(control: Control): number {
    const gradientDevices = ['dimmable', 'positionable'];

    if (control.state == control.valueOn) return 100;
    else if (control.state == control.valueOff) return 0;
    else if (gradientDevices.includes(control.kind) && !isNaN(Number(control.state))) return Number(control.state);
    else {
        console.info('Device has indeterminable state!');
        return 0;
    };
}

export default function ControlModal({ isOpen, onClose, onSuccess, control }: ControlModalProps) {
    const [setDevice, { loading: updatePending, error: setError }] = useMutation(SET_DEVICE);

    type DeviceSetData = z.infer<typeof zodSetDeviceInputSchema>;
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(zodSetDeviceInputSchema),
        values: {
            id: control.id,
            state: transformState(control),
        }
    });

    const onSubmit = async (data: DeviceSetData) => {
        await setDevice({
            variables: {
                input: {
                    id: data.id,
                    state: control.kind == 'toggleable' ? (data.state > 0 ? 1 : 0) : data.state
                }
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
                        <input type="hidden" {...register("id")} />
                        <div className="w-full">
                            <input className="range w-full" type="range" min={0} max="100" step={control.kind === 'toggleable' ? 100 : 5} {...register("state")} />
                            <RangeTicks kind={control.kind} />
                        </div>
                        <p className="label">{errors.state?.message}</p>
                        <ModalActions isPending={updatePending} onClose={onClose} />
                    </fieldset>
                </form>
            </BaseModal>
        );
    }
}

function RangeTicks({ kind }: { kind: string; }) {
    if (['dimmable', 'positionable'].includes(kind)) return (<>
        <div className="flex justify-between mt-2 text-xs font-mono">
            <span>{(kind === 'positionable') ? 'Closed' : 'Off'}</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>{(kind === 'positionable') ? 'Open' : 'On'}</span>
        </div>
    </>);
    else if (kind === 'toggleable') return (<>
        <div className="flex justify-between px-1 mt-2 text-xs font-mono">
            <span>Off</span>
            <span>On</span>
        </div>
    </>);
}