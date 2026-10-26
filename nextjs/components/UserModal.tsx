import BaseModal from './BaseModal';
import { SIGN_UP } from '@/lib/queries';
import { useMutation, } from '@apollo/client/react';
import ModalActions from './ModalActions';
import { InputFieldset } from './InputFieldset';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { zodSignUpInputSchema } from 'puddle-graphql';
import { useEffect } from 'react';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function UserModal({ isOpen, onClose, onSuccess }: UserModalProps) {
    const [signUp, { loading: updatePending, error: updateError, reset: resetUpsertMutation }] = useMutation(SIGN_UP);

    type UserData = z.infer<typeof zodSignUpInputSchema>;
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(zodSignUpInputSchema),
        values: {
            name: '',
            username: '',
            password: '',
            isAdmin: false,
            authPhrase: ''
        }
    });

    useEffect(() => {
        resetUpsertMutation();
        reset();
    }, [isOpen]);

    const onSubmit = async (data: UserData) => {
        await signUp({
            variables: {
                input: data
            }
        });
        onSuccess();
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title='Add User' alertErrors={[updateError?.message]}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <fieldset>
                    <InputFieldset label='Name' error={errors.name} {...register("name")} />
                    <InputFieldset label='Username' error={errors.username} {...register("username")} />
                    <InputFieldset label='Password' type='password' error={errors.password} {...register("password")} />
                    <InputFieldset label='Auth Phrase' type='password' error={errors.authPhrase} {...register("authPhrase")} />
                    <ModalActions isPending={updatePending} onClose={onClose} />
                </fieldset>
            </form>
        </BaseModal>
    );
}