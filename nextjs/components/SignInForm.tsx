'use client';

import { useState } from 'react';
import { SIGN_IN } from '@/lib/queries';
import { useMutation } from '@apollo/client/react';
import { InputFieldset } from './InputFieldset';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { zodSignInInputSchema } from 'puddle-graphql';
import ErrorAlert from './ErrorAlert';
import UserModal from './UserModal';
import { useRouter } from 'next/navigation';
import { CircleCheckBig } from 'lucide-react';

export default function SignInForm() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [wasUserAdded, setWasUserAdded] = useState(false);
    const router = useRouter();

    const [signIn, { loading: signInPending, error: signInError, reset: resetSignInMutation }] = useMutation(SIGN_IN);

    type UserData = z.infer<typeof zodSignInInputSchema>;
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(zodSignInInputSchema),
        values: {
            username: '',
            password: ''
        }
    });

    const onSubmit = async (data: UserData) => {
        await signIn({
            variables: {
                input: data
            }
        });

        reset({
            username: '',
            password: ''
        });

        router.push('/dashboard');
    };

    async function handleAddClick() {
        setIsModalOpen(true);
        setWasUserAdded(false);
    }

    async function handleUserAdded() {
        setIsModalOpen(false);
        setWasUserAdded(true);
    }

    return (
        <>
            {wasUserAdded && <div role="alert" className="alert alert-success my-2">
                <CircleCheckBig className='h-6 w-6' />
                <span>User successfully added!</span>
            </div>}
            <ErrorAlert message={signInError?.message} />
            <form onSubmit={handleSubmit(onSubmit)} onChange={resetSignInMutation}>
                <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4" disabled={signInPending}>
                    <legend className="fieldset-legend">Sign In</legend>

                    <InputFieldset label='Username' error={errors.username} {...register("username")} />
                    <InputFieldset label='Password' type='password' error={errors.password} {...register("password")} />
                    <button type="submit" className={`btn btn-primary ${signInPending ? 'loading' : ''}`}>
                        {signInPending ? 'Signing in...' : 'Sign In'}
                    </button>
                    <button type='button' className='btn btn-soft btn-neutral mt-2' onClick={handleAddClick}>Add User</button>
                </fieldset>
            </form>

            <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleUserAdded} />
        </>
    );
}